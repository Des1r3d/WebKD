import { DisputeStatus, EscrowStatus, EscrowTxType, LobbyStatus } from '@prisma/client';
import { prisma } from '../prisma.js';
import { findLobby } from './lobby.js';

/**
 * BR-ESC-04: Tạo khiếu nại & đóng băng (FROZEN) khoản tiền của target provider
 */
export async function createDisputeService(input) {
  const { lobbyId, reporterId, targetProviderId, reason, refundAmount = 0, evidenceUrls = [] } = input;

  const lobby = await findLobby(lobbyId);
  if (!lobby) {
    throw new Error('LOBBY_NOT_FOUND');
  }

  const targetProvider = await prisma.provider.findUnique({ where: { id: targetProviderId } });
  if (!targetProvider) {
    throw new Error('PROVIDER_NOT_FOUND');
  }

  return prisma.$transaction(async (tx) => {
    // 1. Tạo bản ghi Dispute
    const dispute = await tx.dispute.create({
      data: {
        lobby_id: lobby.id,
        reporter_id: reporterId,
        target_provider_id: targetProviderId,
        reason,
        evidence_urls: evidenceUrls,
        status: DisputeStatus.OPEN,
        refund_amount: refundAmount,
      },
    });

    // 2. BR-ESC-04: Đóng băng các giao dịch Escrow liên quan đến provider bị khiếu nại
    const toFreeze = await tx.escrowTransaction.findMany({
      where: {
        lobby_id: lobby.id,
        payee_provider_id: targetProviderId,
        status: { not: EscrowStatus.REFUNDED },
      },
    });

    if (toFreeze.length > 0) {
      await tx.escrowTransaction.updateMany({
        where: { id: { in: toFreeze.map((t) => t.id) } },
        data: { status: EscrowStatus.FROZEN },
      });
    }

    const frozenTxs = await tx.escrowTransaction.findMany({
      where: { id: { in: toFreeze.map((t) => t.id) } },
    });

    // Chuyển lobby sang DISPUTED
    await tx.groupLobby.update({
      where: { id: lobby.id },
      data: { status: LobbyStatus.DISPUTED },
    });

    // 3. Ghi audit log
    await tx.auditLog.create({
      data: {
        actor_id: reporterId,
        action: 'DISPUTE_CREATE',
        entity: 'disputes',
        entity_id: dispute.id,
        before: undefined,
        after: {
          lobby_id: lobby.id,
          target_provider_id: targetProviderId,
          reason,
          refund_amount: refundAmount,
          frozen_transactions: frozenTxs.map((t) => t.id),
        },
      },
    });

    return {
      dispute,
      frozenTransactions: frozenTxs,
    };
  });
}

/**
 * BR-DSP-01: Admin phân xử khiếu nại -> Hoàn một phần/toàn phần từ Escrow + ghi audit_logs
 */
export async function resolveDisputeService(
  disputeId,
  adminId,
  input
) {
  const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!dispute) {
    throw new Error('DISPUTE_NOT_FOUND');
  }

  if (dispute.status !== DisputeStatus.OPEN) {
    throw new Error('DISPUTE_ALREADY_RESOLVED');
  }

  const refundAmount = input.refundAmount !== undefined ? input.refundAmount : dispute.refund_amount;

  return prisma.$transaction(async (tx) => {
    const escrowTxs = await tx.escrowTransaction.findMany({ where: { lobby_id: dispute.lobby_id } });
    let refundTx = null;

    if (input.status === DisputeStatus.RESOLVED) {
      // 1. Tạo giao dịch REFUND từ Escrow
      const refundKey = `refund:${dispute.lobby_id}:${dispute.id}`;
      refundTx =
        (await tx.escrowTransaction.findUnique({ where: { idempotency_key: refundKey } })) ??
        (await tx.escrowTransaction.create({
          data: {
            lobby_id: dispute.lobby_id,
            split_bill_id: null,
            type: EscrowTxType.REFUND,
            amount: refundAmount,
            platform_fee: 0,
            net_amount: refundAmount,
            payee_provider_id: null,
            status: EscrowStatus.REFUNDED,
            idempotency_key: refundKey,
          },
        }));

      // 2. Mở đóng băng cho provider: giải ngân phần còn lại (net_amount - refund)
      for (const eTx of escrowTxs) {
        if (eTx.payee_provider_id === dispute.target_provider_id && eTx.status === EscrowStatus.FROZEN) {
          const remainingNet = Math.max(0, eTx.net_amount - refundAmount);
          await tx.escrowTransaction.update({
            where: { id: eTx.id },
            data: { status: EscrowStatus.RELEASED, net_amount: remainingNet },
          });
        }
      }

      // 3. Cập nhật Dispute
      await tx.dispute.update({
        where: { id: dispute.id },
        data: {
          status: DisputeStatus.RESOLVED,
          refund_amount: refundAmount,
          resolved_by: adminId,
          resolved_at: new Date(),
        },
      });
    } else {
      // REJECTED: Mở đóng băng giải ngân toàn bộ cho provider
      await tx.escrowTransaction.updateMany({
        where: {
          lobby_id: dispute.lobby_id,
          payee_provider_id: dispute.target_provider_id,
          status: EscrowStatus.FROZEN,
        },
        data: { status: EscrowStatus.RELEASED },
      });

      await tx.dispute.update({
        where: { id: dispute.id },
        data: {
          status: DisputeStatus.REJECTED,
          resolved_by: adminId,
          resolved_at: new Date(),
        },
      });
    }

    const updatedDispute = await tx.dispute.findUnique({ where: { id: dispute.id } });

    // Nếu không còn dispute OPEN nào cho lobby, chuyển sang COMPLETED
    const remainingOpen = await tx.dispute.count({
      where: { lobby_id: dispute.lobby_id, status: DisputeStatus.OPEN },
    });
    if (remainingOpen === 0) {
      await tx.groupLobby.update({
        where: { id: dispute.lobby_id },
        data: { status: LobbyStatus.COMPLETED },
      });
    }

    // Ghi audit log
    await tx.auditLog.create({
      data: {
        actor_id: adminId,
        action: 'DISPUTE_RESOLVE',
        entity: 'disputes',
        entity_id: dispute.id,
        before: { status: dispute.status, refund_amount: dispute.refund_amount },
        after: {
          status: input.status,
          refund_amount: refundAmount,
          refund_tx_id: refundTx?.id || null,
          admin_id: adminId,
        },
      },
    });

    return {
      dispute: updatedDispute,
      refundTx,
    };
  });
}
