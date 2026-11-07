import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import { handleWebhookMock, handleGetLobbyEscrow } from '../controllers/payment.controller';

export const paymentRouter = Router();

// BR-ESC-01: Giả lập webhook xác nhận thanh toán VietQR
paymentRouter.post('/webhook-mock', authenticateJWT, handleWebhookMock);

// Xem trạng thái giữ/giải ngân Escrow của phòng
paymentRouter.get('/escrow/:lobbyId', authenticateJWT, handleGetLobbyEscrow);
