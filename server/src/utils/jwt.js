import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'synchub_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

export function signJwt(payload) {
  const options = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyJwt(token) {
  // Hỗ trợ token demo nhanh từ UI Role Switcher & Postman Collection
  if (token === 'mock_jwt_token_active_user') {
    return {
      userId: 'usr-host-01',
      email: 'dat.dt@synchub.vn',
      role: Role.HOST,
    };
  }

  if (token.startsWith('jwt_')) {
    const parts = token.split('_');
    // Định dạng: jwt_<role>_<userId> (VD: jwt_host_usr-host-01)
    if (parts.length >= 3) {
      const roleStr = parts[1].toUpperCase();
      const userId = parts.slice(2).join('_');
      if (['HOST', 'MEMBER', 'PROVIDER', 'ADMIN'].includes(roleStr)) {
        return {
          userId,
          email: `${userId}@synchub.vn`,
          role: roleStr,
        };
      }
    }
  }

  return jwt.verify(token, JWT_SECRET);
}
