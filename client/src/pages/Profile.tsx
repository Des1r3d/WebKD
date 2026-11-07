import { Link } from 'react-router-dom';
import { Award, CalendarCheck2, ShieldAlert, UserX, Wallet } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Badge, Card, MemberAvatar, PageHeader, StatCard, repGrade } from '../ui';

const TIERS = [
  { grade: 'A' as const, range: '90 – 100 điểm', deposit: '0%', note: 'Miễn đặt cọc, vào phòng ngay' },
  { grade: 'B' as const, range: '70 – 89 điểm', deposit: '30%', note: 'Cọc 30% phần tiền sân dự kiến' },
  { grade: 'C' as const, range: '50 – 69 điểm', deposit: '100%', note: 'Cọc toàn bộ phần tiền sân dự kiến' },
  { grade: 'FLAGGED' as const, range: 'Dưới 50 điểm', deposit: '—', note: 'Bị chặn tham gia phòng ghép kèo' },
];

const ROLE_LABEL: Record<string, string> = {
  HOST: 'Trưởng phòng',
  MEMBER: 'Thành viên',
  PROVIDER: 'Đối tác',
  ADMIN: 'Quản trị viên',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  FLAGGED: 'Bị gắn cờ',
  SUSPENDED: 'Tạm khoá',
  BANNED: 'Bị khoá',
};

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  const score = user.reputation_score;
  const grade = repGrade(score);
  const depositPercent = grade === 'A' ? 0 : grade === 'B' ? 30 : grade === 'C' ? 100 : 100;

  // Tiến độ tới hạng kế tiếp (theo ngưỡng BR-REP-01)
  const nextAt = grade === 'A' ? null : grade === 'B' ? 90 : grade === 'C' ? 70 : 50;
  const floorAt = grade === 'A' ? 90 : grade === 'B' ? 70 : grade === 'C' ? 50 : 0;
  const progress = nextAt === null ? 100 : Math.max(0, Math.min(100, Math.round(((score - floorAt) / (nextAt - floorAt)) * 100)));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hồ sơ & hạng uy tín"
        description="Điểm uy tín quyết định mức đặt cọc khi vào phòng ghép kèo (BR-REP-01 → BR-REP-03)."
        actions={
          <>
            <Link
              to="/wallet"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong bg-bg-surface px-4 text-sm font-semibold text-text-primary hover:bg-bg-subtle"
            >
              <Wallet className="size-4" aria-hidden /> Ví &amp; Escrow
            </Link>
            <Link
              to="/disputes"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-text-inverted hover:bg-primary-hover"
            >
              <ShieldAlert className="size-4" aria-hidden /> Khiếu nại
            </Link>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="flex flex-wrap items-center gap-4">
          <MemberAvatar name={user.full_name} score={score} className="[&>span:first-child]:size-16 [&>span:first-child]:text-lg [&>span:last-child]:size-5" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold leading-7">{user.full_name}</h2>
              <Badge kind={grade} />
            </div>
            <p className="mt-1 truncate text-xs text-text-secondary">
              {user.email} · {user.phone}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="rounded-full bg-bg-subtle px-2 py-0.5 font-semibold text-text-secondary">
                {ROLE_LABEL[user.role] ?? user.role}
              </span>
              <span className="rounded-full bg-bg-subtle px-2 py-0.5 font-semibold text-text-secondary">{STATUS_LABEL[user.status] ?? user.status}</span>
              <span className="rounded-full bg-primary-light px-2 py-0.5 font-semibold text-primary">Thành viên SyncHub</span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Điểm uy tín" value={<span className="font-mono">{score}/100</span>} icon={<Award className="size-4" aria-hidden />} />
          <StatCard
            label="Mức đặt cọc"
            value={<span className="font-mono">{depositPercent}%</span>}
            icon={<Wallet className="size-4" aria-hidden />}
            tone={depositPercent === 0 ? 'positive' : depositPercent === 30 ? 'warning' : 'danger'}
          />
        </div>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Tiến độ hạng uy tín</h2>
          <span className="text-xs text-text-secondary">
            {nextAt === null ? 'Bạn đang ở hạng cao nhất' : `Còn ${Math.max(0, nextAt - score)} điểm để lên hạng tiếp theo`}
          </span>
        </div>

        <div>
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-bg-subtle"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label={`Tiến độ tới hạng tiếp theo: ${progress}%`}
          >
            <div
              className={`h-full rounded-full ${grade === 'A' ? 'bg-primary' : grade === 'B' ? 'bg-accent' : grade === 'C' ? 'bg-status-cancelled' : 'bg-status-disputed'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[11px] text-text-muted">
            <span>{floorAt}đ</span>
            <span>{nextAt === null ? '100đ' : `${nextAt}đ`}</span>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-start gap-2 rounded-lg bg-bg-subtle p-3">
            <CalendarCheck2 className="mt-0.5 size-4 shrink-0 text-status-completed" aria-hidden />
            <p className="text-xs leading-5 text-text-secondary">Check-in đúng giờ: <strong className="text-text-primary">+2 điểm</strong> mỗi buổi.</p>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-bg-subtle p-3">
            <UserX className="mt-0.5 size-4 shrink-0 text-status-cancelled" aria-hidden />
            <p className="text-xs leading-5 text-text-secondary">Bùng kèo (NO_SHOW): <strong className="text-text-primary">-15 điểm</strong> và mất tiền cọc.</p>
          </div>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <h2 className="mb-3 text-base font-semibold">Quyền lợi theo từng hạng</h2>
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead>
            <tr className="border-b border-border-default text-text-secondary">
              <th className="py-2 pr-2 font-medium">Hạng</th>
              <th className="px-2 py-2 font-medium">Khoảng điểm</th>
              <th className="px-2 py-2 font-medium">Đặt cọc</th>
              <th className="py-2 pl-2 font-medium">Quyền tham gia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {TIERS.map((t) => {
              const current = t.grade === grade;
              return (
                <tr key={t.grade} className={current ? 'bg-primary-light' : undefined}>
                  <td className="py-2.5 pr-2">
                    <span className="inline-flex items-center gap-2">
                      <Badge kind={t.grade} />
                      {current && <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">Hiện tại</span>}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 font-mono text-text-secondary">{t.range}</td>
                  <td className="px-2 py-2.5 font-mono font-semibold text-text-primary">{t.deposit}</td>
                  <td className="py-2.5 pl-2 text-text-secondary">{t.note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
