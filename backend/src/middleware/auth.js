// Dashboard auth middleware. Validates the JWT bearer token and attaches the
// caller to req.auth ({ userId, orgId, role }). This guards the *dashboard* API,
// NOT the gateway path — API consumers authenticate with hashed keys instead.
import { verifyToken } from '../utils/jwt.js';
import { HttpError } from './errorHandler.js';

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Missing or malformed Authorization header'));
  }
  try {
    const payload = verifyToken(token);
    req.auth = { userId: payload.sub, orgId: payload.orgId, role: payload.role };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

// Role gate. Ownership hierarchy: owner > admin > viewer.
const RANK = { viewer: 0, admin: 1, owner: 2 };

export function requireRole(minRole) {
  return (req, _res, next) => {
    if (!req.auth) return next(new HttpError(401, 'Not authenticated'));
    if (RANK[req.auth.role] < RANK[minRole]) {
      return next(new HttpError(403, `Requires ${minRole} role or higher`));
    }
    next();
  };
}
