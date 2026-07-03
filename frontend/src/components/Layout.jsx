// Dashboard shell: sidebar nav + routed content outlet.
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

const links = [
  { to: '/', label: 'Overview', end: true },
  { to: '/apis', label: 'APIs & Keys' },
  { to: '/usage', label: 'Live Usage' },
  { to: '/billing', label: 'Billing' },
  { to: '/playground', label: 'Playground' },
];

export default function Layout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <aside className="w-60 shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <div className="text-lg font-bold">MeterFlow</div>
          <div className="text-xs text-slate-500">API metering & billing</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 text-xs">
          <div className="text-slate-400 truncate">{user?.email}</div>
          <div className="text-slate-600 capitalize">{user?.role}</div>
          <button onClick={onLogout} className="mt-2 text-red-400 hover:text-red-300">
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
