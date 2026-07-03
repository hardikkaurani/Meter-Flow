// Password hashing for dashboard users (bcrypt). API-consumer keys use sha256
// (see utils/apiKey.js) — different threat model, different primitive.
import bcrypt from 'bcryptjs';

const ROUNDS = 10;

export function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
