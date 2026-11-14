import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { Role } from '@prisma/client';
import { app } from '../src/app.js';
import { signJwt, verifyJwt } from '../src/utils/jwt.js';
import { calculateReputation } from '../src/utils/reputation.js';

describe('BR-REP-01: Phân hạng Uy tín & Tỷ lệ Cọc', () => {
  it('Điểm >= 90: Hạng A, miễn cọc 0%, được vào phòng', () => {
    const res100 = calculateReputation(100);
    const res90 = calculateReputation(90);

    assert.strictEqual(res100.tier, 'A');
    assert.strictEqual(res100.depositPercent, 0);
    assert.strictEqual(res100.canJoinLobby, true);

    assert.strictEqual(res90.tier, 'A');
    assert.strictEqual(res90.depositPercent, 0);
  });

  it('Điểm 70–89: Hạng B, cọc 30% tiền sân, được vào phòng', () => {
    const res89 = calculateReputation(89);
    const res70 = calculateReputation(70);

    assert.strictEqual(res89.tier, 'B');
    assert.strictEqual(res89.depositPercent, 30);
    assert.strictEqual(res89.canJoinLobby, true);

    assert.strictEqual(res70.tier, 'B');
    assert.strictEqual(res70.depositPercent, 30);
  });

  it('Điểm 50–69: Hạng C, cọc 100% tiền sân, được vào phòng', () => {
    const res69 = calculateReputation(69);
    const res50 = calculateReputation(50);

    assert.strictEqual(res69.tier, 'C');
    assert.strictEqual(res69.depositPercent, 100);
    assert.strictEqual(res69.canJoinLobby, true);

    assert.strictEqual(res50.tier, 'C');
    assert.strictEqual(res50.depositPercent, 100);
  });

  it('Điểm < 50: FLAGGED, bị chặn tham gia phòng (canJoinLobby = false)', () => {
    const res49 = calculateReputation(49);
    const res0 = calculateReputation(0);

    assert.strictEqual(res49.tier, 'FLAGGED');
    assert.strictEqual(res49.canJoinLobby, false);

    assert.strictEqual(res0.tier, 'FLAGGED');
    assert.strictEqual(res0.canJoinLobby, false);
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
    assert.strictEqual(typeof token, 'string');

    const decoded = verifyJwt(token);
    assert.strictEqual(decoded.userId, payload.userId);
    assert.strictEqual(decoded.email, payload.email);
    assert.strictEqual(decoded.role, Role.HOST);
  });

  it('GET /api/test/public: Không cần token -> 200 OK', async () => {
    const res = await request(app).get('/api/test/public');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.message.includes('Public endpoint'));
  });

  it('GET /api/test/authenticated không gửi token -> 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/test/authenticated');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error, 'UNAUTHORIZED');
  });

  it('GET /api/test/authenticated gửi token sai -> 401 INVALID_TOKEN', async () => {
    const res = await request(app)
      .get('/api/test/authenticated')
      .set('Authorization', 'Bearer invalid-token');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error, 'INVALID_TOKEN');
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
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.email, 'member@synchub.vn');
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
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error, 'FORBIDDEN');
    assert.strictEqual(res.body.currentRole, 'MEMBER');
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
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.message.includes('ADMIN endpoint'));
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
    assert.strictEqual(resProv.status, 200);

    const resHost = await request(app)
      .get('/api/test/provider-only')
      .set('Authorization', `Bearer ${hostToken}`);
    assert.strictEqual(resHost.status, 403);
  });
});
