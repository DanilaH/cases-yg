"""Temporary real-pouch-gesture QA against mock runtime on isolated GitHub runner.

Do not monkeypatch Math.random: Phaser uses it for text texture UUIDs, and a
constant sample creates duplicate texture keys and a null canvas context.
"""
import asyncio
import json
import traceback
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path('impact-tear-qa')
CASES = (('basic', False), ('charged', True))

async def one(browser, label, charged):
    path = ROOT / label
    path.mkdir(parents=True, exist_ok=True)
    context = await browser.new_context(viewport={'width':1600,'height':900}, locale='ru-RU',
        record_video_dir=str(path), record_video_size={'width':1600,'height':900})
    page = await context.new_page()
    errors=[]
    page.on('pageerror', lambda error: errors.append(getattr(error, 'stack', None) or str(error)))
    page.on('console', lambda msg: print('BROWSER', msg.type, msg.text, flush=True) if msg.type == 'error' else None)
    try:
        await page.goto('http://127.0.0.1:4173/', wait_until='domcontentloaded', timeout=60000)
        await page.locator('.mpt-debug-panel__meta strong').wait_for(timeout=75000)
        await page.wait_for_timeout(3200)
        await page.evaluate('''() => {
            const k='mystery-pocket-tech.save';const s=JSON.parse(localStorage.getItem(k));
            Object.assign(s,{version:5,chips:450,totalOpens:17,signal:0,
                overchargeHundredths:100,activeLootPoolId:'y2k-essentials',pendingReveal:null,
                onboarding:{primaryCompleted:true,firstRevealReceipt:null},
                discoveredStandard:[],discoveredSecrets:[],stats:{duplicates:0,hiddenPockets:0}});
            localStorage.setItem(k,JSON.stringify(s));
        }''')
        await page.reload(wait_until='domcontentloaded',timeout=60000)
        await page.locator('.mpt-debug-panel__meta strong').wait_for(timeout=75000)
        await page.wait_for_timeout(3200)
        await page.screenshot(path=str(path/'00-before-real-tear.png'),
            style='.mpt-debug-panel {visibility:hidden!important}',animations='disabled')
        if charged:
            await page.mouse.click(163,386)
            await page.wait_for_timeout(750)
        before=await page.evaluate("JSON.parse(localStorage.getItem('mystery-pocket-tech.save'))")
        await page.mouse.move(601,226)
        await page.mouse.down()
        await page.mouse.move(770,226,steps=9)
        await page.mouse.move(1003,227,steps=13)
        await page.mouse.up()
        # No synthetic Force Rarity button and no global RNG patch.
        for tick in range(26):
            await page.wait_for_timeout(450)
            state=await page.evaluate("JSON.parse(localStorage.getItem('mystery-pocket-tech.save'))")
            if state.get('discoveredStandard') and not state.get('pendingReveal'):
                break
        await page.wait_for_timeout(600)
        await page.screenshot(path=str(path/'01-after-real-tear.png'),
            style='.mpt-debug-panel {visibility:hidden!important}',animations='disabled')
        state=await page.evaluate("JSON.parse(localStorage.getItem('mystery-pocket-tech.save'))")
        observed=state.get('discoveredStandard',[])
        print('TEAR',label,'before',before.get('totalOpens'),
            'after',state.get('totalOpens'),'observed',observed,
            'pending',bool(state.get('pendingReveal')),'errors',json.dumps(errors),flush=True)
        assert observed, f'no reward committed for {label}'
        assert state.get('totalOpens') == before.get('totalOpens') + 1, f'incorrect opening count for {label}'
        assert not state.get('pendingReveal'),f'unfinished reveal for {label}'
        assert not errors,f'page errors for {label}: {errors}'
        if charged:
            assert state.get('chips', 0) < before.get('chips', 0), 'Charged pouch cost was not deducted'
    finally:
        await context.close()

async def main():
    ROOT.mkdir(exist_ok=True)
    async with async_playwright() as playwright:
        browser=await playwright.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        failures=[]
        try:
            for label,charged in CASES:
                try:await one(browser,label,charged)
                except Exception as error:
                    failures.append(label)
                    print('QA FAIL',label,repr(error),traceback.format_exc(),flush=True)
        finally:await browser.close()
        assert not failures, f'Failed real-tear cases: {failures}'

asyncio.run(main())
