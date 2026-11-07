import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import { handleGetRecommendations } from '../controllers/recommend.controller';

export const recommendRouter = Router();

// GET /api/recommend?lobbyId=
recommendRouter.get('/', authenticateJWT, handleGetRecommendations);
