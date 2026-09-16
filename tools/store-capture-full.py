"""One-off real-game screenshot capture, run only in isolated GitHub Actions branch.
Browser fixtures change a temporary browser's save and RNG, not game source or odds.
"""
import asyncio
import json
import traceback
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path('capture-final')
SAVE_KEY='mystery-pocket-tech.save'
POOLS=[
 ('y2k-essentials','camera','flip-phone','camera-secret-cosmic','flip-phone-secret-noir','basic',0.13),
 ('video-link','mini-camcorder','webcam','mini-camcorder-secret-prototype','webcam-secret-stereo','basic',0.81),
 ('pocket-office','pda','pager','pda-secret-flip','pager-secret-flip','basic',0.98),
 ('pocket-audio','mp3-player','portable-disc-player','mp3-player-secret-pearl','portable-disc-player-secret-remote','charged',0.995),
 ('game-zone','handheld-console','home-console','handheld-console-secret-phone','home-console-secret-noir','charged',0.995),
 ('analog-nights','cassette-player','crt-tv','cassette-player-secret-remote','crt-tv-secret-communicator','basic',0.81),
 ('airwaves','portable-radio','walkie-talkie','portable-radio-secret-shortwave','walkie-talkie-secret-field-radio','charged',0.995),
]
RARITIES=('common','rare','epic','legendary')

async def snap(page, locale, name):
 p=ROOT/locale/(name+'.png');p.parent.mkdir(parents=True,exist_ok=True)
 # Temporarily hide debug only while the browser itself takes a screenshot.
 await page.screenshot(path=str(p),style='.mpt-debug-panel {visibility:hidden !important}',animations='disabled')
 print('SHOT',locale,p.name,flush=True)

async def boot(page):
 await page.goto('http://127.0.0.1:4173/',wait_until='domcontentloaded',timeout=60000)
 await page.locator('.mpt-debug-panel__meta strong').wait_for(timeout=75000)
 await page.wait_for_timeout(2500)

async def seed(page,pool,full=False):
 data={ 'pool':pool[0], 'chips':450, 'full':full,
        'standard':[f'{f}-{r}' for f in (pool[1],pool[2]) for r in RARITIES],
        'secrets':[pool[3],pool[4]] }
 await page.evaluate('''data => {
  const k='mystery-pocket-tech.save';const s=JSON.parse(localStorage.getItem(k));
  Object.assign(s,{version:5, chips:data.chips, totalOpens:17,signal:0,
     overchargeHundredths:100,activeLootPoolId:data.pool,pendingReveal:null,
     onboarding:{primaryCompleted:true,firstRevealReceipt:null},
     discoveredStandard:data.full?data.standard:[],
     discoveredSecrets:data.full?data.secrets:[],
     stats:{duplicates:0,hiddenPockets:0}});
  localStorage.setItem(k,JSON.stringify(s));
 }''',data)
 await page.reload(wait_until='domcontentloaded',timeout=60000)
 await page.locator('.mpt-debug-panel__meta strong').wait_for(timeout=75000)
 await page.wait_for_timeout(2400)
 actual=await page.evaluate("JSON.parse(localStorage.getItem('mystery-pocket-tech.save')).activeLootPoolId")
 assert actual == pool[0], f'wrong pool: wanted {pool[0]}, got {actual}'

async def select(page,charged):
 await page.mouse.click(163,386 if charged else 300)
 await page.wait_for_timeout(800)

async def tear(page,locale,pool_id):
 # Star tab originates at x≈601,y≈226 at 1600x900, drag right to tear off.
 await page.mouse.move(601,226); await page.mouse.down()
 await page.mouse.move(770,226,steps=9)
 await snap(page,locale,pool_id+'-tear-in-progress')
 await page.mouse.move(1003,227,steps=13)
 await page.mouse.up()
 await page.wait_for_timeout(4400)
 await snap(page,locale,pool_id+'-reward-reveal')
 result=await page.evaluate("JSON.parse(localStorage.getItem('mystery-pocket-tech.save'))")
 print('REWARD',locale,pool_id,'standardLast',result.get('discoveredStandard',[])[-1:],
       'secrets',result.get('discoveredSecrets',[])[-1:], 'pending', bool(result.get('pendingReveal')),flush=True)
 if result.get('pendingReveal'):
  print('WARNING unsettled pending',locale,pool_id,flush=True)

