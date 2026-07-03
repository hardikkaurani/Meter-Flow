// Auth routes: signup (creates org + owner), login, and the current-user lookup.
import { Router } from 'express';
import { z } from 'zod';
import * as authController from '../controllers/authController.js';
import { validate, asyncHandler } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const signupSchema = z.object({
  orgName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/signup', validate({ body: signupSchema }), asyncHandler(authController.signup));
router.post('/login', validate({ body: loginSchema }), asyncHandler(authController.login));
router.get('/me', requireAuth, asyncHandler(authController.me));

export default router;
