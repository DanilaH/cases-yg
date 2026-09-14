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
 * It intentionally uses the game's cyan/lavender/pink accent family plus a dark
 * local shadow so the cue remains visible on both the bright desk art and dark UI.
 * The pointer is presentation-only: it never intercepts input or owns gameplay state.
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

  const shadow = scene.add.circle(0, 3, 27, 0x090711, 0.32);
  const halo = scene.add
    .circle(0, 0, 25, 0x8df8ff, 0.11)
    .setStrokeStyle(3, 0x8df8ff, 0.92);
  const inner = scene.add
    .circle(0, 0, 16, 0xd39bff, 0.13)
    .setStrokeStyle(2, 0xd39bff, 0.88);
  const dragOrigin = scene.add
    .circle(-18, 0, 7, 0xffffff, 0.98)
    .setStrokeStyle(3, 0x8df8ff, 0.95);
  const beam = scene.add
    .rectangle(-2, 0, 33, 8, 0xd39bff, 0.94)
    .setOrigin(0.5)
    .setStrokeStyle(1, 0xffffff, 0.34);
  const arrow = scene.add
    .triangle(18, 0, -7, -12, -7, 12, 11, 0, 0xff8fd8, 0.98)
    .setOrigin(0.5)
    .setStrokeStyle(2, 0xffffff, 0.74);
  const hotCore = scene.add.circle(18, 0, 3.5, 0xffffff, 0.98);

  container.add([shadow, halo, inner, beam, dragOrigin, arrow, hotCore]);
  container.setRotation(Phaser.Math.DegToRad(options.angle ?? 0));
  container.setScale(baseScale);
  parent.add(container);

  const travelTween = scene.tweens.add({
    targets: container,
    x: x + (options.travelX ?? 34),
    y: y + (options.travelY ?? 0),
    alpha: { from: 0.72, to: 1 },
    scale: { from: baseScale * 0.96, to: baseScale },
    duration: options.durationMs ?? 620,
    yoyo: true,
    repeat: -1,
    repeatDelay: options.repeatDelayMs ?? 360,
    ease: 'Sine.InOut',
  });

  const pulseTween = scene.tweens.add({
    targets: [halo, inner],
    scale: { from: 0.92, to: 1.08 },
    alpha: { from: 0.72, to: 1 },
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
