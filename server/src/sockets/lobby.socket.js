import { prisma } from '../prisma.js';
import { findLobby, getFormattedLobbyMembers, isActiveLobbyMember, lockLobbyRow } from '../services/lobby.js';

// Chat trong phòng lưu tạm trong RAM (12 bảng DB đã khóa theo AGENTS.md, không có bảng chat)
const chatMessages = new Map();
const actorOf = (socket, fallbackUserId) => socket.data?.user?.userId || fallbackUserId;

async function ensureActiveMember(socket, lobby, userId) {
  const actorId = actorOf(socket, userId);
  if (await isActiveLobbyMember(lobby, actorId)) return actorId;
  socket.emit('notify', { type: 'ERROR', message: 'Bạn cần tham gia phòng trước khi thao tác' });
  return null;
}

async function loadFormattedCart(lobbyId) {
  const dbCart = await prisma.cartItem.findMany({
    where: { lobby_id: lobbyId },
    include: { menu_item: true },
    orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
  });
  const items = dbCart.map((c) => ({
    id: c.id,
    user_id: c.user_id,
    menu_item_id: c.menu_item_id,
    name: c.menu_item?.name || 'Món ăn',
    qty: c.qty,
    unit_price_snapshot: c.unit_price_snapshot,
  }));
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unit_price_snapshot, 0);
  return { items, subtotal };
}

