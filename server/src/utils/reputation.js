

/**
 * BR-REP-01: Phân hạng uy tín & tỷ lệ cọc giữ slot
 */
export function calculateReputation(score) {
  if (score >= 90) {
    return {
      score,
      tier: 'A',
      depositPercent: 0,
      canJoinLobby: true,
      tierLabel: 'Hạng A (Uy tín cao · Miễn cọc 0%)',
    };
  }

  if (score >= 70) {
    return {
      score,
      tier: 'B',
      depositPercent: 30,
      canJoinLobby: true,
      tierLabel: 'Hạng B (Tiêu chuẩn · Cọc 30% tiền sân)',
    };
  }

  if (score >= 50) {
    return {
      score,
      tier: 'C',
      depositPercent: 100,
      canJoinLobby: true,
      tierLabel: 'Hạng C (Cảnh báo · Cọc 100% tiền sân)',
    };
  }

  return {
    score,
    tier: 'FLAGGED',
    depositPercent: 100,
    canJoinLobby: false,
    tierLabel: 'FLAGGED (Dưới 50đ · Bị chặn vào phòng)',
  };
}