async def debug_reveal(page,locale,button,name,secret=False):
 await page.get_by_role('button',name=button,exact=True).click(timeout=20000)
 await page.wait_for_timeout(4800)
 await snap(page,locale,name)
 if secret:
  await page.mouse.move(1010,500);await page.mouse.down()
  await page.mouse.move(580,500,steps=12);await page.mouse.up()
  await page.wait_for_timeout(750)
  await snap(page,locale,name+'-carousel')

async def capture_locale(browser,locale):
 context=await browser.new_context(viewport={'width':1600,'height':900},locale=('ru-RU' if locale=='ru' else 'en-US'),device_scale_factor=1)
 await context.add_init_script("sessionStorage.setItem('mystery-pocket-tech.debug-panel-collapsed','0')")
 page=await context.new_page()
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 await boot(page)
 lang=(await page.locator('.mpt-debug-panel__meta strong').inner_text()).upper()
 if ('LANG: '+locale.upper()) not in lang:
  await page.get_by_role('button',name=('Русский' if locale=='ru' else 'English'),exact=True).click()
  await page.wait_for_timeout(4500)
 lang=(await page.locator('.mpt-debug-panel__meta strong').inner_text()).upper()
 assert 'LANG: '+locale.upper() in lang, 'language mismatch '+lang
 print('LANG',lang,flush=True)
 for idx,pool in enumerate(POOLS):
  pid=pool[0]
  try:
   await seed(page,pool)
   await snap(page,locale,pid+'-basic-pouch')
   await select(page,True)
   await snap(page,locale,pid+'-charged-pouch')
   charged=(pool[5]=='charged')
   if not charged: await select(page,False)
   # Capture-only deterministic random sample, never written to source, output is
   # still game-rendered and computed from its original production reward tables.
   await page.evaluate('(sample) => { Math.random = () => sample }',pool[6])
   await tear(page,locale,pid)
   if idx in (0,3,4,6):
    await page.mouse.click(800,810);await page.wait_for_timeout(850)
    await snap(page,locale,pid+'-reward-collection')
  except Exception as e:
   print('POOL ERROR',locale,pid,repr(e),traceback.format_exc(),flush=True)
   continue
 # Original built-in debug fixtures support reliable full rarity coverage,
 # but always select the canonical first drop. State this in the manifest.
 for button,name,is_secret in [
   ('Force Common','y2k-common-reveal',False),
   ('Force Rare','y2k-rare-reveal',False),
   ('Force Epic','y2k-epic-reveal',False),
   ('Force Epic Phone','y2k-epic-phone-reveal',False),
   ('Force Legendary (Charged)','y2k-legendary-charged-reveal',False),
   ('Force Hidden Pocket','y2k-secret-reveal',True),
 ]:
  try:
   await seed(page,POOLS[0]);await debug_reveal(page,locale,button,name,is_secret)
  except Exception as e:
   print('DEBUG ERROR',locale,name,repr(e),flush=True)
 for pool in (POOLS[0],POOLS[4],POOLS[5]):
  pid=pool[0]
  try:
   await seed(page,pool,full=True)
   await page.mouse.click(1450,829)
   await page.wait_for_timeout(1550)
   await snap(page,locale,pid+'-collection-shelf-full')
   await page.mouse.click(887,160);await page.wait_for_timeout(1150)
   await snap(page,locale,pid+'-collection-catalog-full')
  except Exception as e:
   print('COLLECTION ERROR',locale,pid,repr(e),flush=True)
 print('ERRORS',locale,json.dumps(errors[-20:],ensure_ascii=False),flush=True)
 await context.close()

async def main():
 ROOT.mkdir(exist_ok=True)
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for locale in ('ru','en'):
   try: await capture_locale(browser,locale)
   except Exception as e:print('LANG ERROR',locale,repr(e),traceback.format_exc(),flush=True)
  await browser.close()
 results={locale:len(list((ROOT/locale).glob('*.png'))) for locale in ('ru','en')}
 (ROOT/'MANIFEST.json').write_text(json.dumps({'production_main_sha':'8cd79b1076eefc7665c2bd90851b3c2da785b986','capture':'Real, unaltered browser screenshots of mock-platform game; debug/staged save and capture-only RNG for some states, not organic drops. GitHub Actions temporary isolated branch, not Yandex-hosted draft.', 'counts':results},ensure_ascii=False,indent=2))
 print('FINAL COUNTS',json.dumps(results),flush=True)
 if min(results.values())<18:raise RuntimeError('Insufficient captures: '+repr(results))

asyncio.run(main())
