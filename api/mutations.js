const https = require('https');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const token = process.env.EBOEKHOUDEN_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'Token ontbreekt' });
    return;
  }

  const options = {
    hostname: 'api.e-boekhouden.nl',
    path: '/v1/mutations?limit=100&offset=0',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/json',
      'X-Source': 'BoekTicket'
    }
  };

  const request = https.request(options, function(response) {
    var body = '';
    response.on('data', function(chunk) { body += chunk; });
    response.on('end', function() {
      res.setHeader('Content-Type', 'application/json');
      if (!body || body.trim() === '') {
        res.status(500).json({ error: 'Leeg antwoord', statusCode: response.statusCode, headers: response.headers });
        return;
      }
      try {
        res.status(response.statusCode).json(JSON.parse(body));
      } catch(e) {
        res.status(500).json({ error: 'Parse fout', raw: body.substring(0, 500) });
      }
    });
  });

  request.on('error', function(err) {
    res.status(500).json({ error: err.message });
  });

  request.end();
};
