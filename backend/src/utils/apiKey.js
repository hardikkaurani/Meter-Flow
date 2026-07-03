// API-key generation and hashing for API *consumers* (not dashboard users).
//
// Security model:
//   - The raw key is shown to the user exactly ONCE, at creation time.
//   - We persist only sha256(rawKey + pepper). A DB leak never exposes usable keys.
//   - sha256 (not bcrypt) because the gateway validates keys on the hot path and
//     must be fast; the key itself is high-entropy (256 bits), so brute force is
//     infeasible without the slow-hash protection bcrypt gives low-entropy passwords.
//   - A short, non-secret prefix is stored in the clear so the UI can label keys.
import crypto from 'node:crypto';
import { config } from '../config/index.js';

const PREFIX = 'mf'; // MeterFlow — makes keys recognizable in logs/UI.

export function generateApiKey() {
  const random = crypto.randomBytes(24).toString('base64url'); // 32 chars, url-safe
  const raw = `${PREFIX}_${random}`;
  return {
    raw, // return to caller once, never stored
    hash: hashApiKey(raw),
    prefix: raw.slice(0, 10), // e.g. "mf_A1b2C3d" — safe to display
  };
}

export function hashApiKey(raw) {
  return crypto.createHash('sha256').update(raw + config.apiKeyPepper).digest('hex');
}
