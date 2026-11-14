import { Role } from '@prisma/client';
import { verifyJwt } from '../utils/jwt.js';

export function authenticateJWT(
  req,
  res,
  next
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Yêu cầu token xác thực (Bearer token)',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyJwt(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Token không hợp lệ hoặc đã hết hạn (15 phút)',
    });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next)=> {
    if (!req.user) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Chưa đăng nhập',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: `Quyền truy cập bị từ chối. Cần quyền: ${allowedRoles.join(', ')}`,
        currentRole: req.user.role,
      });
      return;
    }

    next();
  };
}
