import { createContext, useContext } from 'react';
import type { Role, User } from '../types';

export interface AuthState {
  user: User | null;
  role: Role | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; phone: string }) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
}

export const homeFor = (r: Role | null) => (r === 'PROVIDER' ? '/provider' : r === 'ADMIN' ? '/admin' : '/');
