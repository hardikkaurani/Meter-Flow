// JWT sign/verify for dashboard sessions. Payload carries just enough to avoid
// a DB round-trip on every request: user id, org id, and role.
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export function signToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}
