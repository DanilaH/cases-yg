import Phaser from 'phaser';

export const CHIPS_ACCENT = 0x8df8ff;
export const CHIPS_TEXT_COLOR = '#8df8ff';
export const CHARGED_ACCENT = 0x9d7cff;
export const CHARGED_TEXT_COLOR = '#c7b8ff';
export const HOT_PINK_ACCENT = 0xff78cb;
export const DIGITAL_FONT_FAMILY = '"Press Start 2P", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';

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

export const createFlyingChipToken = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  scale = 1,
): Phaser.GameObjects.Rectangle =>
  scene.add
    .rectangle(x, y, 12, 12, CHIPS_ACCENT, 0.98)
    .setRotation(Math.PI / 4)
    .setScale(scale)
    .setStrokeStyle(1.5, 0xffffff, 0.74);

export const createSignalToken = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  waitingForCharged = false,
): Phaser.GameObjects.Rectangle =>
  scene.add
    .rectangle(x, y, 17, 8, waitingForCharged ? CHARGED_ACCENT : CHIPS_ACCENT, 0.96)
    .setStrokeStyle(1, 0xffffff, 0.62);

export const createHudShimmer = (
  scene: Phaser.Scene,
  height: number,
): Phaser.GameObjects.Rectangle =>
  scene.add
    .rectangle(10, height / 2, 14, Math.max(18, height - 14), 0xffffff, 0.055)
    .setRotation(0.18)
    .setBlendMode(Phaser.BlendModes.ADD);

export const createChargedAura = (
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  x: number,
  y: number,
): Phaser.GameObjects.Container => {
  const aura = scene.add.container(x, y);
  const glow = scene.add.ellipse(0, 92, 486, 402, CHARGED_ACCENT, 0.105);
  const ring = scene.add
    .ellipse(0, 82, 438, 356, CHARGED_ACCENT, 0)
    .setStrokeStyle(4, CHARGED_ACCENT, 0.42);
  const innerRing = scene.add
    .ellipse(0, 80, 382, 310, CHIPS_ACCENT, 0)
    .setStrokeStyle(2, CHIPS_ACCENT, 0.28);
  const pinkRing = scene.add
    .ellipse(0, 82, 410, 334, HOT_PINK_ACCENT, 0)
    .setStrokeStyle(2, HOT_PINK_ACCENT, 0.17)
    .setRotation(-0.035);
  const shimmer = scene.add
    .rectangle(-150, -54, 92, 330, 0xffffff, 0.055)
    .setRotation(0.34)
    .setBlendMode(Phaser.BlendModes.ADD);
  const sparks = [-176, -122, -62, 42, 112, 174].map((sparkX, index) =>
    scene.add
      .circle(
        sparkX,
        10 + (index % 2) * 24,
        index % 3 === 0 ? 4 : 3,
        index % 3 === 0 ? HOT_PINK_ACCENT : index % 2 === 0 ? CHIPS_ACCENT : CHARGED_ACCENT,
        0.72,
      )
      .setStrokeStyle(1, 0xffffff, 0.38),
  );
  aura.add([glow, ring, innerRing, pinkRing, shimmer, ...sparks]);
  aura.setData('shimmer', shimmer);
  aura.setData('ring', ring);
  aura.setData('innerRing', innerRing);
  aura.setData('pinkRing', pinkRing);
  aura.setData('sparks', sparks);
  root.add(aura);
  return aura;
};
