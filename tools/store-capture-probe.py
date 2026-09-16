import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path('capture-probe')
OUT.mkdir(exist_ok=True)

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
        context = await browser.new_context(viewport={'width': 1600, 'height': 900}, locale='ru-RU', device_scale_factor=1, reduced_motion='reduce')
        await context.add_init_script("sessionStorage.setItem('mystery-pocket-tech.debug-panel-collapsed', '0')")
        page = await context.new_page()
        errors = []
        page.on('pageerror', lambda exc: errors.append(str(exc)))
        page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)
        await page.goto('http://127.0.0.1:4173/', wait_until='domcontentloaded', timeout=60000)
        await page.locator('canvas').wait_for(timeout=90000)
        await page.wait_for_timeout(5000)
        await page.screenshot(path=str(OUT / '01-initial-debug.png'))
        print('debug buttons:', await page.locator('.mpt-debug-panel button').all_text_contents(), flush=True)
        print('storage:', (await page.evaluate('Object.entries(localStorage)'))[:4], flush=True)
        await page.add_style_tag(content='.mpt-debug-panel {display:none !important}')
        await page.screenshot(path=str(OUT / '02-initial-clean.png'))
        for scenario in ['Force Rare', 'Force Legendary (Charged)', 'Force Hidden Pocket']:
            name = scenario.lower().replace(' ', '-').replace('(', '').replace(')', '')
            await page.reload(wait_until='domcontentloaded')
            await page.locator('canvas').wait_for(timeout=90000)
            await page.locator('.mpt-debug-panel button', has_text=scenario).click(timeout=20000)
            await page.wait_for_timeout(1100)
            await page.add_style_tag(content='.mpt-debug-panel {display:none !important}')
            for tick in [1, 3, 6]:
                await page.screenshot(path=str(OUT / f'{name}-{tick}.png'))
                await page.wait_for_timeout(1700 if tick == 1 else 2400)
            print('scenario', scenario, 'storage:', (await page.evaluate('Object.entries(localStorage)'))[:2], flush=True)
        print('page errors:', json.dumps(errors[-15:], ensure_ascii=False), flush=True)
        await browser.close()

asyncio.run(main())
