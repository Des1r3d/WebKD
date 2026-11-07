import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { app } from './app';
import { expireOverdueSlots } from './services/slotLock';
import { setupLobbySocket } from './sockets/lobby.socket';

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;
const server = http.createServer(app);

// Setup Socket.io
export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);
setupLobbySocket(io);

// BR-SLT-01: Background job quét các slot LOCKED quá hạn mỗi 60s
setInterval(async () => {
  const expired = await expireOverdueSlots();
  if (expired.length > 0) {
    console.log(`[SlotJob] Đã tự động giải phóng ${expired.length} slot hết hạn:`, expired.map((s) => s.id));
    for (const s of expired) {
      io.emit('slot:released', { slotId: s.id, providerId: s.provider_id });
    }
  }
}, 60 * 1000);

server.listen(PORT, () => {
  console.log(`🚀 [SyncHub Server] đang chạy tại http://localhost:${PORT}`);
  console.log(`📡 [API Health] http://localhost:${PORT}/api/health`);
});
