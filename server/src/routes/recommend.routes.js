import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.js';
import { handleGetRecommendations } from '../controllers/recommend.controller.js';

export const recommendRouter = Router();

// GET /api/recommend?lobbyId=
recommendRouter.get('/', authenticateJWT, handleGetRecommendations);
