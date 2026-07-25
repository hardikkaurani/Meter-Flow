import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient.js';
import { UsageSummary } from '../types/index.js';

export function useUsageSummary(orgId: string) {
  return useQuery<UsageSummary>({
    queryKey: ['usage-summary', orgId],
    queryFn: async () => {
      // Stub fallback data for Phase 1 telemetry validation
      return {
        totalRequests: 1420850,
        totalErrors: 1240,
        averageLatencyMs: 42.5,
        totalCost: 710.42,
      };
    },
    enabled: !!orgId,
    refetchInterval: 5000,
  });
}
