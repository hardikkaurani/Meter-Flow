// Usage recording for the gateway. CRITICAL: this must never block the response
// path. The gateway calls recordUsage() WITHOUT awaiting it — everything here is
// fire-and-forget. A logging failure degrades metering, never the proxied call.
//
// Three sinks, in order of durability:
//   1. MongoDB usage_logs  — durable raw record, source for Phase 4 aggregation.
//   2. Redis live counters — cheap real-time totals for the dashboard/projected bill.
//   3. Socket.io broadcast — pushes the event to any connected dashboard room.
import { UsageLog } from '../models/UsageLog.js';
import { redis } from '../config/redis.js';
import { emitUsage } from '../sockets/index.js';

// Redis keys for live, current-period counters (reset when billing rolls over).
const liveCountKey = (apiKeyId) => `usage:live:${apiKeyId}:count`;
const liveErrKey = (apiKeyId) => `usage:live:${apiKeyId}:errors`;
const liveLatKey = (apiKeyId) => `usage:live:${apiKeyId}:latency_sum`;

/**
 * Record one proxied request across all sinks. Callers MUST NOT await this.
 * @param {object} event  { apiKeyId, apiId, orgId, endpoint, method, statusCode, latencyMs, responseSize, ip }
 */
export function recordUsage(event) {
  // Kick off all sinks; swallow errors so a bad write never surfaces to the caller.
  Promise.allSettled([writeMongo(event), bumpRedis(event)]).then((results) => {
    for (const r of results) {
      if (r.status === 'rejected') console.error('[usage] sink failed:', r.reason?.message);
    }
  });

  // Real-time push is best-effort and synchronous-ish (no DB), fine to call directly.
  try {
    emitUsage(event.apiKeyId, {
      endpoint: event.endpoint,
      method: event.method,
      statusCode: event.statusCode,
      latencyMs: event.latencyMs,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('[usage] socket emit failed:', err.message);
  }
}

async function writeMongo(event) {
  await UsageLog.create({
    apiKeyId: event.apiKeyId,
    apiId: event.apiId,
    endpoint: event.endpoint,
    method: event.method,
    statusCode: event.statusCode,
    latencyMs: event.latencyMs,
    responseSize: event.responseSize ?? 0,
    ip: event.ip,
    timestamp: new Date(),
  });
}

async function bumpRedis(event) {
  const pipeline = redis.multi();
  pipeline.incr(liveCountKey(event.apiKeyId));
  pipeline.incrby(liveLatKey(event.apiKeyId), Math.round(event.latencyMs));
  if (event.statusCode >= 400) pipeline.incr(liveErrKey(event.apiKeyId));
  await pipeline.exec();
}

// Read live counters for the current period (used by the real-time usage endpoint).
export async function getLiveUsage(apiKeyId) {
  const [count, errors, latencySum] = await redis.mget(
    liveCountKey(apiKeyId),
    liveErrKey(apiKeyId),
    liveLatKey(apiKeyId),
  );
  const total = Number(count ?? 0);
  const errs = Number(errors ?? 0);
  const latSum = Number(latencySum ?? 0);
  return {
    requests: total,
    errors: errs,
    errorRate: total ? errs / total : 0,
    avgLatencyMs: total ? Math.round(latSum / total) : 0,
  };
}

// Reset live counters — called when a billing period rolls over (Phase 4).
export async function resetLiveUsage(apiKeyId) {
  await redis.del(liveCountKey(apiKeyId), liveErrKey(apiKeyId), liveLatKey(apiKeyId));
}
