import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, ShieldAlert, Ticket, Users } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { categoryImage } from '../lib/imagery';
import { Badge, Button, Card, EmptyState, MoneyText, repGrade } from '../ui';

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
      <div className="mx-auto max-w-md py-6">
        <Card className="space-y-4 p-6 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary-light text-primary" aria-hidden>
            <Ticket className="size-6" />
          </span>
          <h1 className="text-xl font-bold">Bạn được mời vào phòng {code}</h1>
          <p className="text-sm leading-6 text-text-secondary">
            Đăng nhập để kiểm tra điểm uy tín, mức đặt cọc và xác nhận tham gia phòng ghép kèo.
          </p>
          <Button onClick={() => nav('/login', { state: { from: `/join/${code}` } })} className="w-full">
            Đăng nhập để tiếp tục
          </Button>
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-primary">
            <ArrowLeft className="size-3.5" aria-hidden /> Về trang khám phá
          </Link>
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
  const provider = detail?.slot?.provider;
  const memberCount = detail?.members?.length || 1;

  return (
    <div className="mx-auto max-w-4xl space-y-4 py-2">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-primary">
        <ArrowLeft className="size-3.5" aria-hidden /> Về trang khám phá
      </Link>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Card className="overflow-hidden p-0">
            <div className="relative h-40 sm:h-48">
              <img src={categoryImage(provider?.category, provider?.type)} alt="" className="size-full object-cover" />
              <span aria-hidden className="absolute inset-0 bg-scrim" />
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-inverted opacity-80">Lời mời vào phòng</p>
                  <h1 className="mt-0.5 truncate text-2xl font-bold text-text-inverted">#{code}</h1>
                </div>
                {detail?.lobby?.status && <Badge kind={detail.lobby.status} className="bg-bg-surface" />}
              </div>
            </div>

            <div className="space-y-3 p-4 sm:p-5">
              {detail ? (
                <>
                  <div>
                    <h2 className="text-base font-semibold">{provider?.name}</h2>
                    <p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-text-secondary">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-text-muted" aria-hidden />
                      <span className="min-w-0">{provider?.address}</span>
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg bg-bg-subtle p-3">
                      <p className="text-[11px] text-text-muted">Trưởng phòng</p>
                      <p className="mt-0.5 text-sm font-semibold">{detail.host?.full_name}</p>
                    </div>
                    <div className="rounded-lg bg-bg-subtle p-3">
                      <p className="text-[11px] text-text-muted">Sĩ số hiện tại</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold">
                        <Users className="size-3.5 text-text-muted" aria-hidden /> {memberCount} người
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-default pt-3 text-xs">
                    <span className="flex items-center gap-1.5 text-text-secondary">
                      <Clock className="size-3.5 text-text-muted" aria-hidden /> Giá sân theo khung giờ
                    </span>
                    <MoneyText amount={slotPrice} />
                  </div>

                  {memberCount > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-text-muted">Đã tham gia:</span>
                      <span className="flex -space-x-2">
                        {(detail.members || []).slice(0, 5).map((m: any, i: number) => (
                          <span
                            key={m.id ?? i}
                            title={m.full_name}
                            className="grid size-7 place-items-center rounded-full border-2 border-bg-surface bg-primary-light text-[10px] font-bold text-primary"
                          >
                            {(m.full_name || '?').trim().charAt(0).toUpperCase()}
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState title="Không tải được thông tin phòng" description="Mã phòng có thể đã hết hạn hoặc bị hủy." />
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Hạng uy tín của bạn</h2>
              <Badge kind={grade} />
            </div>
            <p className="text-xs text-text-secondary">
              Điểm hiện tại: <strong className="font-mono text-text-primary">{user.reputation_score}/100</strong>
            </p>

            {grade === 'FLAGGED' ? (
              <p className="flex items-start gap-1.5 rounded-md border border-status-disputed bg-bg-subtle p-2.5 text-xs font-semibold text-status-disputed">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                Điểm uy tín dưới 50 hoặc tài khoản bị gắn cờ FLAGGED — không được phép tham gia phòng.
              </p>
            ) : (
              <div className="space-y-1 rounded-lg bg-bg-subtle p-3 text-xs">
                <p className="flex items-center justify-between gap-2 text-text-secondary">
                  <span>Phần sân dự kiến (chia đều 4 người)</span>
                  <MoneyText amount={estShare} />
                </p>
                <p className="flex items-center justify-between gap-2 text-text-secondary">
                  <span>Đặt cọc ({grade === 'A' ? '0%' : grade === 'B' ? '30%' : '100%'})</span>
                  <MoneyText amount={estDeposit} />
                </p>
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-md border border-status-disputed bg-bg-subtle p-3 text-xs font-medium text-status-disputed">
                {error}
              </div>
            )}

            <Button
              className="w-full"
              loading={joining}
              disabled={grade === 'FLAGGED'}
              onClick={onJoin}
              iconStart={<Users className="size-4" aria-hidden />}
            >
              Xác nhận tham gia
            </Button>
            <Link
              to="/"
              className="flex h-10 items-center justify-center rounded-md border border-border-strong bg-bg-surface text-sm font-semibold text-text-primary hover:bg-bg-subtle"
            >
              Hủy
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
