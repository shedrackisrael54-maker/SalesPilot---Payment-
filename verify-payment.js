export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reference } = req.body;
  if (!reference) return res.status(400).json({ error: 'No reference provided' });

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    const data = await response.json();

    if (data.status && data.data?.status === 'success') {
      return res.status(200).json({ verified: true, amount: data.data.amount, currency: data.data.currency });
    }
    return res.status(200).json({ verified: false });
  } catch (err) {
    return res.status(500).json({ verified: false, error: 'Verification failed' });
  }
}
