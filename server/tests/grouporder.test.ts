import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { seed } from '../prisma/seed';
import { signJwt } from '../src/utils/jwt';

describe('Khối 4: GroupOrder Realtime & Chia Bill API', () => {
  let hostToken: string;
  let memberToken: string;

  beforeEach(async () => {
    await seed({ silent: true, fast: true });

    hostToken = signJwt({
      userId: 'usr-host-01',
      email: 'dat.dt@synchub.vn',
      role: 'HOST' as any,
    });

    memberToken = signJwt({
      userId: 'usr-mem-02',
      email: 'minh.b@synchub.vn',
      role: 'MEMBER' as any,
    });
  });

  // ==========================================
  // WBS-4.1: CART OPERATIONS & LOBBY LOCK (BR-INT-01, BR-INT-04)
  // ==========================================
  describe('WBS-4.1: Giỏ hàng chung & Khóa phòng (BR-INT-01, BR-INT-04)', () => {
    it('Thành viên thêm món vào giỏ hàng thành công khi lobby OPEN', async () => {
      const res = await request(app)
        .post('/api/lobbies/lob-01/cart')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ menuItemId: 'mnu-04', qty: 2 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subtotal).toBeGreaterThan(0);
    });

    it('Host khóa phòng (POST /api/lobbies/:id/lock) chuyển status sang LOCKED', async () => {
      const res = await request(app)
        .post('/api/lobbies/lob-01/lock')
        .set('Authorization', `Bearer ${hostToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('LOCKED');
      expect(res.body.data.locked_at).toBeDefined();
    });

    it('BR-INT-04: Từ chối thêm món vào giỏ hàng khi phòng đã LOCKED (403 LOBBY_LOCKED)', async () => {
      await request(app)
        .post('/api/lobbies/lob-01/lock')
        .set('Authorization', `Bearer ${hostToken}`)
        .send();

      const res = await request(app)
        .post('/api/lobbies/lob-01/cart')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ menuItemId: 'mnu-05', qty: 1 });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('LOBBY_LOCKED');
    });

    it('Người không phải Host không được quyền khóa phòng (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .post('/api/lobbies/lob-01/lock')
        .set('Authorization', `Bearer ${memberToken}`)
        .send();

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN');
    });
  });

  // ==========================================
  // WBS-4.2: GỢI Ý THÔNG MINH & VOUCHER CHÉO (BR-INT-05)
  // ==========================================
  describe('WBS-4.2: Gợi ý thông minh (rule-based) & Voucher chéo (BR-INT-05)', () => {
    it('GET /api/recommend?lobbyId=lob-01: Quán top 1 gần sân <= 1km và có mã chéo', async () => {
      const res = await request(app)
        .get('/api/recommend?lobbyId=lob-01')
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const top1 = res.body.data[0];
      expect(top1.distance_m).toBeLessThanOrEqual(1000);
      expect(top1.has_cross_voucher).toBe(true);
      expect(top1.reasons.length).toBeGreaterThan(0);
      expect(top1.score).toBeGreaterThan(0.8);
      expect(top1.popular_items.length).toBeGreaterThan(0);
    });

    it('BR-INT-05: Áp dụng voucher CROSS thành công khi thỏa mãn cả 3 điều kiện', async () => {
      const res = await request(app)
        .post('/api/vouchers/validate')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          code: 'SYNCHUBCROSS15',
          lobbyId: 'lob-01',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.voucher.scope).toBe('CROSS');
      expect(res.body.data.discountAmount).toBeGreaterThan(0);
    });

    it('BR-INT-05: Từ chối voucher CROSS khi phòng chưa chọn quán FNB hoặc giỏ rỗng', async () => {
      await request(app)
        .post('/api/slots/slt-04/lock')
        .set('Authorization', `Bearer ${hostToken}`)
        .send();

      const createRes = await request(app)
        .post('/api/lobbies')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ slotId: 'slt-04' });

      const newLobbyId = createRes.body.data.lobby.id;

      const res = await request(app)
        .post('/api/vouchers/validate')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          code: 'SYNCHUBCROSS15',
          lobbyId: newLobbyId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cả đặt sân và gọi đồ FNB');
    });

    it('Từ chối voucher không tồn tại', async () => {
      const res = await request(app)
        .post('/api/vouchers/validate')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          code: 'NOTEXISTINGCODE',
          lobbyId: 'lob-01',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_VOUCHER');
    });
  });

  // ==========================================
  // WBS-4.3: ENDPOINT CHIA BILL & LẤY BILL
  // ==========================================
  describe('WBS-4.3: POST /api/lobbies/:id/split & GET /api/lobbies/:id/bills', () => {
    it('Host gọi split bill cho lob-01 tạo ra các hóa đơn khớp ca 215.000 VND', async () => {
      const res = await request(app)
        .post('/api/lobbies/lob-01/split')
        .set('Authorization', `Bearer ${hostToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.grandTotal).toBe(215000);
      expect(res.body.data.bills.length).toBe(4);

      const bills = res.body.data.bills;
      const totalWithDeposit = bills.reduce(
        (acc: number, b: any) => acc + b.total + b.deposit_offset,
        0
      );
      expect(totalWithDeposit).toBe(215000);

      const getRes = await request(app)
        .get('/api/lobbies/lob-01/bills')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.length).toBe(4);
      expect(getRes.body.data[0].vietqr_url).toContain('img.vietqr.io');
    });

    it('Member thường không được quyền kích hoạt chia bill (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .post('/api/lobbies/lob-01/split')
        .set('Authorization', `Bearer ${memberToken}`)
        .send();

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN');
    });
  });
});
