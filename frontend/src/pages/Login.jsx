import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../services/meterflow.js';
import { useAuthStore } from '../store/authStore.js';
import { Button, Input } from '../components/ui.jsx';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });

  const mutation = useMutation({
    mutationFn: () => authApi.login(form),
    onSuccess: ({ user, token }) => {
      setAuth({ user, token });
      navigate('/');
    },
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your MeterFlow dashboard">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <Input label="Email" type="email" required value={form.email} onChange={set('email')} />
        <Input label="Password" type="password" required value={form.password} onChange={set('password')} />
        {mutation.isError && (
          <p className="text-sm text-red-400">{mutation.error?.response?.data?.error ?? 'Login failed'}</p>
        )}
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-slate-400">
        No account?{' '}
        <Link to="/signup" className="text-indigo-400 hover:text-indigo-300">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="mb-6">
          <div className="text-xl font-bold">MeterFlow</div>
          <h1 className="mt-4 text-lg font-semibold">{title}</h1>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
