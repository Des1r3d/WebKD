import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, tokenStore } from './api';
import { AuthContext, type AuthState } from './auth';
import { closeSocket } from './socket';
import type { User } from '../types';

interface AuthRes { token: string; user: User }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => !!tokenStore.get());

  useEffect(() => {
    if (!tokenStore.get()) return;
    api<{ user: User } | User>('/api/auth/me')
      .then((r) => setUser('user' in r ? r.user : r))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const accept = useCallback((r: AuthRes) => { tokenStore.set(r.token); setUser(r.user); }, []);

  const value = useMemo<AuthState>(() => ({
    user,
    role: user?.role ?? null,
    loading,
    login: async (email, password) => accept(await api<AuthRes>('/api/auth/login', { method: 'POST', body: { email, password } })),
    register: async (d) => accept(await api<AuthRes>('/api/auth/register', { method: 'POST', body: d })),
    logout: () => { tokenStore.clear(); setUser(null); void closeSocket(); },
  }), [user, loading, accept]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
