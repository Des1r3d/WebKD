import { Slot as SlotRecord } from '@prisma/client';
import { prisma } from '../prisma';

export interface LockSlotResult {
  success: boolean;
  error?: 'NOT_FOUND' | 'SLOT_TAKEN' | 'INVALID_USER';
  message: string;
  slot?: SlotRecord;
  lockedUntil?: string;
  expiresInSeconds?: number;
}

export interface ReleaseSlotResult {
  success: boolean;
  error?: 'NOT_FOUND' | 'NOT_LOCKED' | 'FORBIDDEN';
  message: string;
  slot?: SlotRecord;
}

/**
 * BR-SLT-01, BR-SLT-02: Khóa slot nguyên tử chống đặt trùng
 * Thời hạn giữ chỗ: 10 phút (600 giây)
 */
export async function lockSlot(slotId: string, userId: string): Promise<LockSlotResult> {
  if (!slotId || !userId) {
    return {
      success: false,
      error: 'INVALID_USER',
      message: 'Thiếu thông tin slot hoặc người dùng',
    };
  }

  const existingSlot = await prisma.slot.findUnique({ where: { id: slotId } });
  if (!existingSlot) {
    return {
      success: false,
      error: 'NOT_FOUND',
      message: 'Khung giờ slot không tồn tại trong hệ thống',
    };
  }

  // 1 câu UPDATE nguyên tử (không mutex JS): chỉ 1 request thắng, còn lại count=0
  const now = new Date();
  const { count } = await prisma.slot.updateMany({
    where: {
      id: slotId,
      OR: [{ status: 'AVAILABLE' }, { status: 'LOCKED', locked_until: { lt: now } }],
    },
    data: { status: 'LOCKED', locked_by: userId, locked_until: new Date(now.getTime() + 10 * 60 * 1000) },
  });

  if (count === 0) {
    return {
      success: false,
      error: 'SLOT_TAKEN',
      message: 'Khung giờ này đã có người giữ hoặc đã được đặt thành công (BR-SLT-02)',
    };
  }

  const lockedSlot = (await prisma.slot.findUnique({ where: { id: slotId } }))!;
  const lockedUntilIso = lockedSlot.locked_until?.toISOString();
  const expiresInSeconds = lockedSlot.locked_until
    ? Math.max(0, Math.round((lockedSlot.locked_until.getTime() - Date.now()) / 1000))
    : 600;

  return {
    success: true,
    message: 'Giữ slot thành công trong 10 phút (BR-SLT-01)',
    slot: lockedSlot,
    lockedUntil: lockedUntilIso,
    expiresInSeconds,
  };
}

/**
 * Giải phóng slot đang giữ về AVAILABLE
 */
export async function releaseSlot(slotId: string, userId: string): Promise<ReleaseSlotResult> {
  const existingSlot = await prisma.slot.findUnique({ where: { id: slotId } });
  if (!existingSlot) {
    return {
      success: false,
      error: 'NOT_FOUND',
      message: 'Không tìm thấy slot cần giải phóng',
    };
  }

  if (existingSlot.status !== 'LOCKED') {
    return {
      success: false,
      error: 'NOT_LOCKED',
      message: 'Slot không ở trạng thái đang giữ (LOCKED)',
    };
  }

  // Chỉ người đang giữ (hoặc khóa đã hết hạn) mới được giải phóng
  const { count } = await prisma.slot.updateMany({
    where: { id: slotId, status: 'LOCKED', OR: [{ locked_by: userId }, { locked_until: { lt: new Date() } }] },
    data: { status: 'AVAILABLE', locked_by: null, locked_until: null },
  });
  if (count === 0) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'Bạn không có quyền giải phóng slot do người khác đang giữ còn hạn',
    };
  }

  const updatedSlot = await prisma.slot.findUnique({ where: { id: slotId } });
  return {
    success: true,
    message: 'Đã giải phóng slot về trạng thái sẵn sàng (AVAILABLE)',
    slot: updatedSlot ?? undefined,
  };
}

/**
 * Quét các slot LOCKED đã quá hạn và trả về AVAILABLE (Job 60s - BR-SLT-01)
 */
export async function expireOverdueSlots() {
  const now = new Date();
  const expired = await prisma.slot.findMany({
    where: { status: 'LOCKED', locked_until: { lt: now } },
    select: { id: true, provider_id: true },
  });
  if (expired.length === 0) return [];
  await prisma.slot.updateMany({
    where: { id: { in: expired.map((s) => s.id) }, status: 'LOCKED' },
    data: { status: 'AVAILABLE', locked_by: null, locked_until: null },
  });
  return expired;
}

