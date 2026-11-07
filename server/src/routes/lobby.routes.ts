import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';
import {
  handleCreateLobby,
  handleGetLobby,
  handleJoinLobby,
  handleLeaveLobby,
  handleLockLobby,
  handleSplitLobby,
  handleGetSplitBills,
  handleCartAdd,
  handleCheckInLobby,
} from '../controllers/lobby.controller';

export const lobbyRouter = Router();

// Danh sách phòng của user hiện tại (hoặc tất cả nếu ADMIN)
lobbyRouter.get(
  '/',
  authenticateJWT,
  async (req: any, res) => {
    try {
      const { prisma } = await import('../prisma');
      const userId = req.user?.userId;
      const role = req.user?.role;
      const lobbies = await prisma.groupLobby.findMany({
        where:
          role === Role.ADMIN
            ? {}
            : { OR: [{ host_id: userId }, { members: { some: { user_id: userId } } }] },
        include: {
          slot: { include: { provider: true } },
          fnb_provider: true,
          members: { include: { user: { select: { id: true, full_name: true, reputation_score: true } } } },
          split_bills: true,
          escrow_transactions: true,
        },
        orderBy: { created_at: 'desc' },
      });
      res.json({ success: true, data: lobbies });
    } catch (error: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
  }
);

// UC04: Mở phòng ghép kèo gắn với slot đã giữ (BR-INT-01)
lobbyRouter.post(
  '/',
  authenticateJWT,
  requireRole(Role.HOST, Role.MEMBER),
  handleCreateLobby
);

// Xem chi tiết phòng theo invite_code hoặc id
lobbyRouter.get(
  '/:code',
  authenticateJWT,
  handleGetLobby
);

// UC05: Tham gia phòng ghép kèo, kiểm tra uy tín & cọc (BR-REP-01)
lobbyRouter.post(
  '/:id/join',
  authenticateJWT,
  handleJoinLobby
);

// Rời phòng ghép kèo
lobbyRouter.post(
  '/:id/leave',
  authenticateJWT,
  handleLeaveLobby
);

// BR-INT-04: Host chốt phòng -> khóa giỏ hàng tức thì + emit lobby:locked
lobbyRouter.post(
  '/:id/lock',
  authenticateJWT,
  handleLockLobby
);

// UC08 / BR-INT-02: Host chốt chia bill + sinh VietQR
lobbyRouter.post(
  '/:id/split',
  authenticateJWT,
  handleSplitLobby
);

// Lấy danh sách bills của phòng
lobbyRouter.get(
  '/:id/bills',
  authenticateJWT,
  handleGetSplitBills
);

// Thêm món vào giỏ hàng
lobbyRouter.post(
  '/:id/cart',
  authenticateJWT,
  handleCartAdd
);

// UC10: Host/Provider check-in -> giải ngân Escrow đa bên (BR-ESC-02, BR-ESC-03)
lobbyRouter.post(
  '/:id/checkin',
  authenticateJWT,
  handleCheckInLobby
);
