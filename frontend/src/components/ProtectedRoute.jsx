// Guards the dashboard. Redirects to /login without a token, and hydrates the
// current user (from /auth/me) into the store on first load.
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore.js';
import { authApi } from '../services/meterflow.js';

export default function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const { data, isError } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (data) setUser(data);
    if (isError) logout(); // token invalid/expired
  }, [data, isError, setUser, logout]);

  if (!token) return <Navigate to="/login" replace />;
  return children;
}
