import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Calculator, Lock, LogOut as LeaveIcon, Send, Sparkles, Tag, Users } from 'lucide-react';
import type { Socket } from 'socket.io-client';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { getSocket } from '../lib/socket';
import {
  Badge,
  Button,
  Card,
  CartRow,
  ChatBubble,
  Countdown,
  MemberAvatar,
  MoneyText,
  PageHeader,
  QRCard,
} from '../ui';

export default function Lobby() {
  const { code } = useParams<{ code: string }>();
  const nav = useNavigate();
  const { user } = useAuth();
  const [detail, setDetail] = useState<any | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [chatList, setChatList] = useState<Array<{ id: string; userId: string; fullName: string; text: string; createdAt: string }>>([]);
  const [chatText, setChatText] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherMsg, setVoucherMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState(false);

  const loadLobby = async () => {
    if (!code) return;
    setError(null);
    try {
      const res = await api<{ success: boolean; data: any }>(`/api/lobbies/${code}`);
      setDetail(res.data);
      const rec = await api<{ success: boolean; data: any[] }>(`/api/recommend?lobbyId=${res.data.lobby.id}`).catch(() => ({ data: [] }));
      setRecommendations(rec.data || []);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu phòng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLobby();
  }, [code]);

  // Kết nối Socket.io realtime
  useEffect(() => {
    if (!code || !user) return;
    let activeSocket: Socket | null = null;
    let mounted = true;

    getSocket().then((s) => {
      if (!mounted) return;
      activeSocket = s;
      s.emit('lobby:join', { lobbyId: code, userId: user.id });

      s.on('lobby:members', (payload: { members: any[] }) => {
        setDetail((prev: any) => (prev ? { ...prev, members: payload.members } : prev));
      });

      s.on('cart:updated', (payload: { items: any[]; subtotal: number; fnbProviderId?: string | null }) => {
        setDetail((prev: any) =>
          prev
            ? {
                ...prev,
                cart_items: payload.items,
                lobby: { ...prev.lobby, fnb_provider_id: payload.fnbProviderId ?? prev.lobby.fnb_provider_id },
              }
            : prev
        );
      });

      s.on('lobby:locked', () => {
        setDetail((prev: any) => (prev ? { ...prev, lobby: { ...prev.lobby, status: 'LOCKED' } } : prev));
      });

      s.on('bill:ready', () => {
        nav(`/lobby/${code}/split`);
      });

      s.on('chat:message', (msg: any) => {
        setChatList((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      });
    });

    return () => {
      mounted = false;
      if (activeSocket) {
        activeSocket.emit('lobby:leave', { lobbyId: code });
        activeSocket.off('lobby:members');
        activeSocket.off('cart:updated');
        activeSocket.off('lobby:locked');
        activeSocket.off('bill:ready');
        activeSocket.off('chat:message');
      }
    };
  }, [code, user?.id]);

  if (loading) {
    return <Card className="p-8 text-center text-sm text-text-secondary" role="status">Đang kết nối phòng ghép kèo...</Card>;
  }

  if (error || !detail) {
    return (
      <Card className="space-y-3 border-status-disputed p-6 text-center" role="alert">
        <p className="text-sm font-semibold text-status-disputed">{error || 'Phòng không tồn tại'}</p>
        <Link to="/" className="text-xs font-semibold text-primary hover:underline">← Về trang khám phá</Link>
      </Card>
    );
  }

  const { lobby, slot, members = [], cart_items = [], voucher } = detail;
  const isHost = user?.id === lobby.host_id || user?.role === 'ADMIN';
  const isOpen = lobby.status === 'OPEN';
  const isMember = members.some((m: any) => m.user_id === user?.id && m.status !== 'LEFT');

  const memberName = (uid: string) => members.find((m: any) => m.user_id === uid)?.full_name || uid;
  const foodSubtotal = cart_items.reduce((s: number, c: any) => s + c.qty * c.unit_price_snapshot, 0);

  const onAddItem = async (menuItemId: string) => {
    const s = await getSocket();
    s.emit('cart:add', { lobbyId: lobby.id, userId: user?.id, menuItemId, qty: 1 });
  };

  const onUpdateQty = async (cartItemId: string, nextQty: number) => {
    const s = await getSocket();
    if (nextQty <= 0) {
      s.emit('cart:remove', { lobbyId: lobby.id, cartItemId });
    } else {
      s.emit('cart:update', { lobbyId: lobby.id, cartItemId, qty: nextQty });
    }
  };

  const onSendChat = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || !user) return;
    const s = await getSocket();
    s.emit('chat:send', { lobbyId: lobby.id, userId: user.id, text: chatText.trim() });
    setChatText('');
  };

  const onApplyVoucher = async (codeToApply: string) => {
    if (!codeToApply.trim()) return;
    setVoucherMsg(null);
    try {
      const res = await api<{ message: string; data: { discountAmount: number; voucher: any } }>('/api/vouchers/validate', {
        method: 'POST',
        body: { code: codeToApply.trim(), lobbyId: lobby.id },
      });
      setVoucherMsg(`${res.message} (-${res.data.discountAmount.toLocaleString('vi-VN')} ₫)`);
      loadLobby();
    } catch (err: any) {
      setVoucherMsg(`Lỗi voucher: ${err?.message}`);
    }
  };

  const onLockLobby = async () => {
    setBusyAction(true);
    try {
      await api(`/api/lobbies/${lobby.id}/lock`, { method: 'POST' });
      await loadLobby();
    } catch (err: any) {
      alert(err?.message);
    } finally {
      setBusyAction(false);
    }
  };

  const onSplitBill = async () => {
    setBusyAction(true);
    try {
      await api(`/api/lobbies/${lobby.id}/split`, { method: 'POST' });
      nav(`/lobby/${lobby.invite_code}/split`);
    } catch (err: any) {
      alert(err?.message);
    } finally {
      setBusyAction(false);
    }
  };

  const onLeave = async () => {
    await api(`/api/lobbies/${lobby.id}/leave`, { method: 'POST' });
    nav('/');
  };

  const inviteUrl = `${window.location.origin}/join/${lobby.invite_code}`;
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(inviteUrl)}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={slot?.provider?.name ?? `Phòng #${lobby.invite_code}`}
        description={
          <span className="flex flex-col gap-2">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-xs font-semibold text-primary">MÃ PHÒNG: {lobby.invite_code}</span>
              <span>Khung giờ: {new Date(slot.start_at).toLocaleString('vi-VN')}</span>
              <span>Giá sân: <MoneyText amount={slot.price} /></span>
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-baseline gap-1.5">
                <span className="text-[11px] text-text-muted">Hạn chốt kèo</span>
                <Countdown until={lobby.deadline_at} className="text-sm" />
              </span>
              <Badge kind={lobby.status} />
              {voucher && <span className="rounded-full bg-accent-light px-2.5 py-1 text-xs font-semibold text-accent">Voucher {voucher.code}</span>}
            </span>
          </span>
        }
        actions={
          <>
            {!isMember && isOpen && (
              <Button size="sm" onClick={() => nav(`/join/${lobby.invite_code}`)}>Tham gia phòng</Button>
            )}
            {isHost && isOpen && (
              <Button size="sm" variant="outline" loading={busyAction} onClick={onLockLobby} iconStart={<Lock className="size-3.5" aria-hidden />}>
                Khóa giỏ hàng (BR-INT-04)
              </Button>
            )}
            {isHost && (
              <Button size="sm" loading={busyAction} onClick={onSplitBill} iconStart={<Calculator className="size-3.5" aria-hidden />}>
                Chốt &amp; Chia Bill
              </Button>
            )}
            {!isOpen && (
              <Link
                to={`/lobby/${lobby.invite_code}/split`}
                className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-semibold text-text-inverted hover:bg-primary-hover"
              >
                Xem bảng chia bill
              </Link>
            )}
            {!isHost && isMember && isOpen && (
              <Button size="sm" variant="ghost" onClick={onLeave} iconStart={<LeaveIcon className="size-3.5" aria-hidden />}>
                Rời phòng
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Cột chính: Giỏ hàng chung + Gợi ý F&B */}
        <div className="min-w-0 space-y-6">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">Giỏ hàng GroupOrder</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                <span>Tổng đồ uống: <MoneyText amount={foodSubtotal} /></span>
                <span>Ship: <MoneyText amount={lobby.ship_fee} /></span>
                <span>Món: {cart_items.length}</span>
              </div>
            </div>

            {!isOpen && (
              <div className="rounded-md bg-bg-subtle p-2.5 text-xs font-medium text-status-locked">
                Phòng đã khóa giỏ hàng (BR-INT-04) — không thể thêm hoặc sửa món.
              </div>
            )}

            {cart_items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-strong px-4 py-8 text-center text-xs text-text-secondary">
                Chưa có món nào trong giỏ. Chọn món từ các quán gợi ý bên dưới.
              </div>
            ) : (
              <div className="divide-y divide-border-default">
                {cart_items.map((item: any) => (
                  <CartRow
                    key={item.id}
                    name={item.name}
                    owner={memberName(item.user_id)}
                    unitPrice={item.unit_price_snapshot}
                    qty={item.qty}
                    disabled={!isOpen}
                    onInc={() => onUpdateQty(item.id, item.qty + 1)}
                    onDec={() => onUpdateQty(item.id, item.qty - 1)}
                  />
                ))}
              </div>
            )}

            <div className="border-t border-border-default pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="size-4 text-accent" aria-hidden />
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Mã voucher (VD: SYNCHUBCROSS15, FNBLANGDH20K)"
                  aria-label="Mã voucher"
                  className="h-9 min-w-[200px] flex-1 rounded-md border border-border-default bg-bg-surface px-3 text-xs uppercase text-text-primary placeholder:normal-case placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
                <Button size="sm" variant="secondary" onClick={() => onApplyVoucher(voucherCode)}>
                  Áp dụng
                </Button>
              </div>
              {voucherMsg && <p className="mt-1.5 text-xs font-medium text-primary">{voucherMsg}</p>}
            </div>
          </Card>

          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="size-4 text-accent" aria-hidden />
                Quán F&amp;B gợi ý quanh sân
              </h2>
              <span className="text-[11px] text-text-muted">Rule-based scoring · WBS-4.2</span>
            </div>

            {recommendations.length === 0 ? (
              <Card className="p-6 text-center text-xs text-text-secondary">Không có quán gợi ý trong bán kính 3 km.</Card>
            ) : (
              <div className="space-y-3">
                {recommendations.slice(0, 5).map((rec, idx) => (
                  <Card key={rec.provider_id} className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-primary-light px-1.5 py-0.5 font-mono text-xs font-bold text-primary">#{idx + 1}</span>
                          <h3 className="min-w-0 font-semibold">{rec.name}</h3>
                          <span className="rounded-full bg-bg-subtle px-2 py-0.5 font-mono text-[11px] font-semibold text-text-secondary">Score {rec.score}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-text-secondary">{rec.address}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {rec.reasons.map((r: string) => (
                            <span key={r} className="rounded-full bg-bg-subtle px-2 py-0.5 text-[11px] text-text-secondary">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      {rec.has_cross_voucher && rec.voucher_code && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setVoucherCode(rec.voucher_code);
                            onApplyVoucher(rec.voucher_code);
                          }}
                        >
                          Áp mã {rec.voucher_code}
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      {rec.popular_items.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex flex-col justify-between gap-2 rounded-lg border border-border-default p-3 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{item.name}</p>
                            <p className="text-text-muted">{item.order_count} lượt đặt</p>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <MoneyText amount={item.price} />
                            <Button size="sm" disabled={!isOpen} onClick={() => onAddItem(item.id)}>
                              + Thêm
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Cột phụ: Thành viên + QR + Chat */}
        <aside className="space-y-4">
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Users className="size-4 text-primary" aria-hidden /> Thành viên
              </h2>
              <span className="rounded-full bg-bg-subtle px-2 py-0.5 font-mono text-xs font-semibold text-text-secondary">{members.length}</span>
            </div>
            <div className="divide-y divide-border-default">
              {members.map((m: any) => (
                <div key={m.user_id} className="flex items-center justify-between gap-2 py-2.5 text-xs">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <MemberAvatar name={m.full_name} host={m.user_id === lobby.host_id} score={m.reputation_score} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{m.full_name}</p>
                      <p className="text-text-muted">Uy tín {m.reputation_score}đ · {m.status === 'JOINED' ? 'Đã tham gia' : m.status === 'LEFT' ? 'Đã rời' : m.status}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block text-[11px] text-text-muted">Đã cọc</span>
                    <MoneyText amount={m.deposit_paid || 0} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <QRCard
            title={`Mời bạn vào phòng #${lobby.invite_code}`}
            imageUrl={qrImgUrl}
            copyText={inviteUrl}
            copyLabel="Sao chép link mời"
            hint="Bạn bè quét mã để kiểm tra uy tín (BR-REP-01) và vào phòng."
          />

          <Card className="space-y-3">
            <h2 className="text-base font-semibold">Trò chuyện trong phòng</h2>
            <div className="max-h-60 space-y-1 overflow-y-auto rounded-md border border-border-default p-2">
              {chatList.length === 0 ? (
                <ChatBubble kind="system" text="Bắt đầu thảo luận chọn nước & chốt kèo" />
              ) : (
                chatList.map((m) => (
                  <ChatBubble
                    key={m.id}
                    kind={m.userId === user?.id ? 'me' : 'other'}
                    name={m.fullName}
                    text={m.text}
                    time={new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  />
                ))
              )}
            </div>
            <form onSubmit={onSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Nhắn cho cả nhóm..."
                aria-label="Tin nhắn"
                className="h-9 min-w-0 flex-1 rounded-md border border-border-default bg-bg-surface px-3 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
              <Button type="submit" size="sm" iconStart={<Send className="size-3.5" aria-hidden />}>
                Gửi
              </Button>
            </form>
          </Card>
        </aside>
      </div>
    </div>
  );
}
