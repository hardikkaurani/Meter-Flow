// Standalone worker process. Run with `npm run worker`.
// Processes async jobs off the BullMQ queues: usage aggregation, billing, webhooks.
// It connects its own datastore clients (separate process from the API server).
import { Worker } from 'bullmq';
import { bullConnection } from '../config/redis.js';
import { connectPostgres } from '../config/prisma.js';
import { connectMongo } from '../config/mongo.js';
import { connectRedis } from '../config/redis.js';
import { prisma } from '../config/prisma.js';
import { QUEUES } from './index.js';
import { registerSchedules } from './scheduler.js';
import { aggregateUsage } from '../services/aggregationService.js';
import { generateInvoiceForOrg } from '../services/billingService.js';

function makeWorker(name, processor) {
  const worker = new Worker(name, processor, { connection: bullConnection });
  worker.on('completed', (job) => console.log(`[worker:${name}] completed job ${job.id} (${job.name})`));
  worker.on('failed', (job, err) => console.error(`[worker:${name}] failed job ${job?.id}:`, err.message));
  return worker;
}

// --- Usage aggregation: Mongo usage_logs -> Postgres daily rollups -----------
makeWorker(QUEUES.USAGE_AGGREGATION, async (job) => {
  const { since, until } = job.data ?? {};
  const result = await aggregateUsage({
    since: since ? new Date(since) : undefined,
    until: until ? new Date(until) : undefined,
  });
  console.log('[usage-aggregation]', result);
  return result;
});

// --- Billing: generate invoices for every org for the current month ----------
makeWorker(QUEUES.BILLING, async (job) => {
  const now = new Date();
  const periodStart = job.data?.periodStart
    ? new Date(job.data.periodStart)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = job.data?.periodEnd
    ? new Date(job.data.periodEnd)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const orgs = await prisma.organization.findMany({ select: { id: true } });
  const results = [];
  for (const org of orgs) {
    const r = await generateInvoiceForOrg(org.id, periodStart, periodEnd);
    results.push({ orgId: org.id, invoiceId: r.invoice.id, total: r.total });
  }
  console.log('[billing] generated', results.length, 'invoices');
  return results;
});

// --- Webhooks (Phase 6 placeholder) -----------------------------------------
makeWorker(QUEUES.WEBHOOKS, async (job) => {
  console.log('[webhooks] job', job.name, job.data);
});

// Connect datastores, then register recurring schedules.
async function start() {
  await Promise.all([connectPostgres(), connectMongo(), connectRedis()]);
  await registerSchedules();
  console.log('[worker] started, listening on all queues');
}

start().catch((err) => {
  console.error('[worker] failed to start:', err);
  process.exit(1);
});
