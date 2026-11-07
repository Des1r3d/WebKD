import { VoucherRecord } from '../data/initialData';
import { store } from '../data/store';
import { haversineDistanceMeters } from '../utils/distance';

export interface ValidateVoucherResult {
  valid: boolean;
  message: string;
  voucher?: VoucherRecord;
  discountAmount: number;
}

/**
 * BR-INT-05: Kiểm tra tính hợp lệ của voucher chéo (CROSS) và voucher đơn lẻ (VENUE / FNB)
 */
export function validateVoucher(
  code: string,
  lobbyId: string
): ValidateVoucherResult {
  if (!code || !code.trim()) {
    return { valid: false, message: 'Vui lòng nhập mã voucher', discountAmount: 0 };
  }

  const voucher = store.getVoucherByCode(code.trim());
  if (!voucher) {
    return { valid: false, message: 'Mã voucher không tồn tại', discountAmount: 0 };
  }

  const now = new Date();
  if (new Date(voucher.valid_from) > now || new Date(voucher.valid_to) < now) {
    return { valid: false, message: 'Mã voucher đã hết hạn sử dụng', discountAmount: 0 };
  }

  if (voucher.used_count >= voucher.usage_limit) {
    return { valid: false, message: 'Mã voucher đã hết lượt sử dụng', discountAmount: 0 };
  }

  const lobby = store.getLobbyById(lobbyId) || store.getLobbyByCode(lobbyId);
  if (!lobby) {
    return { valid: false, message: 'Phòng không tồn tại', discountAmount: 0 };
  }

  const slot = store.getSlotById(lobby.slot_id);
  if (!slot) {
    return { valid: false, message: 'Không tìm thấy thông tin slot sân', discountAmount: 0 };
  }

  const venueProvider = store.getProviderById(slot.provider_id);
  if (!venueProvider) {
    return { valid: false, message: 'Không tìm thấy thông tin chủ sân', discountAmount: 0 };
  }

  const cartItems = store.getCartItemsRaw(lobby.id);
  const totalFood = cartItems.reduce((sum, item) => sum + item.qty * item.unit_price_snapshot, 0);

  let discountAmount = 0;

  // Xử lý theo từng phạm vi Voucher (Scope)
  if (voucher.scope === 'VENUE') {
    if (slot.price < voucher.min_order) {
      return {
        valid: false,
        message: `Đơn sân tối thiểu ${voucher.min_order.toLocaleString('vi-VN')} VND để dùng mã này`,
        discountAmount: 0,
      };
    }

    discountAmount =
      voucher.discount_type === 'PERCENT'
        ? Math.min(voucher.max_discount, Math.round((slot.price * voucher.value) / 100))
        : Math.min(voucher.max_discount, voucher.value);
  } else if (voucher.scope === 'FNB') {
    if (totalFood === 0) {
      return {
        valid: false,
        message: 'Cần có ít nhất 1 món ăn/nước trong giỏ hàng để áp dụng voucher FNB',
        discountAmount: 0,
      };
    }

    if (totalFood < voucher.min_order) {
      return {
        valid: false,
        message: `Đơn đồ ăn tối thiểu ${voucher.min_order.toLocaleString('vi-VN')} VND để dùng mã này`,
        discountAmount: 0,
      };
    }

    discountAmount =
      voucher.discount_type === 'PERCENT'
        ? Math.min(voucher.max_discount, Math.round((totalFood * voucher.value) / 100))
        : Math.min(voucher.max_discount, voucher.value);
  } else if (voucher.scope === 'CROSS') {
    // BR-INT-05: Voucher CROSS yêu cầu:
    // (1) Lobby có cả slot và đơn FNB (có fnb_provider_id và cartItems > 0)
    if (!lobby.fnb_provider_id || cartItems.length === 0 || totalFood === 0) {
      return {
        valid: false,
        message: 'Voucher CROSS chỉ hợp lệ khi phòng có cả đặt sân và gọi đồ FNB',
        discountAmount: 0,
      };
    }

    const fnbProvider = store.getProviderById(lobby.fnb_provider_id);
    if (!fnbProvider) {
      return {
        valid: false,
        message: 'Không tìm thấy thông tin quán FNB đã chọn',
        discountAmount: 0,
      };
    }

    // (2) Khoảng cách Haversine giữa VENUE và FNB <= max_distance_m
    const distance = haversineDistanceMeters(
      venueProvider.lat,
      venueProvider.lng,
      fnbProvider.lat,
      fnbProvider.lng
    );

    if (distance > voucher.max_distance_m) {
      return {
        valid: false,
        message: `Khoảng cách sân và quán (${Math.round(distance)} m) vượt quá giới hạn voucher chéo (${voucher.max_distance_m} m)`,
        discountAmount: 0,
      };
    }

    // (3) Đạt min_order (tính theo tổng đơn sân + đơn đồ)
    const combinedTotal = slot.price + totalFood;
    if (combinedTotal < voucher.min_order) {
      return {
        valid: false,
        message: `Tổng đơn tối thiểu ${voucher.min_order.toLocaleString('vi-VN')} VND để dùng mã này`,
        discountAmount: 0,
      };
    }

    discountAmount =
      voucher.discount_type === 'PERCENT'
        ? Math.min(voucher.max_discount, Math.round((slot.price * voucher.value) / 100))
        : Math.min(voucher.max_discount, voucher.value);
  }

  // Gắn voucher vào lobby trong store
  store.setLobbyVoucher(lobby.id, voucher.id);

  return {
    valid: true,
    message: 'Áp dụng mã giảm giá thành công',
    voucher,
    discountAmount,
  };
}
