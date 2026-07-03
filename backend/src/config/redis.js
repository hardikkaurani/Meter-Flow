// Redis = ephemeral fast path: rate-limit buckets, API-key cache, live counters.
// BullMQ requires `maxRetriesPerRequest: null` on its connection, so we expose a
// factory and keep a shared general-purpose client separate from queue clients.
import IORedis from 'ioredis';
import { config } from './index.js';

export function createRedis(overrides = {}) {
  return new IORedis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    ...overrides,
  });
}

// Shared client for app-level use (cache, counters, rate limiting).
export const redis = createRedis();

// BullMQ-compatible connection options (queues create their own clients from these).
export const bullConnection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
};

export async function connectRedis() {
  // ioredis connects lazily; issue a ping to fail fast on startup.
  await redis.ping();
  console.log('[redis] connected');
}

export async function disconnectRedis() {
  await redis.quit();
}
