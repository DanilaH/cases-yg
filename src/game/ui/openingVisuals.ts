import Phaser from 'phaser';

import { collectibleTextureKey, staticTextureKey } from '../data/artAssets';
import type { StandardRarity } from '../data/collectibles';

export const RARITY_REVEAL_COLORS: Readonly<Record<StandardRarity, number>> = {
  common: 0xbdaed4,
  rare: 0x65c9ee,
  epic: 0xc384ff,
  legendary: 0xffd56a,
};

export const SECRET_REVEAL_COLOR = 0x65f6ff;

const POUCH_ART_DISPLAY_WIDTH = 374;
const POUCH_TEAR_Y = -112;
const POUCH_TAB_LOCAL_X = -126;
const POUCH_TAB_LOCAL_Y = -126;
const POUCH_TAB_HIT_SIZE = 140;
const POUCH_TAB_TRAVEL = 263;

export interface PouchVisual {
  group: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Rectangle;
  strip: Phaser.GameObjects.Container;
  tab: Phaser.GameObjects.Container;
  dragZone: Phaser.GameObjects.Zone;
  tabStartX: number;
  tabEndX: number;
}

const addAlignedLayer = (
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  textureKey: string,
): Phaser.GameObjects.Image => {
  const image = scene.add.image(0, 8, textureKey).setOrigin(0.5);
  image.setScale(POUCH_ART_DISPLAY_WIDTH / Math.max(1, image.width));
  container.add(image);
  return image;
};

