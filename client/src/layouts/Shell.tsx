import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Compass,
  Feather,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldAlert,
  UserRound,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { homeFor, useAuth } from '../lib/auth';
import { cn, MemberAvatar, repGrade } from '../ui';

export type NavItem = { to: string; label: string };

const ICONS: Record<string, LucideIcon> = {
  '/': Compass,
  '/wallet': Wallet,
  '/disputes': ShieldAlert,
  '/profile': UserRound,
  '/provider': LayoutDashboard,
  '/admin': LayoutDashboard,
};

const ROLE_LABEL: Record<string, string> = {
  HOST: 'Trưởng phòng',
  MEMBER: 'Thành viên',
  PROVIDER: 'Đối tác',
  ADMIN: 'Quản trị viên',
};

const ROUTE_LABEL: Array<[string, string]> = [
  ['/login', 'Đăng nhập'],
  ['/register', 'Đăng ký'],
  ['/venues', 'Chi tiết sân'],
  ['/lobby', 'Phòng ghép kèo'],
  ['/join', 'Lời mời phòng'],
  ['/wallet', 'Ví & Escrow'],
  ['/disputes', 'Khiếu nại'],
  ['/profile', 'Hồ sơ'],
  ['/provider', 'Portal đối tác'],
  ['/admin', 'Quản trị'],
  ['/', 'Khám phá'],
];

function pageLabel(pathname: string) {
  const hit = ROUTE_LABEL.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return hit?.[1] ?? 'SyncHub';
}

