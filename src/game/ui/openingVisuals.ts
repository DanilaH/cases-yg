import Phaser from 'phaser';

import {
  attachCollectiblePerspective,
  attachPouchPerspective,
  type PouchPerspectiveController,
} from './pouchPerspective';

import { collectibleTextureKey, pouchStaticArtId, staticTextureKey, type PouchArtVariant } from '../data/artAssets';
import { DEFAULT_LOOT_POOL_ID, type GameLootPoolId, type StandardRarity } from '../data/collectibles';
import {
  getCollectiblePresentation,
  MOTION_PRESENTATION,
  POUCH_PRESENTATION,
  POUCH_VARIANT_PRESENTATION,
  type CollectiblePresentation,
  type PouchLayerPresentation,
} from '../data/presentation';

export const RARITY_REVEAL_COLORS: Readonly<Record<StandardRarity, number>> = {
  common: 0xbdaed4,
  rare: 0x65c9ee,
  epic: 0xc384ff,
  legendary: 0xffd56a,
};

export const SECRET_REVEAL_COLOR = 0xff4d6d;
export const SECRET_PREMIUM_GOLD = 0xffd36a;

export interface PouchVisual {
  group: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Rectangle;
  bodyLayer: Phaser.GameObjects.Container;
  strip: Phaser.GameObjects.Container;
  tab: Phaser.GameObjects.Container;
  dragZone: Phaser.GameObjects.Zone;
  perspective: PouchPerspectiveController | null;
  revealOcclusionUsed: boolean;
  tabStartX: number;
  tabEndX: number;
}

const addPouchLayer = (
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  textureKey: string,
  presentation: PouchLayerPresentation,
): Phaser.GameObjects.Image => {
  const image = scene.add.image(presentation.x, presentation.y, textureKey).setOrigin(0.5);
  image.setScale(presentation.displayWidth / Math.max(1, image.width));
  container.add(image);
  return image;
};

