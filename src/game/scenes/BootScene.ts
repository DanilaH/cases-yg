import Phaser from 'phaser';

import { getPlatformRuntime } from '../../app/runtime';
import { markStartupPhase } from '../../app/startupPerformance';
import { getRuntimeCollectibleArt, getRuntimeStaticArt } from '../data/artAssets';
import { GAME_REGISTRY } from '../data/collectibles';
import { shouldRunPrimaryOnboarding } from '../systems/onboarding';
import { SaveRepository } from '../systems/save';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('BootScene');
  }

  public preload(): void {
    const queuedTextureKeys = new Set<string>();
    const queueImage = (textureKey: string, assetPath: string): void => {
      if (queuedTextureKeys.has(textureKey)) return;
      queuedTextureKeys.add(textureKey);
      this.load.image(textureKey, assetPath);
    };

    // Product contract: once Game Ready is emitted there are no in-game image
    // loader states. Every reviewed texture reachable in this session is made
    // Phaser-ready while the single startup loader still owns presentation.
    for (const art of getRuntimeStaticArt()) {
      queueImage(art.textureKey, art.assetPath);
    }
    for (const art of getRuntimeCollectibleArt(GAME_REGISTRY)) {
      queueImage(art.textureKey, art.assetPath);
    }
  }

  public create(): void {
    void this.routeInitialScene();
  }

  private async routeInitialScene(): Promise<void> {
    const platform = getPlatformRuntime();
    let firstRun = false;
    try {
      const state = await new SaveRepository(platform.storage).load();
      firstRun = shouldRunPrimaryOnboarding(state);
    } catch (error: unknown) {
      // OpeningScene already owns the canonical save-load failure UI.
      console.warn('[boot] onboarding route check failed; falling back to Opening', error);
    }
    markStartupPhase('bootSaveSettled');

    // Phaser completes preload before create(), so by this point the complete
    // reviewed session art set has already settled. Keep this mark after save so
    // startup phase telemetry remains monotonic and easy to interpret.
    markStartupPhase('bootArtSettled');

    if (!this.sys.isActive()) return;
    if (!this.scene.isActive('GuidanceScene')) this.scene.launch('GuidanceScene');
    this.scene.start(firstRun ? 'FirstRunScene' : 'OpeningScene');
  }
}
