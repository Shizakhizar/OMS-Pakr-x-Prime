# Backend

This folder is the clean backend home for the OMS project.

Current status:
- `server.js` verifies Google ID tokens with `google-auth-library`
- access is restricted to the allowlisted email accounts
- the frontend must still be configured with a working backend and Google OAuth client
- `Pakrose` uses company workspace APIs
- `Prime Fabric` now has its own dedicated workspace API under `/api/v1/prime-fabric`
- current persistence is still file-based JSON; database setup can be added later as a separate final step

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
ALLOWED_EMAILS=owner@example.com,manager@example.com
```

Copy `backend/.env.example` to `backend/.env` and update it for your server.

To run after installing dependencies:

```bash
npm install
npm start
```

PM2 production run:

```bash
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
```

Google Cloud setup still required:
1. Create a Web OAuth client in Google Cloud Console
2. Add `http://127.0.0.1:5500` and `http://localhost:5500` as authorized JavaScript origins
3. For production, also add your real frontend domain as an authorized JavaScript origin
4. Copy the client ID into `backend/.env`

Production checklist before user launch:
1. Commit all current Prime Fabric backend and frontend files to git
2. Create `backend/.env` from `.env.example`
3. Set real production values for `GOOGLE_CLIENT_ID`, `FRONTEND_ORIGIN`, and `ALLOWED_EMAILS`
4. Install backend dependencies with `npm install`
5. Start backend with PM2 using `pm2 start ecosystem.config.js --env production`
6. Make sure your reverse proxy or hosting points frontend API calls to the backend domain
7. Test login, Prime Fabric projects, attendance, machines, store, and template vault end to end

Deferred final step:
- Replace the current JSON-file storage with a real database such as PostgreSQL
