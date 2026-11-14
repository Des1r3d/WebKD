import { DisputeStatus, EscrowStatus, EscrowTxType, LobbyStatus } from '@prisma/client';
import { prisma } from '../prisma.js';
import { findLobby, lockLobbyRow } from './lobby.js';

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
    const current = await lockLobbyRow(tx, lobby.id);
    if (!['PAID', 'DISPUTED', 'COMPLETED'].includes(current.status)) throw new Error('INVALID_STATUS');
    const slot = await tx.slot.findUniqueOrThrow({ where: { id: current.slot_id } });
    if (![slot.provider_id, current.fnb_provider_id].includes(targetProviderId)) throw new Error('INVALID_STATUS');
    const payout = await tx.escrowTransaction.findUnique({
      where: { idempotency_key: `release:${lobby.id}:${targetProviderId}` },
    });
    if (current.status === LobbyStatus.COMPLETED || payout?.status === EscrowStatus.RELEASED) {
      throw new Error('ESCROW_ALREADY_RELEASED');
    }

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
        type: EscrowTxType.RELEASE,
        status: { in: [EscrowStatus.HELD, EscrowStatus.FROZEN] },
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

  return prisma.$transaction(async (tx) => {
    await lockLobbyRow(tx, dispute.lobby_id);
    const current = await tx.dispute.findUniqueOrThrow({ where: { id: dispute.id } });
    if (current.status !== DisputeStatus.OPEN) throw new Error('DISPUTE_ALREADY_RESOLVED');

    const refundAmount = input.status === DisputeStatus.RESOLVED
      ? input.refundAmount ?? current.refund_amount
      : 0;
    if (!Number.isSafeInteger(refundAmount) || refundAmount < 0) throw new Error('INVALID_REFUND_AMOUNT');

    const escrowTxs = await tx.escrowTransaction.findMany({
      where: { lobby_id: dispute.lobby_id },
      orderBy: { id: 'asc' },
    });
    const refundTxs = [];
    const otherOpen = await tx.dispute.count({
      where: { lobby_id: dispute.lobby_id, target_provider_id: dispute.target_provider_id,
        status: DisputeStatus.OPEN, id: { not: dispute.id } },
    });
    const settledStatus = otherOpen ? EscrowStatus.FROZEN : EscrowStatus.RELEASED;
    const frozen = escrowTxs.filter(row => row.type === EscrowTxType.RELEASE &&
      row.payee_provider_id === dispute.target_provider_id && row.status === EscrowStatus.FROZEN);
    if (!frozen.length) throw new Error('ESCROW_NOT_READY');

    if (input.status === DisputeStatus.RESOLVED) {
      const available = frozen.reduce((total, row) => total + row.net_amount, 0);

      if (refundAmount > 0) {
        // The historical dispute key does not identify which members were refunded.
        const priorRefunds = escrowTxs.filter(row => row.type === EscrowTxType.REFUND);
        if (priorRefunds.some(row => !row.split_bill_id)) throw new Error('REFUND_REQUIRES_REVIEW');
        const refundedBillIds = new Set(priorRefunds.map(row => row.split_bill_id));
        const paid = escrowTxs.filter(row =>
          row.type === EscrowTxType.HOLD && row.split_bill_id && row.status === EscrowStatus.HELD &&
          !refundedBillIds.has(row.split_bill_id));
        const bills = await tx.splitBill.findMany({
          where: { lobby_id: dispute.lobby_id, status: 'PAID', id: { in: paid.map(row => row.split_bill_id) } },
          orderBy: { id: 'asc' },
        });
        const allocations = bills.map(bill => ({
          bill,
          capacity: Math.min(bill.total, paid.find(row => row.split_bill_id === bill.id).amount),
        })).filter(row => row.capacity > 0);
        const totalCapacity = allocations.reduce((total, row) => total + row.capacity, 0);
        if (refundAmount > available || refundAmount > totalCapacity) throw new Error('REFUND_EXCEEDS_AVAILABLE');

        // Allocate in proportion to the amounts held, with exact integer remainders.
        const denominator = BigInt(totalCapacity);
        const shares = allocations.map(({ bill, capacity }) => {
          const numerator = BigInt(refundAmount) * BigInt(capacity);
          return { bill, amount: Number(numerator / denominator), remainder: numerator % denominator };
        });
        shares.sort((a, b) => a.remainder === b.remainder ? 0 : a.remainder > b.remainder ? -1 : 1);
        const remaining = refundAmount - shares.reduce((total, row) => total + row.amount, 0);
        for (const [index, { bill, amount }] of shares.entries()) {
          const share = amount + Number(index < remaining);
          if (share === 0) continue;
          refundTxs.push(await tx.escrowTransaction.create({
            data: {
              lobby_id: dispute.lobby_id,
              split_bill_id: bill.id,
              type: EscrowTxType.REFUND,
              amount: share,
              net_amount: share,
              status: EscrowStatus.REFUNDED,
              idempotency_key: `refund:${dispute.lobby_id}:${bill.id}`,
            },
          }));
        }
      }

      let remainingDebit = refundAmount;
      for (const row of frozen) {
        const debit = Math.min(row.net_amount, remainingDebit);
        const changed = await tx.escrowTransaction.updateMany({
          where: { id: row.id, status: EscrowStatus.FROZEN },
          data: { status: settledStatus, net_amount: row.net_amount - debit },
        });
        if (changed.count !== 1) throw new Error('REFUND_REQUIRES_REVIEW');
        remainingDebit -= debit;
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
          type: EscrowTxType.RELEASE,
        },
        data: { status: settledStatus },
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
          refund_tx_id: refundTxs[0]?.id ?? null,
          refund_tx_ids: refundTxs.map(row => row.id),
          admin_id: adminId,
        },
      },
    });

    return {
      dispute: updatedDispute,
      refundTx: refundTxs[0] ?? null,
      refundTxs,
    };
  });
}
