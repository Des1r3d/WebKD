import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticateJWT, requireRole } from '../middlewares/auth.js';

export const testRbacRouter = Router();

testRbacRouter.get('/public', (_req, res) => {
  res.json({ message: 'Public endpoint: Mọi người đều có thể truy cập' });
});

testRbacRouter.get(
  '/authenticated',
  authenticateJWT,
  (req, res) => {
    res.json({
      message: 'Authenticated endpoint: Đã đăng nhập',
      user: req.user,
    });
  }
);

testRbacRouter.get(
  '/host-only',
  authenticateJWT,
  requireRole(Role.HOST),
  (req, res) => {
    res.json({
      message: 'HOST endpoint: Chỉ HOST có quyền truy cập',
      user: req.user,
    });
  }
);

testRbacRouter.get(
  '/member-or-host',
  authenticateJWT,
  requireRole(Role.MEMBER, Role.HOST),
  (req, res) => {
    res.json({
      message: 'MEMBER/HOST endpoint: Dành cho thành viên và trưởng nhóm',
      user: req.user,
    });
  }
);

testRbacRouter.get(
  '/provider-only',
  authenticateJWT,
  requireRole(Role.PROVIDER),
  (req, res) => {
    res.json({
      message: 'PROVIDER endpoint: Chỉ Chủ sân / Quán FNB có quyền truy cập',
      user: req.user,
    });
  }
);

testRbacRouter.get(
  '/admin-only',
  authenticateJWT,
  requireRole(Role.ADMIN),
  (req, res) => {
    res.json({
      message: 'ADMIN endpoint: Chỉ Quản trị viên hệ thống có quyền truy cập',
      user: req.user,
    });
  }
);
