"""Temporary, non-production proof of gameplay video+game audio from Chrome canvas."""
import json
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('probe-output');OUT.mkdir(exist_ok=True)
STATE={'version':5,'discoveredStandard':[],'discoveredSecrets':[],'chips':450,
       'signal':0,'overchargeHundredths':100,'activeLootPoolId':'y2k-essentials',
       'totalOpens':17,'pendingReveal':None,'onboarding':{'primaryCompleted':True,'firstRevealReceipt':None},
       'muted':False,'stats':{'duplicates':0,'hiddenPockets':0}}
BOOT_SCRIPT='''(()=>{
 const Native=window.AudioContext;
 if(!Native)return;
 window.AudioContext=class extends Native {
   constructor(...args){super(...args);window.__signalCaptureAudio=this.createMediaStreamDestination();}
 };
 const original=AudioNode.prototype.connect;
 AudioNode.prototype.connect=function(dest,...args){
   const result=original.call(this,dest,...args);
   const mirror=window.__signalCaptureAudio;
   if(mirror&&this.context===mirror.context&&dest===this.context.destination)
      original.call(this,mirror);
   return result;
 };
})()'''
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True,args=[
        '--enable-gpu','--ignore-gpu-blocklist','--use-angle=metal','--enable-webgl',
        '--disable-frame-rate-limit','--disable-gpu-vsync',
        '--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling',
        '--disable-renderer-backgrounding'])
    ctx=browser.new_context(locale='ru-RU',viewport={'width':960,'height':540},device_scale_factor=1,accept_downloads=True)
    ctx.add_init_script(BOOT_SCRIPT)
    ctx.add_init_script('(()=>{const s='+json.dumps(STATE)+';localStorage.setItem("mystery-pocket-tech.save",JSON.stringify(s));sessionStorage.setItem("mystery-pocket-tech.debug-language","ru")})()')
    page=ctx.new_page();errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
    page.goto('http://127.0.0.1:8765/',wait_until='domcontentloaded',timeout=90000)
    page.wait_for_function('document.querySelector("#startup-preload")?.dataset.state === "hidden"',timeout=90000)
    page.wait_for_timeout(2400)
    tracks=page.evaluate('''()=>({tracks:window.__signalCaptureAudio?.stream.getAudioTracks().map(t=>({state:t.readyState,enabled:t.enabled}))||[],
                         contextState:window.__signalCaptureAudio?.context.state||'absent',
                         canRecord:MediaRecorder.isTypeSupported('video/webm;codecs="vp8,opus"')})''')
    assert tracks['tracks'] and tracks['canRecord'],tracks
    page.screenshot(path=str(OUT/'before.png'))
    page.evaluate('''()=>{const canvas=document.querySelector('#game canvas');
      const track=canvas.captureStream(0).getVideoTracks()[0];
      const stream=new MediaStream([track,...window.__signalCaptureAudio.stream.getAudioTracks()]);
      const rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs="vp8,opus"',videoBitsPerSecond:6000000,audioBitsPerSecond:160000});
      window.__chunks=[];rec.ondataavailable=e=>{if(e.data.size)window.__chunks.push(e.data)};
      window.__recDone=new Promise((resolve,reject)=>{rec.onstop=resolve;rec.onerror=e=>reject(e.error)});
      window.__rec=rec;window.__active=true;window.__d=[];let last=0;
      const tick=t=>{if(!window.__active)return;if(last)window.__d.push(t-last);last=t;
        track.requestFrame();requestAnimationFrame(tick)};
      requestAnimationFrame(tick);rec.start(500)}''')
    page.wait_for_timeout(400)
    page.mouse.move(358,127);page.mouse.down();page.mouse.move(607,127,steps=48);page.mouse.up()
    page.wait_for_timeout(2500)
    with page.expect_download(timeout=60000) as download:
      stats=page.evaluate('''async()=>{window.__active=false;window.__rec.stop();await window.__recDone;
        const b=new Blob(window.__chunks,{type:window.__rec.mimeType});const a=document.createElement('a');
        a.href=URL.createObjectURL(b);a.download='signal-macos-video-with-audio.webm';a.click();a.remove();
        return {bytes:b.size,rafFrames:window.__d.length,over33ms:window.__d.filter(x=>x>33).length}}''')
    dest=OUT/'signal-macos-video-with-audio.webm';download.value.save_as(str(dest))
    page.screenshot(path=str(OUT/'after.png'))
    reward=page.evaluate('''()=>{const s=JSON.parse(localStorage.getItem('mystery-pocket-tech.save'));return {pending:!!s.pendingReveal,totalOpens:s.totalOpens}}''')
    browser.close()
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_type,codec_name,width,height,nb_frames:format=duration','-of','json',str(dest)]))
volume=subprocess.run(['ffmpeg','-hide_banner','-loglevel','info','-i',str(dest),'-af','volumedetect','-vn','-f','null','-'],capture_output=True,text=True)
audio=[line.strip() for line in volume.stderr.splitlines() if 'mean_volume' in line or 'max_volume' in line]
report={'tracks':tracks,'capture':stats,'ffprobe':probe,'audio':audio,'reward':reward,'errors':errs}
(OUT/'audio-diagnostics.json').write_text(json.dumps(report,indent=2))
print('AUDIO_PROBE',json.dumps(report),flush=True)
assert not errs,errs
assert any(s['codec_type']=='audio' for s in probe['streams']),probe
assert any(s['codec_type']=='video' for s in probe['streams']),probe
