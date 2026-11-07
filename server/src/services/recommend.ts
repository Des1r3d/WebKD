import { ProviderType } from '@prisma/client';
import { prisma } from '../prisma';
import { haversineDistanceMeters } from '../utils/distance';
import { findLobby } from './lobby';

export interface RecommendFnbItem {
  id: string;
  name: string;
  price: number;
  order_count: number;
  image_url: string | null;
}

export interface FnbRecommendation {
  provider_id: string;
  name: string;
  address: string;
  category: string;
  distance_m: number;
  open_hours: string;
  is_open: boolean;
  score: number;
  reasons: string[];
  has_cross_voucher: boolean;
  voucher_code?: string;
  popular_items: RecommendFnbItem[];
}

/**
 * Kiểm tra xem một thời điểm có nằm trong khung giờ open_hours (VD: "07:00-22:30") hay không
 */
function isTimeInOpenHours(time: Date, openHours: string): boolean {
  if (!openHours || !openHours.includes('-')) return true;
  try {
    const [startStr, endStr] = openHours.split('-');
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);

    const targetH = time.getHours();
    const targetM = time.getMinutes();

    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);
    const targetMinutes = targetH * 60 + targetM;

    return targetMinutes >= startMinutes && targetMinutes <= endMinutes;
  } catch {
    return true;
  }
}

/**
 * WBS-4.2 / BR-INT-05: Gợi ý quán FNB thông minh quanh sân đã đặt
 * Công thức:
 * score = 0.5 * max(0, 1 - d/1000) + 0.3 * isOpenAtSlotTime + 0.2 * norm(order_count) + crossVoucherBonus(0.15)
 */
export async function getRecommendationsForLobby(lobbyId: string): Promise<FnbRecommendation[]> {
  const lobby = await findLobby(lobbyId);
  if (!lobby) throw new Error('LOBBY_NOT_FOUND');

  const slot = await prisma.slot.findUnique({ where: { id: lobby.slot_id } });
  if (!slot) throw new Error('SLOT_NOT_FOUND');

  const venueProvider = await prisma.provider.findUnique({ where: { id: slot.provider_id } });
  if (!venueProvider) throw new Error('VENUE_NOT_FOUND');

  // Lấy danh sách quán FNB trong bán kính 3km quanh sân
  const allFnb = await prisma.provider.findMany({
    where: { type: ProviderType.FNB },
    include: { menu_items: true },
  });
  const fnbProviders = allFnb.filter(
    (p) => haversineDistanceMeters(venueProvider.lat, venueProvider.lng, p.lat, p.lng) <= 3000
  );
  const crossVouchers = await prisma.voucher.findMany({ where: { scope: 'CROSS' } });

  // Tìm maxOrderCount giữa các quán FNB để chuẩn hóa
  let maxOrderCount = 1;
  const fnbItemsMap = new Map<string, RecommendFnbItem[]>();

  for (const fnb of fnbProviders) {
    const items = (fnb.menu_items || []).map((m) => ({
      id: m.id,
      name: m.name,
      price: m.price,
      order_count: m.order_count,
      image_url: m.image_url,
    }));
    fnbItemsMap.set(fnb.id, items);

    const totalOrders = items.reduce((sum, item) => sum + item.order_count, 0);
    if (totalOrders > maxOrderCount) {
      maxOrderCount = totalOrders;
    }
  }

  const slotTime = new Date(slot.start_at);

  const recommendations: FnbRecommendation[] = fnbProviders.map((fnb) => {
    const distance = haversineDistanceMeters(
      venueProvider.lat,
      venueProvider.lng,
      fnb.lat,
      fnb.lng
    );

    const isOpen = isTimeInOpenHours(slotTime, fnb.open_hours);
    const items = fnbItemsMap.get(fnb.id) || [];
    const totalOrders = items.reduce((sum, item) => sum + item.order_count, 0);
    const normOrderCount = totalOrders / maxOrderCount;

    // Kiểm tra có voucher CROSS khả dụng trong bán kính max_distance_m
    const matchingCrossVoucher = crossVouchers.find((v) => distance <= v.max_distance_m);
    const hasCrossVoucher = !!matchingCrossVoucher;

    // Tính điểm score
    const distanceScore = 0.5 * Math.max(0, 1 - distance / 1000);
    const openScore = 0.3 * (isOpen ? 1 : 0);
    const popularityScore = 0.2 * normOrderCount;
    const voucherBonus = hasCrossVoucher ? 0.15 : 0;

    const finalScore = Number(
      (distanceScore + openScore + popularityScore + voucherBonus).toFixed(3)
    );

    // Lý do gợi ý hiển thị trên giao diện
    const reasons: string[] = [];
    if (distance <= 1000) {
      reasons.push(`Cách sân ${Math.round(distance)} m`);
    } else {
      reasons.push(`Cách sân ${(distance / 1000).toFixed(1)} km`);
    }

    if (isOpen) {
      reasons.push(`Đang mở cửa (${fnb.open_hours})`);
    } else {
      reasons.push(`Đóng cửa trong giờ chơi`);
    }

    if (hasCrossVoucher && matchingCrossVoucher) {
      const discountLabel =
        matchingCrossVoucher.discount_type === 'PERCENT'
          ? `${matchingCrossVoucher.value}%`
          : `${(matchingCrossVoucher.value / 1000).toFixed(0)}k`;
      reasons.push(`Mã giảm ${discountLabel} chéo (${matchingCrossVoucher.code})`);
    }

    if (totalOrders > 500) {
      reasons.push(`Quán được ưa chuộng (${totalOrders}+ lượt đặt)`);
    }

    // Top 3 món bán chạy nhất
    const popularItems = [...items]
      .sort((a, b) => b.order_count - a.order_count)
      .slice(0, 3);

    return {
      provider_id: fnb.id,
      name: fnb.name,
      address: fnb.address,
      category: fnb.category,
      distance_m: Math.round(distance),
      open_hours: fnb.open_hours,
      is_open: isOpen,
      score: finalScore,
      reasons,
      has_cross_voucher: hasCrossVoucher,
      voucher_code: matchingCrossVoucher?.code,
      popular_items: popularItems,
    };
  });

  // Sắp xếp giảm dần theo điểm score
  recommendations.sort((a, b) => b.score - a.score);

  return recommendations;
}
