import Phaser from 'phaser';

import { getRuntimeCollectibleArtForLootPool, getRuntimeStaticArt } from '../data/artAssets';
import { DEFAULT_LOOT_POOL_ID, GAME_REGISTRY } from '../data/collectibles';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('BootScene');
  }

  public preload(): void {
    for (const art of getRuntimeCollectibleArtForLootPool(GAME_REGISTRY, DEFAULT_LOOT_POOL_ID)) {
      this.load.image(art.textureKey, art.assetPath);
    }
    for (const art of getRuntimeStaticArt()) {
      this.load.image(art.textureKey, art.assetPath);
    }
  }

  public create(): void {
    this.scene.start('OpeningScene');
  }
}
