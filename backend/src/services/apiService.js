// CRUD for wrapped APIs and their per-endpoint pricing. Every query is scoped by
// orgId (from the caller's token) so tenants can only see their own resources.
import { prisma } from '../config/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';

async function ownedApi(orgId, apiId) {
  const api = await prisma.api.findFirst({ where: { id: apiId, orgId } });
  if (!api) throw new HttpError(404, 'API not found');
  return api;
}

export function listApis(orgId) {
  return prisma.api.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { apiKeys: true, endpoints: true } } },
  });
}

export async function getApi(orgId, apiId) {
  await ownedApi(orgId, apiId);
  return prisma.api.findUnique({
    where: { id: apiId },
    include: { endpoints: true },
  });
}

export function createApi(orgId, { name, upstreamBaseUrl }) {
  return prisma.api.create({ data: { orgId, name, upstreamBaseUrl } });
}

export async function updateApi(orgId, apiId, data) {
  await ownedApi(orgId, apiId);
  return prisma.api.update({ where: { id: apiId }, data });
}

export async function deleteApi(orgId, apiId) {
  await ownedApi(orgId, apiId);
  await prisma.api.delete({ where: { id: apiId } }); // cascades to endpoints + keys
}

// --- Endpoints (optional per-endpoint cost granularity) ---

export async function addEndpoint(orgId, apiId, { path, method, costPerCall }) {
  await ownedApi(orgId, apiId);
  return prisma.endpoint.create({
    data: { apiId, path, method: method.toUpperCase(), costPerCall },
  });
}

export async function deleteEndpoint(orgId, apiId, endpointId) {
  await ownedApi(orgId, apiId);
  const endpoint = await prisma.endpoint.findFirst({ where: { id: endpointId, apiId } });
  if (!endpoint) throw new HttpError(404, 'Endpoint not found');
  await prisma.endpoint.delete({ where: { id: endpointId } });
}
