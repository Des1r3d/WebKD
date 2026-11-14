import asyncio, os
from playwright.async_api import async_playwright, expect
from verify_phase3_lobby import BASE, login, session, WIDTHS

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        request = await pw.request.new_context()
        host_token = await login(request, 'dat.dt@synchub.vn')
        member_token = await login(request, 'minh.b@synchub.vn')
        headers = {'Authorization': f'Bearer {host_token}'}
        host_context = await session(browser, host_token)
        host = await host_context.new_page()
        completed = await request.get(BASE + '/api/lobbies/SYNC00', headers=headers)
        assert (await completed.json())['data']['lobby']['status'] == 'COMPLETED'
        attempts = []
        host.on('request', lambda r: attempts.append(r.url) if r.method == 'POST' and r.url.endswith('/split') else None)
        await host.goto(BASE + '/lobby/SYNC00/split')
        await expect(host.get_by_role('heading', name='Chia bill #SYNC00')).to_be_visible()
        assert not attempts
        manual = await request.post(BASE + '/api/lobbies/SYNC00/split', headers=headers)
        assert manual.status == 409 and (await manual.json())['error'] == 'INVALID_STATUS'
        print('PASS SYNC00 COMPLETED: page opens with zero POST split; explicit POST returns 409 INVALID_STATUS')
        await host.goto(BASE + '/lobby/SYNC01')
        await expect(host.locator('[data-member-rows]')).to_have_attribute('data-received-snapshot','true')
        pages = []
        for width, height in WIDTHS:
            context = await session(browser, member_token, width, height)
            page = await context.new_page()
            errors = []
            page.on('pageerror', lambda error, errors=errors: errors.append(str(error)))
            await page.goto(BASE + '/lobby/SYNC01')
            await expect(page.locator('[data-member-rows]')).to_have_attribute('data-received-snapshot','true')
            assert await page.locator('[data-cancel-lobby]').count() == 0
            pages.append((page, errors, width, height))
        host.on('dialog', lambda dialog: dialog.accept())
        await host.get_by_role('button', name='Hủy phòng').click()
        await expect(host.locator('[data-lobby-status]')).to_contain_text('Đã hủy')
        for page, errors, width, height in pages:
            await expect(page.locator('[data-lobby-status]')).to_contain_text('Đã hủy')
            await expect(page.locator('[data-lobby-lock-notice]')).to_contain_text('Đơn F&B đã hủy')
            assert await page.locator('.cart-item').count() == 0
            assert not await page.evaluate('document.documentElement.scrollWidth > innerWidth')
            assert not errors, errors
            await page.screenshot(path=os.path.join(os.environ["SYNCHUB_LOBBY_ARTIFACTS"], f"cancel-{width}.png"), full_page=True)
            print(f'PASS cancellation realtime and responsive layout {width}x{height}')
        await browser.close()

asyncio.run(main())
