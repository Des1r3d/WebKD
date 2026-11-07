import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  MapPin,
  CalendarClock,
  Users,
  Receipt,
  Wallet,
  AlertTriangle,
  Store,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  MousePointerClick,
  UserCheck,
} from 'lucide-react';
import { Badge, MemberAvatar } from './index';
import { Role } from '../types';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/home', label: '1. Bản đồ & Sân', icon: MapPin, step: 1 },
  { to: '/venue', label: '2. Chi tiết & Slot', icon: CalendarClock, step: 1 },
  { to: '/lobby', label: '3. Phòng & Giỏ chung', icon: Users, step: 2 },
  { to: '/split-bill', label: '4. Chia Bill & QR', icon: Receipt, step: 3 },
  { to: '/wallet', label: '5. Ví Escrow', icon: Wallet },
  { to: '/disputes', label: '6. Khiếu nại', icon: AlertTriangle },
  { to: '/profile', label: 'Hồ sơ & Uy tín', icon: UserCheck },
  { to: '/provider', label: '7. Portal Chủ Sân/Quán', icon: Store },
  { to: '/admin', label: '8. Admin Dashboard', icon: ShieldAlert },
  { to: '/styleguide', label: 'Design System', icon: Sparkles },
];

export const AppLayout: React.FC = () => {
  const { currentUser, reputation, switchRole } = useAuth();
  const location = useLocation();

  const currentStep =
    location.pathname.startsWith('/home') || location.pathname.startsWith('/venue')
      ? 1
      : location.pathname.startsWith('/lobby')
      ? 2
      : location.pathname.startsWith('/split-bill') || location.pathname.startsWith('/wallet')
      ? 3
      : 0;

  return (
    <div className="min-h-screen bg-bg-app text-text-primary flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-bg-surface/95 backdrop-blur border-b border-border-default shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <NavLink to="/home" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-text-inverted font-bold text-base shadow-xs">
                S
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-text-primary">
                    SyncHub
                  </span>
                  <Badge variant="primary" size="sm">
                    v1.0 Live
                  </Badge>
                </div>
                <p className="text-[11px] text-text-secondary hidden md:block">
                  BookSlot + GroupOrder · Làng ĐH Thủ Đức
                </p>
              </div>
            </NavLink>
          </div>

          {/* Gate: <= 3 Click Flow Indicator */}
          <div className="hidden lg:flex items-center gap-2 bg-bg-subtle px-3 py-1.5 rounded-full border border-border-default text-xs">
            <MousePointerClick className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold text-text-primary">Luồng ≤ 3 Click:</span>
            <NavLink
              to="/venue"
              className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
                currentStep === 1
                  ? 'bg-primary text-text-inverted'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Click 1: Khóa Slot 10&apos;
            </NavLink>
            <span className="text-text-muted">→</span>
            <NavLink
              to="/lobby"
              className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
                currentStep === 2
                  ? 'bg-accent text-text-inverted'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Click 2: Gọi Nước Chung
            </NavLink>
            <span className="text-text-muted">→</span>
            <NavLink
              to="/split-bill"
              className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
                currentStep === 3
                  ? 'bg-primary text-text-inverted'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Click 3: Chốt &amp; VietQR
            </NavLink>
          </div>

          {/* Role Switcher & User Reputation */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Role Select */}
            <div className="sm:hidden">
              <select
                aria-label="Chọn vai trò người dùng"
                value={currentUser.role}
                onChange={(e) => switchRole(e.target.value as Role)}
                className="text-xs font-semibold bg-bg-subtle text-primary border border-border-default rounded-md px-1.5 py-1 outline-none"
              >
                {[Role.HOST, Role.MEMBER, Role.PROVIDER, Role.ADMIN].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Role Tabs */}
            <div className="hidden sm:flex items-center gap-1 bg-bg-subtle p-1 rounded-md border border-border-default text-xs">
              {([Role.HOST, Role.MEMBER, Role.PROVIDER, Role.ADMIN] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => switchRole(r)}
                  className={`px-2 py-1 rounded-sm font-medium transition-colors cursor-pointer ${
                    currentUser.role === r
                      ? 'bg-bg-surface text-primary shadow-xs font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  title={`Chuyển sang vai trò ${r}`}
                >
                  {r}
                </button>
              ))}
            </div>

            <NavLink
              to="/profile"
              className="flex items-center gap-2 pl-2 border-l border-border-default hover:opacity-80 transition-opacity"
              title="Xem hồ sơ & điểm uy tín"
            >
              <MemberAvatar
                name={currentUser.full_name}
                reputationScore={currentUser.reputation_score}
                isHost={currentUser.role === Role.HOST}
                size="sm"
              />
              <div className="hidden xl:block text-left">
                <div className="text-xs font-semibold text-text-primary leading-none">
                  {currentUser.full_name.split(' (')[0]}
                </div>
                <div className={`text-[10px] font-medium mt-0.5 flex items-center gap-1 ${
                  reputation.tier === 'A'
                    ? 'text-emerald-700'
                    : reputation.tier === 'B'
                    ? 'text-blue-700'
                    : reputation.tier === 'C'
                    ? 'text-amber-700'
                    : 'text-red-700'
                }`}>
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  {reputation.tier === 'FLAGGED'
                    ? 'FLAGGED · Chặn phòng'
                    : `Hạng ${reputation.tier} · ${currentUser.reputation_score}đ (${reputation.depositPercent}% cọc)`}
                </div>
              </div>
            </NavLink>
          </div>
        </div>

        {/* Screen Navigation Strip (8 Screens + Styleguide) */}
        <nav
          aria-label="Điều hướng màn hình Prototype"
          className="border-t border-border-default bg-bg-surface overflow-x-auto"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 py-1.5">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-primary-light text-primary border border-emerald-200 font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet context={{ activeRole: currentUser.role }} />
      </main>
    </div>
  );
};
