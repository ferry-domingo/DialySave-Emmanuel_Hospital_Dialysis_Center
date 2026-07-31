# DialySAVE production deployment on Render

The application is configured for a single Node.js service: Express serves the
production Vite build, the `/api` routes, and Socket.IO from one public URL.

## Switching modes locally

Run both the Vite frontend and Express backend with live reload:

```powershell
npm run dev
```

Development URLs:

- Application: `http://localhost:5173`
- API: `http://localhost:5000/api`

Run the application exactly like production (build Vite, then serve it through
Express):

```powershell
npm run prod
```

Production-mode URL: `http://localhost:5000`.

Both commands work on Windows, macOS, and Linux. Keep local database and secret
settings in `backend/.env`; `NODE_ENV` is selected automatically by the command.
The shorter `npm run dev` and `npm run prod` commands are aliases for
`npm run mode:dev` and `npm run mode:prod`.

## Required environment variables

- `NODE_ENV=production`
- `MONGO_URI`: your MongoDB Atlas connection string
- `JWT_SECRET`: a long, random secret (at least 32 characters)
- `ADMIN_EMAIL`: initial administrator email

Optional email variables:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`

These variables are required if users need to change and verify their login
email. For Gmail SMTP, use:

- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=your-mailbox@gmail.com`
- `SMTP_PASS=your-16-character-Google-app-password`
- `MAIL_FROM=EHDC <your-mailbox@gmail.com>`

Use a Google App Password, not the mailbox's regular password. Existing Render
services must add these values manually under **Environment**, then save and
redeploy.

`CLIENT_URL` can remain blank for the recommended same-origin deployment. Set it
to the exact frontend URL only when hosting frontend and backend separately.

## Recommended: Render Blueprint

The root `render.yaml` creates one Node Web Service for the React frontend,
Express API, and Socket.IO server.

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint**.
3. Connect the repository and select `render.yaml`.
4. Enter `MONGO_URI` and `ADMIN_EMAIL` when prompted.
5. Apply the Blueprint and wait for `/api/health` to become healthy.

Render generates `JWT_SECRET` automatically. The deployed application is
available at the service's `onrender.com` URL.

## Manual Render settings

- Root directory: repository root
- Runtime: `Node`
- Build command: `npm install --prefix frontend --include=dev && npm run build --prefix frontend && npm install --omit=dev --prefix backend`
- Start command: `npm start`
- Health check path: `/api/health`

Set `NODE_VERSION=20.19.5`. Render provides `PORT` automatically.

## Vercel frontend

The root `vercel.json` deploys the Vite frontend only. In Vercel, leave the Root
Directory at the repository root and remove any Build, Output, and Install
overrides so Vercel uses `vercel.json`.

Deploy the backend as a persistent Node service, then add these variables to the
Vercel project and redeploy:

- `VITE_API_URL=https://your-backend.example.com/api`
- `VITE_SOCKET_URL=https://your-backend.example.com`

On the backend host, set `CLIENT_URL` to the exact Vercel production URL.

## MongoDB Atlas

Create a database user, allow network access from the hosting provider, and put
the Atlas connection string in `MONGO_URI`. Do not upload `backend/.env`.

## Local production check

From the project root:

```powershell
npm run prod
```

Then open `http://localhost:5000`. The health endpoint is
`http://localhost:5000/api/health`.
