// api/mutations.js — Vercel Serverless Function
const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.EBOEKHOUDEN_TOKEN;
  if (!token) return res.status(500).json({ error: 'API token niet geconfigureerd.' });

  const limit = req.query.limit || 100;
  const offset = req.query.offset || 0;

  const options = {
    hostname: 'api.e-boekhouden.nl',
    path: `/v1/mutations?limit=${limit}&offset=${offset}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    }
  };

  try {
    const data = await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => {
          try {
            resolve({ status: response.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ status: response.statusCode, body: body, raw: true });
          }
        });
      });
      request.on('error', reject);
      request.end();
    });

    if (data.raw) {
      return res.status(500).json({ error: 'Onverwacht antwoord van e-boekhouden.nl', raw: data.body });
    }

    if (data.status !== 200) {
      return res.status(data.status).json({ error: 'API fout', details: data.body });
    }

    return res.status(200).json(data.body);

  } catch (err) {
    return res.status(500).json({ error: 'Serverfout: ' + err.message });
  }
};

    console.error('Proxy fout:', err);
    return res.status(500).json({ error: 'Serverfout: ' + err.message });
  }
}
