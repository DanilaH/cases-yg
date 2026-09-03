import Phaser from 'phaser';

import { setPlatformRuntime } from './app/runtime';
import { createDebugPanel } from './debug/createDebugPanel';
import { getRuntimeSfxAssets } from './game/data/audioAssets';
import { CollectionScene } from './game/scenes/CollectionScene';
import { BootScene } from './game/scenes/BootScene';
import { OpeningScene } from './game/scenes/OpeningScene';
import { getGameAudio } from './game/systems/audio';
import { getMessages } from './i18n';
import { bootstrapPlatform } from './platform/yandex';
import './styles.css';

const boot = async (): Promise<void> => {
  const platform = await bootstrapPlatform();
  setPlatformRuntime(platform);
  const messages = getMessages(platform.language);
  const removeDebugPanel = createDebugPanel(platform);
  const audio = getGameAudio();
  await audio.preloadSamples(getRuntimeSfxAssets());

  document.documentElement.lang = platform.language;
  document.title = messages.appTitle;

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#171421',
    scene: [BootScene, OpeningScene, CollectionScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });

  let blocked = false;
  const removeBlockedListener = platform.activity.onBlockedChange((nextBlocked) => {
    blocked = nextBlocked;
    game.sound.mute = nextBlocked;
    audio.setBlocked(nextBlocked);
    if (nextBlocked) {
      game.loop.sleep();
    } else {
      game.loop.wake();
    }
  });

  const gate = document.querySelector<HTMLElement>('#orientation-gate');
  if (gate) gate.textContent = messages.rotateDevice;
  const updateOrientationGate = (): void => {
    const portrait = window.innerHeight > window.innerWidth;
    if (gate) gate.dataset.visible = portrait ? 'true' : 'false';
    platform.activity.setBlocked('orientation', portrait);
  };
  const preventContextMenu = (event: Event): void => event.preventDefault();

  updateOrientationGate();
  window.addEventListener('resize', updateOrientationGate);
  document.querySelector('#game-shell')?.addEventListener('contextmenu', preventContextMenu);

  window.addEventListener(
    'beforeunload',
    () => {
      if (blocked) game.loop.wake();
      window.removeEventListener('resize', updateOrientationGate);
      document.querySelector('#game-shell')?.removeEventListener('contextmenu', preventContextMenu);
      removeBlockedListener();
      removeDebugPanel();
      platform.destroy();
      game.destroy(true);
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
