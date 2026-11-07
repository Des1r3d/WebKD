import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Search, SlidersHorizontal, Users } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../lib/api';
import { categoryImage, categoryLabel } from '../lib/imagery';
import { Button, Card, EmptyState, MoneyText, PageHeader } from '../ui';
import type { Provider, ProviderType } from '../types';

const CATEGORIES: Array<{ id: string; label: string }> = [
  { id: 'ALL', label: 'Tất cả danh mục' },
  { id: 'badminton', label: 'Cầu lông' },
  { id: 'study_room', label: 'Phòng học nhóm' },
  { id: 'football', label: 'Bóng đá' },
  { id: 'milk_tea', label: 'Trà sữa' },
  { id: 'coffee', label: 'Cà phê' },
  { id: 'snack', label: 'Ăn vặt' },
];

const QUICK_PICKS = [
  { id: 'badminton', label: 'Cầu lông', type: 'VENUE' as const, image: '/images/badminton.jpg' },
  { id: 'study_room', label: 'Phòng học nhóm', type: 'VENUE' as const, image: '/images/study-room.jpg' },
  { id: 'football', label: 'Bóng đá', type: 'VENUE' as const, image: '/images/futsal.jpg' },
  { id: 'coffee', label: 'Cà phê & nước uống', type: 'FNB' as const, image: '/images/coffee.jpg' },
];

