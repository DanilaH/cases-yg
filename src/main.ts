import Phaser from 'phaser';
import '@fontsource/press-start-2p/cyrillic-400.css';
import '@fontsource/press-start-2p/latin-400.css';

import { createObservableAnalyticsAdapter } from './app/analyticsEvents';
import { setPlatformRuntime } from './app/runtime';
import { resolveViewportState, type ViewportState } from './app/viewport';
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
import { bootstrapPlatform } from './platform/yandex';
import './styles.css';

const ACCENT_FONT_WARMUP_TEXT = 'CHIPS SIGNAL REWARD ЖЙЦУКЕН 0123';
const VIEWPORT_SETTLE_DELAYS_MS = [120, 360, 700, 1200, 2000] as const;
const VIEWPORT_WATCHDOG_MS = 500;

interface CssViewportSize {
  width: number;
  height: number;
}

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

const readLiveViewportSize = (): CssViewportSize => {
  const { width, height } = readLiveViewportState();
  return { width, height };
};

const syncViewportCssSize = (state: ViewportState = readLiveViewportState()): CssViewportSize => {
  const size = state;
  const root = document.documentElement;
  root.style.setProperty('--app-viewport-width', `${size.width}px`);
  root.style.setProperty('--app-viewport-height', `${size.height}px`);
  root.style.setProperty('--app-viewport-max-game-width', `${size.height * 2}px`);
  return size;
};

const readGameCssSize = (): { width: number; height: number } => {
  const host = document.querySelector<HTMLElement>('#game');
  const bounds = host?.getBoundingClientRect();
  const viewport = readLiveViewportSize();
  return {
    width: Math.max(1, bounds?.width || viewport.width),
    height: Math.max(1, bounds?.height || viewport.height),
  };
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
  setPlatformRuntime(platform);
  const messages = getMessages(platform.language);
  const removeDebugPanel = createDebugPanel(platform);
  const audio = getGameAudio();
  const settings = await loadSettingsSafe(platform.storage);
  await Promise.all([audio.preloadSamples(getRuntimeSfxAssets()), preloadAccentFont()]);
  audio.setMuted(settings.muted);

  document.documentElement.lang = platform.language;
  document.title = messages.appTitle;

  let blocked = false;
  let game: Phaser.Game | null = null;
  const applyBlockedState = (nextBlocked: boolean): void => {
    blocked = nextBlocked;
    audio.setBlocked(nextBlocked);
    if (!game) return;
    game.sound.mute = nextBlocked;
    if (nextBlocked) {
      game.loop.sleep();
    } else {
      game.loop.wake();
    }
  };

  // Subscribe before Phaser construction. onBlockedChange replays the current
  // aggregate state, so a Yandex startup pause that happened during async boot is
  // buffered and applied before the game gets a chance to run normally.
  const removeBlockedListener = platform.activity.onBlockedChange(applyBlockedState);

  syncViewportCssSize();
  const initialCssSize = readGameCssSize();
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
  if (blocked) game.loop.sleep();

  const syncBackingStore = (): void => {
    if (!game) return;
    const cssSize = readGameCssSize();
    const backingSize = getBackingStoreSize(cssSize.width, cssSize.height);
    if (game.scale.width === backingSize.width && game.scale.height === backingSize.height) return;
    game.scale.resize(backingSize.width, backingSize.height);
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
    syncViewportCssSize(viewport);
    syncBackingStore();
    updateOrientationGate(viewport);
    lastViewportSignature = getViewportSignature(viewport);
  };

  let viewportAnimationFrame: number | null = null;
  let viewportSettleTimers: number[] = [];
  const scheduleViewportChange = (): void => {
    // Rotation signals can arrive before browser geometry settles. Apply once
    // immediately, again on the next frame, and keep a bounded set of settle
    // checks. A watchdog below covers browsers/webviews that drop the useful
    // event entirely while Phaser is sleeping behind the portrait gate.
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
      if (blocked) game?.loop.wake();
      window.removeEventListener('resize', scheduleViewportChange);
      window.removeEventListener('orientationchange', scheduleViewportChange);
      window.removeEventListener('pageshow', scheduleViewportChange);
      window.removeEventListener('focus', scheduleViewportChange);
      window.visualViewport?.removeEventListener('resize', scheduleViewportChange);
      screenOrientation?.removeEventListener('change', scheduleViewportChange);
      orientationMedia?.removeEventListener('change', scheduleViewportChange);
      if (viewportAnimationFrame !== null) window.cancelAnimationFrame(viewportAnimationFrame);
      for (const timer of viewportSettleTimers) window.clearTimeout(timer);
      viewportSettleTimers = [];
      window.clearInterval(viewportWatchdog);
      resizeObserver?.disconnect();
      document.querySelector('#game-shell')?.removeEventListener('contextmenu', preventContextMenu);
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
  const gate = document.querySelector<HTMLElement>('#orientation-gate');
  if (gate) {
    gate.textContent = 'Unable to start the game';
    gate.dataset.visible = 'true';
  }
});
