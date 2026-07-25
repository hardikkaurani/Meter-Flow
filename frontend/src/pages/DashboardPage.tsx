import React from 'react';
import { Activity, ShieldCheck, CreditCard, Terminal, Cpu } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useUsageSummary } from '../hooks/useUsageData.js';

export const DashboardPage: React.FC = () => {
  const { organization } = useAuthStore();
  const { data: usage } = useUsageSummary(organization?.id || '');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      <header className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            MeterFlow Telemetry
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Realtime multi-tenant API gateway metering & billing overview for {organization?.name}
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Gateway Active</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center space-x-3 text-blue-400 mb-2">
            <Activity className="w-5 h-5" />
            <h3 className="text-sm font-medium text-slate-300">Total Requests</h3>
          </div>
          <p className="text-3xl font-bold">{usage?.totalRequests.toLocaleString()}</p>
          <span className="text-xs text-emerald-400 mt-2 block">+14.2% vs last cycle</span>
        </div>

        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center space-x-3 text-indigo-400 mb-2">
            <Cpu className="w-5 h-5" />
            <h3 className="text-sm font-medium text-slate-300">Avg Latency</h3>
          </div>
          <p className="text-3xl font-bold">{usage?.averageLatencyMs} ms</p>
          <span className="text-xs text-indigo-400 mt-2 block">p99: 112ms</span>
        </div>

        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center space-x-3 text-rose-400 mb-2">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="text-sm font-medium text-slate-300">Error Rate</h3>
          </div>
          <p className="text-3xl font-bold">0.087%</p>
          <span className="text-xs text-slate-400 mt-2 block">{usage?.totalErrors} failed requests</span>
        </div>

        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center space-x-3 text-emerald-400 mb-2">
            <CreditCard className="w-5 h-5" />
            <h3 className="text-sm font-medium text-slate-300">Current Unbilled</h3>
          </div>
          <p className="text-3xl font-bold">${usage?.totalCost.toFixed(2)}</p>
          <span className="text-xs text-emerald-400 mt-2 block">Monthly cycle closes in 8 days</span>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-400" />
            Active Gateway Routes & Rate Limit Policies
          </h2>
          <span className="text-xs text-slate-500 font-mono">PostgreSQL Transactional Registry</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-3">API Route</th>
                <th className="p-3">Upstream Service</th>
                <th className="p-3">Quota Policy</th>
                <th className="p-3">Rate Limit</th>
                <th className="p-3">Cost / Call</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="p-3 font-mono text-blue-400">/api/v1/ml/inference</td>
                <td className="p-3 text-slate-400">https://models.internal.net</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-300">Pay-as-you-go</span></td>
                <td className="p-3 font-mono">1,000 / min</td>
                <td className="p-3 font-mono text-emerald-400">$0.000500</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-blue-400">/api/v1/search/vectors</td>
                <td className="p-3 text-slate-400">https://search.internal.net</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-300">Tiered Tier</span></td>
                <td className="p-3 font-mono">500 / min</td>
                <td className="p-3 font-mono text-emerald-400">$0.000200</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
