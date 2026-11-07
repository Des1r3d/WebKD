import { Link, Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Button } from '../ui';

export type NavItem = { to: string; label: string };

export function Shell({ nav, brand = 'SyncHub', bottomNav }: { nav: NavItem[]; brand?: string; bottomNav?: boolean }) {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-bg-app">
      <header className="sticky top-0 z-40 border-b border-border-default bg-bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Link to="/" className="text-xl font-semibold text-primary">{brand}</Link>
          <nav aria-label="Chính" className="hidden flex-1 gap-4 text-sm font-medium text-text-secondary sm:flex">
            {nav.map((n) => <Link key={n.to} to={n.to} className="hover:text-text-primary">{n.label}</Link>)}
          </nav>
          <span className="flex-1 sm:hidden" />
          {user ? (
            <Button variant="ghost" size="sm" onClick={logout} iconStart={<LogOut className="size-4" aria-hidden />}>Đăng xuất</Button>
          ) : (
            <Link to="/login" className="text-sm font-semibold text-primary">Đăng nhập</Link>
          )}
        </div>
      </header>
      <main className={`mx-auto max-w-5xl px-4 py-6 ${bottomNav ? 'pb-24 sm:pb-6' : ''}`}><Outlet /></main>
      {bottomNav && (
        <nav aria-label="Di động" className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-border-default bg-bg-surface/90 p-2 text-xs font-medium backdrop-blur sm:hidden">
          {nav.map((n) => <Link key={n.to} to={n.to} className="px-3 py-2 text-text-secondary">{n.label}</Link>)}
        </nav>
      )}
    </div>
  );
}
