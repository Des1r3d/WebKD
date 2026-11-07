import { Request, Response } from 'express';
import { ProviderType, SlotStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { haversineDistanceMeters } from '../utils/distance';

export interface ProviderFilterOptions {
  type?: ProviderType;
  category?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  priceMin?: number;
  priceMax?: number;
  search?: string;
}

/** Danh sách provider kèm distance_m, min/max_price, available_slots_count / menu_items_count */
export async function listProviders(options: ProviderFilterOptions = {}) {
  const {
    type,
    category,
    lat = 10.8752, // Mặc định NVH SV ĐHQG
    lng = 106.8007,
    radius = 5000, // 5km mặc định
    priceMin,
    priceMax,
    search,
  } = options;

  const q = search?.trim().toLowerCase();
  const providers = await prisma.provider.findMany({
    where: {
      ...(type && { type }),
      ...(category && category !== 'ALL' && { category }),
    },
    include: { slots: true, menu_items: true },
  });

  return providers
    .filter((p) => {
      if (q && !(p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q))) return false;
      if (radius && haversineDistanceMeters(lat, lng, p.lat, p.lng) > radius) return false;
      if (priceMin !== undefined || priceMax !== undefined) {
        const prices = (p.type === ProviderType.VENUE ? p.slots : p.menu_items).map((x) => x.price);
        if (prices.length > 0) {
          if (priceMin !== undefined && Math.max(...prices) < priceMin) return false;
          if (priceMax !== undefined && Math.min(...prices) > priceMax) return false;
        }
      }
      return true;
    })
    .map(({ slots, menu_items, ...p }) => {
      const isVenue = p.type === ProviderType.VENUE;
      const prices = (isVenue ? slots : menu_items).map((x) => x.price);
      const now = new Date();
      return {
        ...p,
        distance_m: haversineDistanceMeters(lat, lng, p.lat, p.lng),
        min_price: prices.length ? Math.min(...prices) : undefined,
        max_price: prices.length ? Math.max(...prices) : undefined,
        available_slots_count: isVenue
          ? slots.filter(
              (s) =>
                s.status === SlotStatus.AVAILABLE ||
                (s.status === SlotStatus.LOCKED && s.locked_until && s.locked_until < now)
            ).length
          : undefined,
        menu_items_count: isVenue ? undefined : menu_items.length,
      };
    })
    .sort((a, b) => a.distance_m - b.distance_m);
}

/** Provider + slots (VENUE, theo start_at) hoặc menu_items (FNB, theo order_count giảm dần) */
export async function getProviderDetail(id: string) {
  const provider = await prisma.provider.findUnique({ where: { id } });
  if (!provider) return null;
  return provider.type === ProviderType.VENUE
    ? { ...provider, slots: await prisma.slot.findMany({ where: { provider_id: id }, orderBy: { start_at: 'asc' } }) }
    : { ...provider, menu_items: await prisma.menuItem.findMany({ where: { provider_id: id }, orderBy: { order_count: 'desc' } }) };
}

export async function getProviders(req: Request, res: Response): Promise<void> {
  try {
    const {
      type,
      category,
      lat,
      lng,
      radius,
      priceMin,
      priceMax,
      search,
    } = req.query;

    const providers = await listProviders({
      type: type ? (type as ProviderType) : undefined,
      category: category ? String(category) : undefined,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      radius: radius ? Number(radius) : undefined,
      priceMin: priceMin !== undefined ? Number(priceMin) : undefined,
      priceMax: priceMax !== undefined ? Number(priceMax) : undefined,
      search: search ? String(search) : undefined,
    });

    res.json({
      success: true,
      count: providers.length,
      data: providers,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Lỗi khi tải danh sách địa điểm',
    });
  }
}

export async function getProviderById(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const provider = await getProviderDetail(id);

    if (!provider) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Không tìm thấy địa điểm đối tác',
      });
      return;
    }

    res.json({
      success: true,
      data: provider,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Lỗi khi tải thông tin địa điểm',
    });
  }
}

/**
 * POST /api/providers/:id/slots
 * UC12: Provider thêm khung giờ slot mới
 */
