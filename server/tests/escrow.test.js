import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { Role, SlotStatus, LobbyStatus, EscrowStatus } from '@prisma/client';
import { app } from '../src/app.js';
import { prisma } from '../src/prisma.js';
import { resetTestData } from './fixtures.js';
import { signJwt } from '../src/utils/jwt.js';

describe('Khối 5 — Escrow, Check-in, Webhook & Idempotency (BR-ESC-01..03, BR-REP-02..03)', () => {
  let hostToken;
  let memberToken;
  let adminToken;

  beforeEach(async () => {
    await resetTestData();
    hostToken = signJwt({
      userId: 'usr-host-01',
      email: 'dat.dt@synchub.vn',
      role: Role.HOST,
    });
    memberToken = signJwt({
      userId: 'usr-mem-02',
      email: 'minh.b@synchub.vn',
      role: Role.MEMBER,
    });
    adminToken = signJwt({
      userId: 'usr-adm-01',
      email: 'admin@synchub.vn',
      role: Role.ADMIN,
    });
  });

  describe('1. Webhook Giả Lập & Giữ Tiền Escrow (BR-ESC-01)', () => {
    it('thanh toán split bill -> cập nhật PAID và tạo Escrow HELD với idempotency key', async () => {
      await request(app)
        .post('/api/lobbies/lob-01/split')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      const bills = await prisma.splitBill.findMany({ where: { lobby_id: 'lob-01' } });
      assert.strictEqual(bills.length, 4);

      const hostBill = bills.find((b) => b.user_id === 'usr-host-01');
      const res = await request(app)
        .post('/api/payments/webhook-mock')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ splitBillId: hostBill.id })
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.splitBill.status, 'PAID');
      assert.strictEqual(res.body.data.escrowHoldTx.status, EscrowStatus.HELD);
      assert.strictEqual(res.body.data.escrowHoldTx.idempotency_key, `hold:lob-01:${hostBill.id}`);
      assert.strictEqual(res.body.data.allPaid, false);

      const escrowRes = await request(app)
        .get('/api/escrow/lob-01')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      assert.ok(escrowRes.body.data.summary.held > 0);
    });

    it('khi tất cả các thành viên đều thanh toán -> phòng chuyển sang PAID, slot thành BOOKED', async () => {
      await request(app)
        .post('/api/lobbies/lob-01/split')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      const bills = await prisma.splitBill.findMany({ where: { lobby_id: 'lob-01' } });

      for (const b of bills) {
        await request(app)
          .post('/api/payments/webhook-mock')
          .set('Authorization', `Bearer ${hostToken}`)
          .send({ splitBillId: b.id })
          .expect(200);
      }

      const lobby = await prisma.groupLobby.findUnique({ where: { id: 'lob-01' } });
      assert.strictEqual(lobby?.status, LobbyStatus.PAID);

      const slot = await prisma.slot.findUnique({ where: { id: 'slt-03' } });
      assert.strictEqual(slot?.status, SlotStatus.BOOKED);
    });
  });

  for (const [voucherId, venue, fnb] of [
    ['vch-venue-10', 108000, 115000],
    ['vch-cross-15', 102000, 115000],
  ]) {
    it(`releases the amounts locked into the split for ${voucherId}`, async () => {
      await prisma.groupLobby.update({ where: { id: 'lob-01' }, data: { voucher_id: voucherId } });
      const post = path => request(app).post(`/api${path}`).set('Authorization', `Bearer ${hostToken}`);
      await post('/lobbies/lob-01/split').expect(200);
      const bills = await prisma.splitBill.findMany({ where: { lobby_id: 'lob-01' } });
      for (const bill of bills) await post('/payments/webhook-mock').send({ splitBillId: bill.id }).expect(200);
      await prisma.voucher.update({ where: { id: voucherId }, data: { value: 1 } });
      const release = await post('/lobbies/lob-01/checkin').send({}).expect(200);
      assert.deepEqual(release.body.data.releasedTransactions.map(row => row.amount), [venue, fnb]);
    });
  }

  describe('2. Check-in & Giải Ngân Đa Bên (BR-ESC-02 & BR-ESC-03 Gate)', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/lobbies/lob-01/split')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      const bills = await prisma.splitBill.findMany({ where: { lobby_id: 'lob-01' } });
      for (const b of bills) {
        await request(app)
          .post('/api/payments/webhook-mock')
          .set('Authorization', `Bearer ${hostToken}`)
          .send({ splitBillId: b.id });
      }
    });

    it('giải ngân tách VENUE (8% hoa hồng) và FNB (12% hoa hồng) chính xác', async () => {
      const res = await request(app)
        .post('/api/lobbies/lob-01/checkin')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          members: [
            { userId: 'usr-host-01', status: 'CHECKED_IN' },
            { userId: 'usr-mem-02', status: 'CHECKED_IN' },
            { userId: 'usr-mem-03', status: 'CHECKED_IN' },
            { userId: 'usr-mem-04', status: 'CHECKED_IN' },
          ],
        })
        .expect(200);

      assert.strictEqual(res.body.success, true);
      const txs = res.body.data.releasedTransactions;
      assert.strictEqual(txs.length, 2);

      const venueTx = txs.find((t) => t.payee_provider_id === 'prv-venue-01');
      assert.notStrictEqual(venueTx, undefined);
      assert.strictEqual(venueTx.amount, 120000);
      assert.strictEqual(venueTx.platform_fee, 9600);
      assert.strictEqual(venueTx.net_amount, 110400);
      assert.strictEqual(venueTx.status, EscrowStatus.RELEASED);
      assert.strictEqual(venueTx.idempotency_key, 'release:lob-01:prv-venue-01');

      const fnbTx = txs.find((t) => t.payee_provider_id === 'prv-fnb-01');
      assert.notStrictEqual(fnbTx, undefined);
      assert.strictEqual(fnbTx.amount, 95000);
      assert.strictEqual(fnbTx.platform_fee, 11400);
      assert.strictEqual(fnbTx.net_amount, 83600);
      assert.strictEqual(fnbTx.status, EscrowStatus.RELEASED);
      assert.strictEqual(fnbTx.idempotency_key, 'release:lob-01:prv-fnb-01');

      const lobby = await prisma.groupLobby.findUnique({ where: { id: 'lob-01' } });
      assert.strictEqual(lobby?.status, LobbyStatus.COMPLETED);
    });

    it('GATE BẮT BUỘC (BR-ESC-03): Gọi giải ngân lần 2 bị chặn với HTTP 409 IDEMPOTENCY_DUPLICATE_RELEASE và DB chỉ có 1 giao dịch', async () => {
      await request(app)
        .post('/api/lobbies/lob-01/checkin')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({})
        .expect(200);

      const duplicateRes = await request(app)
        .post('/api/lobbies/lob-01/checkin')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({})
        .expect(409);

      assert.strictEqual(duplicateRes.body.error, 'IDEMPOTENCY_DUPLICATE_RELEASE');
      assert.ok(duplicateRes.body.message.includes('BR-ESC-03'));

      const venueReleaseCount = await prisma.escrowTransaction.count({
        where: { idempotency_key: 'release:lob-01:prv-venue-01' },
      });
      assert.strictEqual(venueReleaseCount, 1);
    });
  });

  describe('3. Đánh Giá Uy Tín Check-in & Bùng Kèo (BR-REP-02, BR-REP-03)', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/lobbies/lob-01/split')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      const bills = await prisma.splitBill.findMany({ where: { lobby_id: 'lob-01' } });
      for (const b of bills) {
        await request(app)
          .post('/api/payments/webhook-mock')
          .set('Authorization', `Bearer ${hostToken}`)
          .send({ splitBillId: b.id });
      }
    });

    it('CHECKED_IN: cộng +2 điểm uy tín (tối đa 100đ)', async () => {
      const userBBefore = (await prisma.user.findUnique({ where: { id: 'usr-mem-02' } }))
        .reputation_score;

      await request(app)
        .post('/api/lobbies/lob-01/checkin')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          members: [{ userId: 'usr-mem-02', status: 'CHECKED_IN' }],
        })
        .expect(200);

      const userBAfter = (await prisma.user.findUnique({ where: { id: 'usr-mem-02' } }))
        .reputation_score;
      assert.strictEqual(userBAfter, userBBefore + 2);
    });

    it('NO_SHOW (Bùng kèo): trừ 15 điểm uy tín và tịch thu tiền cọc PENALTY cho chủ sân', async () => {
      const userCBefore = (await prisma.user.findUnique({ where: { id: 'usr-mem-03' } }))
        .reputation_score;

      await request(app)
        .post('/api/lobbies/lob-01/checkin')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          members: [
            { userId: 'usr-host-01', status: 'CHECKED_IN' },
            { userId: 'usr-mem-03', status: 'NO_SHOW' },
          ],
        })
        .expect(200);

      const userC = (await prisma.user.findUnique({ where: { id: 'usr-mem-03' } }));
      assert.strictEqual(userC.reputation_score, userCBefore - 15);
      assert.strictEqual(userC.status, 'FLAGGED');

      const penaltyTx = await prisma.escrowTransaction.findUnique({
        where: { idempotency_key: 'penalty:lob-01:usr-mem-03' },
      });
      assert.notStrictEqual(penaltyTx, undefined);
      assert.strictEqual(penaltyTx?.amount, 30000);
      assert.strictEqual(penaltyTx?.type, 'PENALTY');
      assert.strictEqual(penaltyTx?.payee_provider_id, 'prv-venue-01');
    });
  });
});
