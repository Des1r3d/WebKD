import bcrypt from 'bcrypt';
import { Role, UserStatus } from '@prisma/client';
import { prisma } from '../prisma.js';
import { signJwt } from '../utils/jwt.js';
import { calculateReputation } from '../utils/reputation.js';

export async function register(req, res) {
  try {
    const { email, password, full_name, phone, role = Role.MEMBER } = req.body;

    if (!email || !password || !full_name || !phone) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Vui lòng cung cấp đầy đủ email, mật khẩu, họ tên và số điện thoại',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Mật khẩu phải có tối thiểu 6 ký tự',
      });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({
        error: 'EMAIL_EXISTS',
        message: 'Email này đã được sử dụng trên hệ thống',
      });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        full_name,
        phone,
        role: role in Role ? (role) : Role.MEMBER,
        reputation_score: 100,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        reputation_score: true,
        status: true,
        created_at: true,
      },
    });

    const token = signJwt({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công',
      token,
      user: {
        ...user,
        reputation: calculateReputation(user.reputation_score),
      },
    });
  } catch (error) {
    console.error('[Auth.register] Error:', error);
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Lỗi máy chủ khi đăng ký tài khoản',
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Vui lòng cung cấp email và mật khẩu',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Email hoặc mật khẩu không chính xác',
      });
      return;
    }

    if (user.status === UserStatus.BANNED) {
      res.status(403).json({
        error: 'USER_BANNED',
        message: 'Tài khoản của bạn đã bị khóa do vi phạm quy định',
      });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Email hoặc mật khẩu không chính xác',
      });
      return;
    }

    const token = signJwt({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { password_hash: _, ...safeUser } = user;

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        ...safeUser,
        reputation: calculateReputation(user.reputation_score),
      },
    });
  } catch (error) {
    console.error('[Auth.login] Error:', error);
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Lỗi máy chủ khi đăng nhập',
    });
  }
}

export async function getMe(req, res) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        reputation_score: true,
        status: true,
        created_at: true,
      },
    });

    if (!user) {
      res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'Không tìm thấy thông tin tài khoản',
      });
      return;
    }

    res.json({
      user: {
        ...user,
        reputation: calculateReputation(user.reputation_score),
      },
    });
  } catch (error) {
    console.error('[Auth.getMe] Error:', error);
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Lỗi khi tải thông tin tài khoản',
    });
  }
}
