// Billing routes: plans, subscriptions, invoices, and the live projected bill.
// All dashboard-authed. Mutations that cost money require admin or higher.
import { Router } from 'express';
import { z } from 'zod';
import * as billingController from '../controllers/billingController.js';
import { validate, asyncHandler } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const planSchema = z.object({
  name: z.string().min(1).max(120),
  pricePerUnit: z.coerce.number().min(0),
  freeTierUnits: z.coerce.number().int().min(0).default(0),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
});

const subscribeSchema = z.object({
  apiKeyId: z.string().min(1),
  planId: z.string().min(1),
});

// Plans
router.get('/plans', asyncHandler(billingController.listPlans));
router.post('/plans', requireRole('admin'), validate({ body: planSchema }), asyncHandler(billingController.createPlan));
router.delete('/plans/:planId', requireRole('admin'), asyncHandler(billingController.deletePlan));

// Subscriptions
router.get('/subscriptions', asyncHandler(billingController.listSubscriptions));
router.post('/subscriptions', requireRole('admin'), validate({ body: subscribeSchema }), asyncHandler(billingController.subscribe));

// Invoices
router.get('/invoices', asyncHandler(billingController.listInvoices));
router.get('/invoices/:invoiceId', asyncHandler(billingController.getInvoice));
router.post('/invoices/generate', requireRole('admin'), asyncHandler(billingController.generateInvoice));

// Live projected bill for a key (real-time)
router.get('/projected/:apiKeyId', asyncHandler(billingController.projected));

export default router;