export default function Discover() {
  const nav = useNavigate();
  const [type, setType] = useState<'ALL' | ProviderType>('ALL');
  const [category, setCategory] = useState('ALL');
  const [radius, setRadius] = useState(3000);
  const [search, setSearch] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const fetchList = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (type !== 'ALL') params.set('type', type);
    if (category !== 'ALL') params.set('category', category);
    params.set('radius', String(radius));
    if (search.trim()) params.set('search', search.trim());

    api<{ success: boolean; data: Provider[] }>(`/api/providers?${params.toString()}`)
      .then((res) => setProviders(res.data || []))
      .catch((err: any) => setError(err?.message || 'Không thể tải danh sách địa điểm từ máy chủ'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, [type, category, radius]);

  // Khởi tạo bản đồ Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current).setView([10.8752, 106.8007], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    const layer = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = layer;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Cập nhật marker theo providers
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const p of providers) {
      const isVenue = p.type === 'VENUE';
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: 8,
        fillColor: isVenue ? '#059669' : '#d97706',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.95,
      });
      marker.bindPopup(
        `<strong>${p.name}</strong><br/><span>${p.address}</span><br/><a href="/venues/${p.id}">Xem chi tiết →</a>`
      );
      marker.addTo(layer);
    }
  }, [providers]);

  const pickQuick = (id: string, nextType: ProviderType) => {
    if (category === id) {
      setCategory('ALL');
      setType('ALL');
      return;
    }
    setCategory(id);
    setType(nextType);
  };

  const resetFilters = () => {
    setType('ALL');
    setCategory('ALL');
    setRadius(3000);
    setSearch('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Khám phá Làng Đại Học Thủ Đức"
        description="Chọn sân thể thao hoặc phòng học nhóm, khoá slot 10 phút và mở phòng ghép kèo cùng bạn bè."
        actions={
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (joinCode.trim()) nav(`/join/${joinCode.trim().toUpperCase()}`);
            }}
            className="flex w-full items-center gap-2 sm:w-auto"
          >
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Nhập mã phòng (VD: SYNC01)"
              aria-label="Mã phòng"
              className="h-10 min-w-0 flex-1 rounded-md border border-border-default bg-bg-surface px-3 text-sm uppercase text-text-primary placeholder:normal-case placeholder:text-text-muted focus:border-primary focus:outline-none sm:w-56"
            />
            <Button type="submit" variant="secondary" iconStart={<Users className="size-4" aria-hidden />}>
              Vào phòng
            </Button>
          </form>
        }
      />

      {/* Lối tắt theo môn / loại hình */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_PICKS.map((q) => {
          const active = category === q.id;
          return (
            <button
              key={q.id}
              type="button"
              aria-pressed={active}
              onClick={() => pickQuick(q.id, q.type)}
              className={`group relative aspect-[4/3] overflow-hidden rounded-xl border text-left transition-colors ${
                active ? 'border-primary shadow-md ring-2 ring-primary' : 'border-border-default hover:border-border-strong'
              }`}
            >
              <img
                src={q.image}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />
              <span aria-hidden className="absolute inset-0 bg-scrim" />
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
                <span className="text-sm font-semibold text-text-inverted">{q.label}</span>
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-bg-surface text-primary">
                  <ArrowRight className="size-3.5" aria-hidden />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Bộ lọc */}
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'VENUE', 'FNB'] as const).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={type === t ? 'primary' : 'outline'}
              onClick={() => setType(t)}
            >
              {t === 'ALL' ? 'Tất cả' : t === 'VENUE' ? 'Sân & Phòng học' : 'Quán F&B'}
            </Button>
          ))}

          <span className="ml-auto hidden items-center gap-1.5 text-[11px] text-text-muted sm:flex">
            <SlidersHorizontal className="size-3.5" aria-hidden /> Bộ lọc
          </span>

          <select
            aria-label="Danh mục"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-md border border-border-default bg-bg-surface px-2.5 text-xs font-medium text-text-primary focus:border-primary focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          <select
            aria-label="Bán kính"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="h-9 rounded-md border border-border-default bg-bg-surface px-2.5 text-xs font-medium text-text-primary focus:border-primary focus:outline-none"
          >
            <option value={1000}>≤ 1 km</option>
            <option value={2000}>≤ 2 km</option>
            <option value={3000}>≤ 3 km</option>
            <option value={5000}>≤ 5 km</option>
          </select>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchList();
            }}
            className="flex min-w-[220px] flex-1 items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc địa chỉ..."
                aria-label="Tìm địa điểm"
                className="h-9 w-full rounded-md border border-border-default bg-bg-surface pl-8 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>
            <Button type="submit" size="sm" variant="outline">Tìm</Button>
          </form>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Danh sách địa điểm */}
        <section aria-labelledby="results-heading" className="order-1 min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="results-heading" className="text-sm font-semibold text-text-primary">
              {loading ? 'Đang tải địa điểm…' : `${providers.length} địa điểm trong bán kính ${radius / 1000} km`}
            </h2>
            <button type="button" onClick={resetFilters} className="text-xs font-semibold text-primary hover:underline">
              Đặt lại bộ lọc
            </button>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-xl border border-border-default bg-bg-subtle" aria-hidden />
              ))}
              <p className="sr-only" role="status">Đang tải danh sách địa điểm từ cơ sở dữ liệu…</p>
            </div>
          ) : error ? (
            <Card className="space-y-3 border-status-disputed p-6 text-center" role="alert">
              <p className="text-sm font-semibold text-status-disputed">Lỗi kết nối máy chủ: {error}</p>
              <Button size="sm" variant="outline" onClick={fetchList}>Thử lại</Button>
            </Card>
          ) : providers.length === 0 ? (
            <EmptyState
              icon={<MapPin className="size-5" />}
              title="Không tìm thấy địa điểm nào"
              description="Thử mở rộng bán kính hoặc đặt lại bộ lọc để xem toàn bộ sân và quán quanh khu vực."
              action={<Button size="sm" variant="outline" onClick={resetFilters}>Đặt lại bộ lọc</Button>}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {providers.map((p: any) => (
                <Card key={p.id} interactive className="group flex flex-col overflow-hidden p-0">
                  <Link to={`/venues/${p.id}`} className="relative block aspect-[16/9] overflow-hidden bg-bg-subtle">
                    <img
                      src={categoryImage(p.category, p.type)}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <span
                      className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        p.type === 'VENUE' ? 'bg-primary text-text-inverted' : 'bg-accent text-text-inverted'
                      }`}
                    >
                      {p.type === 'VENUE' ? 'Sân / Phòng' : 'Quán F&B'} · {categoryLabel(p.category)}
                    </span>
                    {p.distance_m !== undefined && (
                      <span className="absolute right-3 top-3 rounded-full bg-bg-surface px-2 py-1 font-mono text-[11px] font-semibold text-text-secondary">
                        {p.distance_m} m
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="min-w-0 text-base font-semibold leading-snug">
                      <Link to={`/venues/${p.id}`} className="hover:text-primary">{p.name}</Link>
                    </h3>

                    <p className="flex items-start gap-1.5 text-xs leading-5 text-text-secondary">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-text-muted" aria-hidden />
                      <span className="min-w-0">{p.address}</span>
                    </p>

                    <p className="flex items-center gap-1.5 text-xs text-text-muted">
                      <Clock className="size-3.5" aria-hidden /> {p.open_hours}
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-border-default pt-3">
                      <div className="text-xs text-text-secondary">
                        {p.min_price !== undefined ? (
                          <span className="flex flex-col">
                            <span className="text-[11px] text-text-muted">Giá từ</span>
                            <MoneyText amount={p.min_price} />
                          </span>
                        ) : (
                          <span>Xem bảng giá</span>
                        )}
                      </div>
                      <Link
                        to={`/venues/${p.id}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-text-inverted hover:bg-primary-hover"
                      >
                        {p.type === 'VENUE' ? 'Chọn khung giờ' : 'Xem thực đơn'}
                        <ArrowRight className="size-3.5" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Bản đồ */}
        <aside className="order-2 min-w-0">
          <div className="lg:sticky lg:top-24">
            <Card className="overflow-hidden p-0">
              <div ref={mapContainerRef} className="h-64 w-full lg:h-[420px]" aria-label="Bản đồ địa điểm" />
              <div className="space-y-2 border-t border-border-default px-4 py-3 text-xs text-text-secondary">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden className="size-2.5 rounded-full bg-primary" /> Sân &amp; Phòng (VENUE)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden className="size-2.5 rounded-full bg-accent" /> Quán nước &amp; Ăn vặt (FNB)
                  </span>
                </div>
                <p className="text-text-muted">Hiển thị {providers.length} địa điểm · bán kính {radius / 1000} km</p>
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
