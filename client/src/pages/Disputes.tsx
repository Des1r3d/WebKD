import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Plus, ShieldAlert, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Button, Card, EmptyState, Modal, MoneyText, PageHeader, StatCard } from '../ui';

const STATUS: Record<string, { label: string; className: string }> = {
  OPEN: { label: 'Đang mở', className: 'bg-accent-light text-accent' },
  RESOLVED: { label: 'Đã duyệt hoàn', className: 'bg-primary-light text-primary' },
  REJECTED: { label: 'Bị từ chối', className: 'bg-bg-subtle text-status-cancelled' },
};

const FIELD =
  'mt-1 h-10 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none';

export default function Disputes() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

  const [lobbyId, setLobbyId] = useState('');
  const [targetProviderId, setTargetProviderId] = useState('');
  const [reason, setReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('25000');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dispRes, lobRes] = await Promise.all([
        api<{ success: boolean; data: any[] }>('/api/disputes'),
        api<{ success: boolean; data: any[] }>('/api/lobbies').catch(() => ({ data: [] })),
      ]);
      setDisputes(dispRes.data || []);
      setLobbies(lobRes.data || []);
      if (lobRes.data?.[0]) {
        setLobbyId(lobRes.data[0].id);
        setTargetProviderId(lobRes.data[0].fnb_provider_id || lobRes.data[0].slot?.provider_id || 'prv-fnb-01');
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách khiếu nại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api('/api/disputes', {
        method: 'POST',
        body: {
          lobbyId,
          targetProviderId,
          reason,
          refundAmount: Number(refundAmount) || 0,
          evidenceUrls: evidenceUrl.trim() ? [evidenceUrl.trim()] : [],
        },
      });
      setOpenCreate(false);
      setReason('');
      await load();
    } catch (err: any) {
      alert(err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Card className="p-8 text-center text-sm text-text-secondary" role="status">Đang tải khiếu nại...</Card>;
  }

  const openCount = disputes.filter((d) => d.status === 'OPEN').length;
  const doneCount = disputes.filter((d) => d.status === 'RESOLVED' || d.status === 'REJECTED').length;
  const refundTotal = disputes.filter((d) => d.status === 'RESOLVED').reduce((acc, d) => acc + (d.refund_amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Khiếu nại dịch vụ & hoàn tiền"
        description="Khiếu nại chỉ đóng băng khoản tiền của đúng đối tác bị phản ánh; đối tác còn lại vẫn được giải ngân bình thường (BR-ESC-04)."
        actions={
          <Button onClick={() => setOpenCreate(true)} iconStart={<Plus className="size-4" aria-hidden />}>
            Gửi khiếu nại mới
          </Button>
        }
      />

      {error && (
        <Card className="border-status-disputed p-4 text-sm font-semibold text-status-disputed" role="alert">
          {error}
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng khiếu nại" value={<span className="font-mono">{disputes.length}</span>} icon={<ShieldAlert className="size-4" aria-hidden />} />
        <StatCard label="Đang chờ xử lý" value={<span className="font-mono">{openCount}</span>} icon={<Clock className="size-4" aria-hidden />} tone="warning" />
        <StatCard label="Đã xử lý" value={<span className="font-mono">{doneCount}</span>} icon={<CheckCircle2 className="size-4" aria-hidden />} tone="positive" />
        <StatCard label="Đã hoàn cho thành viên" value={<MoneyText amount={refundTotal} />} icon={<XCircle className="size-4" aria-hidden />} />
      </div>

      {disputes.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="size-5" />}
          title="Chưa có khiếu nại nào"
          description="Khi có sự cố về dịch vụ hoặc đơn F&B, bạn có thể gửi khiếu nại kèm bằng chứng để yêu cầu hoàn tiền."
          action={<Button size="sm" variant="outline" onClick={() => setOpenCreate(true)}>Gửi khiếu nại đầu tiên</Button>}
        />
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => {
            const status = STATUS[d.status] ?? { label: d.status, className: 'bg-bg-subtle text-text-secondary' };
            return (
              <Card key={d.id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-bg-subtle text-status-disputed" aria-hidden>
                      <AlertTriangle className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary">Đối tác bị khiếu nại: {d.target_provider_name}</p>
                      <p className="mt-0.5 text-[11px] text-text-muted">
                        Người gửi: {d.reporter_name} · Phòng: <span className="font-mono">#{d.lobby_invite_code ?? d.lobby_id}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.className}`}>{status.label}</span>
                </div>

                <p className="text-sm leading-6 text-text-secondary">{d.reason}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-default pt-3 text-xs">
                  <span className="text-text-secondary">
                    {d.status === 'OPEN' ? 'Yêu cầu hoàn' : d.status === 'RESOLVED' ? 'Đã hoàn' : 'Đề nghị hoàn ban đầu'}
                  </span>
                  <MoneyText amount={d.refund_amount} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Gửi khiếu nại dịch vụ (UC11)">
        <form onSubmit={onCreate} className="space-y-3">
          <div>
            <label htmlFor="dispute-lobby" className="block text-xs font-semibold text-text-secondary">Mã phòng (Lobby ID)</label>
            {lobbies.length > 0 ? (
              <select
                id="dispute-lobby"
                value={lobbyId}
                onChange={(e) => setLobbyId(e.target.value)}
                className={FIELD}
              >
                {lobbies.map((l) => (
                  <option key={l.id} value={l.id}>
                    #{l.invite_code} — {l.slot?.provider?.name} ({l.id})
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="dispute-lobby"
                type="text"
                required
                value={lobbyId}
                onChange={(e) => setLobbyId(e.target.value)}
                placeholder="lob-01"
                className={FIELD}
              />
            )}
          </div>

          <div>
            <label htmlFor="dispute-provider" className="block text-xs font-semibold text-text-secondary">Đối tác bị khiếu nại (Provider ID)</label>
            <input
              id="dispute-provider"
              type="text"
              required
              value={targetProviderId}
              onChange={(e) => setTargetProviderId(e.target.value)}
              placeholder="prv-fnb-01 hoặc prv-venue-01"
              className={FIELD}
            />
          </div>

          <div>
            <label htmlFor="dispute-reason" className="block text-xs font-semibold text-text-secondary">Lý do khiếu nại</label>
            <textarea
              id="dispute-reason"
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Mô tả chi tiết (VD: Quán giao thiếu 1 ly trà đào cam sả)..."
              className={`${FIELD} h-auto py-2`}
            />
          </div>

          <div>
            <label htmlFor="dispute-refund" className="block text-xs font-semibold text-text-secondary">Số tiền yêu cầu hoàn (VND)</label>
            <input
              id="dispute-refund"
              type="number"
              required
              min={0}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className={FIELD}
            />
          </div>

          <div>
            <label htmlFor="dispute-evidence" className="block text-xs font-semibold text-text-secondary">Link ảnh bằng chứng (tùy chọn)</label>
            <input
              id="dispute-evidence"
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://..."
              className={FIELD}
            />
          </div>

          <Button type="submit" loading={submitting} className="w-full">
            Gửi khiếu nại &amp; đóng băng Escrow đối tác
          </Button>
        </form>
      </Modal>
    </div>
  );
}
