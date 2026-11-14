import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { resetTestData } from './fixtures.js';
import { signJwt } from '../src/utils/jwt.js';

describe('Khối 4: GroupOrder Realtime & Chia Bill API', () => {
  let hostToken;
  let memberToken;

  beforeEach(async () => {
    await resetTestData();

    hostToken = signJwt({
      userId: 'usr-host-01',
      email: 'nguyen.minh.phat@synchub.vn',
      role: 'HOST',
    });

    memberToken = signJwt({
      userId: 'usr-mem-02',
      email: 'khuong.thao.vy@synchub.vn',
      role: 'MEMBER',
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

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.subtotal > 0);
    });

    it('Host khóa phòng (POST /api/lobbies/:id/lock) chuyển status sang LOCKED', async () => {
      const res = await request(app)
        .post('/api/lobbies/lob-01/lock')
        .set('Authorization', `Bearer ${hostToken}`)
        .send();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.status, 'LOCKED');
      assert.notStrictEqual(res.body.data.locked_at, undefined);
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

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error, 'LOBBY_LOCKED');
    });

    it('Người không phải Host không được quyền khóa phòng (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .post('/api/lobbies/lob-01/lock')
        .set('Authorization', `Bearer ${memberToken}`)
        .send();

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error, 'FORBIDDEN');
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

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(Array.isArray(res.body.data), true);
      assert.ok(res.body.data.length > 0);

      const top1 = res.body.data[0];
      assert.ok(top1.distance_m <= 1000);
      assert.strictEqual(top1.has_cross_voucher, true);
      assert.ok(top1.reasons.length > 0);
      assert.ok(top1.score > 0.8);
      assert.ok(top1.popular_items.length > 0);
    });

    it('BR-INT-05: Áp dụng voucher CROSS thành công khi thỏa mãn cả 3 điều kiện', async () => {
      const res = await request(app)
        .post('/api/vouchers/validate')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          code: 'SYNCHUBCROSS15',
          lobbyId: 'lob-01',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.voucher.scope, 'CROSS');
      assert.ok(res.body.data.discountAmount > 0);
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

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('cả đặt sân và gọi đồ FNB'));
    });

    it('Từ chối voucher không tồn tại', async () => {
      const res = await request(app)
        .post('/api/vouchers/validate')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          code: 'NOTEXISTINGCODE',
          lobbyId: 'lob-01',
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'INVALID_VOUCHER');
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

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.grandTotal, 215000);
      assert.strictEqual(res.body.data.bills.length, 4);

      const bills = res.body.data.bills;
      const totalWithDeposit = bills.reduce(
        (acc, b) => acc + b.total + b.deposit_offset,
        0
      );
      assert.strictEqual(totalWithDeposit, 215000);

      const getRes = await request(app)
        .get('/api/lobbies/lob-01/bills')
        .set('Authorization', `Bearer ${memberToken}`);

      assert.strictEqual(getRes.status, 200);
      assert.strictEqual(getRes.body.data.length, 4);
      assert.ok(getRes.body.data[0].vietqr_url.includes('img.vietqr.io'));
    });

    it('Member thường không được quyền kích hoạt chia bill (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .post('/api/lobbies/lob-01/split')
        .set('Authorization', `Bearer ${memberToken}`)
        .send();

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error, 'FORBIDDEN');
    });
  });
});
