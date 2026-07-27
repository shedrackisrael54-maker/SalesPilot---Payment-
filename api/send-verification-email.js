// This file goes into your PAYMENT BACKEND repo (the separate one, not SalesPilot-App),
// at this exact path: api/send-verification-email.js
//
// It reuses the same Resend account/API key your payment backend already uses to send order
// confirmation emails - just add your Resend API key as the RESEND_API_KEY environment
// variable in that Vercel project's settings if it isn't already there, and update the "from"
// address below to match a domain you've verified with Resend.

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

  const { email, code, name } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ error: 'Missing email or code' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SalesPilot <no-reply@yourdomain.com>', // update once your domain/email is ready
        to: [email],
        subject: `${code} is your SalesPilot verification code`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #142A45;">Verify your email</h2>
            <p>Hi ${name || 'there'},</p>
            <p>Use this code to finish creating your SalesPilot account:</p>
            <div style="background: #F0F6FF; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #142A45;">${code}</span>
            </div>
            <p style="color: #6B7280; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend error:', errText);
      return res.status(502).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('send-verification-email error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
