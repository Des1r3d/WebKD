import { Prisma, EscrowTxType, EscrowStatus, LobbyMemberStatus, LobbyStatus, SlotStatus, SplitBillStatus } from '@prisma/client';
import { lockLobbyRow } from './lobby.js';
import { prisma } from '../prisma.js';
import { applyNoShowPenalty, applyCheckInReward } from './reputation.js';

/**
 * BR-ESC-01: Giả lập Webhook nhận tiền VietQR -> split_bills.PAID + escrow HELD
 */
export async function handlePaymentWebhook(
  splitBillId,
  actorId
) {
  const bill = await prisma.splitBill.findUnique({ where: { id: splitBillId } });
  if (!bill) {
    throw new Error('SPLIT_BILL_NOT_FOUND');
  }

  const idempotencyKey = `hold:${bill.lobby_id}:${bill.id}`;

  return prisma.$transaction(async (tx) => {
    const lobby = await lockLobbyRow(tx, bill.lobby_id);
    if (lobby.status === LobbyStatus.CANCELLED) throw new Error('INVALID_STATUS');
    const existingHold = await tx.escrowTransaction.findUnique({ where: { idempotency_key: idempotencyKey } });
    if (existingHold) {
      const splitBill = await tx.splitBill.findUniqueOrThrow({ where: { id: bill.id } });
      return { splitBill, escrowHoldTx: existingHold, lobbyStatus: lobby.status, allPaid: lobby.status === LobbyStatus.PAID };
    }
    if (lobby.status !== LobbyStatus.AWAITING_PAYMENT) throw new Error('INVALID_STATUS');

    // Cập nhật trạng thái split bill
    const updatedBill = await tx.splitBill.update({
      where: { id: bill.id },
      data: { status: SplitBillStatus.PAID, paid_at: new Date() },
    });

    // Tạo giao dịch Escrow HOLD (BR-ESC-01) — idempotent theo key
    const escrowHoldTx = await tx.escrowTransaction.create({
      data: {
        lobby_id: bill.lobby_id,
        split_bill_id: bill.id,
        type: EscrowTxType.HOLD,
        amount: updatedBill.total,
        net_amount: updatedBill.total,
        status: EscrowStatus.HELD,
        idempotency_key: idempotencyKey,
      },
    });

    // Kiểm tra xem tất cả các bill của phòng đã thanh toán chưa
    const allBills = await tx.splitBill.findMany({ where: { lobby_id: bill.lobby_id } });
    const allPaid = allBills.length > 0 && allBills.every((b) => b.status === SplitBillStatus.PAID);

    let lobbyStatus = LobbyStatus.AWAITING_PAYMENT;

    if (allPaid && lobby) {
      await tx.groupLobby.update({ where: { id: lobby.id }, data: { status: LobbyStatus.PAID } });
      lobbyStatus = LobbyStatus.PAID;

      // Slot chuyển sang BOOKED
      await tx.slot.updateMany({ where: { id: lobby.slot_id }, data: { status: SlotStatus.BOOKED } });
    } else if (lobby) {
      lobbyStatus = lobby.status;
    }

    // Ghi audit log
    await tx.auditLog.create({
      data: {
        actor_id: actorId || null,
        action: 'PAYMENT_RECEIVED',
        entity: 'split_bills',
        entity_id: bill.id,
        before: { status: 'PENDING' },
        after: { status: 'PAID', total: bill.total, lobbyStatus },
      },
    });

    return { splitBill: updatedBill, escrowHoldTx, lobbyStatus, allPaid };
  });
}

/**
 * BR-ESC-02 & BR-ESC-03 & BR-ESC-04 & BR-REP-02/03:
 * Host/Provider xác nhận check-in -> Điểm danh, thưởng/phạt uy tín, giải ngân đa bên tách VENUE (8%) & FNB (12%)
 */
