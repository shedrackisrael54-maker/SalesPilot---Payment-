// This file goes into your PAYMENT BACKEND repo, at this exact path: api/list-banks.js
//
// Fetches the live, official list of Nigerian banks (with their correct codes) directly from
// Paystack, instead of using a hardcoded list - bank codes vary between different numbering
// schemes (NIBSS, CBN, Paystack's own), and getting one wrong risks sending a real payout to
// the wrong account. Pulling live from Paystack guarantees the code always matches what
// Paystack itself expects.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://api.paystack.co/bank?country=nigeria&currency=NGN', {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const data = await response.json();
    if (!response.ok || !data.status) {
      return res.status(502).json({ error: 'Could not fetch bank list', detail: data?.message });
    }
    const banks = (data.data || [])
      .filter(b => b.active !== false)
      .map(b => ({ name: b.name, code: b.code }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return res.status(200).json({ banks });
  } catch (err) {
    console.error('list-banks error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
