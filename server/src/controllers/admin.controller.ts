import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { store } from '../data/store';
import { handleResolveDispute } from './dispute.controller';

/**
 * GET /api/admin/stats
 * UC12 / WBS-5.3: Thống kê tổng hợp nền tảng cho Admin Dashboard
 */
export async function handleGetAdminStats(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const stats = store.getAdminStats();
    const flaggedUsers = store
      .getAllUsers()
      .filter((u) => u.status === 'FLAGGED' || u.reputation_score < 50);

    const recentAuditLogs = store.getAuditLogs(20);
    const recentDisputes = store.getAllDisputes().slice(0, 10);

    res.json({
      success: true,
      data: {
        ...stats,
        flagged_users: flaggedUsers,
        recent_audit_logs: recentAuditLogs,
        recent_disputes: recentDisputes,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * GET /api/admin/users
 * Danh sách người dùng hệ thống
 */
export async function handleGetUsers(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const users = store.getAllUsers().map((u) => {
      const { password_hash, ...safe } = u as any;
      return safe;
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * PATCH /api/admin/users/:id/status
 * Admin cập nhật trạng thái hoặc điểm uy tín tài khoản (kèm ghi audit_logs)
 */
export async function handleUpdateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const adminId = req.user?.userId;
    const id = String(req.params.id);
    const { status, reputationScore } = req.body;

    if (!status && reputationScore === undefined) {
      res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Cần cung cấp status hoặc reputationScore để cập nhật',
      });
      return;
    }

    const updated = store.updateUserStatus(
      id,
      status,
      reputationScore !== undefined ? Number(reputationScore) : undefined,
      adminId
    );

    if (!updated) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Không tìm thấy người dùng' });
      return;
    }

    const { password_hash, ...safe } = updated as any;

    res.json({
      success: true,
      message: 'Cập nhật trạng thái người dùng thành công (Đã ghi audit log)',
      data: safe,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * GET /api/admin/audit-logs
 * Tra cứu nhật ký kiểm toán hệ thống
 */
export async function handleGetAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const limit = Number(req.query.limit) || 50;
    const logs = store.getAuditLogs(limit);

    res.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

export { handleResolveDispute };
