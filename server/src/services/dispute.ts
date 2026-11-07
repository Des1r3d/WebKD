import { store } from '../data/store';
import { DisputeStatus, EscrowStatus, EscrowTxType, LobbyStatus } from '@prisma/client';

export interface CreateDisputeInput {
  lobbyId: string;
  reporterId: string;
  targetProviderId: string;
  reason: string;
  refundAmount?: number;
  evidenceUrls?: string[];
}

export interface ResolveDisputeInput {
  status: DisputeStatus;
  refundAmount?: number;
  reason?: string;
}

/**
 * BR-ESC-04: Tạo khiếu nại & đóng băng (FROZEN) khoản tiền của target provider
 */
export async function createDisputeService(input: CreateDisputeInput) {
  const { lobbyId, reporterId, targetProviderId, reason, refundAmount = 0, evidenceUrls = [] } = input;

  const lobby = store.getLobbyById(lobbyId) || store.getLobbyByCode(lobbyId);
  if (!lobby) {
    throw new Error('LOBBY_NOT_FOUND');
  }

  const targetProvider = store.getProviderById(targetProviderId);
  if (!targetProvider) {
    throw new Error('PROVIDER_NOT_FOUND');
  }

  // 1. Tạo bản ghi Dispute
  const dispute = store.createDispute({
    lobby_id: lobby.id,
    reporter_id: reporterId,
    target_provider_id: targetProviderId,
    reason,
    evidence_urls: evidenceUrls,
    status: DisputeStatus.OPEN,
    refund_amount: refundAmount,
    resolved_by: null,
    resolved_at: null,
  });

  // 2. BR-ESC-04: Đóng băng các giao dịch Escrow liên quan đến provider bị khiếu nại
  const escrowTxs = store.getEscrowTransactionsByLobbyId(lobby.id);
  const frozenTxs = [];
  for (const tx of escrowTxs) {
    if (tx.payee_provider_id === targetProviderId && tx.status !== EscrowStatus.REFUNDED) {
      const updated = store.updateEscrowTransactionStatus(tx.id, EscrowStatus.FROZEN);
      if (updated) frozenTxs.push(updated);
    }
  }

  // Chuyển lobby sang DISPUTED
  store.updateLobbyStatus(lobby.id, LobbyStatus.DISPUTED);

  // 3. Ghi audit log
  store.createAuditLog({
    actor_id: reporterId,
    action: 'DISPUTE_CREATE',
    entity: 'disputes',
    entity_id: dispute.id,
    before: null,
    after: {
      lobby_id: lobby.id,
      target_provider_id: targetProviderId,
      reason,
      refund_amount: refundAmount,
      frozen_transactions: frozenTxs.map((t) => t.id),
    },
  });

  return {
    dispute,
    frozenTransactions: frozenTxs,
  };
}

/**
 * BR-DSP-01: Admin phân xử khiếu nại -> Hoàn một phần/toàn phần từ Escrow + ghi audit_logs
 */
export async function resolveDisputeService(
  disputeId: string,
  adminId: string,
  input: ResolveDisputeInput
) {
  const dispute = store.getDisputeById(disputeId);
  if (!dispute) {
    throw new Error('DISPUTE_NOT_FOUND');
  }

  if (dispute.status !== DisputeStatus.OPEN) {
    throw new Error('DISPUTE_ALREADY_RESOLVED');
  }

  const beforeDispute = { ...dispute };
  const refundAmount = input.refundAmount !== undefined ? input.refundAmount : dispute.refund_amount;
  const escrowTxs = store.getEscrowTransactionsByLobbyId(dispute.lobby_id);

  let refundTx: any = null;

  if (input.status === DisputeStatus.RESOLVED) {
    // 1. Tạo giao dịch REFUND từ Escrow
    const refundKey = `refund:${dispute.lobby_id}:${dispute.id}`;
    refundTx = store.createEscrowTransaction({
      lobby_id: dispute.lobby_id,
      split_bill_id: null,
      type: EscrowTxType.REFUND,
      amount: refundAmount,
      platform_fee: 0,
      net_amount: refundAmount,
      payee_provider_id: null,
      status: EscrowStatus.REFUNDED,
      idempotency_key: refundKey,
    });

    // 2. Mở đóng băng cho provider: giải ngân phần còn lại (net_amount - refund)
    for (const tx of escrowTxs) {
      if (tx.payee_provider_id === dispute.target_provider_id && tx.status === EscrowStatus.FROZEN) {
        const remainingNet = Math.max(0, tx.net_amount - refundAmount);
        store.updateEscrowTransactionStatus(tx.id, EscrowStatus.RELEASED, remainingNet);
      }
    }

    // 3. Cập nhật Dispute
    store.updateDispute(dispute.id, {
      status: DisputeStatus.RESOLVED,
      refund_amount: refundAmount,
      resolved_by: adminId,
      resolved_at: new Date(),
    });
  } else {
    // REJECTED: Mở đóng băng giải ngân toàn bộ cho provider
    for (const tx of escrowTxs) {
      if (tx.payee_provider_id === dispute.target_provider_id && tx.status === EscrowStatus.FROZEN) {
        store.updateEscrowTransactionStatus(tx.id, EscrowStatus.RELEASED);
      }
    }

    store.updateDispute(dispute.id, {
      status: DisputeStatus.REJECTED,
      resolved_by: adminId,
      resolved_at: new Date(),
    });
  }

  const updatedDispute = store.getDisputeById(dispute.id);

  // Nếu không còn dispute OPEN nào cho lobby, chuyển sang COMPLETED
  const remainingOpen = store
    .getDisputesByLobbyId(dispute.lobby_id)
    .filter((d) => d.status === DisputeStatus.OPEN);
  if (remainingOpen.length === 0) {
    store.updateLobbyStatus(dispute.lobby_id, LobbyStatus.COMPLETED);
  }

  // Ghi audit log
  store.createAuditLog({
    actor_id: adminId,
    action: 'DISPUTE_RESOLVE',
    entity: 'disputes',
    entity_id: dispute.id,
    before: beforeDispute,
    after: {
      status: input.status,
      refund_amount: refundAmount,
      refund_tx_id: refundTx?.id || null,
      admin_id: adminId,
    },
  });

  return {
    dispute: updatedDispute,
    refundTx,
  };
}
