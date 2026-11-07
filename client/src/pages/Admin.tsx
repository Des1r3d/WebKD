import { useEffect, useState } from 'react';
import { Check, RefreshCw, ShieldAlert, X } from 'lucide-react';
import { api } from '../lib/api';
import { Badge, Button, Card, MoneyText, repGrade } from '../ui';

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
      <Card className="border-status-disputed/40 p-6 text-center text-sm font-semibold text-status-disputed" role="alert">
        {error || 'Lỗi tải dữ liệu'}
      </Card>
    );
  }

  const maxGmv = Math.max(1, ...(stats.daily_stats || []).map((d: any) => d.gmv || 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard & Kiểm Toán (UC12 / WBS-5.3)</h1>
          <p className="text-sm text-text-secondary">
            Toàn bộ số liệu truy vấn trực tiếp từ PostgreSQL. Mọi thao tác quản trị tự động ghi vào bảng <code>audit_logs</code>.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} iconStart={<RefreshCw className="size-3.5" aria-hidden />}>
          Làm mới
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="space-y-1">
          <p className="text-xs text-text-secondary">Tổng GMV đã giải ngân</p>
          <p className="text-lg font-bold"><MoneyText amount={stats.gmv_total} /></p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs text-text-secondary">Tổng doanh thu hoa hồng</p>
          <p className="text-lg font-bold text-primary"><MoneyText amount={stats.platform_fee_total} /></p>
          <p className="text-[11px] text-text-muted">
            Sân (8%): {stats.venue_fee_total.toLocaleString('vi-VN')} ₫ · FNB (12%): {stats.fnb_fee_total.toLocaleString('vi-VN')} ₫
          </p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs text-text-secondary">Escrow đang giữ / đóng băng</p>
          <p className="text-lg font-bold">
            <MoneyText amount={stats.held_escrow_amount} /> / <MoneyText amount={stats.frozen_escrow_amount} />
          </p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs text-text-secondary">Người dùng / Phòng / Khiếu nại mở</p>
          <p className="font-mono text-lg font-bold">
            {stats.users_total} / {stats.lobbies_total} / {stats.disputes_open_count}
          </p>
        </Card>
      </div>

      {/* Biểu đồ doanh thu theo thứ trong tuần */}
      <Card className="space-y-3">
        <h2 className="text-base font-semibold">Phân bổ GMV & Hoa hồng theo ngày trong tuần</h2>
        <div className="grid grid-cols-7 items-end gap-2 pt-4">
          {(stats.daily_stats || []).map((d: any) => {
            const pct = Math.max(8, Math.round(((d.gmv || 0) / maxGmv) * 100));
            return (
              <div key={d.day} className="flex flex-col items-center gap-1.5 text-xs">
                <div className="flex h-28 w-full items-end justify-center rounded bg-bg-subtle p-1">
                  <div
                    style={{ height: `${pct}%` }}
                    className="w-full rounded bg-primary transition-all"
                    title={`GMV: ${d.gmv.toLocaleString('vi-VN')} ₫`}
                  />
                </div>
                <span className="font-semibold">{d.day}</span>
                <span className="font-mono text-[10px] text-text-muted">{(d.gmv / 1000).toFixed(0)}k</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Danh sách tài khoản FLAGGED (< 50 điểm) */}
        <Card className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <ShieldAlert className="size-4 text-status-disputed" aria-hidden />
            Tài khoản bị gắn cờ FLAGGED ({stats.flagged_users?.length || 0})
          </h2>
          {(stats.flagged_users || []).length === 0 ? (
            <p className="text-xs text-text-muted">Không có tài khoản nào dưới 50 điểm.</p>
          ) : (
            <div className="divide-y divide-border-default">
              {stats.flagged_users.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between gap-2 py-2.5 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{u.full_name}</span>
                      <Badge kind={repGrade(u.reputation_score)} />
                    </div>
                    <p className="text-text-secondary">{u.email} · Điểm: {u.reputation_score}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busyId === u.id}
                    onClick={() => onRestoreUser(u.id)}
                  >
                    Khôi phục 60đ (ACTIVE)
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Phân xử khiếu nại BR-DSP-01 */}
        <Card className="space-y-3">
          <h2 className="text-base font-semibold">Phân xử Khiếu nại (BR-DSP-01)</h2>
          {disputes.length === 0 ? (
            <p className="text-xs text-text-muted">Chưa có khiếu nại nào.</p>
          ) : (
            <div className="divide-y divide-border-default">
              {disputes.map((d) => (
                <div key={d.id} className="space-y-2 py-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {d.target_provider_name} · Hoàn <MoneyText amount={d.refund_amount} />
                    </span>
                    <span className="rounded-full bg-bg-subtle px-2 py-0.5 font-semibold">{d.status}</span>
                  </div>
                  <p className="text-text-secondary">{d.reason}</p>
                  {d.status === 'OPEN' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        loading={busyId === d.id}
                        onClick={() => onResolveDispute(d.id, 'RESOLVED', d.refund_amount)}
                        iconStart={<Check className="size-3.5" aria-hidden />}
                      >
                        Duyệt hoàn tiền (RESOLVED)
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        loading={busyId === d.id}
                        onClick={() => onResolveDispute(d.id, 'REJECTED', 0)}
                        iconStart={<X className="size-3.5" aria-hidden />}
                      >
                        Từ chối (REJECTED)
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Nhật ký kiểm toán Audit Logs */}
      <Card className="overflow-x-auto">
        <h2 className="mb-3 text-base font-semibold">Nhật ký Kiểm toán Hệ thống (audit_logs)</h2>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border-default text-text-secondary">
              <th className="py-2 pr-2">Thời gian</th>
              <th className="py-2 px-2">Hành động</th>
              <th className="py-2 px-2">Thực thể</th>
              <th className="py-2 px-2">Actor</th>
              <th className="py-2 pl-2">Chi tiết thay đổi (after)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {(stats.recent_audit_logs || []).map((log: any) => (
              <tr key={log.id}>
                <td className="py-2 pr-2 font-mono text-[11px] text-text-muted">
                  {new Date(log.created_at).toLocaleString('vi-VN')}
                </td>
                <td className="py-2 px-2 font-mono font-semibold text-primary">{log.action}</td>
                <td className="py-2 px-2 font-mono text-[11px]">{log.entity} ({log.entity_id})</td>
                <td className="py-2 px-2">{log.actor_id || 'system'}</td>
                <td className="py-2 pl-2 font-mono text-[11px] text-text-secondary">
                  {JSON.stringify(log.after)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
