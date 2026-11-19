import { EventEmitter } from 'node:events';
import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/prisma.js';
import { setupLobbySocket } from '../src/sockets/lobby.socket.js';
import { signJwt } from '../src/utils/jwt.js';
import { resetTestData } from './fixtures.js';

describe('Lobby access, idempotent join, realtime members & slot release guard', () => {
  const hostToken = signJwt({ userId: 'usr-host-01', email: 'nguyen.minh.phat@synchub.vn', role: 'HOST' });
  const memberToken = signJwt({ userId: 'usr-mem-02', email: 'khuong.thao.vy@synchub.vn', role: 'MEMBER' });
  const outsiderToken = signJwt({ userId: 'usr-dat-01', email: 'dat.dt@synchub.vn', role: 'HOST' });

  beforeEach(resetTestData);

  it('POST /api/lobbies/:id/join is idempotent for already-joined HOST and MEMBER', async () => {
    const hostJoin = await request(app)
      .post('/api/lobbies/SYNC01/join')
      .set('Authorization', `Bearer ${hostToken}`)
      .expect(200);
    assert.equal(hostJoin.body.data.depositRequired, 0);
    assert.equal(hostJoin.body.data.depositPaid, 0);

    const memberJoin = await request(app)
      .post('/api/lobbies/SYNC01/join')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    assert.equal(memberJoin.body.data.depositRequired, 9000);
    assert.equal(memberJoin.body.data.depositPaid, 9000);
  });

  it('handleJoinLobby and handleLeaveLobby broadcast lobby:members to room', async () => {
    const prevIo = app.get('io');
    const emitted = [];
    app.set('io', {
      to(room) {
        return { emit: (event, payload) => emitted.push({ room, event, payload }) };
      },
    });
    try {
      await request(app)
        .post('/api/lobbies/SYNC01/join')
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(200);
      await request(app)
        .post('/api/lobbies/SYNC01/leave')
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(200);
    } finally {
      app.set('io', prevIo);
    }

    assert.equal(emitted.length, 2);
    assert.equal(emitted[0].room, 'lobby:lob-01');
    assert.equal(emitted[0].event, 'lobby:members');
    assert.equal(emitted[0].payload.members.find((m) => m.user_id === 'usr-dat-01')?.status, 'JOINED');
    assert.equal(emitted[1].room, 'lobby:lob-01');
    assert.equal(emitted[1].event, 'lobby:members');
    assert.equal(emitted[1].payload.members.find((m) => m.user_id === 'usr-dat-01')?.status, 'LEFT');
  });

  it('REST cart endpoint blocks non-members (403 NOT_A_MEMBER) and allows joined members', async () => {
    const blocked = await request(app)
      .post('/api/lobbies/SYNC01/cart')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ menuItemId: 'mnu-04', qty: 1 })
      .expect(403);
    assert.equal(blocked.body.error, 'NOT_A_MEMBER');

    const allowed = await request(app)
      .post('/api/lobbies/SYNC01/cart')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ menuItemId: 'mnu-04', qty: 1 })
      .expect(201);
    assert.equal(allowed.body.success, true);
  });

  it('Socket cart:add and chat:send enforce active membership via socket.data.user', async () => {
    const broadcasts = [];
    const connectSocket = (userId) => {
      const socket = new EventEmitter();
      const notices = [];
      socket.data = { user: { userId } };
      socket.join = () => {};
      socket.emit = (event, payload) => notices.push({ event, payload });
      setupLobbySocket({
        on: (_event, connect) => connect(socket),
        to: (room) => ({ emit: (event, payload) => broadcasts.push({ room, event, payload }) }),
      });
      return { socket, notices };
    };

    const outsider = connectSocket('usr-dat-01');
    await outsider.socket.listeners('cart:add')[0]({ lobbyId: 'SYNC01', menuItemId: 'mnu-04', qty: 1 });
    await outsider.socket.listeners('chat:send')[0]({ lobbyId: 'SYNC01', text: 'Xin vào ké' });
    assert.equal(outsider.notices.length, 2);
    assert.ok(outsider.notices.every((n) => n.event === 'notify' && n.payload.type === 'ERROR'));
    assert.equal(broadcasts.length, 0);

    const member = connectSocket('usr-mem-02');
    await member.socket.listeners('cart:add')[0]({ lobbyId: 'SYNC01', menuItemId: 'mnu-04', qty: 1 });
    await member.socket.listeners('chat:send')[0]({ lobbyId: 'SYNC01', text: 'Mình đặt trà sữa nhé' });
    assert.equal(member.notices.length, 0);
    assert.equal(broadcasts.some((b) => b.room === 'lobby:lob-01' && b.event === 'cart:updated'), true);
    assert.equal(
      broadcasts.some((b) => b.room === 'lobby:lob-01' && b.event === 'chat:message' && b.payload.userId === 'usr-mem-02'),
      true
    );

    const added = await prisma.cartItem.findFirst({ where: { lobby_id: 'lob-01', user_id: 'usr-mem-02', menu_item_id: 'mnu-04' } });
    assert.ok(added);
  });

  it('POST /api/slots/:id/release rejects slot attached to an active lobby', async () => {
    await request(app)
      .post('/api/slots/slt-04/lock')
      .set('Authorization', `Bearer ${hostToken}`)
      .expect(200);
    await request(app)
      .post('/api/lobbies')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ slotId: 'slt-04' })
      .expect(201);

    const res = await request(app)
      .post('/api/slots/slt-04/release')
      .set('Authorization', `Bearer ${hostToken}`)
      .expect(400);
    assert.equal(res.body.error, 'SLOT_HAS_LOBBY');
  });
});
