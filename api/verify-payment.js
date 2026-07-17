export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ status: false, message: 'Method not allowed' });
  }

  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({ status: false, message: 'Missing transaction reference' });
  }

  try {
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await paystackRes.json();

    if (!data.status) {
      return res.status(400).json({ status: false, message: data.message || 'Verification failed' });
    }

    const verified = data.data.status === 'success';

    return res.status(200).json({
      status: verified,
      amount: data.data.amount / 100,
      reference: data.data.reference,
      currency: data.data.currency,
      customerEmail: data.data.customer?.email || null,
      paidAt: data.data.paid_at,
    });
  } catch (err) {
    console.error('Paystack verify error:', err);
    return res.status(500).json({ status: false, message: 'Server error verifying payment' });
  }
}
