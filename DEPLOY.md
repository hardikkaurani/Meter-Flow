# Deploying MeterFlow

**Frontend → Vercel** (static Vite SPA) · **Backend + worker + datastores → Railway**
(long-running Express, Socket.io, BullMQ — none of which fit Vercel's serverless model).

Everything backend-side lives in one Railway **project** so Postgres/Mongo/Redis talk over
Railway's private network — no TLS juggling, and the existing config works unchanged.

```
┌─────────────┐        HTTPS + WSS        ┌──────────────── Railway project ─────────────────┐
│   Vercel    │  ───────────────────────► │  web (Express)   worker (BullMQ)                  │
│  (frontend) │                           │        │               │                          │
└─────────────┘                           │   Postgres   MongoDB   Redis   (Railway plugins)  │
                                          └───────────────────────────────────────────────────┘
```

---

## 1. Push to GitHub

Both Vercel and Railway deploy from a repo. Commit everything (the `prisma/migrations/`
folder **must** be committed — the first deploy runs `prisma migrate deploy` against it).

```bash
git add . && git commit -m "MeterFlow: full build + deploy config"
git push
```

---

## 2. Railway — datastores

1. Create a project at [railway.app](https://railway.app) → **New Project**.
2. Add three databases (**+ New → Database**): **PostgreSQL**, **MongoDB**, **Redis**.
   Railway provisions each with reference variables you'll wire in below.

---

## 3. Railway — backend web service

1. **+ New → GitHub Repo** → pick this repo.
2. Settings → **Root Directory** = `backend` (so Nixpacks builds only the backend).
   `railway.json` there sets the build/start/healthcheck automatically.
3. **Variables** (use Railway's reference syntax so values stay in sync):

   ```
   NODE_ENV=production
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   MONGO_URL=${{MongoDB.MONGO_URL}}
   REDIS_HOST=${{Redis.REDISHOST}}
   REDIS_PORT=${{Redis.REDISPORT}}
   REDIS_PASSWORD=${{Redis.REDISPASSWORD}}
   JWT_SECRET=<run: openssl rand -hex 32>
   API_KEY_PEPPER=<run: openssl rand -hex 32>
   CORS_ORIGIN=https://<your-app>.vercel.app   # fill in after step 5
   ```

   > Don't set `PORT` — Railway injects it and the app already binds to it.
   > Exact plugin names (`MongoDB`, `Redis`) may differ; use whatever Railway shows.

4. Deploy. On boot the web service runs `prisma migrate deploy` (creates all tables)
   then `node src/index.js`. Health check hits `/health`.
5. Settings → **Networking → Generate Domain**. This URL (e.g.
   `https://meterflow-web.up.railway.app`) is your API + Socket.io endpoint.

---

## 4. Railway — worker service (aggregation + billing)

The BullMQ worker is a **second service** off the same repo:

1. **+ New → GitHub Repo** → same repo → Root Directory = `backend`.
2. Settings → **Custom Start Command** = `npm run worker`
   (overrides `railway.json`'s `npm start`; the worker must not run migrations).
3. Add the **same variables** as the web service (Postgres/Mongo/Redis + secrets).
   `JWT_SECRET`/`CORS_ORIGIN` aren't strictly needed here but keep them identical.
4. Deploy. Logs should show `[scheduler] recurring jobs registered`.

---

## 5. Vercel — frontend

1. [vercel.com](https://vercel.com) → **Add New Project** → import this repo.
2. **Root Directory** = `frontend`. Vercel auto-detects Vite; `frontend/vercel.json`
   handles the SPA rewrites so React Router deep links work.
3. **Environment Variables** — point them at the Railway web domain from step 3.5:

   ```
   VITE_API_URL=https://<your-app>.up.railway.app
   VITE_SOCKET_URL=https://<your-app>.up.railway.app
   ```

4. Deploy → you get `https://<your-app>.vercel.app`.

---

## 6. Close the CORS loop

Go back to the Railway **web** service → set `CORS_ORIGIN` to your Vercel URL
(from step 5) and redeploy. Without this the browser blocks API + socket calls.

---

## 7. Smoke test

1. Open the Vercel URL → **Sign up** (creates org + owner).
2. **APIs & Keys** → create an API, upstream `https://pokeapi.co/api/v2` → generate a key.
3. **Playground** → paste the key, `GET pokemon/ditto`, send → proxied response +
   `X-RateLimit-*` headers.
4. **Live Usage** → the request shows up in real time (confirms Socket.io + WSS work).
5. **Billing** → create a plan, subscribe the key, generate an invoice.

---

## Gotchas

- **Migrations must be committed.** `prisma migrate deploy` only *applies* existing
  migrations — it never creates them. The `prisma/migrations/20260101000000_init/`
  folder is already generated and committed; if you change `schema.prisma` later, run
  `npm run prisma:migrate` locally and commit the new migration before pushing.
- **Two services, one repo.** Web and worker are separate Railway services with the
  same root dir and env, differing only in start command. Don't run the worker as a
  thread of the web process — separating them is the whole point (Rule #2: never block
  the response path).
- **Vercel is frontend-only.** Never try to host the Express app or the worker there;
  serverless functions can't hold WebSockets or run BullMQ, and the gateway's
  fire-and-forget logging gets killed when the function freezes after responding.
- **Free tiers sleep.** Railway/Render free plans idle; the first request after idle is
  slow. Fine for a portfolio demo.
