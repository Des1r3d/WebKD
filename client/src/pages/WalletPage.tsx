import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CheckCircle2,
  UserX,
  Lock,
  ArrowUpRight,
  KeyRound,
  Award,
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
  MemberAvatar,
} from '../components';
import {
  MOCK_ESCROW_TXS,
  MOCK_LOBBY_MEMBERS,
  EscrowTxType,
  EscrowStatus,
  LobbyMemberStatus,
  type EscrowTransaction,
  type LobbyMember,
} from '../lib/mockData';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../lib/api';

export const WalletPage: React.FC = () => {
  const { token } = useAuth();
  const [txs, setTxs] = useState<EscrowTransaction[]>(MOCK_ESCROW_TXS);
  const [members, setMembers] = useState<LobbyMember[]>(MOCK_LOBBY_MEMBERS);
  const [isReleased, setIsReleased] = useState<boolean>(false);
  const [idempotencyWarning, setIdempotencyWarning] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchEscrow = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/escrow/lob-01`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data?.transactions) {
            setTxs(json.data.transactions);
            const hasReleased = json.data.transactions.some(
              (t: any) => t.type === 'RELEASE'
            );
            if (hasReleased) setIsReleased(true);
          }
        }
      } catch {
        // Fallback mock
      }
    };
    fetchEscrow();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleCheckInAndRelease = async () => {
    const venueKey = 'release:lob-01:prv-venue-01';
    const fnbKey = 'release:lob-01:prv-fnb-01';

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/lobbies/lob-01/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          members: members.map((m) => ({
            userId: m.user_id,
            status: m.status === LobbyMemberStatus.NO_SHOW ? 'NO_SHOW' : 'CHECKED_IN',
          })),
        }),
      });

      const json = await res.json();

      if (res.status === 409 || json.error === 'IDEMPOTENCY_DUPLICATE_RELEASE') {
        setIdempotencyWarning(
          json.message ||
            `Chặn giải ngân lặp (BR-ESC-03): Khóa "${venueKey}" và "${fnbKey}" đã tồn tại trong bảng escrow_transactions!`
        );
        return;
      }

      if (res.ok && json.data) {
        setIsReleased(true);
        setIdempotencyWarning(null);
        if (json.data.releasedTransactions) {
          setTxs((prev) => [...json.data.releasedTransactions, ...prev]);
        }
        setMembers((prev) =>
          prev.map((m) =>
            m.status === LobbyMemberStatus.JOINED
              ? {
                  ...m,
                  status: LobbyMemberStatus.CHECKED_IN,
                  reputation_score: Math.min(100, m.reputation_score + 2),
                }
              : m
          )
        );
        return;
      }
    } catch {
      // Fallback local simulation
    }

    if (isReleased) {
      setIdempotencyWarning(
        `Chặn giải ngân lặp (BR-ESC-03): Khóa "${venueKey}" và "${fnbKey}" đã tồn tại trong bảng escrow_transactions!`
      );
      return;
    }

    setIsReleased(true);
    setIdempotencyWarning(null);
    setMembers((prev) =>
      prev.map((m) =>
        m.status === LobbyMemberStatus.JOINED
          ? {
              ...m,
              status: LobbyMemberStatus.CHECKED_IN,
              reputation_score: Math.min(100, m.reputation_score + 2),
            }
          : m
      )
    );

    const newReleases: EscrowTransaction[] = [
      {
        id: `esc-rel-venue-${Date.now()}`,
        lobby_id: 'lob-01',
        type: EscrowTxType.RELEASE,
        amount: 120000,
        platform_fee: 9600, // 8%
        net_amount: 110400,
        payee_provider_id: 'prv-venue-01',
        payee_name: 'Sân Cầu Lông NVH Sinh Viên ĐHQG',
        status: EscrowStatus.RELEASED,
        idempotency_key: venueKey,
        created_at: new Date().toISOString(),
      },
      {
        id: `esc-rel-fnb-${Date.now() + 1}`,
        lobby_id: 'lob-01',
        type: EscrowTxType.RELEASE,
        amount: 95000,
        platform_fee: 11400, // 12%
        net_amount: 83600,
        payee_provider_id: 'prv-fnb-01',
        payee_name: 'Trà Sữa & Nước Ép Phúc Long KTX Khu B',
        status: EscrowStatus.RELEASED,
        idempotency_key: fnbKey,
        created_at: new Date().toISOString(),
      },
    ];

    setTxs((prev) => [...newReleases, ...prev]);
  };

  const handleMarkNoShow = (userId: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.user_id === userId
          ? {
              ...m,
              status: LobbyMemberStatus.NO_SHOW,
              reputation_score: Math.max(0, m.reputation_score - 15),
            }
          : m
      )
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Escrow Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span>Đang giữ trung gian (HELD)</span>
            <Lock className="w-4 h-4 text-teal-600" />
          </div>
          <MoneyText amount={isReleased ? 0 : 215000} size="xl" variant="primary" />
          <p className="text-[11px] text-text-muted mt-1">
            Phòng #K8X92A · Sân 120k + F&amp;B 95k
          </p>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span>Giải ngân VENUE (Trừ 8% phí)</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <MoneyText amount={110400} size="xl" />
          <p className="text-[11px] text-text-muted mt-1">
            Gốc 120.000₫ · Hoa hồng sàn: 9.600₫
          </p>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span>Giải ngân F&amp;B (Trừ 12% phí)</span>
            <ArrowUpRight className="w-4 h-4 text-amber-600" />
          </div>
          <MoneyText amount={83600} size="xl" />
          <p className="text-[11px] text-text-muted mt-1">
            Gốc 95.000₫ · Hoa hồng sàn: 11.400₫
          </p>
        </Card>
      </div>

      {/* Main 12-Col Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Check-in & Reputation Engine (UC10 + BR-REP-02/03) */}
        <div className="lg:col-span-5 space-y-4">
          <Card padding="md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  <span>Điểm Danh Check-in &amp; Uy Tín</span>
                </CardTitle>
                <Badge variant={isReleased ? 'completed' : 'paid'} size="sm">
                  {isReleased ? 'COMPLETED' : 'PAID'}
                </Badge>
              </div>
              <CardDescription>
                Hoàn thành buổi (<code className="font-mono">CHECKED_IN</code>): +2đ (tối đa 100). Bùng kèo (<code className="font-mono">NO_SHOW</code>): −15đ &amp; tịch thu cọc (<code className="font-mono">PENALTY</code>).
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {members.map((m) => (
                <div
                  key={m.user_id}
                  className="p-3 rounded-lg border border-border-default bg-bg-subtle/40 flex items-center justify-between gap-2"
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
                        Điểm uy tín: <strong>{m.reputation_score}đ</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {m.status === LobbyMemberStatus.JOINED ? (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<UserX className="w-3 h-3 text-red-600" />}
                        onClick={() => handleMarkNoShow(m.user_id)}
                      >
                        Báo vắng (−15đ)
                      </Button>
                    ) : m.status === LobbyMemberStatus.CHECKED_IN ? (
                      <Badge variant="completed" size="sm">
                        CHECKED_IN (+2đ)
                      </Badge>
                    ) : (
                      <Badge variant="disputed" size="sm">
                        NO_SHOW (−15đ)
                      </Badge>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-2 space-y-2">
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full"
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleCheckInAndRelease}
                >
                  {isReleased
                    ? 'Thử Bấm Giải Ngân Lần 2 (Test Idempotency BR-ESC-03)'
                    : 'Xác Nhận Check-in & Giải Ngân Đa Bên (BR-ESC-02)'}
                </Button>

                {idempotencyWarning && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                    <KeyRound className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>{idempotencyWarning}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 7 Cols: Escrow Transaction Ledger */}
        <div className="lg:col-span-7">
          <Card padding="md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span>Sổ Cái Giao Dịch Escrow (`escrow_transactions`)</span>
                </CardTitle>
                <Badge variant="outline" size="sm">
                  UNIQUE(idempotency_key)
                </Badge>
              </div>
              <CardDescription>
                Mọi giao dịch HOLD, RELEASE, REFUND, PENALTY đều ghi vết khóa chống trùng.
              </CardDescription>
            </CardHeader>

            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-default text-text-secondary bg-bg-subtle/60">
                    <th className="py-2.5 px-3 font-semibold">Loại / Trạng thái</th>
                    <th className="py-2.5 px-2 font-semibold">Idempotency Key</th>
                    <th className="py-2.5 px-2 text-right font-semibold">Tổng (amount)</th>
                    <th className="py-2.5 px-2 text-right font-semibold">Phí sàn</th>
                    <th className="py-2.5 px-3 text-right font-bold text-text-primary">Thực nhận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {txs.map((tx) => (
                    <tr key={tx.id} className="hover:bg-bg-subtle/40">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={
                              tx.type === EscrowTxType.RELEASE ? 'completed' : 'paid'
                            }
                            size="sm"
                          >
                            {tx.type}
                          </Badge>
                          <span className="text-[11px] text-text-secondary">{tx.status}</span>
                        </div>
                        {tx.payee_name && (
                          <div className="text-[11px] text-text-secondary mt-0.5 truncate max-w-48">
                            → {tx.payee_name}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2 font-mono text-[11px] text-text-secondary">
                        {tx.idempotency_key}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <MoneyText amount={tx.amount} size="sm" />
                      </td>
                      <td className="py-3 px-2 text-right">
                        <MoneyText
                          amount={-tx.platform_fee}
                          size="sm"
                          variant={tx.platform_fee > 0 ? 'discount' : 'default'}
                        />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <MoneyText amount={tx.net_amount} size="sm" variant="primary" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
