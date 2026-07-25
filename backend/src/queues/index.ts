import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export const QUEUE_NAMES = {
  USAGE_INGESTION: 'usage-ingestion',
  USAGE_AGGREGATION: 'usage-aggregation',
  BILLING_INVOICING: 'billing-invoicing',
} as const;

export const usageIngestionQueue = new Queue(QUEUE_NAMES.USAGE_INGESTION, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

export const usageAggregationQueue = new Queue(QUEUE_NAMES.USAGE_AGGREGATION, {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const billingInvoicingQueue = new Queue(QUEUE_NAMES.BILLING_INVOICING, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
  },
});

logger.info('[BullMQ] Initialized queues: usage-ingestion, usage-aggregation, billing-invoicing');
