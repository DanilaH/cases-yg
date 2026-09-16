"""Temporary browser-only QA of the real built game. Deletes before merge."""
import asyncio
import json
import traceback
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path('impact-qa')
SAVE_KEY = 'mystery-pocket-tech.save'
CASES = [
    ('common', 'Force Common', 1600, 900),
    ('rare', 'Force Rare', 1600, 900),
    ('epic', 'Force Epic', 1600, 900),
    ('legendary', 'Force Legendary (Charged)', 1600, 900),
    ('secret', 'Force Hidden Pocket', 1600, 900),
    ('mobile-common', 'Force Common', 844, 390),
    ('mobile-legendary', 'Force Legendary (Charged)', 844, 390),
]

async def boot(page):
    await page.goto('http://127.0.0.1:4173/', wait_until='domcontentloaded', timeout=60000)
    await page.locator('.mpt-debug-panel__meta strong').wait_for(timeout=75000)
    await page.wait_for_timeout(2200)
    await page.evaluate('''() => {
        const k='mystery-pocket-tech.save'; const s=JSON.parse(localStorage.getItem(k));
        Object.assign(s,{version:5,chips:450,totalOpens:17,signal:0,
          overchargeHundredths:100,activeLootPoolId:'y2k-essentials',pendingReveal:null,
          onboarding:{primaryCompleted:true,firstRevealReceipt:null},
          discoveredStandard:[],discoveredSecrets:[],
          stats:{duplicates:0,hiddenPockets:0}});
        localStorage.setItem(k,JSON.stringify(s));
    }''')
    await page.reload(wait_until='domcontentloaded')
    await page.locator('.mpt-debug-panel__meta strong').wait_for(timeout=75000)
    await page.wait_for_timeout(1800)

async def capture(browser, label, button, width, height):
    target = ROOT / label
    target.mkdir(parents=True, exist_ok=True)
    context = await browser.new_context(viewport={'width':width,'height':height},
        locale='ru-RU',device_scale_factor=1,
        record_video_dir=str(target),record_video_size={'width':width,'height':height})
    page=await context.new_page()
    errors=[]
    page.on('pageerror',lambda error: errors.append(str(error)))
    try:
        await boot(page)
        await page.screenshot(path=str(target / '00-idle.png'),
            style='.mpt-debug-panel {visibility:hidden!important}',animations='disabled')
        await page.get_by_role('button',name=button,exact=True).click(timeout=15000)
        await page.add_style_tag(content='.mpt-debug-panel {visibility:hidden!important}')
        # Capture transient phases and ensure a real reward is present at the end.
        for index,delay in enumerate((75,100,100,130,200,280,580)):
            await page.wait_for_timeout(delay)
            await page.screenshot(path=str(target / f'{index+1:02d}-impact.png'),animations='allow')
        await page.wait_for_timeout(2200)
        await page.screenshot(path=str(target / '08-result.png'),animations='disabled')
        state=await page.evaluate("JSON.parse(localStorage.getItem('mystery-pocket-tech.save'))")
        assert state is not None, 'save disappeared'
        print('CAPTURE',label,'errors',json.dumps(errors,ensure_ascii=False),
            'pending',bool(state.get('pendingReveal')),'standard',state.get('discoveredStandard',[])[-1:],flush=True)
        assert not errors, f'page errors in {label}: {errors}'
    finally:
        await context.close()

async def main():
    ROOT.mkdir(exist_ok=True)
    async with async_playwright() as playwright:
        browser=await playwright.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        for label,button,w,h in CASES:
            try:
                await capture(browser,label,button,w,h)
            except Exception as error:
                print('QA FAIL',label,repr(error),traceback.format_exc(),flush=True)
        await browser.close()
    (ROOT/'MANIFEST.json').write_text(json.dumps({'cases':[c[0] for c in CASES], 'note':'Mock-platform real game, staged save and debug fixture, Chromium desktop / mobile landscape viewport (not physical phone).'},indent=2))

asyncio.run(main())
