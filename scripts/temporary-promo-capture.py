"""Temporary capture-only browser script. Never merge this or the workflow into main."""
from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess
import time

from playwright.sync_api import sync_playwright

OUT = Path('promo-output')
OUT.mkdir(exist_ok=True)
BASE = 'http://127.0.0.1:8765/'
SAVE_KEY = 'mystery-pocket-tech.save'
SCENARIOS = [('epic-phone', 7.8), ('legendary', 8.4), ('hidden-pocket', 10.0)]


def run(*args):
    return subprocess.run(args, check=True, text=True, capture_output=True)


def probe(path):
    return json.loads(run('ffprobe', '-v', 'error', '-show_entries',
                          'format=duration:stream=codec_type,codec_name,width,height',
                          '-of', 'json', str(path)).stdout)


def wait_ready(page):
    page.wait_for_function("document.querySelector('#startup-preload')?.dataset.state === 'hidden'", timeout=90000)
    page.wait_for_timeout(1800)


def fresh_context(browser, lang):
    context = browser.new_context(locale='ru-RU' if lang == 'ru' else 'en-US',
                                  viewport={'width': 1920, 'height': 1080},
                                  device_scale_factor=1, reduced_motion='no-preference')
    # Entirely local test fixture; no cloud/real-user save or reward tables are modified.
    context.add_init_script('''(lang) => {
      if (window.location.hostname !== '127.0.0.1') return;
      if (!sessionStorage.getItem('signal.capture.fixtured')) {
        const state = {
          version: 5, discoveredStandard: [], discoveredSecrets: [], chips: 450,
          signal: 0, overchargeHundredths: 100, activeLootPoolId: 'y2k-essentials',
          totalOpens: 17, pendingReveal: null,
          onboarding: { primaryCompleted: true, firstRevealReceipt: null },
          muted: false, stats: { duplicates: 0, hiddenPockets: 0 }
        };
        localStorage.setItem('mystery-pocket-tech.save', JSON.stringify(state));
        sessionStorage.setItem('signal.capture.fixtured', '1');
      }
      sessionStorage.setItem('mystery-pocket-tech.debug-language', lang);
      sessionStorage.setItem('mystery-pocket-tech.debug-panel-collapsed', '1');
    }''', lang)
    return context


def validate_reward(page, scenario):
    page.wait_for_function('''() => {
      const s = JSON.parse(localStorage.getItem('mystery-pocket-tech.save') || '{}');
      return !!s.pendingReveal || s.totalOpens > 17;
    }''', timeout=12000)
    state = page.evaluate("() => JSON.parse(localStorage.getItem('mystery-pocket-tech.save'))")
    pending = state.get('pendingReveal')
    if pending:
        print('PENDING', scenario, json.dumps({'rarity': pending['standard']['rarity'],
              'item': pending['standard']['collectibleId'], 'hiddenPocket': pending['hiddenPocket']},
              ensure_ascii=False), flush=True)
        if scenario == 'legendary':
            assert pending['standard']['rarity'] == 'legendary', pending
        if scenario == 'epic-phone':
            assert pending['standard']['rarity'] == 'epic', pending
        if scenario == 'hidden-pocket':
            assert pending['hiddenPocket'] is not None, pending
    elif scenario == 'hidden-pocket':
        assert state['discoveredSecrets'], state
    elif scenario == 'legendary':
        assert any(item.endswith('-legendary') for item in state['discoveredStandard']), state
    elif scenario == 'epic-phone':
        assert any(item.endswith('-epic') for item in state['discoveredStandard']), state
    return pending or state


