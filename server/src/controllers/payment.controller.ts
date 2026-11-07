import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { handlePaymentWebhook } from '../services/escrow';
import { store } from '../data/store';
import { EscrowStatus } from '@prisma/client';

/**
 * POST /api/payments/webhook-mock
 * BR-ESC-01: Giả lập webhook xác nhận nhận tiền VietQR -> split_bills.PAID + escrow HELD
 */
export async function handleWebhookMock(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { splitBillId, lobbyId, userId } = req.body;

    let targetBillId = splitBillId;
    if (!targetBillId && lobbyId && userId) {
      const bills = store.getSplitBillsByLobbyId(lobbyId);
      const userBill = bills.find((b) => b.user_id === userId);
      if (userBill) {
        targetBillId = userBill.id;
      }
    }

    if (!targetBillId) {
      res.status(400).json({
        error: 'MISSING_PARAMS',
        message: 'Cần cung cấp splitBillId hoặc (lobbyId + userId)',
      });
      return;
    }

    const actorId = req.user?.userId;
    const result = await handlePaymentWebhook(targetBillId, actorId);

    // Phát socket event `payment:confirmed`
    const io = req.app.get('io');
    if (io) {
      io.to(`lobby:${result.splitBill.lobby_id}`).emit('payment:confirmed', {
        lobbyId: result.splitBill.lobby_id,
        userId: result.splitBill.user_id,
        splitBillId: result.splitBill.id,
        lobbyStatus: result.lobbyStatus,
      });
    }

    res.json({
      success: true,
      message: 'Xác nhận thanh toán VietQR thành công, tiền đã chuyển vào Escrow HELD (BR-ESC-01)',
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'SPLIT_BILL_NOT_FOUND') {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Không tìm thấy hóa đơn' });
      return;
    }
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * GET /api/escrow/:lobbyId
 * Xem trạng thái sổ cái Escrow của một phòng ghép kèo
 */
export async function handleGetLobbyEscrow(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const lobbyId = String(req.params.lobbyId);
    const lobby = store.getLobbyById(lobbyId) || store.getLobbyByCode(lobbyId);

    if (!lobby) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Phòng không tồn tại' });
      return;
    }

    const transactions = store.getEscrowTransactionsByLobbyId(lobby.id);

    const totalHeld = transactions
      .filter((t) => t.status === EscrowStatus.HELD)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalReleased = transactions
      .filter((t) => t.status === EscrowStatus.RELEASED)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalFrozen = transactions
      .filter((t) => t.status === EscrowStatus.FROZEN)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalRefunded = transactions
      .filter((t) => t.status === EscrowStatus.REFUNDED)
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      data: {
        lobby_id: lobby.id,
        lobby_status: lobby.status,
        summary: {
          held: totalHeld,
          released: totalReleased,
          frozen: totalFrozen,
          refunded: totalRefunded,
        },
        transactions,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}
