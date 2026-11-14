import { EventEmitter } from 'node:events';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { setupLobbySocket } from '../src/sockets/lobby.socket.js';
import { resetTestData } from './fixtures.js';

before(resetTestData);

test('chat replays only the latest 50 messages in order, separately for each lobby', async () => {
  const handlers = new Map();
  const broadcasts = [];
  setupLobbySocket({
    on(event, connect) {
      assert.equal(event, 'connection');
      connect({ on: (name, handler) => handlers.set(name, handler) });
    },
    to(room) {
      return { emit: (event, payload) => broadcasts.push({ room, event, payload }) };
    },
  });
  const send = (lobbyId, text) => handlers.get('chat:send')({
    lobbyId, text, userId: 'usr-host-01',
  });
  for (let index = 1; index <= 55; index++) {
    await send('SYNC01', `Tin ${index}`);
    if (index <= 2) await send('SYNC00', `Phòng khác ${index}`);
  }

  async function rejoin(lobbyId) {
    const socket = new EventEmitter();
    const received = [];
    socket.join = () => {};
    socket.on('chat:message', (message) => received.push(message));
    setupLobbySocket({ on: (_event, connect) => connect(socket) });
    await socket.listeners('lobby:join')[0]({ lobbyId });
    return received;
  }

  const main = await rejoin('lob-01');
  const other = await rejoin('SYNC00');
  assert.deepEqual(main.map(({ text }) => text), Array.from({ length: 50 }, (_, i) => `Tin ${i + 6}`));
  assert.deepEqual(other.map(({ text }) => text), ['Phòng khác 1', 'Phòng khác 2']);
  assert.deepEqual(main, broadcasts.filter(({ room }) => room === 'lobby:lob-01').slice(-50).map(({ payload }) => payload));
  assert.deepEqual(Object.keys(main[0]).sort(), ['createdAt', 'fullName', 'id', 'text', 'userId']);
});
