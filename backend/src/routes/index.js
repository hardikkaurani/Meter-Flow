// Root router. Mounts every feature area.
//
//   /health*     liveness/readiness
//   /gw/*        THE GATEWAY — public, API-key auth (Phase 3)
//   /auth/*      signup/login/me (Phase 1)
//   /org/*       membership (Phase 1)
//   /apis/*      API + endpoint + key management (Phase 2)
//   /billing/*   plans, subscriptions, invoices, projected bill (Phase 4)
import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { redis } from '../config/redis.js';
import { mongoose } from '../config/mongo.js';

import authRoutes from './auth.js';
import orgRoutes from './org.js';
import apiRoutes from './apis.js';
import billingRoutes from './billing.js';
import gatewayRoutes from './gateway.js';

const router = Router();

// Liveness: is the process up?
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'meterflow-backend' });
});

// Readiness: are all datastores reachable?
router.get('/health/ready', async (_req, res) => {
  const checks = { postgres: false, mongo: false, redis: false };
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.postgres = true;
  } catch { /* leave false */ }
  checks.mongo = mongoose.connection.readyState === 1;
  try {
    checks.redis = (await redis.ping()) === 'PONG';
  } catch { /* leave false */ }

  const ready = Object.values(checks).every(Boolean);
  res.status(ready ? 200 : 503).json({ ready, checks });
});

// The gateway is mounted first and kept deliberately separate from the JWT-guarded
// dashboard API — it's the public, high-traffic path with its own auth model.
router.use('/gw', gatewayRoutes);

// Dashboard API (JWT-guarded inside each router).
router.use('/auth', authRoutes);
router.use('/org', orgRoutes);
router.use('/apis', apiRoutes);
router.use('/billing', billingRoutes);

export default router;
