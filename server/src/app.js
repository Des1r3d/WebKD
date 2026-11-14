import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { authRouter } from './routes/auth.routes.js';
import { testRbacRouter } from './routes/test-rbac.routes.js';
import { providerRouter } from './routes/provider.routes.js';
import { slotRouter } from './routes/slot.routes.js';
import { lobbyRouter } from './routes/lobby.routes.js';
import { recommendRouter } from './routes/recommend.routes.js';
import { voucherRouter } from './routes/voucher.routes.js';
import { paymentRouter } from './routes/payment.routes.js';
import { disputeRouter } from './routes/dispute.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { authenticateJWT } from './middlewares/auth.js';
import { handleGetLobbyEscrow } from './controllers/payment.controller.js';

export const app = express();
const frontend = new URL('../../client/vanilla/', import.meta.url);
const publicFiles = new URL('../../client/public/', import.meta.url);
const leaflet = new URL('../node_modules/leaflet/dist/', import.meta.url);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// Uploaded images share the app origin. Sandbox active content on direct navigation.
app.use('/uploads', express.static(fileURLToPath(new URL('../uploads/', import.meta.url)), {
  index: false,
  redirect: false,
  setHeaders(res) {
    res.setHeader('Content-Security-Policy', 'sandbox');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));

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

function notFound(_req, res) {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Endpoint không tồn tại',
  });
}

app.use(['/api', '/uploads', '/socket.io'], notFound);

app.use('/assets/leaflet', express.static(fileURLToPath(leaflet), { index: false, redirect: false }));
app.use('/assets', express.static(fileURLToPath(frontend), { index: false, redirect: false }));
app.use('/assets', notFound);
app.use(express.static(fileURLToPath(publicFiles), { index: false, redirect: false }));
app.use('/images', notFound);

app.get('*', (req, res, next) => {
  // Only browser document requests should reach the History API router.
  res.vary('Accept');
  const accept = req.get('accept') || '';
  const wantsHtml = /(?:^|,)\s*text\/html\s*(?:;|,|$)/i.test(accept) && req.accepts('html');
  if (!wantsHtml || req.path.split('/').some(segment => segment.includes('.'))) {
    return next();
  }
  res.sendFile(fileURLToPath(new URL('index.html', frontend)));
});

app.use(notFound);
