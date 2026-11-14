import { LobbyStatus } from '@prisma/client';
import { prisma } from '../prisma.js';
import { cancelLobby, createLobby, findLobby, getLobbyDetail, joinLobby, leaveLobby } from '../services/lobby.js';

/**
 * POST /api/lobbies
 * Tạo phòng ghép kèo mới từ slot đã khóa (BR-INT-01)
 */
export async function handleCreateLobby(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Chưa đăng nhập' });
      return;
    }

    const { slotId, fnbProviderId, deadlineAt, shipFee, voucherId } = req.body;
    if (!slotId) {
      res.status(400).json({ error: 'MISSING_SLOT_ID', message: 'Cần chỉ định slotId để tạo phòng' });
      return;
    }

    const lobby = await createLobby({
      hostId: userId,
      slotId,
      fnbProviderId,
      deadlineAt,
      shipFee,
      voucherId,
    });

    const fullDetail = await getLobbyDetail(lobby.id);

    res.status(201).json({
      success: true,
      message: 'Mở phòng ghép kèo thành công (BR-INT-01)',
      data: fullDetail,
    });
  } catch (error) {
    if (error.message === 'SLOT_NOT_FOUND') {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Không tìm thấy slot' });
      return;
    }
    if (error.message === 'SLOT_NOT_LOCKED_BY_HOST' || error.message === 'SLOT_MUST_BE_LOCKED_FIRST') {
      res.status(403).json({
        error: 'SLOT_NOT_HELD',
        message: 'Bạn phải khóa giữ chỗ slot trước khi mở phòng ghép kèo (BR-INT-01)',
      });
      return;
    }
    if (error.message === 'LOBBY_SLOT_ALREADY_EXISTS') {
      res.status(409).json({
        error: 'LOBBY_EXISTS',
        message: 'Slot này đã được gắn với một phòng khác',
      });
      return;
    }
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * GET /api/lobbies/:code
 * Xem chi tiết phòng theo invite_code hoặc id
 */
export async function handleGetLobby(req, res) {
  try {
    const code = String(req.params.code);
    const detail = await getLobbyDetail(code);

    if (!detail) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Không tìm thấy phòng ghép kèo với mã hoặc id này',
      });
      return;
    }

    res.json({
      success: true,
      data: detail,
    });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * POST /api/lobbies/:id/join
 * Tham gia phòng ghép kèo, kiểm tra uy tín & mức cọc (BR-REP-01)
 */
export async function handleJoinLobby(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Chưa đăng nhập' });
      return;
    }

    const id = String(req.params.id);
    const result = await joinLobby(id, userId);

    res.status(200).json({
      success: true,
      message: 'Tham gia phòng thành công',
      data: result,
    });
  } catch (error) {
    if (error.message === 'REPUTATION_TOO_LOW') {
      res.status(403).json({
        error: 'REPUTATION_TOO_LOW',
        message: 'Điểm uy tín dưới 50 hoặc bị gắn cờ FLAGGED, không được phép tham gia phòng (BR-REP-01)',
      });
      return;
    }
    if (error.message === 'LOBBY_NOT_OPEN') {
      res.status(403).json({
        error: 'LOBBY_LOCKED',
        message: 'Phòng đã chốt hoặc không còn mở để tham gia',
      });
      return;
    }
    if (error.message === 'LOBBY_NOT_FOUND') {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Phòng không tồn tại',
      });
      return;
    }
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * POST /api/lobbies/:id/leave
 * Rời phòng ghép kèo
 */
