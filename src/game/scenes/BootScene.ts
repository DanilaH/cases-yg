import Phaser from 'phaser';

import { getRuntimeCollectibleArt, getRuntimeStaticArt } from '../data/artAssets';
import { SLICE_REGISTRY } from '../data/collectibles';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('BootScene');
  }

  public preload(): void {
    for (const art of getRuntimeCollectibleArt(SLICE_REGISTRY)) {
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
