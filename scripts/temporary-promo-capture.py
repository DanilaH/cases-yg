"""Temporary store footage capture: browser-rendered gameplay and real browser audio.

This file only exists on a capture branch and must never be merged into main.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import re
import subprocess
import time
from playwright.sync_api import sync_playwright

OUT = Path('promo-output')
OUT.mkdir(exist_ok=True)
BASE = 'http://127.0.0.1:8765/'
SCENARIOS = [
    ('legendary', 'Force Legendary (Charged)'),
    ('hidden-pocket', 'Force Hidden Pocket'),
    ('epic-phone', 'Force Epic Phone'),
]

def run(*args, check=True):
    return subprocess.run(args, capture_output=True, text=True, check=check)

def probe(path):
    data = run('ffprobe', '-v', 'error', '-show_entries',
               'format=duration:stream=codec_type,codec_name,width,height',
               '-of', 'json', str(path))
    return json.loads(data.stdout)

def wait_ready(page):
    page.wait_for_function("document.querySelector('#startup-preload')?.dataset.state === 'hidden'", timeout=90000)
    page.wait_for_timeout(1700)

def stage(page, scenario, button):
    page.locator('.mpt-debug-panel button').filter(has_text=button).first.evaluate('(n) => n.click()')
    page.wait_for_function("(name) => {try { const s=JSON.parse(localStorage.getItem('mystery-pocket-tech.save')||'{}'); return !!s.pendingReveal && String(s.pendingReveal.id||'').includes('debug-'+name+'-') }catch{return false}}", scenario, timeout=20000)
    page.wait_for_timeout(500)
    wait_ready(page)
    state = page.evaluate("() => JSON.parse(localStorage.getItem('mystery-pocket-tech.save'))")
    pending = state['pendingReveal']
    assert pending is not None, (scenario, state)
    assert (pending['hiddenPocket'] is not None) == (scenario == 'hidden-pocket'), (scenario, pending['hiddenPocket'])
    if scenario == 'legendary':
        assert pending['standard']['rarity'] == 'legendary', pending['standard']
    if scenario == 'epic-phone':
        assert pending['standard']['rarity'] == 'epic', pending['standard']
    print('STAGED', scenario, 'item', pending['standard']['collectibleId'],
          'secret', pending['hiddenPocket'], 'language', page.locator('html').get_attribute('lang'), flush=True)
    page.add_style_tag(content='.mpt-debug-panel { display:none !important; }')
    return pending

def capture_clip(page, folder, scenario):
    clip = folder / f'{scenario}.mp4'
    cmd = [
        'ffmpeg', '-nostdin', '-y', '-hide_banner', '-loglevel', 'warning',
        '-thread_queue_size', '1024', '-f', 'x11grab', '-draw_mouse', '0',
        '-framerate', '30', '-video_size', '1920x1080', '-i', ':99.0+0,0',
        '-thread_queue_size', '1024', '-f', 'pulse', '-i', 'promo.monitor',
        '-t', '8.0', '-map', '0:v:0', '-map', '1:a:0',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '22',
        '-pix_fmt', 'yuv420p', '-r', '30',
        '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2',
        '-movflags', '+faststart', str(clip)
    ]
    with (folder / f'{scenario}-ffmpeg.log').open('w') as log:
        proc = subprocess.Popen(cmd, stdin=subprocess.DEVNULL, stdout=log, stderr=log)
        time.sleep(0.8)
        assert proc.poll() is None, f'ffmpeg exited before capture: {log.name}'
        page.mouse.move(716, 253)
        page.mouse.down()
        for i in range(1, 42):
            page.mouse.move(716 + 530 * i / 41, 253 + 3 * (i % 3 == 0))
            time.sleep(0.016)
        page.mouse.up()
        page.wait_for_timeout(3200)
        page.screenshot(path=str(folder / f'{scenario}-reveal.png'))
        page.wait_for_timeout(1200)
        if scenario == 'hidden-pocket':
            page.mouse.click(460, 510)
            page.wait_for_timeout(450)
            page.screenshot(path=str(folder / f'{scenario}-carousel.png'))
        try:
            proc.wait(timeout=35)
        except subprocess.TimeoutExpired:
            proc.kill()
            raise AssertionError(f'ffmpeg hung: {log.name}')
    assert proc.returncode == 0, f'ffmpeg error {proc.returncode} {log.name}'
    info = probe(clip)
    streams = info['streams']
    assert any(s['codec_type'] == 'audio' for s in streams), info
    assert any(s['codec_type'] == 'video' for s in streams), info
    assert float(info['format']['duration']) > 6, info
    print('RECORDED', str(clip), info['format']['duration'], flush=True)
    return clip

records = []
errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=False,
        args=['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle',
              '--use-angle=swiftshader', '--enable-webgl',
              '--autoplay-policy=no-user-gesture-required', '--kiosk',
              '--window-size=1920,1080', '--window-position=0,0'],
    )
    for lang, locale in [('ru', 'ru-RU'), ('en', 'en-US')]:
        folder = OUT / lang
        folder.mkdir(exist_ok=True)
        context = browser.new_context(locale=locale, viewport={'width':1920, 'height':1080}, device_scale_factor=1)
        context.add_init_script(f"sessionStorage.setItem('mystery-pocket-tech.debug-language','{lang}'); sessionStorage.setItem('mystery-pocket-tech.debug-panel-collapsed','0');")
        page = context.new_page()
        page.on('pageerror', lambda err: errors.append(str(err)))
        page.on('console', lambda msg: errors.append('console: '+msg.text) if msg.type == 'error' else None)
        page.goto(BASE, wait_until='domcontentloaded')
        wait_ready(page)
        assert page.locator('html').get_attribute('lang') == lang
        clips = []
        for scenario, button in SCENARIOS:
            pending = stage(page, scenario, button)
            page.screenshot(path=str(folder / f'{scenario}-before.png'))
            clip = capture_clip(page, folder, scenario)
            clips.append(clip)
            records.append({'language': lang, 'scenario': scenario,
                            'item': pending['standard']['collectibleId'],
                            'secret': pending['hiddenPocket'], 'clip': str(clip)})
            # Restore debug panel for the next staged state.
            page.add_style_tag(content='.mpt-debug-panel { display:block !important; visibility:hidden !important; }')
        concat_path = folder / 'concat.txt'
        concat_path.write_text(''.join(f"file '{clip.resolve()}'\n" for clip in clips))
        final = OUT / f'signal-2000-promo-{lang}.mp4'
        run('ffmpeg', '-nostdin', '-y', '-hide_banner', '-loglevel', 'error',
            '-f', 'concat', '-safe', '0', '-i', str(concat_path),
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p',
            '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
            '-movflags', '+faststart', str(final))
        info = probe(final)
        assert float(info['format']['duration']) >= 20, info
        print('FINAL', final, info, flush=True)
        context.close()
    browser.close()
(OUT / 'manifest.json').write_text(json.dumps({'sourceMainSha': os.getenv('SOURCE_MAIN_SHA'),
    'note': 'Staged deterministic rewards, authentic browser-rendered gameplay and sound',
    'records': records, 'errors': errors}, ensure_ascii=False, indent=2))
print('ERRORS', errors[:10], flush=True)
assert not errors, errors[:10]
