import crypto from 'node:crypto';
import { prisma } from '../prisma.js';
import { calculateReputation } from '../utils/reputation.js';

/**
 * Sinh mã mời phòng 6 ký tự ngẫu nhiên (chữ in hoa và số)
 */
export function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    const idx = crypto.randomInt(0, chars.length);
    code += chars[idx];
  }
  return code;
}

/** Tìm phòng theo id hoặc invite_code */
export const findLobby = (codeOrId) =>
  prisma.groupLobby.findFirst({ where: { OR: [{ id: codeOrId }, { invite_code: codeOrId.toUpperCase() }] } });

/**
 * UC04 / BR-INT-01: Tạo phòng ghép kèo gắn với 1 slot đã giữ
 */
export async function createLobby(input) {
  const { hostId, slotId, fnbProviderId, shipFee = 15000, voucherId } = input;

  const slot = await prisma.slot.findUnique({ where: { id: slotId } });
  if (!slot) {
    throw new Error('SLOT_NOT_FOUND');
  }

  // BR-INT-01: Slot phải đang được giữ bởi chính host (hoặc đã BOOKED)
  if (slot.status === 'LOCKED' && slot.locked_by !== hostId) {
    throw new Error('SLOT_NOT_LOCKED_BY_HOST');
  }
  if (slot.status === 'AVAILABLE') {
    throw new Error('SLOT_MUST_BE_LOCKED_FIRST');
  }

  // 1 slot chỉ thuộc tối đa 1 lobby
  const existingLobby = await prisma.groupLobby.findFirst({ where: { slot_id: slotId, status: { not: 'CANCELLED' } } });
  if (existingLobby) {
    throw new Error('LOBBY_SLOT_ALREADY_EXISTS');
  }

  // Mặc định hạn chốt kèo (deadline) là trước giờ bắt đầu slot 30 phút hoặc +45 phút
  let deadline = input.deadlineAt ? new Date(input.deadlineAt) : new Date(Date.now() + 45 * 60 * 1000);
  if (slot.start_at) {
    const slotStart = new Date(slot.start_at);
    if (slotStart.getTime() > Date.now()) {
      deadline = new Date(Math.min(deadline.getTime(), slotStart.getTime() - 15 * 60 * 1000));
    }
  }

  let inviteCode = generateInviteCode();
  // Đảm bảo không trùng invite_code
  while (await prisma.groupLobby.findUnique({ where: { invite_code: inviteCode } })) {
    inviteCode = generateInviteCode();
  }

  // Host tự động là thành viên đầu tiên (deposit 0)
  return prisma.groupLobby.create({
    data: {
      host_id: hostId,
      slot_id: slotId,
      fnb_provider_id: fnbProviderId || null,
      invite_code: inviteCode,
      deadline_at: deadline,
      ship_fee: shipFee || 15000,
      voucher_id: voucherId || null,
      members: { create: { user_id: hostId } },
    },
  });
}

/**
 * Lấy chi tiết phòng ghép kèo theo code hoặc id
 */
export async function getLobbyDetail(codeOrId) {
  const lobby = await findLobby(codeOrId);
  if (!lobby) return null;

  const hostUser = (await prisma.user.findUnique({ where: { id: lobby.host_id } }));
  const slot = (await prisma.slot.findUnique({ where: { id: lobby.slot_id } }));
  const venueProvider = (await prisma.provider.findUnique({ where: { id: slot.provider_id } }));

  const fnbProvider = lobby.fnb_provider_id
    ? await prisma.provider.findUnique({ where: { id: lobby.fnb_provider_id } })
    : null;

  const dbMembers = await prisma.lobbyMember.findMany({
    where: { lobby_id: lobby.id },
    include: { user: true },
    orderBy: { joined_at: 'asc' },
  });
  const members = dbMembers.map((m) => ({
    user_id: m.user_id,
    full_name: m.user.full_name,
    email: m.user.email,
    phone: m.user.phone,
    role: m.user.role,
    reputation_score: m.user.reputation_score,
    deposit_required: m.deposit_required,
    deposit_paid: m.deposit_paid,
    status: m.status,
    joined_at: m.joined_at,
  }));

  const dbCart = await prisma.cartItem.findMany({
    where: { lobby_id: lobby.id },
    include: { menu_item: true },
    orderBy: { created_at: 'asc' },
  });
  const cart = dbCart.map((c) => ({
    id: c.id,
    user_id: c.user_id,
    menu_item_id: c.menu_item_id,
    name: c.menu_item?.name || 'Món ăn',
    qty: c.qty,
    unit_price_snapshot: c.unit_price_snapshot,
  }));

  const voucher = lobby.voucher_id ? await prisma.voucher.findUnique({ where: { id: lobby.voucher_id } }) : null;

  return {
    lobby,
    host: {
      id: hostUser.id,
      full_name: hostUser.full_name,
      email: hostUser.email,
      phone: hostUser.phone,
      reputation_score: hostUser.reputation_score,
    },
    slot: {
      id: slot.id,
      provider_id: slot.provider_id,
      start_at: slot.start_at,
      end_at: slot.end_at,
      price: slot.price,
      status: slot.status,
      provider: {
        id: venueProvider.id,
        name: venueProvider.name,
        address: venueProvider.address,
        lat: venueProvider.lat,
        lng: venueProvider.lng,
        open_hours: venueProvider.open_hours,
      },
    },
    fnb_provider: fnbProvider
      ? {
          id: fnbProvider.id,
          name: fnbProvider.name,
          address: fnbProvider.address,
          lat: fnbProvider.lat,
          lng: fnbProvider.lng,
        }
      : null,
    members,
    cart_items: cart,
    voucher: voucher
      ? {
          id: voucher.id,
          code: voucher.code,
          value: voucher.value,
          scope: voucher.scope,
        }
      : null,
  };
}

