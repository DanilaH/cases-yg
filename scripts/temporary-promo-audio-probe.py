"""Temporary capture-only Russian store promo. Never merge this script into main."""
import json
import shutil
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path("promo-output")
OUT.mkdir(exist_ok=True)
AUDIO = OUT / "game-audio.webm"
FINAL = OUT / "signal-2000-legendary-secret-ru-smooth.mp4"
STATE = {
    "version": 5, "discoveredStandard": [], "discoveredSecrets": [], "chips": 450,
    "signal": 0, "overchargeHundredths": 100, "activeLootPoolId": "y2k-essentials",
    "totalOpens": 17, "pendingReveal": None,
    "onboarding": {"primaryCompleted": True, "firstRevealReceipt": None},
    "muted": False, "stats": {"duplicates": 0, "hiddenPockets": 0},
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

def probe(path):
    return json.loads(subprocess.check_output([
        "ffprobe", "-v", "error",
        "-show_entries", "stream=codec_type,codec_name,width,height,avg_frame_rate,nb_frames:format=duration",
        "-of", "json", str(path),
    ]))

with sync_playwright() as p:
    browser = p.chromium.launch(
        channel="chrome", headless=True,
        args=[
            "--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=metal", "--enable-webgl",
            "--disable-frame-rate-limit", "--disable-gpu-vsync",
            "--autoplay-policy=no-user-gesture-required",
            "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
        ],
    )
    ctx = browser.new_context(
        locale="ru-RU", viewport={"width": 960, "height": 540}, device_scale_factor=1,
        accept_downloads=True, record_video_dir=str(OUT), record_video_size={"width": 960, "height": 540},
    )
    ctx.add_init_script(BOOT_SCRIPT)
    ctx.add_init_script(
        "(() => { const s = " + json.dumps(STATE) + ";"
        "localStorage.setItem('mystery-pocket-tech.save', JSON.stringify(s));"
        "sessionStorage.setItem('mystery-pocket-tech.debug-language', 'ru');"
        "sessionStorage.setItem('mystery-pocket-tech.debug-panel-collapsed', '1');"
        "sessionStorage.setItem('signal.capture.reward', 'legendary-secret');"
        "sessionStorage.setItem('signal.capture.random-index', '0'); })()"
    )
    page = ctx.new_page()
    video_handle = page.video
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
    page.goto("http://127.0.0.1:8765/", wait_until="domcontentloaded", timeout=90000)
    page.wait_for_function(
        "document.querySelector('#startup-preload')?.dataset.state === 'hidden'", timeout=90000
    )
    page.add_style_tag(content=".mpt-debug-panel { display:none !important; }")
    page.wait_for_timeout(1800)

    # Warm the complete reveal pipeline in the same WebGL context before recording.
    # This compiles first-use shaders and allocates reveal/particle resources off-camera.
    page.mouse.click(92, 233)
    page.wait_for_timeout(700)
    page.mouse.move(358, 127)
    page.mouse.down()
    page.mouse.move(607, 127, steps=48)
    page.mouse.up()
    page.wait_for_function("""() => {
      const s = JSON.parse(localStorage.getItem('mystery-pocket-tech.save') || '{}');
      return Boolean(s.pendingReveal);
    }""", timeout=12000)
    page.wait_for_timeout(18000)
    page.mouse.click(480, 500)
    page.wait_for_function("""() => {
      const s = JSON.parse(localStorage.getItem('mystery-pocket-tech.save') || '{}');
      return !s.pendingReveal && s.totalOpens >= 18;
    }""", timeout=20000)
    page.wait_for_timeout(3000)
    page.evaluate("""() => {
      sessionStorage.setItem('signal.capture.reward', 'legendary-secret-second');
      sessionStorage.setItem('signal.capture.random-index', '0');
    }""")

    tracks = page.evaluate("""() => ({
      audio: window.__signalCaptureAudio?.stream.getAudioTracks().map(t => ({
        state: t.readyState, enabled: t.enabled
      })) || [],
      contextState: window.__signalCaptureAudio?.context.state || 'absent',
      contextsCreated: window.__signalContexts || 0,
      mirroredConnections: window.__signalMirrorConnections || 0,
      canRecord: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    })""")
    assert tracks["audio"] and tracks["canRecord"], tracks

    # Only audio is encoded inside the page. Video capture is owned by Playwright,
    # so reveal shaders/particles do not compete with an in-page video encoder.
    page.evaluate("""() => {
      const stream = new MediaStream(window.__signalCaptureAudio.stream.getAudioTracks());
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 160000
      });
      window.__audioChunks = [];
      recorder.ondataavailable = e => { if (e.data.size) window.__audioChunks.push(e.data); };
      window.__audioDone = new Promise((resolve, reject) => {
        recorder.onstop = resolve; recorder.onerror = e => reject(e.error);
      });
      window.__audioRecorder = recorder;
      window.__captureStarted = performance.now();
      window.__rafIntervals = [];
      window.__rafActive = true;
      let previous = 0;
      const tick = t => {
        if (!window.__rafActive) return;
        if (previous) window.__rafIntervals.push(t - previous);
        previous = t;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      recorder.start(500);
    }""")

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

    page.wait_for_timeout(15500)
    with page.expect_download(timeout=60000) as download:
        stats = page.evaluate("""async () => {
          window.__rafActive = false;
          window.__audioRecorder.stop();
          await window.__audioDone;
          const blob = new Blob(window.__audioChunks, {type: window.__audioRecorder.mimeType});
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'game-audio.webm';
          a.click(); a.remove();
          const d = window.__rafIntervals;
          return {
            audioBytes: blob.size,
            elapsedMs: performance.now() - window.__captureStarted,
            rafFrames: d.length,
            over33ms: d.filter(v => v > 33).length,
            maxRafGapMs: Math.max(...d, 0)
          };
        }""")
    download.value.save_as(str(AUDIO))
    page.screenshot(path=str(OUT / "final-frame-smooth.png"))
    ctx.close()
    browser.close()
    browser_video = Path(video_handle.path())

BROWSER_VIDEO = OUT / "browser-video.webm"
if browser_video != BROWSER_VIDEO:
    shutil.move(str(browser_video), BROWSER_VIDEO)

video_probe = probe(BROWSER_VIDEO)
audio_probe = probe(AUDIO)
video_duration = float(video_probe["format"]["duration"])
audio_duration = stats["elapsedMs"] / 1000
offset = max(0.0, video_duration - audio_duration)
duration = min(audio_duration, 24.8)

subprocess.run([
    "ffmpeg", "-nostdin", "-y", "-hide_banner", "-loglevel", "error",
    "-ss", f"{offset:.6f}", "-i", str(BROWSER_VIDEO), "-i", str(AUDIO),
    "-t", f"{duration:.6f}", "-map", "0:v:0", "-map", "1:a:0",
    "-vf", "fps=30", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
    "-movflags", "+faststart", str(FINAL),
], check=True)

final_probe = probe(FINAL)
final_duration = float(final_probe["format"]["duration"])
volume_run = subprocess.run([
    "ffmpeg", "-hide_banner", "-loglevel", "info", "-i", str(FINAL),
    "-af", "volumedetect", "-vn", "-f", "null", "-"
], capture_output=True, text=True)
volume = [
    line.strip() for line in volume_run.stderr.splitlines()
    if "mean_volume" in line or "max_volume" in line
]
video = next(s for s in final_probe["streams"] if s["codec_type"] == "video")
assert 15 <= final_duration <= 25, final_probe
assert video["width"] == 960 and video["height"] == 540, final_probe
assert video["avg_frame_rate"] == "30/1", final_probe
assert any(s["codec_type"] == "audio" for s in final_probe["streams"]), final_probe
assert volume and all("-inf" not in line for line in volume), volume
assert stats["maxRafGapMs"] <= 150, stats
assert not errors, errors[:10]

report = {
    "reward": reward, "tracks": tracks, "capture": stats,
    "browserVideo": video_probe, "audio": audio_probe, "final": final_probe,
    "trimOffset": offset, "volume": volume, "errors": errors,
}
(OUT / "capture-report-smooth.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2)
)
print("SMOOTH_PROMO", json.dumps(report, ensure_ascii=False), flush=True)
