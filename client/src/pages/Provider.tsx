import { useEffect, useState, type FormEvent } from 'react';
import { CalendarPlus, Percent, Plus, RefreshCw, Store, TrendingUp, UtensilsCrossed, Wallet } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Badge, Button, Card, EmptyState, MoneyText, PageHeader, StatCard } from '../ui';
import type { Provider as ProviderModel } from '../types';

const FIELD =
  'mt-1 h-10 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none';

export default function Provider() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<ProviderModel[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form thêm slot
  const [startAt, setStartAt] = useState('2026-11-10T18:00');
  const [endAt, setEndAt] = useState('2026-11-10T19:00');
  const [slotPrice, setSlotPrice] = useState('120000');

  // Form thêm món
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('30000');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api<{ success: boolean; data: ProviderModel[] }>('/api/providers?radius=10000')
      .then((res) => {
        const list = res.data || [];
        const mine = list.filter((p) => p.owner_id === user?.id);
        const target = mine.length > 0 ? mine : list;
        setProviders(target);
        if (target[0]) setSelectedId(target[0].id);
      })
      .catch((err: any) => setError(err?.message || 'Không thể tải danh sách cơ sở'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const loadStats = async (pid: string) => {
    if (!pid) return;
    setError(null);
    try {
      const res = await api<{ success: boolean; data: any }>(`/api/providers/${pid}/stats`);
      setStats(res.data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải số liệu doanh thu');
    }
  };

  useEffect(() => {
    if (selectedId) loadStats(selectedId);
  }, [selectedId]);

  const onAddSlot = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await api(`/api/providers/${selectedId}/slots`, {
        method: 'POST',
        body: {
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          price: Number(slotPrice),
        },
      });
      await loadStats(selectedId);
    } catch (err: any) {
      alert(err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onAddMenu = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedId || !itemName.trim()) return;
    setSubmitting(true);
    try {
      await api(`/api/providers/${selectedId}/menu`, {
        method: 'POST',
        body: { name: itemName.trim(), price: Number(itemPrice) },
      });
      setItemName('');
      await loadStats(selectedId);
    } catch (err: any) {
      alert(err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onToggleMenu = async (itemId: string, cur: boolean) => {
    if (!selectedId) return;
    await api(`/api/providers/${selectedId}/menu/${itemId}`, {
      method: 'PATCH',
      body: { isAvailable: !cur },
    });
    await loadStats(selectedId);
  };

  if (loading) {
    return <Card className="p-8 text-center text-sm text-text-secondary" role="status">Đang tải Portal đối tác...</Card>;
  }

  const curProvider = stats?.provider;
  const isVenue = curProvider?.type === 'VENUE';
  const commission = Math.round((curProvider?.commission_rate || 0.08) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portal đối tác"
        description="Quản lý lịch slot sân, thực đơn F&B và theo dõi doanh thu giải ngân từ Escrow (UC12)."
        actions={
          <>
            <select
              aria-label="Chọn cơ sở"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="h-10 max-w-[320px] rounded-md border border-border-default bg-bg-surface px-3 text-xs font-semibold text-text-primary focus:border-primary focus:outline-none"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.type}] {p.name}
                </option>
              ))}
            </select>
            <Button size="md" variant="outline" onClick={() => loadStats(selectedId)} iconStart={<RefreshCw className="size-4" aria-hidden />}>
              Làm mới
            </Button>
          </>
        }
      />

      {error && (
        <Card className="border-status-disputed p-4 text-sm font-semibold text-status-disputed" role="alert">
          {error}
        </Card>
      )}

      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Tổng doanh thu gộp (GMV)"
              value={<MoneyText amount={stats.gross_revenue} />}
              icon={<TrendingUp className="size-4" aria-hidden />}
            />
            <StatCard
              label={`Hoa hồng nền tảng (${commission}%)`}
              value={<MoneyText amount={-stats.platform_fee_total} className="text-text-primary" />}
              icon={<Percent className="size-4" aria-hidden />}
              tone="warning"
            />
            <StatCard
              label="Thực nhận về tài khoản (Net)"
              value={<MoneyText amount={stats.net_revenue} />}
              icon={<Wallet className="size-4" aria-hidden />}
              tone="positive"
            />
            <StatCard
              label={isVenue ? 'Slots trống / đã đặt' : 'Tổng số món thực đơn'}
              value={
                <span className="font-mono">
                  {isVenue ? `${stats.slots_available} / ${stats.slots_booked}` : stats.menu_items_total}
                </span>
              }
              icon={isVenue ? <Store className="size-4" aria-hidden /> : <UtensilsCrossed className="size-4" aria-hidden />}
            />
          </div>

          {isVenue ? (
            <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              <Card className="space-y-3 self-start">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-primary-light text-primary" aria-hidden>
                    <CalendarPlus className="size-4" />
                  </span>
                  <h2 className="text-base font-semibold">Thêm khung giờ mới</h2>
                </div>
                <form onSubmit={onAddSlot} className="space-y-3">
                  <div>
                    <label htmlFor="slot-start" className="block text-xs font-semibold text-text-secondary">Bắt đầu</label>
                    <input
                      id="slot-start"
                      type="datetime-local"
                      required
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                      className={FIELD}
                    />
                  </div>
                  <div>
                    <label htmlFor="slot-end" className="block text-xs font-semibold text-text-secondary">Kết thúc</label>
                    <input
                      id="slot-end"
                      type="datetime-local"
                      required
                      value={endAt}
                      onChange={(e) => setEndAt(e.target.value)}
                      className={FIELD}
                    />
                  </div>
                  <div>
                    <label htmlFor="slot-price" className="block text-xs font-semibold text-text-secondary">Giá sân (VND)</label>
                    <input
                      id="slot-price"
                      type="number"
                      required
                      value={slotPrice}
                      onChange={(e) => setSlotPrice(e.target.value)}
                      className={FIELD}
                    />
                  </div>
                  <Button type="submit" loading={submitting} className="w-full" iconStart={<Plus className="size-4" aria-hidden />}>
                    Tạo slot
                  </Button>
                </form>
              </Card>

              <Card className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold">Danh sách slots</h2>
                  <span className="text-xs text-text-secondary">{curProvider?.slots?.length || 0} khung giờ</span>
                </div>

                {(curProvider?.slots?.length || 0) === 0 ? (
                  <EmptyState title="Chưa có khung giờ nào" description="Tạo slot đầu tiên để thành viên có thể chọn và khoá chỗ." />
                ) : (
                  <div className="max-h-96 overflow-x-auto overflow-y-auto">
                    <table className="w-full min-w-[420px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-border-default text-text-secondary">
                          <th className="py-2 pr-2 font-medium">Thời gian bắt đầu</th>
                          <th className="px-2 py-2 text-right font-medium">Giá sân</th>
                          <th className="py-2 pl-2 text-right font-medium">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {(curProvider?.slots || []).slice(0, 20).map((s: any) => (
                          <tr key={s.id}>
                            <td className="py-2.5 pr-2 font-mono text-[11px] text-text-primary">
                              {new Date(s.start_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </td>
                            <td className="px-2 py-2.5 text-right"><MoneyText amount={s.price} /></td>
                            <td className="py-2.5 pl-2 text-right"><Badge kind={s.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              <Card className="space-y-3 self-start">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-accent-light text-accent" aria-hidden>
                    <UtensilsCrossed className="size-4" />
                  </span>
                  <h2 className="text-base font-semibold">Thêm món F&amp;B mới</h2>
                </div>
                <form onSubmit={onAddMenu} className="space-y-3">
                  <div>
                    <label htmlFor="menu-name" className="block text-xs font-semibold text-text-secondary">Tên món</label>
                    <input
                      id="menu-name"
                      type="text"
                      required
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="Trà sữa Oolong..."
                      className={FIELD}
                    />
                  </div>
                  <div>
                    <label htmlFor="menu-price" className="block text-xs font-semibold text-text-secondary">Đơn giá (VND)</label>
                    <input
                      id="menu-price"
                      type="number"
                      required
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      className={FIELD}
                    />
                  </div>
                  <Button type="submit" loading={submitting} className="w-full" iconStart={<Plus className="size-4" aria-hidden />}>
                    Thêm vào thực đơn
                  </Button>
                </form>
              </Card>

              <Card className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold">Thực đơn hiện tại</h2>
                  <span className="text-xs text-text-secondary">{curProvider?.menu_items?.length || 0} món</span>
                </div>

                {(curProvider?.menu_items?.length || 0) === 0 ? (
                  <EmptyState title="Thực đơn đang trống" description="Thêm món đầu tiên để thành viên gọi đồ ngay trong phòng ghép kèo." />
                ) : (
                  <div className="divide-y divide-border-default">
                    {(curProvider?.menu_items || []).map((m: any) => (
                      <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-xs">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-text-primary">{m.name}</p>
                          <MoneyText amount={m.price} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.is_available ? 'bg-primary-light text-primary' : 'bg-bg-subtle text-text-muted'}`}>
                            {m.is_available ? 'Đang bán' : 'Tạm ngưng'}
                          </span>
                          <Button size="sm" variant={m.is_available ? 'secondary' : 'outline'} onClick={() => onToggleMenu(m.id, m.is_available)}>
                            {m.is_available ? 'Tạm ngưng' : 'Mở bán'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
