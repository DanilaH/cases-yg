import Phaser from 'phaser';

export const CHIPS_ACCENT = 0x8df8ff;
export const CHIPS_TEXT_COLOR = '#8df8ff';
export const CHARGED_ACCENT = 0x9d7cff;
export const CHARGED_TEXT_COLOR = '#c7b8ff';

export const createChipToken = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  scale = 1,
): Phaser.GameObjects.Container => {
  const token = scene.add.container(x, y).setScale(scale);
  const chip = scene.add
    .rectangle(0, 0, 18, 18, CHIPS_ACCENT, 0.96)
    .setRotation(Math.PI / 4)
    .setStrokeStyle(2, 0xffffff, 0.72);
  const core = scene.add.circle(0, 0, 3.2, 0x26334a, 0.94).setStrokeStyle(1, 0xffffff, 0.42);
  const shine = scene.add.circle(-4, -4, 2.1, 0xffffff, 0.62);
  token.add([chip, core, shine]);
  return token;
};

export const createChargedAura = (
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  x: number,
  y: number,
): Phaser.GameObjects.Container => {
  const aura = scene.add.container(x, y);
  const glow = scene.add.ellipse(0, 92, 470, 390, CHARGED_ACCENT, 0.075);
  const ring = scene.add
    .ellipse(0, 82, 430, 350, CHARGED_ACCENT, 0)
    .setStrokeStyle(3, CHARGED_ACCENT, 0.32);
  const innerRing = scene.add
    .ellipse(0, 80, 372, 302, CHIPS_ACCENT, 0)
    .setStrokeStyle(2, CHIPS_ACCENT, 0.2);
  const sparks = [-168, -112, -54, 46, 108, 166].map((sparkX, index) =>
    scene.add
      .circle(sparkX, 12 + (index % 2) * 22, index % 3 === 0 ? 4 : 3, index % 2 === 0 ? CHIPS_ACCENT : CHARGED_ACCENT, 0.62)
      .setStrokeStyle(1, 0xffffff, 0.35),
  );
  aura.add([glow, ring, innerRing, ...sparks]);
  root.add(aura);
  return aura;
};
