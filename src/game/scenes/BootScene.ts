import Phaser from 'phaser';

import { getPlatformRuntime } from '../../app/runtime';
import { markStartupPhase } from '../../app/startupPerformance';
import { getRuntimeBootStaticArt } from '../data/artAssets';
import { DEFAULT_LOOT_POOL_ID, GAME_REGISTRY } from '../data/collectibles';
import { ensureLootPoolArt } from '../systems/artLoading';
import { installBackgroundAssetWarmup } from '../systems/backgroundAssetWarmup';
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

    // Only art required by the first visible Opening frame blocks the generic
    // Phaser preload. Collection owns its scene-only layers, while active-Drop
    // pouch + collectible art is selected after durable save state resolves.
    for (const art of getRuntimeBootStaticArt()) {
      queueImage(art.textureKey, art.assetPath);
    }
  }

  public create(): void {
    void this.routeInitialScene();
  }

  private async routeInitialScene(): Promise<void> {
    const platform = getPlatformRuntime();
    let firstRun = false;
    let activeLootPoolId = DEFAULT_LOOT_POOL_ID;
    try {
      const state = await new SaveRepository(platform.storage).load();
      firstRun = shouldRunPrimaryOnboarding(state);
      activeLootPoolId = state.activeLootPoolId;
    } catch (error: unknown) {
      // OpeningScene already owns the canonical save-load failure UI.
      console.warn('[boot] onboarding route check failed; falling back to Opening', error);
    }
    markStartupPhase('bootSaveSettled');

    // The warmup policy depends on durable active-Drop truth. Install it only
    // after save resolution so Game Ready prefetches near-future assets for the
    // Drop the player is actually using instead of the whole catalog.
    installBackgroundAssetWarmup(platform, activeLootPoolId);

    // Slow network is not an art failure. Await the active Drop's full authored
    // pouch + collectible set before handing off to FirstRun/Opening so a late
    // texture can never briefly render as a procedural placeholder.
    try {
      await ensureLootPoolArt(this, GAME_REGISTRY, activeLootPoolId);
    } catch (error: unknown) {
      // A confirmed loader error keeps the existing procedural fallback as the
      // emergency path; speculative background warmup never controls correctness.
      console.warn('[art] initial active Drop art failed to load; using fallbacks', error);
    }
    markStartupPhase('bootArtSettled');

    if (!this.sys.isActive()) return;
    if (!this.scene.isActive('GuidanceScene')) this.scene.launch('GuidanceScene');
    this.scene.start(firstRun ? 'FirstRunScene' : 'OpeningScene');
  }
}
