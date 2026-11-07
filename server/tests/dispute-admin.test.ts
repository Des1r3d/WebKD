import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Role, DisputeStatus, EscrowStatus, UserStatus } from '@prisma/client';
import { app } from '../src/app';
import { prisma } from '../src/prisma';
import { seed } from '../prisma/seed';
import { signJwt } from '../src/utils/jwt';

describe('Khối 5 — Khiếu nại (BR-ESC-04), Phân xử Admin (BR-DSP-01) & Portals (WBS-5.2..5.3)', () => {
  let hostToken: string;
  let memberToken: string;
  let adminToken: string;
  let providerToken: string;

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

      expect(disputeRes.body.success).toBe(true);
      expect(disputeRes.body.data.dispute.status).toBe(DisputeStatus.OPEN);

      const fnbTx = await prisma.escrowTransaction.findUnique({
        where: { idempotency_key: 'release:lob-01:prv-fnb-01' },
      });
      expect(fnbTx?.status).toBe(EscrowStatus.FROZEN);

      const venueTx = await prisma.escrowTransaction.findUnique({
        where: { idempotency_key: 'release:lob-01:prv-venue-01' },
      });
      expect(venueTx?.status).toBe(EscrowStatus.RELEASED);

      const lobby = await prisma.groupLobby.findUnique({ where: { id: 'lob-01' } });
      expect(lobby?.status).toBe('DISPUTED');
    });
  });

  describe('2. Phân xử Khiếu nại Admin (BR-DSP-01)', () => {
    let disputeId: string;

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

      expect(resolveRes.body.success).toBe(true);
      expect(resolveRes.body.data.dispute.status).toBe(DisputeStatus.RESOLVED);
      expect(resolveRes.body.data.dispute.resolved_by).toBe('usr-adm-01');

      const refundTx = await prisma.escrowTransaction.findUnique({
        where: { idempotency_key: `refund:lob-01:${disputeId}` },
      });
      expect(refundTx).toBeDefined();
      expect(refundTx?.amount).toBe(25000);
      expect(refundTx?.status).toBe(EscrowStatus.REFUNDED);

      const fnbTx = await prisma.escrowTransaction.findUnique({
        where: { idempotency_key: 'release:lob-01:prv-fnb-01' },
      });
      expect(fnbTx?.status).toBe(EscrowStatus.RELEASED);
      expect(fnbTx?.net_amount).toBe(83600 - 25000);

      const auditLogs = await prisma.auditLog.findMany({
        where: { entity: 'disputes', entity_id: disputeId, action: 'DISPUTE_RESOLVE' },
      });
      expect(auditLogs.length).toBeGreaterThan(0);
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

      expect(slotRes.body.success).toBe(true);
      expect(slotRes.body.data.price).toBe(130000);

      const menuRes = await request(app)
        .post('/api/providers/prv-fnb-01/menu')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          name: 'Trà Sữa Khoai Môn Size L',
          price: 36000,
        })
        .expect(201);

      expect(menuRes.body.success).toBe(true);
      expect(menuRes.body.data.name).toBe('Trà Sữa Khoai Môn Size L');
    });

    it('GET /api/providers/:id/stats trả về số liệu doanh thu và slot thực tế', async () => {
      const statsRes = await request(app)
        .get('/api/providers/prv-venue-01/stats')
        .set('Authorization', `Bearer ${providerToken}`)
        .expect(200);

      expect(statsRes.body.success).toBe(true);
      expect(statsRes.body.data.slots_total).toBeGreaterThan(0);
      expect(statsRes.body.data.provider.id).toBe('prv-venue-01');
    });

    it('GET /api/admin/stats trả về GMV, danh sách FLAGGED và audit logs', async () => {
      const adminRes = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminRes.body.success).toBe(true);
      expect(adminRes.body.data.gmv_total).toBeGreaterThan(0);
      expect(adminRes.body.data.flagged_users.length).toBeGreaterThan(0);
      expect(adminRes.body.data.recent_audit_logs.length).toBeGreaterThan(0);
      expect(adminRes.body.data.daily_stats.length).toBe(7);
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

      expect(patchRes.body.success).toBe(true);
      expect(patchRes.body.data.status).toBe(UserStatus.ACTIVE);
      expect(patchRes.body.data.reputation_score).toBe(60);

      const logs = await prisma.auditLog.findMany({
        where: { entity: 'users', entity_id: 'usr-flag-05', action: 'USER_STATUS_CHANGE' },
      });
      expect(logs.length).toBeGreaterThan(0);
    });
  });
});
