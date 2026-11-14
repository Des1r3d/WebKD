import { DisputeStatus, EscrowStatus, EscrowTxType, ProviderType, UserStatus } from '@prisma/client';
import { prisma } from '../prisma.js';
import { handleResolveDispute } from './dispute.controller.js';

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/**
 * GET /api/admin/stats
 * UC12 / WBS-5.3: Thống kê tổng hợp nền tảng cho Admin Dashboard (query thật từ DB)
 */
export async function handleGetAdminStats(_req, res) {
  try {
    const [
      usersTotal,
      flaggedUsersRaw,
      bannedCount,
      lobbiesTotal,
      disputesOpenCount,
      releases,
      heldAgg,
      frozenAgg,
      recentAuditLogs,
      recentDisputes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        where: { OR: [{ status: UserStatus.FLAGGED }, { reputation_score: { lt: 50 } }] },
        orderBy: { reputation_score: 'asc' },
      }),
      prisma.user.count({ where: { status: UserStatus.BANNED } }),
      prisma.groupLobby.count(),
      prisma.dispute.count({ where: { status: DisputeStatus.OPEN } }),
      prisma.escrowTransaction.findMany({
        where: { type: EscrowTxType.RELEASE },
        include: { payee_provider: { select: { type: true } } },
      }),
      prisma.escrowTransaction.aggregate({
        where: { status: EscrowStatus.HELD },
        _sum: { amount: true },
      }),
      prisma.escrowTransaction.aggregate({
        where: { status: EscrowStatus.FROZEN },
        _sum: { amount: true },
      }),
      prisma.auditLog.findMany({ orderBy: { created_at: 'desc' }, take: 20 }),
      prisma.dispute.findMany({ orderBy: { created_at: 'desc' }, take: 10 }),
    ]);

    let gmvTotal = 0;
    let venueFeeTotal = 0;
    let fnbFeeTotal = 0;
    const byDay = new Map(
      ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => [
        d,
        { day: d, venue_fee: 0, fnb_fee: 0, gmv: 0 },
      ])
    );

    for (const tx of releases) {
      gmvTotal += tx.amount;
      const isVenue = tx.payee_provider?.type === ProviderType.VENUE;
      if (isVenue) venueFeeTotal += tx.platform_fee;
      else fnbFeeTotal += tx.platform_fee;

      const label = DAY_LABELS[new Date(tx.created_at).getDay()];
      const bucket = byDay.get(label);
      if (bucket) {
        bucket.gmv += tx.amount;
        if (isVenue) bucket.venue_fee += tx.platform_fee;
        else bucket.fnb_fee += tx.platform_fee;
      }
    }

    const flaggedUsers = flaggedUsersRaw.map(({ password_hash, ...safe }) => safe);

    res.json({
      success: true,
      data: {
        gmv_total: gmvTotal,
        venue_fee_total: venueFeeTotal,
        fnb_fee_total: fnbFeeTotal,
        platform_fee_total: venueFeeTotal + fnbFeeTotal,
        users_total: usersTotal,
        flagged_count: flaggedUsers.length,
        banned_count: bannedCount,
        lobbies_total: lobbiesTotal,
        disputes_open_count: disputesOpenCount,
        held_escrow_amount: heldAgg._sum.amount ?? 0,
        frozen_escrow_amount: frozenAgg._sum.amount ?? 0,
        daily_stats: Array.from(byDay.values()),
        flagged_users: flaggedUsers,
        recent_audit_logs: recentAuditLogs,
        recent_disputes: recentDisputes,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * GET /api/admin/users
 * Danh sách người dùng hệ thống
 */
export async function handleGetUsers(_req, res) {
  try {
    const users = (await prisma.user.findMany({ orderBy: { created_at: 'desc' } })).map(
      ({ password_hash, ...safe }) => safe
    );

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * PATCH /api/admin/users/:id/status
 * Admin cập nhật trạng thái hoặc điểm uy tín tài khoản (kèm ghi audit_logs trong cùng transaction)
 */
export async function handleUpdateUserStatus(req, res) {
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

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Không tìm thấy người dùng' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: {
          ...(status && { status: status}),
          ...(reputationScore !== undefined && { reputation_score: Number(reputationScore) }),
        },
      });
      await tx.auditLog.create({
        data: {
          actor_id: adminId || null,
          action: 'USER_STATUS_CHANGE',
          entity: 'users',
          entity_id: u.id,
          before: { status: existing.status, reputation_score: existing.reputation_score },
          after: { status: u.status, reputation_score: u.reputation_score },
        },
      });
      return u;
    });

    const { password_hash, ...safe } = updated;

    res.json({
      success: true,
      message: 'Cập nhật trạng thái người dùng thành công (Đã ghi audit log)',
      data: safe,
    });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * GET /api/admin/audit-logs
 * Tra cứu nhật ký kiểm toán hệ thống
 */
export async function handleGetAuditLogs(req, res) {
  try {
    const limit = Number(req.query.limit) || 50;
    const logs = await prisma.auditLog.findMany({
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

export { handleResolveDispute };
