import Phaser from 'phaser';

import { setPlatformRuntime } from './app/runtime';
import { createDebugPanel } from './debug/createDebugPanel';
import { BootScene } from './game/scenes/BootScene';
import { CollectionScene } from './game/scenes/CollectionScene';
import { OpeningScene } from './game/scenes/OpeningScene';
import { bootstrapPlatform } from './platform/yandex';
import './styles.css';

const updateOrientationGate = (): void => {
  const gate = document.querySelector<HTMLElement>('#orientation-gate');
  if (!gate) return;
  const portrait = window.innerHeight > window.innerWidth;
  gate.dataset.visible = portrait ? 'true' : 'false';
};

const boot = async (): Promise<void> => {
  const platform = await bootstrapPlatform();
  setPlatformRuntime(platform);
  const removeDebugPanel = createDebugPanel(platform);

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
    if (nextBlocked) {
      game.loop.sleep();
    } else {
      game.loop.wake();
    }
  });

  updateOrientationGate();
  window.addEventListener('resize', updateOrientationGate);
  window.addEventListener('contextmenu', (event) => event.preventDefault());

  window.addEventListener(
    'beforeunload',
    () => {
      if (blocked) game.loop.wake();
      removeBlockedListener();
      removeDebugPanel();
      platform.destroy();
      game.destroy(true);
    },
    { once: true },
  );
};

void boot();
