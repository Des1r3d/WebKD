import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { Role, DisputeStatus, EscrowStatus, UserStatus } from '@prisma/client';
import { app } from '../src/app.js';
import { prisma } from '../src/prisma.js';
import { resetTestData } from './fixtures.js';
import { signJwt } from '../src/utils/jwt.js';

describe('Khối 5 — Khiếu nại (BR-ESC-04), Phân xử Admin (BR-DSP-01) & Portals (WBS-5.2..5.3)', () => {
  let hostToken;
  let memberToken;
  let adminToken;
  let providerToken;

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
    providerToken = signJwt({
      userId: 'usr-prv-01',
      email: 'thang.venue@synchub.vn',
      role: Role.PROVIDER,
    });
  });

  describe('1. Khiếu nại & Đóng băng Escrow từng phần (BR-ESC-04)', () => {
    it('gửi khiếu nại -> tạo dispute OPEN, đóng băng tiền Escrow của target provider và chuyển lobby sang DISPUTED', async () => {
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

      await request(app)
        .post('/api/lobbies/lob-01/checkin')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({});

      const disputeRes = await request(app)
        .post('/api/disputes')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          lobbyId: 'lob-01',
          targetProviderId: 'prv-fnb-01',
          reason: 'Quán giao thiếu 1 ly trà đào cam sả 25.000đ',
          refundAmount: 25000,
          evidenceUrls: ['https://example.com/receipt.jpg'],
        })
        .expect(201);

      assert.strictEqual(disputeRes.body.success, true);
      assert.strictEqual(disputeRes.body.data.dispute.status, DisputeStatus.OPEN);

      const fnbTx = await prisma.escrowTransaction.findUnique({
        where: { idempotency_key: 'release:lob-01:prv-fnb-01' },
      });
      assert.strictEqual(fnbTx?.status, EscrowStatus.FROZEN);

      const venueTx = await prisma.escrowTransaction.findUnique({
        where: { idempotency_key: 'release:lob-01:prv-venue-01' },
      });
      assert.strictEqual(venueTx?.status, EscrowStatus.RELEASED);

      const lobby = await prisma.groupLobby.findUnique({ where: { id: 'lob-01' } });
      assert.strictEqual(lobby?.status, 'DISPUTED');
    });
  });

  describe('2. Phân xử Khiếu nại Admin (BR-DSP-01)', () => {
    let disputeId;

    beforeEach(async () => {
      await request(app)
        .post('/api/lobbies/lob-01/split')
        .set('Authorization', `Bearer ${hostToken}`);

      const bills = await prisma.splitBill.findMany({ where: { lobby_id: 'lob-01' } });
      for (const b of bills) {
        await request(app)
          .post('/api/payments/webhook-mock')
          .set('Authorization', `Bearer ${hostToken}`)
          .send({ splitBillId: b.id });
      }

      await request(app)
        .post('/api/lobbies/lob-01/checkin')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({});

      const dispRes = await request(app)
        .post('/api/disputes')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          lobbyId: 'lob-01',
          targetProviderId: 'prv-fnb-01',
          reason: 'Quán giao thiếu 1 ly nước',
          refundAmount: 25000,
        });

      disputeId = dispRes.body.data.dispute.id;
    });

    it('Admin duyệt RESOLVED: hoàn tiền từ Escrow (REFUNDED), giải ngân phần còn lại cho quán, ghi audit log', async () => {
      const resolveRes = await request(app)
        .patch(`/api/admin/disputes/${disputeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'RESOLVED',
          refundAmount: 25000,
        })
        .expect(200);

      assert.strictEqual(resolveRes.body.success, true);
      assert.strictEqual(resolveRes.body.data.dispute.status, DisputeStatus.RESOLVED);
      assert.strictEqual(resolveRes.body.data.dispute.resolved_by, 'usr-adm-01');

      const refunds = await prisma.escrowTransaction.findMany({ where: { lobby_id: 'lob-01', type: 'REFUND' } });
      assert.ok(refunds.length > 0);
      assert.equal(refunds.reduce((sum, refund) => sum + refund.amount, 0), 25000);
      for (const refund of refunds) {
        const bill = await prisma.splitBill.findUniqueOrThrow({ where: { id: refund.split_bill_id } });
        assert.equal(refund.idempotency_key, `refund:lob-01:${bill.id}`);
        assert.equal(refund.status, EscrowStatus.REFUNDED);
        assert.ok(refund.amount > 0 && refund.amount <= bill.total);
      }

      const fnbTx = await prisma.escrowTransaction.findUnique({
        where: { idempotency_key: 'release:lob-01:prv-fnb-01' },
      });
      assert.strictEqual(fnbTx?.status, EscrowStatus.RELEASED);
      assert.strictEqual(fnbTx?.net_amount, 83600 - 25000);

      const auditLogs = await prisma.auditLog.findMany({
        where: { entity: 'disputes', entity_id: disputeId, action: 'DISPUTE_RESOLVE' },
      });
      assert.ok(auditLogs.length > 0);
    });

    const resolve = (refundAmount) => request(app)
      .patch(`/api/admin/disputes/${disputeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RESOLVED', refundAmount });

    it('commits one refund effect for concurrent and repeated decisions', async () => {
      const responses = await Promise.all([resolve(25001), resolve(25001)]);
      assert.deepEqual(responses.map(({ status }) => status).sort(), [200, 400]);
      await resolve(25001).expect(400);
      const records = await prisma.escrowTransaction.findMany({ where: { lobby_id: 'lob-01', type: 'REFUND' } });
      assert.equal(records.reduce((sum, row) => sum + row.amount, 0), 25001);
      assert.ok(records.every(row => row.split_bill_id));
      assert.equal(await prisma.auditLog.count({ where: { entity_id: disputeId, action: 'DISPUTE_RESOLVE' } }), 1);
    });

    it('rejects decisions over available frozen funds without moving money', async () => {
      await resolve(83601).expect(409);
      assert.equal((await prisma.dispute.findUniqueOrThrow({ where: { id: disputeId } })).status, 'OPEN');
      assert.equal(await prisma.escrowTransaction.count({ where: { lobby_id: 'lob-01', type: 'REFUND' } }), 0);
    });

    async function openAnotherDispute() {
      const response = await request(app)
        .post('/api/disputes')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ lobbyId: 'lob-01', targetProviderId: 'prv-fnb-01', reason: 'Thiếu một món khác' })
        .expect(201);
      disputeId = response.body.data.dispute.id;
    }

    it('uses only previously unrefunded bills for a later decision', async () => {
      const first = await resolve(1).expect(200);
      assert.equal(first.body.data.refundTxs.length, 1);
      const firstBill = first.body.data.refundTxs[0].split_bill_id;
      await openAnotherDispute();
      const second = await resolve(25000).expect(200);
      const refunds = second.body.data.refundTxs;
      assert.equal(refunds.reduce((total, row) => total + row.amount, 0), 25000);
      assert.ok(refunds.every(row => row.split_bill_id !== firstBill));
    });

    it('leaves a later decision open when all eligible bills have already been refunded', async () => {
      const first = await resolve(25000).expect(200);
      assert.equal(first.body.data.refundTxs.length, 3);
      await openAnotherDispute();
      const response = await resolve(1).expect(409);
      assert.equal(response.body.error, 'REFUND_EXCEEDS_AVAILABLE');
      assert.equal((await prisma.dispute.findUniqueOrThrow({ where: { id: disputeId } })).status, 'OPEN');
      assert.equal(await prisma.escrowTransaction.count({ where: { lobby_id: 'lob-01', type: 'REFUND' } }), 3);
    });

    it('does not create a second refund when the old dispute key exists', async () => {
      await prisma.escrowTransaction.create({ data: {
        lobby_id: 'lob-01', type: 'REFUND', amount: 25000, net_amount: 25000,
        status: 'REFUNDED', idempotency_key: `refund:lob-01:${disputeId}`,
      } });
      await resolve(25000).expect(409);
      assert.equal(await prisma.escrowTransaction.count({ where: { lobby_id: 'lob-01', type: 'REFUND' } }), 1);
      assert.equal((await prisma.dispute.findUniqueOrThrow({ where: { id: disputeId } })).status, 'OPEN');
    });

    it('người dùng thường không có quyền phân xử khiếu nại (chỉ ADMIN)', async () => {
      await request(app)
        .patch(`/api/admin/disputes/${disputeId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ status: 'RESOLVED' })
        .expect(403);
    });
  });

  describe('3. Provider Portal & Admin Dashboard (WBS-5.3)', () => {
    it('Provider có thể thêm slot mới và món mới', async () => {
      const slotRes = await request(app)
        .post('/api/providers/prv-venue-01/slots')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          startAt: '2026-11-15T18:00:00Z',
          endAt: '2026-11-15T19:00:00Z',
          price: 130000,
        })
        .expect(201);

      assert.strictEqual(slotRes.body.success, true);
      assert.strictEqual(slotRes.body.data.price, 130000);

      const menuRes = await request(app)
        .post('/api/providers/prv-fnb-01/menu')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          name: 'Trà Sữa Khoai Môn Size L',
          price: 36000,
        })
        .expect(201);

      assert.strictEqual(menuRes.body.success, true);
      assert.strictEqual(menuRes.body.data.name, 'Trà Sữa Khoai Môn Size L');
    });

    it('GET /api/providers/:id/stats trả về số liệu doanh thu và slot thực tế', async () => {
      const statsRes = await request(app)
        .get('/api/providers/prv-venue-01/stats')
        .set('Authorization', `Bearer ${providerToken}`)
        .expect(200);

      assert.strictEqual(statsRes.body.success, true);
      assert.ok(statsRes.body.data.slots_total > 0);
      assert.strictEqual(statsRes.body.data.provider.id, 'prv-venue-01');
    });

    it('GET /api/admin/stats trả về GMV, danh sách FLAGGED và audit logs', async () => {
      const adminRes = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      assert.strictEqual(adminRes.body.success, true);
      assert.ok(adminRes.body.data.gmv_total > 0);
      assert.ok(adminRes.body.data.flagged_users.length > 0);
      assert.ok(adminRes.body.data.recent_audit_logs.length > 0);
      assert.strictEqual(adminRes.body.data.daily_stats.length, 7);
    });

    it('Admin có thể cập nhật trạng thái user và tự động sinh audit_logs', async () => {
      const patchRes = await request(app)
        .patch('/api/admin/users/usr-flag-05/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: UserStatus.ACTIVE,
          reputationScore: 60,
        })
        .expect(200);

      assert.strictEqual(patchRes.body.success, true);
      assert.strictEqual(patchRes.body.data.status, UserStatus.ACTIVE);
      assert.strictEqual(patchRes.body.data.reputation_score, 60);

      const logs = await prisma.auditLog.findMany({
        where: { entity: 'users', entity_id: 'usr-flag-05', action: 'USER_STATUS_CHANGE' },
      });
      assert.ok(logs.length > 0);
    });
  });
});
