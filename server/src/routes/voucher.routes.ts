import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import { handleValidateVoucher } from '../controllers/voucher.controller';

export const voucherRouter = Router();

// POST /api/vouchers/validate
voucherRouter.post('/validate', authenticateJWT, handleValidateVoucher);
