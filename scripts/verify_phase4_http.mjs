import assert from 'node:assert/strict';
const base = (process.env.SYNCHUB_BASE_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');
async function check(path, status, type, options = {}) {
  const res = await fetch(base + path, options);
  assert.equal(res.status, status, path);
  assert.ok(res.headers.get('content-type')?.includes(type), path);
  console.log('PASS', res.status, path);
  return res;
}
const html = { headers: { Accept: 'text/html' } };
assert.equal((await (await check('/api/health', 200, 'json')).json()).status, 'ok');
assert.deepEqual(await (await check('/api/missing', 404, 'json', html)).json(),
  { error: 'NOT_FOUND', message: 'Endpoint không tồn tại' });
for (const path of ['/venues/prv-venue-01', '/lobby/SYNC01/split', '/provider/verify', '/unknown-route']) {
  assert.match(await (await check(path, 200, 'text/html', html)).text(), /src="\/assets\/app.js"/);
}
for (const path of ['/assets/missing', '/images/missing', '/uploads/missing', '/missing.css', '/.env', '/server/src/index.js', '/node_modules/express/package.json']) {
  await check(path, 404, 'json', html);
}
for (const asset of ['app.js', 'pages.js', 'components.js']) await check('/assets/' + asset, 200, 'javascript');
for (const asset of ['styles.css', 'tokens.css', 'phase3.css', 'leaflet/leaflet.css']) await check('/assets/' + asset, 200, 'text/css');
for (const asset of ['marker-icon.png', 'marker-icon-2x.png', 'marker-shadow.png', 'layers.png', 'layers-2x.png']) {
  await check('/assets/leaflet/images/' + asset, 200, 'image/png');
}
for (const asset of ['favicon.svg', 'icons.svg', 'lobby-icons.svg']) await check('/' + asset, 200, 'image/svg+xml');
await check('/images/badminton.jpg', 200, 'image/jpeg');
await check('/socket.io/socket.io.esm.min.js', 200, 'javascript');
const polling = await check('/socket.io/?EIO=4&transport=polling', 200, 'text/plain');
assert.ok(JSON.parse((await polling.text()).slice(1)).upgrades.includes('websocket'));
