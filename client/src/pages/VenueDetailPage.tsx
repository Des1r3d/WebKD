import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  ShieldCheck,
  Sparkles,
  Lock,
  ArrowRight,
  CheckCircle2,
  Users,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Countdown,
  MoneyText,
  QRCard,
} from '../components';
import { MOCK_PROVIDERS, MOCK_SLOTS, SlotStatus, type Slot } from '../lib/mockData';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../lib/api';

export const VenueDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, currentUser } = useAuth();
  const venueId = searchParams.get('id') || 'prv-venue-01';

  const [venue, setVenue] = useState(
    MOCK_PROVIDERS.find((p) => p.id === venueId) || MOCK_PROVIDERS[0]
  );
  const [slots, setSlots] = useState<Slot[]>(MOCK_SLOTS);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('slt-03');
  const [inviteCode, setInviteCode] = useState<string>('SYNC01');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdownSecs, setCountdownSecs] = useState<number>(600);

  // Tải danh sách slots thực tế từ backend nếu có
  useEffect(() => {
    let isMounted = true;
    const fetchVenueDetail = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/providers/${venueId}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data) {
            setVenue(json.data);
            if (json.data.slots && json.data.slots.length > 0) {
              setSlots(json.data.slots);
              setSelectedSlotId(json.data.slots[0].id);
            }
          }
        }
      } catch {
        // Fallback to local
      }
    };
    fetchVenueDetail();
    return () => {
      isMounted = false;
    };
  }, [venueId]);

  const selectedSlot = slots.find((s) => s.id === selectedSlotId) || slots[2];

  const handleLockSlot = async (slotId: string) => {
    setErrorMessage(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/slots/${slotId}/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 409) {
        setErrorMessage(
          'Khung giờ này vừa có người giữ hoặc đã được đặt thành công (BR-SLT-02)! Vui lòng chọn khung giờ khác.'
        );
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setCountdownSecs(data.expiresInSeconds || 600);
      }
    } catch {
      // Offline fallback
    }

    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? {
              ...s,
              status: SlotStatus.LOCKED,
              locked_by: currentUser.id,
              locked_until: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            }
          : s
      )
    );
    setSelectedSlotId(slotId);
  };

  const handleReleaseSlot = async (slotId: string) => {
    try {
      await fetch(`${getApiBaseUrl()}/api/slots/${slotId}/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Offline fallback
    }

    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? { ...s, status: SlotStatus.AVAILABLE, locked_by: null, locked_until: null }
          : s
      )
    );
  };

  const handleCreateLobbyAndNavigate = async (slotId: string) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/lobbies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slotId,
          fnbProviderId: 'prv-fnb-01',
          shipFee: 15000,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const code = json.data?.lobby?.invite_code || 'SYNC01';
        setInviteCode(code);
        navigate(`/lobby?code=${code}`);
        return;
      }
    } catch {
      // Offline fallback
    }

    navigate(`/lobby?code=${inviteCode}`);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Venue Banner Header */}
      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Card padding="md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="sm">
                VENUE · Sân Cầu Lông
              </Badge>
              <Badge variant="open" size="sm">
                <Sparkles className="w-3 h-3 mr-1" />
                Hỗ trợ Voucher CROSS −15%
              </Badge>
              <span className="text-xs text-text-secondary font-mono">
                Hoa hồng sàn: 8% (BR-ESC-02)
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">{venue.name}</h1>

            <p className="text-xs sm:text-sm text-text-secondary flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{venue.address}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {selectedSlot.status === SlotStatus.LOCKED && (
              <Countdown
                initialSeconds={countdownSecs}
                label="Giữ slot (BR-SLT-01)"
                size="md"
                onExpire={() => handleReleaseSlot(selectedSlot.id)}
              />
            )}
          </div>
        </div>
      </Card>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Slot Selection Grid */}
        <div className="lg:col-span-7 space-y-4">
          <Card padding="md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Chọn khung giờ (Chủ Nhật, 08/11/2026)</span>
                </CardTitle>
                <span className="text-xs text-text-secondary">
                  Ràng buộc: <code className="font-mono">UNIQUE(provider_id, start_at)</code>
                </span>
              </div>
              <CardDescription>
                Bấm chọn slot trống để khóa nguyên tử 10 phút (<code className="font-mono">BR-SLT-01/02</code>). Chống trùng tuyệt đối 20 request đồng thời.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {slots.map((slot) => {
                const startHour = new Date(slot.start_at).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const endHour = new Date(slot.end_at).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const isSelected = slot.id === selectedSlotId;
                const isBooked = slot.status === SlotStatus.BOOKED;
                const isLocked = slot.status === SlotStatus.LOCKED;

                return (
                  <div
                    key={slot.id}
                    onClick={() => !isBooked && setSelectedSlotId(slot.id)}
                    className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isBooked
                        ? 'bg-bg-subtle border-border-default opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'bg-emerald-50/40 border-primary ring-1 ring-primary cursor-pointer'
                        : 'bg-bg-surface border-border-default hover:border-border-strong cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-md bg-bg-subtle font-mono text-xs font-bold text-text-primary border border-border-default">
                        {startHour} – {endHour}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <MoneyText amount={slot.price} size="md" variant="primary" />
                          <Badge
                            variant={
                              slot.status === SlotStatus.AVAILABLE
                                ? 'available'
                                : slot.status === SlotStatus.LOCKED
                                ? 'locked'
                                : 'cancelled'
                            }
                            size="sm"
                          >
                            {slot.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-text-secondary mt-0.5">
                          {isBooked
                            ? 'Đã có nhóm thanh toán xong (BOOKED)'
                            : isLocked
                            ? 'Đang giữ 10 phút bởi bạn (Host Đào Tiến Đạt)'
                            : 'Còn trống · Chia 4 người chỉ 30.000 ₫/người'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {slot.status === SlotStatus.AVAILABLE && (
                        <Button
                          size="sm"
                          variant="primary"
                          leftIcon={<Lock className="w-3.5 h-3.5" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLockSlot(slot.id);
                          }}
                        >
                          Khóa Slot 10&apos;
                        </Button>
                      )}
                      {isLocked && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReleaseSlot(slot.id);
                            }}
                          >
                            Nhả Slot
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateLobbyAndNavigate(slot.id);
                            }}
                          >
                            Click 2: Vào Phòng &amp; Gọi Nước
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* BR-REP-01 Reputation Deposit Policy Box */}
          <Card padding="md" className="bg-bg-subtle/60">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h3 className="font-bold text-text-primary">
                  Chính sách Cọc Uy tín tự động khi mời bạn vào phòng (BR-REP-01)
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-text-secondary pt-1">
                  <li>
                    • <strong className="text-emerald-700">Hạng A (≥ 90đ):</strong> Miễn cọc (0%)
                  </li>
                  <li>
                    • <strong className="text-amber-700">Hạng B (70–89đ):</strong> Cọc 30% phần sân (9.000 ₫)
                  </li>
                  <li>
                    • <strong className="text-orange-700">Hạng C (50–69đ):</strong> Cọc 100% phần sân (30.000 ₫)
                  </li>
                  <li>
                    • <strong className="text-red-700">FLAGGED (&lt; 50đ):</strong> Chặn vào phòng (403)
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Right 5 Cols: Create Group Lobby & Invite QR */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-28">
          <Card padding="md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Phòng ghép kèo #{inviteCode}</span>
                </CardTitle>
                <Badge variant="open" size="sm">
                  OPEN
                </Badge>
              </div>
              <CardDescription>
                Đã gắn với Slot 19:00–20:00 (<code className="font-mono">BR-INT-01</code>). Mời đồng đội quét QR hoặc bấm thẳng sang bước gọi nước chung.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-bg-subtle border border-border-default space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Khung giờ đã khóa:</span>
                  <span className="font-mono font-semibold text-text-primary">
                    19:00 – 20:00 (08/11/2026)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Giá sân gốc:</span>
                  <MoneyText amount={selectedSlot.price} size="sm" variant="primary" />
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Dự kiến chia 4 thành viên:</span>
                  <MoneyText amount={selectedSlot.price / 4} size="sm" />
                </div>
              </div>

              <QRCard
                type="invite"
                title={`Mã mời phòng: ${inviteCode}`}
                qrUrl={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `https://synchub.vn/lobby/${inviteCode}`
                )}`}
                inviteUrl={`https://synchub.vn/lobby/${inviteCode}`}
              />

              <Button
                size="lg"
                variant="primary"
                className="w-full"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => handleCreateLobbyAndNavigate(selectedSlot.id)}
              >
                Click 2: Mở Phòng &amp; Gọi Nước Chung Ngay
              </Button>

              <p className="text-[11px] text-center text-text-secondary flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Đạt chuẩn UX ≤ 3 Click từ Chọn sân → Giỏ hàng F&amp;B
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-bg-surface/95 backdrop-blur border-t border-border-default p-3 flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] text-text-secondary block">
            Đã khóa Slot 19:00–20:00
          </span>
          <MoneyText amount={selectedSlot.price} size="md" variant="primary" />
        </div>
        <Button
          size="md"
          variant="primary"
          rightIcon={<ArrowRight className="w-4 h-4" />}
          onClick={() => navigate('/lobby')}
        >
          Click 2: Gọi Nước Chung
        </Button>
      </div>
    </div>
  );
};
