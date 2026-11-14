import { prisma } from '../prisma.js';
import { findLobby, lockLobbyRow } from './lobby.js';

/**
 * BR-INT-02: Thuật toán chia bill chuẩn với Largest Remainder (Hamilton Method)
 */
export function calculateSplitBills(
  input
) {
  const {
    lobbyId,
    inviteCode,
    slotPrice,
    venueOrCrossDiscount,
    shipFee,
    fnbDiscount,
    members,
    cartItems,
  } = input;

  const N = members.length;
  if (N === 0) {
    throw new Error('NO_MEMBERS_IN_LOBBY');
  }

  // 1. Tiền sân ròng (slot_net)
  const slotNet = Math.max(0, slotPrice - venueOrCrossDiscount);

  // 2. Tiền món cá nhân (food_i) & tổng tiền món
  const foodByUser = new Map();
  for (const m of members) {
    foodByUser.set(m.userId, 0);
  }
  for (const item of cartItems) {
    const cur = foodByUser.get(item.userId) || 0;
    foodByUser.set(item.userId, cur + item.qty * item.unitPrice);
  }

  let totalFood = 0;
  for (const amount of foodByUser.values()) {
    totalFood += amount;
  }

  // 3. Điều chỉnh FNB: adj = ship_fee - fnb_discount
  // Nếu totalFood = 0 -> không phát sinh đơn FNB -> ship_fee = 0, fnb_discount = 0 -> adj = 0
  const effectiveShipFee = totalFood > 0 ? shipFee : 0;
  const effectiveFnbDiscount = totalFood > 0 ? fnbDiscount : 0;
  const adj = effectiveShipFee - effectiveFnbDiscount;

  const grandTotal = slotNet + totalFood + adj;

  // 4. Tính raw_i cho từng người

  const rawList = members.map((m) => {
    const food_i = foodByUser.get(m.userId) || 0;
    const slotShareRaw = slotNet / N;
    let shipShareRaw = 0;
    let discountShareRaw = 0;

    if (totalFood > 0) {
      const foodRatio = food_i / totalFood;
      shipShareRaw = effectiveShipFee * foodRatio;
      discountShareRaw = effectiveFnbDiscount * foodRatio;
    }

    const rawTotal = slotShareRaw + food_i + (shipShareRaw - discountShareRaw);
    const floorTotal = Math.floor(rawTotal);
    const frac = rawTotal - floorTotal;

    return {
      member: m,
      foodAmount: food_i,
      slotShareRaw,
      shipShareRaw,
      discountShareRaw,
      rawTotal,
      floorTotal,
      frac,
      grossTotal: floorTotal,
    };
  });

  // 5. Largest Remainder (Hamilton Method)
  const sumFloor = rawList.reduce((acc, r) => acc + r.floorTotal, 0);
  const delta = grandTotal - sumFloor;

  // Sắp xếp giảm dần theo frac; nếu bằng nhau, ưu tiên Host, sau đó đến người join sớm hơn
  rawList.sort((a, b) => {
    const diff = b.frac - a.frac;
    if (Math.abs(diff) > 1e-6) {
      return diff;
    }
    if (a.member.isHost && !b.member.isHost) return -1;
    if (!a.member.isHost && b.member.isHost) return 1;
    return new Date(a.member.joinedAt).getTime() - new Date(b.member.joinedAt).getTime();
  });

  // Phân phối +1 VND cho delta người đầu tiên
  for (let i = 0; i < delta; i++) {
    rawList[i].grossTotal += 1;
  }

  // 6. Assertion bắt buộc (BR-INT-02): Tổng grossTotal phải bằng grandTotal
  const sumGross = rawList.reduce((acc, r) => acc + r.grossTotal, 0);
  if (sumGross !== grandTotal) {
    throw new Error('SPLIT_SUM_MISMATCH');
  }

  // 7. Cấu hình VietQR
  const bank = process.env.VIETQR_BANK || 'MB';
  const account = process.env.VIETQR_ACCOUNT || '0123456789';
  const accountName = process.env.VIETQR_NAME || 'SYNCHUB ESCROW';

  // 8. Tạo bản ghi split_bills
  const bills = rawList.map((r) => {
    // Phân bổ phần hiển thị từng cột (slot_share, ship_share, discount_share)
    const slotShare = Math.round(r.slotShareRaw);
    const shipShare = Math.round(r.shipShareRaw);
    const discountShare = Math.round(r.discountShareRaw);

    // Khấu trừ tiền cọc đã đóng
    const depositOffset = Math.min(r.grossTotal, r.member.depositPaid || 0);
    const totalToPay = Math.max(0, r.grossTotal - depositOffset);

    const addInfo = encodeURIComponent(
      `SYNCHUB ${inviteCode} ${r.member.userId.slice(0, 6)}`
    );
    const vietqrUrl = `https://img.vietqr.io/image/${bank}-${account}-compact2.png?amount=${totalToPay}&addInfo=${addInfo}&accountName=${encodeURIComponent(
      accountName
    )}`;

    return {
      id: `sb-${lobbyId}-${r.member.userId}`,
      lobby_id: lobbyId,
      user_id: r.member.userId,
      slot_share: slotShare,
      food_amount: r.foodAmount,
      ship_share: shipShare,
      discount_share: discountShare,
      deposit_offset: depositOffset,
      total: totalToPay,
      vietqr_url: vietqrUrl,
      status: 'PENDING',
      paid_at: null,
    };
  });

  return {
    grandTotal,
    slotNet,
    totalFood,
    adj,
    bills,
  };
}

