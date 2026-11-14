import { Router } from 'express';
import {
  getProviders,
  getProviderById,
  addProviderSlot,
  addProviderMenu,
  updateProviderMenuItem,
  getProviderStats,
} from '../controllers/provider.controller.js';
import { authenticateJWT, requireRole } from '../middlewares/auth.js';
import { Role } from '@prisma/client';

export const providerRouter = Router();

// Public: Tìm kiếm đa tiêu chí & bản đồ (UC02)
providerRouter.get('/', getProviders);

// Provider / Admin: Thống kê doanh thu portal
providerRouter.get(
  '/:id/stats',
  authenticateJWT,
  getProviderStats
);

// Public: Chi tiết nhà cung cấp (kèm slots hoặc menu items)
providerRouter.get('/:id', getProviderById);

// Provider: Thêm slot mới (UC12)
providerRouter.post(
  '/:id/slots',
  authenticateJWT,
  requireRole(Role.PROVIDER, Role.ADMIN),
  addProviderSlot
);

// Provider: Thêm món mới vào menu (UC12)
providerRouter.post(
  '/:id/menu',
  authenticateJWT,
  requireRole(Role.PROVIDER, Role.ADMIN),
  addProviderMenu
);

// Provider: Cập nhật tình trạng / giá món ăn
providerRouter.patch(
  '/:id/menu/:itemId',
  authenticateJWT,
  requireRole(Role.PROVIDER, Role.ADMIN),
  updateProviderMenuItem
);