export function setupLobbySocket(io) {
  io.on('connection', (socket) => {
    // ==========================================
    // ROOM JOIN & LEAVE
    // ==========================================
    socket.on('lobby:join', async (data) => {
      const { lobbyId } = data || {};
      if (!lobbyId) return;

      const lobby = await findLobby(lobbyId);
      if (!lobby) return;

      // Vào cả room theo id và invite_code để emit theo id luôn tới được client
      socket.join(`lobby:${lobby.id}`);
      socket.join(`lobby:${lobby.invite_code}`);

      const members = await getFormattedLobbyMembers(lobby.id, lobby.host_id);
      socket.emit('lobby:members', { members });

      const { items, subtotal } = await loadFormattedCart(lobby.id);
      socket.emit('cart:updated', {
        items,
        subtotal,
        fnbProviderId: lobby.fnb_provider_id,
      });

      const history = chatMessages.get(lobby.id) || [];
      for (const msg of history) {
        socket.emit('chat:message', {
          id: msg.id,
          userId: msg.user_id,
          fullName: msg.full_name,
          text: msg.text,
          createdAt: msg.created_at,
        });
      }
    });

    socket.on('lobby:leave', async (data) => {
      if (!data?.lobbyId) return;
      socket.leave(`lobby:${data.lobbyId}`);
      const lobby = await findLobby(data.lobbyId);
      if (lobby) {
        socket.leave(`lobby:${lobby.id}`);
        socket.leave(`lobby:${lobby.invite_code}`);
      }
    });

    // ==========================================
    // CART OPERATIONS (BR-INT-01, BR-INT-04) — ghi DB trước, emit sau
    // ==========================================
    socket.on(
      'cart:add',
      async (data) => {
        const { lobbyId, userId, menuItemId, qty = 1 } = data || {};
        const lobby = await findLobby(lobbyId);

        if (!lobby) {
          socket.emit('notify', { type: 'ERROR', message: 'Phòng không tồn tại' });
          return;
        }

        if (lobby.status !== 'OPEN') {
          socket.emit('notify', {
            type: 'ERROR',
            message: 'Phòng đã khóa giỏ hàng, không thể thêm món',
          });
          return;
        }

        const actorId = await ensureActiveMember(socket, lobby, userId);
        if (!actorId) return;

        const menuItem = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
        if (!menuItem) {
          socket.emit('notify', { type: 'ERROR', message: 'Món ăn không tồn tại' });
          return;
        }

        const fnbProviderId = await prisma.$transaction(async (tx) => {
          const current = await lockLobbyRow(tx, lobby.id);
          if (current.status !== 'OPEN') return false;
          let fnbProviderId = current.fnb_provider_id;
          if (!fnbProviderId) {
            fnbProviderId = menuItem.provider_id;
            await tx.groupLobby.update({
              where: { id: lobby.id },
              data: { fnb_provider_id: fnbProviderId },
            });
          }

          const existing = await tx.cartItem.findFirst({
            where: { lobby_id: lobby.id, user_id: actorId, menu_item_id: menuItemId },
          });
          if (existing) {
            await tx.cartItem.update({
              where: { id: existing.id },
              data: { qty: existing.qty + Number(qty) },
            });
          } else {
            await tx.cartItem.create({
              data: {
                lobby_id: lobby.id,
                user_id: actorId,
                menu_item_id: menuItemId,
                qty: Number(qty),
                unit_price_snapshot: menuItem.price,
              },
            });
          }
          await tx.menuItem.update({
            where: { id: menuItemId },
            data: { order_count: { increment: Number(qty) } },
          });

          return fnbProviderId;
        });
        if (fnbProviderId === false) {
          socket.emit('notify', { type: 'ERROR', message: 'Phòng đã khóa giỏ hàng, không thể thêm món' });
          return;
        }

        const { items, subtotal } = await loadFormattedCart(lobby.id);
        io.to(`lobby:${lobby.id}`).emit('cart:updated', {
          items,
          subtotal,
          fnbProviderId,
        });
      }
    );

    socket.on(
      'cart:update',
      async (data) => {
        const { lobbyId, cartItemId, qty, userId } = data || {};
        const lobby = await findLobby(lobbyId);

        if (!lobby || lobby.status !== 'OPEN') {
          socket.emit('notify', {
            type: 'ERROR',
            message: 'Phòng đã khóa giỏ hàng, không thể chỉnh sửa',
          });
          return;
        }

        if (!(await ensureActiveMember(socket, lobby, userId))) return;

        if (qty <= 0) {
          await prisma.cartItem.deleteMany({ where: { id: cartItemId, lobby_id: lobby.id } });
        } else {
          await prisma.cartItem.updateMany({
            where: { id: cartItemId, lobby_id: lobby.id },
            data: { qty: Number(qty) },
          });
        }

        const { items, subtotal } = await loadFormattedCart(lobby.id);
        io.to(`lobby:${lobby.id}`).emit('cart:updated', {
          items,
          subtotal,
          fnbProviderId: lobby.fnb_provider_id,
        });
      }
    );

    socket.on(
      'cart:remove',
      async (data) => {
        const { lobbyId, cartItemId, userId } = data || {};
        const lobby = await findLobby(lobbyId);

        if (!lobby || lobby.status !== 'OPEN') {
          socket.emit('notify', {
            type: 'ERROR',
            message: 'Phòng đã khóa giỏ hàng, không thể xóa món',
          });
          return;
        }

        if (!(await ensureActiveMember(socket, lobby, userId))) return;

        await prisma.cartItem.deleteMany({ where: { id: cartItemId, lobby_id: lobby.id } });

        const { items, subtotal } = await loadFormattedCart(lobby.id);
        io.to(`lobby:${lobby.id}`).emit('cart:updated', {
          items,
          subtotal,
          fnbProviderId: lobby.fnb_provider_id,
        });
      }
    );

    // ==========================================
    // CHAT REALTIME
    // ==========================================
    socket.on(
      'chat:send',
      async (data) => {
        const { lobbyId, text, userId } = data || {};
        if (!text || !text.trim()) return;

        const lobby = await findLobby(lobbyId);
        if (!lobby) return;

        const actorId = await ensureActiveMember(socket, lobby, userId);
        if (!actorId) return;

        const user = actorId ? await prisma.user.findUnique({ where: { id: actorId } }) : null;
        const fullName = user?.full_name || 'Thành viên';

        const msg = {
          id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          lobby_id: lobby.id,
          user_id: actorId,
          full_name: fullName,
          text: text.trim(),
          created_at: new Date(),
        };
        const list = chatMessages.get(lobby.id) || [];
        list.push(msg);
        chatMessages.set(lobby.id, list.slice(-50));

        io.to(`lobby:${lobby.id}`).emit('chat:message', {
          id: msg.id,
          userId: msg.user_id,
          fullName: msg.full_name,
          text: msg.text,
          createdAt: msg.created_at,
        });
      }
    );
  });
}
