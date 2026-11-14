import asyncio
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from playwright.async_api import async_playwright, expect

BASE = os.environ.get("SYNCHUB_BASE_URL", "http://127.0.0.1:5000").rstrip("/")
BASELINE = os.environ.get("SYNCHUB_BASELINE_URL")
WIDTHS = [(390, 844), (768, 1024), (1440, 900)]


async def login(request, email):
    response = await request.post(
        BASE + "/api/auth/login",
        data={"email": email, "password": os.environ["SYNCHUB_SEED_PASSWORD"]},
    )
    assert response.ok, response.status
    return (await response.json())["token"]


async def session(browser, token, width=1440, height=900):
    context = await browser.new_context(
        viewport={"width": width, "height": height},
        locale="vi-VN",
        timezone_id="Asia/Ho_Chi_Minh",
        reduced_motion="reduce",
    )
    await context.add_init_script(f"localStorage.setItem('synchub.token', {json.dumps(token)})")
    return context


async def main():
    output = Path(os.environ["SYNCHUB_LOBBY_ARTIFACTS"])
    output.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(executable_path=os.environ.get("SYNCHUB_BROWSER"))
        request = await playwright.request.new_context()
        host_token = await login(request, "dat.dt@synchub.vn")
        member_token = await login(request, "minh.b@synchub.vn")
        measurements = []
        fixture = await request.get(BASE + "/api/lobbies/SYNC01", headers={"Authorization": f"Bearer {host_token}"})
        assert fixture.ok, fixture.status
        deadline = (await fixture.json())["data"]["lobby"]["deadline_at"]
        instant = datetime.now(timezone.utc)
        remaining = datetime.fromisoformat(deadline.replace("Z", "+00:00")) - instant
        assert remaining.total_seconds() > 0
        for width, height in WIDTHS:
            for label, origin in [("baseline", BASELINE), ("current", BASE)]:
                if not origin:
                    continue
                context = await session(browser, host_token, width, height)
                page = await context.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                await page.clock.set_fixed_time(instant)
                await page.goto(origin + "/lobby/SYNC01")
                await expect(page.get_by_role("heading", name="Giỏ hàng GroupOrder")).to_be_visible(timeout=15000)
                await expect(page.locator("[data-member-rows]")).to_have_attribute("data-received-snapshot", "true")
                await page.evaluate("document.fonts.ready")
                dimensions = await page.evaluate("""() => {
                    const box = (text) => {
                        const heading = [...document.querySelectorAll('h2')].find(el => el.textContent.includes(text));
                        const {x, y, width, height} = heading.parentElement.getBoundingClientRect();
                        return {x, y, width, height};
                    };
                    return {overflow: document.documentElement.scrollWidth > innerWidth,
                            timer: document.querySelector('[role=timer]').textContent,
                            cart: box('Giỏ hàng GroupOrder'), members: box('Thành viên'),
                            bottomNav: [...document.querySelectorAll('nav')].some(el => getComputedStyle(el).position === 'fixed' && el.getBoundingClientRect().bottom === innerHeight && el.getBoundingClientRect().height > 0)};
                }""")
                assert not errors, errors
                assert not dimensions["overflow"], dimensions
                assert dimensions["timer"] != "00:00", dimensions
                measurements.append({"variant": label, "width": width, **dimensions})
                await page.screenshot(path=output / f"{label}-{width}.png", full_page=True, animations="disabled")
                await context.close()
        if BASELINE:
            for baseline, current in zip(measurements[::2], measurements[1::2]):
                assert baseline["timer"] == current["timer"]
                assert baseline["bottomNav"] == current["bottomNav"]
        (output / "measurements.json").write_text(json.dumps(measurements, indent=2), encoding="utf-8")

        host_context = await session(browser, host_token)
        member_context = await session(browser, member_token)
        host = await host_context.new_page()
        member = await member_context.new_page()
        for page in (host, member):
            await page.goto(BASE + "/lobby/SYNC01")
            await expect(page.locator("[data-member-rows]")).to_have_attribute("data-received-snapshot", "true")
            await expect(page.locator(".member-row")).to_have_count(4)
        print("PASS snapshots Host/Member", flush=True)

        host_plus = host.locator('[data-cart-qty="1"]').first
        item_id = await host_plus.get_attribute("data-cart-id")
        host_plus = host.locator(f'[data-cart-qty="1"][data-cart-id="{item_id}"]')
        row = f'.cart-item:has([data-cart-id="{item_id}"])'
        initial = int(await host.locator(row + " .cart-controls span").text_content())
        draft = member.get_by_role("textbox", name="Tin nhắn")
        await draft.fill("draft during cart update")
        await host_plus.click()
        for page in (host, member):
            await expect(page.locator(row + " .cart-controls span")).to_have_text(str(initial + 1))
        await expect(host_plus).to_be_focused()
        await expect(draft).to_have_value("draft during cart update")
        print("PASS cart adds one unit, restores focus and preserves chat draft", flush=True)

        message = f"realtime smoke {uuid4()}"
        await draft.fill(message)
        await draft.press("Enter")
        for page in (host, member):
            await expect(page.get_by_text(message, exact=True)).to_have_count(1)
        await member_context.set_offline(True)
        await expect(member.locator('[data-cart-qty="1"]').first).to_be_disabled(timeout=30000)
        await host_plus.click()
        await expect(host.locator(row + " .cart-controls span")).to_have_text(str(initial + 2))
        await member_context.set_offline(False)
        await expect(member.locator(row + " .cart-controls span")).to_have_text(str(initial + 2), timeout=20000)
        await expect(member.get_by_text(message, exact=True)).to_have_count(1)
        reconnected_message = f"after reconnect {uuid4()}"
        await draft.fill(reconnected_message)
        await draft.press("Enter")
        for page in (host, member):
            await expect(page.get_by_text(reconnected_message, exact=True)).to_have_count(1)
        print("PASS chat and reconnect snapshot without duplicate history/messages", flush=True)

        await host.get_by_role("button", name="Khóa giỏ hàng (BR-INT-04)").click()
        await expect(member.locator("[data-lobby-lock-notice]")).to_be_visible()
        assert await member.locator("[data-cart-add]:not(:disabled), [data-cart-qty]:not(:disabled)").count() == 0
        menu_item = await host.locator("[data-cart-add]").first.get_attribute("data-cart-add")
        rejected = await request.post(
            BASE + "/api/lobbies/SYNC01/cart",
            headers={"Authorization": f"Bearer {member_token}"},
            data={"menuItemId": menu_item, "qty": 1},
        )
        assert rejected.status == 403 and (await rejected.json())["error"] == "LOBBY_LOCKED"
        print("PASS realtime lock and HTTP 403 LOBBY_LOCKED", flush=True)
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
