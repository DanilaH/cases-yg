"""Temporary, branch-local patch + real-browser QA. Remove before merge."""
import asyncio
import json
import sys
from pathlib import Path


def replace_once(text: str, before: str, after: str, path: Path) -> str:
    count = text.count(before)
    if count != 1:
        raise AssertionError(f'{path}: expected one anchor, found {count}: {before[:85]!r}')
    return text.replace(before, after, 1)


def patch() -> None:
    css = Path('src/styles.css')
    text = css.read_text()
    text = replace_once(text,
        '#game-shell {\n  position: relative;\n  display: grid;',
        '''#game-shell {
  position: relative;
  /* A full-bleed, non-interactive continuation behind the 2:1 capped game.
     Match the scene's opening-art height; cover fills exceptionally wide tails. */
  background-color: #171421;
  background-image: var(--shell-backdrop-url), var(--shell-backdrop-url);
  background-size: auto var(--shell-backdrop-height, 100%), cover;
  background-position: center center;
  background-repeat: no-repeat;
  display: grid;''', css)
    css.write_text(text)

    art = Path('src/game/ui/staticArt.ts')
    text = art.read_text()
    text = replace_once(text,
        'export const addCoverArt = (',
        '''// Keep the decorative sidebars in sync with the actual scene artwork.
// Phaser's canvas is intentionally capped at 2:1, so the shell paints ONLY
// the extra-wide margins; no input geometry or game-canvas resize is needed.
const syncShellBackdrop = (textureKey: string): void => {
  const background = textureKey === 'art:static:opening-bg'
    ? 'opening-bg'
    : textureKey === 'art:static:collection-bg'
      ? 'collection-bg'
      : null;
  if (!background || typeof document === 'undefined') return;
  const shell = document.getElementById('game-shell');
  if (!shell) return;
  const url = new URL(`assets/backgrounds/${background}.webp`, document.baseURI).href;
  shell.style.setProperty('--shell-backdrop-url', `url("${url}")`);
  shell.style.setProperty('--shell-backdrop-height', background === 'opening-bg' ? '101.2%' : '100%');
};

export const addCoverArt = (''', art)
    text = replace_once(text,
        '): Phaser.GameObjects.Image | null => {\n  if (!scene.textures.exists(textureKey)) return null;',
        '): Phaser.GameObjects.Image | null => {\n  syncShellBackdrop(textureKey);\n  if (!scene.textures.exists(textureKey)) return null;', art)
    art.write_text(text)

    profile = Path('src/game/data/rarityPouchImpact.ts')
    text = profile.read_text()
    changes = (
        ('vignettePulses: 1, vignetteAlpha: 0.36, pulseHalfMs: 68, pulseGapMs: 0,',
         'vignettePulses: 1, vignetteAlpha: 0.46, pulseHalfMs: 100, pulseGapMs: 0,'),
        ('vignettePulses: 2, vignetteAlpha: 0.49, pulseHalfMs: 73, pulseGapMs: 24,',
         'vignettePulses: 2, vignetteAlpha: 0.57, pulseHalfMs: 100, pulseGapMs: 36,'),
        ('vignettePulses: 2, vignetteAlpha: 0.66, pulseHalfMs: 78, pulseGapMs: 28,',
         'vignettePulses: 3, vignetteAlpha: 0.69, pulseHalfMs: 94, pulseGapMs: 34,'),
        ('vignettePulses: 3, vignetteAlpha: 0.84, pulseHalfMs: 82, pulseGapMs: 30,',
         'vignettePulses: 4, vignetteAlpha: 0.84, pulseHalfMs: 88, pulseGapMs: 28,'),
        ('vignettePulses: 2, vignetteAlpha: 0.94, pulseHalfMs: 96, pulseGapMs: 45,',
         'vignettePulses: 3, vignetteAlpha: 0.94, pulseHalfMs: 108, pulseGapMs: 46,'),
    )
    for before, after in changes:
        text = replace_once(text, before, after, profile)
    profile.write_text(text)

    scene = Path('src/game/scenes/OpeningScene.ts')
    text = scene.read_text()
    for before, after in (
        ('const insetX = layer * 15;', 'const insetX = layer * 17;'),
        ('const insetY = layer * 12;', 'const insetY = layer * 11;'),
        ('const band = 17;', 'const band = 22;'),
        ('const shade = 0.021 - layer * 0.0011;', 'const shade = 0.063 - layer * 0.0026;'),
    ):
        text = replace_once(text, before, after, scene)
    text = replace_once(text,
        '// Draw once per reveal, then animate only alpha. Dark edges, never a full-screen\n',
        '// Draw once per reveal, then animate only alpha. Stronger feathered EDGES, never a full-screen\n', scene)
    scene.write_text(text)

    test = Path('src/game/data/rarityPouchImpact.test.ts')
    text = test.read_text()
    text = replace_once(text,
        'expect(profile.vignettePulses).toBeGreaterThanOrEqual(1);',
        'expect(profile.vignettePulses).toBe(index + 1);', test)
    text = replace_once(text,
        'expect(secret.vignettePulses).toBe(2);',
        'expect(secret.vignettePulses).toBe(3);', test)
    test.write_text(text)
    print('Patched shell background, static-art scene switching, rarity profiles, vignette bands, and profile tests.', flush=True)


