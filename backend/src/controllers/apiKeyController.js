// HTTP layer for API-key management. Raw keys are returned only on create/rotate.
import * as apiKeyService from '../services/apiKeyService.js';

export async function list(req, res) {
  res.json({ keys: await apiKeyService.listKeys(req.auth.orgId, req.params.apiId) });
}

export async function create(req, res) {
  const result = await apiKeyService.createKey(req.auth.orgId, req.params.apiId, req.body);
  // `rawKey` is shown once — the client must store it now; we never return it again.
  res.status(201).json(result);
}

export async function revoke(req, res) {
  res.json({ key: await apiKeyService.revokeKey(req.auth.orgId, req.params.apiId, req.params.keyId) });
}

export async function rotate(req, res) {
  res.json(await apiKeyService.rotateKey(req.auth.orgId, req.params.apiId, req.params.keyId));
}
