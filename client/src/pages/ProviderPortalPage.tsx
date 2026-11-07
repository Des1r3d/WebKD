import React, { useState, useEffect } from 'react';
import {
  Store,
  CalendarPlus,
  Coffee,
  TrendingUp,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  MoneyText,
} from '../components';
import {
  MOCK_SLOTS,
  MOCK_MENU_ITEMS,
  SlotStatus,
  type Slot,
  type MenuItem,
} from '../lib/mockData';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../lib/api';

const WEEKLY_REVENUE = [
  { day: 'T2', venue: 840000, fnb: 520000 },
  { day: 'T3', venue: 960000, fnb: 610000 },
  { day: 'T4', venue: 1080000, fnb: 740000 },
  { day: 'T5', venue: 960000, fnb: 680000 },
  { day: 'T6', venue: 1320000, fnb: 950000 },
  { day: 'T7', venue: 1680000, fnb: 1280000 },
  { day: 'CN', venue: 1800000, fnb: 1420000 },
];

export const ProviderPortalPage: React.FC = () => {
  const { token } = useAuth();
  const [slots, setSlots] = useState<Slot[]>(MOCK_SLOTS);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MOCK_MENU_ITEMS);
  const [newMenuName, setNewMenuName] = useState<string>('');
  const [newMenuPrice, setNewMenuPrice] = useState<number>(28000);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/providers/prv-venue-01/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data) {
            setStats(json.data);
          }
        }
      } catch {
        // Fallback
      }
    };
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleAddSlot = async () => {
    const nextSlotPayload = {
      startAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      endAt: new Date(Date.now() + 25 * 3600 * 1000).toISOString(),
      price: 120000,
    };

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/providers/prv-venue-01/slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(nextSlotPayload),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setSlots((prev) => [...prev, json.data]);
          return;
        }
      }
    } catch {
      // Fallback
    }

    const nextSlot: Slot = {
      id: `slt-${Date.now()}`,
      provider_id: 'prv-venue-01',
      start_at: '2026-11-08T22:00:00+07:00',
      end_at: '2026-11-08T23:00:00+07:00',
      price: 100000,
      status: SlotStatus.AVAILABLE,
    };
    setSlots((prev) => [...prev, nextSlot]);
  };

  const handleToggleMenuAvailability = async (id: string) => {
    const target = menuItems.find((m) => m.id === id);
    const nextVal = !target?.is_available;

    try {
      await fetch(`${getApiBaseUrl()}/api/providers/prv-fnb-01/menu/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: nextVal }),
      });
    } catch {
      // Fallback
    }

    setMenuItems((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_available: nextVal } : m))
    );
  };

  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName.trim()) return;

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/providers/prv-fnb-01/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newMenuName.trim(),
          price: newMenuPrice,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setMenuItems((prev) => [...prev, json.data]);
          setNewMenuName('');
          return;
        }
      }
    } catch {
      // Fallback
    }

    setMenuItems((prev) => [
      ...prev,
      {
        id: `mnu-${Date.now()}`,
        provider_id: 'prv-fnb-01',
        name: newMenuName.trim(),
        price: newMenuPrice,
        is_available: true,
        order_count: 1,
      },
    ]);
    setNewMenuName('');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span>Doanh thu ròng VENUE (Sau 8% phí)</span>
            <Store className="w-4 h-4 text-primary" />
          </div>
          <MoneyText amount={stats?.net_revenue ?? 7948800} size="xl" variant="primary" />
          <p className="text-[11px] text-text-muted mt-1">
            Sân Cầu Lông NVH Sinh Viên · 7 ngày qua
          </p>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span>Doanh thu ròng F&amp;B (Sau 12% phí)</span>
            <Coffee className="w-4 h-4 text-accent" />
          </div>
          <MoneyText amount={5456000} size="xl" />
          <p className="text-[11px] text-text-muted mt-1">
            Phúc Long KTX Khu B · 7 ngày qua
          </p>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span>Tỷ lệ lấp đầy Slot &amp; Đơn ghép</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-text-primary">86.4%</div>
          <p className="text-[11px] text-text-muted mt-1">
            +24% đơn nước nhờ gợi ý bán chéo ≤ 1km
          </p>
        </Card>
      </div>

      {/* Revenue Bar Chart (7 Days) */}
      <Card padding="md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Biểu Đồ Doanh Thu 7 Ngày (VENUE vs F&amp;B)</span>
            </CardTitle>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-primary inline-block" /> VENUE (8% phí)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-accent inline-block" /> F&amp;B (12% phí)
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-7 gap-3 items-end h-44 pt-4 px-2 border-b border-border-default">
            {WEEKLY_REVENUE.map((d) => {
              const vHeight = Math.round((d.venue / 1800000) * 100);
              const fHeight = Math.round((d.fnb / 1800000) * 100);
              return (
                <div key={d.day} className="flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1.5 h-32">
                    <div
                      style={{ height: `${vHeight}%` }}
                      title={`VENUE: ${d.venue.toLocaleString('vi-VN')}đ`}
                      className="w-3 sm:w-5 bg-primary rounded-t-sm"
                    />
                    <div
                      style={{ height: `${fHeight}%` }}
                      title={`FNB: ${d.fnb.toLocaleString('vi-VN')}đ`}
                      className="w-3 sm:w-5 bg-accent rounded-t-sm"
                    />
                  </div>
                  <span className="text-xs font-mono font-semibold text-text-secondary pb-2">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2 Columns: Slot Management & Menu Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Cols: Venue Slot Manager */}
        <div className="lg:col-span-6">
          <Card padding="md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarPlus className="w-4 h-4 text-primary" />
                  <span>Quản Lý Khung Giờ Sân (`POST /api/providers/:id/slots`)</span>
                </CardTitle>
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddSlot}
                >
                  Thêm Slot 22:00
                </Button>
              </div>
              <CardDescription>
                Chủ sân mở/đóng lịch và theo dõi trạng thái khóa 10 phút realtime.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2.5">
              {slots.map((s) => {
                const start = new Date(s.start_at).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const end = new Date(s.end_at).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div
                    key={s.id}
                    className="p-3 rounded-lg border border-border-default bg-bg-subtle/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-text-primary">
                        {start} – {end}
                      </span>
                      <span className="mx-2 text-text-muted">·</span>
                      <MoneyText amount={s.price} size="sm" />
                    </div>
                    <Badge
                      variant={
                        s.status === SlotStatus.AVAILABLE
                          ? 'available'
                          : s.status === SlotStatus.LOCKED
                          ? 'locked'
                          : 'paid'
                      }
                      size="sm"
                    >
                      {s.status}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right 6 Cols: F&B Menu Manager */}
        <div className="lg:col-span-6">
          <Card padding="md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-accent" />
                <span>Quản Lý Thực Đơn F&amp;B (`POST /api/providers/:id/menu`)</span>
              </CardTitle>
              <CardDescription>
                Cập nhật giá và trạng thái còn hàng (<code className="font-mono">is_available</code>).
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <form onSubmit={handleAddMenu} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  placeholder="Tên món mới (VD: Trà Ô Long Kem Cheese)..."
                  aria-label="Tên món mới"
                  className="flex-1 px-3 py-1.5 text-xs bg-bg-subtle border border-border-default rounded-md text-text-primary outline-none focus:border-primary"
                />
                <input
                  type="number"
                  step={1000}
                  value={newMenuPrice}
                  onChange={(e) => setNewMenuPrice(Number(e.target.value))}
                  aria-label="Giá món"
                  className="w-24 px-2.5 py-1.5 text-xs font-mono bg-bg-subtle border border-border-default rounded-md text-text-primary outline-none"
                />
                <Button type="submit" size="sm" variant="primary">
                  Thêm
                </Button>
              </form>

              <div className="space-y-2">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-border-default bg-bg-surface flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-text-primary truncate">{item.name}</div>
                      <div className="text-[11px] text-text-secondary mt-0.5">
                        <MoneyText amount={item.price} size="sm" variant="primary" /> · Lượt gọi:{' '}
                        <strong>{item.order_count}</strong>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={item.is_available ? 'outline' : 'secondary'}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      onClick={() => handleToggleMenuAvailability(item.id)}
                    >
                      {item.is_available ? 'Đang bán' : 'Tạm hết'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
