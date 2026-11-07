import express from 'express';
import cors from 'cors';
import path from 'path';
import { authRouter } from './routes/auth.routes';
import { testRbacRouter } from './routes/test-rbac.routes';
import { providerRouter } from './routes/provider.routes';
import { slotRouter } from './routes/slot.routes';
import { lobbyRouter } from './routes/lobby.routes';
import { recommendRouter } from './routes/recommend.routes';
import { voucherRouter } from './routes/voucher.routes';
import { paymentRouter } from './routes/payment.routes';
import { disputeRouter } from './routes/dispute.routes';
import { adminRouter } from './routes/admin.routes';
import { authenticateJWT } from './middlewares/auth';
import { handleGetLobbyEscrow } from './controllers/payment.controller';

export const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'synchub-server',
    time: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRouter);
if (process.env.NODE_ENV === 'test') {
  app.use('/api/test', testRbacRouter);
}
app.use('/api/providers', providerRouter);
app.use('/api/slots', slotRouter);
app.use('/api/lobbies', lobbyRouter);
app.use('/api/recommend', recommendRouter);
app.use('/api/vouchers', voucherRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/disputes', disputeRouter);
app.use('/api/admin', adminRouter);

// GET /api/escrow/:lobbyId (BR-ESC-01..04)
app.get('/api/escrow/:lobbyId', authenticateJWT, handleGetLobbyEscrow);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Endpoint không tồn tại',
  });
});
