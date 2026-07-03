// Global auth state (Zustand). Holds the JWT + current user; persists the token
// to localStorage so sessions survive reloads (the axios interceptor reads it).
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('meterflow_token'),

  setAuth: ({ user, token }) => {
    if (token) localStorage.setItem('meterflow_token', token);
    set({ user, token });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem('meterflow_token');
    set({ user: null, token: null });
  },
}));
