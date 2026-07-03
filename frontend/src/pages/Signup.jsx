import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../services/meterflow.js';
import { useAuthStore } from '../store/authStore.js';
import { Button, Input } from '../components/ui.jsx';
import { AuthShell } from './Login.jsx';

export default function Signup() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ orgName: '', email: '', password: '' });

  const mutation = useMutation({
    mutationFn: () => authApi.signup(form),
    onSuccess: ({ user, token }) => {
      setAuth({ user, token });
      navigate('/');
    },
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <AuthShell title="Create your organization" subtitle="Start metering and billing your APIs">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <Input label="Organization name" required value={form.orgName} onChange={set('orgName')} />
        <Input label="Email" type="email" required value={form.email} onChange={set('email')} />
        <Input label="Password (min 8 chars)" type="password" required minLength={8} value={form.password} onChange={set('password')} />
        {mutation.isError && (
          <p className="text-sm text-red-400">{mutation.error?.response?.data?.error ?? 'Signup failed'}</p>
        )}
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
