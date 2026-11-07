import { Request, Response } from 'express';
import { ProviderType, SlotStatus } from '@prisma/client';
import { store } from '../data/store';

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

    const providers = store.getProviders({
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
    const provider = store.getProviderById(id);

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

    const provider = store.getProviderById(providerId);
    if (!provider) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Không tìm thấy provider' });
      return;
    }

    const newSlot = store.addSlot({
      provider_id: providerId,
      start_at: new Date(startAt),
      end_at: new Date(endAt),
      price: Number(price),
      status: SlotStatus.AVAILABLE,
      locked_by: null,
      locked_until: null,
    });

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

    const provider = store.getProviderById(providerId);
    if (!provider) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Không tìm thấy provider' });
      return;
    }

    const newItem = store.addMenuItem({
      provider_id: providerId,
      name: String(name).trim(),
      price: Number(price),
      image_url: imageUrl || null,
      is_available: isAvailable ?? true,
    });

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

    const updated = store.updateMenuItem(itemId, {
      ...(name !== undefined && { name: String(name).trim() }),
      ...(price !== undefined && { price: Number(price) }),
      ...(isAvailable !== undefined && { is_available: Boolean(isAvailable) }),
      ...(imageUrl !== undefined && { image_url: imageUrl }),
    });

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
    const stats = store.getProviderStats(providerId);

    if (!stats) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Không tìm thấy provider' });
      return;
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}
