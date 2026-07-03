import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi, apisApi, keysApi } from '../services/meterflow.js';
import { Card, Button, Input, Select } from '../components/ui.jsx';

export default function Billing() {
  const qc = useQueryClient();
  const plansQ = useQuery({ queryKey: ['plans'], queryFn: billingApi.plans });
  const subsQ = useQuery({ queryKey: ['subscriptions'], queryFn: billingApi.subscriptions });
  const invoicesQ = useQuery({ queryKey: ['invoices'], queryFn: billingApi.invoices });
  const apisQ = useQuery({ queryKey: ['apis'], queryFn: apisApi.list });

  const plans = plansQ.data?.plans ?? [];
  const subs = subsQ.data?.subscriptions ?? [];
  const invoices = invoicesQ.data?.invoices ?? [];
  const apis = apisQ.data?.apis ?? [];

  // --- new plan form ---
  const [plan, setPlan] = useState({ name: '', pricePerUnit: 0.001, freeTierUnits: 1000, billingCycle: 'monthly' });
  const createPlan = useMutation({
    mutationFn: () => billingApi.createPlan({ ...plan, pricePerUnit: Number(plan.pricePerUnit), freeTierUnits: Number(plan.freeTierUnits) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });

  // --- subscribe form ---
  const [subApiId, setSubApiId] = useState('');
  const keysQ = useQuery({
    queryKey: ['keys', subApiId],
    queryFn: () => keysApi.list(subApiId),
    enabled: Boolean(subApiId),
  });
  const [sub, setSub] = useState({ apiKeyId: '', planId: '' });
  const subscribe = useMutation({
    mutationFn: () => billingApi.subscribe(sub),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  const generate = useMutation({
    mutationFn: billingApi.generateInvoice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Billing</h1>
        <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
          {generate.isPending ? 'Generating…' : 'Generate this month’s invoice'}
        </Button>
      </div>

      <Card title="Create a plan">
        <form
          className="grid grid-cols-4 gap-3 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            createPlan.mutate();
          }}
        >
          <Input label="Name" required value={plan.name} onChange={(e) => setPlan((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Price / unit ($)" type="number" step="0.0001" value={plan.pricePerUnit} onChange={(e) => setPlan((p) => ({ ...p, pricePerUnit: e.target.value }))} />
          <Input label="Free tier units" type="number" value={plan.freeTierUnits} onChange={(e) => setPlan((p) => ({ ...p, freeTierUnits: e.target.value }))} />
          <div className="flex gap-2">
            <Select value={plan.billingCycle} onChange={(e) => setPlan((p) => ({ ...p, billingCycle: e.target.value }))}>
              <option value="monthly">monthly</option>
              <option value="yearly">yearly</option>
            </Select>
            <Button type="submit">Add</Button>
          </div>
        </form>
        {plans.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-800 text-sm">
            {plans.map((p) => (
              <li key={p.id} className="flex justify-between py-2">
                <span>{p.name}</span>
                <span className="text-slate-400">
                  ${Number(p.pricePerUnit).toFixed(4)}/unit · {p.freeTierUnits} free · {p.billingCycle}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Subscribe a key to a plan">
        <div className="grid grid-cols-4 gap-3 items-end">
          <Select label="API" value={subApiId} onChange={(e) => setSubApiId(e.target.value)}>
            <option value="">Select…</option>
            {apis.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <Select label="Key" value={sub.apiKeyId} onChange={(e) => setSub((s) => ({ ...s, apiKeyId: e.target.value }))}>
            <option value="">Select…</option>
            {(keysQ.data?.keys ?? []).map((k) => (
              <option key={k.id} value={k.id}>
                {k.keyPrefix}…
              </option>
            ))}
          </Select>
          <Select label="Plan" value={sub.planId} onChange={(e) => setSub((s) => ({ ...s, planId: e.target.value }))}>
            <option value="">Select…</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Button onClick={() => subscribe.mutate()} disabled={!sub.apiKeyId || !sub.planId || subscribe.isPending}>
            Subscribe
          </Button>
        </div>
        {subs.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-800 text-sm">
            {subs.map((s) => (
              <li key={s.id} className="flex justify-between py-2">
                <span className="font-mono">{s.apiKey.keyPrefix}…</span>
                <span className="text-slate-400">{s.plan.name}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Invoices">
        {invoices.length === 0 ? (
          <p className="text-slate-400 text-sm">No invoices yet. Generate one above after some usage.</p>
        ) : (
          <div className="space-y-4">
            {invoices.map((inv) => (
              <div key={inv.id} className="rounded-xl border border-slate-800 p-4">
                <div className="flex justify-between">
                  <div className="text-sm">
                    <span className="font-medium">
                      {new Date(inv.periodStart).toLocaleDateString()} – {new Date(inv.periodEnd).toLocaleDateString()}
                    </span>
                    <span className="ml-2 text-slate-500">{inv.status}</span>
                  </div>
                  <div className="font-bold text-emerald-400">${Number(inv.totalAmount).toFixed(2)}</div>
                </div>
                {inv.lineItems.length > 0 && (
                  <ul className="mt-2 text-xs text-slate-400 space-y-1">
                    {inv.lineItems.map((li) => (
                      <li key={li.id} className="flex justify-between">
                        <span>{li.description}</span>
                        <span>${Number(li.amount).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
