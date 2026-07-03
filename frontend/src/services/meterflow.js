// Typed-ish wrappers around the MeterFlow dashboard API. Every call returns the
// response body directly so React Query hooks stay terse.
import { api } from './api.js';

const unwrap = (p) => p.then((r) => r.data);

export const authApi = {
  signup: (payload) => unwrap(api.post('/auth/signup', payload)),
  login: (payload) => unwrap(api.post('/auth/login', payload)),
  me: () => unwrap(api.get('/auth/me')),
};

export const orgApi = {
  members: () => unwrap(api.get('/org/members')),
  addMember: (payload) => unwrap(api.post('/org/members', payload)),
  removeMember: (userId) => unwrap(api.delete(`/org/members/${userId}`)),
};

export const apisApi = {
  list: () => unwrap(api.get('/apis')),
  get: (apiId) => unwrap(api.get(`/apis/${apiId}`)),
  create: (payload) => unwrap(api.post('/apis', payload)),
  update: (apiId, payload) => unwrap(api.patch(`/apis/${apiId}`, payload)),
  remove: (apiId) => unwrap(api.delete(`/apis/${apiId}`)),
  addEndpoint: (apiId, payload) => unwrap(api.post(`/apis/${apiId}/endpoints`, payload)),
  removeEndpoint: (apiId, endpointId) => unwrap(api.delete(`/apis/${apiId}/endpoints/${endpointId}`)),
};

export const keysApi = {
  list: (apiId) => unwrap(api.get(`/apis/${apiId}/keys`)),
  create: (apiId, payload) => unwrap(api.post(`/apis/${apiId}/keys`, payload)),
  revoke: (apiId, keyId) => unwrap(api.post(`/apis/${apiId}/keys/${keyId}/revoke`)),
  rotate: (apiId, keyId) => unwrap(api.post(`/apis/${apiId}/keys/${keyId}/rotate`)),
};

export const billingApi = {
  plans: () => unwrap(api.get('/billing/plans')),
  createPlan: (payload) => unwrap(api.post('/billing/plans', payload)),
  deletePlan: (planId) => unwrap(api.delete(`/billing/plans/${planId}`)),
  subscriptions: () => unwrap(api.get('/billing/subscriptions')),
  subscribe: (payload) => unwrap(api.post('/billing/subscriptions', payload)),
  invoices: () => unwrap(api.get('/billing/invoices')),
  generateInvoice: () => unwrap(api.post('/billing/invoices/generate')),
  projected: (apiKeyId) => unwrap(api.get(`/billing/projected/${apiKeyId}`)),
};

// Fire a request through the public gateway (used by the Playground page).
// baseURL points at the same backend; the gateway path is /gw/<path>.
export function callGateway({ rawKey, method, path, body }) {
  const url = `/gw/${path.replace(/^\/+/, '')}`;
  return api.request({
    method,
    url,
    headers: { 'x-api-key': rawKey },
    data: ['GET', 'HEAD'].includes(method) ? undefined : body,
    // Don't throw on 4xx/5xx — the playground wants to show the raw result.
    validateStatus: () => true,
  });
}
