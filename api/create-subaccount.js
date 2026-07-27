// This file goes into your PAYMENT BACKEND repo, at this exact path: api/create-subaccount.js
//
// Creates a real Paystack Subaccount for a merchant. Once this exists, checkout can pass this
// subaccount's code into the transaction, and Paystack automatically splits every payment:
// the platform's percentage_charge stays with the main account, and the rest settles directly
// to the merchant's own bank account - no manual payout step needed at all.
//
// percentage_charge is set to match PLATFORM_ORDER_FEE_RATE already used elsewhere in the app
// (1.5%) - this is the percentage that stays with the MAIN account; the merchant automatically
// gets the remaining 98.5% of every online order.

const PLATFORM_PERCENTAGE_CHARGE = 1.5;

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

  const { businessName, bankCode, accountNumber, existingSubaccountCode } = req.body || {};
  if (!businessName || !bankCode || !accountNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // If this merchant already has a subaccount (e.g. they're updating their bank details),
    // update the existing one instead of creating a duplicate.
    const url = existingSubaccountCode
      ? `https://api.paystack.co/subaccount/${existingSubaccountCode}`
      : 'https://api.paystack.co/subaccount';

    const response = await fetch(url, {
      method: existingSubaccountCode ? 'PUT' : 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        business_name: businessName,
        settlement_bank: bankCode,
        account_number: accountNumber,
        percentage_charge: PLATFORM_PERCENTAGE_CHARGE,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.status) {
      return res.status(400).json({ error: 'Could not set up automatic payouts for this account.', detail: data?.message });
    }
    return res.status(200).json({
      subaccountCode: data.data.subaccount_code,
      accountName: data.data.account_name,
    });
  } catch (err) {
    console.error('create-subaccount error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
