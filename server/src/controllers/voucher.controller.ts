import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { validateVoucher } from '../services/promo';

/**
 * POST /api/vouchers/validate
 * UC07 / BR-INT-05: Kiểm tra và áp dụng voucher cho phòng
 */
export async function handleValidateVoucher(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { code, lobbyId } = req.body;
    if (!code || !lobbyId) {
      res.status(400).json({
        error: 'MISSING_PARAMS',
        message: 'Cần cung cấp code và lobbyId',
      });
      return;
    }

    const result = validateVoucher(code, lobbyId);

    if (!result.valid) {
      res.status(400).json({
        success: false,
        error: 'INVALID_VOUCHER',
        message: result.message,
      });
      return;
    }

    res.json({
      success: true,
      message: result.message,
      data: {
        voucher: result.voucher,
        discountAmount: result.discountAmount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}
