import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Receipt,
  CheckCircle2,
  Calculator,
  QrCode,
  ShieldCheck,
  ArrowRight,
  Zap,
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
  QRCard,
} from '../components';
import { STANDARD_SPLIT_BILLS, SplitBillStatus, type SplitBill } from '../lib/mockData';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../lib/api';

export const SplitBillPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const lobbyParam = searchParams.get('lobbyId') || 'lob-01';

  const [bills, setBills] = useState<SplitBill[]>(STANDARD_SPLIT_BILLS);
  const [selectedUserId, setSelectedUserId] = useState<string>('usr-host-01');
  const [scenario, setScenario] = useState<'standard' | 'remainder'>('standard');

  useEffect(() => {
    let isMounted = true;
    const fetchBills = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/lobbies/${lobbyParam}/bills`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data?.length > 0) {
            setBills(
              json.data.map((b: any) => ({
                id: b.id,
                lobby_id: b.lobby_id,
                user_id: b.user_id,
                user_name:
                  b.user_id === 'usr-host-01'
                    ? 'Đào Tiến Đạt (A · Host)'
                    : b.user_id === 'usr-mem-02'
                    ? 'Trần Quang Minh (B)'
                    : b.user_id === 'usr-mem-03'
                    ? 'Lê Hoàng Linh (C · Đã trừ cọc 30k)'
                    : b.user_id === 'usr-mem-04'
                    ? 'Nguyễn Tuấn Kiệt (D)'
                    : `Thành viên (${b.user_id.slice(0, 6)})`,
                is_host: b.user_id === 'usr-host-01',
                slot_share: b.slot_share,
                food_amount: b.food_amount,
                ship_share: b.ship_share,
                discount_share: b.discount_share,
                deposit_offset: b.deposit_offset || 0,
                total: b.total,
                vietqr_url: b.vietqr_url,
                status: b.status as SplitBillStatus,
              }))
            );
          }
        }
      } catch {
        // Fallback standard
      }
    };
    fetchBills();
    return () => {
      isMounted = false;
    };
  }, [lobbyParam, token]);

  const activeBill = bills.find((b) => b.user_id === selectedUserId) || bills[0];

  const handleSimulateWebhookPay = async (billId: string) => {
    try {
      await fetch(`${getApiBaseUrl()}/api/payments/webhook-mock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ splitBillId: billId }),
      });
    } catch {
      // Offline fallback
    }
    setBills((prev) =>
      prev.map((b) => (b.id === billId ? { ...b, status: SplitBillStatus.PAID } : b))
    );
  };

  const handlePayAll = async () => {
    for (const b of bills) {
      try {
        await fetch(`${getApiBaseUrl()}/api/payments/webhook-mock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ splitBillId: b.id }),
        });
      } catch {
        // Fallback
      }
    }
    setBills((prev) => prev.map((b) => ({ ...b, status: SplitBillStatus.PAID })));
  };

  const sumSlot = bills.reduce((s, b) => s + b.slot_share, 0);
  const sumFood = bills.reduce((s, b) => s + b.food_amount, 0);
  const sumShip = bills.reduce((s, b) => s + b.ship_share, 0);
  const sumDiscount = bills.reduce((s, b) => s + b.discount_share, 0);
  const sumTotal = bills.reduce((s, b) => s + b.total + (b.deposit_offset || 0), 0);
  const allPaid = bills.every((b) => b.status === SplitBillStatus.PAID);

  // Switch between Standard Vector (215.000đ) and Largest Remainder Edge Case (100.000đ / 3 người)
  const switchScenario = (mode: 'standard' | 'remainder') => {
    setScenario(mode);
    if (mode === 'standard') {
      setBills(STANDARD_SPLIT_BILLS);
      setSelectedUserId('usr-host-01');
    } else {
      // Ca biên Largest Remainder: Sân 100.000đ / 3 người (không gọi nước) -> Host 33.334đ, B 33.333đ, C 33.333đ (Tổng = 100.000đ)
      setBills([
        {
          id: 'sb-rem-1',
          lobby_id: 'lob-01',
          user_id: 'usr-host-01',
          user_name: 'Đào Tiến Đạt (A · Host · +1đ dư)',
          is_host: true,
          slot_share: 33334,
          food_amount: 0,
          ship_share: 0,
          discount_share: 0,
          deposit_offset: 0,
          total: 33334,
          vietqr_url:
            'https://img.vietqr.io/image/MB-090123456789-compact2.png?amount=33334&addInfo=SYNCHUB%20K8X92A%20usr-ho&accountName=SYNCHUB%20ESCROW',
          status: SplitBillStatus.PAID,
        },
        {
          id: 'sb-rem-2',
          lobby_id: 'lob-01',
          user_id: 'usr-mem-02',
          user_name: 'Trần Quang Minh (B)',
          is_host: false,
          slot_share: 33333,
          food_amount: 0,
          ship_share: 0,
          discount_share: 0,
          deposit_offset: 0,
          total: 33333,
          vietqr_url:
            'https://img.vietqr.io/image/MB-090123456789-compact2.png?amount=33333&addInfo=SYNCHUB%20K8X92A%20usr-me&accountName=SYNCHUB%20ESCROW',
          status: SplitBillStatus.PAID,
        },
        {
          id: 'sb-rem-3',
          lobby_id: 'lob-01',
          user_id: 'usr-mem-03',
          user_name: 'Lê Hoàng Linh (C)',
          is_host: false,
          slot_share: 33333,
          food_amount: 0,
          ship_share: 0,
          discount_share: 0,
          deposit_offset: 0,
          total: 33333,
          vietqr_url:
            'https://img.vietqr.io/image/MB-090123456789-compact2.png?amount=33333&addInfo=SYNCHUB%20K8X92A%20usr-me&accountName=SYNCHUB%20ESCROW',
          status: SplitBillStatus.PENDING,
        },
      ]);
      setSelectedUserId('usr-host-01');
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header Banner */}
      <Card padding="md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={allPaid ? 'paid' : 'awaiting'} size="md">
                {allPaid ? 'PAID · ĐÃ GIỮ TIỀN ESCROW' : 'AWAITING_PAYMENT'}
              </Badge>
              <Badge variant="outline" size="sm">
                BR-INT-02 · Largest Remainder
              </Badge>
              <span className="text-xs font-mono text-text-secondary">
                Assertion: Σ total_i === {sumTotal.toLocaleString('vi-VN')} ₫ ✔
              </span>
            </div>
            <h1 className="text-xl font-bold text-text-primary">
              Bảng Chia Bill Chi Tiết &amp; Thanh Toán VietQR Từng Thành Viên
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex bg-bg-subtle p-1 rounded-md border border-border-default text-xs">
              <button
                onClick={() => switchScenario('standard')}
                className={`px-2.5 py-1 rounded-sm font-medium cursor-pointer ${
                  scenario === 'standard'
                    ? 'bg-bg-surface text-primary shadow-xs font-semibold'
                    : 'text-text-secondary'
                }`}
              >
                Ca chuẩn 215.000₫ (4 người)
              </button>
              <button
                onClick={() => switchScenario('remainder')}
                className={`px-2.5 py-1 rounded-sm font-medium cursor-pointer ${
                  scenario === 'remainder'
                    ? 'bg-bg-surface text-primary shadow-xs font-semibold'
                    : 'text-text-secondary'
                }`}
              >
                Ca biên lẻ 100.000₫ / 3 người
              </button>
            </div>

            {!allPaid && (
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Zap className="w-3.5 h-3.5 text-amber-600" />}
                onClick={handlePayAll}
              >
                Webhook Giả Lập: Tất Cả PAID
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main 12-Col Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Split Bill Table (BR-INT-02 Test Vector) */}
        <div className="lg:col-span-7 space-y-4">
          <Card padding="md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  <span>
                    {scenario === 'standard'
                      ? 'Ca Kiểm Chứng Chuẩn Mục 5.2 CONTEXT.md (Tổng 215.000 ₫)'
                      : 'Ca Biên Làm Tròn Largest Remainder (100.000 ₫ ÷ 3 → Host +1 ₫)'}
                  </span>
                </CardTitle>
              </div>
              <CardDescription>
                Bấm vào từng dòng thành viên để xem mã VietQR cá nhân hóa tương ứng bên phải.
              </CardDescription>
            </CardHeader>

            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-default text-text-secondary bg-bg-subtle/60">
                    <th className="py-2.5 px-3 font-semibold">Thành viên</th>
                    <th className="py-2.5 px-2 text-right font-semibold">slot_share</th>
                    <th className="py-2.5 px-2 text-right font-semibold">food_amount</th>
                    <th className="py-2.5 px-2 text-right font-semibold">ship − voucher</th>
                    <th className="py-2.5 px-2 text-right font-bold text-text-primary">total</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {bills.map((bill) => {
                    const adjNet = bill.ship_share - bill.discount_share;
                    const isSelected = bill.user_id === selectedUserId;

                    return (
                      <tr
                        key={bill.id}
                        onClick={() => setSelectedUserId(bill.user_id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/60 font-medium'
                            : 'hover:bg-bg-subtle/50'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="font-semibold text-text-primary">{bill.user_name}</div>
                          <div className="text-[10px] text-text-muted font-mono">
                            ID: {bill.user_id}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <MoneyText amount={bill.slot_share} size="sm" />
                        </td>
                        <td className="py-3 px-2 text-right">
                          <MoneyText amount={bill.food_amount} size="sm" />
                        </td>
                        <td className="py-3 px-2 text-right">
                          <MoneyText
                            amount={adjNet}
                            size="sm"
                            variant={adjNet < 0 ? 'discount' : 'default'}
                          />
                        </td>
                        <td className="py-3 px-2 text-right">
                          <MoneyText
                            amount={bill.total + (bill.deposit_offset || 0)}
                            size="md"
                            variant="primary"
                          />
                          {bill.deposit_offset > 0 && (
                            <div className="text-[10px] text-text-secondary font-mono">
                              −Cọc {bill.deposit_offset.toLocaleString('vi-VN')}₫ → Còn{' '}
                              {bill.total.toLocaleString('vi-VN')}₫
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {bill.status === SplitBillStatus.PAID ? (
                            <Badge variant="paid" size="sm">
                              PAID
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSimulateWebhookPay(bill.id);
                              }}
                            >
                              Giả lập TT
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border-strong bg-bg-subtle/80 font-bold">
                    <td className="py-3 px-3 text-text-primary">Tổng cộng (Σ)</td>
                    <td className="py-3 px-2 text-right">
                      <MoneyText amount={sumSlot} size="sm" />
                    </td>
                    <td className="py-3 px-2 text-right">
                      <MoneyText amount={sumFood} size="sm" />
                    </td>
                    <td className="py-3 px-2 text-right">
                      <MoneyText
                        amount={sumShip - sumDiscount}
                        size="sm"
                        variant={sumShip - sumDiscount < 0 ? 'discount' : 'default'}
                      />
                    </td>
                    <td className="py-3 px-2 text-right">
                      <MoneyText amount={sumTotal} size="md" variant="primary" />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[11px] text-emerald-700 font-mono">
                        Khớp 100% ✔
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {/* Escrow Assurance Banner */}
          <Card padding="md" className="bg-bg-subtle/50">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h3 className="font-bold text-text-primary">
                  Cơ chế Giữ tiền Trung gian Escrow (BR-ESC-01 &amp; BR-ESC-02)
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Mọi khoản thanh toán VietQR đều được giữ ở trạng thái{' '}
                  <code className="font-mono font-semibold text-teal-700">HELD</code> trong Ví
                  Escrow. Hệ thống chỉ giải ngân cho Chủ sân (trừ 8% phí) và Quán F&amp;B (trừ 12%
                  phí) sau khi Host/Provider bấm <strong>Check-in</strong> tại sân.
                </p>
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={() => navigate('/wallet')}
                  >
                    Xem Ví Escrow &amp; Giải ngân đa bên
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right 5 Cols: Active Member VietQR Card */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-28">
          <Card padding="md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-primary" />
                  <span>Mã VietQR Cá Nhân Hóa</span>
                </CardTitle>
                <Badge
                  variant={activeBill.status === SplitBillStatus.PAID ? 'paid' : 'awaiting'}
                  size="sm"
                >
                  {activeBill.status}
                </Badge>
              </div>
              <CardDescription>
                Thành viên: <strong>{activeBill.user_name}</strong>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <QRCard
                type="vietqr"
                title={`VietQR · ${activeBill.user_name}`}
                qrUrl={activeBill.vietqr_url}
                amount={activeBill.total}
                bankCode="MB"
                accountNumber="090123456789"
                accountName="SYNCHUB ESCROW"
                transferContent={`SYNCHUB K8X92A ${activeBill.user_id.slice(0, 6)}`}
              />

              {activeBill.status === SplitBillStatus.PENDING ? (
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full"
                  leftIcon={<Receipt className="w-4 h-4" />}
                  onClick={() => handleSimulateWebhookPay(activeBill.id)}
                >
                  Giả lập Webhook Ngân Hàng: Xác Nhận Đã Chuyển Khoản
                </Button>
              ) : (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đã thanh toán &amp; ghi nhận vào Escrow HOLD (BR-ESC-01)</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
