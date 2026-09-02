import Phaser from 'phaser';

import { getPlatformRuntime } from '../../app/runtime';
import { createLayoutMetrics, layoutX, layoutY, readSafeAreaInsets } from '../systems/layout';

export class OpeningScene extends Phaser.Scene {
  private root: Phaser.GameObjects.Container | null = null;

  public constructor() {
    super('OpeningScene');
  }

  public create(): void {
    const platform = getPlatformRuntime();
    platform.activity.setGameplayDesired(true);

    this.renderPlaceholder();
    this.scale.on('resize', this.renderPlaceholder, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.renderPlaceholder, this);
      platform.activity.setGameplayDesired(false);
    });

    platform.markReady();
  }

  private renderPlaceholder(): void {
    this.root?.destroy(true);
    const metrics = createLayoutMetrics(this.scale.width, this.scale.height, readSafeAreaInsets());
    const root = this.add.container(0, 0);
    this.root = root;

    const backdrop = this.add.rectangle(
      metrics.viewportWidth / 2,
      metrics.viewportHeight / 2,
      metrics.viewportWidth,
      metrics.viewportHeight,
      0x171421,
    );

    const title = this.add
      .text(layoutX(metrics, metrics.centerX), layoutY(metrics, 110), 'Mystery Pocket Tech', {
        color: '#f5eefc',
        fontFamily: 'system-ui, sans-serif',
        fontSize: `${Math.round(34 * metrics.scale)}px`,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const pouch = this.add
      .rectangle(layoutX(metrics, metrics.centerX), layoutY(metrics, 350), 330 * metrics.scale, 280 * metrics.scale, 0xaea3c7)
      .setStrokeStyle(Math.max(2, 4 * metrics.scale), 0xdccff4)
      .setOrigin(0.5);

    const pouchLabel = this.add
      .text(pouch.x, pouch.y, '?', {
        color: '#312746',
        fontFamily: 'system-ui, sans-serif',
        fontSize: `${Math.round(90 * metrics.scale)}px`,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const collection = this.add
      .text(layoutX(metrics, metrics.safeRight), layoutY(metrics, metrics.safeBottom - 18), 'Collection →', {
        color: '#f5eefc',
        backgroundColor: '#312746',
        padding: { x: Math.round(16 * metrics.scale), y: Math.round(10 * metrics.scale) },
        fontFamily: 'system-ui, sans-serif',
        fontSize: `${Math.round(18 * metrics.scale)}px`,
      })
      .setOrigin(1, 1)
      .setInteractive({ useHandCursor: true });

    collection.on('pointerup', () => this.scene.start('CollectionScene'));
    root.add([backdrop, title, pouch, pouchLabel, collection]);
  }
}
