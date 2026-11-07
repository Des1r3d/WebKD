import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  ShoppingBag,
  MessageSquare,
  Sparkles,
  Lock,
  Unlock,
  Send,
  Plus,
  ArrowRight,
  Tag,
  AlertCircle,
  ShieldCheck,
  QrCode,
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
  MemberAvatar,
  MoneyText,
  CartRow,
  ChatBubble,
  QRCard,
} from '../components';
import { useAuth } from '../context/AuthContext';
import {
  MOCK_LOBBY_MEMBERS,
  MOCK_MENU_ITEMS,
  INITIAL_CART_ITEMS,
  LobbyStatus,
  type CartItem,
} from '../lib/mockData';
import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl, getSocketUrl } from '../lib/api';

export const LobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, reputation, token } = useAuth();

  const codeParam = searchParams.get('code') || 'SYNC01';
  const [inviteCode, setInviteCode] = useState<string>(codeParam);
  const [lobbyStatus, setLobbyStatus] = useState<LobbyStatus>(LobbyStatus.OPEN);
  const [members, setMembers] = useState(MOCK_LOBBY_MEMBERS);
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART_ITEMS);
  const [voucherCode, setVoucherCode] = useState<string>('FNBLANGDH20K');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(20000);
  const [voucherNotice, setVoucherNotice] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [chatInput, setChatInput] = useState<string>('');
  const [showQR, setShowQR] = useState<boolean>(false);
  const [socketRef, setSocketRef] = useState<Socket | null>(null);
  const [joinStatusMessage, setJoinStatusMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  // Kết nối Socket.io Realtime (WBS-4.1)
  useEffect(() => {
    const socket: Socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
    });
    setSocketRef(socket);

    socket.emit('lobby:join', { lobbyId: inviteCode, userId: currentUser.id });

    socket.on('cart:updated', (data: any) => {
      if (data?.items) {
        setCartItems(
          data.items.map((item: any) => ({
            id: item.id,
            lobby_id: inviteCode,
            user_id: item.user_id,
            user_name: item.user_id === currentUser.id ? `${currentUser.full_name} (Bạn)` : 'Thành viên',
            menu_item_id: item.menu_item_id,
            item_name: item.name,
            qty: item.qty,
            unit_price_snapshot: item.unit_price_snapshot,
          }))
        );
      }
    });

    socket.on('chat:message', (msg: any) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [
          ...prev,
          {
            id: msg.id,
            senderName: msg.fullName,
            content: msg.text,
            timestamp: msg.createdAt,
            isSystem: false,
            isMine: msg.userId === currentUser.id,
          },
        ];
      });
    });

    socket.on('lobby:locked', () => {
      setLobbyStatus(LobbyStatus.LOCKED);
    });

    socket.on('lobby:members', (data: any) => {
      if (data?.members?.length > 0) {
        setMembers(data.members);
      }
    });

    return () => {
      socket.emit('lobby:leave', { lobbyId: inviteCode });
      socket.disconnect();
    };
  }, [inviteCode, currentUser.id]);

  // Tải gợi ý thông minh từ backend (WBS-4.2)
  useEffect(() => {
    let isMounted = true;
    const fetchRecommend = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/recommend?lobbyId=${inviteCode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data?.length > 0) {
            setRecommendation(json.data[0]);
          }
        }
      } catch {
        // Fallback local
      }
    };
    fetchRecommend();
    return () => {
      isMounted = false;
    };
  }, [inviteCode, token]);

  // Tải chi tiết lobby từ backend nếu có
  useEffect(() => {
    let isMounted = true;
    const fetchLobby = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/lobbies/${codeParam}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data) {
            setInviteCode(json.data.lobby.invite_code);
            setLobbyStatus(json.data.lobby.status as LobbyStatus);
            if (json.data.members?.length > 0) {
              setMembers(
                json.data.members.map((m: any) => ({
                  user_id: m.user_id,
                  full_name: m.full_name,
                  reputation_score: m.reputation_score,
                  deposit_required: m.deposit_required,
                  deposit_paid: m.deposit_paid,
                  is_host: m.user_id === json.data.lobby.host_id,
                  status: m.status,
                }))
              );
            }
          }
        }
      } catch {
        // Fallback local
      }
    };

    fetchLobby();
    return () => {
      isMounted = false;
    };
  }, [codeParam, token]);

  const [messages, setMessages] = useState([
    {
      id: 'm1',
      senderName: 'Hệ thống',
      content: `Đào Tiến Đạt (Host) đã mở phòng #${inviteCode} gắn với Sân Cầu Lông NVH SV (19:00–20:00).`,
      timestamp: '2026-11-08T17:01:00+07:00',
      isSystem: true,
      isMine: false,
    },
    {
      id: 'm2',
      senderName: 'Trần Quang Minh (B)',
      content: 'Mình vừa vào phòng, hạng B cọc 9.000đ xong rồi nha! Mình đặt 1 Hồng Trà Sữa.',
      timestamp: '2026-11-08T17:03:00+07:00',
      isSystem: false,
      isMine: false,
    },
    {
      id: 'm3',
      senderName: 'Lê Hoàng Linh (C)',
      content: 'Mình chỉ đánh cầu thôi không uống nước nha anh em (food = 0đ).',
      timestamp: '2026-11-08T17:04:00+07:00',
      isSystem: false,
      isMine: false,
    },
    {
      id: 'm4',
      senderName: 'Đào Tiến Đạt (Host)',
      content: 'Ok anh em, mình áp mã FNBLANGDH20K giảm 20k rồi chốt phòng chia bill nhé!',
      timestamp: '2026-11-08T17:05:00+07:00',
      isSystem: false,
      isMine: true,
    },
  ]);

  const handleJoinLobbyCheck = async () => {
    setJoinStatusMessage(null);

    // Kiểm tra BR-REP-01 trực tiếp hoặc gọi API
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/lobbies/${inviteCode}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.status === 403) {
        setJoinStatusMessage({
          type: 'error',
          text: `[BR-REP-01 CHẶN] ${data.message || 'Tài khoản FLAGGED (dưới 50đ uy tín) bị từ chối tham gia phòng.'}`,
        });
        return;
      }

      if (res.ok) {
        const dep = data.data?.depositRequired || 0;
        const tier = data.data?.reputation?.tier || reputation.tier;
        let notice = '';
        if (tier === 'A') notice = 'Vào phòng thành công! Hạng A (≥90đ) miễn cọc 0đ.';
        else if (tier === 'B') notice = `Vào phòng thành công! Hạng B (70–89đ) yêu cầu cọc 30% phần sân (${dep.toLocaleString('vi-VN')} ₫).`;
        else if (tier === 'C') notice = `Vào phòng thành công! Hạng C (50–69đ) yêu cầu cọc 100% phần sân (${dep.toLocaleString('vi-VN')} ₫).`;

        setJoinStatusMessage({
          type: tier === 'A' ? 'success' : 'warning',
          text: notice,
        });
        return;
      }
    } catch {
      // Fallback khi offline
      if (reputation.tier === 'FLAGGED') {
        setJoinStatusMessage({
          type: 'error',
          text: '[BR-REP-01 CHẶN] Tài khoản FLAGGED (< 50đ) bị hệ thống từ chối cho phép tham gia phòng ghép kèo!',
        });
        return;
      }

      const dep = reputation.tier === 'B' ? 9000 : reputation.tier === 'C' ? 30000 : 0;
      setJoinStatusMessage({
        type: reputation.tier === 'A' ? 'success' : 'warning',
        text: `Vào phòng thành công (${reputation.tierLabel}). Mức cọc: ${dep.toLocaleString('vi-VN')} ₫.`,
      });
    }
  };

  const isLocked = lobbyStatus !== LobbyStatus.OPEN;
  const slotPrice = 120000;
  const shipFee = 15000;
  const foodSubtotal = cartItems.reduce(
    (sum, item) => sum + item.qty * item.unit_price_snapshot,
    0
  );
  const grandTotal = slotPrice + foodSubtotal + (foodSubtotal > 0 ? shipFee - appliedDiscount : 0);

  const handleAddMenuItem = (menuItemId: string, name: string, price: number) => {
    if (isLocked) return;
    if (socketRef) {
      socketRef.emit('cart:add', {
        lobbyId: inviteCode,
        userId: currentUser.id,
        menuItemId,
        qty: 1,
      });
    }
    setCartItems((prev) => {
      const existing = prev.find(
        (c) => c.menu_item_id === menuItemId && c.user_id === currentUser.id
      );
      if (existing) {
        return prev.map((c) => (c.id === existing.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [
        ...prev,
        {
          id: `crt-${Date.now()}`,
          lobby_id: inviteCode,
          user_id: currentUser.id,
          user_name: `${currentUser.full_name} (Bạn)`,
          menu_item_id: menuItemId,
          item_name: name,
          qty: 1,
          unit_price_snapshot: price,
        },
      ];
    });
  };

  const handleUpdateQty = (id: string, delta: number) => {
    if (isLocked) return;
    const item = cartItems.find((c) => c.id === id);
    if (!item) return;
    const newQty = item.qty + delta;

    if (socketRef) {
      if (newQty <= 0) {
        socketRef.emit('cart:remove', { lobbyId: inviteCode, cartItemId: id });
      } else {
        socketRef.emit('cart:update', { lobbyId: inviteCode, cartItemId: id, qty: newQty });
      }
    }

    setCartItems((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const handleToggleLock = async () => {
    if (lobbyStatus === LobbyStatus.OPEN) {
      try {
        await fetch(`${getApiBaseUrl()}/api/lobbies/${inviteCode}/lock`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Fallback local
      }
      setLobbyStatus(LobbyStatus.LOCKED);
    } else {
      setLobbyStatus(LobbyStatus.OPEN);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (socketRef) {
      socketRef.emit('chat:send', {
        lobbyId: inviteCode,
        text: chatInput.trim(),
        userId: currentUser.id,
      });
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          senderName: `${currentUser.full_name}`,
          content: chatInput.trim(),
          timestamp: new Date().toISOString(),
          isSystem: false,
          isMine: true,
        },
      ]);
    }
    setChatInput('');
  };

  const handleSplitBillAction = async () => {
    try {
      await fetch(`${getApiBaseUrl()}/api/lobbies/${inviteCode}/split`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Fallback
    }
    navigate(`/split-bill?lobbyId=${inviteCode}`);
  };

  const handleApplyVoucher = async (code: string) => {
    setVoucherCode(code);
    setVoucherNotice(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/vouchers/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, lobbyId: inviteCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedDiscount(data.data.discountAmount);
        setVoucherNotice(`Áp dụng thành công: Giảm ${data.data.discountAmount.toLocaleString('vi-VN')} ₫`);
      } else {
        setVoucherNotice(`[Lỗi] ${data.message || 'Voucher không đủ điều kiện'}`);
      }
    } catch {
      setAppliedDiscount(code === 'FNBLANGDH20K' ? 20000 : 18000);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Lobby Status Top Bar */}
      <Card padding="md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isLocked ? 'locked' : 'open'} size="md">
                {lobbyStatus}
              </Badge>
              <span className="font-mono text-xs font-bold text-text-secondary">
                Mã phòng: #{inviteCode}
              </span>
              <span className="text-xs text-text-secondary">
                · Sân Cầu Lông NVH SV (19:00–20:00)
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-text-primary">
              Phòng Ghép Kèo &amp; Giỏ Hàng Nhóm Realtime (Socket.io Room: lobby:{inviteCode})
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Countdown initialSeconds={510} label="Chốt kèo sau" size="sm" />

            <Button
              size="sm"
              variant="outline"
              leftIcon={<QrCode className="w-3.5 h-3.5 text-primary" />}
              onClick={() => setShowQR(!showQR)}
            >
              {showQR ? 'Đóng QR' : 'Mã QR & Link Mời'}
            </Button>

            <Button
              size="sm"
              variant={isLocked ? 'outline' : 'secondary'}
              leftIcon={
                isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />
              }
              onClick={handleToggleLock}
            >
              {isLocked ? 'Mở khóa giỏ (Demo)' : 'Khóa giỏ hàng (BR-INT-04)'}
            </Button>

            <Button
              size="sm"
              variant="primary"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={handleSplitBillAction}
            >
              Click 3: Chốt &amp; Chia Bill
            </Button>
          </div>
        </div>
      </Card>

      {/* QR Code & Invite Link Drawer */}
      {showQR && (
        <Card padding="md" className="bg-emerald-50/20 border-emerald-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <QRCard
              type="invite"
              title={`Mã phòng: #${inviteCode}`}
              qrUrl={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                `http://localhost:5173/lobby?code=${inviteCode}`
              )}`}
              inviteUrl={`http://localhost:5173/lobby?code=${inviteCode}`}
            />
            <div className="text-xs text-text-secondary space-y-2 flex-1">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                Mời bạn bè vào phòng ghép kèo (UC04)
              </h3>
              <p>
                • Bạn bè quét mã QR hoặc truy cập đường link để tự động vào phòng{' '}
                <code className="font-mono font-bold text-emerald-800">#{inviteCode}</code>.
              </p>
              <p>
                • Hệ thống tự động kiểm tra điểm uy tín cá nhân để áp dụng tỷ lệ cọc theo{' '}
                <code className="font-mono font-semibold">BR-REP-01</code>.
              </p>
              <div className="p-2.5 rounded bg-bg-surface border border-border-default font-mono text-[11px] text-emerald-800">
                http://localhost:5173/lobby?code={inviteCode}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* BR-REP-01: Interactive Gate Test Panel */}
      <Card padding="md" className="bg-bg-surface border-border-default">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div className="text-xs font-bold text-text-primary">
                Kiểm thử Cổng Uy tín (BR-REP-01 Gate):
              </div>
              <div className="text-xs text-text-secondary mt-0.5">
                Đang đăng nhập:{' '}
                <strong className="text-text-primary">{currentUser.full_name}</strong> · Uy tín:{' '}
                <strong>{currentUser.reputation_score}đ</strong> ({reputation.tierLabel}) ·{' '}
                <span className="italic">{reputation.depositRuleText}</span>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-primary" />}
            onClick={handleJoinLobbyCheck}
          >
            Thử Vào Phòng (Test BR-REP-01)
          </Button>
        </div>

        {joinStatusMessage && (
          <div
            className={`mt-3 p-3 rounded-md text-xs flex items-center gap-2 ${
              joinStatusMessage.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-800 font-semibold'
                : joinStatusMessage.type === 'warning'
                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{joinStatusMessage.text}</span>
          </div>
        )}
      </Card>

      {/* Main 12-Col Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Members + Recommended F&B + Shared Cart */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Members & Reputation Deposit Status (BR-REP-01) */}
          <Card padding="md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Thành viên trong phòng ({members.length} JOINED)</span>
                </CardTitle>
                <span className="text-xs text-text-secondary">
                  Kiểm tra cọc tự động theo <code className="font-mono">BR-REP-01</code>
                </span>
              </div>
            </CardHeader>

            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map((m) => {
                const tier =
                  m.reputation_score >= 90 ? 'A' : m.reputation_score >= 70 ? 'B' : 'C';
                return (
                  <div
                    key={m.user_id}
                    className="p-3 rounded-lg border border-border-default bg-bg-subtle/50 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MemberAvatar
                        name={m.full_name}
                        reputationScore={m.reputation_score}
                        isHost={m.is_host}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-text-primary truncate">
                          {m.full_name}
                        </div>
                        <div className="text-[11px] text-text-secondary">
                          Uy tín: <strong>{m.reputation_score}đ</strong> (Hạng {tier})
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      {m.deposit_required > 0 ? (
                        <div>
                          <Badge variant={tier === 'B' ? 'rep-b' : 'rep-c'} size="sm">
                            Cọc {tier === 'B' ? '30%' : '100%'}
                          </Badge>
                          <div className="mt-0.5">
                            <MoneyText amount={m.deposit_paid} size="sm" />
                          </div>
                        </div>
                      ) : (
                        <Badge variant="rep-a" size="sm">
                          Miễn cọc (0đ)
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* 2. Smart Recommendation F&B Menu (UC07 + BR-INT-05) */}
          <Card padding="md">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>
                    {recommendation
                      ? `Gợi ý Quán Top 1: ${recommendation.name}`
                      : 'Gợi ý Quán Top 1: Trà Sữa TocoToco Làng ĐH'}
                  </span>
                </CardTitle>
                <Badge variant="accent" size="sm">
                  {recommendation
                    ? `Score: ${recommendation.score} · Cách sân ${recommendation.distance_m}m`
                    : 'Score: 0.95 · Cách sân 95m'}
                </Badge>
              </div>
              <CardDescription>
                {recommendation
                  ? `Lý do: ${recommendation.reasons?.join(' · ')} (BR-INT-05)`
                  : 'Lý do: Cách sân 95m (≤ 1km) · Đang mở cửa · Có mã giảm giá chéo (BR-INT-05).'}
              </CardDescription>
            </CardHeader>

            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(recommendation?.popular_items?.length > 0
                ? recommendation.popular_items
                : MOCK_MENU_ITEMS
              ).map((item: any) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-border-default bg-bg-surface flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-text-primary truncate">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <MoneyText amount={item.price} size="sm" variant="primary" />
                      <span className="text-[11px] text-text-muted">
                        · Đã đặt {item.order_count}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isLocked}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => handleAddMenuItem(item.id, item.name, item.price)}
                  >
                    Thêm
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 3. Realtime Shared Cart (UC06 + BR-INT-04) */}
          <Card padding="md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  <span>Giỏ hàng chung ({cartItems.length} món)</span>
                </CardTitle>
                {isLocked && (
                  <Badge variant="locked" size="sm">
                    <Lock className="w-3 h-3 mr-1" /> Đã khóa giỏ (BR-INT-04)
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-2.5">
              {cartItems.map((item) => (
                <CartRow
                  key={item.id}
                  id={item.id}
                  name={item.item_name}
                  userName={item.user_name}
                  price={item.unit_price_snapshot}
                  qty={item.qty}
                  isLocked={isLocked}
                  onIncrease={() => handleUpdateQty(item.id, 1)}
                  onDecrease={() => handleUpdateQty(item.id, -1)}
                  onRemove={() => handleUpdateQty(item.id, -item.qty)}
                />
              ))}

              {/* Voucher Selector */}
              <div className="pt-3 mt-3 border-t border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-accent" />
                  <span className="text-xs font-semibold text-text-primary">Mã giảm giá:</span>
                  <select
                    disabled={isLocked}
                    value={voucherCode}
                    onChange={(e) => handleApplyVoucher(e.target.value)}
                    aria-label="Chọn mã giảm giá"
                    className="text-xs bg-bg-subtle border border-border-default rounded-md px-2.5 py-1.5 font-mono font-semibold text-text-primary outline-none"
                  >
                    <option value="FNBLANGDH20K">
                      FNBLANGDH20K (−20.000₫ FNB · Ca chuẩn 215k)
                    </option>
                    <option value="SYNCHUBCROSS15">
                      SYNCHUBCROSS15 (−15% Sân · Voucher CROSS ≤ 1km)
                    </option>
                  </select>
                </div>

                <div className="text-right text-xs space-x-3">
                  <span className="text-text-secondary">
                    Tạm tính món: <MoneyText amount={foodSubtotal} size="sm" />
                  </span>
                  <span className="text-text-secondary">
                    Ship: <MoneyText amount={shipFee} size="sm" />
                  </span>
                  <span className="text-text-secondary">
                    Giảm: <MoneyText amount={-appliedDiscount} size="sm" variant="discount" />
                  </span>
                </div>
              </div>
              {voucherNotice && (
                <div className="mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  {voucherNotice}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 5 Cols: Realtime Chat & Quick Bill Summary */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
          {/* Summary Card */}
          <Card padding="md" className="border-primary/40 bg-emerald-50/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Tổng hóa đơn dự kiến (BR-INT-02)
              </span>
              <MoneyText amount={grandTotal} size="xl" variant="primary" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-lg bg-bg-surface border border-border-default text-xs mb-4">
              <div>
                <span className="text-[11px] text-text-muted block">Tiền sân (4 người)</span>
                <MoneyText amount={slotPrice} size="sm" />
              </div>
              <div>
                <span className="text-[11px] text-text-muted block">Tiền nước Σfood</span>
                <MoneyText amount={foodSubtotal} size="sm" />
              </div>
              <div>
                <span className="text-[11px] text-text-muted block">Ship − Voucher</span>
                <MoneyText amount={shipFee - appliedDiscount} size="sm" variant="discount" />
              </div>
            </div>

            <Button
              size="lg"
              variant="primary"
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={handleSplitBillAction}
            >
              Click 3: Chốt Phòng &amp; Sinh VietQR Chia Bill
            </Button>
          </Card>

          {/* Realtime Group Chat */}
          <Card padding="md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span>Chat Nhóm Realtime</span>
                </CardTitle>
                <span className="text-[11px] text-text-muted font-mono">
                  In-memory 50 msgs
                </span>
              </div>
            </CardHeader>

            <CardContent>
              <div className="h-72 overflow-y-auto pr-1 space-y-1 bg-bg-app p-3 rounded-lg border border-border-default">
                {messages.map((m) => (
                  <ChatBubble
                    key={m.id}
                    senderName={m.senderName}
                    content={m.content}
                    timestamp={m.timestamp}
                    isMine={m.isMine}
                    isSystem={m.isSystem}
                  />
                ))}
              </div>

              <form onSubmit={handleSendChat} className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Nhắn cho đồng đội trong phòng..."
                  aria-label="Nội dung tin nhắn"
                  className="flex-1 px-3 py-2 text-xs bg-bg-subtle border border-border-default rounded-md text-text-primary outline-none focus:border-primary"
                />
                <Button type="submit" size="sm" variant="primary" leftIcon={<Send className="w-3.5 h-3.5" />}>
                  Gửi
                </Button>
              </form>

              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-text-secondary">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span>
                  Lưu ý <code className="font-mono">BR-INT-03</code>: Rời phòng sau khi đã{' '}
                  <strong>LOCKED</strong> vẫn chịu phần tiền sân (khấu trừ vào cọc).
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-bg-surface/95 backdrop-blur border-t border-border-default p-3 flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] text-text-secondary block">
            Tổng cộng ({cartItems.length} món + sân)
          </span>
          <MoneyText amount={grandTotal} size="md" variant="primary" />
        </div>
        <Button
          size="md"
          variant="primary"
          rightIcon={<ArrowRight className="w-4 h-4" />}
          onClick={handleSplitBillAction}
        >
          Click 3: Chia Bill &amp; QR
        </Button>
      </div>
    </div>
  );
};
