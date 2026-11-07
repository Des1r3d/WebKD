import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Upload,
  Snowflake,
  CheckCircle2,
  XCircle,
  Scale,
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
} from '../components';
import { MOCK_DISPUTES, DisputeStatus, type Dispute } from '../lib/mockData';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../lib/api';

export const DisputePage: React.FC = () => {
  const { token, currentUser } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>(MOCK_DISPUTES);
  const [targetProvider, setTargetProvider] = useState<string>('prv-fnb-01');
  const [reason, setReason] = useState<string>('');
  const [refundReq, setRefundReq] = useState<number>(30000);

  useEffect(() => {
    let isMounted = true;
    const fetchDisputes = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/disputes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data) {
            setDisputes(json.data);
          }
        }
      } catch {
        // Fallback mock
      }
    };
    fetchDisputes();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/disputes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lobbyId: 'lob-01',
          targetProviderId: targetProvider,
          reason: reason.trim(),
          refundAmount: refundReq,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.dispute) {
          setDisputes((prev) => [json.data.dispute, ...prev]);
          setReason('');
          return;
        }
      }
    } catch {
      // Fallback local
    }

    const newDispute: Dispute = {
      id: `dsp-${Date.now()}`,
      lobby_id: 'lob-01',
      reporter_id: currentUser?.id || 'usr-host-01',
      reporter_name: currentUser?.full_name || 'Đào Tiến Đạt (Host)',
      target_provider_id: targetProvider,
      target_provider_name:
        targetProvider === 'prv-fnb-01'
          ? 'Trà Sữa & Nước Ép Phúc Long KTX Khu B'
          : 'Sân Cầu Lông NVH Sinh Viên ĐHQG',
      reason: reason.trim(),
      evidence_urls: [],
      status: DisputeStatus.OPEN,
      refund_amount: refundReq,
      created_at: new Date().toISOString(),
    };

    setDisputes((prev) => [newDispute, ...prev]);
    setReason('');
  };

  const handleResolve = async (id: string, nextStatus: DisputeStatus) => {
    try {
      await fetch(`${getApiBaseUrl()}/api/admin/disputes/${id}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {
      // Fallback
    }

    setDisputes((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: nextStatus,
              resolved_by: currentUser?.full_name || 'Admin Hệ Thống',
            }
          : d
      )
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <Card padding="md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="disputed" size="sm">
                BR-ESC-04 · Đóng băng FROZEN
              </Badge>
              <Badge variant="outline" size="sm">
                BR-DSP-01 · Phân xử &amp; Audit Log
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-text-primary">
               Trung Tâm Khiếu Nại &amp; Đóng Băng Tiền Escrow Từng Phần
            </h1>
          </div>
        </div>
      </Card>

      {/* Main 12-Col Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Submit Dispute Form */}
        <div className="lg:col-span-5">
          <Card padding="md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-status-disputed" />
                <span>Gửi Khiếu Nại Mới (`POST /api/disputes`)</span>
              </CardTitle>
              <CardDescription>
                Khi gửi khiếu nại trước thời điểm giải ngân, chỉ khoản tiền của đối tác bị khiếu nại chuyển sang <code className="font-mono">FROZEN</code>. Đối tác còn lại vẫn được giải ngân bình thường (<code className="font-mono">BR-ESC-04</code>).
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmitDispute} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-text-primary mb-1">
                    Đối tác bị khiếu nại (`target_provider_id`)
                  </label>
                  <select
                    value={targetProvider}
                    onChange={(e) => setTargetProvider(e.target.value)}
                    aria-label="Chọn đối tác bị khiếu nại"
                    className="w-full px-3 py-2 bg-bg-subtle border border-border-default rounded-md text-text-primary outline-none focus:border-primary"
                  >
                    <option value="prv-fnb-01">
                      FNB: Trà Sữa &amp; Nước Ép Phúc Long KTX Khu B (Khoản giữ: 95.000₫)
                    </option>
                    <option value="prv-venue-01">
                      VENUE: Sân Cầu Lông NVH Sinh Viên ĐHQG (Khoản giữ: 120.000₫)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-text-primary mb-1">
                    Số tiền đề nghị hoàn (`refund_amount` VND)
                  </label>
                  <input
                    type="number"
                    step={5000}
                    min={5000}
                    max={120000}
                    value={refundReq}
                    onChange={(e) => setRefundReq(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-bg-subtle border border-border-default rounded-md font-mono text-text-primary outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text-primary mb-1">
                    Lý do chi tiết (`reason`)
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Mô tả sự cố (giao thiếu món, trễ giờ, sân mất điện...)"
                    className="w-full px-3 py-2 bg-bg-subtle border border-border-default rounded-md text-text-primary outline-none focus:border-primary"
                  />
                </div>

                <div className="p-3 rounded-lg border border-dashed border-border-strong bg-bg-subtle/40 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Upload className="w-4 h-4 text-primary" />
                    <span>Ảnh bằng chứng (`multer` → `server/uploads/`)</span>
                  </div>
                  <Badge variant="neutral" size="sm">
                    1 ảnh đã đính kèm
                  </Badge>
                </div>

                <Button type="submit" variant="danger" size="md" className="w-full">
                  Gửi Khiếu Nại &amp; Đóng Băng Khoản Tiền Liên Quan
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right 7 Cols: Disputes List & Admin Resolution */}
        <div className="lg:col-span-7 space-y-4">
          <Card padding="md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" />
                  <span>Danh Sách Khiếu Nại &amp; Phân Xử (`disputes`)</span>
                </CardTitle>
                <span className="text-xs text-text-secondary">
                  Ghi vết tự động vào <code className="font-mono">audit_logs</code>
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {disputes.map((dsp) => (
                <div
                  key={dsp.id}
                  className="p-4 rounded-xl border border-border-default bg-bg-surface space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          dsp.status === DisputeStatus.OPEN
                            ? 'disputed'
                            : dsp.status === DisputeStatus.RESOLVED
                            ? 'completed'
                            : 'cancelled'
                        }
                        size="sm"
                      >
                        {dsp.status}
                      </Badge>
                      <span className="text-xs font-bold text-text-primary">
                        Đối tác: {dsp.target_provider_name}
                      </span>
                    </div>

                    {dsp.status === DisputeStatus.OPEN && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                        <Snowflake className="w-3 h-3" /> Escrow đang FROZEN
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-text-secondary bg-bg-subtle p-2.5 rounded-md border border-border-default">
                    &ldquo;{dsp.reason}&rdquo; — Người báo: <strong>{dsp.reporter_name}</strong>
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="text-xs">
                      <span className="text-text-secondary">Yêu cầu hoàn tiền: </span>
                      <MoneyText amount={dsp.refund_amount} size="md" variant="negative" />
                    </div>

                    {dsp.status === DisputeStatus.OPEN ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<XCircle className="w-3.5 h-3.5" />}
                          onClick={() => handleResolve(dsp.id, DisputeStatus.REJECTED)}
                        >
                          Bác bỏ (Giải ngân Provider)
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          onClick={() => handleResolve(dsp.id, DisputeStatus.RESOLVED)}
                        >
                          Duyệt hoàn tiền (RESOLVED)
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-medium">
                        Đã xử lý bởi {dsp.resolved_by || 'Admin'} · Đã ghi audit_logs
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
