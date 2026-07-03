import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apisApi } from '../services/meterflow.js';
import { Card, Button, Input } from '../components/ui.jsx';

export default function ApisPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['apis'], queryFn: apisApi.list });
  const [form, setForm] = useState({ name: '', upstreamBaseUrl: '' });

  const create = useMutation({
    mutationFn: () => apisApi.create(form),
    onSuccess: () => {
      setForm({ name: '', upstreamBaseUrl: '' });
      qc.invalidateQueries({ queryKey: ['apis'] });
    },
  });

  const remove = useMutation({
    mutationFn: (id) => apisApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['apis'] }),
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const apis = data?.apis ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">APIs & Keys</h1>

      <Card title="Wrap a new API">
        <form
          className="grid grid-cols-[1fr_2fr_auto] gap-3 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <Input label="Name" placeholder="Pokémon proxy" required value={form.name} onChange={set('name')} />
          <Input
            label="Upstream base URL"
            placeholder="https://pokeapi.co/api/v2"
            required
            value={form.upstreamBaseUrl}
            onChange={set('upstreamBaseUrl')}
          />
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create'}
          </Button>
        </form>
        {create.isError && (
          <p className="mt-2 text-sm text-red-400">{create.error?.response?.data?.error ?? 'Failed'}</p>
        )}
      </Card>

      <Card title="Your APIs">
        {isLoading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : apis.length === 0 ? (
          <p className="text-slate-400 text-sm">No APIs yet — create one above.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {apis.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <Link to={`/apis/${a.id}`} className="font-medium hover:text-indigo-400">
                    {a.name}
                  </Link>
                  <div className="text-xs text-slate-500">{a.upstreamBaseUrl}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400">{a._count?.apiKeys ?? 0} keys</span>
                  <Button variant="danger" onClick={() => remove.mutate(a.id)}>
                    Delete
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