def capture_clip(page, folder, scenario, duration):
    clip = folder / f'{scenario}.mp4'
    cmd = ['ffmpeg', '-nostdin', '-y', '-hide_banner', '-loglevel', 'warning',
           '-thread_queue_size', '1024', '-f', 'x11grab', '-draw_mouse', '0',
           '-framerate', '30', '-video_size', '1920x1080', '-i', ':99.0+0,0',
           '-thread_queue_size', '1024', '-f', 'pulse', '-i', 'promo.monitor',
           '-t', str(duration), '-map', '0:v:0', '-map', '1:a:0',
           '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '21',
           '-pix_fmt', 'yuv420p', '-r', '30',
           '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2',
           '-movflags', '+faststart', str(clip)]
    log_path = folder / f'{scenario}-ffmpeg.log'
    with log_path.open('w') as log:
        proc = subprocess.Popen(cmd, stdin=subprocess.DEVNULL, stdout=log, stderr=log)
        start = time.monotonic()
        time.sleep(1.0)
        assert proc.poll() is None, f'ffmpeg exited before capture: {log_path.read_text()}'
        # The star is at approximately (715, 253) in the 1920x1080 game viewport.
        # Perform a real pointer drag; do not stage a pending reward/replay a reveal.
        page.mouse.move(716, 253)
        page.mouse.down()
        for i in range(1, 43):
            page.mouse.move(716 + 495 * i / 42, 253 + (i % 4 == 0) * 2)
            time.sleep(0.019)
        page.mouse.up()
        reward = validate_reward(page, scenario)
        page.wait_for_timeout(3400)
        page.screenshot(path=str(folder / f'{scenario}-reveal.png'))
        if scenario == 'hidden-pocket':
            # The secret appears as the hero item in the normal two-item carousel.
            page.wait_for_timeout(1300)
            page.screenshot(path=str(folder / f'{scenario}-secret.png'))
        remaining = duration - (time.monotonic() - start)
        if remaining > 0:
            time.sleep(remaining)
        try:
            proc.wait(timeout=35)
        except subprocess.TimeoutExpired:
            proc.kill()
            raise AssertionError(f'ffmpeg hung: {log_path.read_text()}')
    assert proc.returncode == 0, f'ffmpeg exited {proc.returncode}: {log_path.read_text()}'
    info = probe(clip)
    assert any(stream['codec_type'] == 'audio' for stream in info['streams']), info
    assert any(stream['codec_type'] == 'video' and stream['width'] == 1920
               and stream['height'] == 1080 for stream in info['streams']), info
    assert float(info['format']['duration']) > duration - 0.8, info
    print('RECORDED', clip, info['format']['duration'], flush=True)
    return clip, reward


records = []
errors = []
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=False,
        args=['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle',
              '--use-angle=swiftshader', '--enable-webgl',
              '--autoplay-policy=no-user-gesture-required', '--kiosk',
              '--window-size=1920,1080', '--window-position=0,0'])
    for lang in ('ru', 'en'):
        folder = OUT / lang
        folder.mkdir(exist_ok=True)
        clips = []
        for scenario, duration in SCENARIOS:
            context = fresh_context(browser, lang)
            page = context.new_page()
            page.on('pageerror', lambda err: errors.append(str(err)))
            page.on('console', lambda msg: errors.append('console: '+msg.text)
                    if msg.type == 'error' else None)
            page.goto(BASE, wait_until='domcontentloaded', timeout=90000)
            wait_ready(page)
            assert page.locator('html').get_attribute('lang') == lang
            page.add_style_tag(content='.mpt-debug-panel { display:none !important; }')
            page.evaluate('''mode => {
              sessionStorage.setItem('signal.capture.reward', mode);
              sessionStorage.setItem('signal.capture.random-index', '0');
            }''', scenario)
            page.screenshot(path=str(folder / f'{scenario}-before.png'))
            clip, reward = capture_clip(page, folder, scenario, duration)
            clips.append(clip)
            records.append({'language': lang, 'scenario': scenario, 'reward': reward,
                            'clip': str(clip)})
            context.close()
        concat_path = folder / 'concat.txt'
        concat_path.write_text(''.join(f"file '{clip.resolve()}'\n" for clip in clips))
        final = OUT / f'signal-2000-promo-{lang}.mp4'
        run('ffmpeg', '-nostdin', '-y', '-hide_banner', '-loglevel', 'error',
            '-f', 'concat', '-safe', '0', '-i', str(concat_path),
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p',
            '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
            '-movflags', '+faststart', str(final))
        info = probe(final)
        assert float(info['format']['duration']) >= 25, info
        assert any(s['codec_type'] == 'audio' for s in info['streams']), info
        print('FINAL', final, info, flush=True)
    browser.close()
(OUT / 'manifest.json').write_text(json.dumps({'sourceMainSha': os.getenv('SOURCE_MAIN_SHA'),
    'note': 'Capture-only deterministic RNG; real pointer drags and browser audio',
    'records': records, 'errors': errors}, ensure_ascii=False, indent=2))
print('ERRORS', errors[:10], flush=True)
assert not errors, errors[:10]
