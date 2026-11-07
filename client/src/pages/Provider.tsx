import { useEffect, useState, type FormEvent } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Badge, Button, Card, MoneyText } from '../ui';
import type { Provider as ProviderModel } from '../types';

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Provider Portal (UC12 / WBS-5.3)</h1>
          <p className="text-sm text-text-secondary">
            Quản lý lịch slot sân, thực đơn F&B và theo dõi doanh thu giải ngân từ Escrow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="Chọn cơ sở"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-9 rounded-md border border-border-default bg-bg-surface px-3 text-xs font-semibold"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.type}] {p.name}
              </option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={() => loadStats(selectedId)} iconStart={<RefreshCw className="size-3.5" aria-hidden />}>
            Làm mới
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-status-disputed/40 p-4 text-sm font-semibold text-status-disputed" role="alert">
          {error}
        </Card>
      )}

      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="space-y-1">
              <p className="text-xs text-text-secondary">Tổng doanh thu gộp (GMV)</p>
              <p className="text-lg font-bold"><MoneyText amount={stats.gross_revenue} /></p>
            </Card>
            <Card className="space-y-1">
              <p className="text-xs text-text-secondary">Hoa hồng nền tảng ({Math.round((curProvider?.commission_rate || 0.08) * 100)}%)</p>
              <p className="text-lg font-bold"><MoneyText amount={-stats.platform_fee_total} /></p>
            </Card>
            <Card className="space-y-1">
              <p className="text-xs text-text-secondary">Thực nhận về tài khoản (Net)</p>
              <p className="text-lg font-bold text-primary"><MoneyText amount={stats.net_revenue} /></p>
            </Card>
            <Card className="space-y-1">
              <p className="text-xs text-text-secondary">
                {curProvider?.type === 'VENUE' ? 'Slots Trống / Đã đặt' : 'Tổng số món thực đơn'}
              </p>
              <p className="font-mono text-lg font-bold">
                {curProvider?.type === 'VENUE'
                  ? `${stats.slots_available} / ${stats.slots_booked}`
                  : stats.menu_items_total}
              </p>
            </Card>
          </div>

          {curProvider?.type === 'VENUE' ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="space-y-3">
                <h2 className="text-base font-semibold">Thêm khung giờ (Slot) mới</h2>
                <form onSubmit={onAddSlot} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-text-secondary">Bắt đầu</label>
                    <input
                      type="datetime-local"
                      required
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border-default px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-text-secondary">Kết thúc</label>
                    <input
                      type="datetime-local"
                      required
                      value={endAt}
                      onChange={(e) => setEndAt(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border-default px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-text-secondary">Giá sân (VND)</label>
                    <input
                      type="number"
                      required
                      value={slotPrice}
                      onChange={(e) => setSlotPrice(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border-default px-3 py-2"
                    />
                  </div>
                  <Button type="submit" loading={submitting} className="w-full" iconStart={<Plus className="size-4" aria-hidden />}>
                    Tạo Slot
                  </Button>
                </form>
              </Card>

              <Card className="space-y-3 lg:col-span-2">
                <h2 className="text-base font-semibold">Danh sách Slots ({curProvider.slots?.length || 0})</h2>
                <div className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
                  {(curProvider.slots || []).slice(0, 20).map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between rounded-md border border-border-default p-2.5 text-xs">
                      <div>
                        <p className="font-mono font-semibold">{new Date(s.start_at).toLocaleString('vi-VN')}</p>
                        <MoneyText amount={s.price} />
                      </div>
                      <Badge kind={s.status} />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="space-y-3">
                <h2 className="text-base font-semibold">Thêm món F&B mới</h2>
                <form onSubmit={onAddMenu} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-text-secondary">Tên món</label>
                    <input
                      type="text"
                      required
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="Trà sữa Oolong..."
                      className="mt-1 w-full rounded-md border border-border-default px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-text-secondary">Đơn giá (VND)</label>
                    <input
                      type="number"
                      required
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border-default px-3 py-2"
                    />
                  </div>
                  <Button type="submit" loading={submitting} className="w-full" iconStart={<Plus className="size-4" aria-hidden />}>
                    Thêm vào thực đơn
                  </Button>
                </form>
              </Card>

              <Card className="space-y-3 lg:col-span-2">
                <h2 className="text-base font-semibold">Thực đơn hiện tại ({curProvider?.menu_items?.length || 0})</h2>
                <div className="divide-y divide-border-default">
                  {(curProvider?.menu_items || []).map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between py-2.5 text-xs">
                      <div>
                        <p className="font-semibold">{m.name}</p>
                        <MoneyText amount={m.price} />
                      </div>
                      <Button size="sm" variant={m.is_available ? 'secondary' : 'outline'} onClick={() => onToggleMenu(m.id, m.is_available)}>
                        {m.is_available ? 'Đang bán' : 'Tạm ngưng'}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
