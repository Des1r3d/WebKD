import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', authenticateJWT, getMe);
