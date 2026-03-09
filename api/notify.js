module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { naam, email, tijdstip } = req.body;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'RESEND_API_KEY ontbreekt' }); return; }

  const htmlBody = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0e0f13;color:#e8eaf0;padding:32px;border-radius:12px;">
      <div style="font-size:22px;font-weight:800;margin-bottom:4px;">Boek<span style="color:#4fffb0">Ticket</span></div>
      <div style="font-size:12px;color:#6b7080;margin-bottom:24px;">Inlogmelding</div>
      <div style="background:#16181f;border:1px solid #2a2d38;border-radius:8px;padding:20px;margin-bottom:16px;">
        <div style="font-size:13px;color:#6b7080;margin-bottom:4px;">Gebruiker</div>
        <div style="font-size:16px;font-weight:600;">${naam || email}</div>
        <div style="font-size:12px;color:#6b7080;">${email}</div>
      </div>
      <div style="background:#16181f;border:1px solid #2a2d38;border-radius:8px;padding:20px;">
        <div style="font-size:13px;color:#6b7080;margin-bottom:4px;">Tijdstip</div>
        <div style="font-size:15px;">${tijdstip}</div>
      </div>
      <div style="margin-top:24px;font-size:11px;color:#6b7080;">Dit is een automatische melding van BoekTicket.</div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'BoekTicket <info@vannieff.nl>',
        to: ['danny@vannieff.nl'],
        subject: '🔔 ' + (naam || email) + ' heeft ingelogd op BoekTicket',
        html: htmlBody
      })
    });
    const data = await response.json();
    if (!response.ok) { res.status(500).json({ error: data }); return; }
    res.status(200).json({ ok: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