export async function addProviderSlot(req: Request, res: Response): Promise<void> {
  try {
    const providerId = String(req.params.id);
    const { startAt, endAt, price } = req.body;

    if (!startAt || !endAt || price === undefined) {
      res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Cần cung cấp startAt, endAt và price cho slot',
      });
      return;
    }

    const provider = await getProviderDetail(providerId);
    if (!provider) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Không tìm thấy provider' });
      return;
    }

    const newSlot = await prisma.slot.create({ data: {
      provider_id: providerId,
      start_at: new Date(startAt),
      end_at: new Date(endAt),
      price: Number(price),
      status: SlotStatus.AVAILABLE,
      locked_by: null,
      locked_until: null,
    } });

    res.status(201).json({
      success: true,
      message: 'Tạo khung giờ slot mới thành công',
      data: newSlot,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * POST /api/providers/:id/menu
 * UC12: Provider thêm món ăn/đồ uống mới vào thực đơn
 */
export async function addProviderMenu(req: Request, res: Response): Promise<void> {
  try {
    const providerId = String(req.params.id);
    const { name, price, imageUrl, isAvailable } = req.body;

    if (!name || price === undefined) {
      res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Cần cung cấp tên món (name) và giá (price)',
      });
      return;
    }

    const provider = await getProviderDetail(providerId);
    if (!provider) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Không tìm thấy provider' });
      return;
    }

    const newItem = await prisma.menuItem.create({ data: {
      provider_id: providerId,
      name: String(name).trim(),
      price: Number(price),
      image_url: imageUrl || null,
      is_available: isAvailable ?? true,
    } });

    res.status(201).json({
      success: true,
      message: 'Thêm món mới vào menu thành công',
      data: newItem,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * PATCH /api/providers/:id/menu/:itemId
 * UC12: Provider bật/tắt trạng thái món hoặc cập nhật giá
 */
export async function updateProviderMenuItem(req: Request, res: Response): Promise<void> {
  try {
    const itemId = String(req.params.itemId);
    const { name, price, isAvailable, imageUrl } = req.body;

    const updated = await prisma.menuItem.update({ where: { id: itemId }, data: {
      ...(name !== undefined && { name: String(name).trim() }),
      ...(price !== undefined && { price: Number(price) }),
      ...(isAvailable !== undefined && { is_available: Boolean(isAvailable) }),
      ...(imageUrl !== undefined && { image_url: imageUrl }),
    } }).catch(() => null);

    if (!updated) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Không tìm thấy món ăn' });
      return;
    }

    res.json({
      success: true,
      message: 'Cập nhật món thành công',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * GET /api/providers/:id/stats
 * UC12: Doanh thu, số đơn, hoa hồng, slot & menu cho Provider Portal
 */
export async function getProviderStats(req: Request, res: Response): Promise<void> {
  try {
    const providerId = String(req.params.id);
    const provider = await getProviderDetail(providerId);
    if (!provider) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Không tìm thấy provider' });
      return;
    }
    const where = { provider_id: providerId };
    const [byStatus, menu_items_total, agg, payouts] = await Promise.all([
      prisma.slot.groupBy({ by: ['status'], where, _count: true }),
      prisma.menuItem.count({ where }),
      prisma.escrowTransaction.aggregate({
        where: { payee_provider_id: providerId, type: 'RELEASE' },
        _sum: { amount: true, platform_fee: true, net_amount: true },
        _count: true,
      }),
      prisma.escrowTransaction.findMany({ where: { payee_provider_id: providerId, type: 'RELEASE' }, take: 20 }),
    ]);
    const n = (s: SlotStatus) => byStatus.find((g) => g.status === s)?._count ?? 0;
    const stats = {
      provider,
      slots_total: byStatus.reduce((s, g) => s + g._count, 0),
      slots_available: n('AVAILABLE'),
      slots_booked: n('BOOKED'),
      menu_items_total,
      gross_revenue: agg._sum.amount ?? 0,
      platform_fee_total: agg._sum.platform_fee ?? 0,
      net_revenue: agg._sum.net_amount ?? 0,
      payouts_count: agg._count,
      payouts,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

