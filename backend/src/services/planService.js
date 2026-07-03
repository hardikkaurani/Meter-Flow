// Plans and subscriptions. A plan defines pricing (price per unit + free tier);
// subscribing attaches a plan to an API key and opens a billing period.
import { prisma } from '../config/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';

export function listPlans(orgId) {
  return prisma.plan.findMany({ where: { orgId }, orderBy: { name: 'asc' } });
}

export function createPlan(orgId, { name, pricePerUnit, freeTierUnits, billingCycle }) {
  return prisma.plan.create({
    data: { orgId, name, pricePerUnit, freeTierUnits, billingCycle },
  });
}

export async function deletePlan(orgId, planId) {
  const plan = await prisma.plan.findFirst({ where: { id: planId, orgId } });
  if (!plan) throw new HttpError(404, 'Plan not found');
  await prisma.plan.delete({ where: { id: planId } });
}

// Compute a billing period [start, end) from a cycle, anchored at `from`.
function periodFor(billingCycle, from = new Date()) {
  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = new Date(start);
  if (billingCycle === 'yearly') end.setUTCFullYear(end.getUTCFullYear() + 1);
  else end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}

// Subscribe a key to a plan. One active subscription per key: re-subscribing
// replaces the previous one.
export async function subscribeKey(orgId, { apiKeyId, planId }) {
  const [key, plan] = await Promise.all([
    prisma.apiKey.findFirst({ where: { id: apiKeyId, api: { orgId } } }),
    prisma.plan.findFirst({ where: { id: planId, orgId } }),
  ]);
  if (!key) throw new HttpError(404, 'API key not found');
  if (!plan) throw new HttpError(404, 'Plan not found');

  const { start, end } = periodFor(plan.billingCycle);

  return prisma.$transaction(async (tx) => {
    await tx.subscription.deleteMany({ where: { apiKeyId } });
    return tx.subscription.create({
      data: { apiKeyId, planId, currentPeriodStart: start, currentPeriodEnd: end },
      include: { plan: true },
    });
  });
}

export async function listSubscriptions(orgId) {
  return prisma.subscription.findMany({
    where: { apiKey: { api: { orgId } } },
    include: { plan: true, apiKey: { select: { keyPrefix: true, apiId: true } } },
  });
}
