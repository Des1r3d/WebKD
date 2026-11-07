import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { store } from '../src/data/store';
import { signJwt } from '../src/utils/jwt';
import { Role, SlotStatus, LobbyStatus, LobbyMemberStatus, EscrowStatus } from '@prisma/client';

describe('Khối 5 — Escrow, Check-in, Webhook & Idempotency (BR-ESC-01..03, BR-REP-02..03)', () => {
  let hostToken: string;
  let memberToken: string;
  let adminToken: string;

  beforeEach(() => {
    store.reset();
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
      // 1. Chốt chia bill cho phòng lob-01 trước
      await request(app)
        .post('/api/lobbies/lob-01/split')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      const bills = store.getSplitBillsByLobbyId('lob-01');
      expect(bills.length).toBe(4);

      // 2. Giả lập webhook nhận tiền cho bill của Host
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

      // Kiểm tra GET /api/escrow/lob-01
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

      const bills = store.getSplitBillsByLobbyId('lob-01');

      for (const b of bills) {
        await request(app)
          .post('/api/payments/webhook-mock')
          .set('Authorization', `Bearer ${hostToken}`)
          .send({ splitBillId: b.id })
          .expect(200);
      }

      const lobby = store.getLobbyById('lob-01');
      expect(lobby?.status).toBe(LobbyStatus.PAID);

      const slot = store.getSlotById('slt-03');
      expect(slot?.status).toBe(SlotStatus.BOOKED);
    });
  });

  describe('2. Check-in & Giải Ngân Đa Bên (BR-ESC-02 & BR-ESC-03 Gate)', () => {
    beforeEach(async () => {
      // Chuẩn bị phòng lob-01 đã split và toàn bộ bill đã thanh toán
      await request(app)
        .post('/api/lobbies/lob-01/split')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      const bills = store.getSplitBillsByLobbyId('lob-01');
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

      // VENUE: Sân 120k -> Phí 8% = 9.600đ, Net = 110.400đ
      const venueTx = txs.find((t: any) => t.payee_provider_id === 'prv-venue-01');
      expect(venueTx).toBeDefined();
      expect(venueTx.amount).toBe(120000);
      expect(venueTx.platform_fee).toBe(9600);
      expect(venueTx.net_amount).toBe(110400);
      expect(venueTx.status).toBe(EscrowStatus.RELEASED);
      expect(venueTx.idempotency_key).toBe('release:lob-01:prv-venue-01');

      // FNB: Food 100k + Ship 15k - Voucher 20k = 95k -> Phí 12% = 11.400đ, Net = 83.600đ
      const fnbTx = txs.find((t: any) => t.payee_provider_id === 'prv-fnb-01');
      expect(fnbTx).toBeDefined();
      expect(fnbTx.amount).toBe(95000);
      expect(fnbTx.platform_fee).toBe(11400);
      expect(fnbTx.net_amount).toBe(83600);
      expect(fnbTx.status).toBe(EscrowStatus.RELEASED);
      expect(fnbTx.idempotency_key).toBe('release:lob-01:prv-fnb-01');

      // Phòng hoàn thành COMPLETED
      const lobby = store.getLobbyById('lob-01');
      expect(lobby?.status).toBe(LobbyStatus.COMPLETED);
    });

    it('GATE BẮT BUỘC (BR-ESC-03): Gọi giải ngân lần 2 bị chặn với HTTP 409 IDEMPOTENCY_DUPLICATE_RELEASE', async () => {
      // Lần 1: Thành công
      await request(app)
        .post('/api/lobbies/lob-01/checkin')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({})
        .expect(200);

      // Lần 2: Bị chặn tuyệt đối!
      const duplicateRes = await request(app)
        .post('/api/lobbies/lob-01/checkin')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({})
        .expect(409);

      expect(duplicateRes.body.error).toBe('IDEMPOTENCY_DUPLICATE_RELEASE');
      expect(duplicateRes.body.message).toContain('BR-ESC-03');
    });
  });

  describe('3. Đánh Giá Uy Tín Check-in & Bùng Kèo (BR-REP-02, BR-REP-03)', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/lobbies/lob-01/split')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      const bills = store.getSplitBillsByLobbyId('lob-01');
      for (const b of bills) {
        await request(app)
          .post('/api/payments/webhook-mock')
          .set('Authorization', `Bearer ${hostToken}`)
          .send({ splitBillId: b.id });
      }
    });

    it('CHECKED_IN: cộng +2 điểm uy tín (tối đa 100đ)', async () => {
      const userBBefore = store.getUserById('usr-mem-02')!.reputation_score; // 82đ

      const res = await request(app)
        .post('/api/lobbies/lob-01/checkin')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          members: [{ userId: 'usr-mem-02', status: 'CHECKED_IN' }],
        })
        .expect(200);

      const userBAfter = store.getUserById('usr-mem-02')!.reputation_score;
      expect(userBAfter).toBe(userBBefore + 2); // 84đ
    });

    it('NO_SHOW (Bùng kèo): trừ 15 điểm uy tín và tịch thu tiền cọc PENALTY cho chủ sân', async () => {
      // usr-mem-03 (Linh C, 64đ, đã đóng cọc 30.000đ)
      const userCBefore = store.getUserById('usr-mem-03')!.reputation_score; // 64đ

      const res = await request(app)
        .post('/api/lobbies/lob-01/checkin')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          members: [
            { userId: 'usr-host-01', status: 'CHECKED_IN' },
            { userId: 'usr-mem-03', status: 'NO_SHOW' },
          ],
        })
        .expect(200);

      const userCAfter = store.getUserById('usr-mem-03')!.reputation_score;
      expect(userCAfter).toBe(userCBefore - 15); // 64 - 15 = 49đ -> dưới 50đ!

      // Dưới 50đ -> tự động chuyển sang FLAGGED
      const userC = store.getUserById('usr-mem-03')!;
      expect(userC.status).toBe('FLAGGED');

      // Tịch thu cọc 30k -> Escrow PENALTY cho sân
      const penaltyTx = store.getEscrowTransactionByIdempotencyKey('penalty:lob-01:usr-mem-03');
      expect(penaltyTx).toBeDefined();
      expect(penaltyTx?.amount).toBe(30000);
      expect(penaltyTx?.type).toBe('PENALTY');
      expect(penaltyTx?.payee_provider_id).toBe('prv-venue-01');
    });
  });
});
