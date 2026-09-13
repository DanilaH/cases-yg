import Phaser from 'phaser';

export interface GuidancePointerOptions {
  travelX?: number;
  travelY?: number;
  durationMs?: number;
  repeatDelayMs?: number;
  angle?: number;
  scale?: number;
}

export interface GuidancePointer {
  container: Phaser.GameObjects.Container;
  destroy(): void;
}

/**
 * Small non-interactive gesture pointer used by first-run guidance. The pointer is
 * presentation-only: it never intercepts input or owns gameplay state.
 */
export const createGuidancePointer = (
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  x: number,
  y: number,
  options: GuidancePointerOptions = {},
): GuidancePointer => {
  const container = scene.add.container(x, y).setDepth(1200);
  const halo = scene.add.circle(0, 0, 18, 0xffffff, 0.08).setStrokeStyle(2, 0xffffff, 0.72);
  const core = scene.add.circle(0, 0, 5.5, 0xffffff, 0.94);
  const tail = scene.add
    .triangle(-19, 0, 0, -7, 0, 7, 13, 0, 0xffffff, 0.86)
    .setOrigin(0.5);
  container.add([halo, core, tail]);
  container.setRotation(Phaser.Math.DegToRad(options.angle ?? 0));
  container.setScale(options.scale ?? 1);
  parent.add(container);

  const tween = scene.tweens.add({
    targets: container,
    x: x + (options.travelX ?? 34),
    y: y + (options.travelY ?? 0),
    alpha: { from: 0.42, to: 1 },
    scale: { from: (options.scale ?? 1) * 0.94, to: options.scale ?? 1 },
    duration: options.durationMs ?? 620,
    yoyo: true,
    repeat: -1,
    repeatDelay: options.repeatDelayMs ?? 360,
    ease: 'Sine.InOut',
  });

  return {
    container,
    destroy: () => {
      tween.stop();
      if (container.active) container.destroy(true);
    },
  };
};
