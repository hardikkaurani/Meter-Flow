// HTTP layer for API + endpoint management. orgId always comes from the token.
import * as apiService from '../services/apiService.js';

export async function list(req, res) {
  res.json({ apis: await apiService.listApis(req.auth.orgId) });
}

export async function get(req, res) {
  res.json({ api: await apiService.getApi(req.auth.orgId, req.params.apiId) });
}

export async function create(req, res) {
  res.status(201).json({ api: await apiService.createApi(req.auth.orgId, req.body) });
}

export async function update(req, res) {
  res.json({ api: await apiService.updateApi(req.auth.orgId, req.params.apiId, req.body) });
}

export async function remove(req, res) {
  await apiService.deleteApi(req.auth.orgId, req.params.apiId);
  res.status(204).end();
}

export async function addEndpoint(req, res) {
  res.status(201).json({ endpoint: await apiService.addEndpoint(req.auth.orgId, req.params.apiId, req.body) });
}

export async function removeEndpoint(req, res) {
  await apiService.deleteEndpoint(req.auth.orgId, req.params.apiId, req.params.endpointId);
  res.status(204).end();
}
