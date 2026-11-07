import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Coins, Lock, ReceiptText, Undo2, Wallet as WalletIcon } from 'lucide-react';
import { api } from '../lib/api';
import { Badge, Card, EmptyState, MoneyText, PageHeader, StatCard } from '../ui';

const TX_TONE: Record<string, string> = {
  HOLD: 'bg-bg-subtle text-text-secondary',
  RELEASE: 'bg-primary-light text-primary',
  PENALTY: 'bg-accent-light text-accent',
  REFUND: 'bg-bg-subtle text-status-awaiting',
};

export default function Wallet() {
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api<{ success: boolean; data: any[] }>('/api/lobbies')
      .then((res) => setLobbies(res.data || []))
      .catch((err: any) => setError(err?.message || 'Không thể tải dữ liệu ví và giao dịch Escrow'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Card className="p-8 text-center text-sm text-text-secondary" role="status">Đang tải sổ cái Escrow...</Card>;
  }

  if (error) {
    return (
      <Card className="border-status-disputed p-6 text-center text-sm font-semibold text-status-disputed" role="alert">
        {error}
      </Card>
    );
  }

  const allTxs = lobbies.flatMap((l) =>
    (l.escrow_transactions || []).map((t: any) => ({ ...t, invite_code: l.invite_code, venue_name: l.slot?.provider?.name }))
  );

  const sumByStatus = (s: string) => allTxs.filter((t) => t.status === s).reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ví & sổ cái Escrow"
        description="Theo dõi dòng tiền tạm giữ (HOLD), giải ngân đa bên (RELEASE), phạt cọc (PENALTY) và hoàn tiền (REFUND)."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-border-default bg-bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary">
            <WalletIcon className="size-4 text-primary" aria-hidden /> {lobbies.length} phòng tham gia
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Đang tạm giữ (HELD)" value={<MoneyText amount={sumByStatus('HELD')} />} icon={<Lock className="size-4" aria-hidden />} tone="warning" />
        <StatCard label="Đã giải ngân (RELEASED)" value={<MoneyText amount={sumByStatus('RELEASED')} />} icon={<ArrowUpRight className="size-4" aria-hidden />} tone="positive" />
        <StatCard label="Đóng băng khiếu nại (FROZEN)" value={<MoneyText amount={sumByStatus('FROZEN')} />} icon={<Coins className="size-4" aria-hidden />} tone="danger" />
        <StatCard label="Đã hoàn tiền (REFUNDED)" value={<MoneyText amount={sumByStatus('REFUNDED')} />} icon={<Undo2 className="size-4" aria-hidden />} tone="default" />
      </div>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-base font-semibold">Phòng ghép kèo của bạn</h2>
          <span className="text-xs text-text-secondary">{lobbies.length} phòng</span>
        </div>
        {lobbies.length === 0 ? (
          <EmptyState
            icon={<WalletIcon className="size-5" />}
            title="Bạn chưa tham gia phòng nào"
            description="Khám phá sân quanh Làng Đại Học, khoá slot và mở phòng ghép kèo để bắt đầu."
            action={<Link to="/" className="text-xs font-semibold text-primary hover:underline">Khám phá địa điểm</Link>}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {lobbies.map((l) => (
              <Card key={l.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono text-xs font-bold text-primary">#{l.invite_code}</span>
                    <p className="mt-0.5 truncate text-sm font-semibold">{l.slot?.provider?.name}</p>
                  </div>
                  <Badge kind={l.status} />
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-3 text-xs font-semibold">
                  <Link to={`/lobby/${l.invite_code}`} className="text-primary hover:underline">Mở phòng</Link>
                  <Link to={`/lobby/${l.invite_code}/split`} className="text-text-secondary hover:text-primary">Chia bill &amp; Escrow</Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Card className="overflow-x-auto">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Lịch sử giao dịch Escrow</h2>
          <span className="text-xs text-text-secondary">{allTxs.length} giao dịch</span>
        </div>
        {allTxs.length === 0 ? (
          <EmptyState icon={<ReceiptText className="size-5" />} title="Chưa phát sinh giao dịch nào" description="Giao dịch sẽ xuất hiện khi phòng bắt đầu giữ tiền cọc và giải ngân." />
        ) : (
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-border-default text-text-secondary">
                <th className="py-2 pr-2 font-medium">Phòng</th>
                <th className="px-2 py-2 font-medium">Loại</th>
                <th className="px-2 py-2 font-medium">Idempotency key</th>
                <th className="px-2 py-2 text-right font-medium">Tổng tiền</th>
                <th className="px-2 py-2 text-right font-medium">Phí nền tảng</th>
                <th className="px-2 py-2 text-right font-medium">Thực nhận</th>
                <th className="py-2 pl-2 text-right font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {allTxs.map((tx: any) => (
                <tr key={tx.id}>
                  <td className="py-2.5 pr-2 font-mono font-semibold">#{tx.invite_code}</td>
                  <td className="px-2 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${TX_TONE[tx.type] ?? 'bg-bg-subtle text-text-secondary'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="max-w-[220px] truncate px-2 py-2.5 font-mono text-[11px] text-text-muted">{tx.idempotency_key}</td>
                  <td className="px-2 py-2.5 text-right"><MoneyText amount={tx.amount} /></td>
                  <td className="px-2 py-2.5 text-right"><MoneyText amount={tx.platform_fee} /></td>
                  <td className="px-2 py-2.5 text-right"><MoneyText amount={tx.net_amount} /></td>
                  <td className="py-2.5 pl-2 text-right font-semibold">{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
