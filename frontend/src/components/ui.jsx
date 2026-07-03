// Tiny presentational primitives shared across pages. Keeps Tailwind classes in
// one place so the pages read as structure, not styling noise.
export function Card({ title, actions, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900 p-6 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function Button({ variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
    ghost: 'bg-slate-800 hover:bg-slate-700 text-slate-200',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
  };
  return (
    <button
      className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

export function Input({ label, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs text-slate-400 mb-1">{label}</span>}
      <input
        className={`w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500 ${className}`}
        {...props}
      />
    </label>
  );
}

export function Select({ label, children, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs text-slate-400 mb-1">{label}</span>}
      <select
        className={`w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Stat({ label, value, tone = 'default' }) {
  const tones = {
    default: 'text-slate-100',
    good: 'text-emerald-400',
    bad: 'text-red-400',
    accent: 'text-indigo-400',
  };
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tones[tone]}`}>{value}</div>
    </div>
  );
}

export function Badge({ children, tone = 'default' }) {
  const tones = {
    default: 'bg-slate-700 text-slate-200',
    active: 'bg-emerald-600/20 text-emerald-400',
    revoked: 'bg-red-600/20 text-red-400',
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs ${tones[tone] ?? tones.default}`}>{children}</span>;
}
