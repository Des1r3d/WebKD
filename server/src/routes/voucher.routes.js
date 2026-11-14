import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.js';
import { handleValidateVoucher } from '../controllers/voucher.controller.js';

export const voucherRouter = Router();

// POST /api/vouchers/validate
voucherRouter.post('/validate', authenticateJWT, handleValidateVoucher);
