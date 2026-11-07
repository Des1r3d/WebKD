import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { homeFor, useAuth } from '../lib/auth';
import type { Role } from '../types';

export function RoleGuard({ roles }: { roles: Role[] }) {
  const { role, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <p className="p-6 text-text-secondary" role="status">Đang tải…</p>;
  if (!role) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (!roles.includes(role)) return <Navigate to={homeFor(role)} replace />;
  return <Outlet />;
}
