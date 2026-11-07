import React from 'react';
import {
  ShieldCheck,
  Award,
  UserCheck,
  CheckCircle2,
  XCircle,
  Sliders,
  RotateCcw,
  KeyRound,
} from 'lucide-react';
import { useAuth, TEST_ACCOUNTS } from '../context/AuthContext';
import { Card, Badge, MemberAvatar } from '../components';

export const ProfilePage: React.FC = () => {
  const { currentUser, reputation, token, switchAccount, updateScore } = useAuth();

  const getRepBadgeVariant = (tier: 'A' | 'B' | 'C' | 'FLAGGED') => {
    switch (tier) {
      case 'A':
        return 'rep-a' as const;
      case 'B':
        return 'rep-b' as const;
      case 'C':
        return 'rep-c' as const;
      case 'FLAGGED':
        return 'rep-flagged' as const;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border-default">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Hồ Sơ &amp; Điểm Uy Tín (Reputation)
            </h1>
            <Badge variant="primary" size="sm">
              BR-REP-01
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Hệ thống phân hạng tự động và quy định mức đặt cọc khi tham gia phòng ghép kèo
          </p>
        </div>

        {/* Current Role Badge */}
        <div className="flex items-center gap-2">
          <Badge
            variant={
              currentUser.role === 'ADMIN'
                ? 'disputed'
                : currentUser.role === 'PROVIDER'
                ? 'primary'
                : currentUser.role === 'HOST'
                ? 'open'
                : 'neutral'
            }
            size="md"
          >
            Vai trò: {currentUser.role}
          </Badge>
        </div>
      </div>

      {/* Main Grid: User Info & Reputation Meter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: User Card */}
        <Card className="md:col-span-1 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <MemberAvatar
                name={currentUser.full_name}
                reputationScore={currentUser.reputation_score}
                isHost={currentUser.role === 'HOST'}
                size="lg"
              />
              <div>
                <h3 className="font-bold text-base text-text-primary">{currentUser.full_name}</h3>
                <p className="text-xs text-text-secondary">{currentUser.email}</p>
                <div className="mt-1">
                  <Badge
                    variant={currentUser.status === 'ACTIVE' ? 'open' : 'disputed'}
                    size="sm"
                  >
                    {currentUser.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="border-t border-border-default pt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border-default/50">
                <span className="text-text-secondary">Số điện thoại:</span>
                <span className="font-medium text-text-primary">{currentUser.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-default/50">
                <span className="text-text-secondary">Mã định danh (ID):</span>
                <span className="font-mono text-text-muted text-[11px]">{currentUser.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-default/50">
                <span className="text-text-secondary">Quyền hạn hệ thống:</span>
                <span className="font-semibold text-primary">{currentUser.role}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border-default">
            <div className="text-[11px] text-text-muted flex items-center gap-1.5 mb-1 font-mono">
              <KeyRound className="w-3.5 h-3.5 text-text-secondary" /> JWT Access Token (15m):
            </div>
            <div className="bg-bg-subtle p-2 rounded text-[10px] font-mono text-text-secondary break-all select-all border border-border-default">
              {token.slice(0, 48)}...
            </div>
          </div>
        </Card>

        {/* Right Column: Reputation Score & Tier Details */}
        <Card className="md:col-span-2 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-text-primary">
                Đánh giá Điểm Uy Tín Hiện Tại
              </h2>
            </div>
            <Badge variant={getRepBadgeVariant(reputation.tier)} size="md">
              {reputation.tierLabel}
            </Badge>
          </div>

          {/* Big Score Visualizer */}
          <div className="bg-bg-subtle p-4 rounded-xl border border-border-default flex flex-col sm:flex-row items-center gap-5">
            <div className="text-center sm:text-left">
              <div className="text-4xl font-extrabold text-text-primary tracking-tight flex items-baseline gap-1">
                <span
                  className={
                    reputation.tier === 'A'
                      ? 'text-emerald-700'
                      : reputation.tier === 'B'
                      ? 'text-blue-700'
                      : reputation.tier === 'C'
                      ? 'text-amber-700'
                      : 'text-red-700'
                  }
                >
                  {currentUser.reputation_score}
                </span>
                <span className="text-base font-medium text-text-muted">/ 100 điểm</span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Điểm khởi tạo ban đầu: <strong className="text-text-primary">100 điểm</strong>
              </p>
            </div>

            <div className="flex-1 w-full space-y-2">
              {/* Progress bar */}
              <div className="w-full h-3 bg-border-default rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    reputation.tier === 'A'
                      ? 'bg-emerald-600'
                      : reputation.tier === 'B'
                      ? 'bg-blue-600'
                      : reputation.tier === 'C'
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${currentUser.reputation_score}%` }}
                />
              </div>

              {/* Status explanation */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary font-medium">
                  Yêu cầu cọc phòng: <strong className="text-text-primary">{reputation.depositRuleText}</strong>
                </span>
                <span className="flex items-center gap-1 font-semibold">
                  {reputation.canJoinLobby ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Được vào phòng
                    </span>
                  ) : (
                    <span className="text-red-700 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Chặn vào phòng
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* BR-REP-01 Law Table */}
          <div className="border border-border-default rounded-lg overflow-hidden">
            <div className="bg-bg-subtle px-3 py-2 border-b border-border-default flex items-center gap-1.5 text-xs font-semibold text-text-primary">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Bảng quy chế Phân hạng &amp; Yêu cầu Cọc (BR-REP-01):
            </div>
            <div className="divide-y divide-border-default text-xs">
              <div
                className={`p-3 flex items-center justify-between ${
                  reputation.tier === 'A' ? 'bg-emerald-50/50 font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="rep-a" size="sm">Hạng A</Badge>
                  <span className="text-text-primary">Điểm ≥ 90</span>
                </div>
                <div className="text-emerald-700 font-medium">Miễn cọc (0% phần tiền sân)</div>
                <span className="text-text-secondary">Độ tin cậy tuyệt đối</span>
              </div>

              <div
                className={`p-3 flex items-center justify-between ${
                  reputation.tier === 'B' ? 'bg-blue-50/50 font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="rep-b" size="sm">Hạng B</Badge>
                  <span className="text-text-primary">70 – 89 điểm</span>
                </div>
                <div className="text-blue-700 font-medium">Cọc 30% phần tiền sân</div>
                <span className="text-text-secondary">Mức cọc tiêu chuẩn</span>
              </div>

              <div
                className={`p-3 flex items-center justify-between ${
                  reputation.tier === 'C' ? 'bg-amber-50/50 font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="rep-c" size="sm">Hạng C</Badge>
                  <span className="text-text-primary">50 – 69 điểm</span>
                </div>
                <div className="text-amber-700 font-medium">Cọc 100% phần tiền sân</div>
                <span className="text-text-secondary">Cảnh báo vi phạm</span>
              </div>

              <div
                className={`p-3 flex items-center justify-between ${
                  reputation.tier === 'FLAGGED' ? 'bg-red-50/50 font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="rep-flagged" size="sm">FLAGGED</Badge>
                  <span className="text-text-primary">&lt; 50 điểm</span>
                </div>
                <div className="text-red-700 font-bold">Chặn tham gia phòng ghép kèo</div>
                <span className="text-text-secondary">403 REPUTATION_TOO_LOW</span>
              </div>
            </div>
          </div>

          {/* Interactive Score Simulator for Testing / Demo */}
          <div className="bg-bg-subtle p-3.5 rounded-lg border border-border-default space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-primary" />
                Bộ kiểm thử động điểm uy tín (Simulator):
              </span>
              <span className="text-text-muted">Kéo thanh trượt để thử nghiệm các mốc BR-REP-01</span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={currentUser.reputation_score}
                onChange={(e) => updateScore(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <span className="font-mono font-bold text-sm text-text-primary w-12 text-right">
                {currentUser.reputation_score}đ
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              <button
                onClick={() => updateScore(currentUser.reputation_score + 2)}
                className="px-2.5 py-1 bg-bg-surface border border-border-default rounded hover:bg-bg-subtle text-text-primary transition-colors cursor-pointer"
                title="BR-REP-03: Check-in hoàn thành buổi +2 điểm"
              >
                +2đ (Check-in BR-REP-03)
              </button>
              <button
                onClick={() => updateScore(currentUser.reputation_score - 15)}
                className="px-2.5 py-1 bg-bg-surface border border-status-held/40 rounded hover:bg-red-50 text-status-held transition-colors cursor-pointer"
                title="BR-REP-02: Bùng kèo -15 điểm"
              >
                −15đ (Bùng kèo BR-REP-02)
              </button>
              <button
                onClick={() => updateScore(42)}
                className="px-2.5 py-1 bg-bg-surface border border-border-default rounded hover:bg-bg-subtle text-red-700 transition-colors cursor-pointer"
              >
                Đặt 42đ (Test FLAGGED)
              </button>
              <button
                onClick={() => updateScore(98)}
                className="px-2.5 py-1 bg-bg-surface border border-border-default rounded hover:bg-bg-subtle text-text-secondary transition-colors cursor-pointer ml-auto flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset 98đ
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Test Accounts Switcher (Gate verification for 4 Roles) */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-text-primary">
              Cổng Kiểm Thử 4 Vai Trò RBAC (Gate Verification)
            </h3>
          </div>
          <Badge variant="primary" size="sm">
            WBS-2.2 Gate
          </Badge>
        </div>
        <p className="text-xs text-text-secondary mb-4">
          Nhấp để chuyển nhanh danh tính người dùng nhằm kiểm thử quyền truy cập route tương ứng (HOST, MEMBER, PROVIDER, ADMIN).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TEST_ACCOUNTS.map((acc) => {
            const isCurrent = acc.id === currentUser.id;
            return (
              <div
                key={acc.id}
                onClick={() => switchAccount(acc.id)}
                className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                  isCurrent
                    ? 'border-primary bg-primary-light/50 ring-1 ring-primary'
                    : 'border-border-default bg-bg-surface hover:bg-bg-subtle'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs text-text-primary">{acc.full_name}</span>
                  <Badge
                    variant={
                      acc.role === 'ADMIN'
                        ? 'disputed'
                        : acc.role === 'PROVIDER'
                        ? 'primary'
                        : acc.role === 'HOST'
                        ? 'open'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {acc.role}
                  </Badge>
                </div>
                <div className="text-[11px] text-text-secondary">{acc.description}</div>
                <div className="text-[10px] text-text-muted mt-1 font-mono">{acc.email}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
