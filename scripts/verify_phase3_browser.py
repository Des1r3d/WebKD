import asyncio, json, os
from playwright.async_api import async_playwright
BASE=os.environ.get('SYNCHUB_BASE_URL', 'http://127.0.0.1:5000').rstrip('/')
PASSWORD=os.environ.get('SYNCHUB_SEED_PASSWORD')
ACCOUNTS={'HOST':'dat.dt@synchub.vn','MEMBER':'minh.b@synchub.vn','PROVIDER':'thang.venue@synchub.vn','ADMIN':'admin@synchub.vn'}

async def main():
  if not PASSWORD: raise RuntimeError('Set SYNCHUB_SEED_PASSWORD to the documented seed password.')
  results=[]
  async with async_playwright() as p:
    browser=await p.chromium.launch(executable_path=os.environ.get('SYNCHUB_BROWSER'),headless=True)
    tokens={}
    for role,email in ACCOUNTS.items():
      response=await (await browser.new_page()).request.post(BASE+'/api/auth/login',data={'email':email,'password':PASSWORD})
      if not response.ok: raise RuntimeError(f'{role} fixture login failed: {response.status}')
      tokens[role]=(await response.json())['token']

    async def context_for(role=None):
      ctx=await browser.new_context(viewport={'width':1440,'height':900})
      if role: await ctx.add_init_script(f"localStorage.setItem('synchub.token', {json.dumps(tokens[role])})")
      return ctx

    # Login redirect/from and UI login.
    ctx=await context_for(); page=await ctx.new_page(); await page.goto(BASE+'/wallet'); await page.wait_for_timeout(300)
    results.append({'check':'login redirect','pass':page.url.endswith('/login'),'url':page.url})
    await page.locator('[name=email]').fill(ACCOUNTS['HOST']); await page.locator('[name=password]').fill(PASSWORD); await page.locator('[data-auth-form] button[type=submit]').click(); await page.wait_for_url('**/wallet',timeout=6000)
    results.append({'check':'login returns to from route','pass':page.url.endswith('/wallet'),'url':page.url})
    await page.locator('[data-logout]').click()
    await page.wait_for_url(BASE+'/')
    await page.goto(BASE+'/wallet')
    await page.wait_for_url('**/login')
    results.append({'check':'logout clears token and protects wallet','pass':await page.evaluate("!localStorage.getItem('synchub.token')")})
    await page.evaluate("(token) => localStorage.setItem('synchub.token', token)", os.environ.get('SYNCHUB_EXPIRED_TOKEN', 'invalid-token'))
    await page.goto(BASE+'/lobby/SYNC01/split')
    await page.wait_for_url('**/login')
    results.append({'check':'rejected session clears token and redirects','pass':await page.evaluate("!localStorage.getItem('synchub.token')")})
    await ctx.close()

    # Back/forward and deep-link refresh.
    ctx=await context_for('HOST'); page=await ctx.new_page(); await page.goto(BASE+'/'); await page.locator('a[data-link][href^="/venues/"]').first.click(); await page.wait_for_url('**/venues/*'); venue_url=page.url; await page.go_back(); await page.wait_for_url(BASE+'/'); back_ok=page.url==BASE+'/'; await page.go_forward(); await page.wait_for_url('**/venues/*'); forward_ok=page.url==venue_url; await page.reload(); await page.get_by_text('Khung giờ',exact=True).wait_for(timeout=5000)
    results.append({'check':'Back/Forward + deep-link reload','pass':back_ok and forward_ok and page.url==venue_url,'back':back_ok,'forward':forward_ok,'reload':page.url==venue_url})
    await ctx.close()

    # Role guards.
    for role,target,expected in [('MEMBER','/provider','/'),('PROVIDER','/admin','/provider'),('ADMIN','/provider','/admin'),('HOST','/profile','/profile')]:
      ctx=await context_for(role); page=await ctx.new_page(); await page.goto(BASE+target); await page.wait_for_timeout(350); actual=await page.evaluate('location.pathname'); results.append({'check':f'role guard {role} → {target}','pass':actual==expected,'actual':actual,'expected':expected}); await ctx.close()

    # Keyboard focus, dialog lifecycle and native validation.
    ctx=await context_for(); page=await ctx.new_page(); await page.goto(BASE+'/styleguide'); await page.locator('[data-open-modal]').click(); dialog=page.locator('[role=dialog]'); opened=await dialog.count()==1; await page.keyboard.press('Escape'); closed=await dialog.count()==0; focus_return=await page.evaluate("document.activeElement?.hasAttribute('data-open-modal')"); results.append({'check':'modal Escape and focus return','pass':opened and closed and focus_return,'opened':opened,'closed':closed,'focusReturn':focus_return}); await page.goto(BASE+'/register'); validity=await page.locator('[data-auth-form]').evaluate('(f)=>!f.checkValidity()'); results.append({'check':'register native form validation','pass':validity,'blankFormInvalid':validity}); await ctx.close()

    # Initial Socket.io packets may arrive through polling before the websocket upgrades.
    ctx=await context_for('HOST'); page=await ctx.new_page(); sockets=[]
    page.on('websocket', lambda ws: sockets.append(ws) if '/socket.io/' in ws.url else None)
    await page.goto(BASE+'/lobby/SYNC01')
    await page.locator('[data-received-snapshot="true"]').wait_for(timeout=10000)
    await page.locator('[data-cart-qty]:enabled').first.wait_for(timeout=10000)
    results.append({'check':'Socket.IO lobby join initial state','pass':True})
    await page.locator('aside.sidebar a[href="/wallet"]').click()
    await page.wait_for_url('**/wallet')
    if sockets and not sockets[0].is_closed(): await sockets[0].wait_for_event('close', timeout=5000)
    results.append({'check':'socket cleanup on route change','pass':bool(sockets) and all(ws.is_closed() for ws in sockets)})
    await ctx.close(); await browser.close()
  print(json.dumps(results,ensure_ascii=False,indent=2))
  if any(not x['pass'] for x in results): raise SystemExit(1)

asyncio.run(main())
