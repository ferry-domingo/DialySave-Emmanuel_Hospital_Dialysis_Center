# DialySAVE production deployment on Render

The application is configured for a single Node.js service: Express serves the
production Vite build, the `/api` routes, and Socket.IO from one public URL.

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
- Build command: `npm ci --prefix frontend && npm run build --prefix frontend && npm ci --omit=dev --prefix backend`
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
npm run build
$env:NODE_ENV="production"
npm start
```

Then open `http://localhost:5000`. The health endpoint is
`http://localhost:5000/api/health`.
