import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/prisma.js';
import { signJwt } from '../src/utils/jwt.js';
import { resetTestData } from './fixtures.js';

const host = signJwt({ userId: 'usr-host-01', role: 'HOST' });
const member = signJwt({ userId: 'usr-mem-02', role: 'MEMBER' });
const otherHost = signJwt({ userId: 'usr-mem-02', role: 'HOST' });
const post = (path, token = host) => request(app).post(`/api${path}`).set('Authorization', `Bearer ${token}`);
const cancel = (token) => post('/lobbies/lob-01/cancel', token);
const webhook = (id) => post('/payments/webhook-mock').send({ splitBillId: id });
const lobby = () => prisma.groupLobby.findUniqueOrThrow({ where: { id: 'lob-01' } });
const transactions = () => prisma.escrowTransaction.findMany({ where: { lobby_id: 'lob-01' } });

beforeEach(resetTestData);

async function billIds() {
  await post('/lobbies/lob-01/split').expect(200);
  return (await prisma.splitBill.findMany({ where: { lobby_id: 'lob-01' } })).map(({ id }) => id);
}

test('only the owning HOST can cancel', async () => {
  await cancel(member).expect(403);
  await cancel(otherHost).expect(403);
  assert.equal((await lobby()).status, 'OPEN');
});

test('cancellation refunds held payments once and rejects a late webhook', async () => {
  const [paid, pending] = await billIds();
  await webhook(paid).expect(200);
  await cancel().expect(200);
  await cancel().expect(409);
  await webhook(pending).expect(409);
  await webhook(paid).expect(409);
  const cancelled = await lobby();
  assert.equal(cancelled.status, 'CANCELLED');
  assert.equal(cancelled.fnb_provider_id, null);
  assert.equal(await prisma.cartItem.count({ where: { lobby_id: cancelled.id } }), 0);
  assert.equal((await prisma.slot.findUniqueOrThrow({ where: { id: cancelled.slot_id } })).status, 'AVAILABLE');
  assert.deepEqual((await transactions()).map(({ type, status }) => [type, status]), [['HOLD', 'REFUNDED']]);
  assert.equal((await prisma.splitBill.findUniqueOrThrow({ where: { id: paid } })).status, 'REFUNDED');
});

test('cancel rolls back all changes if its audit insert fails', async () => {
  const [paid] = await billIds();
  await webhook(paid).expect(200);
  const before = await lobby();
  await prisma.$executeRaw`ALTER TABLE audit_logs ADD CONSTRAINT test_cancel_rollback CHECK (action <> 'LOBBY_CANCEL')`;
  try {
    await cancel().expect(500);
    assert.deepEqual(await lobby(), before);
    assert.equal((await transactions())[0].status, 'HELD');
    assert.ok(await prisma.cartItem.count({ where: { lobby_id: before.id } }));
  } finally {
    await prisma.$executeRaw`ALTER TABLE audit_logs DROP CONSTRAINT test_cancel_rollback`;
  }
});

test('cancellation wins or refunds a concurrent payment, with no held balance left', async () => {
  const [id] = await billIds();
  const [cancelled, paid] = await Promise.all([cancel(), webhook(id)]);
  assert.equal(cancelled.status, 200);
  assert.ok([200, 409].includes(paid.status));
  assert.equal((await lobby()).status, 'CANCELLED');
  assert.ok((await transactions()).every(({ status }) => status === 'REFUNDED'));
});

test('cancellation and release cannot both succeed on a paid lobby', async () => {
  for (const id of await billIds()) await webhook(id).expect(200);
  const [cancelled, released] = await Promise.all([cancel(), post('/lobbies/lob-01/checkin').send({})]);
  assert.deepEqual([cancelled.status, released.status].sort(), [200, 409]);
  const rows = await transactions();
  assert.equal(rows.some(({ type }) => type === 'RELEASE'), released.status === 200);
  assert.equal(rows.some(({ status }) => status === 'REFUNDED'), cancelled.status === 200);
});

test('cannot cancel a completed lobby', async () => {
  const result = await post('/lobbies/SYNC00/cancel');
  assert.equal(result.status, 409);
});
