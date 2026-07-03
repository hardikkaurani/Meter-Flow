// API-key lifecycle: issue, list, revoke, rotate. The raw key crosses this
// boundary exactly once (on create/rotate) and is never persisted.
import { prisma } from '../config/prisma.js';
import { generateApiKey } from '../utils/apiKey.js';
import { invalidateKeyCache } from './apiKeyCache.js';
import { HttpError } from '../middleware/errorHandler.js';

async function ownedApi(orgId, apiId) {
  const api = await prisma.api.findFirst({ where: { id: apiId, orgId } });
  if (!api) throw new HttpError(404, 'API not found');
  return api;
}

// Public shape — never leaks keyHash.
function publicKey(k) {
  return {
    id: k.id,
    apiId: k.apiId,
    keyPrefix: k.keyPrefix,
    status: k.status,
    rateLimitPerMin: k.rateLimitPerMin,
    createdAt: k.createdAt,
    revokedAt: k.revokedAt,
  };
}

export async function listKeys(orgId, apiId) {
  await ownedApi(orgId, apiId);
  const keys = await prisma.apiKey.findMany({ where: { apiId }, orderBy: { createdAt: 'desc' } });
  return keys.map(publicKey);
}

export async function createKey(orgId, apiId, { rateLimitPerMin }) {
  await ownedApi(orgId, apiId);
  const { raw, hash, prefix } = generateApiKey();
  const key = await prisma.apiKey.create({
    data: { apiId, keyHash: hash, keyPrefix: prefix, rateLimitPerMin },
  });
  // Return the raw key ONCE alongside the stored metadata.
  return { key: publicKey(key), rawKey: raw };
}

export async function revokeKey(orgId, apiId, keyId) {
  await ownedApi(orgId, apiId);
  const key = await prisma.apiKey.findFirst({ where: { id: keyId, apiId } });
  if (!key) throw new HttpError(404, 'Key not found');

  const updated = await prisma.apiKey.update({
    where: { id: keyId },
    data: { status: 'revoked', revokedAt: new Date() },
  });
  await invalidateKeyCache(key.keyHash); // eject from the gateway's hot cache immediately
  return publicKey(updated);
}

// Rotate = revoke the old key and mint a fresh one carrying the same settings.
export async function rotateKey(orgId, apiId, keyId) {
  await ownedApi(orgId, apiId);
  const old = await prisma.apiKey.findFirst({ where: { id: keyId, apiId } });
  if (!old) throw new HttpError(404, 'Key not found');

  const { raw, hash, prefix } = generateApiKey();
  const result = await prisma.$transaction(async (tx) => {
    await tx.apiKey.update({
      where: { id: keyId },
      data: { status: 'revoked', revokedAt: new Date() },
    });
    return tx.apiKey.create({
      data: { apiId, keyHash: hash, keyPrefix: prefix, rateLimitPerMin: old.rateLimitPerMin },
    });
  });

  await invalidateKeyCache(old.keyHash);
  return { key: publicKey(result), rawKey: raw };
}
