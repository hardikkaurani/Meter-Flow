import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apisApi, keysApi } from '../services/meterflow.js';
import { Card, Button, Input, Badge } from '../components/ui.jsx';

export default function ApiDetail() {
  const { apiId } = useParams();
  const qc = useQueryClient();

  const apiQ = useQuery({ queryKey: ['api', apiId], queryFn: () => apisApi.get(apiId) });
  const keysQ = useQuery({ queryKey: ['keys', apiId], queryFn: () => keysApi.list(apiId) });

  const [rateLimit, setRateLimit] = useState(60);
  const [revealed, setRevealed] = useState(null); // raw key shown once
  const [endpoint, setEndpoint] = useState({ path: '', method: 'GET', costPerCall: 0 });

  const invalidateKeys = () => qc.invalidateQueries({ queryKey: ['keys', apiId] });

  const createKey = useMutation({
    mutationFn: () => keysApi.create(apiId, { rateLimitPerMin: Number(rateLimit) }),
    onSuccess: (res) => {
      setRevealed(res.rawKey);
      invalidateKeys();
    },
  });
  const revoke = useMutation({ mutationFn: (id) => keysApi.revoke(apiId, id), onSuccess: invalidateKeys });
  const rotate = useMutation({
    mutationFn: (id) => keysApi.rotate(apiId, id),
    onSuccess: (res) => {
      setRevealed(res.rawKey);
      invalidateKeys();
    },
  });

  const addEndpoint = useMutation({
    mutationFn: () => apisApi.addEndpoint(apiId, { ...endpoint, costPerCall: Number(endpoint.costPerCall) }),
    onSuccess: () => {
      setEndpoint({ path: '', method: 'GET', costPerCall: 0 });
      qc.invalidateQueries({ queryKey: ['api', apiId] });
    },
  });
  const removeEndpoint = useMutation({
    mutationFn: (id) => apisApi.removeEndpoint(apiId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api', apiId] }),
  });

  const api = apiQ.data?.api;
  const keys = keysQ.data?.keys ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link to="/apis" className="text-sm text-indigo-400">
          ← APIs
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{api?.name ?? 'API'}</h1>
        <p className="text-slate-500 text-sm">{api?.upstreamBaseUrl}</p>
      </div>

      {revealed && (
        <div className="rounded-xl border border-emerald-700 bg-emerald-950/40 p-4">
          <p className="text-sm text-emerald-300 font-medium">Your new API key (shown once — copy it now):</p>
          <code className="mt-2 block break-all rounded bg-slate-950 p-3 text-emerald-400">{revealed}</code>
          <button className="mt-2 text-xs text-slate-400 hover:text-slate-200" onClick={() => setRevealed(null)}>
            Dismiss
          </button>
        </div>
      )}

      <Card title="Generate an API key">
        <div className="flex items-end gap-3">
          <Input
            label="Rate limit (req/min)"
            type="number"
            min={1}
            value={rateLimit}
            onChange={(e) => setRateLimit(e.target.value)}
            className="w-48"
          />
          <Button onClick={() => createKey.mutate()} disabled={createKey.isPending}>
            {createKey.isPending ? 'Generating…' : 'Generate key'}
          </Button>
        </div>
      </Card>

      <Card title="API keys">
        {keys.length === 0 ? (
          <p className="text-slate-400 text-sm">No keys yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="pb-2">Prefix</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Rate limit</th>
                <th className="pb-2">Created</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {keys.map((k) => (
                <tr key={k.id}>
                  <td className="py-2 font-mono">{k.keyPrefix}…</td>
                  <td>
                    <Badge tone={k.status === 'active' ? 'active' : 'revoked'}>{k.status}</Badge>
                  </td>
                  <td>{k.rateLimitPerMin}/min</td>
                  <td className="text-slate-500">{new Date(k.createdAt).toLocaleDateString()}</td>
                  <td className="py-2">
                    <div className="flex justify-end gap-2">
                      {k.status === 'active' && (
                        <>
                          <Button variant="ghost" onClick={() => rotate.mutate(k.id)}>
                            Rotate
                          </Button>
                          <Button variant="danger" onClick={() => revoke.mutate(k.id)}>
                            Revoke
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Per-endpoint pricing (optional)">
        <form
          className="grid grid-cols-[2fr_1fr_1fr_auto] gap-3 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            addEndpoint.mutate();
          }}
        >
          <Input
            label="Path"
            placeholder="/pokemon/:name"
            required
            value={endpoint.path}
            onChange={(e) => setEndpoint((s) => ({ ...s, path: e.target.value }))}
          />
          <label className="block">
            <span className="block text-xs text-slate-400 mb-1">Method</span>
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={endpoint.method}
              onChange={(e) => setEndpoint((s) => ({ ...s, method: e.target.value }))}
            >
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <Input
            label="Cost / call"
            type="number"
            step="0.0001"
            min={0}
            value={endpoint.costPerCall}
            onChange={(e) => setEndpoint((s) => ({ ...s, costPerCall: e.target.value }))}
          />
          <Button type="submit">Add</Button>
        </form>

        {(api?.endpoints ?? []).length > 0 && (
          <ul className="mt-4 divide-y divide-slate-800 text-sm">
            {api.endpoints.map((ep) => (
              <li key={ep.id} className="flex items-center justify-between py-2">
                <span className="font-mono">
                  {ep.method} {ep.path}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">${Number(ep.costPerCall).toFixed(4)}/call</span>
                  <Button variant="ghost" onClick={() => removeEndpoint.mutate(ep.id)}>
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
