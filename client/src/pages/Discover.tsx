import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, MapPin, Search, Users } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../lib/api';
import { Button, Card, MoneyText } from '../ui';
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
        radius: 9,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold">Khám phá Làng Đại Học Thủ Đức</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Chọn sân thể thao hoặc phòng học nhóm, khóa slot 10 phút và mở phòng ghép kèo.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (joinCode.trim()) nav(`/join/${joinCode.trim().toUpperCase()}`);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Nhập mã phòng (VD: SYNC01)"
            className="h-10 rounded-md border border-border-default bg-bg-surface px-3 text-sm uppercase focus:border-primary focus:outline-none"
          />
          <Button type="submit" variant="secondary" iconStart={<Users className="size-4" aria-hidden />}>
            Vào phòng
          </Button>
        </form>
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

          <select
            aria-label="Danh mục"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-8 rounded-md border border-border-default bg-bg-surface px-2.5 text-xs font-medium"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          <select
            aria-label="Bán kính"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="h-8 rounded-md border border-border-default bg-bg-surface px-2.5 text-xs font-medium"
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
            className="flex flex-1 items-center gap-2"
          >
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc địa chỉ..."
              className="h-8 flex-1 rounded-md border border-border-default bg-bg-surface px-3 text-xs focus:border-primary focus:outline-none"
            />
            <Button type="submit" size="sm" variant="outline" iconStart={<Search className="size-3.5" aria-hidden />}>
              Tìm
            </Button>
          </form>
        </div>
      </Card>

      {/* Bản đồ Leaflet */}
      <Card className="overflow-hidden p-0">
        <div ref={mapContainerRef} className="h-64 w-full" aria-label="Bản đồ địa điểm" />
        <div className="flex items-center justify-between border-t border-border-default px-4 py-2 text-xs text-text-secondary">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary" /> Sân & Phòng (VENUE)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-accent" /> Quán nước & Ăn vặt (FNB)
            </span>
          </div>
          <span>Hiển thị {providers.length} địa điểm</span>
        </div>
      </Card>

      {/* Trạng thái dữ liệu */}
      {loading ? (
        <Card className="p-8 text-center text-sm text-text-secondary" role="status">
          Đang tải danh sách địa điểm từ cơ sở dữ liệu...
        </Card>
      ) : error ? (
        <Card className="space-y-3 border-status-disputed/40 p-6 text-center" role="alert">
          <p className="text-sm font-semibold text-status-disputed">Lỗi kết nối máy chủ: {error}</p>
          <Button size="sm" variant="outline" onClick={fetchList}>Thử lại</Button>
        </Card>
      ) : providers.length === 0 ? (
        <Card className="p-8 text-center text-sm text-text-secondary">
          Không tìm thấy địa điểm nào khớp bộ lọc hiện tại.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p: any) => (
            <Card key={p.id} interactive className="flex flex-col justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      p.type === 'VENUE' ? 'bg-primary-light text-primary' : 'bg-accent-light text-accent'
                    }`}
                  >
                    {p.type === 'VENUE' ? 'SÂN / PHÒNG' : 'QUÁN F&B'} · {p.category}
                  </span>
                  {p.distance_m !== undefined && (
                    <span className="font-mono text-xs text-text-muted">{p.distance_m} m</span>
                  )}
                </div>

                <h2 className="text-base font-semibold leading-snug">
                  <Link to={`/venues/${p.id}`} className="hover:text-primary">{p.name}</Link>
                </h2>

                <p className="flex items-start gap-1 text-xs text-text-secondary">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-text-muted" aria-hidden />
                  <span>{p.address}</span>
                </p>

                <p className="flex items-center gap-1 text-xs text-text-muted">
                  <Clock className="size-3.5" aria-hidden /> {p.open_hours}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-border-default pt-3">
                <div className="text-xs text-text-secondary">
                  {p.min_price !== undefined ? (
                    <>Từ <MoneyText amount={p.min_price} /></>
                  ) : (
                    <span>Xem bảng giá</span>
                  )}
                </div>
                <Link
                  to={`/venues/${p.id}`}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-text-inverted hover:bg-primary-hover"
                >
                  {p.type === 'VENUE' ? 'Chọn khung giờ' : 'Xem thực đơn'}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
