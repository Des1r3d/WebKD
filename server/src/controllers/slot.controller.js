import { lockSlot, releaseSlot } from '../services/slotLock.js';

/**
 * POST /api/slots/:id/lock
 * Khóa slot nguyên tử theo BR-SLT-01, BR-SLT-02
 */
export async function handleLockSlot(req, res) {
  try {
    const id = String(req.params.id);
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Bạn cần đăng nhập để giữ slot',
      });
      return;
    }

    const result = await lockSlot(id, userId);

    if (!result.success) {
      if (result.error === 'SLOT_TAKEN') {
        res.status(409).json({
          error: 'SLOT_TAKEN',
          message: result.message,
        });
        return;
      }
      if (result.error === 'NOT_FOUND') {
        res.status(404).json({
          error: 'NOT_FOUND',
          message: result.message,
        });
        return;
      }
      res.status(400).json({
        error: result.error,
        message: result.message,
      });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Lỗi hệ thống khi khóa slot',
    });
  }
}

/**
 * POST /api/slots/:id/release
 * Giải phóng slot đang giữ
 */
export async function handleReleaseSlot(req, res) {
  try {
    const id = String(req.params.id);
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Bạn cần đăng nhập để giải phóng slot',
      });
      return;
    }

    const result = await releaseSlot(id, userId);

    if (!result.success) {
      if (result.error === 'NOT_FOUND') {
        res.status(404).json({
          error: 'NOT_FOUND',
          message: result.message,
        });
        return;
      }
      if (result.error === 'FORBIDDEN') {
        res.status(403).json({
          error: 'FORBIDDEN',
          message: result.message,
        });
        return;
      }
      res.status(400).json({
        error: result.error,
        message: result.message,
      });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Lỗi hệ thống khi giải phóng slot',
    });
  }
}
