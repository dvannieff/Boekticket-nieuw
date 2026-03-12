const https = require('https');

function doRequest(options, body) {
  return new Promise(function(resolve, reject) {
    const req = https.request(options, function(res) {
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() { resolve({ status: res.statusCode, body: data }); });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const token = process.env.EBOEKHOUDEN_TOKEN;
  if (!token) { res.status(500).json({ error: 'Token ontbreekt' }); return; }
  try {
    const sessionBody = JSON.stringify({ accessToken: token, source: 'BTicket' });
    const sessionRes = await doRequest({
      hostname: 'api.e-boekhouden.nl',
      path: '/v1/session',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(sessionBody) }
    }, sessionBody);
    const session = JSON.parse(sessionRes.body);
    const sessionToken = session.token;
    if (!sessionToken) { res.status(500).json({ error: 'Geen sessie token', details: session }); return; }
    const authHeaders = { 'Authorization': sessionToken, 'Accept': 'application/json' };

    // Laad grootboekrekeningen
    const ledgerRes = await doRequest({
      hostname: 'api.e-boekhouden.nl',
      path: '/v1/ledger?limit=2000&offset=0',
      method: 'GET',
      headers: authHeaders
    }, null);
    const ledgerData = JSON.parse(ledgerRes.body);
    const ledgers = ledgerData.items || ledgerData || [];
    const ledgerMap = {};
    ledgers.forEach(function(l) {
      ledgerMap[l.id] = {
        code: l.code || String(l.id),
        omschrijving: l.description || l.name || l.omschrijving || ''
      };
    });

    // Laad relaties
    const relatieRes = await doRequest({
      hostname: 'api.e-boekhouden.nl',
      path: '/v1/relation?limit=500&offset=0',
      method: 'GET',
      headers: authHeaders
    }, null);
    const relatieData = JSON.parse(relatieRes.body);
    const relaties = relatieData.items || relatieData || [];
    const relatieMap = {};
    relaties.forEach(function(r) {
      relatieMap[r.id] = r.name || '';
    });

    // Laad mutaties
    const mutRes = await doRequest({
      hostname: 'api.e-boekhouden.nl',
      path: '/v1/mutation?limit=500&offset=0',
      method: 'GET',
      headers: authHeaders
    }, null);
    const mutData = JSON.parse(mutRes.body);
    const items = Array.isArray(mutData) ? mutData : (mutData.items || mutData.mutations || []);
    items.forEach(function(m) {
      var ledger = ledgerMap[m.ledgerId] || {};
      m.ledgerCode = ledger.code || String(m.ledgerId || '');
      m.ledgerOmschrijving = ledger.omschrijving || '';
      m.relatieNaam = m.relationId ? (relatieMap[m.relationId] || '') : '';
    });

    const gefilterd = items.filter(function(m) {
      if (!req.query.dateFrom && !req.query.dateTo) return true;
      var datum = (m.date || '').substring(0, 10);
      if (req.query.dateFrom && datum < req.query.dateFrom) return false;
      if (req.query.dateTo && datum > req.query.dateTo) return false;
      return true;
    });
    res.status(200).json({ items: gefilterd, ledgerMap: ledgerMap, relatieMap: relatieMap });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
