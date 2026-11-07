import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';
import {
  handleGetAdminStats,
  handleGetUsers,
  handleUpdateUserStatus,
  handleGetAuditLogs,
  handleResolveDispute,
} from '../controllers/admin.controller';

export const adminRouter = Router();

// Tất cả các route admin đều yêu cầu quyền ADMIN
adminRouter.use(authenticateJWT);
adminRouter.use(requireRole(Role.ADMIN));

// UC12 / WBS-5.3: Thống kê nền tảng cho Admin Dashboard
adminRouter.get('/stats', handleGetAdminStats);

// Quản lý người dùng & uy tín
adminRouter.get('/users', handleGetUsers);
adminRouter.patch('/users/:id/status', handleUpdateUserStatus);

// Nhật ký kiểm toán audit_logs
adminRouter.get('/audit-logs', handleGetAuditLogs);

// BR-DSP-01: Phân xử khiếu nại (theo hợp đồng CONTEXT.md)
adminRouter.patch('/disputes/:id', handleResolveDispute);
