"""Temporary capture-only Russian store promo. Never merge this script into main."""
import json
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path("promo-output")
OUT.mkdir(exist_ok=True)
RAW = OUT / "signal-2000-legendary-secret-ru.webm"
FINAL = OUT / "signal-2000-legendary-secret-ru.mp4"
STATE = {
    "version": 5,
    "discoveredStandard": [],
    "discoveredSecrets": [],
    "chips": 450,
    "signal": 0,
    "overchargeHundredths": 100,
    "activeLootPoolId": "y2k-essentials",
    "totalOpens": 17,
    "pendingReveal": None,
    "onboarding": {"primaryCompleted": True, "firstRevealReceipt": None},
    "muted": False,
    "stats": {"duplicates": 0, "hiddenPockets": 0},
}
BOOT_SCRIPT = """(() => {
  const Native = window.AudioContext;
  if (!Native) return;
  window.AudioContext = class extends Native {
    constructor(...args) {
      super(...args);
      window.__signalContexts = (window.__signalContexts || 0) + 1;
      window.__signalCaptureAudio ||= this.createMediaStreamDestination();
    }
  };
  const original = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function(dest, ...args) {
    const result = original.call(this, dest, ...args);
    const mirror = window.__signalCaptureAudio;
    if (mirror && this.context === mirror.context && dest === this.context.destination) {
      window.__signalMirrorConnections = (window.__signalMirrorConnections || 0) + 1;
      original.call(this, mirror);
    }
    return result;
  };
})()"""

def ffprobe(path):
    return json.loads(subprocess.check_output([
        "ffprobe", "-v", "error",
        "-show_entries", "stream=codec_type,codec_name,width,height,avg_frame_rate,nb_frames:format=duration",
        "-of", "json", str(path),
    ]))

