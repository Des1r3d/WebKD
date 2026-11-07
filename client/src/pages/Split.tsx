import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Badge, Button, Card, MoneyText, QRCard } from '../ui';

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
      <Card className="space-y-3 border-status-disputed/40 p-6 text-center" role="alert">
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to={`/lobby/${lobby.invite_code}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-primary"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Quay lại phòng #{lobby.invite_code}
        </Link>
        <Badge kind={lobby.status} />
      </div>

      <div>
        <h1 className="text-2xl font-bold">Chia Bill & Thanh Toán VietQR (BR-INT-02)</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Thuật toán Largest Remainder đảm bảo tổng các phần chia khớp tuyệt đối 100% tổng hóa đơn.
        </p>
      </div>

      {statusMsg && (
        <div role="status" className="rounded-lg border border-border-strong bg-bg-surface p-3 text-sm font-medium">
          {statusMsg}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bảng chi tiết từng thành viên */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-x-auto">
            <h2 className="mb-3 text-base font-semibold">Bảng phân bổ chi phí từng thành viên</h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-default text-text-secondary">
                  <th className="py-2 pr-2">Thành viên</th>
                  <th className="py-2 px-2 text-right">Tiền sân</th>
                  <th className="py-2 px-2 text-right">Món riêng</th>
                  <th className="py-2 px-2 text-right">Ship</th>
                  <th className="py-2 px-2 text-right">Giảm giá</th>
                  <th className="py-2 px-2 text-right">Trừ cọc</th>
                  <th className="py-2 px-2 text-right">Cần trả</th>
                  <th className="py-2 pl-2 text-right">Trạng thái</th>
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
                    <td className="py-2.5 px-2 text-right"><MoneyText amount={b.slot_share} /></td>
                    <td className="py-2.5 px-2 text-right"><MoneyText amount={b.food_amount} /></td>
                    <td className="py-2.5 px-2 text-right"><MoneyText amount={b.ship_share} /></td>
                    <td className="py-2.5 px-2 text-right"><MoneyText amount={-b.discount_share} /></td>
                    <td className="py-2.5 px-2 text-right"><MoneyText amount={-b.deposit_offset} /></td>
                    <td className="py-2.5 px-2 text-right font-bold"><MoneyText amount={b.total} /></td>
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
                  <td colSpan={6} className="py-2.5 text-right">Tổng hóa đơn (Cần trả + Cọc đã nộp):</td>
                  <td className="py-2.5 px-2 text-right"><MoneyText amount={sumPayable + sumDeposit} /></td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </Card>

          {/* Khối Check-in & Giải ngân Escrow đa bên (BR-ESC-02, BR-ESC-03, BR-REP-02/03) */}
          {isHost && (
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Điểm danh Check-in & Giải ngân Escrow (UC10)</h2>
                  <p className="text-xs text-text-secondary">
                    Giải ngân tách VENUE (phí 8%) và FNB (phí 12%). Thành viên NO_SHOW bị trừ 15 điểm & mất cọc.
                  </p>
                </div>
                <ShieldCheck className="size-6 text-primary" aria-hidden />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {members.map((m: any) => (
                  <div
                    key={m.user_id}
                    className="flex items-center justify-between rounded-md border border-border-default p-2.5 text-xs"
                  >
                    <span className="font-semibold">{m.full_name}</span>
                    <select
                      aria-label={`Điểm danh ${m.full_name}`}
                      value={attendance[m.user_id] || 'CHECKED_IN'}
                      onChange={(e) =>
                        setAttendance((prev) => ({
                          ...prev,
                          [m.user_id]: e.target.value as 'CHECKED_IN' | 'NO_SHOW',
                        }))
                      }
                      className="rounded border border-border-default bg-bg-surface px-2 py-1 text-xs font-medium"
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
                Xác nhận Check-in & Giải ngân Escrow (BR-ESC-02/03)
              </Button>
            </Card>
          )}

          {/* Sổ cái Escrow của phòng */}
          {escrow && (
            <Card className="space-y-3">
              <h2 className="text-base font-semibold">Sổ cái Escrow của phòng</h2>
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div className="rounded-md bg-bg-subtle p-2.5">
                  <div className="text-text-muted">Đang giữ (HELD)</div>
                  <MoneyText amount={escrow.summary.held} />
                </div>
                <div className="rounded-md bg-bg-subtle p-2.5">
                  <div className="text-text-muted">Đã giải ngân (RELEASED)</div>
                  <MoneyText amount={escrow.summary.released} />
                </div>
                <div className="rounded-md bg-bg-subtle p-2.5">
                  <div className="text-text-muted">Đóng băng (FROZEN)</div>
                  <MoneyText amount={escrow.summary.frozen} />
                </div>
                <div className="rounded-md bg-bg-subtle p-2.5">
                  <div className="text-text-muted">Hoàn tiền (REFUNDED)</div>
                  <MoneyText amount={escrow.summary.refunded} />
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Cột phải: Mã VietQR của người dùng hiện tại */}
        <div>
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
        </div>
      </div>
    </div>
  );
}
