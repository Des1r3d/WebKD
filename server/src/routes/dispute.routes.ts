import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';
import { uploadEvidence } from '../middlewares/upload';
import {
  handleCreateDispute,
  handleGetDisputes,
  handleGetDisputeById,
  handleResolveDispute,
} from '../controllers/dispute.controller';

export const disputeRouter = Router();

// UC11: Gửi khiếu nại kèm upload ảnh bằng chứng
disputeRouter.post(
  '/',
  authenticateJWT,
  uploadEvidence.array('evidence', 5),
  handleCreateDispute
);

// Xem danh sách khiếu nại
disputeRouter.get(
  '/',
  authenticateJWT,
  handleGetDisputes
);

// Chi tiết 1 khiếu nại
disputeRouter.get(
  '/:id',
  authenticateJWT,
  handleGetDisputeById
);

// BR-DSP-01: Admin phân xử khiếu nại
disputeRouter.patch(
  '/:id/resolve',
  authenticateJWT,
  requireRole(Role.ADMIN),
  handleResolveDispute
);
