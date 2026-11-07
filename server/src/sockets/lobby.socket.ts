import { Server as SocketIOServer, Socket } from 'socket.io';
import { store } from '../data/store';

export function setupLobbySocket(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    // ==========================================
    // ROOM JOIN & LEAVE
    // ==========================================
    socket.on('lobby:join', (data: { lobbyId: string; userId?: string }) => {
      const { lobbyId, userId } = data;
      if (!lobbyId) return;

      const roomName = `lobby:${lobbyId}`;
      socket.join(roomName);

      const lobby = store.getLobbyById(lobbyId) || store.getLobbyByCode(lobbyId);
      if (!lobby) return;

      // Gửi danh sách thành viên hiện tại
      const members = store.getMembersByLobbyId(lobby.id).map((m) => ({
        user_id: m.user_id,
        full_name: m.user?.full_name || 'Thành viên',
        role: m.user?.role,
        reputation_score: m.user?.reputation_score,
        deposit_required: m.deposit_required,
        deposit_paid: m.deposit_paid,
        status: m.status,
        is_host: m.user_id === lobby.host_id,
      }));
      socket.emit('lobby:members', { members });

      // Gửi giỏ hàng hiện tại
      const cartItems = store.getCartItems(lobby.id).map((c) => ({
        id: c.id,
        user_id: c.user_id,
        menu_item_id: c.menu_item_id,
        name: c.menu_item?.name || 'Món ăn',
        qty: c.qty,
        unit_price_snapshot: c.unit_price_snapshot,
      }));
      const subtotal = cartItems.reduce(
        (sum, item) => sum + item.qty * item.unit_price_snapshot,
        0
      );
      socket.emit('cart:updated', {
        items: cartItems,
        subtotal,
        fnbProviderId: lobby.fnb_provider_id,
      });

      // Gửi lịch sử chat
      const chatHistory = store.getChatMessages(lobby.id);
      for (const msg of chatHistory) {
        socket.emit('chat:message', {
          id: msg.id,
          userId: msg.user_id,
          fullName: msg.full_name,
          text: msg.text,
          createdAt: msg.created_at,
        });
      }
    });

    socket.on('lobby:leave', (data: { lobbyId: string }) => {
      if (data.lobbyId) {
        socket.leave(`lobby:${data.lobbyId}`);
      }
    });

    // ==========================================
    // CART OPERATIONS (BR-INT-01, BR-INT-04)
    // ==========================================
    socket.on(
      'cart:add',
      (data: { lobbyId: string; userId: string; menuItemId: string; qty: number }) => {
        const { lobbyId, userId, menuItemId, qty = 1 } = data;
        const lobby = store.getLobbyById(lobbyId) || store.getLobbyByCode(lobbyId);

        if (!lobby) {
          socket.emit('notify', { type: 'ERROR', message: 'Phòng không tồn tại' });
          return;
        }

        // BR-INT-04: Phòng đã LOCKED thì từ chối thêm món
        if (lobby.status !== 'OPEN') {
          socket.emit('notify', {
            type: 'ERROR',
            message: 'Phòng đã khóa giỏ hàng, không thể thêm món',
          });
          return;
        }

        const menuItem = store.getMenuItemById(menuItemId);
        if (!menuItem) {
          socket.emit('notify', { type: 'ERROR', message: 'Món ăn không tồn tại' });
          return;
        }

        // Nếu lobby chưa có fnb_provider_id, gắn với quán của món ăn đầu tiên
        if (!lobby.fnb_provider_id) {
          store.setLobbyFnbProvider(lobby.id, menuItem.provider_id);
        }

        store.addCartItem({
          lobbyId: lobby.id,
          userId,
          menuItemId,
          qty,
        });

        // Broadcast giỏ hàng cập nhật cho cả phòng
        const cartItems = store.getCartItems(lobby.id).map((c) => ({
          id: c.id,
          user_id: c.user_id,
          menu_item_id: c.menu_item_id,
          name: c.menu_item?.name || 'Món ăn',
          qty: c.qty,
          unit_price_snapshot: c.unit_price_snapshot,
        }));
        const subtotal = cartItems.reduce(
          (sum, item) => sum + item.qty * item.unit_price_snapshot,
          0
        );

        io.to(`lobby:${lobby.id}`).emit('cart:updated', {
          items: cartItems,
          subtotal,
          fnbProviderId: lobby.fnb_provider_id,
        });
      }
    );

    socket.on(
      'cart:update',
      (data: { lobbyId: string; cartItemId: string; qty: number }) => {
        const { lobbyId, cartItemId, qty } = data;
        const lobby = store.getLobbyById(lobbyId) || store.getLobbyByCode(lobbyId);

        if (!lobby || lobby.status !== 'OPEN') {
          socket.emit('notify', {
            type: 'ERROR',
            message: 'Phòng đã khóa giỏ hàng, không thể chỉnh sửa',
          });
          return;
        }

        store.updateCartItem(cartItemId, qty);

        const cartItems = store.getCartItems(lobby.id).map((c) => ({
          id: c.id,
          user_id: c.user_id,
          menu_item_id: c.menu_item_id,
          name: c.menu_item?.name || 'Món ăn',
          qty: c.qty,
          unit_price_snapshot: c.unit_price_snapshot,
        }));
        const subtotal = cartItems.reduce(
          (sum, item) => sum + item.qty * item.unit_price_snapshot,
          0
        );

        io.to(`lobby:${lobby.id}`).emit('cart:updated', {
          items: cartItems,
          subtotal,
          fnbProviderId: lobby.fnb_provider_id,
        });
      }
    );

    socket.on(
      'cart:remove',
      (data: { lobbyId: string; cartItemId: string }) => {
        const { lobbyId, cartItemId } = data;
        const lobby = store.getLobbyById(lobbyId) || store.getLobbyByCode(lobbyId);

        if (!lobby || lobby.status !== 'OPEN') {
          socket.emit('notify', {
            type: 'ERROR',
            message: 'Phòng đã khóa giỏ hàng, không thể xóa món',
          });
          return;
        }

        store.removeCartItem(cartItemId);

        const cartItems = store.getCartItems(lobby.id).map((c) => ({
          id: c.id,
          user_id: c.user_id,
          menu_item_id: c.menu_item_id,
          name: c.menu_item?.name || 'Món ăn',
          qty: c.qty,
          unit_price_snapshot: c.unit_price_snapshot,
        }));
        const subtotal = cartItems.reduce(
          (sum, item) => sum + item.qty * item.unit_price_snapshot,
          0
        );

        io.to(`lobby:${lobby.id}`).emit('cart:updated', {
          items: cartItems,
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
      (data: { lobbyId: string; text: string; userId: string }) => {
        const { lobbyId, text, userId } = data;
        if (!text || !text.trim()) return;

        const lobby = store.getLobbyById(lobbyId) || store.getLobbyByCode(lobbyId);
        if (!lobby) return;

        const user = store.getUserById(userId);
        const fullName = user?.full_name || 'Thành viên';

        const messageRecord = store.addChatMessage({
          id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          lobby_id: lobby.id,
          user_id: userId,
          full_name: fullName,
          text: text.trim(),
          created_at: new Date(),
        });

        io.to(`lobby:${lobby.id}`).emit('chat:message', {
          id: messageRecord.id,
          userId: messageRecord.user_id,
          fullName: messageRecord.full_name,
          text: messageRecord.text,
          createdAt: messageRecord.created_at,
        });
      }
    );
  });
}
