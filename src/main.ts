import Phaser from 'phaser';
import '@fontsource/press-start-2p/cyrillic-400.css';
import '@fontsource/press-start-2p/latin-400.css';

import { createObservableAnalyticsAdapter } from './app/analyticsEvents';
import { setPlatformRuntime } from './app/runtime';
import { detectPreferredRuntimeArtFormat, setRuntimeArtFormat } from './app/runtimeArtFormat';
import { StartupPreloadController, createStartupPreloadDomView } from './app/startupPreload';
import {
  resolveGameCssSize,
  resolveInitialGameCssSize,
  resolveViewportState,
  shouldSyncGameBackingStore,
  type ViewportState,
} from './app/viewport';
import { createDebugPanel } from './debug/createDebugPanel';
import { getRuntimeSfxAssets } from './game/data/audioAssets';
import { BootScene } from './game/scenes/BootScene';
import { CollectionScene } from './game/scenes/CollectionScene';
import { FirstRunScene } from './game/scenes/FirstRunScene';
import { GuidanceScene } from './game/scenes/GuidanceScene';
import { OpeningScene } from './game/scenes/OpeningScene';
import { getGameAudio } from './game/systems/audio';
import { getBackingStoreSize } from './game/systems/renderDensity';
import { loadSettingsSafe } from './game/systems/settings';
import { getMessages } from './i18n';
import { shouldSuspendRuntimeLoop, type ActivityBlocker } from './platform/activity';
import { bootstrapPlatform } from './platform/yandex';
import './startupPreload.css';
import './styles.css';

const ACCENT_FONT_WARMUP_TEXT = 'CHIPS SIGNAL REWARD ЖЙЦУКЕН 0123';
const VIEWPORT_SETTLE_DELAYS_MS = [120, 360, 700, 1200, 2000] as const;
const VIEWPORT_WATCHDOG_MS = 500;

const startupPreload = new StartupPreloadController(createStartupPreloadDomView());
startupPreload.begin();
const runtimeArtFormatReady = detectPreferredRuntimeArtFormat();

const readOrientationMediaPortrait = (): boolean | null => {
  if (typeof window.matchMedia !== 'function') return null;
  return window.matchMedia('(orientation: portrait)').matches;
};

const readLiveViewportState = (): ViewportState => {
  const viewport = window.visualViewport;
  const root = document.documentElement;
  return resolveViewportState(
    viewport ? { width: viewport.width, height: viewport.height } : null,
    { width: window.innerWidth, height: window.innerHeight },
    { width: root.clientWidth, height: root.clientHeight },
    readOrientationMediaPortrait(),
  );
};

const syncViewportCssSize = (state: ViewportState = readLiveViewportState()): void => {
  const root = document.documentElement;
  root.style.setProperty('--app-viewport-width', `${state.width}px`);
  root.style.setProperty('--app-viewport-height', `${state.height}px`);
  root.style.setProperty('--app-viewport-max-game-width', `${state.height * 2}px`);
};

const preloadAccentFont = async (): Promise<void> => {
  if (!('fonts' in document)) return;
  try {
    await Promise.race([
      document.fonts.load('16px "Press Start 2P"', ACCENT_FONT_WARMUP_TEXT),
      new Promise<void>((resolve) => window.setTimeout(resolve, 1500)),
    ]);
  } catch {
    // The Phaser styles keep a deterministic monospace fallback if font loading fails.
  }
};

