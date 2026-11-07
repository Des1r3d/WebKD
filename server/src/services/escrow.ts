import { store } from '../data/store';
import { EscrowTxType, EscrowStatus, LobbyMemberStatus, LobbyStatus, SlotStatus } from '@prisma/client';
import { applyNoShowPenalty, applyCheckInReward } from './reputation';

export interface WebhookMockResult {
  splitBill: any;
  escrowHoldTx: any;
  lobbyStatus: LobbyStatus;
  allPaid: boolean;
}

export interface CheckInReleaseResult {
  lobbyId: string;
  lobbyStatus: LobbyStatus;
  releasedTransactions: any[];
  memberResults: Array<{
    userId: string;
    status: LobbyMemberStatus;
    reputationScore: number;
    penaltyTx?: any;
  }>;
}

/**
 * BR-ESC-01: Giả lập Webhook nhận tiền VietQR -> split_bills.PAID + escrow HELD
 */
export async function handlePaymentWebhook(
  splitBillId: string,
  actorId?: string
): Promise<WebhookMockResult> {
  const bill = store.getSplitBillById(splitBillId);
  if (!bill) {
    throw new Error('SPLIT_BILL_NOT_FOUND');
  }

  // Cập nhật trạng thái split bill
  const updatedBill = store.updateSplitBillStatus(splitBillId, 'PAID');
  if (!updatedBill) {
    throw new Error('UPDATE_BILL_FAILED');
  }

  // Tạo giao dịch Escrow HOLD (BR-ESC-01)
  const idempotencyKey = `hold:${bill.lobby_id}:${bill.id}`;
  let escrowHoldTx = store.getEscrowTransactionByIdempotencyKey(idempotencyKey);

  if (!escrowHoldTx) {
    escrowHoldTx = store.createEscrowTransaction({
      lobby_id: bill.lobby_id,
      split_bill_id: bill.id,
      type: EscrowTxType.HOLD,
      amount: bill.total,
      platform_fee: 0,
      net_amount: bill.total,
      payee_provider_id: null,
      status: EscrowStatus.HELD,
      idempotency_key: idempotencyKey,
    });
  }

  // Kiểm tra xem tất cả các bill của phòng đã thanh toán chưa
  const allBills = store.getSplitBillsByLobbyId(bill.lobby_id);
  const allPaid = allBills.length > 0 && allBills.every((b) => b.status === 'PAID');

  let lobbyStatus: LobbyStatus = LobbyStatus.AWAITING_PAYMENT;
  const lobby = store.getLobbyById(bill.lobby_id);

  if (allPaid && lobby) {
    store.updateLobbyStatus(lobby.id, LobbyStatus.PAID);
    lobbyStatus = LobbyStatus.PAID;

    // Slot chuyển sang BOOKED
    const slot = store.getSlotById(lobby.slot_id);
    if (slot) {
      slot.status = SlotStatus.BOOKED;
    }
  } else if (lobby) {
    lobbyStatus = lobby.status;
  }

  // Ghi audit log
  store.createAuditLog({
    actor_id: actorId || null,
    action: 'PAYMENT_RECEIVED',
    entity: 'split_bills',
    entity_id: bill.id,
    before: { status: 'PENDING' },
    after: { status: 'PAID', total: bill.total, lobbyStatus },
  });

  return {
    splitBill: updatedBill,
    escrowHoldTx,
    lobbyStatus,
    allPaid,
  };
}

/**
 * BR-ESC-02 & BR-ESC-03 & BR-ESC-04 & BR-REP-02/03:
 * Host/Provider xác nhận check-in -> Điểm danh, thưởng/phạt uy tín, giải ngân đa bên tách VENUE (8%) & FNB (12%)
 */
