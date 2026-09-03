import Phaser from 'phaser';

import { getRuntimeCollectibleArt } from '../data/artAssets';
import { SLICE_REGISTRY } from '../data/collectibles';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('BootScene');
  }

  public preload(): void {
    for (const art of getRuntimeCollectibleArt(SLICE_REGISTRY)) {
      this.load.image(art.textureKey, art.assetPath);
    }
  }

  public create(): void {
    this.scene.start('OpeningScene');
  }
}
