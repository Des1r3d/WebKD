import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Lock, MapPin, PlusCircle, Unlock } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Badge, Button, Card, Countdown, MoneyText } from '../ui';
import type { MenuItem, Provider, Slot } from '../types';

type ProviderDetail = Provider & { slots?: Slot[]; menu_items?: MenuItem[] };

export default function Venue() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { user } = useAuth();
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [busySlotId, setBusySlotId] = useState<string | null>(null);
  const [creatingLobbySlotId, setCreatingLobbySlotId] = useState<string | null>(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api<{ success: boolean; data: ProviderDetail }>(`/api/providers/${id}`)
      .then((res) => setProvider(res.data))
      .catch((err: any) => setError(err?.message || 'Không thể tải thông tin địa điểm'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const onLockSlot = async (slotId: string) => {
    if (!user) {
      nav('/login', { state: { from: `/venues/${id}` } });
      return;
    }
    setBusySlotId(slotId);
    setActionMsg(null);
    try {
      await api(`/api/slots/${slotId}/lock`, { method: 'POST' });
      setActionMsg('Đã khóa giữ chỗ slot trong 10 phút (BR-SLT-01). Hãy bấm "Mở phòng ghép kèo"!');
      load();
    } catch (err: any) {
      setActionMsg(`Lỗi khóa slot: ${err?.message || 'Khung giờ đã có người giữ'}`);
      load();
    } finally {
      setBusySlotId(null);
    }
  };

  const onReleaseSlot = async (slotId: string) => {
    setBusySlotId(slotId);
    setActionMsg(null);
    try {
      await api(`/api/slots/${slotId}/release`, { method: 'POST' });
      setActionMsg('Đã trả lại slot về trạng thái Trống (AVAILABLE).');
      load();
    } catch (err: any) {
      setActionMsg(`Lỗi giải phóng slot: ${err?.message}`);
    } finally {
      setBusySlotId(null);
    }
  };

  const onCreateLobby = async (slotId: string) => {
    setCreatingLobbySlotId(slotId);
    setActionMsg(null);
    try {
      const res = await api<{ success: boolean; data: { lobby: { invite_code: string } } }>('/api/lobbies', {
        method: 'POST',
        body: { slotId },
      });
      nav(`/lobby/${res.data.lobby.invite_code}`);
    } catch (err: any) {
      setActionMsg(`Không thể mở phòng: ${err?.message}`);
    } finally {
      setCreatingLobbySlotId(null);
    }
  };

  if (loading) {
    return <Card className="p-8 text-center text-sm text-text-secondary" role="status">Đang tải chi tiết địa điểm...</Card>;
  }

  if (error || !provider) {
    return (
      <Card className="space-y-3 border-status-disputed/40 p-6 text-center" role="alert">
        <p className="text-sm font-semibold text-status-disputed">{error || 'Không tìm thấy địa điểm'}</p>
        <Link to="/" className="text-xs font-semibold text-primary hover:underline">← Quay lại bản đồ</Link>
      </Card>
    );
  }

  const slots = (provider.slots || []).slice(0, 24);
  const menuItems = provider.menu_items || [];

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-primary">
        <ArrowLeft className="size-3.5" aria-hidden /> Quay lại khám phá
      </Link>

      <Card className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary">
            {provider.type} · {provider.category}
          </span>
          <span className="text-xs text-text-muted">Hoa hồng nền tảng: {Math.round(provider.commission_rate * 100)}%</span>
        </div>
        <h1 className="text-2xl font-bold">{provider.name}</h1>
        <p className="flex items-center gap-1.5 text-sm text-text-secondary">
          <MapPin className="size-4 text-text-muted" aria-hidden /> {provider.address}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-text-muted">
          <Clock className="size-3.5" aria-hidden /> Giờ mở cửa: {provider.open_hours}
        </p>
      </Card>

      {actionMsg && (
        <div role="status" className="rounded-lg border border-border-strong bg-bg-surface p-3 text-sm font-medium">
          {actionMsg}
        </div>
      )}

      {provider.type === 'VENUE' ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Danh sách khung giờ (Slots)</h2>
          {slots.length === 0 ? (
            <Card className="p-6 text-center text-sm text-text-secondary">Chưa có khung giờ nào.</Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {slots.map((s) => {
                const start = new Date(s.start_at);
                const end = new Date(s.end_at);
                const isMine = user && s.status === 'LOCKED' && s.locked_by === user.id;
                return (
                  <Card key={s.id} className="flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge kind={s.status} />
                        <MoneyText amount={s.price} />
                      </div>
                      <p className="font-mono text-sm font-semibold">
                        {start.toLocaleDateString('vi-VN')} ·{' '}
                        {start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {s.status === 'LOCKED' && s.locked_until && (
                        <p className="text-xs text-text-secondary">
                          Giữ chỗ còn: <Countdown until={s.locked_until} onExpire={load} />
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {s.status === 'AVAILABLE' && (
                        <Button
                          size="sm"
                          className="w-full"
                          loading={busySlotId === s.id}
                          onClick={() => onLockSlot(s.id)}
                          iconStart={<Lock className="size-3.5" aria-hidden />}
                        >
                          Khóa giữ chỗ 10 phút
                        </Button>
                      )}

                      {isMine && (
                        <>
                          <Button
                            size="sm"
                            className="flex-1"
                            loading={creatingLobbySlotId === s.id}
                            onClick={() => onCreateLobby(s.id)}
                            iconStart={<PlusCircle className="size-3.5" aria-hidden />}
                          >
                            Mở phòng ghép kèo
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            loading={busySlotId === s.id}
                            onClick={() => onReleaseSlot(s.id)}
                            iconStart={<Unlock className="size-3.5" aria-hidden />}
                          >
                            Nhả
                          </Button>
                        </>
                      )}

                      {s.status === 'LOCKED' && !isMine && (
                        <Button size="sm" variant="outline" disabled className="w-full">
                          Đang có người giữ
                        </Button>
                      )}

                      {s.status === 'BOOKED' && (
                        <Button size="sm" variant="outline" disabled className="w-full">
                          Đã đặt thành công
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Thực đơn F&B ({menuItems.length} món)</h2>
          <p className="text-xs text-text-secondary">
            Để đặt chung, hãy vào một phòng ghép kèo đang mở và thêm món từ danh sách gợi ý F&B.
          </p>
          {menuItems.length === 0 ? (
            <Card className="p-6 text-center text-sm text-text-secondary">Quán chưa cập nhật thực đơn.</Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {menuItems.map((m) => (
                <Card key={m.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-xs text-text-muted">{m.order_count} lượt gọi</p>
                  </div>
                  <MoneyText amount={m.price} />
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