const boot = async (): Promise<void> => {
  const platform = await bootstrapPlatform();
  platform.analytics = createObservableAnalyticsAdapter(platform.analytics);
  const messages = getMessages(platform.language);
  startupPreload.setCopy(messages.startup);

  // Scene code already owns the canonical semantic "presentable ready" signal.
  // Keep the platform call intact, then let the DOM loader disappear only after
  // two browser frames so the newly-authored Phaser frame has a chance to paint.
  const markPlatformReady = platform.markReady.bind(platform);
  let startupCompletionScheduled = false;
  let startupReadyFrame: number | null = null;
  let startupReadySecondFrame: number | null = null;
  platform.markReady = () => {
    markPlatformReady();
    if (startupCompletionScheduled) return;
    startupCompletionScheduled = true;
    startupReadyFrame = window.requestAnimationFrame(() => {
      startupReadyFrame = null;
      startupReadySecondFrame = window.requestAnimationFrame(() => {
        startupReadySecondFrame = null;
        startupPreload.complete();
      });
    });
  };

  setPlatformRuntime(platform);
  const removeDebugPanel = createDebugPanel(platform);
  const audio = getGameAudio();
  const settings = await loadSettingsSafe(platform.storage);
  const [runtimeArtFormat] = await Promise.all([
    runtimeArtFormatReady,
    audio.preloadSamples(getRuntimeSfxAssets()),
    preloadAccentFont(),
  ]);
  setRuntimeArtFormat(runtimeArtFormat);
  audio.setMuted(settings.muted);

  document.documentElement.lang = platform.language;
  document.title = messages.appTitle;
  document.querySelector<HTMLElement>('#game')?.setAttribute('aria-label', messages.gameCanvasLabel);

  let blocked = false;
  let loopSuspended = false;
  let game: Phaser.Game | null = null;
  const applyActivityState = (blockers: ReadonlySet<ActivityBlocker>): void => {
    const nextBlocked = blockers.size > 0;
    const nextLoopSuspended = shouldSuspendRuntimeLoop(blockers);
    const suspensionChanged = nextLoopSuspended !== loopSuspended;
    blocked = nextBlocked;
    loopSuspended = nextLoopSuspended;
    audio.setBlocked(blocked);
    if (!game) return;
    game.sound.mute = blocked;
    if (!suspensionChanged) return;
    if (loopSuspended) {
      game.loop.sleep();
    } else {
      // Orientation alone is a presentation gate, not a runtime suspension.
      // Keeping Phaser alive lets scene init/tweens settle behind the DOM gate and
      // avoids Android Chrome failing to resume a loop after a backing-store resize.
      game.loop.wake();
    }
  };

  // Subscribe before Phaser construction. The detailed blocker snapshot lets the
  // render loop distinguish a harmless orientation gate from real ad/platform/
  // visibility suspension while preserving the same aggregate gameplay blocking.
  const removeBlockedListener = platform.activity.onBlockersChange(applyActivityState);

  const initialViewport = readLiveViewportState();
  syncViewportCssSize(initialViewport);
  const initialCssSize = resolveInitialGameCssSize(initialViewport);
  const initialBackingSize = getBackingStoreSize(initialCssSize.width, initialCssSize.height);
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: initialBackingSize.width,
    height: initialBackingSize.height,
    backgroundColor: '#171421',
    scene: [BootScene, FirstRunScene, OpeningScene, GuidanceScene, CollectionScene],
    render: {
      antialias: true,
      antialiasGL: true,
      pixelArt: false,
      roundPixels: false,
    },
    // Phaser RESIZE uses CSS pixels for the backing store. Keep CSS sizing in
    // the page and drive a denser backing canvas ourselves for HiDPI UI.
    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.NO_CENTER,
    },
  });
  game.sound.mute = blocked;
  if (loopSuspended) game.loop.sleep();

  const syncBackingStore = (viewport: ViewportState): boolean => {
    if (!game) return false;
    // Use the exact same resolved viewport snapshot as the CSS shell and rotate
    // gate. A second DOM geometry read here can be one rotation phase behind on
    // Android Chrome and leave Phaser presenting a stale portrait-authored layout.
    const cssSize = resolveGameCssSize(viewport);
    const backingSize = getBackingStoreSize(cssSize.width, cssSize.height);
    if (game.scale.width === backingSize.width && game.scale.height === backingSize.height) return false;
    game.scale.resize(backingSize.width, backingSize.height);
    return true;
  };

  const gate = document.querySelector<HTMLElement>('#orientation-gate');
  if (gate) gate.textContent = messages.rotateDevice;
  const updateOrientationGate = (viewport: ViewportState): void => {
    if (gate) gate.dataset.visible = viewport.portrait ? 'true' : 'false';
    platform.activity.setBlocked('orientation', viewport.portrait);
  };
  const preventContextMenu = (event: Event): void => event.preventDefault();

  let lastViewportSignature = '';
  const getViewportSignature = (viewport: ViewportState): string =>
    `${Math.round(viewport.width)}x${Math.round(viewport.height)}:${viewport.portrait ? 'p' : 'l'}`;

  const applyViewportChange = (): void => {
    const viewport = readLiveViewportState();
    const viewportSignature = getViewportSignature(viewport);
    const viewportChanged = viewportSignature !== lastViewportSignature;
    syncViewportCssSize(viewport);

    // The portrait gate fully covers the game, so resizing the Phaser backing
    // store there only clears/restarts scenes we cannot show. Preserve the last
    // live landscape canvas and resize exactly when landscape geometry returns.
    if (shouldSyncGameBackingStore(viewport)) {
      const backingStoreResized = syncBackingStore(viewport);
      if (!backingStoreResized && viewportChanged) {
        // Returning from portrait can legitimately restore the exact same
        // landscape backing size. Phaser.resize() would then be skipped, so emit
        // the official ScaleManager refresh/RESIZE signal explicitly to rebuild
        // scene presentation that may have changed lifecycle state under the gate.
        game?.scale.refresh();
      }
    }

    updateOrientationGate(viewport);
    lastViewportSignature = viewportSignature;
  };

  let viewportAnimationFrame: number | null = null;
  let viewportSettleTimers: number[] = [];
  const scheduleViewportChange = (): void => {
    // Rotation signals can arrive before browser geometry settles. Apply once
    // immediately, again on the next frame, and keep a bounded set of settle
    // checks. A watchdog below covers browsers/webviews that drop the useful
    // event entirely.
    applyViewportChange();
    if (viewportAnimationFrame !== null) window.cancelAnimationFrame(viewportAnimationFrame);
    viewportAnimationFrame = window.requestAnimationFrame(() => {
      viewportAnimationFrame = null;
      applyViewportChange();
    });
    for (const timer of viewportSettleTimers) window.clearTimeout(timer);
    viewportSettleTimers = VIEWPORT_SETTLE_DELAYS_MS.map((delay) =>
      window.setTimeout(() => {
        applyViewportChange();
      }, delay),
    );
  };

  const resizeObserver = typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver(() => scheduleViewportChange());
  const gameHost = document.querySelector<HTMLElement>('#game');
  if (gameHost) resizeObserver?.observe(gameHost);

  const orientationMedia = typeof window.matchMedia === 'function'
    ? window.matchMedia('(orientation: portrait)')
    : null;
  const screenOrientation = window.screen.orientation;

  applyViewportChange();
  const viewportWatchdog = window.setInterval(() => {
    const viewport = readLiveViewportState();
    if (getViewportSignature(viewport) !== lastViewportSignature) scheduleViewportChange();
  }, VIEWPORT_WATCHDOG_MS);

  window.addEventListener('resize', scheduleViewportChange);
  window.addEventListener('orientationchange', scheduleViewportChange);
  window.addEventListener('pageshow', scheduleViewportChange);
  window.addEventListener('focus', scheduleViewportChange);
  window.visualViewport?.addEventListener('resize', scheduleViewportChange);
  screenOrientation?.addEventListener('change', scheduleViewportChange);
  orientationMedia?.addEventListener('change', scheduleViewportChange);
  document.querySelector('#game-shell')?.addEventListener('contextmenu', preventContextMenu);

  window.addEventListener(
    'beforeunload',
    () => {
      if (loopSuspended) game?.loop.wake();
      window.removeEventListener('resize', scheduleViewportChange);
      window.removeEventListener('orientationchange', scheduleViewportChange);
      window.removeEventListener('pageshow', scheduleViewportChange);
      window.removeEventListener('focus', scheduleViewportChange);
      window.visualViewport?.removeEventListener('resize', scheduleViewportChange);
      screenOrientation?.removeEventListener('change', scheduleViewportChange);
      orientationMedia?.removeEventListener('change', scheduleViewportChange);
      if (viewportAnimationFrame !== null) window.cancelAnimationFrame(viewportAnimationFrame);
      if (startupReadyFrame !== null) window.cancelAnimationFrame(startupReadyFrame);
      if (startupReadySecondFrame !== null) window.cancelAnimationFrame(startupReadySecondFrame);
      for (const timer of viewportSettleTimers) window.clearTimeout(timer);
      viewportSettleTimers = [];
      window.clearInterval(viewportWatchdog);
      resizeObserver?.disconnect();
      document.querySelector('#game-shell')?.removeEventListener('contextmenu', preventContextMenu);
      startupPreload.destroy();
      removeBlockedListener();
      removeDebugPanel();
      platform.destroy();
      game?.destroy(true);
    },
    { once: true },
  );
};

void boot().catch((error: unknown) => {
  console.error('[boot] fatal startup error', error);
  startupPreload.fail();
});
