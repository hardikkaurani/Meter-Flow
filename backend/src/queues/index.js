// BullMQ queue definitions. Producers import these to enqueue jobs.
// Actual processing lives in src/queues/worker.js (run as a separate process).
import { Queue } from 'bullmq';
import { bullConnection } from '../config/redis.js';

// Queue names are shared between producers and the worker.
export const QUEUES = {
  USAGE_AGGREGATION: 'usage-aggregation',
  BILLING: 'billing',
  WEBHOOKS: 'webhooks',
};

export const usageAggregationQueue = new Queue(QUEUES.USAGE_AGGREGATION, { connection: bullConnection });
export const billingQueue = new Queue(QUEUES.BILLING, { connection: bullConnection });
export const webhooksQueue = new Queue(QUEUES.WEBHOOKS, { connection: bullConnection });

export const allQueues = [usageAggregationQueue, billingQueue, webhooksQueue];
