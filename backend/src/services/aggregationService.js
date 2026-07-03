// Usage aggregation: roll raw Mongo usage_logs up into per-key, per-day counts
// in Postgres. Run periodically by the BullMQ worker (Phase 4). Postgres becomes
// the billable source of truth; Mongo stays the raw, high-volume firehose.
import { UsageLog } from '../models/UsageLog.js';
import { prisma } from '../config/prisma.js';

// Aggregate everything in [since, until) grouped by (apiKeyId, UTC day).
export async function aggregateUsage({ since, until } = {}) {
  // Default window: the last 25 hours, so a daily job always covers yesterday
  // fully even with clock skew or a slightly late run.
  const end = until ?? new Date();
  const start = since ?? new Date(end.getTime() - 25 * 60 * 60 * 1000);

  const groups = await UsageLog.aggregate([
    { $match: { timestamp: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: {
          apiKeyId: '$apiKeyId',
          day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: 'UTC' } },
        },
        requests: { $sum: 1 },
        errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
        totalLatencyMs: { $sum: '$latencyMs' },
      },
    },
  ]);

  // Upsert each group into Postgres. `set` (not increment) makes the job
  // idempotent — re-running over the same window converges to the same totals.
  let upserted = 0;
  for (const g of groups) {
    const date = new Date(`${g._id.day}T00:00:00.000Z`);
    await prisma.usageRollup.upsert({
      where: { apiKeyId_date: { apiKeyId: g._id.apiKeyId, date } },
      create: {
        apiKeyId: g._id.apiKeyId,
        date,
        requests: g.requests,
        errors: g.errors,
        totalLatencyMs: BigInt(Math.round(g.totalLatencyMs)),
      },
      update: {
        requests: g.requests,
        errors: g.errors,
        totalLatencyMs: BigInt(Math.round(g.totalLatencyMs)),
      },
    });
    upserted += 1;
  }

  return { window: { start, end }, groups: groups.length, upserted };
}

// Sum billable requests for a key over a period (from the Postgres rollups).
export async function usageForPeriod(apiKeyId, periodStart, periodEnd) {
  const rows = await prisma.usageRollup.aggregate({
    where: { apiKeyId, date: { gte: periodStart, lt: periodEnd } },
    _sum: { requests: true, errors: true },
  });
  return {
    requests: rows._sum.requests ?? 0,
    errors: rows._sum.errors ?? 0,
  };
}
