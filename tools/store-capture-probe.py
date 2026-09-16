import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path('capture-probe')
OUT.mkdir(exist_ok=True)
KEY = 'mystery-pocket-tech.save'

async def shot(page, name):
    await page.add_style_tag(content='.mpt-debug-panel {display:none !important}')
    await page.screenshot(path=str(OUT / name))
    print('shot', name, flush=True)

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
        context = await browser.new_context(viewport={'width': 1600, 'height': 900}, locale='ru-RU', device_scale_factor=1)
        await context.add_init_script("sessionStorage.setItem('mystery-pocket-tech.debug-panel-collapsed', '0')")
        page = await context.new_page()
        errors=[]
        page.on('pageerror', lambda exc: errors.append(str(exc)))
        await page.goto('http://127.0.0.1:4173/', wait_until='domcontentloaded')
        await page.locator('canvas').wait_for(timeout=90000)
        await page.wait_for_timeout(3500)
        await page.evaluate("""() => {let s=JSON.parse(localStorage.getItem('mystery-pocket-tech.save')); Object.assign(s,{chips:400,totalOpens:15,signal:0,overchargeHundredths:100,activeLootPoolId:'pocket-audio',pendingReveal:null,onboarding:{primaryCompleted:true,firstRevealReceipt:null}});localStorage.setItem('mystery-pocket-tech.save',JSON.stringify(s))}""")
        await page.reload(wait_until='domcontentloaded'); await page.wait_for_timeout(4200)
        print('seed save', await page.evaluate("JSON.parse(localStorage.getItem('mystery-pocket-tech.save'))"),flush=True)
        await shot(page,'01-audio-basic-idle.png')
        await page.mouse.click(680,850);await page.wait_for_timeout(1400)
        await shot(page,'02-audio-selector-click.png')
        await page.reload(wait_until='domcontentloaded');await page.wait_for_timeout(4500)
        await page.get_by_role('button',name='Force Hidden Pocket',exact=True).click()
        await page.wait_for_timeout(4800)
        await shot(page,'03-audio-secret-initial.png')
        await page.mouse.move(1010,500);await page.mouse.down();await page.mouse.move(575,500,steps=12);await page.mouse.up();await page.wait_for_timeout(800)
        await shot(page,'04-audio-secret-swipe-left.png')
        await page.mouse.click(800,500);await page.wait_for_timeout(650)
        await shot(page,'05-audio-secret-click-middle.png')
        await page.reload(wait_until='domcontentloaded');await page.wait_for_timeout(4500)
        await page.get_by_role('button',name='Seed all 8/8 + 2/2',exact=True).click()
        await page.wait_for_timeout(4300)
        await shot(page,'06-audio-seeded-idle.png')
        await page.mouse.click(1480,836);await page.wait_for_timeout(2100)
        await shot(page,'07-collection-after-click.png')
        print('errors',json.dumps(errors,ensure_ascii=False),flush=True)
        await browser.close()

asyncio.run(main())
