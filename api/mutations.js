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
  if (!token) {
    res.status(500).json({ error: 'Token ontbreekt' });
    return;
  }

  try {
    // Stap 1: sessie aanmaken
 const sessionBody = JSON.stringify({ accessToken: token, source: 'BTicket'});
// debug
res.status(200).json({ tokenLength: token.length, tokenStart: token.substring(0, 4) });
return;
    const sessionRes = await doRequest({
      hostname: 'api.e-boekhouden.nl',
      path: '/v1/session',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(sessionBody)
      }
    }, sessionBody);

    const session = JSON.parse(sessionRes.body);
    const sessionToken = session.sessionToken;

    if (!sessionToken) {
      res.status(500).json({ error: 'Geen sessie token', details: session });
      return;
    }

    // Stap 2: mutaties ophalen
    const mutRes = await doRequest({
      hostname: 'api.e-boekhouden.nl',
      path: '/v1/mutations?limit=100&offset=0',
      method: 'GET',
      headers: {
        'Authorization': sessionToken,
        'Accept': 'application/json'
      }
    }, null);

    res.status(mutRes.status).json(JSON.parse(mutRes.body));

  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
