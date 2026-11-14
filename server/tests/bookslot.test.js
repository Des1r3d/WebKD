import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { Role } from '@prisma/client';
import { app } from '../src/app.js';
import { prisma } from '../src/prisma.js';
import { resetTestData } from './fixtures.js';
import { signJwt } from '../src/utils/jwt.js';
import { expireOverdueSlots } from '../src/services/slotLock.js';

describe('Khối 3 — BookSlot & Phòng ghép kèo (WBS-3.1, WBS-3.2, WBS-3.3)', () => {
  const hostToken = signJwt({
    userId: 'usr-host-01',
    email: 'nguyen.minh.phat@synchub.vn',
    role: Role.HOST,
  });

  const memberBToken = signJwt({
    userId: 'usr-mem-02',
    email: 'khuong.thao.vy@synchub.vn',
    role: Role.MEMBER,
  });

  const memberCToken = signJwt({
    userId: 'usr-mem-03',
    email: 'tran.minh.quang@synchub.vn',
    role: Role.MEMBER,
  });

  const flaggedToken = signJwt({
    userId: 'usr-flag-05',
    email: 'hung.flag@synchub.vn',
    role: Role.MEMBER,
  });

  beforeEach(async () => {
    await resetTestData();
  });

  // ==========================================
  // WBS-3.1: PROVIDERS & SEARCH API
  // ==========================================
  describe('WBS-3.1: API Tìm kiếm & Lọc Nhà cung cấp (GET /api/providers)', () => {
    it('Lấy danh sách tất cả providers với tọa độ & khoảng cách mặc định', async () => {
      const res = await request(app).get('/api/providers');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.length >= 20);
      assert.ok('distance_m' in res.body.data[0]);
    });

    it('Lọc theo type = VENUE (Sân & Phòng học)', async () => {
      const res = await request(app).get('/api/providers?type=VENUE');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.every((p) => p.type === 'VENUE'), true);
      assert.strictEqual(res.body.data.length, 10);
    });

    it('Lọc theo type = FNB (Quán nước & Ăn vặt)', async () => {
      const res = await request(app).get('/api/providers?type=FNB');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.every((p) => p.type === 'FNB'), true);
      assert.strictEqual(res.body.data.length, 15);
    });

    it('Lọc theo category = badminton & bán kính 1000m', async () => {
      const res = await request(app).get(
        '/api/providers?category=badminton&radius=1000&lat=10.8752&lng=106.8007'
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.every((p) => p.category === 'badminton'), true);
      assert.strictEqual(res.body.data.every((p) => p.distance_m <= 1000), true);
    });

    it('Lấy chi tiết VENUE kèm danh sách slots (GET /api/providers/:id)', async () => {
      const res = await request(app).get('/api/providers/prv-venue-01');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.id, 'prv-venue-01');
      assert.strictEqual(Array.isArray(res.body.data.slots), true);
      assert.ok(res.body.data.slots.length > 0);
    });

    it('Lấy chi tiết FNB kèm thực đơn menu_items (GET /api/providers/:id)', async () => {
      const res = await request(app).get('/api/providers/prv-fnb-01');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.id, 'prv-fnb-01');
      assert.strictEqual(Array.isArray(res.body.data.menu_items), true);
      assert.strictEqual(res.body.data.menu_items.length, 4);
    });
  });

  // ==========================================
  // WBS-3.2: KHÓA SLOT NGUYÊN TỬ & RACE CONDITION (BR-SLT-01, BR-SLT-02)
  // ==========================================
  describe('WBS-3.2: Khóa Slot & Kiểm thử Chống Race Condition (BR-SLT-01/02)', () => {
    it('Khóa slot thành công trong 10 phút (BR-SLT-01)', async () => {
      const res = await request(app)
        .post('/api/slots/slt-02/lock')
        .set('Authorization', `Bearer ${hostToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.slot.status, 'LOCKED');
      assert.strictEqual(res.body.slot.locked_by, 'usr-host-01');
      assert.ok(res.body.expiresInSeconds > 590);
    });

    it('KHÓA SLOT TRÙNG: 20 request đồng thời -> ĐÚNG 1 THÀNH CÔNG (200), 19 THẤT BẠI (409 SLOT_TAKEN)', async () => {
      const slotId = 'slt-04';
      // 4 user hợp lệ trong DB để thỏa FK slots.locked_by -> users.id
      const userPool = ['usr-host-01', 'usr-mem-02', 'usr-mem-03', 'usr-mem-04'];

      const requests = Array.from({ length: 20 }, (_, idx) => {
        const userId = userPool[idx % userPool.length];
        const token = signJwt({
          userId,
          email: `test${idx}@synchub.vn`,
          role: Role.MEMBER,
        });

        return request(app)
          .post(`/api/slots/${slotId}/lock`)
          .set('Authorization', `Bearer ${token}`);
      });

      const responses = await Promise.all(requests);

      const successResponses = responses.filter((r) => r.status === 200);
      const conflictResponses = responses.filter((r) => r.status === 409);

      assert.strictEqual(successResponses.length, 1);
      assert.strictEqual(conflictResponses.length, 19);
      assert.strictEqual(successResponses[0].body.slot.status, 'LOCKED');

      conflictResponses.forEach((res) => {
        assert.strictEqual(res.body.error, 'SLOT_TAKEN');
        assert.ok(res.body.message.includes('đã có người giữ'));
      });
    });

    it('Giải phóng slot (POST /api/slots/:id/release) trả về AVAILABLE', async () => {
      await request(app)
        .post('/api/slots/slt-02/lock')
        .set('Authorization', `Bearer ${hostToken}`);

      const res = await request(app)
        .post('/api/slots/slt-02/release')
        .set('Authorization', `Bearer ${hostToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.slot.status, 'AVAILABLE');
      assert.strictEqual(res.body.slot.locked_by, null);
    });

    it('Người dùng khác không được quyền giải phóng slot đang còn hạn của người khác', async () => {
      await request(app)
        .post('/api/slots/slt-02/lock')
        .set('Authorization', `Bearer ${hostToken}`);

      const res = await request(app)
        .post('/api/slots/slt-02/release')
        .set('Authorization', `Bearer ${memberBToken}`);

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error, 'FORBIDDEN');
    });

    it('Slot hết hạn 10 phút được tự động giải phóng bởi expiration job (BR-SLT-01)', async () => {
      await prisma.slot.update({
        where: { id: 'slt-05' },
        data: {
          status: 'LOCKED',
          locked_by: 'usr-host-01',
          locked_until: new Date(Date.now() - 5000),
        },
      });

      const expired = await expireOverdueSlots();
      assert.strictEqual(expired.some((s) => s.id === 'slt-05'), true);

      const refreshed = (await prisma.slot.findUnique({ where: { id: 'slt-05' } }));
      assert.strictEqual(refreshed.status, 'AVAILABLE');
      assert.strictEqual(refreshed.locked_by, null);
    });
  });

  // ==========================================
  // WBS-3.3: PHÒNG GHÉP KÈO, INVITE QR & BR-REP-01 CỌC UY TÍN
  // ==========================================
  describe('WBS-3.3: Quản lý Phòng Ghép Kèo & Phân Hạng Cọc Uy Tín (BR-REP-01)', () => {
    it('Tạo phòng ghép kèo thành công từ slot đã khóa (BR-INT-01)', async () => {
      await request(app)
        .post('/api/slots/slt-02/lock')
        .set('Authorization', `Bearer ${hostToken}`);

      const res = await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          slotId: 'slt-02',
          fnbProviderId: 'prv-fnb-01',
          shipFee: 15000,
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.lobby.invite_code.length, 6);
      assert.strictEqual(res.body.data.lobby.status, 'OPEN');
      assert.strictEqual(res.body.data.members.length, 1);
      assert.strictEqual(res.body.data.members[0].user_id, 'usr-host-01');
    });

    it('Không thể tạo phòng nếu slot chưa được khóa bởi host', async () => {
      const res = await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          slotId: 'slt-04',
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error, 'SLOT_NOT_HELD');
    });

    it('Xem chi tiết phòng bằng invite_code (GET /api/lobbies/:code)', async () => {
      const res = await request(app)
        .get('/api/lobbies/SYNC01')
        .set('Authorization', `Bearer ${hostToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.lobby.invite_code, 'SYNC01');
      assert.strictEqual(res.body.data.slot.price, 120000);
      assert.strictEqual(res.body.data.members.length, 4);
    });

    it('BR-REP-01: User Hạng B (Minh B, 82đ) vào phòng -> Yêu cầu cọc 30% (9.000đ)', async () => {
      await prisma.lobbyMember.deleteMany({
        where: { lobby_id: 'lob-01', user_id: { not: 'usr-host-01' } },
      });

      const res = await request(app)
        .post('/api/lobbies/lob-01/join')
        .set('Authorization', `Bearer ${memberBToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.reputation.tier, 'B');
      assert.strictEqual(res.body.data.depositRequired, 9000);
      assert.strictEqual(res.body.data.depositPaid, 9000);
    });

    it('BR-REP-01: User Hạng C (Linh C, 64đ) vào phòng -> Yêu cầu cọc 100% (30.000đ)', async () => {
      const res = await request(app)
        .post('/api/lobbies/lob-01/join')
        .set('Authorization', `Bearer ${memberCToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.reputation.tier, 'C');
      assert.strictEqual(res.body.data.depositRequired, 30000);
      assert.strictEqual(res.body.data.depositPaid, 30000);
    });

    it('BR-REP-01: User FLAGGED (< 50đ, Hưng Flag) BỊ TỪ CHỐI THAM GIA PHÒNG (403)', async () => {
      const res = await request(app)
        .post('/api/lobbies/lob-01/join')
        .set('Authorization', `Bearer ${flaggedToken}`);

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error, 'REPUTATION_TOO_LOW');
      assert.ok(res.body.message.includes('bị gắn cờ FLAGGED'));
    });

    it('Thành viên rời phòng thành công (POST /api/lobbies/:id/leave)', async () => {
      const res = await request(app)
        .post('/api/lobbies/lob-01/leave')
        .set('Authorization', `Bearer ${memberBToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);

      const detail = await request(app)
        .get('/api/lobbies/lob-01')
        .set('Authorization', `Bearer ${hostToken}`);

      const memberB = detail.body.data.members.find((m) => m.user_id === 'usr-mem-02');
      assert.strictEqual(memberB.status, 'LEFT');
    });

    it('Trưởng phòng (Host) không thể tự rời phòng mà phải giải tán phòng', async () => {
      const res = await request(app)
        .post('/api/lobbies/lob-01/leave')
        .set('Authorization', `Bearer ${hostToken}`);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'HOST_CANNOT_LEAVE');
    });
  });
});