const addProceduralBody = (
  scene: Phaser.Scene,
  group: Phaser.GameObjects.Container,
  body: Phaser.GameObjects.Rectangle,
): void => {
  body
    .setPosition(0, POUCH_PRESENTATION.body.y)
    .setSize(350, 340)
    .setFillStyle(0xa89ebd, 1)
    .setStrokeStyle(4, 0xd8d0e7, 0.85);
  const innerPanel = scene.add
    .rectangle(0, POUCH_PRESENTATION.body.y + 20, 300, 235, 0xc7bdd8, 0.26)
    .setStrokeStyle(2, 0xe7e1ef, 0.25);
  const mysteryBadge = scene.add
    .circle(0, POUCH_PRESENTATION.body.y - 10, 50, 0xe9e2f2, 0.9)
    .setStrokeStyle(3, 0x716486, 0.75);
  const question = scene.add
    .text(0, POUCH_PRESENTATION.body.y - 12, '?', {
      color: '#4b405d',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '64px',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);

  const circuit = scene.add.graphics();
  circuit.lineStyle(2, 0x766b8b, 0.34);
  circuit.beginPath();
  circuit.moveTo(-142, POUCH_PRESENTATION.body.y + 62);
  circuit.lineTo(-96, POUCH_PRESENTATION.body.y + 62);
  circuit.lineTo(-96, POUCH_PRESENTATION.body.y + 96);
  circuit.lineTo(-54, POUCH_PRESENTATION.body.y + 96);
  circuit.moveTo(142, POUCH_PRESENTATION.body.y + 58);
  circuit.lineTo(104, POUCH_PRESENTATION.body.y + 58);
  circuit.lineTo(104, POUCH_PRESENTATION.body.y + 92);
  circuit.lineTo(62, POUCH_PRESENTATION.body.y + 92);
  circuit.strokePath();

  const silhouetteLeft = scene.add
    .rectangle(-82, POUCH_PRESENTATION.body.y + 112, 44, 28, 0x675b78, 0.46)
    .setOrigin(0.5);
  const silhouetteCenter = scene.add
    .rectangle(0, POUCH_PRESENTATION.body.y + 112, 36, 36, 0x675b78, 0.46)
    .setOrigin(0.5);
  const silhouetteRight = scene.add
    .rectangle(80, POUCH_PRESENTATION.body.y + 112, 28, 46, 0x675b78, 0.46)
    .setOrigin(0.5);
  group.add([body, innerPanel, mysteryBadge, question, circuit, silhouetteLeft, silhouetteCenter, silhouetteRight]);
};

const addProceduralStrip = (scene: Phaser.Scene, strip: Phaser.GameObjects.Container): void => {
  const stripPlate = scene.add
    .rectangle(0, POUCH_PRESENTATION.tearLineY - 5, 320, 42, 0xa79eb5, 1)
    .setStrokeStyle(3, 0xe7e1ef, 0.78);
  const tearLine = scene.add.graphics();
  tearLine.lineStyle(2, 0x705f83, 0.7);
  for (let lineX = -112; lineX < 130; lineX += 22) {
    tearLine.lineBetween(
      lineX,
      POUCH_PRESENTATION.tearLineY,
      Math.min(lineX + 12, 130),
      POUCH_PRESENTATION.tearLineY,
    );
  }
  const arrow = scene.add
    .text(136, POUCH_PRESENTATION.tearLineY - 14, '→', {
      color: '#665477',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
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
  variant: PouchArtVariant = 'basic',
  lootPoolId: GameLootPoolId = DEFAULT_LOOT_POOL_ID,
): PouchVisual => {
  const group = scene.add.container(x, y);
  const shadow = scene.add.ellipse(
    0,
    POUCH_PRESENTATION.shadowY,
    POUCH_PRESENTATION.shadowWidth,
    34,
    0x08070c,
    0.28,
  );
  group.add(shadow);

  // Only the authored pouch art is perspective-warped. The shadow and all input
  // geometry stay in ordinary 2D space, so this effect cannot move the tear rail.
  const perspectiveGroup = scene.add.container(0, 0);
  group.add(perspectiveGroup);

  const bodyLayer = scene.add.container(0, 0);
  const body = scene.add.rectangle(0, POUCH_PRESENTATION.body.y, 350, 340, 0xa89ebd, 0);
  const variantPresentation = POUCH_VARIANT_PRESENTATION[variant];
  const bodyPresentation = {
    ...POUCH_PRESENTATION.body,
    x: POUCH_PRESENTATION.body.x + variantPresentation.bodyOffsetX,
    y: POUCH_PRESENTATION.body.y + variantPresentation.bodyOffsetY,
    displayWidth: POUCH_PRESENTATION.body.displayWidth + variantPresentation.bodyWidthOffset,
  };
  const stripPresentation = {
    ...POUCH_PRESENTATION.strip,
    x: POUCH_PRESENTATION.strip.x + variantPresentation.stripOffsetX,
    y: POUCH_PRESENTATION.strip.y + variantPresentation.stripOffsetY,
    displayWidth: POUCH_PRESENTATION.strip.displayWidth + variantPresentation.stripWidthOffset,
  };
  const tabPresentation = {
    ...POUCH_PRESENTATION.tab,
    x: POUCH_PRESENTATION.tab.x + variantPresentation.tabOffsetX,
    y: POUCH_PRESENTATION.tab.y + variantPresentation.tabOffsetY,
    displayWidth: POUCH_PRESENTATION.tab.displayWidth + variantPresentation.tabWidthOffset,
  };

  const bodyTexture = staticTextureKey(pouchStaticArtId(variant, 'body', lootPoolId));
  if (scene.textures.exists(bodyTexture)) {
    bodyLayer.add(body);
    addPouchLayer(scene, bodyLayer, bodyTexture, bodyPresentation);
  } else {
    addProceduralBody(scene, bodyLayer, body);
  }


  // There is deliberately no dark synthetic mouth. Opening is represented by
  // the real background gap created as the body separates from the removable
  // top, with only subtle foil edge highlights appearing during drag.
  const openingWidth = 286;
  const openingLeft = -openingWidth / 2;
  const openingY = POUCH_PRESENTATION.tearLineY + 3;
  const lowerLip = scene.add
    .rectangle(openingLeft, openingY, openingWidth, 3, 0xd9d0e3, 1)
    .setOrigin(0, 0.5)
    .setAlpha(0);
  const innerGlow = scene.add
    .rectangle(openingLeft + 10, openingY - 3, openingWidth - 20, 2, 0xb98bda, 1)
    .setOrigin(0, 0.5)
    .setAlpha(0);
  bodyLayer.add([lowerLip, innerGlow]);
  perspectiveGroup.add(bodyLayer);

  const strip = scene.add.container(0, 0);

  const stripTexture = staticTextureKey(pouchStaticArtId(variant, 'tear-strip', lootPoolId));
  let stripImage: Phaser.GameObjects.Image | null = null;
  if (scene.textures.exists(stripTexture)) {
    stripImage = addPouchLayer(scene, strip, stripTexture, stripPresentation);
  } else {
    addProceduralStrip(scene, strip);
  }

  const tabStartX = 0;
  const tabEndX = POUCH_PRESENTATION.tabTravel;
  const tab = scene.add.container(tabStartX, 0);
  const tabTexture = staticTextureKey(pouchStaticArtId(variant, 'star-tab', lootPoolId));
  if (scene.textures.exists(tabTexture)) {
    addPouchLayer(scene, tab, tabTexture, tabPresentation);
  } else {
    tab.add(
      scene.add
        .text(POUCH_PRESENTATION.hitboxX, POUCH_PRESENTATION.hitboxY, '★', {
          color: '#8157d8',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '68px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );
  }

  const dragZone = scene.add
    .zone(
      POUCH_PRESENTATION.hitboxX,
      POUCH_PRESENTATION.hitboxY,
      POUCH_PRESENTATION.hitboxSize,
      POUCH_PRESENTATION.hitboxSize,
    )
    .setInteractive({ useHandCursor: true });
  tab.add(dragZone);
  strip.add(tab);
  perspectiveGroup.add(strip);
  root.add(group);

  const perspective = attachPouchPerspective(scene, perspectiveGroup);

  const visual: PouchVisual = {
    group,
    body,
    bodyLayer,
    strip,
    tab,
    dragZone,
    perspective,
    revealOcclusionUsed: false,
    tabStartX,
    tabEndX,
  };
  root.setData('activePouchVisual', visual);

  const syncTearVisual = (): void => {
    if (!group.active || !tab.active) {
      scene.events.off(Phaser.Scenes.Events.UPDATE, syncTearVisual);
      return;
    }

    const rawProgress = Phaser.Math.Clamp(
      (tab.x - tabStartX) / Math.max(1, tabEndX - tabStartX),
      0,
      1,
    );
    const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);

    bodyLayer.setY(progress * 9);
    tab.setY(progress * 4);
    lowerLip.setAlpha(progress * 0.72);
    innerGlow.setAlpha(progress * 0.48);

    if (stripImage) {
      const sourceWidth = Math.max(1, stripImage.width);
      const sourceHeight = Math.max(1, stripImage.height);
      const remainingFraction = 1 - rawProgress * 0.88;
      const remainingWidth = Math.max(1, Math.round(sourceWidth * remainingFraction));
      const stripCropX = Math.max(0, sourceWidth - remainingWidth);
      stripImage.setCrop(stripCropX, 0, remainingWidth, sourceHeight);
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, syncTearVisual);
  group.once('destroy', () => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, syncTearVisual);
  });

  return visual;
};

export interface CollectibleVisual {
  group: Phaser.GameObjects.Container;
  accentColor: number;
  presentation: CollectiblePresentation;
  perspective: PouchPerspectiveController | null;
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
  presentation: CollectiblePresentation,
  textureKey: string,
): {
  group: Phaser.GameObjects.Container;
  artTarget: Phaser.GameObjects.Container;
  filterWidth: number;
  filterHeight: number;
} => {
  const group = scene.add.container(0, 0);
  const artTarget = scene.add.container(0, 0);
  const artContent = scene.add.container(0, 0);
  const image = scene.add
    .image(presentation.artOffsetX, presentation.artOffsetY, textureKey)
    .setOrigin(0.5);
  image.setScale(presentation.assetWidth / Math.max(1, image.width));
  artContent.add(image);
  artTarget.add(artContent);

  const visualBottom = presentation.artOffsetY + image.displayHeight / 2;
  const shadowWidth = presentation.assetWidth * 0.72;
  const shadow = scene.add.ellipse(
    presentation.artOffsetX,
    visualBottom - 8,
    shadowWidth,
    28,
    0x050408,
    0.2,
  );
  group.add([shadow, artTarget]);
  artTarget.setDepth(1);

  const filterWidth = Math.max(320, presentation.assetWidth + 72);
  const filterHeight = Math.max(320, image.displayHeight + 72);
  return { group, artTarget, filterWidth, filterHeight };
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
  const presentation = getCollectiblePresentation(familyId);
  const textureKey = collectibleId ? collectibleTextureKey(collectibleId) : null;
  const assetVisual =
    textureKey && scene.textures.exists(textureKey)
      ? createAssetCollectible(scene, presentation, textureKey)
      : null;
  const group = assetVisual?.group
    ?? (familyId === 'camera'
      ? createCamera(scene, accentColor)
      : familyId === 'flip-phone'
        ? createFlipPhone(scene, accentColor)
        : createGenericDevice(scene, accentColor));
  group.setPosition(x, y);
  root.add(group);

  // Attach only after parenting so framebuffer density sees the real logical
  // root/display scale. A small extra boost also covers the later reveal-scale
  // tween without letting the filter become soft at its settled hero size.
  const perspective = assetVisual
    ? attachCollectiblePerspective(
        scene,
        assetVisual.artTarget,
        assetVisual.filterWidth,
        assetVisual.filterHeight,
      )
    : null;
  group.setData('perspective', perspective);

  const pouch = root.getData('activePouchVisual') as PouchVisual | undefined;
  if (
    pouch &&
    pouch.group.active &&
    pouch.group.alpha > 0.01 &&
    !pouch.revealOcclusionUsed
  ) {
    pouch.revealOcclusionUsed = true;
    // Establish the reveal order once, before the collectible becomes visible.
    // The pouch stays above the reward until it fades away; there is no delayed
    // bringToTop swap, so the reward cannot visibly jump between z-layers.
    root.bringToTop(pouch.group);
  }

  return { group, accentColor, presentation, perspective };
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
