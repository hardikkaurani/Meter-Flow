// HTTP layer for plans, subscriptions, invoices, and the live projected bill.
import * as planService from '../services/planService.js';
import * as billingService from '../services/billingService.js';

// ---- Plans ----
export async function listPlans(req, res) {
  res.json({ plans: await planService.listPlans(req.auth.orgId) });
}
export async function createPlan(req, res) {
  res.status(201).json({ plan: await planService.createPlan(req.auth.orgId, req.body) });
}
export async function deletePlan(req, res) {
  await planService.deletePlan(req.auth.orgId, req.params.planId);
  res.status(204).end();
}

// ---- Subscriptions ----
export async function subscribe(req, res) {
  res.status(201).json({ subscription: await planService.subscribeKey(req.auth.orgId, req.body) });
}
export async function listSubscriptions(req, res) {
  res.json({ subscriptions: await planService.listSubscriptions(req.auth.orgId) });
}

// ---- Invoices ----
export async function listInvoices(req, res) {
  res.json({ invoices: await billingService.listInvoices(req.auth.orgId) });
}
export async function getInvoice(req, res) {
  res.json({ invoice: await billingService.getInvoice(req.auth.orgId, req.params.invoiceId) });
}

// Manually trigger invoice generation for the current calendar month (also runs
// automatically via the BullMQ scheduler).
export async function generateInvoice(req, res) {
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const result = await billingService.generateInvoiceForOrg(req.auth.orgId, periodStart, periodEnd);
  res.status(201).json(result);
}

// ---- Live projected bill (real-time, from Redis counters) ----
export async function projected(req, res) {
  res.json(await billingService.projectedBill(req.auth.orgId, req.params.apiKeyId));
}
