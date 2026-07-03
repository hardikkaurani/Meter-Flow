// Distributed rate limiting via the TOKEN BUCKET algorithm, executed as an
// atomic Redis Lua script.
//
// Why token bucket (vs fixed/sliding window):
//   - Smooths bursts: a key that's been idle accrues tokens up to `capacity`,
//     so legitimate spikes succeed, while sustained abuse is throttled at the
//     refill rate.
//   - O(1) state per key (just tokens + last-refill timestamp), no per-request
//     log of hits like a true sliding-window log would need.
//
// Why Lua: the read-modify-write (refill, check, decrement) must be atomic across
// concurrent gateway workers. A Lua script runs to completion inside Redis, so
// there's no race between processes sharing the same bucket.
import { redis } from '../config/redis.js';

// KEYS[1] = bucket key
// ARGV[1] = capacity (max tokens = burst size)
// ARGV[2] = refillPerSec (tokens added per second)
// ARGV[3] = nowMs (caller clock, ms)
// ARGV[4] = requested tokens (usually 1)
// returns { allowed(0|1), remainingTokens, retryAfterMs }
const TOKEN_BUCKET_LUA = `
local key       = KEYS[1]
local capacity  = tonumber(ARGV[1])
local refill    = tonumber(ARGV[2])
local now       = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

local state  = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(state[1])
local ts     = tonumber(state[2])

if tokens == nil then
  tokens = capacity
  ts = now
end

-- Refill based on elapsed time, capped at capacity.
local elapsed = math.max(0, now - ts) / 1000.0
tokens = math.min(capacity, tokens + elapsed * refill)

local allowed = 0
local retryAfterMs = 0
if tokens >= requested then
  allowed = 1
  tokens = tokens - requested
else
  -- ms until enough tokens accrue for this request
  retryAfterMs = math.ceil(((requested - tokens) / refill) * 1000)
end

redis.call('HMSET', key, 'tokens', tokens, 'ts', now)
-- Expire idle buckets: time to refill a full bucket + a small margin.
local ttl = math.ceil(capacity / refill) + 10
redis.call('EXPIRE', key, ttl)

return { allowed, math.floor(tokens), retryAfterMs }
`;

// Register the script once; ioredis exposes it as redis.tokenBucket(...).
redis.defineCommand('tokenBucket', { numberOfKeys: 1, lua: TOKEN_BUCKET_LUA });

/**
 * @param {string} apiKeyId  identifies the bucket
 * @param {number} perMin    allowed requests per minute (capacity + refill basis)
 * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number, limit: number }}
 */
export async function consumeToken(apiKeyId, perMin) {
  const capacity = perMin; // allow a full minute's worth as burst
  const refillPerSec = perMin / 60;
  const now = Date.now();

  const [allowed, remaining, retryAfterMs] = await redis.tokenBucket(
    `ratelimit:${apiKeyId}`,
    capacity,
    refillPerSec,
    now,
    1,
  );

  return {
    allowed: allowed === 1,
    remaining,
    retryAfterMs,
    limit: perMin,
  };
}