async def verify_browser() -> None:
    from playwright.async_api import async_playwright
    root = Path('viewport-impact-qa')
    root.mkdir(exist_ok=True)
    errors = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
        try:
            wide = await browser.new_context(viewport={'width': 1848, 'height': 635}, locale='en-US')
            page = await wide.new_page()
            page.on('pageerror', lambda err: errors.append(str(err)))
            await page.goto('http://127.0.0.1:4173/', wait_until='domcontentloaded', timeout=60000)
            await page.wait_for_timeout(3500)
            data = await page.evaluate('''() => {
              const shell = document.getElementById('game-shell');
              const game = document.getElementById('game');
              const backdrop = getComputedStyle(shell).backgroundImage;
              const rect = game.getBoundingClientRect();
              return {backdrop, gameWidth:rect.width, gameHeight:rect.height,
                shellWidth:shell.getBoundingClientRect().width,
                imageUrl:getComputedStyle(shell).getPropertyValue('--shell-backdrop-url')};
            }''')
            print('ULTRAWIDE', json.dumps(data), flush=True)
            assert data['shellWidth'] > data['gameWidth'] + 100, data
            assert data['gameWidth'] <= data['gameHeight'] * 2 + 1, data
            assert 'opening-bg.webp' in data['backdrop'], data
            assert not errors, errors
            await page.screenshot(path=str(root/'ultrawide-1848x635.png'))
            await wide.close()

            # Real drag rather than a rarity-forcing debug shortcut; video captures
            # the short, stronger edge pulses without patching Math.random.
            for label, charged in (('basic', False), ('charged', True)):
                context = await browser.new_context(viewport={'width':1600,'height':900},
                    locale='ru-RU', record_video_dir=str(root),
                    record_video_size={'width':1600,'height':900})
                page = await context.new_page()
                page.on('pageerror', lambda err: errors.append(str(err)))
                await page.goto('http://127.0.0.1:4173/', wait_until='domcontentloaded', timeout=60000)
                await page.locator('.mpt-debug-panel__meta strong').wait_for(timeout=75000)
                await page.wait_for_timeout(1500)
                await page.evaluate('''() => {
                  const k='mystery-pocket-tech.save'; const s=JSON.parse(localStorage.getItem(k));
                  Object.assign(s,{version:5,chips:450,totalOpens:17,signal:0,
                    overchargeHundredths:100,activeLootPoolId:'y2k-essentials',pendingReveal:null,
                    onboarding:{primaryCompleted:true,firstRevealReceipt:null},
                    discoveredStandard:[],discoveredSecrets:[],stats:{duplicates:0,hiddenPockets:0}});
                  localStorage.setItem(k,JSON.stringify(s));
                }''')
                await page.reload(wait_until='domcontentloaded',timeout=60000)
                await page.locator('.mpt-debug-panel__meta strong').wait_for(timeout=75000)
                await page.wait_for_timeout(1600)
                await page.screenshot(path=str(root/f'{label}-before.png'),
                    style='.mpt-debug-panel {visibility:hidden!important}')
                if charged:
                    await page.mouse.click(163,386)
                    await page.wait_for_timeout(550)
                before = await page.evaluate("JSON.parse(localStorage.getItem('mystery-pocket-tech.save'))")
                await page.mouse.move(601,226)
                await page.mouse.down()
                await page.mouse.move(770,226,steps=9)
                await page.mouse.move(1003,227,steps=13)
                await page.mouse.up()
                for tick in range(30):
                    await page.wait_for_timeout(400)
                    state = await page.evaluate("JSON.parse(localStorage.getItem('mystery-pocket-tech.save'))")
                    if state.get('discoveredStandard') and not state.get('pendingReveal'):
                        break
                await page.screenshot(path=str(root/f'{label}-after.png'),
                    style='.mpt-debug-panel {visibility:hidden!important}')
                print('TEAR', label, 'before', before.get('totalOpens'), 'after',
                    state.get('totalOpens'), 'found', state.get('discoveredStandard'),
                    'pending', bool(state.get('pendingReveal')), 'errors', errors, flush=True)
                assert state.get('discoveredStandard'), (label, state)
                assert state.get('totalOpens') == before.get('totalOpens') + 1, (label,state)
                assert not state.get('pendingReveal'), label
                await context.close()
            assert not errors, errors
        finally:
            await browser.close()


if __name__ == '__main__':
    if sys.argv[1:] == ['patch']:
        patch()
    elif sys.argv[1:] == ['qa']:
        asyncio.run(verify_browser())
    else:
        raise SystemExit('usage: patch | qa')
