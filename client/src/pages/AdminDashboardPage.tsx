import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  FileSpreadsheet,
  UserCheck,
  Ban,
  Coins,
  Database,
  BarChart3,
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
  MOCK_USERS,
  MOCK_AUDIT_LOGS,
  UserStatus,
  type User,
  type AuditLog,
} from '../lib/mockData';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../lib/api';

const DAILY_PLATFORM_METRICS = [
  { date: '02/11', gmv: 5400000, fee: 518000, lobbies: 14 },
  { date: '03/11', gmv: 6150000, fee: 592000, lobbies: 16 },
  { date: '04/11', gmv: 6890000, fee: 664000, lobbies: 19 },
  { date: '05/11', gmv: 6200000, fee: 598000, lobbies: 17 },
  { date: '06/11', gmv: 7850000, fee: 758000, lobbies: 22 },
  { date: '07/11', gmv: 8960000, fee: 868000, lobbies: 26 },
  { date: '08/11', gmv: 7200000, fee: 592000, lobbies: 21 },
];

export const AdminDashboardPage: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAdminStats = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data) {
            setStats(json.data);
            if (json.data.recent_audit_logs) {
              setAuditLogs(
                json.data.recent_audit_logs.map((l: any) => ({
                  id: l.id,
                  actor_id: l.actor_id || 'System',
                  actor_name: l.actor_id === 'usr-adm-01' ? 'Nguyễn Minh Anh (Admin)' : (l.actor_id || 'Hệ thống'),
                  action: l.action,
                  entity: l.entity,
                  entity_id: l.entity_id,
                  detail: `${l.action} trên ${l.entity} (${l.entity_id})`,
                  created_at: l.created_at,
                }))
              );
            }
          }
        }
      } catch {
        // Fallback
      }
    };
    fetchAdminStats();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleToggleUserStatus = async (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;

    const nextStatus =
      target.status === UserStatus.FLAGGED ? UserStatus.ACTIVE : UserStatus.FLAGGED;
    const nextScore = nextStatus === UserStatus.ACTIVE ? Math.max(55, target.reputation_score) : 42;

    try {
      await fetch(`${getApiBaseUrl()}/api/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: nextStatus,
          reputationScore: nextScore,
        }),
      });
    } catch {
      // Fallback
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: nextStatus, reputation_score: nextScore } : u
      )
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Admin Stats Cards (`GET /api/admin/stats`) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span>Tổng GMV Qua Escrow</span>
            <Coins className="w-4 h-4 text-primary" />
          </div>
          <MoneyText amount={stats?.gmv_total ?? 48650000} size="xl" variant="primary" />
          <p className="text-[11px] text-text-muted mt-1">
            100% khớp sổ cái <code className="font-mono">escrow_transactions</code>
          </p>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span>Hoa hồng VENUE (8%)</span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <MoneyText amount={stats?.venue_fee_total ?? 2496000} size="xl" />
          <p className="text-[11px] text-text-muted mt-1">10 sân &amp; phòng học Làng ĐH</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span>Hoa hồng F&amp;B (12%)</span>
            <Coins className="w-4 h-4 text-accent" />
          </div>
          <MoneyText amount={stats?.fnb_fee_total ?? 2094000} size="xl" />
          <p className="text-[11px] text-text-muted mt-1">15 quán nước &amp; ăn vặt</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span>Tài khoản FLAGGED (&lt;50đ)</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl font-bold font-mono text-red-600">
            {stats?.flagged_count ?? users.filter((u) => u.status === UserStatus.FLAGGED).length} user
          </div>
          <p className="text-[11px] text-text-muted mt-1">
            Chặn tự động theo <code className="font-mono">BR-REP-01</code>
          </p>
        </Card>
      </div>

      {/* Platform Daily GMV & Orders Chart (WBS-5.3) */}
      <Card padding="md">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span>Biểu Đồ Doanh Thu GMV &amp; Số Đơn Theo Ngày (7 Ngày Gần Nhất)</span>
            </CardTitle>
            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-primary inline-block" /> Tổng GMV (VNĐ)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-accent inline-block" /> Hoa hồng sàn (8% / 12%)
              </span>
            </div>
          </div>
          <CardDescription>
            Thống kê trực tiếp từ các giao dịch <code className="font-mono">escrow_transactions</code> đã giải ngân và số phòng ghép kèo hoàn tất mỗi ngày.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 pt-4 px-2 border-b border-border-default">
            {(stats?.daily_metrics || DAILY_PLATFORM_METRICS).map((d: any) => {
              const gmvHeight = Math.max(12, Math.round((d.gmv / 9500000) * 100));
              const feeHeight = Math.max(8, Math.round(((d.fee * 5) / 9500000) * 100));
              return (
                <div key={d.date} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-mono text-text-muted hidden sm:block">
                    {d.lobbies} đơn
                  </span>
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-28">
                    <div
                      style={{ height: `${gmvHeight}%` }}
                      title={`GMV ${d.date}: ${d.gmv.toLocaleString('vi-VN')}đ (${d.lobbies} phòng)`}
                      className="w-3 sm:w-6 bg-primary rounded-t-sm"
                    />
                    <div
                      style={{ height: `${feeHeight}%` }}
                      title={`Hoa hồng ${d.date}: ${d.fee.toLocaleString('vi-VN')}đ`}
                      className="w-2.5 sm:w-4 bg-accent rounded-t-sm"
                    />
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-text-secondary pb-2">
                    {d.date}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main 12-Col Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: User Reputation & Flagged Governance */}
        <div className="lg:col-span-5">
          <Card padding="md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-primary" />
                  <span>Quản Trị Uy Tín &amp; Tài Khoản (`users`)</span>
                </CardTitle>
                <Badge variant="outline" size="sm">
                  BR-REP-01/02
                </Badge>
              </div>
              <CardDescription>
                Theo dõi hạng A/B/C và mở khóa hoặc gắn cờ (<code className="font-mono">FLAGGED</code>) tài khoản vi phạm bùng kèo.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2.5">
              {users.map((u) => {
                const isFlagged = u.status === UserStatus.FLAGGED;
                return (
                  <div
                    key={u.id}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-2 ${
                      isFlagged
                        ? 'bg-red-50/40 border-red-200'
                        : 'bg-bg-subtle/40 border-border-default'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MemberAvatar
                        name={u.full_name}
                        reputationScore={u.reputation_score}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-text-primary truncate">
                          {u.full_name}
                        </div>
                        <div className="text-[11px] text-text-secondary">
                          Điểm: <strong>{u.reputation_score}đ</strong> · {u.status}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isFlagged ? 'primary' : 'outline'}
                      leftIcon={
                        isFlagged ? (
                          <UserCheck className="w-3.5 h-3.5" />
                        ) : (
                          <Ban className="w-3.5 h-3.5 text-red-600" />
                        )
                      }
                      onClick={() => handleToggleUserStatus(u.id)}
                    >
                      {isFlagged ? 'Khôi phục (≥50đ)' : 'Gắn cờ FLAGGED'}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right 7 Cols: Immutable Audit Logs (`audit_logs`) */}
        <div className="lg:col-span-7">
          <Card padding="md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  <span>Nhật Ký Kiểm Toán Hệ Thống (`audit_logs`)</span>
                </CardTitle>
                <Badge variant="neutral" size="sm">
                  <Database className="w-3 h-3 mr-1" /> 12 Bảng Chuẩn Hóa
                </Badge>
              </div>
              <CardDescription>
                Ghi nhận bất biến mọi biến động điểm uy tín (<code className="font-mono">REPUTATION_CHANGE</code>), giải ngân Escrow và phân xử khiếu nại (<code className="font-mono">BR-DSP-01</code>).
              </CardDescription>
            </CardHeader>

            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-default text-text-secondary bg-bg-subtle/60">
                    <th className="py-2.5 px-3 font-semibold">Thời gian</th>
                    <th className="py-2.5 px-2 font-semibold">Hành động (`action`)</th>
                    <th className="py-2.5 px-2 font-semibold">Bảng (`entity`)</th>
                    <th className="py-2.5 px-3 font-semibold">Chi tiết before/after</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-bg-subtle/40">
                      <td className="py-3 px-3 font-mono text-[11px] text-text-muted whitespace-nowrap">
                        {new Date(log.created_at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" size="sm" className="font-mono">
                          {log.action}
                        </Badge>
                        <div className="text-[10px] text-text-secondary mt-0.5">
                          {log.actor_name}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono text-[11px] text-primary">
                        {log.entity}
                      </td>
                      <td className="py-3 px-3 text-text-secondary leading-relaxed">
                        {log.detail}
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
