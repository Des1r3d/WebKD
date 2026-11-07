import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Info, Lock, MapPin, PlusCircle, ShieldCheck, Unlock } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { categoryImage, categoryLabel } from '../lib/imagery';
import { Badge, Button, Card, Countdown, EmptyState, MoneyText, PageHeader } from '../ui';
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
      <Card className="space-y-3 border-status-disputed p-6 text-center" role="alert">
        <p className="text-sm font-semibold text-status-disputed">{error || 'Không tìm thấy địa điểm'}</p>
        <Link to="/" className="text-xs font-semibold text-primary hover:underline">← Quay lại bản đồ</Link>
      </Card>
    );
  }

  const slots = (provider.slots || []).slice(0, 24);
  const menuItems = provider.menu_items || [];

  const byDay = new Map<string, Slot[]>();
  for (const s of slots) {
    const key = new Date(s.start_at).toDateString();
    const list = byDay.get(key) ?? [];
    list.push(s);
    byDay.set(key, list);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={provider.name}
        back={
          <Link to="/" className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-primary">
            <ArrowLeft className="size-3.5" aria-hidden /> Quay lại khám phá
          </Link>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-text-muted" aria-hidden /> {provider.address}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5 text-text-muted" aria-hidden /> {provider.open_hours}</span>
          </span>
        }
        actions={
          <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
            {provider.type === 'VENUE' ? 'Sân / Phòng' : 'Quán F&B'} · {categoryLabel(provider.category)}
          </span>
        }
      />

      <Card className="overflow-hidden p-0">
        <div className="relative h-44 sm:h-56">
          <img src={categoryImage(provider.category, provider.type)} alt="" className="size-full object-cover" />
          <div aria-hidden className="absolute inset-0 bg-scrim" />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-4 sm:p-6">
            <div className="text-text-inverted">
              <p className="text-xs font-medium text-text-inverted">Hoa hồng nền tảng {Math.round(provider.commission_rate * 100)}%</p>
              <p className="mt-1 text-lg font-bold text-text-inverted">
                {provider.type === 'VENUE' ? 'Đặt sân theo khung giờ' : 'Thực đơn gọi chung cho phòng ghép kèo'}
              </p>
            </div>
            <span className="rounded-full bg-bg-surface px-3 py-1 text-xs font-semibold text-text-primary">
              {provider.type === 'VENUE' ? `${slots.length} khung giờ` : `${menuItems.length} món`}
            </span>
          </div>
        </div>
      </Card>

      {actionMsg && (
        <div role="status" className="rounded-lg border border-border-strong bg-bg-surface p-3 text-sm font-medium text-text-primary">
          {actionMsg}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {provider.type === 'VENUE' ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-lg font-semibold">Chọn khung giờ</h2>
                <p className="text-xs text-text-secondary">Giữ chỗ 10 phút trước khi mở phòng (BR-SLT-01)</p>
              </div>

              {slots.length === 0 ? (
                <EmptyState icon={<Clock className="size-5" />} title="Chưa có khung giờ nào" description="Địa điểm này chưa cập nhật lịch. Quay lại sau hoặc chọn sân khác quanh khu vực." />
              ) : (
                <div className="space-y-6">
                  {Array.from(byDay.entries()).map(([day, daySlots]) => (
                    <div key={day} className="space-y-2">
                      <h3 className="text-xs font-semibold text-text-secondary">
                        {new Date(day).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                        <span className="ml-2 font-normal text-text-muted">{daySlots.length} khung giờ</span>
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {daySlots.map((s) => {
                          const start = new Date(s.start_at);
                          const end = new Date(s.end_at);
                          const isMine = user && s.status === 'LOCKED' && s.locked_by === user.id;
                          return (
                            <Card key={s.id} className="flex flex-col justify-between gap-3">
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-mono text-base font-semibold text-text-primary">
                                    {start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} – {end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                  <Badge kind={s.status} />
                                </div>
                                <MoneyText amount={s.price} />
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
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-lg font-semibold">Thực đơn F&amp;B ({menuItems.length} món)</h2>
                <p className="text-xs text-text-secondary">Thêm món từ gợi ý trong phòng ghép kèo đang mở</p>
              </div>
              <p className="text-xs leading-5 text-text-secondary">
                Để đặt chung, hãy vào một phòng ghép kèo đang mở và thêm món từ danh sách gợi ý F&amp;B.
              </p>
              {menuItems.length === 0 ? (
                <EmptyState icon={<Info className="size-5" />} title="Quán chưa cập nhật thực đơn" description="Bạn vẫn có thể gợi ý quán này cho phòng ghép kèo nếu quán nằm trong bán kính gợi ý." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {menuItems.map((m) => (
                    <Card key={m.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{m.name}</p>
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

        <aside className="space-y-4">
          <Card className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="size-4 text-primary" aria-hidden /> Chính sách giữ chỗ
            </h2>
            <ul className="space-y-2.5 text-xs leading-5 text-text-secondary">
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                Slot được giữ tối đa 10 phút và tự nhả nếu hết hạn (BR-SLT-01).
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                Mức cọc theo hạng uy tín: Hạng A 0%, Hạng B 30%, Hạng C 100% tiền sân.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                Tiền được giữ trong Escrow và chỉ giải ngân sau khi check-in.
              </li>
            </ul>
          </Card>

          <Card className="space-y-2">
            <h2 className="text-sm font-semibold">Bạn cần mở phòng?</h2>
            <p className="text-xs leading-5 text-text-secondary">
              Sau khi khoá slot, bấm “Mở phòng ghép kèo” để nhận mã mời và bắt đầu gọi đồ chung.
            </p>
            <Link to="/" className="inline-flex text-xs font-semibold text-primary hover:underline">
              Xem các địa điểm khác
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