const addProceduralBody = (
  scene: Phaser.Scene,
  group: Phaser.GameObjects.Container,
  body: Phaser.GameObjects.Rectangle,
): void => {
  body.setFillStyle(0xa89ebd, 1).setStrokeStyle(4, 0xd8d0e7, 0.85);
  const innerPanel = scene.add
    .rectangle(0, 22, 300, 168, 0xc7bdd8, 0.26)
    .setStrokeStyle(2, 0xe7e1ef, 0.25);
  const mysteryBadge = scene.add.circle(0, 6, 50, 0xe9e2f2, 0.9).setStrokeStyle(3, 0x716486, 0.75);
  const question = scene.add
    .text(0, 4, '?', {
      color: '#4b405d',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '64px',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);

  const circuit = scene.add.graphics();
  circuit.lineStyle(2, 0x766b8b, 0.34);
  circuit.beginPath();
  circuit.moveTo(-142, 62);
  circuit.lineTo(-96, 62);
  circuit.lineTo(-96, 96);
  circuit.lineTo(-54, 96);
  circuit.moveTo(142, 58);
  circuit.lineTo(104, 58);
  circuit.lineTo(104, 92);
  circuit.lineTo(62, 92);
  circuit.strokePath();

  const silhouetteLeft = scene.add.rectangle(-82, 104, 44, 28, 0x675b78, 0.46).setOrigin(0.5);
  const silhouetteCenter = scene.add.rectangle(0, 104, 36, 36, 0x675b78, 0.46).setOrigin(0.5);
  const silhouetteRight = scene.add.rectangle(80, 104, 28, 46, 0x675b78, 0.46).setOrigin(0.5);
  group.add([body, innerPanel, mysteryBadge, question, circuit, silhouetteLeft, silhouetteCenter, silhouetteRight]);
};

const addProceduralStrip = (scene: Phaser.Scene, strip: Phaser.GameObjects.Container): void => {
  const stripPlate = scene.add
    .rectangle(0, POUCH_TEAR_Y, 360, 54, 0x9085a7, 1)
    .setStrokeStyle(3, 0xd6cde3, 0.72);
  const tearLine = scene.add.graphics();
  tearLine.lineStyle(2, 0x5f5372, 0.72);
  for (let lineX = -112; lineX < 130; lineX += 22) {
    tearLine.lineBetween(lineX, POUCH_TEAR_Y + 8, Math.min(lineX + 12, 130), POUCH_TEAR_Y + 8);
  }
  const arrow = scene.add
    .text(95, POUCH_TEAR_Y - 11, '→', {
      color: '#5f5372',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);
  strip.add([stripPlate, tearLine, arrow]);
};

export const createPouchVisual = (
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  x: number,
  y: number,
): PouchVisual => {
  const group = scene.add.container(x, y);
  const shadow = scene.add.ellipse(0, 142, 310, 34, 0x08070c, 0.28);
  const body = scene.add.rectangle(0, 10, 360, 248, 0xa89ebd, 0);
  group.add(shadow);

  const bodyTexture = staticTextureKey('pouch-body');
  if (scene.textures.exists(bodyTexture)) {
    group.add(body);
    addAlignedLayer(scene, group, bodyTexture);
  } else {
    addProceduralBody(scene, group, body);
  }

  const strip = scene.add.container(0, 0);
  const stripTexture = staticTextureKey('pouch-tear-strip');
  if (scene.textures.exists(stripTexture)) {
    addAlignedLayer(scene, strip, stripTexture);
  } else {
    addProceduralStrip(scene, strip);
  }

  // The tab wrapper moves as one unit, so both a full-canvas aligned art layer
  // and the hit-zone follow the same deterministic drag travel.
  const tabStartX = 0;
  const tabEndX = POUCH_TAB_TRAVEL;
  const tab = scene.add.container(tabStartX, 0);
  const tabTexture = staticTextureKey('pouch-star-tab');
  if (scene.textures.exists(tabTexture)) {
    addAlignedLayer(scene, tab, tabTexture);
  } else {
    tab.add(
      scene.add
        .text(POUCH_TAB_LOCAL_X, POUCH_TAB_LOCAL_Y, '★', {
          color: '#8157d8',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '54px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );
  }
  const dragZone = scene.add
    .zone(POUCH_TAB_LOCAL_X, POUCH_TAB_LOCAL_Y, POUCH_TAB_HIT_SIZE, POUCH_TAB_HIT_SIZE)
    .setInteractive({ useHandCursor: true });
  tab.add(dragZone);
  strip.add(tab);
  group.add(strip);
  root.add(group);

  return {
    group,
    body,
    strip,
    tab,
    dragZone,
    tabStartX,
    tabEndX,
  };
};

export interface CollectibleVisual {
  group: Phaser.GameObjects.Container;
  accentColor: number;
}

const createCamera = (scene: Phaser.Scene, accentColor: number): Phaser.GameObjects.Container => {
  const group = scene.add.container(0, 0);
  const shadow = scene.add.ellipse(0, 94, 218, 30, 0x050408, 0.25);
  const body = scene.add
    .rectangle(0, 4, 226, 146, accentColor, 1)
    .setStrokeStyle(5, 0xffffff, 0.38);
  const top = scene.add.rectangle(-52, -75, 82, 24, accentColor, 1).setStrokeStyle(3, 0xffffff, 0.3);
  const lensOuter = scene.add.circle(22, 6, 56, 0x2a2731, 1).setStrokeStyle(8, 0xf7f4fb, 0.46);
  const lensInner = scene.add.circle(22, 6, 34, 0x15141b, 1).setStrokeStyle(5, accentColor, 0.82);
  const lensGlass = scene.add.circle(10, -6, 10, 0xffffff, 0.48);
  const flash = scene.add.rectangle(-74, -31, 34, 18, 0xf7f4fb, 0.82).setStrokeStyle(2, 0x4d4758, 0.28);
  const button = scene.add.circle(70, -68, 8, 0x3f3949, 0.72);
  group.add([shadow, body, top, lensOuter, lensInner, lensGlass, flash, button]);
  return group;
};

const createFlipPhone = (scene: Phaser.Scene, accentColor: number): Phaser.GameObjects.Container => {
  const group = scene.add.container(0, 0);
  const shadow = scene.add.ellipse(0, 110, 176, 30, 0x050408, 0.25);
  const top = scene.add
    .rectangle(0, -54, 154, 116, accentColor, 1)
    .setStrokeStyle(5, 0xffffff, 0.38);
  const bottom = scene.add
    .rectangle(0, 66, 154, 116, accentColor, 1)
    .setStrokeStyle(5, 0xffffff, 0.38);
  const hinge = scene.add.rectangle(0, 7, 170, 18, 0x38323f, 0.92).setStrokeStyle(2, 0xffffff, 0.22);
  const screen = scene.add.rectangle(0, -54, 104, 66, 0x262630, 1).setStrokeStyle(4, 0xece5f4, 0.4);
  const screenGlow = scene.add.rectangle(0, -54, 84, 48, accentColor, 0.36);
  const nav = scene.add.circle(0, 50, 20, 0xeee8f4, 0.72).setStrokeStyle(3, 0x493f55, 0.42);
  const keyLeft = scene.add.circle(-45, 84, 7, 0xeee8f4, 0.58);
  const keyCenter = scene.add.circle(0, 84, 7, 0xeee8f4, 0.58);
  const keyRight = scene.add.circle(45, 84, 7, 0xeee8f4, 0.58);
  group.add([shadow, top, bottom, hinge, screen, screenGlow, nav, keyLeft, keyCenter, keyRight]);
  return group;
};

const createGenericDevice = (scene: Phaser.Scene, accentColor: number): Phaser.GameObjects.Container => {
  const group = scene.add.container(0, 0);
  const shadow = scene.add.ellipse(0, 86, 190, 28, 0x050408, 0.25);
  const body = scene.add.rectangle(0, 0, 190, 150, accentColor, 1).setStrokeStyle(5, 0xffffff, 0.38);
  const screen = scene.add.rectangle(0, -20, 122, 72, 0x25242d, 0.92).setStrokeStyle(3, 0xffffff, 0.3);
  const control = scene.add.circle(0, 56, 18, 0xf3eef7, 0.62);
  group.add([shadow, body, screen, control]);
  return group;
};

const createAssetCollectible = (
  scene: Phaser.Scene,
  familyId: string,
  textureKey: string,
): Phaser.GameObjects.Container => {
  const group = scene.add.container(0, 0);
  const targetWidth = familyId === 'flip-phone' ? 300 : 246;
  // The phone art includes a long charm on the left, so centering the full 1024 canvas
  // makes the phone body read too far right. Offset the rendered art around the body pivot.
  const artOffsetX = familyId === 'flip-phone' ? -24 : 0;
  const image = scene.add.image(artOffsetX, 0, textureKey).setOrigin(0.5);
  image.setScale(targetWidth / Math.max(1, image.width));
  const visualBottom = image.displayHeight / 2;
  const shadowWidth = familyId === 'flip-phone' ? 170 : 220;
  const shadow = scene.add.ellipse(artOffsetX, visualBottom - 8, shadowWidth, 28, 0x050408, 0.2);
  group.add([shadow, image]);
  image.setDepth(1);
  return group;
};

export const createCollectibleVisual = (
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  familyId: string,
  rarity: StandardRarity | 'secret',
  x: number,
  y: number,
  collectibleId?: string,
): CollectibleVisual => {
  const accentColor = rarity === 'secret' ? SECRET_REVEAL_COLOR : RARITY_REVEAL_COLORS[rarity];
  const textureKey = collectibleId ? collectibleTextureKey(collectibleId) : null;
  const group =
    textureKey && scene.textures.exists(textureKey)
      ? createAssetCollectible(scene, familyId, textureKey)
      : familyId === 'camera'
        ? createCamera(scene, accentColor)
        : familyId === 'flip-phone'
          ? createFlipPhone(scene, accentColor)
          : createGenericDevice(scene, accentColor);

  group.setPosition(x, y);
  root.add(group);
  return { group, accentColor };
};

export const createRevealRing = (
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  x: number,
  y: number,
  color: number,
): Phaser.GameObjects.Arc => {
  const ring = scene.add.circle(x, y, 80, color, 0).setStrokeStyle(6, color, 0.72);
  root.add(ring);
  return ring;
};
