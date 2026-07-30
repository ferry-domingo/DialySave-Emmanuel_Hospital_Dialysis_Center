# DialySAVE production deployment

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

## Hosting commands

- Root directory: repository root
- Build command: `npm run build`
- Start command: `npm start`
- Health check path: `/api/health`

The hosting platform must use Node.js 20.19 or newer and provide its port through
the standard `PORT` environment variable.

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
