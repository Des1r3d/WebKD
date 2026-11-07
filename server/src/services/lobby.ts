import crypto from 'crypto';
import { GroupLobbyRecord, LobbyMemberRecord } from '../data/initialData';
import { store } from '../data/store';
import { calculateReputation } from '../utils/reputation';

export interface CreateLobbyInput {
  hostId: string;
  slotId: string;
  fnbProviderId?: string | null;
  deadlineAt?: Date | string;
  shipFee?: number;
  voucherId?: string | null;
}

export interface LobbyDetailResponse {
  lobby: GroupLobbyRecord;
  host: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    reputation_score: number;
  };
  slot: {
    id: string;
    provider_id: string;
    start_at: Date;
    end_at: Date;
    price: number;
    status: string;
    provider: {
      id: string;
      name: string;
      address: string;
      lat: number;
      lng: number;
      open_hours: string;
    };
  };
  fnb_provider?: {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null;
  members: Array<{
    user_id: string;
    full_name: string;
    email: string;
    phone: string;
    role: string;
    reputation_score: number;
    deposit_required: number;
    deposit_paid: number;
    status: string;
    joined_at: Date;
  }>;
  cart_items: Array<{
    id: string;
    user_id: string;
    menu_item_id: string;
    name: string;
    qty: number;
    unit_price_snapshot: number;
  }>;
  voucher?: {
    id: string;
    code: string;
    value: number;
    scope: string;
  } | null;
}

/**
 * Sinh mã mời phòng 6 ký tự ngẫu nhiên (chữ in hoa và số)
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    const idx = crypto.randomInt(0, chars.length);
    code += chars[idx];
  }
  return code;
}

/**
 * UC04 / BR-INT-01: Tạo phòng ghép kèo gắn với 1 slot đã giữ
 */
export async function createLobby(input: CreateLobbyInput): Promise<GroupLobbyRecord> {
  const { hostId, slotId, fnbProviderId, shipFee = 15000, voucherId } = input;

  const slot = store.getSlotById(slotId);
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
  const allLobbies = (store as any).lobbies as GroupLobbyRecord[];
  const existingLobby = allLobbies.find((l) => l.slot_id === slotId && l.status !== 'CANCELLED');
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
  while (store.getLobbyByCode(inviteCode)) {
    inviteCode = generateInviteCode();
  }

  const lobby = store.createLobby({
    hostId,
    slotId,
    fnbProviderId: fnbProviderId || null,
    inviteCode,
    deadlineAt: deadline,
    shipFee,
    voucherId: voucherId || null,
  });

  return lobby;
}

/**
 * Lấy chi tiết phòng ghép kèo theo code hoặc id
 */
export function getLobbyDetail(codeOrId: string): LobbyDetailResponse | null {
  const lobby = store.getLobbyByCodeOrId(codeOrId);
  if (!lobby) return null;

  const hostUser = store.getUserById(lobby.host_id)!;
  const slot = store.getSlotById(lobby.slot_id)!;
  const venueProvider = store.getProviderById(slot.provider_id)!;

  const fnbProvider = lobby.fnb_provider_id
    ? store.getProviderById(lobby.fnb_provider_id)
    : null;

  const members = store.getMembersByLobbyId(lobby.id).map((m) => ({
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

  const cart = store.getCartItems(lobby.id).map((c) => ({
    id: c.id,
    user_id: c.user_id,
    menu_item_id: c.menu_item_id,
    name: c.menu_item?.name || 'Món ăn',
    qty: c.qty,
    unit_price_snapshot: c.unit_price_snapshot,
  }));

  const voucher = lobby.voucher_id ? store.getVouchers().find((v) => v.id === lobby.voucher_id) : null;

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
export async function joinLobby(lobbyId: string, userId: string): Promise<{
  success: boolean;
  member?: LobbyMemberRecord;
  reputation: ReturnType<typeof calculateReputation>;
  depositRequired: number;
  depositPaid: number;
}> {
  const lobby = store.getLobbyById(lobbyId) || store.getLobbyByCode(lobbyId);
  if (!lobby) {
    throw new Error('LOBBY_NOT_FOUND');
  }

  if (lobby.status !== 'OPEN') {
    throw new Error('LOBBY_NOT_OPEN');
  }

  const user = store.getUserById(userId);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  // BR-REP-01: Kiểm tra uy tín
  const repSummary = calculateReputation(user.reputation_score);
  if (!repSummary.canJoinLobby || user.status === 'FLAGGED') {
    throw new Error('REPUTATION_TOO_LOW');
  }

  const slot = store.getSlotById(lobby.slot_id);
  const slotPrice = slot ? slot.price : 120000;

  // Tính tiền cọc:
  // Ca chuẩn: 4 người -> mỗi người 30.000 VND
  // Lấy số thành viên JOINED khác user hiện tại để tính sĩ số dự kiến
  const otherMembers = store
    .getMembersByLobbyId(lobby.id)
    .filter((m) => m.status === 'JOINED' && m.user_id !== userId);
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
  const member = store.addOrUpdateMember({
    lobbyId: lobby.id,
    userId,
    depositRequired,
    depositPaid: depositRequired,
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
export async function leaveLobby(lobbyId: string, userId: string): Promise<boolean> {
  const lobby = store.getLobbyById(lobbyId) || store.getLobbyByCode(lobbyId);
  if (!lobby) {
    throw new Error('LOBBY_NOT_FOUND');
  }

  if (lobby.host_id === userId) {
    throw new Error('HOST_CANNOT_LEAVE');
  }

  return store.memberLeave(lobby.id, userId);
}
