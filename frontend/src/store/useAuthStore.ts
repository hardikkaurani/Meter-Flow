import { create } from 'zustand';
import { Organization, User } from '../types/index.js';

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setOrganization: (org: Organization | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: 'usr_demo_123',
    email: 'engineering@meterflow.io',
    orgId: 'org_acme_corp',
    role: 'owner',
  },
  organization: {
    id: 'org_acme_corp',
    name: 'Acme Corporation',
    createdAt: new Date().toISOString(),
  },
  isAuthenticated: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setOrganization: (organization) => set({ organization }),
  logout: () => set({ user: null, organization: null, isAuthenticated: false }),
}));
