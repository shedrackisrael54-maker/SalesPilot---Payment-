// This file goes into your PAYMENT BACKEND repo, at this exact path: api/send-push-notification.js
//
// Actually delivers a real phone notification (into the notification tray, even with the app
// closed) using Firebase Cloud Messaging. This needs a Firebase service account, a real
// credential you generate once:
//
//   1. Firebase Console -> Project Settings -> Service Accounts
//   2. Click "Generate new private key" - this downloads a JSON file
//   3. In this Vercel project's Environment Variables, add a variable called
//      FIREBASE_SERVICE_ACCOUNT, and paste the ENTIRE contents of that JSON file as its value
//   4. Also add "firebase-admin" to this repo's package.json dependencies
//
// Without that service account set up, this endpoint will fail safely (the app just won't be
// able to send pushes yet) - nothing else breaks.

import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (err) {
    console.error('Firebase admin init failed - check FIREBASE_SERVICE_ACCOUNT env var:', err);
  }
}

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

  const { tokens, title, body } = req.body || {};
  if (!tokens || !Array.isArray(tokens) || tokens.length === 0 || !title) {
    return res.status(400).json({ error: 'Missing tokens or title' });
  }

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body: body || '' },
    });
    return res.status(200).json({
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (err) {
    console.error('send-push-notification error:', err);
    return res.status(500).json({ error: 'Could not send notification' });
  }
}
