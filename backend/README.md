# Backend

This folder is the clean backend home for the OMS project.

Current status:
- `server.js` verifies Google ID tokens with `google-auth-library`
- access is restricted to the allowlisted email accounts
- the frontend must still be configured with a working backend and Google OAuth client

Flow:
1. Frontend signs in with Google
2. Frontend sends the Google ID token to `POST /api/auth/google`
3. Backend verifies the token with Google
4. Backend checks the email allowlist
5. Backend returns access allowed or denied

Environment:

```bash
PORT=4000
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
FRONTEND_ORIGIN=http://127.0.0.1:5500
```

To run after installing dependencies:

```bash
npm install
npm start
```

Google Cloud setup still required:
1. Create a Web OAuth client in Google Cloud Console
2. Add `http://127.0.0.1:5500` and `http://localhost:5500` as authorized JavaScript origins
3. Copy the client ID into `backend/.env`
