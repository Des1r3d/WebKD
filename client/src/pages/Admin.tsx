import { useEffect, useState } from 'react';
import { Check, RefreshCw, ShieldAlert, Users, Wallet, X } from 'lucide-react';
import { api } from '../lib/api';
import { Badge, Button, Card, EmptyState, MoneyText, PageHeader, StatCard, repGrade } from '../ui';

const DISPUTE_STATUS: Record<string, { label: string; className: string }> = {
  OPEN: { label: 'Đang mở', className: 'bg-accent-light text-accent' },
  RESOLVED: { label: 'Đã duyệt hoàn', className: 'bg-primary-light text-primary' },
  REJECTED: { label: 'Bị từ chối', className: 'bg-bg-subtle text-status-cancelled' },
};

export default function Admin() {
  const [stats, setStats] = useState<any | null>(null);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stRes, dpRes] = await Promise.all([
        api<{ success: boolean; data: any }>('/api/admin/stats'),
        api<{ success: boolean; data: any[] }>('/api/disputes'),
      ]);
      setStats(stRes.data);
      setDisputes(dpRes.data || []);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu Admin Dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onResolveDispute = async (id: string, status: 'RESOLVED' | 'REJECTED', refundAmount: number) => {
    setBusyId(id);
    try {
      await api(`/api/admin/disputes/${id}`, {
        method: 'PATCH',
        body: { status, refundAmount },
      });
      await load();
    } catch (err: any) {
      alert(err?.message);
    } finally {
      setBusyId(null);
    }
  };

  const onRestoreUser = async (userId: string) => {
    setBusyId(userId);
    try {
      await api(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: { status: 'ACTIVE', reputationScore: 60 },
      });
      await load();
    } catch (err: any) {
      alert(err?.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <Card className="p-8 text-center text-sm text-text-secondary" role="status">Đang truy vấn số liệu quản trị từ PostgreSQL...</Card>;
  }

  if (error || !stats) {
    return (
      <Card className="border-status-disputed p-6 text-center text-sm font-semibold text-status-disputed" role="alert">
        {error || 'Lỗi tải dữ liệu'}
      </Card>
    );
  }

  const maxGmv = Math.max(1, ...(stats.daily_stats || []).map((d: any) => d.gmv || 0));
  const openDisputes = disputes.filter((d) => d.status === 'OPEN').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin dashboard & kiểm toán"
        description={
          <>
            Số liệu truy vấn trực tiếp từ PostgreSQL. Mọi thao tác quản trị tự động ghi vào bảng <code className="rounded bg-bg-subtle px-1 py-0.5 font-mono text-[11px]">audit_logs</code>.
          </>
        }
        actions={
          <Button size="md" variant="outline" onClick={load} iconStart={<RefreshCw className="size-4" aria-hidden />}>
            Làm mới
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng GMV đã giải ngân"
          value={<MoneyText amount={stats.gmv_total} />}
          icon={<Wallet className="size-4" aria-hidden />}
        />
        <StatCard
          label="Tổng doanh thu hoa hồng"
          value={<MoneyText amount={stats.platform_fee_total} />}
          hint={`Sân (8%): ${stats.venue_fee_total.toLocaleString('vi-VN')} ₫ · FNB (12%): ${stats.fnb_fee_total.toLocaleString('vi-VN')} ₫`}
          icon={<Wallet className="size-4" aria-hidden />}
          tone="positive"
        />
        <StatCard
          label="Escrow đang giữ / đóng băng"
          value={
            <span className="flex flex-wrap items-baseline gap-x-1">
              <MoneyText amount={stats.held_escrow_amount} />
              <span className="text-text-muted">/</span>
              <MoneyText amount={stats.frozen_escrow_amount} />
            </span>
          }
          icon={<ShieldAlert className="size-4" aria-hidden />}
          tone="danger"
        />
        <StatCard
          label="Người dùng / Phòng / Khiếu nại mở"
          value={<span className="font-mono">{stats.users_total} / {stats.lobbies_total} / {stats.disputes_open_count}</span>}
          icon={<Users className="size-4" aria-hidden />}
        />
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-base font-semibold">Phân bổ GMV theo ngày trong tuần</h2>
          <span className="text-xs text-text-secondary">Đơn vị: nghìn đồng (k ₫)</span>
        </div>

        <div className="grid grid-cols-7 items-end gap-1.5 sm:gap-3" role="img" aria-label="Biểu đồ GMV theo ngày trong tuần">
          {(stats.daily_stats || []).map((d: any) => {
            const pct = d.gmv > 0 ? Math.max(8, Math.round((d.gmv / maxGmv) * 100)) : 0;
            return (
              <div key={d.day} className="flex min-w-0 flex-col items-center gap-1.5 text-xs">
                <span className="font-mono text-[10px] text-text-muted">{(d.gmv / 1000).toFixed(0)}k</span>
                <div className="flex h-32 w-full items-end justify-center rounded-md bg-bg-subtle p-1">
                  <div
                    style={{ height: `${pct}%` }}
                    className="w-full rounded-sm bg-primary transition-all"
                    title={`GMV: ${d.gmv.toLocaleString('vi-VN')} ₫`}
                  />
                </div>
                <span className="truncate font-semibold text-text-secondary">{d.day}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <ShieldAlert className="size-4 text-status-disputed" aria-hidden />
              Tài khoản bị gắn cờ FLAGGED
            </h2>
            <span className="text-xs text-text-secondary">{stats.flagged_users?.length || 0} tài khoản</span>
          </div>

          {(stats.flagged_users || []).length === 0 ? (
            <EmptyState title="Không có tài khoản nào dưới 50 điểm" description="Hệ thống ghi nhận toàn bộ thành viên đang ở ngưỡng uy tín an toàn." />
          ) : (
            <div className="divide-y divide-border-default">
              {stats.flagged_users.map((u: any) => (
                <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-text-primary">{u.full_name}</span>
                      <Badge kind={repGrade(u.reputation_score)} />
                    </div>
                    <p className="truncate text-text-secondary">{u.email} · Điểm: <span className="font-mono">{u.reputation_score}</span></p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busyId === u.id}
                    onClick={() => onRestoreUser(u.id)}
                  >
                    Khôi phục 60đ
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Phân xử khiếu nại</h2>
            <span className="text-xs text-text-secondary">{openDisputes} đang mở / {disputes.length} tổng</span>
          </div>

          {disputes.length === 0 ? (
            <EmptyState title="Chưa có khiếu nại nào" description="Khi thành viên gửi khiếu nại, yêu cầu hoàn tiền sẽ xuất hiện tại đây để phân xử." />
          ) : (
            <div className="divide-y divide-border-default">
              {disputes.map((d) => {
                const status = DISPUTE_STATUS[d.status] ?? { label: d.status, className: 'bg-bg-subtle text-text-secondary' };
                return (
                  <div key={d.id} className="space-y-2 py-3 text-xs">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="min-w-0 font-semibold text-text-primary">
                        {d.target_provider_name} · Hoàn <MoneyText amount={d.refund_amount} />
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>{status.label}</span>
                    </div>
                    <p className="text-text-secondary">{d.reason}</p>
                    {d.status === 'OPEN' && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          loading={busyId === d.id}
                          onClick={() => onResolveDispute(d.id, 'RESOLVED', d.refund_amount)}
                          iconStart={<Check className="size-3.5" aria-hidden />}
                        >
                          Duyệt hoàn tiền
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          loading={busyId === d.id}
                          onClick={() => onResolveDispute(d.id, 'REJECTED', 0)}
                          iconStart={<X className="size-3.5" aria-hidden />}
                        >
                          Từ chối
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Nhật ký kiểm toán hệ thống</h2>
          <span className="text-xs text-text-secondary">{stats.recent_audit_logs?.length || 0} bản ghi gần nhất</span>
        </div>

        {(stats.recent_audit_logs || []).length === 0 ? (
          <EmptyState title="Chưa có bản ghi kiểm toán" description="Thao tác quản trị và giải ngân sẽ được ghi nhận tự động." />
        ) : (
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-border-default text-text-secondary">
                <th className="py-2 pr-2 font-medium">Thời gian</th>
                <th className="px-2 py-2 font-medium">Hành động</th>
                <th className="px-2 py-2 font-medium">Thực thể</th>
                <th className="px-2 py-2 font-medium">Actor</th>
                <th className="py-2 pl-2 font-medium">Chi tiết thay đổi (after)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {(stats.recent_audit_logs || []).map((log: any) => (
                <tr key={log.id}>
                  <td className="py-2.5 pr-2 font-mono text-[11px] text-text-muted">
                    {new Date(log.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-2 py-2.5 font-mono font-semibold text-primary">{log.action}</td>
                  <td className="px-2 py-2.5 font-mono text-[11px] text-text-primary">{log.entity} ({log.entity_id})</td>
                  <td className="px-2 py-2.5 text-text-secondary">{log.actor_id || 'system'}</td>
                  <td className="max-w-[280px] truncate py-2.5 pl-2 font-mono text-[11px] text-text-secondary" title={JSON.stringify(log.after)}>
                    {JSON.stringify(log.after)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
