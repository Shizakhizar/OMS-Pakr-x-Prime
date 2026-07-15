const path = require('path');
const express = require('express');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
const { allowedEmails, isAllowedEmail } = require('./config/auth');
const { JsonWorkspaceRepository } = require('./repositories/jsonWorkspaceRepository');
const { WorkspaceService } = require('./services/workspaceService');
const { createCompanyWorkspaceController } = require('./controllers/companyWorkspaceController');
const { createCompanyWorkspaceRoutes } = require('./routes/companyWorkspaceRoutes');
const { errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();
  const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
  const frontendOrigin = process.env.FRONTEND_ORIGIN || '';
  const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

  const repository = new JsonWorkspaceRepository({
    dataDir: path.join(__dirname, '..', 'data', 'companies'),
  });
  const workspaceService = new WorkspaceService(repository);
  const workspaceController = createCompanyWorkspaceController(workspaceService);

  app.use(
    cors(
      frontendOrigin
        ? {
            origin: frontendOrigin.split(',').map(function (item) {
              return item.trim();
            }),
          }
        : undefined
    )
  );
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', function (req, res) {
    res.json({ ok: true });
  });

  app.get('/api/config', function (req, res) {
    res.json({
      authProvider: 'google',
      googleClientId,
      allowedEmailCount: allowedEmails.size,
      enabledCompanies: ['pakrose'],
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

      if (!isAllowedEmail(email)) {
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

  app.use('/api/v1/companies/:companyId', createCompanyWorkspaceRoutes(workspaceController));

  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
