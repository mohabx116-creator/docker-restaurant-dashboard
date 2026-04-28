# Restaurant Dashboard Lite

## Backend Deployment

Render backend settings:
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Render environment variables:
- `DATABASE_URL=<RAILWAY_DATABASE_URL_HERE>`
- `JWT_SECRET=<SECURE_RANDOM_SECRET_HERE>`
- `CLIENT_URL=<VITE_FRONTEND_URL_HERE>`
- `PORT=3001`

Vercel frontend environment variable:
- `VITE_API_URL=<BACKEND_PRODUCTION_URL_HERE>`

Railway:
- Use the PostgreSQL `DATABASE_URL` from Railway Variables or the public connection URL.
- Do not commit `DATABASE_URL`.

Local development:
- `docker compose up --build` keeps using the local PostgreSQL container on port `5432`.
- If `DATABASE_URL` is not set, the backend falls back to `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`.
