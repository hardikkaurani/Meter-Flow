# MeterFlow

Usage-Based API Billing Platform — an API gateway + metering + billing engine.

Wrap third-party APIs, hand out API keys, meter every call, enforce rate limits, and bill
consumers on metered usage (pay-per-call or tiered).

## Stack

| Concern            | Choice                                             |
| ------------------ | -------------------------------------------------- |
| Frontend           | React (Vite) + Tailwind + React Query + Zustand    |
| Backend            | Node.js + Express (ESM)                             |
| Transactional DB   | PostgreSQL via **Prisma**                           |
| Log store          | MongoDB via Mongoose (raw usage logs, high write)  |
| Cache / rate limit | Redis (**token-bucket**, atomic Lua)               |
| Queue              | BullMQ (aggregation, billing, webhooks)            |
| Realtime           | Socket.io (live usage dashboard)                   |
| Auth               | JWT (dashboard) + hashed API keys (consumers)      |

## Repository layout

```
Meter-Flow-main/
├── docker-compose.yml      # Postgres + Mongo + Redis (datastores only)
├── backend/                # Express API, gateway, queues, sockets
└── frontend/               # Vite React dashboard
```

## Quick start

```bash
# 1. Start datastores
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run prisma:generate     # generate Prisma client
npm run prisma:migrate      # create tables (first run)
npm run dev                 # http://localhost:4000/health

# 3. Frontend (separate terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

## Build phases

- **Phase 0 — Scaffolding** ✅ (current)
- **Phase 0 — Scaffolding** ✅
- **Phase 1 — Auth & org management** ✅
- **Phase 2 — API & API-key management (CRUD)** ✅
- **Phase 3 — The gateway (proxy + rate limit + metering)** ✅ ← core USP
- **Phase 4 — Usage aggregation & billing engine** ✅
- **Phase 5 — Dashboard (frontend)** ✅
- Phase 6 — Optional (Stripe, webhooks, audit logs)

## Running the worker

Aggregation + billing run in a **separate process** (BullMQ). In a third terminal:

```bash
cd backend
npm run worker      # processes usage-aggregation, billing, webhooks queues
```

It registers two recurring schedules on boot: usage aggregation every 5 min, and
monthly invoice generation at 00:10 UTC on the 1st.

## How the gateway works (the core)

Consumers call `http://localhost:4000/gw/<upstream-path>` with an `x-api-key`
header. Each request runs through `backend/src/gateway/gatewayHandler.js`:

1. **Authenticate** — resolve the key via a Redis-cached lookup (`apiKeyCache.js`).
2. **Rate limit** — atomic Redis token bucket Lua script (`rateLimiter.js`); 429 if empty.
3. **Proxy** — forward method/path/body/headers to the API's `upstreamBaseUrl`.
4. **Meter** — fire-and-forget usage log to Mongo + Redis live counters + Socket.io
   broadcast (`usageLogger.js`). **Never awaited** — logging can't add latency.
5. **Respond** — stream the upstream response back plus `X-RateLimit-*` headers.

### Try it end-to-end

1. Sign up in the dashboard (`http://localhost:5173`) → creates org + owner.
2. **APIs & Keys** → create an API, e.g. upstream `https://pokeapi.co/api/v2`.
3. Generate a key — copy the raw `mf_…` value shown once.
4. **Playground** → paste the key, `GET pokemon/ditto`, send. You'll see the proxied
   response + rate-limit headers.
5. **Live Usage** → watch the request appear in real time via Socket.io.
6. **Billing** → create a plan, subscribe the key, then generate an invoice.

## API surface

| Area     | Endpoints |
| -------- | --------- |
| Auth     | `POST /auth/signup`, `POST /auth/login`, `GET /auth/me` |
| Org      | `GET/POST /org/members`, `DELETE /org/members/:userId` |
| APIs     | `GET/POST /apis`, `GET/PATCH/DELETE /apis/:apiId`, `.../endpoints` |
| Keys     | `GET/POST /apis/:apiId/keys`, `.../:keyId/revoke`, `.../:keyId/rotate` |
| Billing  | `GET/POST /billing/plans`, `/subscriptions`, `/invoices`, `POST /billing/invoices/generate`, `GET /billing/projected/:apiKeyId` |
| Gateway  | `ALL /gw/*` (public, `x-api-key` auth) |

## Design notes

- **Postgres = truth** for orgs/keys/plans/invoices; **Mongo = raw logs**; **Redis =
  fast path only** (rate buckets, key cache, live counters). Billable quantities are
  aggregated Mongo → Postgres so invoices never depend on ephemeral state.
- **Keys are sha256(raw + pepper)** — the raw key is returned exactly once and never
  stored. Fast hash (not bcrypt) because the gateway validates on the hot path and the
  key is already 256-bit high-entropy.
- **Token bucket over fixed window** — smooths bursts, O(1) state per key, atomic via Lua.
