export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  orgId: string;
  role: 'owner' | 'admin' | 'viewer';
}

export interface ApiKey {
  id: string;
  apiId: string;
  keyPrefix: string;
  status: 'active' | 'revoked';
  rateLimitPerMin: number;
  createdAt: string;
}

export interface UsageSummary {
  totalRequests: number;
  totalErrors: number;
  averageLatencyMs: number;
  totalCost: number;
}