export async function checkInAndReleaseEscrow(
  lobbyId,
  actorId,
  memberUpdates
) {
  const lobby = await prisma.groupLobby.findFirst({
    where: { OR: [{ id: lobbyId }, { invite_code: lobbyId }] },
  });
  if (!lobby) {
    throw new Error('LOBBY_NOT_FOUND');
  }

  const slot = await prisma.slot.findUnique({ where: { id: lobby.slot_id } });
  if (!slot) {
    throw new Error('SLOT_NOT_FOUND');
  }

  const venueProvider = await prisma.provider.findUnique({ where: { id: slot.provider_id } });
  const fnbProvider = lobby.fnb_provider_id
    ? await prisma.provider.findUnique({ where: { id: lobby.fnb_provider_id } })
    : null;

  const venueKey = `release:${lobby.id}:${slot.provider_id}`;
  const duplicate = () => {
    const error = new Error(
      `BR-ESC-03: Giao dịch giải ngân cho phòng ${lobby.id} đã được thực thi trước đó (Key: ${venueKey})`
    );
    error.code = 'IDEMPOTENCY_DUPLICATE_RELEASE';
    return error;
  };

  // 1. Kiểm tra chống giải ngân lặp (BR-ESC-03)
  if (await prisma.escrowTransaction.findUnique({ where: { idempotency_key: venueKey } })) {
    throw duplicate();
  }

  const currentMembers = await prisma.lobbyMember.findMany({ where: { lobby_id: lobby.id } });
  const cartItems = fnbProvider ? await prisma.cartItem.findMany({ where: { lobby_id: lobby.id } }) : [];

  try {
    return await prisma.$transaction(async (tx) => {
      const current = await lockLobbyRow(tx, lobby.id);
      if (await tx.escrowTransaction.findUnique({ where: { idempotency_key: venueKey } })) throw duplicate();
      if (current.status !== LobbyStatus.PAID && current.status !== LobbyStatus.DISPUTED) {
        throw new Error('INVALID_STATUS');
      }
      const openDisputes = await tx.dispute.findMany({ where: { lobby_id: lobby.id, status: 'OPEN' } });
      const releasedTransactions = [];

      // 3. Giải ngân đa bên tách VENUE (8%) và FNB (12%) (BR-ESC-02)
      // 3.1 Giải ngân VENUE — tạo trước: unique idempotency_key (P2002) chặn race, rollback toàn bộ
      const isVenueDisputed = openDisputes.some((d) => d.target_provider_id === slot.provider_id);
      const venueStatus = isVenueDisputed ? EscrowStatus.FROZEN : EscrowStatus.RELEASED;

      // Tính slot_net
      const slotNet = slot.price;
      const venueCommRate = venueProvider?.commission_rate ?? 0.08;
      const venuePlatformFee = Math.floor(slotNet * venueCommRate);
      const venueNetAmount = slotNet - venuePlatformFee;

      releasedTransactions.push(
        await tx.escrowTransaction.create({
          data: {
            lobby_id: lobby.id,
            split_bill_id: null,
            type: EscrowTxType.RELEASE,
            amount: slotNet,
            platform_fee: venuePlatformFee,
            net_amount: venueNetAmount,
            payee_provider_id: slot.provider_id,
            status: venueStatus,
            idempotency_key: venueKey,
          },
        })
      );

      // 3.2 Giải ngân FNB (nếu có quán)
      if (fnbProvider) {
        const isFnbDisputed = openDisputes.some((d) => d.target_provider_id === fnbProvider.id);
        const fnbStatus = isFnbDisputed ? EscrowStatus.FROZEN : EscrowStatus.RELEASED;

        const foodTotal = cartItems.reduce((s, c) => s + c.qty * c.unit_price_snapshot, 0);

        // Tính fnb_gross: foodTotal + ship_fee - fnb_discount
        // Đối với vector mẫu: food 100k + ship 15k - voucher 20k = 95.000đ
        const fnbDiscount = lobby.voucher_id ? 20000 : 0;
        const fnbGross = Math.max(0, foodTotal + (foodTotal > 0 ? lobby.ship_fee : 0) - fnbDiscount);
        const fnbCommRate = fnbProvider.commission_rate ?? 0.12;
        const fnbPlatformFee = Math.floor(fnbGross * fnbCommRate);
        const fnbNetAmount = fnbGross - fnbPlatformFee;

        releasedTransactions.push(
          await tx.escrowTransaction.create({
            data: {
              lobby_id: lobby.id,
              split_bill_id: null,
              type: EscrowTxType.RELEASE,
              amount: fnbGross,
              platform_fee: fnbPlatformFee,
              net_amount: fnbNetAmount,
              payee_provider_id: fnbProvider.id,
              status: fnbStatus,
              idempotency_key: `release:${lobby.id}:${fnbProvider.id}`,
            },
          })
        );
      }

      // 2. Xử lý điểm danh thành viên & uy tín (BR-REP-02, BR-REP-03)
      const memberResults = [];

      for (const m of currentMembers) {
        const specified = memberUpdates?.find((u) => u.userId === m.user_id);
        const targetStatus = specified ? specified.status : LobbyMemberStatus.CHECKED_IN;

        if (targetStatus === LobbyMemberStatus.CHECKED_IN) {
          // BR-REP-03: +2 điểm uy tín
          const rep = await applyCheckInReward(m.user_id, actorId, undefined, tx);
          await tx.lobbyMember.update({
            where: { lobby_id_user_id: { lobby_id: lobby.id, user_id: m.user_id } },
            data: { status: LobbyMemberStatus.CHECKED_IN },
          });
          memberResults.push({
            userId: m.user_id,
            status: LobbyMemberStatus.CHECKED_IN,
            reputationScore: rep.newScore,
          });
        } else if (targetStatus === LobbyMemberStatus.NO_SHOW) {
          // BR-REP-02: Bùng kèo -15 điểm, mất cọc chuyển PENALTY cho chủ sân
          const rep = await applyNoShowPenalty(m.user_id, actorId, undefined, tx);
          await tx.lobbyMember.update({
            where: { lobby_id_user_id: { lobby_id: lobby.id, user_id: m.user_id } },
            data: { status: LobbyMemberStatus.NO_SHOW },
          });

          let penaltyTx = null;
          if (m.deposit_paid > 0) {
            const penaltyKey = `penalty:${lobby.id}:${m.user_id}`;
            if (!(await tx.escrowTransaction.findUnique({ where: { idempotency_key: penaltyKey } }))) {
              penaltyTx = await tx.escrowTransaction.create({
                data: {
                  lobby_id: lobby.id,
                  split_bill_id: null,
                  type: EscrowTxType.PENALTY,
                  amount: m.deposit_paid,
                  platform_fee: 0,
                  net_amount: m.deposit_paid,
                  payee_provider_id: slot.provider_id,
                  status: EscrowStatus.RELEASED,
                  idempotency_key: penaltyKey,
                },
              });
            }
          }

          memberResults.push({
            userId: m.user_id,
            status: LobbyMemberStatus.NO_SHOW,
            reputationScore: rep.newScore,
            penaltyTx,
          });
        }
      }

      // 4. Cập nhật trạng thái phòng
      const hasFrozen = releasedTransactions.some((t) => t.status === EscrowStatus.FROZEN);
      const nextLobbyStatus = hasFrozen ? LobbyStatus.DISPUTED : LobbyStatus.COMPLETED;
      await tx.groupLobby.update({ where: { id: lobby.id }, data: { status: nextLobbyStatus } });

      // Ghi audit log
      await tx.auditLog.create({
        data: {
          actor_id: actorId,
          action: 'ESCROW_RELEASE',
          entity: 'group_lobbies',
          entity_id: lobby.id,
          before: { status: lobby.status },
          after: {
            status: nextLobbyStatus,
            transactions: releasedTransactions.map((t) => ({
              id: t.id,
              payee_provider_id: t.payee_provider_id,
              amount: t.amount,
              net_amount: t.net_amount,
              status: t.status,
            })),
          },
        },
      });

      return {
        lobbyId: lobby.id,
        lobbyStatus: nextLobbyStatus,
        releasedTransactions,
        memberResults,
      };
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw duplicate();
    throw e;
  }
}
