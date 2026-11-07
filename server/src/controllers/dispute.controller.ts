import { Response } from 'express';
import { DisputeStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth';
import { prisma } from '../prisma';
import { createDisputeService, resolveDisputeService } from '../services/dispute';

/**
 * POST /api/disputes
 * UC11 / BR-ESC-04: Tạo khiếu nại kèm ảnh bằng chứng, đóng băng tiền Escrow của target provider
 */
export async function handleCreateDispute(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const reporterId = req.user?.userId;
    if (!reporterId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Chưa đăng nhập' });
      return;
    }

    const { lobbyId, targetProviderId, reason, refundAmount } = req.body;

    if (!lobbyId || !targetProviderId || !reason) {
      res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Cần cung cấp lobbyId, targetProviderId và lý do khiếu nại (reason)',
      });
      return;
    }

    // Xử lý bằng chứng: từ uploaded files (multer) hoặc URL từ body
    const evidenceUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        evidenceUrls.push(`/uploads/${file.filename}`);
      }
    } else if (req.file) {
      evidenceUrls.push(`/uploads/${req.file.filename}`);
    }

    if (req.body.evidenceUrls) {
      const urls = Array.isArray(req.body.evidenceUrls)
        ? req.body.evidenceUrls
        : [req.body.evidenceUrls];
      evidenceUrls.push(...urls);
    }

    const result = await createDisputeService({
      lobbyId,
      reporterId,
      targetProviderId,
      reason: String(reason).trim(),
      refundAmount: Number(refundAmount) || 0,
      evidenceUrls,
    });

    res.status(201).json({
      success: true,
      message: 'Gửi khiếu nại thành công, khoản tiền đối tác liên quan đã được đóng băng (BR-ESC-04)',
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'LOBBY_NOT_FOUND' || error.message === 'PROVIDER_NOT_FOUND') {
      res.status(404).json({ error: 'NOT_FOUND', message: error.message });
      return;
    }
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * GET /api/disputes
 * Lấy danh sách khiếu nại (có thể lọc theo lobbyId hoặc status)
 */
export async function handleGetDisputes(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { lobbyId, status } = req.query;

    const disputes = await prisma.dispute.findMany({
      where: {
        ...(lobbyId && { lobby_id: String(lobbyId) }),
        ...(status && { status: String(status) as DisputeStatus }),
      },
      include: {
        reporter: { select: { full_name: true } },
        target_provider: { select: { name: true, type: true } },
        resolver: { select: { full_name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const enriched = disputes.map(({ reporter, target_provider, resolver, ...d }) => ({
      ...d,
      reporter_name: reporter?.full_name || d.reporter_id,
      target_provider_name: target_provider?.name || d.target_provider_id,
      target_provider_type: target_provider?.type,
      resolver_name: resolver?.full_name || d.resolved_by,
    }));

    res.json({
      success: true,
      data: enriched,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * GET /api/disputes/:id
 * Chi tiết một khiếu nại
 */
export async function handleGetDisputeById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const found = await prisma.dispute.findUnique({
      where: { id },
      include: {
        reporter: { select: { full_name: true } },
        target_provider: { select: { name: true } },
        resolver: { select: { full_name: true } },
      },
    });

    if (!found) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Không tìm thấy khiếu nại' });
      return;
    }

    const { reporter, target_provider, resolver, ...dispute } = found;

    res.json({
      success: true,
      data: {
        ...dispute,
        reporter_name: reporter?.full_name,
        target_provider_name: target_provider?.name,
        resolver_name: resolver?.full_name,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * PATCH /api/admin/disputes/:id
 * BR-DSP-01: Admin phân xử khiếu nại (RESOLVED / REJECTED)
 */
export async function handleResolveDispute(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const adminId = req.user?.userId;
    if (!adminId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Chưa đăng nhập' });
      return;
    }

    const id = String(req.params.id);
    const { status, refundAmount, reason } = req.body;

    if (!status || (status !== DisputeStatus.RESOLVED && status !== DisputeStatus.REJECTED)) {
      res.status(400).json({
        error: 'INVALID_STATUS',
        message: 'Trạng thái phân xử phải là RESOLVED hoặc REJECTED',
      });
      return;
    }

    const result = await resolveDisputeService(id, adminId, {
      status,
      refundAmount: refundAmount !== undefined ? Number(refundAmount) : undefined,
      reason,
    });

    res.json({
      success: true,
      message: `Admin đã phân xử khiếu nại thành ${status} (BR-DSP-01)`,
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'DISPUTE_NOT_FOUND') {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Không tìm thấy khiếu nại' });
      return;
    }
    if (error.message === 'DISPUTE_ALREADY_RESOLVED') {
      res.status(400).json({
        error: 'ALREADY_RESOLVED',
        message: 'Khiếu nại này đã được xử lý trước đó',
      });
      return;
    }
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}
