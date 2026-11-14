import { UserStatus } from '@prisma/client';
import { prisma } from '../prisma.js';
import { calculateReputation } from '../utils/reputation.js';

/** Đổi điểm uy tín (clamp 0..100, <50 => FLAGGED) + audit_logs cùng transaction. Truyền `tx` để gộp vào transaction ngoài. */
async function changeReputation(
  userId,
  delta,
  actorId,
  reason,
  tx
) {
  const run = async (db) => {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('USER_NOT_FOUND');

    const before = user.reputation_score;
    const newScore = Math.min(100, Math.max(0, before + delta));
    const status =
      newScore < 50 ? UserStatus.FLAGGED : user.status === UserStatus.FLAGGED ? UserStatus.ACTIVE : user.status;

    await db.user.update({ where: { id: userId }, data: { reputation_score: newScore, status } });
    await db.auditLog.create({
      data: {
        actor_id: actorId || null,
        action: 'REPUTATION_CHANGE',
        entity: 'users',
        entity_id: userId,
        before: { reputation_score: before },
        after: { reputation_score: newScore, status, delta, reason },
      },
    });

    return {
      userId,
      previousScore: before,
      newScore,
      delta: newScore - before,
      status,
      summary: calculateReputation(newScore),
    };
  };
  return tx ? run(tx) : prisma.$transaction(run);
}

/**
 * BR-REP-02: Bùng kèo (NO_SHOW) -> trừ 15 điểm, nếu < 50 thì chuyển sang FLAGGED
 */
export function applyNoShowPenalty(
  userId,
  actorId,
  reason = 'Thành viên bùng kèo không đến check-in (BR-REP-02)',
  tx
) {
  return changeReputation(userId, -15, actorId, reason, tx);
}

/**
 * BR-REP-03: Hoàn thành buổi (CHECKED_IN) -> cộng +2 điểm (tối đa 100)
 */
export function applyCheckInReward(
  userId,
  actorId,
  reason = 'Hoàn thành buổi tham gia và check-in thành công (BR-REP-03)',
  tx
) {
  return changeReputation(userId, 2, actorId, reason, tx);
}
