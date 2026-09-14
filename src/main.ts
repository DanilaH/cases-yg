import Phaser from 'phaser';
import '@fontsource/press-start-2p/cyrillic-400.css';
import '@fontsource/press-start-2p/latin-400.css';

import { createObservableAnalyticsAdapter } from './app/analyticsEvents';
import { setPlatformRuntime } from './app/runtime';
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
const VIEWPORT_SETTLE_DELAY_MS = 140;

interface CssViewportSize {
  width: number;
  height: number;
}

const readLiveViewportSize = (): CssViewportSize => {
  const viewport = window.visualViewport;
  return {
    width: Math.max(1, viewport?.width || window.innerWidth || 1),
    height: Math.max(1, viewport?.height || window.innerHeight || 1),
  };
};

const syncViewportCssSize = (): CssViewportSize => {
  const size = readLiveViewportSize();
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
  const updateOrientationGate = (): void => {
    const viewport = readLiveViewportSize();
    const portrait = viewport.height > viewport.width;
    if (gate) gate.dataset.visible = portrait ? 'true' : 'false';
    platform.activity.setBlocked('orientation', portrait);
  };
  const preventContextMenu = (event: Event): void => event.preventDefault();

  const applyViewportChange = (): void => {
    syncViewportCssSize();
    syncBackingStore();
    updateOrientationGate();
  };

  let viewportAnimationFrame: number | null = null;
  let viewportSettleTimer: number | null = null;
  const scheduleViewportChange = (): void => {
    if (viewportAnimationFrame !== null) window.cancelAnimationFrame(viewportAnimationFrame);
    viewportAnimationFrame = window.requestAnimationFrame(() => {
      viewportAnimationFrame = null;
      applyViewportChange();
    });
    if (viewportSettleTimer !== null) window.clearTimeout(viewportSettleTimer);
    // Mobile browsers often publish one intermediate viewport during rotation or
    // toolbar collapse. Re-measure after the geometry has had a moment to settle.
    viewportSettleTimer = window.setTimeout(() => {
      viewportSettleTimer = null;
      applyViewportChange();
    }, VIEWPORT_SETTLE_DELAY_MS);
  };

  const resizeObserver = typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver(() => syncBackingStore());
  const gameHost = document.querySelector<HTMLElement>('#game');
  if (gameHost) resizeObserver?.observe(gameHost);

  applyViewportChange();
  window.addEventListener('resize', scheduleViewportChange);
  window.addEventListener('orientationchange', scheduleViewportChange);
  window.visualViewport?.addEventListener('resize', scheduleViewportChange);
  document.querySelector('#game-shell')?.addEventListener('contextmenu', preventContextMenu);

  window.addEventListener(
    'beforeunload',
    () => {
      if (blocked) game?.loop.wake();
      window.removeEventListener('resize', scheduleViewportChange);
      window.removeEventListener('orientationchange', scheduleViewportChange);
      window.visualViewport?.removeEventListener('resize', scheduleViewportChange);
      if (viewportAnimationFrame !== null) window.cancelAnimationFrame(viewportAnimationFrame);
      if (viewportSettleTimer !== null) window.clearTimeout(viewportSettleTimer);
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
