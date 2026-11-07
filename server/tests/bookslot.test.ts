import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Role } from '@prisma/client';
import { app } from '../src/app';
import { signJwt } from '../src/utils/jwt';
import { store } from '../src/data/store';
import { lockSlot, releaseSlot, expireOverdueSlots } from '../src/services/slotLock';

describe('Khối 3 — BookSlot & Phòng ghép kèo (WBS-3.1, WBS-3.2, WBS-3.3)', () => {
  const hostToken = signJwt({
    userId: 'usr-host-01',
    email: 'dat.dt@synchub.vn',
    role: Role.HOST,
  });

  const memberBToken = signJwt({
    userId: 'usr-mem-02',
    email: 'minh.b@synchub.vn',
    role: Role.MEMBER,
  });

  const memberCToken = signJwt({
    userId: 'usr-mem-03',
    email: 'linh.c@synchub.vn',
    role: Role.MEMBER,
  });

  const flaggedToken = signJwt({
    userId: 'usr-flag-05',
    email: 'hung.flag@synchub.vn',
    role: Role.MEMBER,
  });

  beforeEach(() => {
    store.reset();
  });

  // ==========================================
  // WBS-3.1: PROVIDERS & SEARCH API
  // ==========================================
  describe('WBS-3.1: API Tìm kiếm & Lọc Nhà cung cấp (GET /api/providers)', () => {
    it('Lấy danh sách tất cả providers với tọa độ & khoảng cách mặc định', async () => {
      const res = await request(app).get('/api/providers');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(20);
      expect(res.body.data[0]).toHaveProperty('distance_m');
    });

    it('Lọc theo type = VENUE (Sân & Phòng học)', async () => {
      const res = await request(app).get('/api/providers?type=VENUE');
      expect(res.status).toBe(200);
      expect(res.body.data.every((p: any) => p.type === 'VENUE')).toBe(true);
      expect(res.body.data.length).toBe(10);
    });

    it('Lọc theo type = FNB (Quán nước & Ăn vặt)', async () => {
      const res = await request(app).get('/api/providers?type=FNB');
      expect(res.status).toBe(200);
      expect(res.body.data.every((p: any) => p.type === 'FNB')).toBe(true);
      expect(res.body.data.length).toBe(15);
    });

    it('Lọc theo category = badminton & bán kính 1000m', async () => {
      const res = await request(app).get(
        '/api/providers?category=badminton&radius=1000&lat=10.8752&lng=106.8007'
      );
      expect(res.status).toBe(200);
      expect(res.body.data.every((p: any) => p.category === 'badminton')).toBe(true);
      expect(res.body.data.every((p: any) => p.distance_m <= 1000)).toBe(true);
    });

    it('Lấy chi tiết VENUE kèm danh sách slots (GET /api/providers/:id)', async () => {
      const res = await request(app).get('/api/providers/prv-venue-01');
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('prv-venue-01');
      expect(Array.isArray(res.body.data.slots)).toBe(true);
      expect(res.body.data.slots.length).toBeGreaterThan(0);
    });

    it('Lấy chi tiết FNB kèm thực đơn menu_items (GET /api/providers/:id)', async () => {
      const res = await request(app).get('/api/providers/prv-fnb-01');
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('prv-fnb-01');
      expect(Array.isArray(res.body.data.menu_items)).toBe(true);
      expect(res.body.data.menu_items.length).toBe(4);
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

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.slot.status).toBe('LOCKED');
      expect(res.body.slot.locked_by).toBe('usr-host-01');
      expect(res.body.expiresInSeconds).toBeGreaterThan(590);
    });

    it('KHÓA SLOT TRÙNG: 20 request đồng thời -> ĐÚNG 1 THÀNH CÔNG (200), 19 THẤT BẠI (409 SLOT_TAKEN)', async () => {
      // Slot slt-04 ban đầu ở trạng thái AVAILABLE
      const slotId = 'slt-04';

      // Tạo 20 token khác nhau gửi đồng thời
      const requests = Array.from({ length: 20 }, (_, idx) => {
        const token = signJwt({
          userId: `usr-test-${idx}`,
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

      expect(successResponses.length).toBe(1);
      expect(conflictResponses.length).toBe(19);

      // Request thắng có thông tin slot LOCKED
      expect(successResponses[0].body.slot.status).toBe('LOCKED');

      // 19 request thua nhận mã lỗi chuẩn BR-SLT-02
      conflictResponses.forEach((res) => {
        expect(res.body.error).toBe('SLOT_TAKEN');
        expect(res.body.message).toContain('đã có người giữ');
      });
    });

    it('Giải phóng slot (POST /api/slots/:id/release) trả về AVAILABLE', async () => {
      // Khóa trước
      await request(app)
        .post('/api/slots/slt-02/lock')
        .set('Authorization', `Bearer ${hostToken}`);

      // Giải phóng
      const res = await request(app)
        .post('/api/slots/slt-02/release')
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.slot.status).toBe('AVAILABLE');
      expect(res.body.slot.locked_by).toBeNull();
    });

    it('Người dùng khác không được quyền giải phóng slot đang còn hạn của người khác', async () => {
      // Host khóa slt-02
      await request(app)
        .post('/api/slots/slt-02/lock')
        .set('Authorization', `Bearer ${hostToken}`);

      // Member B cố tình release
      const res = await request(app)
        .post('/api/slots/slt-02/release')
        .set('Authorization', `Bearer ${memberBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN');
    });

    it('Slot hết hạn 10 phút được tự động giải phóng bởi expiration job (BR-SLT-01)', async () => {
      // Giả lập slot slt-05 bị khóa nhưng locked_until trong quá khứ
      const slot = store.getSlotById('slt-05')!;
      slot.status = 'LOCKED';
      slot.locked_by = 'usr-host-01';
      slot.locked_until = new Date(Date.now() - 5000); // Đã quá hạn 5s

      const expired = expireOverdueSlots();
      expect(expired.some((s) => s.id === 'slt-05')).toBe(true);

      const refreshed = store.getSlotById('slt-05')!;
      expect(refreshed.status).toBe('AVAILABLE');
      expect(refreshed.locked_by).toBeNull();
    });
  });

  // ==========================================
  // WBS-3.3: PHÒNG GHÉP KÈO, INVITE QR & BR-REP-01 CỌC UY TÍN
  // ==========================================
  describe('WBS-3.3: Quản lý Phòng Ghép Kèo & Phân Hạng Cọc Uy Tín (BR-REP-01)', () => {
    it('Tạo phòng ghép kèo thành công từ slot đã khóa (BR-INT-01)', async () => {
      // Host khóa slt-02 trước
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

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lobby.invite_code).toHaveLength(6);
      expect(res.body.data.lobby.status).toBe('OPEN');
      expect(res.body.data.members).toHaveLength(1);
      expect(res.body.data.members[0].user_id).toBe('usr-host-01');
    });

    it('Không thể tạo phòng nếu slot chưa được khóa bởi host', async () => {
      const res = await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          slotId: 'slt-04', // AVAILABLE chưa khóa
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('SLOT_NOT_HELD');
    });

    it('Xem chi tiết phòng bằng invite_code (GET /api/lobbies/:code)', async () => {
      const res = await request(app)
        .get('/api/lobbies/SYNC01')
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.lobby.invite_code).toBe('SYNC01');
      expect(res.body.data.slot.price).toBe(120000);
      expect(res.body.data.members.length).toBe(4);
    });

    it('BR-REP-01: User Hạng B (Minh B, 82đ) vào phòng -> Yêu cầu cọc 30% (9.000đ)', async () => {
      // Reset phòng lob-01 chỉ còn Host
      (store as any).members = [
        {
          lobby_id: 'lob-01',
          user_id: 'usr-host-01',
          deposit_required: 0,
          deposit_paid: 0,
          status: 'JOINED',
          joined_at: new Date(),
        },
      ];

      const res = await request(app)
        .post('/api/lobbies/lob-01/join')
        .set('Authorization', `Bearer ${memberBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reputation.tier).toBe('B');
      expect(res.body.data.depositRequired).toBe(9000); // 30.000 * 30%
      expect(res.body.data.depositPaid).toBe(9000);
    });

    it('BR-REP-01: User Hạng C (Linh C, 64đ) vào phòng -> Yêu cầu cọc 100% (30.000đ)', async () => {
      const res = await request(app)
        .post('/api/lobbies/lob-01/join')
        .set('Authorization', `Bearer ${memberCToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reputation.tier).toBe('C');
      expect(res.body.data.depositRequired).toBe(30000); // 100% phần sân 30k
      expect(res.body.data.depositPaid).toBe(30000);
    });

    it('BR-REP-01: User FLAGGED (< 50đ, Hưng Flag) BỊ TỪ CHỐI THAM GIA PHÒNG (403)', async () => {
      const res = await request(app)
        .post('/api/lobbies/lob-01/join')
        .set('Authorization', `Bearer ${flaggedToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('REPUTATION_TOO_LOW');
      expect(res.body.message).toContain('bị gắn cờ FLAGGED');
    });

    it('Thành viên rời phòng thành công (POST /api/lobbies/:id/leave)', async () => {
      const res = await request(app)
        .post('/api/lobbies/lob-01/leave')
        .set('Authorization', `Bearer ${memberBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const detail = await request(app)
        .get('/api/lobbies/lob-01')
        .set('Authorization', `Bearer ${hostToken}`);

      const memberB = detail.body.data.members.find((m: any) => m.user_id === 'usr-mem-02');
      expect(memberB.status).toBe('LEFT');
    });

    it('Trưởng phòng (Host) không thể tự rời phòng mà phải giải tán phòng', async () => {
      const res = await request(app)
        .post('/api/lobbies/lob-01/leave')
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('HOST_CANNOT_LEAVE');
    });
  });
});