/**
 * UC05 / BR-REP-01: Tham gia phòng ghép kèo với kiểm tra uy tín & mức cọc
 */
export async function joinLobby(lobbyId, userId)
{
  const lobby = await findLobby(lobbyId);
  if (!lobby) {
    throw new Error('LOBBY_NOT_FOUND');
  }

  if (lobby.status !== 'OPEN') {
    throw new Error('LOBBY_NOT_OPEN');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  // BR-REP-01: Kiểm tra uy tín
  const repSummary = calculateReputation(user.reputation_score);
  if (!repSummary.canJoinLobby || user.status === 'FLAGGED') {
    throw new Error('REPUTATION_TOO_LOW');
  }

  const slot = await prisma.slot.findUnique({ where: { id: lobby.slot_id } });
  const slotPrice = slot ? slot.price : 120000;

  // Tính tiền cọc:
  // Ca chuẩn: 4 người -> mỗi người 30.000 VND
  // Lấy số thành viên JOINED khác user hiện tại để tính sĩ số dự kiến
  const otherMembers = await prisma.lobbyMember.findMany({
    where: { lobby_id: lobby.id, status: 'JOINED', user_id: { not: userId } },
  });
  const estimatedGroupSize = Math.max(4, otherMembers.length + 1);
  const expectedSlotShare = Math.floor(slotPrice / estimatedGroupSize);

  let depositRequired = 0;
  if (repSummary.tier === 'A') {
    depositRequired = 0;
  } else if (repSummary.tier === 'B') {
    // Cọc 30% phần tiền sân dự kiến (VD 30.000 * 30% = 9.000)
    depositRequired = Math.round((expectedSlotShare * 30) / 100);
  } else if (repSummary.tier === 'C') {
    // Cọc 100% phần tiền sân dự kiến (VD 30.000 * 100% = 30.000)
    depositRequired = expectedSlotShare;
  }

  // Tự động ghi nhận cọc đã trả (mô phỏng ví/trừ cọc tự động cho demo)
  const fields = { status: 'JOINED', deposit_required: depositRequired, deposit_paid: depositRequired };
  const member = await prisma.lobbyMember.upsert({
    where: { lobby_id_user_id: { lobby_id: lobby.id, user_id: userId } },
    update: fields,
    create: { lobby_id: lobby.id, user_id: userId, ...fields },
  });

  return {
    success: true,
    member,
    reputation: repSummary,
    depositRequired,
    depositPaid: depositRequired,
  };
}

/**
 * Rời phòng ghép kèo
 */
export async function leaveLobby(lobbyId, userId) {
  const lobby = await findLobby(lobbyId);
  if (!lobby) {
    throw new Error('LOBBY_NOT_FOUND');
  }

  if (lobby.host_id === userId) {
    throw new Error('HOST_CANNOT_LEAVE');
  }

  const { count } = await prisma.lobbyMember.updateMany({
    where: { lobby_id: lobby.id, user_id: userId },
    data: { status: 'LEFT' },
  });
  return count > 0;
}
