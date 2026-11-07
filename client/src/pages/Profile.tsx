import { useAuth } from '../lib/auth';
import { Badge, Card, MemberAvatar, repGrade } from '../ui';

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  const grade = repGrade(user.reputation_score);
  const depositPercent = grade === 'A' ? 0 : grade === 'B' ? 30 : grade === 'C' ? 100 : 100;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Hồ sơ & Hạng Uy Tín (BR-REP-01..03)</h1>

      <Card className="flex items-center gap-4">
        <MemberAvatar name={user.full_name} score={user.reputation_score} className="[&>*]:size-14" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">{user.full_name}</h2>
            <Badge kind={grade} />
          </div>
          <p className="text-xs text-text-secondary">{user.email} · {user.phone}</p>
          <p className="text-xs text-text-muted">Vai trò: <strong>{user.role}</strong> · Trạng thái: <strong>{user.status}</strong></p>
        </div>
      </Card>

      <Card className="space-y-3">
        <h3 className="text-base font-semibold">Quyền lợi & Mức đặt cọc hiện tại</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-bg-subtle p-3">
            <div className="text-text-muted">Điểm uy tín</div>
            <div className="mt-1 font-mono text-xl font-bold text-primary">{user.reputation_score} / 100</div>
          </div>
          <div className="rounded-lg bg-bg-subtle p-3">
            <div className="text-text-muted">Tỷ lệ cọc tiền sân khi vào phòng</div>
            <div className="mt-1 font-mono text-xl font-bold">{depositPercent}%</div>
          </div>
        </div>

        <ul className="list-disc space-y-1 pl-5 text-xs text-text-secondary">
          <li><strong>Hạng A (90–100đ):</strong> Miễn đặt cọc 0%.</li>
          <li><strong>Hạng B (70–89đ):</strong> Đặt cọc 30% phần tiền sân dự kiến.</li>
          <li><strong>Hạng C (50–69đ):</strong> Đặt cọc 100% phần tiền sân dự kiến.</li>
          <li><strong>Dưới 50đ (FLAGGED):</strong> Bị chặn tham gia phòng ghép kèo.</li>
          <li>Check-in đúng giờ: <strong>+2 điểm</strong> · Bùng kèo (NO_SHOW): <strong>-15 điểm & mất cọc</strong>.</li>
        </ul>
      </Card>
    </div>
  );
}
