// api/mutations.js — Vercel Serverless Function
// Werkt als proxy tussen de browser en e-boekhouden.nl API

export default async function handler(req, res) {
  // CORS headers zodat de browser de requests mag maken
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // API token uit de environment variable (veilig opgeslagen in Vercel)
  const token = process.env.EBOEKHOUDEN_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'API token niet geconfigureerd op de server.' });
  }

  try {
    const limit = req.query.limit || 100;
    const offset = req.query.offset || 0;

    const response = await fetch(
      `https://api.e-boekhouden.nl/v1/mutations?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'API fout', details: data });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('Proxy fout:', err);
    return res.status(500).json({ error: 'Serverfout: ' + err.message });
  }
}
