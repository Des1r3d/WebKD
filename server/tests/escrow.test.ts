import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Role, SlotStatus, LobbyStatus, EscrowStatus } from '@prisma/client';
import { app } from '../src/app';
import { prisma } from '../src/prisma';
import { seed } from '../prisma/seed';
import { signJwt } from '../src/utils/jwt';

describe('Khối 5 — Escrow, Check-in, Webhook & Idempotency (BR-ESC-01..03, BR-REP-02..03)', () => {
  let hostToken: string;
  let memberToken: string;
  let adminToken: string;

  beforeEach(async () => {
    await seed({ silent: true, fast: true });
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
      expect(bills.length).toBe(4);

      const hostBill = bills.find((b) => b.user_id === 'usr-host-01')!;
      const res = await request(app)
        .post('/api/payments/webhook-mock')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ splitBillId: hostBill.id })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.splitBill.status).toBe('PAID');
      expect(res.body.data.escrowHoldTx.status).toBe(EscrowStatus.HELD);
      expect(res.body.data.escrowHoldTx.idempotency_key).toBe(`hold:lob-01:${hostBill.id}`);
      expect(res.body.data.allPaid).toBe(false);

      const escrowRes = await request(app)
        .get('/api/escrow/lob-01')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(escrowRes.body.data.summary.held).toBeGreaterThan(0);
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
      expect(lobby?.status).toBe(LobbyStatus.PAID);

      const slot = await prisma.slot.findUnique({ where: { id: 'slt-03' } });
      expect(slot?.status).toBe(SlotStatus.BOOKED);
    });
  });

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

      expect(res.body.success).toBe(true);
      const txs = res.body.data.releasedTransactions;
      expect(txs.length).toBe(2);

      const venueTx = txs.find((t: any) => t.payee_provider_id === 'prv-venue-01');
      expect(venueTx).toBeDefined();
      expect(venueTx.amount).toBe(120000);
      expect(venueTx.platform_fee).toBe(9600);
      expect(venueTx.net_amount).toBe(110400);
      expect(venueTx.status).toBe(EscrowStatus.RELEASED);
      expect(venueTx.idempotency_key).toBe('release:lob-01:prv-venue-01');

      const fnbTx = txs.find((t: any) => t.payee_provider_id === 'prv-fnb-01');
      expect(fnbTx).toBeDefined();
      expect(fnbTx.amount).toBe(95000);
      expect(fnbTx.platform_fee).toBe(11400);
      expect(fnbTx.net_amount).toBe(83600);
      expect(fnbTx.status).toBe(EscrowStatus.RELEASED);
      expect(fnbTx.idempotency_key).toBe('release:lob-01:prv-fnb-01');

      const lobby = await prisma.groupLobby.findUnique({ where: { id: 'lob-01' } });
      expect(lobby?.status).toBe(LobbyStatus.COMPLETED);
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

      expect(duplicateRes.body.error).toBe('IDEMPOTENCY_DUPLICATE_RELEASE');
      expect(duplicateRes.body.message).toContain('BR-ESC-03');

      const venueReleaseCount = await prisma.escrowTransaction.count({
        where: { idempotency_key: 'release:lob-01:prv-venue-01' },
      });
      expect(venueReleaseCount).toBe(1);
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
      const userBBefore = (await prisma.user.findUnique({ where: { id: 'usr-mem-02' } }))!
        .reputation_score;

      await request(app)
        .post('/api/lobbies/lob-01/checkin')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          members: [{ userId: 'usr-mem-02', status: 'CHECKED_IN' }],
        })
        .expect(200);

      const userBAfter = (await prisma.user.findUnique({ where: { id: 'usr-mem-02' } }))!
        .reputation_score;
      expect(userBAfter).toBe(userBBefore + 2);
    });

    it('NO_SHOW (Bùng kèo): trừ 15 điểm uy tín và tịch thu tiền cọc PENALTY cho chủ sân', async () => {
      const userCBefore = (await prisma.user.findUnique({ where: { id: 'usr-mem-03' } }))!
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

      const userC = (await prisma.user.findUnique({ where: { id: 'usr-mem-03' } }))!;
      expect(userC.reputation_score).toBe(userCBefore - 15);
      expect(userC.status).toBe('FLAGGED');

      const penaltyTx = await prisma.escrowTransaction.findUnique({
        where: { idempotency_key: 'penalty:lob-01:usr-mem-03' },
      });
      expect(penaltyTx).toBeDefined();
      expect(penaltyTx?.amount).toBe(30000);
      expect(penaltyTx?.type).toBe('PENALTY');
      expect(penaltyTx?.payee_provider_id).toBe('prv-venue-01');
    });
  });
});
