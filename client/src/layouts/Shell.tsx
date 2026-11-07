import { Link, Outlet } from 'react-router-dom';
import { LogOut, User as UserIcon } from 'lucide-react';
import { homeFor, useAuth } from '../lib/auth';
import { Badge, Button, repGrade } from '../ui';

export type NavItem = { to: string; label: string };

export function Shell({ nav, brand = 'SyncHub', bottomNav }: { nav: NavItem[]; brand?: string; bottomNav?: boolean }) {
  const { user, role, logout } = useAuth();
  const extraLinks =
    user && (role === 'HOST' || role === 'MEMBER') && !nav.some((n) => n.to === '/wallet')
      ? [
          { to: '/wallet', label: 'Ví' },
          { to: '/disputes', label: 'Khiếu nại' },
          { to: '/profile', label: 'Hồ sơ' },
        ]
      : user && role === 'PROVIDER' && !nav.some((n) => n.to === '/provider')
      ? [{ to: '/provider', label: 'Portal đối tác' }]
      : user && role === 'ADMIN' && !nav.some((n) => n.to === '/admin')
      ? [{ to: '/admin', label: 'Quản trị' }]
      : [];
  const allNav = [...nav, ...extraLinks];

  return (
    <div className="min-h-screen bg-bg-app text-text-primary">
      <header className="sticky top-0 z-40 border-b border-border-default bg-bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Link to={homeFor(role)} className="text-xl font-bold tracking-tight text-primary">{brand}</Link>
          <nav aria-label="Chính" className="hidden flex-1 gap-4 text-sm font-medium text-text-secondary sm:flex">
            {allNav.map((n) => <Link key={n.to} to={n.to} className="hover:text-text-primary">{n.label}</Link>)}
          </nav>
          <span className="flex-1 sm:hidden" />
          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/profile" className="hidden items-center gap-2 text-xs font-medium text-text-secondary hover:text-text-primary md:inline-flex">
                <UserIcon className="size-3.5" aria-hidden />
                <span>{user.full_name}</span>
                <Badge kind={repGrade(user.reputation_score)} />
              </Link>
              <Button variant="ghost" size="sm" onClick={logout} iconStart={<LogOut className="size-4" aria-hidden />}>Đăng xuất</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm font-semibold text-primary hover:underline">Đăng nhập</Link>
              <Link to="/register" className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-text-inverted hover:bg-primary-hover">Đăng ký</Link>
            </div>
          )}
        </div>
      </header>
      <main className={`mx-auto max-w-5xl px-4 py-6 ${bottomNav ? 'pb-24 sm:pb-6' : ''}`}><Outlet /></main>
      {bottomNav && (
        <nav aria-label="Di động" className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-border-default bg-bg-surface/90 p-2 text-xs font-medium backdrop-blur sm:hidden">
          {allNav.map((n) => <Link key={n.to} to={n.to} className="px-3 py-2 text-text-secondary">{n.label}</Link>)}
        </nav>
      )}
    </div>
  );
}