export function Shell({ nav, brand = 'SyncHub', bottomNav }: { nav: NavItem[]; brand?: string; bottomNav?: boolean }) {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const extraLinks =
    user && (role === 'HOST' || role === 'MEMBER') && !nav.some((n) => n.to === '/wallet')
      ? [
          { to: '/wallet', label: 'Ví & Escrow' },
          { to: '/disputes', label: 'Khiếu nại' },
          { to: '/profile', label: 'Hồ sơ' },
        ]
      : user && role === 'PROVIDER' && !nav.some((n) => n.to === '/provider')
      ? [{ to: '/provider', label: 'Portal đối tác' }]
      : user && role === 'ADMIN' && !nav.some((n) => n.to === '/admin')
      ? [{ to: '/admin', label: 'Quản trị' }]
      : [];
  const allNav = [...nav, ...extraLinks];

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const onJoin = (e: FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setJoinCode('');
    navigate(`/join/${code}`);
  };

  const current = pageLabel(location.pathname);
  const today = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(new Date());

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <Link to={homeFor(role)} className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-text-inverted shadow-sm">
            <Feather className="size-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-extrabold tracking-tight text-text-primary">{brand}</span>
            <span className="block truncate text-[11px] leading-4 text-text-muted">Đặt sân &amp; gọi đồ nhóm</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md p-1.5 text-text-secondary hover:bg-bg-subtle lg:hidden"
          aria-label="Đóng menu"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <nav aria-label="Chính" className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto px-3">
        <p className="px-3 pb-1 text-[11px] font-medium text-text-muted">Điều hướng</p>
        {allNav.map((n) => {
          const Icon = ICONS[n.to] ?? LayoutDashboard;
          return (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-bg-sidebar-active text-primary' : 'text-text-secondary hover:bg-bg-subtle hover:text-text-primary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('size-[18px] shrink-0', isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-secondary')} aria-hidden />
                  <span className="truncate">{n.label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        <form onSubmit={onJoin} className="mt-4 rounded-xl border border-border-default bg-bg-subtle p-3">
          <label htmlFor="sidebar-join-code" className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary">
            <KeyRound className="size-3.5" aria-hidden /> Vào phòng bằng mã
          </label>
          <div className="mt-2 flex gap-1.5">
            <input
              id="sidebar-join-code"
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="SYNC01"
              autoComplete="off"
              className="h-9 min-w-0 flex-1 rounded-md border border-border-default bg-bg-surface px-2.5 text-xs font-semibold uppercase text-text-primary placeholder:font-normal placeholder:normal-case placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Vào phòng"
              className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-text-inverted transition-colors hover:bg-primary-hover disabled:opacity-50"
              disabled={!joinCode.trim()}
            >
              <ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
        </form>
      </nav>

      <div className="border-t border-border-default p-3">
        {user ? (
          <div className="flex items-center gap-3 rounded-lg p-2">
            <MemberAvatar name={user.full_name} score={user.reputation_score} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{user.full_name}</p>
              <p className="truncate text-[11px] leading-4 text-text-muted">
                {ROLE_LABEL[role ?? ''] ?? role} · Hạng {repGrade(user.reputation_score)}
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              aria-label="Đăng xuất"
              title="Đăng xuất"
              className="grid size-8 shrink-0 place-items-center rounded-md text-text-muted transition-colors hover:bg-bg-subtle hover:text-status-disputed"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2">
            <Link to="/login" className="flex-1 rounded-md border border-border-strong px-3 py-2 text-center text-xs font-semibold text-text-primary hover:bg-bg-subtle">
              Đăng nhập
            </Link>
            <Link to="/register" className="flex-1 rounded-md bg-primary px-3 py-2 text-center text-xs font-semibold text-text-inverted hover:bg-primary-hover">
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-app text-text-primary">
      <a href="#main-content" className="skip-link">Bỏ qua điều hướng</a>

      <aside
        aria-label="Thanh điều hướng"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-border-default bg-bg-sidebar transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebar}
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-overlay lg:hidden"
        />
      )}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-border-default bg-bg-surface">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid size-9 place-items-center rounded-md border border-border-default text-text-secondary hover:bg-bg-subtle lg:hidden"
              aria-label="Mở menu"
              aria-expanded={open}
            >
              <Menu className="size-5" aria-hidden />
            </button>

            <nav aria-label="Vị trí" className="flex min-w-0 items-center gap-2 text-xs text-text-muted">
              <Link to={homeFor(role)} className="hidden shrink-0 font-semibold text-text-secondary hover:text-primary sm:inline">
                SyncHub
              </Link>
              <span aria-hidden className="hidden text-border-strong sm:inline">/</span>
              <span className="truncate text-sm font-semibold text-text-primary">{current}</span>
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-xs text-text-muted md:inline">{today}</span>
              {user ? (
                <Link
                  to={role === 'PROVIDER' ? '/provider' : role === 'ADMIN' ? '/admin' : '/profile'}
                  className="flex items-center gap-2 rounded-full border border-border-default bg-bg-surface py-1 pl-1 pr-3 hover:border-border-strong"
                >
                  <MemberAvatar name={user.full_name} score={user.reputation_score} />
                  <span className="hidden max-w-[140px] truncate text-xs font-semibold text-text-primary sm:inline">{user.full_name}</span>
                </Link>
              ) : (
                <Link to="/login" className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-text-inverted hover:bg-primary-hover">
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </header>

        <main id="main-content" className={cn('mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8', bottomNav && 'pb-24 lg:pb-8')}>
          <Outlet />
          <footer className="mt-10 border-t border-border-default pt-4 text-[11px] leading-5 text-text-muted">
            <p>
              SyncHub · Đồ án đặt sân &amp; GroupOrder. Ảnh danh mục minh hoạ từ Wikimedia Commons:{' '}
              <a className="underline hover:text-text-secondary" href="https://commons.wikimedia.org/wiki/File:Badminton_Tournament.jpg" target="_blank" rel="noreferrer">Itsn4kul10</a> (CC BY-SA 4.0),{' '}
              <a className="underline hover:text-text-secondary" href="https://commons.wikimedia.org/wiki/File:Leiden_University_Library,_Group_Study_Room.jpg" target="_blank" rel="noreferrer">Libr</a> (CC BY 3.0),{' '}
              <a className="underline hover:text-text-secondary" href="https://commons.wikimedia.org/wiki/File:Futsal_pitch,_Calthorpe_Community_Garden_-_geograph.org.uk_-_4534718.jpg" target="_blank" rel="noreferrer">David Hawgood</a> (CC BY-SA 2.0),{' '}
              <a className="underline hover:text-text-secondary" href="https://commons.wikimedia.org/wiki/File:Milk_Tea_1.jpg" target="_blank" rel="noreferrer">Gaurav Dhwaj Khadka</a> (CC BY-SA 4.0).
            </p>
          </footer>
        </main>
      </div>

      {bottomNav && allNav.length > 1 && (
        <nav aria-label="Di động" className="fixed inset-x-0 bottom-0 z-40 grid grid-flow-col border-t border-border-default bg-bg-surface px-1 py-1 lg:hidden">
          {allNav.slice(0, 5).map((n) => {
            const Icon = ICONS[n.to] ?? LayoutDashboard;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  cn('flex flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-[10px] font-medium', isActive ? 'text-primary' : 'text-text-secondary')
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('size-5', isActive ? 'text-primary' : 'text-text-muted')} aria-hidden />
                    <span className="truncate">{n.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}
