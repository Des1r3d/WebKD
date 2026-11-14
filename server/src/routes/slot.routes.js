import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middlewares/auth.js';
import { Role } from '@prisma/client';
import { handleLockSlot, handleReleaseSlot } from '../controllers/slot.controller.js';

export const slotRouter = Router();

// UC03: Đặt & Giữ chỗ slot (BR-SLT-01, BR-SLT-02)
slotRouter.post(
  '/:id/lock',
  authenticateJWT,
  requireRole(Role.HOST, Role.MEMBER),
  handleLockSlot
);

// Giải phóng slot đang giữ
slotRouter.post(
  '/:id/release',
  authenticateJWT,
  requireRole(Role.HOST, Role.MEMBER),
  handleReleaseSlot
);
