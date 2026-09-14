import Phaser from 'phaser';

import { getPlatformRuntime } from '../../app/runtime';
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

    // Keep only the small shared shell in Phaser's blocking preload. The active
    // Drop cannot be known until durable save state has been read below.
    for (const art of getRuntimeBootStaticArt()) {
      queueImage(art.textureKey, art.assetPath);
    }
  }

  public create(): void {
    installBackgroundAssetWarmup(getPlatformRuntime());
    void this.routeInitialScene();
  }

  private async routeInitialScene(): Promise<void> {
    let firstRun = false;
    let activeLootPoolId = DEFAULT_LOOT_POOL_ID;
    try {
      const state = await new SaveRepository(getPlatformRuntime().storage).load();
      firstRun = shouldRunPrimaryOnboarding(state);
      activeLootPoolId = state.activeLootPoolId;
    } catch (error: unknown) {
      // OpeningScene already owns the canonical save-load failure UI.
      console.warn('[boot] onboarding route check failed; falling back to Opening', error);
    }

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

    if (!this.sys.isActive()) return;
    if (!this.scene.isActive('GuidanceScene')) this.scene.launch('GuidanceScene');
    this.scene.start(firstRun ? 'FirstRunScene' : 'OpeningScene');
  }
}
