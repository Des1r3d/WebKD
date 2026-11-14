import { EscrowStatus } from '@prisma/client';
import { prisma } from '../prisma.js';
import { handlePaymentWebhook } from '../services/escrow.js';
import { findLobby } from '../services/lobby.js';

/**
 * POST /api/payments/webhook-mock
 * BR-ESC-01: Giả lập webhook xác nhận nhận tiền VietQR -> split_bills.PAID + escrow HELD
 */
export async function handleWebhookMock(req, res) {
  try {
    const { splitBillId, lobbyId, userId } = req.body;

    let targetBillId = splitBillId;
    if (!targetBillId && lobbyId && userId) {
      const lobby = await findLobby(String(lobbyId));
      const userBill = await prisma.splitBill.findFirst({
        where: { lobby_id: lobby ? lobby.id : String(lobbyId), user_id: String(userId) },
      });
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
  } catch (error) {
    if (error.message === 'INVALID_STATUS') {
      res.status(409).json({ error: 'INVALID_STATUS', message: 'Phòng không nhận thanh toán ở trạng thái hiện tại' });
      return;
    }
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
export async function handleGetLobbyEscrow(req, res) {
  try {
    const lobbyId = String(req.params.lobbyId);
    const lobby = await findLobby(lobbyId);

    if (!lobby) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Phòng không tồn tại' });
      return;
    }

    const transactions = await prisma.escrowTransaction.findMany({
      where: { lobby_id: lobby.id },
      orderBy: { created_at: 'desc' },
    });

    const sumStatus = (s) =>
      transactions.filter((t) => t.status === s).reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      data: {
        lobby_id: lobby.id,
        lobby_status: lobby.status,
        summary: {
          held: sumStatus(EscrowStatus.HELD),
          released: sumStatus(EscrowStatus.RELEASED),
          frozen: sumStatus(EscrowStatus.FROZEN),
          refunded: sumStatus(EscrowStatus.REFUNDED),
        },
        transactions,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}
