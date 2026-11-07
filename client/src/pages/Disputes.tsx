import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { Button, Card, Modal, MoneyText } from '../ui';

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Khiếu nại dịch vụ & Hoàn tiền (BR-ESC-04)</h1>
          <p className="text-sm text-text-secondary">
            Khiếu nại chỉ đóng băng khoản tiền của đúng đối tác bị phản ánh; đối tác còn lại vẫn được giải ngân bình thường.
          </p>
        </div>
        <Button onClick={() => setOpenCreate(true)} iconStart={<Plus className="size-4" aria-hidden />}>
          Gửi khiếu nại mới
        </Button>
      </div>

      {error && (
        <Card className="border-status-disputed/40 p-4 text-sm font-semibold text-status-disputed" role="alert">
          {error}
        </Card>
      )}

      {disputes.length === 0 ? (
        <Card className="p-8 text-center text-sm text-text-secondary">Chưa có khiếu nại nào.</Card>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <Card key={d.id} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="size-4 text-status-disputed" aria-hidden />
                  Đối tác bị khiếu nại: {d.target_provider_name}
                </span>
                <span className="rounded-full bg-bg-subtle px-2.5 py-0.5 font-semibold">{d.status}</span>
              </div>
              <p className="text-sm">{d.reason}</p>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary">
                <span>Người gửi: {d.reporter_name} · Phòng: {d.lobby_id}</span>
                <span>Yêu cầu hoàn: <MoneyText amount={d.refund_amount} /></span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Gửi khiếu nại dịch vụ (UC11)">
        <form onSubmit={onCreate} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-text-secondary">Mã phòng (Lobby ID)</label>
            {lobbies.length > 0 ? (
              <select
                value={lobbyId}
                onChange={(e) => setLobbyId(e.target.value)}
                className="mt-1 w-full rounded-md border border-border-default bg-bg-surface px-3 py-2"
              >
                {lobbies.map((l) => (
                  <option key={l.id} value={l.id}>
                    #{l.invite_code} — {l.slot?.provider?.name} ({l.id})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={lobbyId}
                onChange={(e) => setLobbyId(e.target.value)}
                placeholder="lob-01"
                className="mt-1 w-full rounded-md border border-border-default px-3 py-2"
              />
            )}
          </div>

          <div>
            <label className="block font-semibold text-text-secondary">Đối tác bị khiếu nại (Provider ID)</label>
            <input
              type="text"
              required
              value={targetProviderId}
              onChange={(e) => setTargetProviderId(e.target.value)}
              placeholder="prv-fnb-01 hoặc prv-venue-01"
              className="mt-1 w-full rounded-md border border-border-default px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-text-secondary">Lý do khiếu nại</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Mô tả chi tiết (VD: Quán giao thiếu 1 ly trà đào cam sả)..."
              className="mt-1 w-full rounded-md border border-border-default px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-text-secondary">Số tiền yêu cầu hoàn (VND)</label>
            <input
              type="number"
              required
              min={0}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-default px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-text-secondary">Link ảnh bằng chứng (tùy chọn)</label>
            <input
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-md border border-border-default px-3 py-2"
            />
          </div>

          <Button type="submit" loading={submitting} className="w-full">
            Gửi khiếu nại & Đóng băng Escrow đối tác
          </Button>
        </form>
      </Modal>
    </div>
  );
}
