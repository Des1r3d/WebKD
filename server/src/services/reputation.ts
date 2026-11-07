import { store } from '../data/store';
import { calculateReputation } from '../utils/reputation';
import { UserStatus } from '@prisma/client';

export interface ReputationProcessResult {
  userId: string;
  previousScore: number;
  newScore: number;
  delta: number;
  status: UserStatus;
  summary: ReturnType<typeof calculateReputation>;
}

/**
 * BR-REP-02: Bùng kèo (NO_SHOW) -> trừ 15 điểm, nếu < 50 thì chuyển sang FLAGGED
 */
export function applyNoShowPenalty(
  userId: string,
  actorId?: string,
  reason = 'Thành viên bùng kèo không đến check-in (BR-REP-02)'
): ReputationProcessResult {
  const userBefore = store.getUserById(userId);
  if (!userBefore) {
    throw new Error('USER_NOT_FOUND');
  }

  const result = store.updateUserReputation(userId, -15, actorId, reason);
  if (!result) {
    throw new Error('USER_NOT_FOUND');
  }

  const summary = calculateReputation(result.after);

  return {
    userId,
    previousScore: result.before,
    newScore: result.after,
    delta: -15,
    status: result.user.status,
    summary,
  };
}

/**
 * BR-REP-03: Hoàn thành buổi (CHECKED_IN) -> cộng +2 điểm (tối đa 100)
 */
export function applyCheckInReward(
  userId: string,
  actorId?: string,
  reason = 'Hoàn thành buổi tham gia và check-in thành công (BR-REP-03)'
): ReputationProcessResult {
  const userBefore = store.getUserById(userId);
  if (!userBefore) {
    throw new Error('USER_NOT_FOUND');
  }

  const result = store.updateUserReputation(userId, 2, actorId, reason);
  if (!result) {
    throw new Error('USER_NOT_FOUND');
  }

  const summary = calculateReputation(result.after);

  return {
    userId,
    previousScore: result.before,
    newScore: result.after,
    delta: result.after - result.before,
    status: result.user.status,
    summary,
  };
}
