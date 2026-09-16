import asyncio
from pathlib import Path
from PIL import Image, ImageDraw
from playwright.async_api import async_playwright

URL = 'http://127.0.0.1:4173/'
OUT = Path('signal-feel-browser-qa')
OUT.mkdir(exist_ok=True)

async def state(page):
    return await page.evaluate("JSON.parse(localStorage.getItem('mystery-pocket-tech.save'))")

async def ready(page):
    await page.locator('.mpt-debug-panel__meta strong').wait_for(timeout=90000)
    await page.locator('#startup-preload').wait_for(state='hidden', timeout=90000)
    await page.wait_for_function("Boolean(localStorage.getItem('mystery-pocket-tech.save'))", timeout=90000)

async def setup(page):
    await page.goto(URL, wait_until='domcontentloaded', timeout=60000)
    await ready(page)
    await page.evaluate('''() => {
      const k='mystery-pocket-tech.save'; const s=JSON.parse(localStorage.getItem(k));
      Object.assign(s,{version:5,chips:700,totalOpens:17,signal:0,
        overchargeHundredths:100,activeLootPoolId:'y2k-essentials',pendingReveal:null,
        onboarding:{primaryCompleted:true,firstRevealReceipt:null},
        discoveredStandard:[],discoveredSecrets:[],stats:{duplicates:0,hiddenPockets:0}});
      localStorage.setItem(k,JSON.stringify(s));
    }''')
    await page.reload(wait_until='domcontentloaded', timeout=60000)
    await ready(page)
    await page.wait_for_timeout(3500)

async def tear(page):
    await page.mouse.move(601, 226)
    await page.mouse.down()
    await page.mouse.move(770, 226, steps=9)
    await page.mouse.move(1003, 227, steps=13)
    await page.mouse.up()
    await page.wait_for_function("Boolean(JSON.parse(localStorage.getItem('mystery-pocket-tech.save'))?.pendingReveal)", timeout=20000)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=[
            '--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader',
            '--use-gl=angle', '--use-angle=swiftshader',
        ])
        try:
            for scenario in ('rare-basic', 'charged-legendary'):
                context = await browser.new_context(viewport={'width':1600,'height':900}, locale='ru-RU')
                page = await context.new_page()
                errors = []
                page.on('pageerror', lambda err: errors.append('page:' + str(err)))
                page.on('console', lambda msg: errors.append('console:' + msg.text) if msg.type == 'error' else None)
                try:
                    await setup(page)
                    if scenario == 'charged-legendary':
                        await page.mouse.click(163, 386)
                        await page.wait_for_timeout(650)
                    await tear(page)
                    captures = []
                    for index in range(34):
                        path = OUT / f'{scenario}-{index:02d}.png'
                        await page.screenshot(path=str(path), style='.mpt-debug-panel {visibility:hidden!important}')
                        captures.append(path)
                        await page.wait_for_timeout(105)
                    sheet = Image.new('RGB', (1600, 1170), 'black')
                    pen = ImageDraw.Draw(sheet)
                    for index, path in enumerate(captures):
                        frame = Image.open(path).convert('RGB').crop((560, 60, 1040, 660))
                        frame.thumbnail((200, 267))
                        col, row = index % 8, index // 8
                        sheet.paste(frame, (col * 200, row * 234))
                        pen.text((col * 200 + 4, row * 234 + 2), f'{index:02d}', fill='black', stroke_width=1, stroke_fill='white')
                    sheet.save(OUT / f'{scenario}-contact.jpg', quality=89)
                    s = await state(page)
                    expected = 'legendary' if scenario == 'charged-legendary' else 'rare'
                    assert s['totalOpens'] == 18 and not s['pendingReveal'], s
                    assert any(str(item).endswith('-' + expected) for item in s['discoveredStandard']), s
                    assert not errors, errors
                    print('PASS actual tear, resolved',scenario,'totalOpens',s['totalOpens'],'no browser errors',flush=True)
                except Exception:
                    await page.screenshot(path=str(OUT / f'{scenario}-failure.png'))
                    print('FAIL_CONTEXT',scenario,await state(page),'errors',errors,flush=True)
                    raise
                finally:
                    await context.close()
        finally:
            await browser.close()

asyncio.run(main())
