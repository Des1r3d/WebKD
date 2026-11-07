import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { Role } from '@prisma/client';
import { app } from '../src/app';
import { signJwt, verifyJwt } from '../src/utils/jwt';
import { calculateReputation } from '../src/utils/reputation';

describe('BR-REP-01: Phân hạng Uy tín & Tỷ lệ Cọc', () => {
  it('Điểm >= 90: Hạng A, miễn cọc 0%, được vào phòng', () => {
    const res100 = calculateReputation(100);
    const res90 = calculateReputation(90);

    expect(res100.tier).toBe('A');
    expect(res100.depositPercent).toBe(0);
    expect(res100.canJoinLobby).toBe(true);

    expect(res90.tier).toBe('A');
    expect(res90.depositPercent).toBe(0);
  });

  it('Điểm 70–89: Hạng B, cọc 30% tiền sân, được vào phòng', () => {
    const res89 = calculateReputation(89);
    const res70 = calculateReputation(70);

    expect(res89.tier).toBe('B');
    expect(res89.depositPercent).toBe(30);
    expect(res89.canJoinLobby).toBe(true);

    expect(res70.tier).toBe('B');
    expect(res70.depositPercent).toBe(30);
  });

  it('Điểm 50–69: Hạng C, cọc 100% tiền sân, được vào phòng', () => {
    const res69 = calculateReputation(69);
    const res50 = calculateReputation(50);

    expect(res69.tier).toBe('C');
    expect(res69.depositPercent).toBe(100);
    expect(res69.canJoinLobby).toBe(true);

    expect(res50.tier).toBe('C');
    expect(res50.depositPercent).toBe(100);
  });

  it('Điểm < 50: FLAGGED, bị chặn tham gia phòng (canJoinLobby = false)', () => {
    const res49 = calculateReputation(49);
    const res0 = calculateReputation(0);

    expect(res49.tier).toBe('FLAGGED');
    expect(res49.canJoinLobby).toBe(false);

    expect(res0.tier).toBe('FLAGGED');
    expect(res0.canJoinLobby).toBe(false);
  });
});

describe('JWT & RBAC Middleware Verification', () => {
  it('Ký và giải mã JWT thành công', () => {
    const payload = {
      userId: 'user-uuid-123',
      email: 'host@synchub.vn',
      role: Role.HOST,
    };
    const token = signJwt(payload);
    expect(typeof token).toBe('string');

    const decoded = verifyJwt(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(Role.HOST);
  });

  it('GET /api/test/public: Không cần token -> 200 OK', async () => {
    const res = await request(app).get('/api/test/public');
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Public endpoint');
  });

  it('GET /api/test/authenticated không gửi token -> 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/test/authenticated');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('UNAUTHORIZED');
  });

  it('GET /api/test/authenticated gửi token sai -> 401 INVALID_TOKEN', async () => {
    const res = await request(app)
      .get('/api/test/authenticated')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_TOKEN');
  });

  it('GET /api/test/authenticated gửi token đúng -> 200 OK kèm user', async () => {
    const token = signJwt({
      userId: 'user-uuid-member',
      email: 'member@synchub.vn',
      role: Role.MEMBER,
    });
    const res = await request(app)
      .get('/api/test/authenticated')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('member@synchub.vn');
  });

  it('MEMBER truy cập /api/test/admin-only -> 403 FORBIDDEN', async () => {
    const memberToken = signJwt({
      userId: 'u-member',
      email: 'member@synchub.vn',
      role: Role.MEMBER,
    });
    const res = await request(app)
      .get('/api/test/admin-only')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
    expect(res.body.currentRole).toBe('MEMBER');
  });

  it('ADMIN truy cập /api/test/admin-only -> 200 OK', async () => {
    const adminToken = signJwt({
      userId: 'u-admin',
      email: 'admin@synchub.vn',
      role: Role.ADMIN,
    });
    const res = await request(app)
      .get('/api/test/admin-only')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('ADMIN endpoint');
  });

  it('PROVIDER truy cập /api/test/provider-only -> 200 OK, còn HOST -> 403', async () => {
    const providerToken = signJwt({
      userId: 'u-prov',
      email: 'provider@synchub.vn',
      role: Role.PROVIDER,
    });
    const hostToken = signJwt({
      userId: 'u-host',
      email: 'host@synchub.vn',
      role: Role.HOST,
    });

    const resProv = await request(app)
      .get('/api/test/provider-only')
      .set('Authorization', `Bearer ${providerToken}`);
    expect(resProv.status).toBe(200);

    const resHost = await request(app)
      .get('/api/test/provider-only')
      .set('Authorization', `Bearer ${hostToken}`);
    expect(resHost.status).toBe(403);
  });
});