export async function handleLeaveLobby(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Chưa đăng nhập' });
      return;
    }

    const id = String(req.params.id);
    const success = await leaveLobby(id, userId);

    if (!success) {
      res.status(400).json({
        error: 'LEAVE_FAILED',
        message: 'Không thể rời phòng hoặc bạn không phải thành viên',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Đã rời phòng thành công',
    });
  } catch (error) {
    if (error.message === 'HOST_CANNOT_LEAVE') {
      res.status(400).json({
        error: 'HOST_CANNOT_LEAVE',
        message: 'Trưởng phòng (Host) không thể tự rời phòng. Hãy hủy phòng nếu muốn giải tán.',
      });
      return;
    }
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * POST /api/lobbies/:id/lock
 * BR-INT-04: Host chốt phòng -> khóa giỏ hàng tức thì + emit lobby:locked
 */
export async function handleCancelLobby(req, res) {
  try {
    const { cancelled, slotReleased } = await cancelLobby(req.params.id, req.user.userId);
    const io = req.app.get('io');
    if (io) {
      io.to(`lobby:${cancelled.id}`).emit('notify', { type: 'INFO', message: 'Phòng đã hủy.' });
      if (slotReleased) {
        const slot = await prisma.slot.findUniqueOrThrow({ where: { id: cancelled.slot_id } });
        io.emit('slot:released', { slotId: slot.id, providerId: slot.provider_id });
      }
    }
    res.json({ success: true, data: cancelled });
  } catch (error) {
    const status = { LOBBY_NOT_FOUND: 404, FORBIDDEN: 403, INVALID_STATUS: 409 }[error.message];
    res.status(status || 500).json({ error: status ? error.message : 'SERVER_ERROR', message: error.message });
  }
}

export async function handleLockLobby(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Chưa đăng nhập' });
      return;
    }

    const id = String(req.params.id);
    const lobby = await findLobby(id);

    if (!lobby) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Phòng không tồn tại' });
      return;
    }

    if (lobby.host_id !== userId && req.user?.role !== 'ADMIN') {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Chỉ Host mới có quyền chốt khóa phòng',
      });
      return;
    }

    if (lobby.status !== 'OPEN') {
      res.status(400).json({
        error: 'INVALID_STATUS',
        message: `Phòng đang ở trạng thái ${lobby.status}, không thể khóa lại`,
      });
      return;
    }

    const updated = await prisma.groupLobby.update({
      where: { id: lobby.id, status: LobbyStatus.OPEN },
      data: { status: LobbyStatus.LOCKED, locked_at: new Date() },
    });
    const io = req.app.get('io');
    if (io) {
      io.to(`lobby:${lobby.id}`).emit('lobby:locked', {
        lobbyId: lobby.id,
        lockedAt: updated.locked_at || new Date(),
      });
    }

    res.json({
      success: true,
      message: 'Đã khóa phòng thành công (BR-INT-04)',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * POST /api/lobbies/:id/split
 * UC08 / BR-INT-02: Chốt chia bill (Largest Remainder) + sinh VietQR
 */
export async function handleSplitLobby(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Chưa đăng nhập' });
      return;
    }

    const id = String(req.params.id);
    const lobby = await findLobby(id);

    if (!lobby) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Phòng không tồn tại' });
      return;
    }

    if (lobby.host_id !== userId && req.user?.role !== 'ADMIN') {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Chỉ Host mới có quyền kích hoạt chia bill',
      });
      return;
    }

    const { executeSplitBillForLobby } = await import('../services/splitBill.js');
    const result = await executeSplitBillForLobby(lobby.id);

    const io = req.app.get('io');
    if (io) {
      io.to(`lobby:${lobby.id}`).emit('bill:ready', {
        lobbyId: lobby.id,
        splitBills: result.bills,
        grandTotal: result.grandTotal,
      });
    }

    res.json({
      success: true,
      message: 'Chia bill thành công theo chuẩn BR-INT-02',
      data: result,
    });
  } catch (error) {
    if (error.message === 'INVALID_STATUS') {
      res.status(409).json({ error: 'INVALID_STATUS', message: 'Trạng thái phòng không cho phép thao tác này' });
      return;
    }
    if (error.message === 'SPLIT_SUM_MISMATCH') {
      res.status(500).json({
        error: 'SPLIT_SUM_MISMATCH',
        message: 'Tổng các phần chia không khớp với tổng hóa đơn',
      });
      return;
    }
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * GET /api/lobbies/:id/bills
 * Lấy danh sách split bills của phòng
 */
export async function handleGetSplitBills(req, res) {
  try {
    const id = String(req.params.id);
    const lobby = await findLobby(id);

    if (!lobby) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Phòng không tồn tại' });
      return;
    }

    const bills = await prisma.splitBill.findMany({ where: { lobby_id: lobby.id } });
    res.json({
      success: true,
      data: bills,
    });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * POST /api/lobbies/:id/cart
 * Thêm món vào giỏ hàng qua REST API (BR-INT-01, BR-INT-04)
 */
export async function handleCartAdd(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Chưa đăng nhập' });
      return;
    }

    const id = String(req.params.id);
    const lobby = await findLobby(id);

    if (!lobby) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Phòng không tồn tại' });
      return;
    }

    if (lobby.status !== 'OPEN') {
      res.status(403).json({
        error: 'LOBBY_LOCKED',
        message: 'Phòng đã khóa, không thể thêm món (BR-INT-04)',
      });
      return;
    }

    const { menuItemId, qty = 1 } = req.body;
    if (!menuItemId) {
      res.status(400).json({ error: 'MISSING_MENU_ITEM_ID', message: 'Cần cung cấp menuItemId' });
      return;
    }

    const menuItem = await prisma.menuItem.findUnique({ where: { id: String(menuItemId) } });
    if (!menuItem) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Món ăn không tồn tại' });
      return;
    }

    let fnbProviderId = lobby.fnb_provider_id;
    if (!fnbProviderId) {
      fnbProviderId = menuItem.provider_id;
      await prisma.groupLobby.update({
        where: { id: lobby.id },
        data: { fnb_provider_id: fnbProviderId },
      });
    }

    const existing = await prisma.cartItem.findFirst({
      where: { lobby_id: lobby.id, user_id: userId, menu_item_id: menuItem.id },
    });
    const cartItem = existing
      ? await prisma.cartItem.update({
          where: { id: existing.id },
          data: { qty: existing.qty + Number(qty) },
        })
      : await prisma.cartItem.create({
          data: {
            lobby_id: lobby.id,
            user_id: userId,
            menu_item_id: menuItem.id,
            qty: Number(qty),
            unit_price_snapshot: menuItem.price,
          },
        });
    await prisma.menuItem.update({
      where: { id: menuItem.id },
      data: { order_count: { increment: Number(qty) } },
    });

    const dbCart = await prisma.cartItem.findMany({
      where: { lobby_id: lobby.id },
      include: { menu_item: true },
      orderBy: { created_at: 'asc' },
    });
    const cartItems = dbCart.map((c) => ({
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

    const io = req.app.get('io');
    if (io) {
      io.to(`lobby:${lobby.id}`).emit('cart:updated', {
        items: cartItems,
        subtotal,
        fnbProviderId,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Đã thêm món vào giỏ hàng',
      data: {
        cartItem,
        items: cartItems,
        subtotal,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}

/**
 * POST /api/lobbies/:id/checkin
 * UC10: Host hoặc Provider check-in -> Thưởng/phạt uy tín & giải ngân Escrow đa bên (BR-ESC-02, BR-ESC-03, BR-REP-02/03)
 */
export async function handleCheckInLobby(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Chưa đăng nhập' });
      return;
    }

    const id = String(req.params.id);
    const { members } = req.body; // Array<{ userId: string, status: 'CHECKED_IN' | 'NO_SHOW' }>

    const { checkInAndReleaseEscrow } = await import('../services/escrow.js');
    const result = await checkInAndReleaseEscrow(id, userId, members);

    // Emit socket event `escrow:released`
    const io = req.app.get('io');
    if (io) {
      io.to(`lobby:${result.lobbyId}`).emit('escrow:released', {
        lobbyId: result.lobbyId,
        transactions: result.releasedTransactions,
        memberResults: result.memberResults,
      });
    }

    res.json({
      success: true,
      message: 'Xác nhận Check-in và giải ngân đa bên thành công (BR-ESC-02)',
      data: result,
    });
  } catch (error) {
    if (error.message === 'INVALID_STATUS') {
      res.status(409).json({ error: 'INVALID_STATUS', message: 'Trạng thái phòng không cho phép thao tác này' });
      return;
    }
    if (error.code === 'IDEMPOTENCY_DUPLICATE_RELEASE') {
      res.status(409).json({
        error: 'IDEMPOTENCY_DUPLICATE_RELEASE',
        message: error.message,
      });
      return;
    }
    if (error.message === 'LOBBY_NOT_FOUND') {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Phòng không tồn tại' });
      return;
    }
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}
