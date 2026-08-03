// Password hashing for dashboard users (bcrypt). API-consumer keys use sha256
// (see utils/apiKey.ts) — different threat model, different primitive.
import bcrypt from 'bcryptjs';

const ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
