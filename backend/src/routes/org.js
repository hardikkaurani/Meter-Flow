// Org membership routes. All require auth; mutations require admin or higher.
import { Router } from 'express';
import { z } from 'zod';
import * as orgController from '../controllers/orgController.js';
import { validate, asyncHandler } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const addMemberSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  role: z.enum(['admin', 'viewer']),
});

router.use(requireAuth);

router.get('/members', asyncHandler(orgController.listMembers));
router.post('/members', requireRole('admin'), validate({ body: addMemberSchema }), asyncHandler(orgController.addMember));
router.delete('/members/:userId', requireRole('admin'), asyncHandler(orgController.removeMember));

export default router;
