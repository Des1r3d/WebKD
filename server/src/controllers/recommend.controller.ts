import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { getRecommendationsForLobby } from '../services/recommend';

/**
 * GET /api/recommend?lobbyId=
 * UC07 / WBS-4.2: Gợi ý quán FNB và món bán chạy quanh sân
 */
export async function handleGetRecommendations(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const lobbyId = String(req.query.lobbyId || '');
    if (!lobbyId) {
      res.status(400).json({
        error: 'MISSING_LOBBY_ID',
        message: 'Cần cung cấp query param lobbyId',
      });
      return;
    }

    const recommendations = getRecommendationsForLobby(lobbyId);

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    if (error.message === 'LOBBY_NOT_FOUND') {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Phòng không tồn tại' });
      return;
    }
    if (error.message === 'SLOT_NOT_FOUND') {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Không tìm thấy thông tin slot sân' });
      return;
    }
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
}
