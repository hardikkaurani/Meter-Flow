import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apisApi, keysApi, billingApi } from '../services/meterflow.js';
import { useSocketUsage } from '../hooks/useSocketUsage.js';
import { Card, Stat, Select } from '../components/ui.jsx';

export default function LiveUsage() {
  const apisQ = useQuery({ queryKey: ['apis'], queryFn: apisApi.list });
  const apis = apisQ.data?.apis ?? [];
  const [apiId, setApiId] = useState('');
  const effectiveApiId = apiId || apis[0]?.id || '';

  const keysQ = useQuery({
    queryKey: ['keys', effectiveApiId],
    queryFn: () => keysApi.list(effectiveApiId),
    enabled: Boolean(effectiveApiId),
  });
  const keys = keysQ.data?.keys ?? [];
  const [apiKeyId, setApiKeyId] = useState('');
  const effectiveKeyId = apiKeyId || keys[0]?.id || '';

  const { events, summary } = useSocketUsage(effectiveKeyId);

  // Projected bill (live, from Redis counters) — refetched on an interval.
  const projected = useQuery({
    queryKey: ['projected', effectiveKeyId],
    queryFn: () => billingApi.projected(effectiveKeyId),
    enabled: Boolean(effectiveKeyId),
    refetchInterval: 5000,
    retry: false,
  });

  const maxLatency = useMemo(() => Math.max(1, ...events.map((e) => e.latencyMs)), [events]);
  const errorRate = summary.requests ? ((summary.errors / summary.requests) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Live Usage</h1>

      <div className="grid grid-cols-2 gap-4">
        <Select label="API" value={effectiveApiId} onChange={(e) => { setApiId(e.target.value); setApiKeyId(''); }}>
          {apis.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        <Select label="API key" value={effectiveKeyId} onChange={(e) => setApiKeyId(e.target.value)}>
          {keys.map((k) => (
            <option key={k.id} value={k.id}>
              {k.keyPrefix}… ({k.status})
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Stat label="Requests (session)" value={summary.requests} tone="accent" />
        <Stat label="Errors" value={summary.errors} tone={summary.errors ? 'bad' : 'good'} />
        <Stat label="Error rate" value={`${errorRate}%`} />
        <Stat
          label="Projected bill"
          value={projected.data ? `$${projected.data.projectedAmount.toFixed(2)}` : '—'}
          tone="good"
        />
      </div>

      <Card title="Request latency (live)">
        {events.length === 0 ? (
          <p className="text-slate-400 text-sm">
            Waiting for traffic… send a request through the gateway (try the Playground) to see it here in real time.
          </p>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {events.map((e, i) => (
              <div
                key={i}
                title={`${e.method} ${e.endpoint} — ${Math.round(e.latencyMs)}ms — ${e.statusCode}`}
                className={`flex-1 rounded-t ${e.statusCode >= 400 ? 'bg-red-500' : 'bg-indigo-500'}`}
                style={{ height: `${(e.latencyMs / maxLatency) * 100}%` }}
              />
            ))}
          </div>
        )}
      </Card>

      {projected.data && (
        <Card title="Current period">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-500">Plan</div>
              <div>{projected.data.plan.name}</div>
            </div>
            <div>
              <div className="text-slate-500">Billable units</div>
              <div>{projected.data.billableUnits}</div>
            </div>
            <div>
              <div className="text-slate-500">Avg latency</div>
              <div>{projected.data.usage.avgLatencyMs}ms</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
