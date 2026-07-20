export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to, subject, html } = req.body;
  if (!to || !subject || !html) return res.status(400).json({ error: 'Missing to, subject, or html' });

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SalesPilot Store <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(500).json({ sent: false, error: data });
    return res.status(200).json({ sent: true, id: data.id });
  } catch (err) {
    return res.status(500).json({ sent: false, error: 'Send failed' });
  }
}
