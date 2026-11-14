// Run against the original Vite/Express app and a fresh, isolated demo seed.
const { chromium } = require(process.env.BASELINE_PLAYWRIGHT || 'playwright-core');
const fs = require('node:fs/promises');
const path = require('node:path');

const baseURL = 'http://127.0.0.1:5173';
const viewports = [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }];
const cases = [
  ['home', '/'], ['discover', '/discover'], ['login', '/login'],
  ['register', '/register'], ['venue', '/venues/'],
  ['invite-public', '/join/SYNC01'], ['invite-member', '/join/SYNC01', 'member'],
  ['lobby-host', '/lobby/SYNC01', 'host'], ['lobby-member', '/lobby/SYNC01', 'member'],
  ['split-completed-error', '/lobby/SYNC00/split', 'host'], ['wallet', '/wallet', 'host'],
  ['disputes', '/disputes', 'host'], ['profile', '/profile', 'member'],
  ['provider', '/provider', 'provider'], ['provider-wildcard', '/provider/baseline', 'provider'],
  ['admin', '/admin', 'admin'], ['admin-wildcard', '/admin/baseline', 'admin'],
  ['styleguide', '/styleguide'], ['join-redirect', '/join', null, '/'],
  ['unknown-redirect', '/baseline-not-found', null, '/'],
  ['role-guard', '/admin', 'member'],
];

async function run() {
  const browser = await chromium.launch({ channel: 'msedge' });
  const fixture = await browser.newContext({ baseURL });
  const accounts = { host: 'dat.dt', member: 'minh.b', provider: 'thang.venue', admin: 'admin' };
  const tokens = {};
  const results = [];
  let fixtureTime;
  const shotRoot = path.join(__dirname, 'screenshots');
  try {
    for (const [role, account] of Object.entries(accounts)) {
      const reply = await fixture.request.post('/api/auth/login', {
        data: { email: account + '@synchub.vn', password: 'Password123!' },
      });
      if (!reply.ok()) throw Error(role + ' login HTTP ' + reply.status());
      const payload = await reply.json();
      tokens[role] = payload.data?.token ?? payload.token;
      if (!tokens[role]) throw Error(role + ' login returned no token');
    }
    const venueRes = await fixture.request.get('/api/providers?type=VENUE');
    if (!venueRes.ok()) throw Error('Venues HTTP ' + venueRes.status());
    cases.find(([name]) => name === 'venue')[1] = '/venues/' + (await venueRes.json()).data[0].id;
    fixtureTime = new Date((await (await fixture.request.get('/api/health')).json()).time);
    const open = await fixture.request.get('/api/lobbies/SYNC01', {
      headers: { Authorization: 'Bearer ' + tokens.host },
    });
    if (!open.ok()) throw Error('Lobby HTTP ' + open.status());
    const lobby = (await open.json()).data;
    const lobbyId = lobby.lobby?.id ?? lobby.id;

    for (const phase of ['open', 'lock', 'split']) {
      if (phase !== 'open') {
        const reply = await fixture.request.post('/api/lobbies/' + lobbyId + '/' + phase, {
          headers: { Authorization: 'Bearer ' + tokens.host },
        });
        if (!reply.ok()) throw Error(phase + ' HTTP ' + reply.status() + ' ' + await reply.text());
      }
      const captures = await Promise.allSettled(viewports.map(async viewport => {
        const dir = path.join(shotRoot, String(viewport.width));
        await fs.mkdir(dir, { recursive: true });
        const matrix = phase === 'lock' ? [['lobby-locked', '/lobby/SYNC01', 'member']]
          : phase === 'split' ? [['split', '/lobby/SYNC01/split', 'host', null, 'split']] : [
          ...cases,
          ['modal-open', '/styleguide', null, null, 'modal'],
          ['keyboard-focus', '/login', null, null, 'focus'],
          ['button-hover', '/login', null, null, 'hover'],
          ['loading', '/discover', null, null, 'loading'],
          ['empty', '/discover', null, null, 'empty'],
          ['error', '/discover', null, null, 'error'],
        ];
        for (const [name, route, role, redirect, state] of matrix) {
          const ctx = await browser.newContext({ baseURL, viewport, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', deviceScaleFactor: 1 });
          try {
            if (role) await ctx.addInitScript(token => localStorage.setItem('synchub.token', token), tokens[role]);
            const page = await ctx.newPage();
            const failures = new Set();
            page.on('pageerror', error => failures.add(error.message));
            page.on('requestfailed', req => {
              if (req.failure()?.errorText !== 'net::ERR_ABORTED') failures.add(new URL(req.url()).hostname + ' ' + req.failure()?.errorText);
            });
            page.on('response', response => {
              if (response.status() >= 400) {
                const url = new URL(response.url());
                failures.add(response.request().method() + ' ' + url.host + url.pathname + ' ' + response.status());
              }
            });
            await page.clock.setFixedTime(fixtureTime);
            if (['loading', 'empty', 'error'].includes(state)) {
              await page.route('**/api/providers?*', async request => {
                if (state === 'loading') return;
                await request.fulfill({ status: state === 'error' ? 500 : 200, json: { success: state !== 'error', data: [], message: 'Lỗi tải dữ liệu (baseline)' } });
              });
            }
            await page.goto(route, { waitUntil: 'domcontentloaded' });
            if (redirect) await page.waitForURL(new URL(redirect, baseURL).href);
            await page.locator('body').filter({ hasText: /\S/ }).waitFor();
            if (state === 'loading') await page.getByText('Đang tải địa điểm…', { exact: true }).waitFor();
            else await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
            if (state === 'empty') await page.getByText('Không tìm thấy địa điểm nào', { exact: true }).waitFor();
            if (state === 'error') await page.getByText(/Lỗi kết nối máy chủ: /).waitFor();
            await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 2000))]));
            if (state === 'modal') {
              await page.getByRole('button', { name: 'Open', exact: true }).click();
              await page.getByRole('dialog').waitFor();
            }
            if (state === 'focus') await page.keyboard.press('Tab');
            if (state === 'hover') await page.locator('form').getByRole('button', { name: 'Đăng nhập', exact: true }).hover();
            if (state === 'split') await page.getByText('Bảng phân bổ chi phí từng thành viên', { exact: true }).waitFor();
            if (phase === 'lock') {
              const body = await page.locator('body').innerText();
              if (!/đã khóa|Đã khoá|Đã chốt|LOCKED/i.test(body)) throw Error('Lobby locked state was not rendered');
            }
            const surface = await page.evaluate(() => ({
              title: document.querySelector('h1')?.innerText ?? '',
              bodyStart: document.body.innerText.slice(0, 700),
              overflow: document.documentElement.scrollWidth > innerWidth,
              fonts: [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family).filter((font, index, fonts) => fonts.indexOf(font) === index),
            }));
            await page.screenshot({ path: path.join(dir, name + '.png'), animations: 'disabled', fullPage: !state });
            results.push({ name, viewport, route, role: role ?? 'public', finalPath: new URL(page.url()).pathname, ...surface, failures: [...failures] });
            console.log(viewport.width, name, new URL(page.url()).pathname);
          } finally {
            await ctx.close();
          }
        }
      }));
      const errors = captures.filter(result => result.status === 'rejected').map(result => result.reason);
      if (errors.length) throw new AggregateError(errors, phase + ' capture failed');
    }
  } finally {
    results.sort((a, b) => a.viewport.width - b.viewport.width || a.name.localeCompare(b.name));
    await fs.writeFile(path.join(__dirname, 'capture-results.json'), JSON.stringify({ browser: browser.version(), fixtureTime, results }, null, 2) + '\n');
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
