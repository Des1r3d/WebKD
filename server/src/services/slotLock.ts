import { SlotRecord } from '../data/initialData';
import { store } from '../data/store';

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

  const existingSlot = store.getSlotById(slotId);
  if (!existingSlot) {
    return {
      success: false,
      error: 'NOT_FOUND',
      message: 'Khung giờ slot không tồn tại trong hệ thống',
    };
  }

  const lockedSlot = await store.lockSlot(slotId, userId, 10 * 60 * 1000);

  if (!lockedSlot) {
    return {
      success: false,
      error: 'SLOT_TAKEN',
      message: 'Khung giờ này đã có người giữ hoặc đã được đặt thành công (BR-SLT-02)',
    };
  }

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
  const existingSlot = store.getSlotById(slotId);
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

  const success = await store.releaseSlot(slotId, userId);
  if (!success) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'Bạn không có quyền giải phóng slot do người khác đang giữ còn hạn',
    };
  }

  const updatedSlot = store.getSlotById(slotId);
  return {
    success: true,
    message: 'Đã giải phóng slot về trạng thái sẵn sàng (AVAILABLE)',
    slot: updatedSlot,
  };
}

/**
 * Quét các slot LOCKED đã quá hạn và trả về AVAILABLE (Job 60s - BR-SLT-01)
 */
export function expireOverdueSlots(): SlotRecord[] {
  return store.expireSlots();
}
