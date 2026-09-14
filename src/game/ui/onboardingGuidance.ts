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
 * High-salience non-interactive gesture pointer used by onboarding guidance.
 * The circular target and arrow share one visual center; small trailing dots plus
 * the repeated translation communicate direction without offsetting the arrowhead
 * to the edge of the halo. The pointer never intercepts input or owns gameplay state.
 */
export const createGuidancePointer = (
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  x: number,
  y: number,
  options: GuidancePointerOptions = {},
): GuidancePointer => {
  const baseScale = options.scale ?? 1;
  const container = scene.add.container(x, y).setDepth(1200);

  const shadow = scene.add.circle(0, 3, 28, 0x090711, 0.36);
  const halo = scene.add
    .circle(0, 0, 26, 0x8df8ff, 0.12)
    .setStrokeStyle(3, 0x8df8ff, 0.96);
  const inner = scene.add
    .circle(0, 0, 17, 0xd39bff, 0.15)
    .setStrokeStyle(2, 0xd39bff, 0.9);
  const trailFar = scene.add.circle(-48, 0, 3.2, 0xd39bff, 0.52);
  const trailNear = scene.add.circle(-37, 0, 4.2, 0x8df8ff, 0.72);
  const shaft = scene.add
    .rectangle(-4, 0, 22, 7, 0xd39bff, 0.98)
    .setOrigin(0.5)
    .setStrokeStyle(1, 0xffffff, 0.38);
  const arrow = scene.add
    .triangle(2, 0, -8, -11, -8, 11, 10, 0, 0xff8fd8, 1)
    .setOrigin(0.5)
    .setStrokeStyle(2, 0xffffff, 0.8);

  container.add([shadow, trailFar, trailNear, halo, inner, shaft, arrow]);
  container.setRotation(Phaser.Math.DegToRad(options.angle ?? 0));
  container.setScale(baseScale);
  parent.add(container);

  const travelTween = scene.tweens.add({
    targets: container,
    x: x + (options.travelX ?? 34),
    y: y + (options.travelY ?? 0),
    alpha: { from: 0.76, to: 1 },
    scale: { from: baseScale * 0.96, to: baseScale },
    duration: options.durationMs ?? 620,
    yoyo: true,
    repeat: -1,
    repeatDelay: options.repeatDelayMs ?? 360,
    ease: 'Sine.InOut',
  });

  const pulseTween = scene.tweens.add({
    targets: [halo, inner],
    scale: { from: 0.94, to: 1.07 },
    alpha: { from: 0.76, to: 1 },
    duration: 420,
    yoyo: true,
    repeat: -1,
    repeatDelay: 180,
    ease: 'Sine.InOut',
  });

  return {
    container,
    destroy: () => {
      travelTween.stop();
      pulseTween.stop();
      if (container.active) container.destroy(true);
    },
  };
};
