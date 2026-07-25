import { z } from 'zod';
import { ApiEnvironment, ApiStatus, UserRole } from '@prisma/client';

export const signupSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  orgName: z.string().min(2, 'Organization name must be at least 2 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const createOrgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(UserRole).default(UserRole.viewer),
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export const createApiSchema = z.object({
  name: z.string().min(2, 'API name must be at least 2 characters'),
  description: z.string().optional(),
  upstreamBaseUrl: z.string().url('Upstream Base URL must be a valid URL'),
  environment: z.nativeEnum(ApiEnvironment).default(ApiEnvironment.production),
});

export const updateApiSchema = z.object({
  name: z.string().min(2, 'API name must be at least 2 characters').optional(),
  description: z.string().optional(),
  upstreamBaseUrl: z.string().url('Upstream Base URL must be a valid URL').optional(),
  environment: z.nativeEnum(ApiEnvironment).optional(),
  status: z.nativeEnum(ApiStatus).optional(),
});

export const createEndpointSchema = z.object({
  path: z.string().min(1, 'Path is required').startsWith('/', 'Path must start with /'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']),
  description: z.string().optional(),
  costPerCall: z.number().min(0, 'Cost per call cannot be negative').default(0),
  enabled: z.boolean().default(true),
});

export const updateEndpointSchema = z.object({
  path: z.string().min(1).startsWith('/').optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']).optional(),
  description: z.string().optional(),
  costPerCall: z.number().min(0).optional(),
  enabled: z.boolean().optional(),
});
