import { Redis } from 'ioredis';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('[Redis] Connecting to instance...');
});

redis.on('ready', () => {
  logger.info('[Redis] Connected and ready');
});

redis.on('error', (err) => {
  logger.error('[Redis] Connection error:', err);
});

export async function connectRedis(): Promise<void> {
  if (redis.status === 'ready') return;
  await new Promise<void>((resolve, reject) => {
    redis.once('ready', resolve);
    redis.once('error', reject);
  });
}

export async function disconnectRedis(): Promise<void> {
  try {
    await redis.quit();
    logger.info('[Redis] Disconnected safely');
  } catch (error) {
    logger.error('[Redis] Disconnection error:', error);
  }
}
