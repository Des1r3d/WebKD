import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Search,
  Clock,
  Star,
  Sparkles,
  Navigation,
  Coffee,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Button, Card, Badge, MoneyText, LeafletMap } from '../components';
import { MOCK_PROVIDERS, ProviderType } from '../lib/mockData';
import { getApiBaseUrl } from '../lib/api';

const CATEGORIES = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'badminton', label: 'Cầu lông' },
  { id: 'study_room', label: 'Phòng học nhóm' },
  { id: 'football', label: 'Bóng đá' },
  { id: 'milk_tea', label: 'Trà sữa' },
  { id: 'coffee', label: 'Cà phê' },
];

export const HomeMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<'ALL' | ProviderType>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [radiusM, setRadiusM] = useState<number>(1000);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePinId, setActivePinId] = useState<string>('prv-venue-01');
  const [apiProviders, setApiProviders] = useState<any[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchFromApi = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedType !== 'ALL') params.set('type', selectedType);
        if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
        params.set('radius', String(radiusM));
        params.set('lat', '10.8752');
        params.set('lng', '106.8007');
        if (searchQuery.trim()) params.set('search', searchQuery.trim());

        const res = await fetch(`${getApiBaseUrl()}/api/providers?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data) {
            setApiProviders(json.data);
            return;
          }
        }
      } catch {
        // Fallback to local filtering
      }
    };

    fetchFromApi();
    return () => {
      isMounted = false;
    };
  }, [selectedType, selectedCategory, radiusM, searchQuery]);

  const rawList = apiProviders || MOCK_PROVIDERS;
  const filteredProviders = rawList.filter((p) => {
    if (selectedType !== 'ALL' && p.type !== selectedType) return false;
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if ((p.distance_m || 0) > radiusM) return false;
    if (
      searchQuery.trim() &&
      !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.address.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const activeProvider =
    filteredProviders.find((p) => p.id === activePinId) || filteredProviders[0] || rawList[0];

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Top Filter Bar */}
      <Card padding="md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm sân cầu lông, phòng học, quán trà sữa quanh Làng ĐH Thủ Đức..."
              aria-label="Tìm kiếm địa điểm"
              className="w-full pl-10 pr-4 py-2 text-sm bg-bg-subtle border border-border-default rounded-md text-text-primary placeholder:text-text-muted focus:bg-bg-surface focus:border-primary outline-none"
            />
          </div>

          {/* Type Filter + Radius */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex bg-bg-subtle p-1 rounded-md border border-border-default text-xs">
              {(
                [
                  { id: 'ALL', label: `Tất cả (${MOCK_PROVIDERS.length})` },
                  { id: ProviderType.VENUE, label: `Sân & Phòng (${MOCK_PROVIDERS.filter((p) => p.type === ProviderType.VENUE).length})` },
                  { id: ProviderType.FNB, label: `Quán Nước (${MOCK_PROVIDERS.filter((p) => p.type === ProviderType.FNB).length})` },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`px-2.5 py-1 rounded-sm font-medium transition-colors cursor-pointer ${
                    selectedType === t.id
                      ? 'bg-bg-surface text-primary shadow-xs font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-xs bg-bg-subtle px-3 py-1.5 rounded-md border border-border-default">
              <SlidersHorizontal className="w-3.5 h-3.5 text-text-secondary" />
              <span className="text-text-secondary">Bán kính:</span>
              <select
                value={radiusM}
                onChange={(e) => setRadiusM(Number(e.target.value))}
                aria-label="Chọn bán kính tìm kiếm"
                className="bg-transparent font-semibold text-text-primary outline-none cursor-pointer"
              >
                <option value={500}>≤ 500 m</option>
                <option value={1000}>≤ 1.000 m (Chuẩn CROSS)</option>
                <option value={2000}>≤ 2.000 m</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 mt-3 border-t border-border-default">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-primary text-text-inverted'
                  : 'bg-bg-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Main 2-Column Layout: Left List, Right Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Provider Cards */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-text-primary">
              Địa điểm quanh Làng ĐH Thủ Đức ({filteredProviders.length})
            </h1>
            <span className="text-xs text-text-secondary">
              Tâm: Nhà Văn Hóa Sinh Viên (10.8752, 106.8007)
            </span>
          </div>

          {filteredProviders.map((provider) => {
            const isVenue = provider.type === ProviderType.VENUE;
            const isSelected = provider.id === activePinId;

            return (
              <Card
                key={provider.id}
                interactive
                padding="md"
                onClick={() => setActivePinId(provider.id)}
                className={
                  isSelected
                    ? 'border-primary ring-1 ring-primary bg-emerald-50/20'
                    : ''
                }
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={isVenue ? 'primary' : 'accent'} size="sm">
                        {isVenue ? 'VENUE · Sân/Phòng' : 'FNB · Đồ uống'}
                      </Badge>
                      <span className="text-xs text-text-secondary font-mono">
                        Cách {provider.distance_m} m
                      </span>
                      {provider.has_cross_voucher && (
                        <Badge variant="open" size="sm">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Voucher CROSS −15%
                        </Badge>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-text-primary truncate">
                      {provider.name}
                    </h2>

                    <p className="text-xs text-text-secondary flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                      <span className="truncate">{provider.address}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-text-secondary">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        Mở cửa: <strong>{provider.open_hours}</strong>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <strong>{provider.rating}</strong>
                      </span>
                      <span>
                        Hoa hồng sàn:{' '}
                        <strong className="font-mono">
                          {Math.round(provider.commission_rate * 100)}%
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Right Price & Quick CTA */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-border-default">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-text-muted block">
                        {isVenue ? 'Giá thuê từ' : 'Món nước từ'}
                      </span>
                      <MoneyText
                        amount={provider.min_price || 30000}
                        size="lg"
                        variant={isVenue ? 'primary' : 'default'}
                      />
                      <span className="text-[11px] text-text-secondary ml-0.5">
                        {isVenue ? '/giờ' : '/ly'}
                      </span>
                    </div>

                    {isVenue ? (
                      <Button
                        size="sm"
                        variant="primary"
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/venue?id=${provider.id}`);
                        }}
                      >
                        Click 1: Chọn &amp; Khóa Slot
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        rightIcon={<Coffee className="w-3.5 h-3.5 text-accent" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/lobby');
                        }}
                      >
                        Gọi chung trong Lobby
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Right Column: Interactive Map Canvas (Leaflet OpenStreetMap Prototype) */}
        <div className="lg:col-span-5 lg:sticky lg:top-28">
          <Card padding="none" className="overflow-hidden">
            <div className="p-3.5 border-b border-border-default flex items-center justify-between bg-bg-surface">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-text-primary">
                  Bản đồ OpenStreetMap · Làng ĐH Thủ Đức
                </span>
              </div>
              <Badge variant="outline" size="sm">
                Bán kính CROSS ≤ 1km
              </Badge>
            </div>

            {/* Leaflet OpenStreetMap Real Interactive Map */}
            <div className="relative overflow-hidden">
              <LeafletMap
                markers={filteredProviders}
                centerLat={10.8752}
                centerLng={106.8007}
                radiusM={radiusM}
                activeId={activePinId}
                onSelectMarker={(id) => setActivePinId(id)}
                className="w-full h-88 sm:h-96"
              />
            </div>

            {/* Active Pin Info Footer */}
            <div className="p-4 bg-bg-surface border-t border-border-default flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={activeProvider.type === ProviderType.VENUE ? 'primary' : 'accent'}
                    size="sm"
                  >
                    {activeProvider.type}
                  </Badge>
                  <span className="text-xs font-bold text-text-primary truncate">
                    {activeProvider.name}
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary truncate mt-0.5">
                  Tọa độ: ({activeProvider.lat}, {activeProvider.lng}) · Cách {activeProvider.distance_m}m
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() =>
                  navigate(activeProvider.type === ProviderType.VENUE ? '/venue' : '/lobby')
                }
              >
                Xem chi tiết
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar (<= 3 Click Fast Path) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-bg-surface/95 backdrop-blur border-t border-border-default p-3 flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] text-text-secondary block">Đang chọn sân tiêu biểu</span>
          <span className="text-xs font-bold text-text-primary">
            Sân Cầu Lông NVH Sinh Viên · 120.000 ₫/h
          </span>
        </div>
        <Button
          size="sm"
          variant="primary"
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          onClick={() => navigate('/venue')}
        >
          Click 1: Chọn Slot
        </Button>
      </div>
    </div>
  );
};
