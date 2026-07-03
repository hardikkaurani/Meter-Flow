// Billing engine. Turns metered usage into invoices.
//
// Pricing model (per subscription):
//   billable = max(0, requests - plan.freeTierUnits)
//   amount   = billable * plan.pricePerUnit
// One invoice per org per period, with one line item per subscribed key.
import { prisma } from '../config/prisma.js';
import { usageForPeriod } from './aggregationService.js';
import { getLiveUsage } from './usageLogger.js';
import { HttpError } from '../middleware/errorHandler.js';

// Round to 2 dp for money (line-item amounts and invoice totals).
const money = (n) => Math.round(n * 100) / 100;

/**
 * Generate an invoice for one org over [periodStart, periodEnd).
 * Aggregates every active subscription's usage from the Postgres rollups.
 */
export async function generateInvoiceForOrg(orgId, periodStart, periodEnd) {
  // Find all subscriptions whose key belongs to an API in this org.
  const subscriptions = await prisma.subscription.findMany({
    where: { apiKey: { api: { orgId } } },
    include: { plan: true, apiKey: true },
  });

  const lineItems = [];
  let total = 0;

  for (const sub of subscriptions) {
    const { requests } = await usageForPeriod(sub.apiKeyId, periodStart, periodEnd);
    const free = sub.plan.freeTierUnits;
    const billable = Math.max(0, requests - free);
    const unitPrice = Number(sub.plan.pricePerUnit);
    const amount = money(billable * unitPrice);

    if (requests === 0) continue; // nothing to bill for this key

    lineItems.push({
      description: `${sub.plan.name} — key ${sub.apiKey.keyPrefix}… (${requests} reqs, ${free} free)`,
      quantity: billable,
      unitPrice,
      amount,
    });
    total += amount;
  }

  total = money(total);

  // Persist invoice + line items atomically.
  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        orgId,
        periodStart,
        periodEnd,
        totalAmount: total,
        status: 'open',
      },
    });
    if (lineItems.length) {
      await tx.invoiceLineItem.createMany({
        data: lineItems.map((li) => ({ ...li, invoiceId: inv.id })),
      });
    }
    return inv;
  });

  return { invoice, lineItemCount: lineItems.length, total };
}

// List an org's invoices (most recent first) with their line items.
export function listInvoices(orgId) {
  return prisma.invoice.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
    include: { lineItems: true },
  });
}

export async function getInvoice(orgId, invoiceId) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, orgId },
    include: { lineItems: true },
  });
  if (!invoice) throw new HttpError(404, 'Invoice not found');
  return invoice;
}

/**
 * Real-time current-period usage + projected bill for one key, straight from the
 * Redis live counters — no waiting on the batch aggregation job.
 */
export async function projectedBill(orgId, apiKeyId) {
  // Ownership check + fetch the active subscription/plan.
  const sub = await prisma.subscription.findFirst({
    where: { apiKeyId, apiKey: { api: { orgId } } },
    include: { plan: true, apiKey: true },
  });
  if (!sub) throw new HttpError(404, 'No subscription found for this key');

  const live = await getLiveUsage(apiKeyId);
  const billable = Math.max(0, live.requests - sub.plan.freeTierUnits);
  const projected = money(billable * Number(sub.plan.pricePerUnit));

  return {
    apiKeyId,
    plan: { name: sub.plan.name, pricePerUnit: Number(sub.plan.pricePerUnit), freeTierUnits: sub.plan.freeTierUnits },
    period: { start: sub.currentPeriodStart, end: sub.currentPeriodEnd },
    usage: live,
    billableUnits: billable,
    projectedAmount: projected,
  };
}
