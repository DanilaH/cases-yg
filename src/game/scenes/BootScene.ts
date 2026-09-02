import Phaser from 'phaser';

import { getRuntimeCollectibleArt, POUCH_ASSET_PATH, POUCH_TEXTURE_KEY } from '../data/artAssets';
import { SLICE_REGISTRY } from '../data/collectibles';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('BootScene');
  }

  public preload(): void {
    this.load.image(POUCH_TEXTURE_KEY, POUCH_ASSET_PATH);
    for (const art of getRuntimeCollectibleArt(SLICE_REGISTRY)) {
      this.load.image(art.textureKey, art.assetPath);
    }
  }

  public create(): void {
    this.scene.start('OpeningScene');
  }
}
