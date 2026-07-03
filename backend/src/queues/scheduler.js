// Recurring job schedules (BullMQ repeatable jobs). Registered once by the worker
// on startup; BullMQ dedupes by jobId so restarts don't stack duplicates.
import { usageAggregationQueue, billingQueue } from './index.js';

export async function registerSchedules() {
  // Aggregate raw usage into Postgres rollups every 5 minutes so the dashboard's
  // historical view and billing totals stay fresh without waiting a full day.
  await usageAggregationQueue.add(
    'aggregate',
    {},
    {
      jobId: 'aggregate-recurring',
      repeat: { every: 5 * 60 * 1000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  );

  // Generate invoices monthly, at 00:10 UTC on the 1st.
  await billingQueue.add(
    'monthly-invoices',
    {},
    {
      jobId: 'billing-monthly',
      repeat: { pattern: '10 0 1 * *', tz: 'UTC' },
      removeOnComplete: 50,
      removeOnFail: 50,
    },
  );

  console.log('[scheduler] recurring jobs registered');
}
