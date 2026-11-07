import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ShieldAlert, Users } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Badge, Button, Card, MoneyText, repGrade } from '../ui';

export default function Join() {
  const { code } = useParams<{ code: string }>();
  const nav = useNavigate();
  const { user } = useAuth();
  const [detail, setDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (!code) return;
    setLoading(true);
    setError(null);
    api<{ success: boolean; data: any }>(`/api/lobbies/${code}`)
      .then((res) => setDetail(res.data))
      .catch((err: any) => setError(err?.message || 'Không tìm thấy phòng ghép kèo'))
      .finally(() => setLoading(false));
  }, [code, user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-8">
        <Card className="space-y-4 text-center">
          <h1 className="text-xl font-bold">Tham gia phòng {code}</h1>
          <p className="text-sm text-text-secondary">
            Bạn cần đăng nhập để kiểm tra điểm uy tín và tham gia phòng ghép kèo.
          </p>
          <Button onClick={() => nav('/login', { state: { from: `/join/${code}` } })} className="w-full">
            Đăng nhập để tiếp tục
          </Button>
        </Card>
      </div>
    );
  }

  const onJoin = async () => {
    if (!code) return;
    setJoining(true);
    setError(null);
    try {
      await api(`/api/lobbies/${code}/join`, { method: 'POST' });
      nav(`/lobby/${code}`, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Không thể tham gia phòng');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return <Card className="mx-auto max-w-md p-8 text-center text-sm text-text-secondary" role="status">Đang tải thông tin phòng {code}...</Card>;
  }

  const grade = repGrade(user.reputation_score);
  const slotPrice = detail?.slot?.price || 120000;
  const estShare = Math.floor(slotPrice / 4);
  const estDeposit = grade === 'A' ? 0 : grade === 'B' ? Math.round((estShare * 30) / 100) : grade === 'C' ? estShare : 0;

  return (
    <div className="mx-auto max-w-md space-y-4 py-6">
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Mời vào phòng #{code}</h1>
          {detail?.lobby?.status && <Badge kind={detail.lobby.status} />}
        </div>

        {detail && (
          <div className="space-y-1.5 rounded-lg bg-bg-subtle p-3 text-xs">
            <p className="font-semibold text-text-primary">{detail.slot?.provider?.name}</p>
            <p className="text-text-secondary">{detail.slot?.provider?.address}</p>
            <p className="text-text-secondary">
              Trưởng phòng: <strong>{detail.host?.full_name}</strong> · Sĩ số hiện tại: {detail.members?.length || 1} người
            </p>
            <p className="text-text-secondary">
              Giá sân: <MoneyText amount={slotPrice} />
            </p>
          </div>
        )}

        {/* Kiểm tra BR-REP-01 */}
        <div className="space-y-2 rounded-lg border border-border-default p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Hạng uy tín của bạn (BR-REP-01):</span>
            <Badge kind={grade} />
          </div>
          <p className="text-text-secondary">Điểm hiện tại: <strong>{user.reputation_score}/100</strong></p>
          {grade === 'FLAGGED' ? (
            <p className="flex items-center gap-1.5 font-semibold text-status-disputed">
              <ShieldAlert className="size-4 shrink-0" aria-hidden />
              Điểm uy tín dưới 50 hoặc tài khoản bị gắn cờ FLAGGED — không được phép tham gia phòng.
            </p>
          ) : (
            <p className="text-text-secondary">
              Mức đặt cọc yêu cầu ({grade === 'A' ? '0%' : grade === 'B' ? '30%' : '100%'} phần sân dự kiến):{' '}
              <MoneyText amount={estDeposit} />
            </p>
          )}
        </div>

        {error && (
          <div role="alert" className="rounded-md border border-status-disputed/30 bg-bg-subtle p-3 text-xs font-medium text-status-disputed">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            className="flex-1"
            loading={joining}
            disabled={grade === 'FLAGGED'}
            onClick={onJoin}
            iconStart={<Users className="size-4" aria-hidden />}
          >
            Xác nhận tham gia
          </Button>
          <Link to="/" className="inline-flex h-10 items-center rounded-md border border-border-strong px-4 text-sm font-semibold">
            Hủy
          </Link>
        </div>
      </Card>
    </div>
  );
}