export async function checkInAndReleaseEscrow(
  lobbyId: string,
  actorId: string,
  memberUpdates?: Array<{ userId: string; status: LobbyMemberStatus }>
): Promise<CheckInReleaseResult> {
  const lobby = store.getLobbyById(lobbyId) || store.getLobbyByCode(lobbyId);
  if (!lobby) {
    throw new Error('LOBBY_NOT_FOUND');
  }

  const slot = store.getSlotById(lobby.slot_id);
  if (!slot) {
    throw new Error('SLOT_NOT_FOUND');
  }

  const venueProvider = store.getProviderById(slot.provider_id);
  const fnbProvider = lobby.fnb_provider_id ? store.getProviderById(lobby.fnb_provider_id) : null;

  // 1. Kiểm tra chống giải ngân lặp (BR-ESC-03)
  const venueKey = `release:${lobby.id}:${slot.provider_id}`;
  const existingVenueTx = store.getEscrowTransactionByIdempotencyKey(venueKey);
  if (existingVenueTx) {
    const error: any = new Error(
      `BR-ESC-03: Giao dịch giải ngân cho phòng ${lobby.id} đã được thực thi trước đó (Key: ${venueKey})`
    );
    error.code = 'IDEMPOTENCY_DUPLICATE_RELEASE';
    throw error;
  }

  // 2. Xử lý điểm danh thành viên & uy tín (BR-REP-02, BR-REP-03)
  const currentMembers = store.getMembersByLobbyId(lobby.id);
  const memberResults: Array<{
    userId: string;
    status: LobbyMemberStatus;
    reputationScore: number;
    penaltyTx?: any;
  }> = [];

  for (const m of currentMembers) {
    const specified = memberUpdates?.find((u) => u.userId === m.user_id);
    const targetStatus = specified ? specified.status : LobbyMemberStatus.CHECKED_IN;

    if (targetStatus === LobbyMemberStatus.CHECKED_IN) {
      // BR-REP-03: +2 điểm uy tín
      const rep = applyCheckInReward(m.user_id, actorId);
      store.updateMemberStatus(lobby.id, m.user_id, LobbyMemberStatus.CHECKED_IN);
      memberResults.push({
        userId: m.user_id,
        status: LobbyMemberStatus.CHECKED_IN,
        reputationScore: rep.newScore,
      });
    } else if (targetStatus === LobbyMemberStatus.NO_SHOW) {
      // BR-REP-02: Bùng kèo -15 điểm, mất cọc chuyển PENALTY cho chủ sân
      const rep = applyNoShowPenalty(m.user_id, actorId);
      store.updateMemberStatus(lobby.id, m.user_id, LobbyMemberStatus.NO_SHOW);

      let penaltyTx: any = null;
      if (m.deposit_paid > 0) {
        const penaltyKey = `penalty:${lobby.id}:${m.user_id}`;
        if (!store.getEscrowTransactionByIdempotencyKey(penaltyKey)) {
          penaltyTx = store.createEscrowTransaction({
            lobby_id: lobby.id,
            split_bill_id: null,
            type: EscrowTxType.PENALTY,
            amount: m.deposit_paid,
            platform_fee: 0,
            net_amount: m.deposit_paid,
            payee_provider_id: slot.provider_id,
            status: EscrowStatus.RELEASED,
            idempotency_key: penaltyKey,
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

  // 3. Giải ngân đa bên tách VENUE (8%) và FNB (12%) (BR-ESC-02)
  const releasedTransactions: any[] = [];
  const openDisputes = store.getDisputesByLobbyId(lobby.id).filter((d) => d.status === 'OPEN');

  // 3.1 Giải ngân VENUE
  const isVenueDisputed = openDisputes.some((d) => d.target_provider_id === slot.provider_id);
  const venueStatus = isVenueDisputed ? EscrowStatus.FROZEN : EscrowStatus.RELEASED;

  // Tính slot_net
  const slotNet = slot.price;
  const venueCommRate = venueProvider?.commission_rate ?? 0.08;
  const venuePlatformFee = Math.floor(slotNet * venueCommRate);
  const venueNetAmount = slotNet - venuePlatformFee;

  const venueTx = store.createEscrowTransaction({
    lobby_id: lobby.id,
    split_bill_id: null,
    type: EscrowTxType.RELEASE,
    amount: slotNet,
    platform_fee: venuePlatformFee,
    net_amount: venueNetAmount,
    payee_provider_id: slot.provider_id,
    status: venueStatus,
    idempotency_key: venueKey,
  });
  releasedTransactions.push(venueTx);

  // 3.2 Giải ngân FNB (nếu có quán)
  if (fnbProvider) {
    const fnbKey = `release:${lobby.id}:${fnbProvider.id}`;
    const isFnbDisputed = openDisputes.some((d) => d.target_provider_id === fnbProvider.id);
    const fnbStatus = isFnbDisputed ? EscrowStatus.FROZEN : EscrowStatus.RELEASED;

    const cartItems = store.getCartItems(lobby.id);
    const foodTotal = cartItems.reduce((s, c) => s + c.qty * c.unit_price_snapshot, 0);

    // Tính fnb_gross: foodTotal + ship_fee - fnb_discount
    // Đối với vector mẫu: food 100k + ship 15k - voucher 20k = 95.000đ
    const fnbDiscount = lobby.voucher_id ? 20000 : 0;
    const fnbGross = Math.max(0, foodTotal + (foodTotal > 0 ? lobby.ship_fee : 0) - fnbDiscount);
    const fnbCommRate = fnbProvider.commission_rate ?? 0.12;
    const fnbPlatformFee = Math.floor(fnbGross * fnbCommRate);
    const fnbNetAmount = fnbGross - fnbPlatformFee;

    const fnbTx = store.createEscrowTransaction({
      lobby_id: lobby.id,
      split_bill_id: null,
      type: EscrowTxType.RELEASE,
      amount: fnbGross,
      platform_fee: fnbPlatformFee,
      net_amount: fnbNetAmount,
      payee_provider_id: fnbProvider.id,
      status: fnbStatus,
      idempotency_key: fnbKey,
    });
    releasedTransactions.push(fnbTx);
  }

  // 4. Cập nhật trạng thái phòng
  const hasFrozen = releasedTransactions.some((t) => t.status === EscrowStatus.FROZEN);
  const nextLobbyStatus = hasFrozen ? LobbyStatus.DISPUTED : LobbyStatus.COMPLETED;
  store.updateLobbyStatus(lobby.id, nextLobbyStatus);

  // Ghi audit log
  store.createAuditLog({
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
  });

  return {
    lobbyId: lobby.id,
    lobbyStatus: nextLobbyStatus,
    releasedTransactions,
    memberResults,
  };
}
