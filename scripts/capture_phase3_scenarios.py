import asyncio, json, os
from pathlib import Path
from playwright.async_api import Error as PlaywrightError, async_playwright

BASE = 'http://127.0.0.1:5180'
OUT = Path('docs/migration-baseline/screenshots/phase-3')
PASSWORD = os.environ.get('SYNCHUB_SEED_PASSWORD')
VIEWPORTS = [(390, 844), (768, 1024), (1440, 900)]
ACCOUNTS = {
    'HOST': 'dat.dt@synchub.vn',
    'MEMBER': 'minh.b@synchub.vn',
    'PROVIDER': 'thang.venue@synchub.vn',
    'ADMIN': 'admin@synchub.vn',
}
SCENARIOS = [
    ('PUBLIC', None, '/login', 'login'),
    ('PUBLIC', None, '/register', 'register'),
    ('PUBLIC', None, '/', 'discover'),
    ('PUBLIC', None, '/venues/prv-venue-01', 'venue'),
    ('PUBLIC', None, '/join', 'join-redirect'),
    ('PUBLIC', None, '/join/SYNC01', 'invite-public'),
    ('HOST', 'HOST', '/profile', 'profile'),
    ('HOST', 'HOST', '/join/SYNC01', 'invite-host'),
    ('HOST', 'HOST', '/lobby/SYNC01', 'lobby-host'),
    ('MEMBER', 'MEMBER', '/lobby/SYNC01', 'lobby-member'),
    ('HOST', 'HOST', '/lobby/SYNC01/split', 'split'),
    ('MEMBER', 'MEMBER', '/wallet', 'wallet'),
    ('MEMBER', 'MEMBER', '/disputes', 'disputes'),
    ('PROVIDER', 'PROVIDER', '/provider', 'provider'),
    ('PROVIDER', 'PROVIDER', '/provider/verify', 'provider-wildcard'),
    ('ADMIN', 'ADMIN', '/admin', 'admin'),
    ('ADMIN', 'ADMIN', '/admin/audit', 'admin-wildcard'),
    ('PUBLIC', None, '/styleguide', 'styleguide'),
    ('HOST', 'HOST', '/not-a-route', 'unknown-redirect'),
    ('PUBLIC', None, '/?search=__phase3_no_match__', 'empty'),
    ('PUBLIC', None, '/venues/no-such-provider', 'error'),
    ('PUBLIC', None, '/', 'loading'),
    ('MEMBER', 'MEMBER', '/join/SYNC01', 'invite-member'),
    ('HOST', 'HOST', '/lobby/SYNC01', 'lobby-locked'),
    ('HOST', 'HOST', '/lobby/SYNC00/split', 'split-completed-error'),
    ('PUBLIC', None, '/styleguide', 'modal-open'),
    ('PUBLIC', None, '/styleguide', 'button-hover'),
    ('PUBLIC', None, '/login', 'keyboard-focus'),
    ('PUBLIC', None, '/login', 'login-error'),
]
scenario_filter = {name.strip() for name in os.environ.get('PHASE3_SCENARIOS', '').split(',') if name.strip()}
if scenario_filter:
    SCENARIOS = [scenario for scenario in SCENARIOS if scenario[3] in scenario_filter]

async def main():
    if not PASSWORD:
        raise RuntimeError('Set SYNCHUB_SEED_PASSWORD to the documented seed password before capture.')
    OUT.mkdir(parents=True, exist_ok=True)
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='chrome', headless=True)
        tokens = {}
        for role, email in ACCOUNTS.items():
            response = await browser.new_page()
            login = await response.request.post(BASE + '/api/auth/login', data={'email': email, 'password': PASSWORD})
            if not login.ok:
                raise RuntimeError(f'{role} seed login failed with HTTP {login.status}')
            tokens[role] = (await login.json())['token']
            await response.close()
        for width, height in VIEWPORTS:
            for role, account, route, name in SCENARIOS:
                context = await browser.new_context(viewport={'width': width, 'height': height}, device_scale_factor=1)
                if account:
                    token = tokens[account]
                    await context.add_init_script(f"localStorage.setItem('synchub.token', {json.dumps(token)})")
                page = await context.new_page()
                page.set_default_navigation_timeout(12000)
                page.set_default_timeout(6000)
                failed_requests, api_errors, page_errors = [], [], []
                page.on('requestfailed', lambda req: failed_requests.append({'url': req.url, 'error': req.failure}))
                page.on('response', lambda res: api_errors.append({'url': res.url, 'status': res.status}) if '/api/' in res.url and res.status >= 400 else None)
                page.on('pageerror', lambda exc: page_errors.append(str(exc)))
                if name == 'loading':
                    async def delayed_api(route):
                        await asyncio.sleep(2.5)
                        await route.continue_()
                    await page.route('**/api/providers*', delayed_api)
                response = await page.goto(BASE + route, wait_until='domcontentloaded')
                await page.wait_for_timeout(160 if name == 'loading' else 900)
                if name == 'modal-open':
                    await page.locator('[data-open-modal]').click()
                elif name == 'button-hover':
                    await page.locator('.btn').first.hover()
                elif name == 'keyboard-focus':
                    await page.keyboard.press('Tab')
                elif name == 'login-error':
                    await page.locator('[name="email"]').fill('missing.phase3@synchub.invalid')
                    await page.locator('[name="password"]').fill('WrongPassword!')
                    await page.locator('[data-auth-form] button[type="submit"]').click()
                    await page.wait_for_timeout(350)
                if name not in {'loading'}:
                    await page.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager')")
                    await page.evaluate("Promise.all([...document.images].map(img => img.decode().catch(() => null)))")
                    await page.wait_for_timeout(250)
                try:
                    await page.evaluate('document.fonts.ready')
                    actual = await page.evaluate("""() => ({url: location.pathname + location.search, title: document.title, scrollWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth, visibleAlert: document.querySelector('[role=alert]:not([hidden])')?.innerText || '', fontStatus: document.fonts.status, images: [...document.images].map(i => ({src:i.currentSrc, complete:i.complete, naturalWidth:i.naturalWidth})).filter(i => !i.complete || !i.naturalWidth)})""")
                except PlaywrightError:
                    await page.wait_for_timeout(400)
                    actual = await page.evaluate("""() => ({url: location.pathname + location.search, title: document.title, scrollWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth, visibleAlert: document.querySelector('[role=alert]:not([hidden])')?.innerText || '', fontStatus: document.fonts.status, images: [...document.images].map(i => ({src:i.currentSrc, complete:i.complete, naturalWidth:i.naturalWidth})).filter(i => !i.complete || !i.naturalWidth)})""")
                image = f'{name}-{width}x{height}.png'
                await page.screenshot(path=str(OUT / image), full_page=True, animations='disabled')
                results.append({'route': route, 'scenario': name, 'role': role, 'viewport': f'{width}x{height}', 'httpStatus': response.status if response else None, **actual, 'apiErrors': api_errors, 'resourceErrors': failed_requests, 'pageErrors': page_errors, 'screenshot': image})
                await context.close()
                print(f'{image}: {actual["url"]}; scrollWidth {actual["scrollWidth"]}/{width}; font {actual["fontStatus"]}; apiErrors {len(api_errors)}', flush=True)
        await browser.close()
    (OUT / 'capture-results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Wrote {len(results)} screenshot records to {OUT / "capture-results.json"}', flush=True)

asyncio.run(main())
