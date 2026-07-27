// This file goes into your PAYMENT BACKEND repo, at this exact path: api/resolve-account.js
//
// Verifies that an account number actually belongs to the name the merchant typed, BEFORE a
// subaccount is created - Paystack's own documentation is explicit that this check matters:
// "Please endeavor to verify that the account name matches what you intended. Paystack will
// not be liable for payouts to the wrong bank account." This is the safety check that catches
// a typo'd account number before any real money is ever at risk.

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

  const { accountNumber, bankCode } = req.body || {};
  if (!accountNumber || !bankCode) {
    return res.status(400).json({ error: 'Missing account number or bank code' });
  }

  try {
    const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const data = await response.json();
    if (!response.ok || !data.status) {
      return res.status(400).json({ error: 'Could not verify this account. Please double check the account number and bank.', detail: data?.message });
    }
    return res.status(200).json({ accountName: data.data.account_name, accountNumber: data.data.account_number });
  } catch (err) {
    console.error('resolve-account error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
