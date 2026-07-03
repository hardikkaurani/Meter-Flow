import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apisApi, billingApi } from '../services/meterflow.js';
import { Card, Stat } from '../components/ui.jsx';
import { useAuthStore } from '../store/authStore.js';

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const apis = useQuery({ queryKey: ['apis'], queryFn: apisApi.list });
  const invoices = useQuery({ queryKey: ['invoices'], queryFn: billingApi.invoices });
  const subs = useQuery({ queryKey: ['subscriptions'], queryFn: billingApi.subscriptions });

  const apiList = apis.data?.apis ?? [];
  const keyCount = apiList.reduce((n, a) => n + (a._count?.apiKeys ?? 0), 0);
  const totalBilled = (invoices.data?.invoices ?? []).reduce((n, inv) => n + Number(inv.totalAmount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-slate-400">Welcome back, {user?.email}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Stat label="APIs" value={apiList.length} tone="accent" />
        <Stat label="API keys" value={keyCount} />
        <Stat label="Subscriptions" value={subs.data?.subscriptions?.length ?? 0} />
        <Stat label="Total billed" value={`$${totalBilled.toFixed(2)}`} tone="good" />
      </div>

      <Card title="Your APIs">
        {apiList.length === 0 ? (
          <p className="text-slate-400 text-sm">
            No APIs yet.{' '}
            <Link to="/apis" className="text-indigo-400">
              Create your first API
            </Link>{' '}
            to start metering.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {apiList.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <Link to={`/apis/${a.id}`} className="font-medium hover:text-indigo-400">
                    {a.name}
                  </Link>
                  <div className="text-xs text-slate-500">{a.upstreamBaseUrl}</div>
                </div>
                <div className="text-xs text-slate-400">
                  {a._count?.apiKeys ?? 0} keys · {a._count?.endpoints ?? 0} endpoints
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
