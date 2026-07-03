// Hot-path API-key validation with a short-lived Redis cache.
//
// The gateway validates a key on every proxied request. Hitting Postgres each
// time would dominate latency, so we cache the resolved key context in Redis
// (keyed by the sha256 hash) for a few minutes. Revoke/rotate explicitly evict
// the entry, so the TTL only bounds staleness for the (rare) direct DB edit.
import { prisma } from '../config/prisma.js';
import { redis } from '../config/redis.js';
import { hashApiKey } from '../utils/apiKey.js';

const TTL_SECONDS = 120;
const cacheKey = (hash) => `apikey:${hash}`;

// Sentinel cached for unknown/invalid keys to avoid hammering Postgres with
// repeated lookups of the same bad key (negative caching).
const MISS = '__miss__';

// Resolve a raw key -> { apiKeyId, apiId, orgId, status, rateLimitPerMin, upstreamBaseUrl }
// or null if the key is unknown or revoked. Reads Redis first, falls back to Postgres.
export async function resolveApiKey(rawKey) {
  const hash = hashApiKey(rawKey);
  const key = cacheKey(hash);

  const cached = await redis.get(key);
  if (cached === MISS) return null;
  if (cached) return JSON.parse(cached);

  const record = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    include: { api: true },
  });

  if (!record || record.status !== 'active') {
    await redis.set(key, MISS, 'EX', 30); // brief negative cache
    return null;
  }

  const context = {
    apiKeyId: record.id,
    apiId: record.apiId,
    orgId: record.api.orgId,
    status: record.status,
    rateLimitPerMin: record.rateLimitPerMin,
    upstreamBaseUrl: record.api.upstreamBaseUrl,
  };
  await redis.set(key, JSON.stringify(context), 'EX', TTL_SECONDS);
  return context;
}

export async function invalidateKeyCache(keyHash) {
  await redis.del(cacheKey(keyHash));
}