with sync_playwright() as p:
    browser = p.chromium.launch(
        channel="chrome",
        headless=True,
        args=[
            "--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=metal", "--enable-webgl",
            "--disable-frame-rate-limit", "--disable-gpu-vsync",
            "--autoplay-policy=no-user-gesture-required",
            "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
        ],
    )
    ctx = browser.new_context(
        locale="ru-RU",
        viewport={"width": 960, "height": 540},
        device_scale_factor=1,
        accept_downloads=True,
    )
    ctx.add_init_script(BOOT_SCRIPT)
    init = (
        "(() => { const s = " + json.dumps(STATE) + ";"
        "localStorage.setItem('mystery-pocket-tech.save', JSON.stringify(s));"
        "sessionStorage.setItem('mystery-pocket-tech.debug-language', 'ru');"
        "sessionStorage.setItem('mystery-pocket-tech.debug-panel-collapsed', '1');"
        "sessionStorage.setItem('signal.capture.reward', 'legendary-secret');"
        "sessionStorage.setItem('signal.capture.random-index', '0'); })()"
    )
    ctx.add_init_script(init)
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
    page.goto("http://127.0.0.1:8765/", wait_until="domcontentloaded", timeout=90000)
    page.wait_for_function(
        "document.querySelector('#startup-preload')?.dataset.state === 'hidden'",
        timeout=90000,
    )
    page.add_style_tag(content=".mpt-debug-panel { display:none !important; }")
    page.wait_for_timeout(1800)

    tracks = page.evaluate("""() => ({
      audio: window.__signalCaptureAudio?.stream.getAudioTracks().map(t => ({
        state: t.readyState, enabled: t.enabled
      })) || [],
      contextState: window.__signalCaptureAudio?.context.state || 'absent',
      contextsCreated: window.__signalContexts || 0,
      mirroredConnections: window.__signalMirrorConnections || 0,
      canRecord: MediaRecorder.isTypeSupported('video/webm;codecs="vp8,opus"')
    })""")
    assert tracks["audio"] and tracks["canRecord"], tracks

    page.evaluate("""() => {
      const canvas = document.querySelector('#game canvas');
      if (!canvas) throw Error('No Phaser canvas');
      const videoTrack = canvas.captureStream(0).getVideoTracks()[0];
      const stream = new MediaStream([
        videoTrack,
        ...window.__signalCaptureAudio.stream.getAudioTracks()
      ]);
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs="vp8,opus"',
        videoBitsPerSecond: 7000000,
        audioBitsPerSecond: 160000
      });
      window.__promoChunks = [];
      recorder.ondataavailable = e => { if (e.data.size) window.__promoChunks.push(e.data); };
      window.__promoDone = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = e => reject(e.error);
      });
      window.__promoRecorder = recorder;
      window.__promoActive = true;
      window.__promoIntervals = [];
      window.__promoStarted = performance.now();
      let previous = 0;
      const tick = t => {
        if (!window.__promoActive) return;
        if (previous) window.__promoIntervals.push(t - previous);
        previous = t;
        videoTrack.requestFrame();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      recorder.start(500);
    }""")

    # Establish the scene, select the charged pouch, then perform one real tear.
    page.wait_for_timeout(1000)
    page.mouse.click(92, 233)
    page.wait_for_timeout(900)
    page.mouse.move(358, 127)
    page.mouse.down()
    page.mouse.move(607, 127, steps=48)
    page.mouse.up()

    page.wait_for_function("""() => {
      const s = JSON.parse(localStorage.getItem('mystery-pocket-tech.save') || '{}');
      return Boolean(s.pendingReveal);
    }""", timeout=12000)
    reward = page.evaluate("""() => {
      const p = JSON.parse(localStorage.getItem('mystery-pocket-tech.save')).pendingReveal;
      return {
        rarity: p.standard.rarity,
        standardId: p.standard.collectibleId,
        secretId: p.hiddenPocket?.collectibleId || null
      };
    }""")
    assert reward["rarity"] == "legendary", reward
    assert reward["secretId"], reward

    # Keep the complete native reveal sequence and a readable result hold.
    page.wait_for_timeout(15500)
    with page.expect_download(timeout=60000) as download:
        stats = page.evaluate("""async () => {
          window.__promoActive = false;
          window.__promoRecorder.stop();
          await window.__promoDone;
          const blob = new Blob(window.__promoChunks, {type: window.__promoRecorder.mimeType});
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'signal-2000-legendary-secret-ru.webm';
          a.click();
          a.remove();
          const d = window.__promoIntervals;
          return {
            bytes: blob.size,
            elapsedMs: performance.now() - window.__promoStarted,
            rafFrames: d.length,
            over33ms: d.filter(v => v > 33).length,
            maxGapMs: Math.max(...d, 0)
          };
        }""")
    download.value.save_as(str(RAW))
    page.screenshot(path=str(OUT / "final-frame.png"))
    browser.close()

subprocess.run([
    "ffmpeg", "-nostdin", "-y", "-hide_banner", "-loglevel", "error",
    "-i", str(RAW),
    "-c:v", "libx264", "-preset", "medium", "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
    "-movflags", "+faststart", str(FINAL),
], check=True)
probe = ffprobe(FINAL)
duration = float(probe["format"]["duration"])
volume_run = subprocess.run([
    "ffmpeg", "-hide_banner", "-loglevel", "info", "-i", str(FINAL),
    "-af", "volumedetect", "-vn", "-f", "null", "-"
], capture_output=True, text=True)
volume = [
    line.strip() for line in volume_run.stderr.splitlines()
    if "mean_volume" in line or "max_volume" in line
]
video = next(s for s in probe["streams"] if s["codec_type"] == "video")
assert 15 <= duration <= 25, probe
assert video["width"] == 960 and video["height"] == 540, probe
assert any(s["codec_type"] == "audio" for s in probe["streams"]), probe
assert volume and all("-inf" not in line for line in volume), volume
assert not errors, errors[:10]
report = {
    "reward": reward,
    "tracks": tracks,
    "capture": stats,
    "probe": probe,
    "volume": volume,
    "errors": errors,
}
(OUT / "capture-report.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2)
)
print("FINAL_PROMO", json.dumps(report, ensure_ascii=False), flush=True)
