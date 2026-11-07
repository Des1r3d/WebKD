import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard, ReceiptText, ShieldCheck, Users, Wallet } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Badge, Button, Card, MoneyText, PageHeader, QRCard, StatCard } from '../ui';

export default function Split() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const [detail, setDetail] = useState<any | null>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [escrow, setEscrow] = useState<any | null>(null);
  const [attendance, setAttendance] = useState<Record<string, 'CHECKED_IN' | 'NO_SHOW'>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadAll = async () => {
    if (!code) return;
    setError(null);
    try {
      const lobRes = await api<{ success: boolean; data: any }>(`/api/lobbies/${code}`);
      const lob = lobRes.data;
      setDetail(lob);

      const initAtt: Record<string, 'CHECKED_IN' | 'NO_SHOW'> = {};
      for (const m of lob.members || []) {
        initAtt[m.user_id] = m.status === 'NO_SHOW' ? 'NO_SHOW' : 'CHECKED_IN';
      }
      setAttendance((prev) => (Object.keys(prev).length ? prev : initAtt));

      const billRes = await api<{ success: boolean; data: any[] }>(`/api/lobbies/${lob.lobby.id}/bills`);
      if ((!billRes.data || billRes.data.length === 0) && (user?.id === lob.lobby.host_id || user?.role === 'ADMIN')) {
        const splitRes = await api<{ success: boolean; data: { bills: any[] } }>(`/api/lobbies/${lob.lobby.id}/split`, {
          method: 'POST',
        });
        setBills(splitRes.data.bills || []);
      } else {
        setBills(billRes.data || []);
      }

      const escRes = await api<{ success: boolean; data: any }>(`/api/escrow/${lob.lobby.id}`).catch(() => null);
      if (escRes) setEscrow(escRes.data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải bảng chia bill');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [code]);

  const onMockWebhook = async (splitBillId: string) => {
    setBusyId(splitBillId);
    setStatusMsg(null);
    try {
      const res = await api<{ message: string }>('/api/payments/webhook-mock', {
        method: 'POST',
        body: { splitBillId },
      });
      setStatusMsg(res.message);
      await loadAll();
    } catch (err: any) {
      setStatusMsg(`Lỗi thanh toán: ${err?.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const onCheckInRelease = async () => {
    if (!detail) return;
    setBusyId('checkin');
    setStatusMsg(null);
    try {
      const membersPayload = Object.entries(attendance).map(([userId, status]) => ({ userId, status }));
      const res = await api<{ message: string }>(`/api/lobbies/${detail.lobby.id}/checkin`, {
        method: 'POST',
        body: { members: membersPayload },
      });
      setStatusMsg(res.message);
      await loadAll();
    } catch (err: any) {
      setStatusMsg(`Lỗi giải ngân: ${err?.message}`);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <Card className="p-8 text-center text-sm text-text-secondary" role="status">Đang tính toán bảng chia bill...</Card>;
  }

  if (error || !detail) {
    return (
      <Card className="space-y-3 border-status-disputed p-6 text-center" role="alert">
        <p className="text-sm font-semibold text-status-disputed">{error || 'Không tìm thấy phòng'}</p>
        <Link to="/" className="text-xs font-semibold text-primary hover:underline">← Về trang khám phá</Link>
      </Card>
    );
  }

  const { lobby, members = [] } = detail;
  const isHost = user?.id === lobby.host_id || user?.role === 'ADMIN';
  const memberName = (uid: string) => members.find((m: any) => m.user_id === uid)?.full_name || uid;
  const myBill = bills.find((b) => b.user_id === user?.id) || bills[0];
  const sumPayable = bills.reduce((s, b) => s + b.total, 0);
  const sumDeposit = bills.reduce((s, b) => s + b.deposit_offset, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chia bill & thanh toán VietQR"
        back={
          <Link
            to={`/lobby/${lobby.invite_code}`}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-primary"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> Quay lại phòng #{lobby.invite_code}
          </Link>
        }
        description="Thuật toán Largest Remainder đảm bảo tổng các phần chia khớp tuyệt đối 100% tổng hóa đơn (BR-INT-02)."
        actions={<Badge kind={lobby.status} />}
      />

      {statusMsg && (
        <div role="status" className="rounded-lg border border-border-strong bg-bg-surface p-3 text-sm font-medium">
          {statusMsg}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng cần thanh toán" value={<MoneyText amount={sumPayable} />} icon={<ReceiptText className="size-4" aria-hidden />} hint="Sau khi trừ cọc và voucher" />
        <StatCard label="Cọc đã nộp" value={<MoneyText amount={sumDeposit} />} icon={<Wallet className="size-4" aria-hidden />} tone="warning" hint="Được trừ vào phần tiền sân" />
        <StatCard label="Tổng hóa đơn phòng" value={<MoneyText amount={sumPayable + sumDeposit} />} icon={<Users className="size-4" aria-hidden />} tone="positive" hint={`${bills.length} thành viên · ${lobby.invite_code}`} />
      </div>

      <div className="grid gap-6 min-[1440px]:grid-cols-[minmax(0,1fr)_340px]">
        <div className="order-2 min-w-0 space-y-6 min-[1440px]:order-1">
          <Card className="overflow-x-auto">
            <h2 className="mb-3 text-base font-semibold">Bảng phân bổ chi phí từng thành viên</h2>
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead>
                <tr className="border-b border-border-default text-text-secondary">
                  <th className="py-2 pr-2 font-medium">Thành viên</th>
                  <th className="px-2 py-2 text-right font-medium">Tiền sân</th>
                  <th className="px-2 py-2 text-right font-medium">Món riêng</th>
                  <th className="px-2 py-2 text-right font-medium">Ship</th>
                  <th className="px-2 py-2 text-right font-medium">Giảm giá</th>
                  <th className="px-2 py-2 text-right font-medium">Trừ cọc</th>
                  <th className="px-2 py-2 text-right font-medium">Cần trả</th>
                  <th className="py-2 pl-2 text-right font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {bills.map((b) => (
                  <tr key={b.id}>
                    <td className="py-2.5 pr-2 font-semibold">
                      {memberName(b.user_id)}
                      {b.user_id === lobby.host_id && (
                        <span className="ml-1 rounded bg-accent-light px-1.5 py-0.5 text-[10px] text-accent">Host</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-right"><MoneyText amount={b.slot_share} /></td>
                    <td className="px-2 py-2.5 text-right"><MoneyText amount={b.food_amount} /></td>
                    <td className="px-2 py-2.5 text-right"><MoneyText amount={b.ship_share} /></td>
                    <td className="px-2 py-2.5 text-right"><MoneyText amount={-b.discount_share} /></td>
                    <td className="px-2 py-2.5 text-right"><MoneyText amount={-b.deposit_offset} /></td>
                    <td className="px-2 py-2.5 text-right font-bold"><MoneyText amount={b.total} /></td>
                    <td className="py-2.5 pl-2 text-right">
                      {b.status === 'PAID' ? (
                        <Badge kind="PAID" />
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={busyId === b.id}
                          onClick={() => onMockWebhook(b.id)}
                          iconStart={<CreditCard className="size-3.5" aria-hidden />}
                        >
                          Giả lập đã nhận tiền
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border-strong font-bold">
                  <td colSpan={6} className="py-2.5 text-right">Tổng hóa đơn (cần trả + cọc đã nộp):</td>
                  <td className="px-2 py-2.5 text-right"><MoneyText amount={sumPayable + sumDeposit} /></td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </Card>

          {isHost && (
            <Card className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Điểm danh Check-in &amp; giải ngân Escrow</h2>
                  <p className="mt-1 text-xs leading-5 text-text-secondary">
                    Giải ngân tách VENUE (phí 8%) và FNB (phí 12%). Thành viên NO_SHOW bị trừ 15 điểm &amp; mất cọc.
                  </p>
                </div>
                <ShieldCheck className="size-6 shrink-0 text-primary" aria-hidden />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {members.map((m: any) => (
                  <div
                    key={m.user_id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border-default p-2.5 text-xs"
                  >
                    <span className="min-w-0 truncate font-semibold">{m.full_name}</span>
                    <select
                      aria-label={`Điểm danh ${m.full_name}`}
                      value={attendance[m.user_id] || 'CHECKED_IN'}
                      onChange={(e) =>
                        setAttendance((prev) => ({
                          ...prev,
                          [m.user_id]: e.target.value as 'CHECKED_IN' | 'NO_SHOW',
                        }))
                      }
                      className="shrink-0 rounded border border-border-default bg-bg-surface px-2 py-1 text-xs font-medium text-text-primary"
                    >
                      <option value="CHECKED_IN">Có mặt (+2đ)</option>
                      <option value="NO_SHOW">Bùng kèo (-15đ, phạt cọc)</option>
                    </select>
                  </div>
                ))}
              </div>

              <Button
                onClick={onCheckInRelease}
                loading={busyId === 'checkin'}
                iconStart={<CheckCircle2 className="size-4" aria-hidden />}
              >
                Xác nhận Check-in &amp; Giải ngân Escrow (BR-ESC-02/03)
              </Button>
            </Card>
          )}

          {escrow && (
            <Card className="space-y-3">
              <h2 className="text-base font-semibold">Sổ cái Escrow của phòng</h2>
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div className="rounded-lg bg-bg-subtle p-3">
                  <div className="text-text-muted">Đang giữ (HELD)</div>
                  <MoneyText amount={escrow.summary.held} />
                </div>
                <div className="rounded-lg bg-bg-subtle p-3">
                  <div className="text-text-muted">Đã giải ngân (RELEASED)</div>
                  <MoneyText amount={escrow.summary.released} />
                </div>
                <div className="rounded-lg bg-bg-subtle p-3">
                  <div className="text-text-muted">Đóng băng (FROZEN)</div>
                  <MoneyText amount={escrow.summary.frozen} />
                </div>
                <div className="rounded-lg bg-bg-subtle p-3">
                  <div className="text-text-muted">Hoàn tiền (REFUNDED)</div>
                  <MoneyText amount={escrow.summary.refunded} />
                </div>
              </div>
            </Card>
          )}
        </div>

        <aside className="order-1 grid gap-4 sm:grid-cols-2 sm:items-start min-[1440px]:order-2 min-[1440px]:sticky min-[1440px]:top-24 min-[1440px]:block">
          {myBill ? (
            <QRCard
              title={`VietQR của ${memberName(myBill.user_id)}`}
              imageUrl={myBill.vietqr_url}
              copyText={`SYNCHUB ${lobby.invite_code} ${myBill.user_id.slice(0, 6)}`}
              copyLabel="Sao chép nội dung CK"
              hint={`Số tiền cần chuyển: ${myBill.total.toLocaleString('vi-VN')} ₫`}
            />
          ) : (
            <Card className="p-6 text-center text-xs text-text-secondary">
              Chưa có hóa đơn VietQR cho phòng này.
            </Card>
          )}
          <Card className="space-y-2 min-[1440px]:mt-4">
            <h2 className="text-sm font-semibold">Quy trình thanh toán</h2>
            <ol className="space-y-2 text-xs leading-5 text-text-secondary">
              <li>1. Quét VietQR và chuyển đúng nội dung CK.</li>
              <li>2. Hệ thống ghi nhận qua webhook giả lập.</li>
              <li>3. Host điểm danh để giải ngân Escrow đa bên.</li>
            </ol>
          </Card>
        </aside>
      </div>
    </div>
  );
}
