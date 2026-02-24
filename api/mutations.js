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
      'Accept': 'application/json'
    }
  };

  const request = https.request(options, function(response) {
    var body = '';
    response.on('data', function(chunk) { body += chunk; });
    response.on('end', function() {
      try {
        res.status(200).json(JSON.parse(body));
      } catch(e) {
        res.status(500).json({ error: 'Parse fout', raw: body });
      }
    });
  });

  request.on('error', function(err) {
    res.status(500).json({ error: err.message });
  });

  request.end();
};
