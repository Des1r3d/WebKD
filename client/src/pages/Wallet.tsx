import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet as WalletIcon } from 'lucide-react';
import { api } from '../lib/api';
import { Badge, Card, MoneyText } from '../ui';

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
      <Card className="border-status-disputed/40 p-6 text-center text-sm font-semibold text-status-disputed" role="alert">
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
      <div className="flex items-center gap-2">
        <WalletIcon className="size-6 text-primary" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold">Ví & Sổ cái Trung Gian Escrow</h1>
          <p className="text-sm text-text-secondary">
            Theo dõi dòng tiền tạm giữ (HOLD), giải ngân đa bên (RELEASE), phạt cọc (PENALTY) và hoàn tiền (REFUND).
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="space-y-1">
          <p className="text-xs text-text-secondary">Đang tạm giữ (HELD)</p>
          <p className="text-lg font-bold"><MoneyText amount={sumByStatus('HELD')} /></p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs text-text-secondary">Đã giải ngân (RELEASED)</p>
          <p className="text-lg font-bold"><MoneyText amount={sumByStatus('RELEASED')} /></p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs text-text-secondary">Đóng băng khiếu nại (FROZEN)</p>
          <p className="text-lg font-bold"><MoneyText amount={sumByStatus('FROZEN')} /></p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs text-text-secondary">Đã hoàn tiền (REFUNDED)</p>
          <p className="text-lg font-bold"><MoneyText amount={sumByStatus('REFUNDED')} /></p>
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold">Phòng ghép kèo của bạn ({lobbies.length})</h2>
        {lobbies.length === 0 ? (
          <p className="text-xs text-text-muted">Bạn chưa tham gia phòng nào.</p>
        ) : (
          <div className="divide-y divide-border-default">
            {lobbies.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">#{l.invite_code}</span>
                    <Badge kind={l.status} />
                  </div>
                  <p className="font-semibold">{l.slot?.provider?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/lobby/${l.invite_code}`} className="font-semibold text-primary hover:underline">
                    Mở phòng
                  </Link>
                  <span>·</span>
                  <Link to={`/lobby/${l.invite_code}/split`} className="font-semibold text-primary hover:underline">
                    Chia bill & Escrow
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="overflow-x-auto">
        <h2 className="mb-3 text-base font-semibold">Lịch sử giao dịch Escrow ({allTxs.length})</h2>
        {allTxs.length === 0 ? (
          <p className="text-xs text-text-muted">Chưa phát sinh giao dịch nào.</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-default text-text-secondary">
                <th className="py-2 pr-2">Phòng</th>
                <th className="py-2 px-2">Loại</th>
                <th className="py-2 px-2">Idempotency Key</th>
                <th className="py-2 px-2 text-right">Tổng tiền</th>
                <th className="py-2 px-2 text-right">Phí nền tảng</th>
                <th className="py-2 px-2 text-right">Thực nhận</th>
                <th className="py-2 pl-2 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {allTxs.map((tx: any) => (
                <tr key={tx.id}>
                  <td className="py-2 pr-2 font-mono font-semibold">#{tx.invite_code}</td>
                  <td className="py-2 px-2 font-semibold">{tx.type}</td>
                  <td className="py-2 px-2 font-mono text-[11px] text-text-muted">{tx.idempotency_key}</td>
                  <td className="py-2 px-2 text-right"><MoneyText amount={tx.amount} /></td>
                  <td className="py-2 px-2 text-right"><MoneyText amount={tx.platform_fee} /></td>
                  <td className="py-2 px-2 text-right"><MoneyText amount={tx.net_amount} /></td>
                  <td className="py-2 pl-2 text-right font-semibold">{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
