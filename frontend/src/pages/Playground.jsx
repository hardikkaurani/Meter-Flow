// API Playground: fire a request through the MeterFlow gateway using a raw key,
// and see the proxied response + metering headers. Feeds the Live Usage page.
import { useState } from 'react';
import { callGateway } from '../services/meterflow.js';
import { Card, Button, Input, Select } from '../components/ui.jsx';

export default function Playground() {
  const [rawKey, setRawKey] = useState('');
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('pokemon/ditto');
  const [body, setBody] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await callGateway({
        rawKey,
        method,
        path,
        body: body ? JSON.parse(body) : undefined,
      });
      setResult({
        status: res.status,
        rateLimit: {
          limit: res.headers['x-ratelimit-limit'],
          remaining: res.headers['x-ratelimit-remaining'],
        },
        data: res.data,
      });
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">API Playground</h1>
      <p className="text-slate-400 text-sm">
        Send a request through the gateway with a raw API key. Watch it appear on the Live Usage page in real time.
      </p>

      <Card title="Request">
        <div className="space-y-3">
          <Input
            label="API key (x-api-key)"
            placeholder="mf_…"
            value={rawKey}
            onChange={(e) => setRawKey(e.target.value)}
          />
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <Select label="Method" value={method} onChange={(e) => setMethod(e.target.value)}>
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
            <Input label="Upstream path" value={path} onChange={(e) => setPath(e.target.value)} />
          </div>
          {!['GET', 'HEAD'].includes(method) && (
            <label className="block">
              <span className="block text-xs text-slate-400 mb-1">JSON body</span>
              <textarea
                className="w-full h-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"title":"hello"}'
              />
            </label>
          )}
          <Button onClick={send} disabled={!rawKey || loading}>
            {loading ? 'Sending…' : 'Send through gateway'}
          </Button>
        </div>
      </Card>

      {result && (
        <Card title="Response">
          {result.error ? (
            <p className="text-red-400 text-sm">{result.error}</p>
          ) : (
            <>
              <div className="flex gap-4 text-sm mb-3">
                <span>
                  Status: <span className={result.status < 400 ? 'text-emerald-400' : 'text-red-400'}>{result.status}</span>
                </span>
                <span className="text-slate-400">
                  RateLimit: {result.rateLimit.remaining ?? '—'} / {result.rateLimit.limit ?? '—'}
                </span>
              </div>
              <pre className="max-h-96 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-300">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
