// API + endpoint + key management routes (dashboard, JWT-guarded).
// Keys are nested under their API: /apis/:apiId/keys.
import { Router } from 'express';
import { z } from 'zod';
import * as apiController from '../controllers/apiController.js';
import * as apiKeyController from '../controllers/apiKeyController.js';
import { validate, asyncHandler } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// ---- schemas ----
const urlSchema = z.string().url().max(2048);

const createApiSchema = z.object({
  name: z.string().min(1).max(120),
  upstreamBaseUrl: urlSchema,
});

const updateApiSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  upstreamBaseUrl: urlSchema.optional(),
});

const endpointSchema = z.object({
  path: z.string().min(1).max(512),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'get', 'post', 'put', 'patch', 'delete']),
  costPerCall: z.coerce.number().min(0).default(0),
});

const createKeySchema = z.object({
  rateLimitPerMin: z.coerce.number().int().min(1).max(100000).default(60),
});

// ---- APIs ----
router.get('/', asyncHandler(apiController.list));
router.post('/', requireRole('admin'), validate({ body: createApiSchema }), asyncHandler(apiController.create));
router.get('/:apiId', asyncHandler(apiController.get));
router.patch('/:apiId', requireRole('admin'), validate({ body: updateApiSchema }), asyncHandler(apiController.update));
router.delete('/:apiId', requireRole('admin'), asyncHandler(apiController.remove));

// ---- Endpoints (per-endpoint pricing) ----
router.post('/:apiId/endpoints', requireRole('admin'), validate({ body: endpointSchema }), asyncHandler(apiController.addEndpoint));
router.delete('/:apiId/endpoints/:endpointId', requireRole('admin'), asyncHandler(apiController.removeEndpoint));

// ---- API keys ----
router.get('/:apiId/keys', asyncHandler(apiKeyController.list));
router.post('/:apiId/keys', requireRole('admin'), validate({ body: createKeySchema }), asyncHandler(apiKeyController.create));
router.post('/:apiId/keys/:keyId/revoke', requireRole('admin'), asyncHandler(apiKeyController.revoke));
router.post('/:apiId/keys/:keyId/rotate', requireRole('admin'), asyncHandler(apiKeyController.rotate));

export default router;
