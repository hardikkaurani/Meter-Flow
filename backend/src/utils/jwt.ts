// JWT sign/verify for dashboard sessions. Payload carries user id, org id, and role.
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export interface JwtPayload {
  userId: string;
  orgId: string;
  role: string;
  [key: string]: unknown;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}
