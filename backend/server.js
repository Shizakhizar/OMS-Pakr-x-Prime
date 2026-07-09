require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const port = process.env.PORT || 4000;
const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const frontendOrigin = process.env.FRONTEND_ORIGIN || '';
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

const allowedEmails = new Set([
  'shizakhizarf22@nutech.edu.pk',
  'shizakhizar20@gmail.com',
]);

app.use(
  cors(
    frontendOrigin
      ? {
          origin: frontendOrigin,
        }
      : undefined
  )
);
app.use(express.json());

app.get('/api/health', function (req, res) {
  res.json({ ok: true });
});

app.get('/api/config', function (req, res) {
  res.json({
    authProvider: 'google',
    googleClientId,
    allowedEmailCount: allowedEmails.size,
  });
});

app.post('/api/auth/google', async function (req, res) {
  const credential = req.body.credential;

  if (!googleClientId || !googleClient) {
    return res
      .status(500)
      .json({ ok: false, message: 'Google auth is not configured on the server.' });
  }

  if (!credential) {
    return res.status(400).json({ ok: false, message: 'Google credential is required.' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    const email = ((payload && payload.email) || '').trim().toLowerCase();
    const emailVerified = Boolean(payload && payload.email_verified);

    if (!email || !emailVerified) {
      return res
        .status(403)
        .json({ ok: false, message: 'Google account email is missing or not verified.' });
    }

    if (!allowedEmails.has(email)) {
      return res.status(403).json({ ok: false, message: 'No access for this Google account.' });
    }

    return res.json({
      ok: true,
      email,
      name: payload.name || '',
      picture: payload.picture || '',
      message: 'Google account verified and access granted.',
    });
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: 'Google token verification failed.',
    });
  }
});

app.listen(port, function () {
  console.log(`OMS backend listening on http://localhost:${port}`);
});
