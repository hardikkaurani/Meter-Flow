import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { UserController } from '../controllers/userController.js';
import { OrgController } from '../controllers/orgController.js';
import { ApiController } from '../controllers/apiController.js';
import { EndpointController } from '../controllers/endpointController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { UserRole } from '@prisma/client';

const router = Router();

// Health Check Endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'meterflow-backend',
  });
});

// Authentication Routes (Public)
router.post('/auth/signup', AuthController.signup);
router.post('/auth/login', AuthController.login);
router.post('/auth/refresh', AuthController.refreshTokens);
router.post('/auth/logout', AuthController.logout);

// User Profile Routes (Protected)
router.get('/users/me', authenticateToken, AuthController.getCurrentUser);
router.patch('/users/me', authenticateToken, UserController.updateProfile);
router.post('/users/change-password', authenticateToken, UserController.changePassword);

// Organization Management Routes (Protected)
router.get('/organization', authenticateToken, OrgController.getOrganization);
router.patch('/organization', authenticateToken, requireRole(UserRole.owner), OrgController.updateOrganization);
router.post('/organization/invitations', authenticateToken, requireRole(UserRole.owner, UserRole.admin), OrgController.inviteMember);
router.post('/organization/join', authenticateToken, OrgController.joinOrganization);
router.patch('/organization/members/:userId/role', authenticateToken, requireRole(UserRole.owner), OrgController.updateMemberRole);

// API Service Management Routes (Protected + Tenant Isolated)
router.get('/apis', authenticateToken, ApiController.listApis);
router.get('/apis/:apiId', authenticateToken, ApiController.getApiById);
router.post('/apis', authenticateToken, requireRole(UserRole.owner, UserRole.admin), ApiController.createApi);
router.patch('/apis/:apiId', authenticateToken, requireRole(UserRole.owner, UserRole.admin), ApiController.updateApi);
router.post('/apis/:apiId/archive', authenticateToken, requireRole(UserRole.owner, UserRole.admin), ApiController.archiveApi);
router.delete('/apis/:apiId', authenticateToken, requireRole(UserRole.owner), ApiController.deleteApi);

// Endpoint Management Routes (Protected + Tenant Isolated)
router.get('/apis/:apiId/endpoints', authenticateToken, EndpointController.listEndpoints);
router.post('/apis/:apiId/endpoints', authenticateToken, requireRole(UserRole.owner, UserRole.admin), EndpointController.createEndpoint);
router.patch('/apis/:apiId/endpoints/:endpointId', authenticateToken, requireRole(UserRole.owner, UserRole.admin), EndpointController.updateEndpoint);
router.delete('/apis/:apiId/endpoints/:endpointId', authenticateToken, requireRole(UserRole.owner, UserRole.admin), EndpointController.deleteEndpoint);

export default router;
