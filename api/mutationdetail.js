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
  const token = process.env.EBOEKHOUDEN_TOKEN;
  if (!token) { res.status(500).json({ error: 'Token ontbreekt' }); return; }
  const id = parseInt(req.query.id);
  if (!id) { res.status(400).json({ error: 'id parameter vereist' }); return; }
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

    // Haal mutatie detail op
    const detailRes = await doRequest({
      hostname: 'api.e-boekhouden.nl',
      path: '/v1/mutation/' + id,
      method: 'GET',
      headers: authHeaders
    }, null);
    const detail = JSON.parse(detailRes.body);

    // Haal relatienaam op als er een relationId is
    if (detail.relationId) {
      try {
        const relatieRes = await doRequest({
          hostname: 'api.e-boekhouden.nl',
          path: '/v1/relation/' + detail.relationId,
          method: 'GET',
          headers: authHeaders
        }, null);
        const relatie = JSON.parse(relatieRes.body);
        detail.relatieNaam = relatie.name || '';
        detail.relatie = relatie;
      } catch(e) {
        detail.relatieNaam = '';
        detail.relatie = null;
      }
    } else {
      detail.relatieNaam = '';
    }

    res.status(detailRes.status).json(detail);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
