import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/auth.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { UserRole } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authenticateToken(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next(new UnauthorizedError('Access token required'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (_error) {
    return next(new UnauthorizedError('Invalid or expired access token'));
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Insufficient permissions. Role '${req.user.role}' is not authorized for this action`
        )
      );
    }

    next();
  };
}

export function requireOrgAccess(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  const paramOrgId = req.params.orgId;
  if (paramOrgId && paramOrgId !== req.user.orgId) {
    return next(new ForbiddenError('Access denied: Cannot access resources of another organization'));
  }

  next();
}
