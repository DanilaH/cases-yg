import Phaser from 'phaser';

import {
  getRuntimeBootStaticArt,
  getRuntimeCollectibleArtForLootPool,
  getRuntimePouchArtForLootPool,
} from '../data/artAssets';
import { DEFAULT_LOOT_POOL_ID, GAME_LOOT_POOL_IDS, GAME_REGISTRY } from '../data/collectibles';

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

    for (const art of getRuntimeCollectibleArtForLootPool(GAME_REGISTRY, DEFAULT_LOOT_POOL_ID)) {
      queueImage(art.textureKey, art.assetPath);
    }

    for (const art of getRuntimeBootStaticArt()) {
      queueImage(art.textureKey, art.assetPath);
    }

    // Pouch skins are part of the immediately browsable Opening UI. Preload all
    // Basic/Charged layers for every Drop so carousel navigation never exposes
    // the procedural fallback while a themed pouch is still downloading.
    for (const lootPoolId of GAME_LOOT_POOL_IDS) {
      for (const art of getRuntimePouchArtForLootPool(lootPoolId)) {
        queueImage(art.textureKey, art.assetPath);
      }
    }
  }

  public create(): void {
    this.scene.start('OpeningScene');
  }
}
