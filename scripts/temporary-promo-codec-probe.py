"""Temporary CI-only probe: native Chrome canvas recording on macOS Metal."""
import json
import shutil
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path('probe-output')
OUT.mkdir(exist_ok=True)
STATE = {'version': 5, 'discoveredStandard': [], 'discoveredSecrets': [], 'chips': 450,
         'signal': 0, 'overchargeHundredths': 100, 'activeLootPoolId': 'y2k-essentials',
         'totalOpens': 17, 'pendingReveal': None,
         'onboarding': {'primaryCompleted': True, 'firstRevealReceipt': None},
         'muted': False, 'stats': {'duplicates': 0, 'hiddenPockets': 0}}
MIMES = ['video/mp4;codecs="avc1.42E01E"', 'video/mp4;codecs=avc1',
         'video/webm;codecs=vp8', 'video/webm;codecs=vp9']
report = {'probes': [], 'errors': []}
with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True, args=[
        '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal', '--enable-webgl',
        '--disable-frame-rate-limit', '--disable-gpu-vsync',
        '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding'])
    for width, height in [(960, 540), (640, 360)]:
        ctx = browser.new_context(locale='ru-RU', viewport={'width': width, 'height': height},
                                  device_scale_factor=1, accept_downloads=True)
        ctx.add_init_script('(()=>{const s=' + json.dumps(STATE) + ';localStorage.setItem("mystery-pocket-tech.save",JSON.stringify(s));sessionStorage.setItem("mystery-pocket-tech.debug-language","ru")})()')
        page = ctx.new_page()
        page.on('pageerror', lambda e: report['errors'].append(str(e)))
        page.goto('http://127.0.0.1:8765/', wait_until='domcontentloaded', timeout=90000)
        page.wait_for_function('document.querySelector("#startup-preload")?.dataset.state === "hidden"', timeout=90000)
        page.wait_for_timeout(900)
        available = page.evaluate('(ms)=>Object.fromEntries(ms.map(m=>[m,MediaRecorder.isTypeSupported(m)]))', MIMES)
        print('SUPPORTED', width, available, flush=True)
        formats = [m for m in MIMES if available[m]]
        # First compatible H.264 and VP8, at both sizes; avoid redundant codec aliases.
        selected = []
        for mime in formats:
            if ('mp4' in mime and any('mp4' in x for x in selected)) or ('vp8' in mime and any('vp8' in x for x in selected)):
                continue
            if 'vp9' in mime:
                continue
            selected.append(mime)
        for mime in selected:
            page.reload(wait_until='domcontentloaded')
            page.wait_for_function('document.querySelector("#startup-preload")?.dataset.state === "hidden"', timeout=90000)
            page.wait_for_timeout(900)
            recording = page.evaluate('''(mime)=>{const c=document.querySelector('#game canvas');
                const gl=c.getContext('webgl');const ext=gl.getExtension('WEBGL_debug_renderer_info');
                const renderer=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
                const r=new MediaRecorder(c.captureStream(60),{mimeType:mime,videoBitsPerSecond:3500000});
                window.__chunks=[];r.ondataavailable=e=>{if(e.data.size)window.__chunks.push(e.data)};
                window.__recDone=new Promise((resolve,reject)=>{r.onstop=resolve;r.onerror=e=>reject(e.error)});
                window.__rec=r;window.__times=[];window.__measure=true;let prev=0;
                const frame=t=>{if(!window.__measure)return;if(prev)window.__times.push(t-prev);prev=t;requestAnimationFrame(frame)};
                requestAnimationFrame(frame);r.start(500);
                return {renderer,width:c.width,height:c.height,actualMime:r.mimeType}}''', mime)
            page.wait_for_timeout(300)
            page.mouse.move(round(width * 0.373), round(height * 0.235))
            page.mouse.down()
            page.mouse.move(round(width * 0.633), round(height * 0.235), steps=32)
            page.mouse.up()
            page.wait_for_timeout(1800)
            ext = 'mp4' if 'mp4' in mime else 'webm'
            slug = ('h264' if ext == 'mp4' else 'vp8') + '-' + str(width)
            with page.expect_download(timeout=60000) as dl:
                stats = page.evaluate('''async(name)=>{window.__measure=false;window.__rec.stop();await window.__recDone;
                    const blob=new Blob(window.__chunks,{type:window.__rec.mimeType});const url=URL.createObjectURL(blob);
                    const a=document.createElement('a');a.href=url;a.download=name;a.click();a.remove();
                    const d=window.__times;return {bytes:blob.size,rafFrames:d.length,
                      elapsedMs:d.reduce((a,b)=>a+b,0),over33ms:d.filter(x=>x>33).length,
                      maxGapMs:Math.max(...d,0)}}''', slug + '.' + ext)
            dest = OUT / (slug + '.' + ext)
            dl.value.save_as(str(dest))
            ffprobe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0',
                                      '-count_frames', '-show_entries', 'stream=nb_read_frames,width,height,codec_name:format=duration',
                                      '-of', 'json', str(dest)], capture_output=True, text=True)
            probe = {'file': dest.name, 'mime': mime, **recording, **stats,
                     'ffprobe': json.loads(ffprobe.stdout) if ffprobe.returncode == 0 else ffprobe.stderr}
            report['probes'].append(probe)
            print('CODEC_PROBE', json.dumps(probe), flush=True)
        ctx.close()
    browser.close()
(OUT / 'codec-diagnostics.json').write_text(json.dumps(report, indent=2))
print('CODEC_REPORT', json.dumps(report), flush=True)
