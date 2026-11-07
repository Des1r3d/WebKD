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
