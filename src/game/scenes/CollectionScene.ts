import Phaser from 'phaser';

import { getPlatformRuntime } from '../../app/runtime';
import { SLICE_FAMILIES } from '../data/collectibles';
import { createLayoutMetrics, layoutX, layoutY, readSafeAreaInsets } from '../systems/layout';

export class CollectionScene extends Phaser.Scene {
  private root: Phaser.GameObjects.Container | null = null;

  public constructor() {
    super('CollectionScene');
  }

  public create(): void {
    const platform = getPlatformRuntime();
    platform.activity.setGameplayDesired(false);
    this.renderPlaceholder();
    this.scale.on('resize', this.renderPlaceholder, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.renderPlaceholder, this);
    });
  }

  private renderPlaceholder(): void {
    this.root?.destroy(true);
    const platform = getPlatformRuntime();
    const metrics = createLayoutMetrics(this.scale.width, this.scale.height, readSafeAreaInsets());
    const root = this.add.container(0, 0);
    this.root = root;

    root.add(
      this.add.rectangle(
        metrics.viewportWidth / 2,
        metrics.viewportHeight / 2,
        metrics.viewportWidth,
        metrics.viewportHeight,
        0x211b2c,
      ),
    );

    root.add(
      this.add
        .text(layoutX(metrics, metrics.centerX), layoutY(metrics, 88), 'Collection · registry-driven placeholder', {
          color: '#f5eefc',
          fontFamily: 'system-ui, sans-serif',
          fontSize: `${Math.round(26 * metrics.scale)}px`,
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );

    SLICE_FAMILIES.forEach((family, index) => {
      const x = metrics.centerX + (index - (SLICE_FAMILIES.length - 1) / 2) * 300;
      const card = this.add.rectangle(layoutX(metrics, x), layoutY(metrics, 340), 240 * metrics.scale, 260 * metrics.scale, 0x3a3049);
      const label = this.add
        .text(card.x, card.y, family.name[platform.language], {
          align: 'center',
          color: '#f5eefc',
          fontFamily: 'system-ui, sans-serif',
          fontSize: `${Math.round(19 * metrics.scale)}px`,
          wordWrap: { width: 190 * metrics.scale },
        })
        .setOrigin(0.5);
      root.add([card, label]);
    });

    const back = this.add
      .text(layoutX(metrics, metrics.safeLeft), layoutY(metrics, metrics.safeBottom - 18), '← Open more', {
        color: '#f5eefc',
        backgroundColor: '#312746',
        padding: { x: Math.round(16 * metrics.scale), y: Math.round(10 * metrics.scale) },
        fontFamily: 'system-ui, sans-serif',
        fontSize: `${Math.round(18 * metrics.scale)}px`,
      })
      .setOrigin(0, 1)
      .setInteractive({ useHandCursor: true });

    back.on('pointerup', () => this.scene.start('OpeningScene'));
    root.add(back);
  }
}