/**
 * Thực thi chia bill cho một phòng cụ thể và lưu vào database / store
 */
export async function executeSplitBillForLobby(
  lobbyId
) {
  const lobby = await findLobby(lobbyId);
  if (!lobby) throw new Error('LOBBY_NOT_FOUND');
  if (!['OPEN', 'LOCKED'].includes(lobby.status)) throw new Error('INVALID_STATUS');

  const slot = await prisma.slot.findUnique({ where: { id: lobby.slot_id } });
  if (!slot) throw new Error('SLOT_NOT_FOUND');

  // Lấy các thành viên JOINED
  const members = (await prisma.lobbyMember.findMany({ where: { lobby_id: lobby.id, status: 'JOINED' } }))
    .map((m) => ({
      userId: m.user_id,
      isHost: m.user_id === lobby.host_id,
      joinedAt: m.joined_at,
      depositPaid: m.deposit_paid,
    }));

  if (members.length === 0) {
    throw new Error('NO_ACTIVE_MEMBERS');
  }

  // Lấy cart items
  const cartItems = (await prisma.cartItem.findMany({ where: { lobby_id: lobby.id } })).map((c) => ({
    userId: c.user_id,
    qty: c.qty,
    unitPrice: c.unit_price_snapshot,
  }));

  // Voucher
  let venueOrCrossDiscount = 0;
  let fnbDiscount = 0;
  if (lobby.voucher_id) {
    const voucher = await prisma.voucher.findUnique({ where: { id: lobby.voucher_id } });
    if (voucher) {
      const foodTotal = cartItems.reduce((acc, c) => acc + c.qty * c.unitPrice, 0);
      if (voucher.scope === 'VENUE') {
        venueOrCrossDiscount =
          voucher.discount_type === 'PERCENT'
            ? Math.min(voucher.max_discount, Math.round((slot.price * voucher.value) / 100))
            : Math.min(voucher.max_discount, voucher.value);
      } else if (voucher.scope === 'FNB') {
        fnbDiscount =
          voucher.discount_type === 'PERCENT'
            ? Math.min(voucher.max_discount, Math.round((foodTotal * voucher.value) / 100))
            : Math.min(voucher.max_discount, voucher.value);
      } else if (voucher.scope === 'CROSS') {
        // Voucher CROSS trừ vào tiền sân chia đều theo BR-INT-02
        venueOrCrossDiscount =
          voucher.discount_type === 'PERCENT'
            ? Math.min(voucher.max_discount, Math.round((slot.price * voucher.value) / 100))
            : Math.min(voucher.max_discount, voucher.value);
      }
    }
  }

  const result = calculateSplitBills({
    lobbyId: lobby.id,
    inviteCode: lobby.invite_code,
    slotPrice: slot.price,
    venueOrCrossDiscount,
    shipFee: lobby.ship_fee || 15000,
    fnbDiscount,
    members,
    cartItems,
  });

  // Lưu split_bills (thay bill cũ của lobby) + chuyển lobby sang AWAITING_PAYMENT
  await prisma.$transaction(async (tx) => {
    const current = await lockLobbyRow(tx, lobby.id);
    if (!['OPEN', 'LOCKED'].includes(current.status)) throw new Error('INVALID_STATUS');
    await tx.splitBill.deleteMany({ where: { lobby_id: lobby.id } });
    await tx.splitBill.createMany({ data: result.bills });
    await tx.groupLobby.update({ where: { id: lobby.id }, data: { status: 'AWAITING_PAYMENT' } });
  });

  return result;
}
