"""Capture-only probe for dropping WebGL frames in canvas.captureStream."""
import json
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('probe-output');OUT.mkdir(exist_ok=True)
STATE={'version':5,'discoveredStandard':[],'discoveredSecrets':[],'chips':450,
       'signal':0,'overchargeHundredths':100,'activeLootPoolId':'y2k-essentials',
       'totalOpens':17,'pendingReveal':None,'onboarding':{'primaryCompleted':True,'firstRevealReceipt':None},
       'muted':False,'stats':{'duplicates':0,'hiddenPockets':0}}
report=[]
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True,args=[
        '--enable-gpu','--ignore-gpu-blocklist','--use-angle=metal','--enable-webgl',
        '--disable-frame-rate-limit','--disable-gpu-vsync','--autoplay-policy=no-user-gesture-required',
        '--disable-background-timer-throttling','--disable-renderer-backgrounding'])
    for mode in ('auto60','manual0'):
        ctx=browser.new_context(locale='ru-RU',viewport={'width':960,'height':540},device_scale_factor=1,accept_downloads=True)
        ctx.add_init_script('(()=>{const s='+json.dumps(STATE)+';localStorage.setItem("mystery-pocket-tech.save",JSON.stringify(s));sessionStorage.setItem("mystery-pocket-tech.debug-language","ru")})()')
        page=ctx.new_page()
        page.goto('http://127.0.0.1:8765/',wait_until='domcontentloaded',timeout=90000)
        page.wait_for_function('document.querySelector("#startup-preload")?.dataset.state === "hidden"',timeout=90000)
        page.wait_for_timeout(2400)
        page.screenshot(path=str(OUT/(mode+'-before.png')))
        begin=page.evaluate('''mode=>{const c=document.querySelector('#game canvas');
            const track=c.captureStream(mode==='manual0'?0:60).getVideoTracks()[0];
            const rec=new MediaRecorder(new MediaStream([track]),{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:5000000});
            window.__t=track;window.__r=rec;window.__c=[];window.__times=[];
            rec.ondataavailable=e=>{if(e.data.size)window.__c.push(e.data)};
            window.__done=new Promise((res,rej)=>{rec.onstop=res;rec.onerror=e=>rej(e.error)});
            window.__active=true;window.__started=performance.now();let prev=0;
            const tick=t=>{if(!window.__active)return;if(prev)window.__times.push(t-prev);prev=t;
              if(mode==='manual0')track.requestFrame();requestAnimationFrame(tick)};
            requestAnimationFrame(tick);rec.start(500);
            return {started:window.__started,mode,requestFrame:typeof track.requestFrame}}''',mode)
        page.wait_for_timeout(400)
        drag_begin=page.evaluate('performance.now()')
        page.mouse.move(358,127)
        page.mouse.down()
        page.mouse.move(607,127,steps=48)
        page.mouse.up()
        drag_end=page.evaluate('performance.now()')
        page.wait_for_timeout(2400)
        with page.expect_download(timeout=60000) as download:
            stats=page.evaluate('''async name=>{window.__active=false;window.__r.stop();await window.__done;
                const blob=new Blob(window.__c,{type:window.__r.mimeType});const u=URL.createObjectURL(blob);
                const a=document.createElement('a');a.href=u;a.download=name;a.click();a.remove();
                const times=window.__times;return {bytes:blob.size,elapsedMs:performance.now()-window.__started,
                  rafFrames:times.length,over33ms:times.filter(v=>v>33).length,maxGapMs:Math.max(...times,0)}}''',mode+'.webm')
        filename=OUT/(mode+'.webm');download.value.save_as(str(filename))
        raw=subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',str(filename)])
        frames=[float(f['best_effort_timestamp_time']) for f in json.loads(raw)['frames'] if 'best_effort_timestamp_time' in f]
        start=(drag_begin-begin['started'])/1000;end=(drag_end-begin['started'])/1000
        during=[t for t in frames if start<=t<=end]
        item={'mode':mode,'record':stats,'gesture':{'start':start,'end':end,'seconds':end-start},
              'encodedFrames':len(frames),'firstLast':[frames[0],frames[-1]],
              'framesDuringGesture':len(during),'gestureFPS':len(during)/(end-start) if end>start else 0,
              'bigGaps':[[round(frames[i],3),round(frames[i+1]-frames[i],3)] for i in range(len(frames)-1) if frames[i+1]-frames[i]>.16],
              'reward':page.evaluate('''()=>{const s=JSON.parse(localStorage.getItem('mystery-pocket-tech.save'));return {pending:!!s.pendingReveal,totalOpens:s.totalOpens}}''')}
        report.append(item)
        page.screenshot(path=str(OUT/(mode+'-after.png')))
        print('FRAME_PROBE',json.dumps(item),flush=True)
        ctx.close()
    browser.close()
(OUT/'manual-frame-diagnostics.json').write_text(json.dumps(report,indent=2))
