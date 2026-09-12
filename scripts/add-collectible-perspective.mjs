import fs from 'node:fs';

const replaceOnce = (source, before, after, label) => {
  const first = source.indexOf(before);
  if (first === -1) throw new Error(`Missing ${label}`);
  if (source.indexOf(before, first + before.length) !== -1) throw new Error(`Expected one ${label}`);
  return source.slice(0, first) + after + source.slice(first + before.length);
};

const perspectivePath = 'src/game/ui/pouchPerspective.ts';
let perspective = fs.readFileSync(perspectivePath, 'utf8');

perspective = replaceOnce(
  perspective,
  `const supersampleFilterTarget = (\n  target: Phaser.GameObjects.Container,\n  supersample: number,\n): void => {\n  if (supersample <= 1.001) {\n    target.setSize(FILTER_BASE_WIDTH, FILTER_BASE_HEIGHT);\n    return;\n  }`,
  `const supersampleFilterTarget = (\n  target: Phaser.GameObjects.Container,\n  supersample: number,\n  baseWidth: number,\n  baseHeight: number,\n): void => {\n  if (supersample <= 1.001) {\n    target.setSize(baseWidth, baseHeight);\n    return;\n  }`,
  'supersample signature',
);

perspective = replaceOnce(
  perspective,
  `  target.setSize(FILTER_BASE_WIDTH * supersample, FILTER_BASE_HEIGHT * supersample);\n};`,
  `  target.setSize(baseWidth * supersample, baseHeight * supersample);\n};`,
  'supersample size',
);

perspective = replaceOnce(
  perspective,
  `export const attachPouchPerspective = (\n  scene: Phaser.Scene,\n  target: Phaser.GameObjects.Container,\n): PouchPerspectiveController | null => {`,
  `const attachPlanarPerspective = (\n  scene: Phaser.Scene,\n  target: Phaser.GameObjects.Container,\n  baseWidth: number,\n  baseHeight: number,\n): PouchPerspectiveController | null => {`,
  'attach pouch declaration',
);

perspective = replaceOnce(
  perspective,
  `  supersampleFilterTarget(target, resolveFilterSupersample(target));\n  target.enableFilters();`,
  `  supersampleFilterTarget(target, resolveFilterSupersample(target), baseWidth, baseHeight);\n  target.enableFilters();`,
  'attach supersampling call',
);

perspective += `\n\nexport const attachPouchPerspective = (\n  scene: Phaser.Scene,\n  target: Phaser.GameObjects.Container,\n): PouchPerspectiveController | null =>\n  attachPlanarPerspective(scene, target, FILTER_BASE_WIDTH, FILTER_BASE_HEIGHT);\n\nexport const attachCollectiblePerspective = (\n  scene: Phaser.Scene,\n  target: Phaser.GameObjects.Container,\n  width: number,\n  height: number,\n): PouchPerspectiveController | null =>\n  attachPlanarPerspective(scene, target, width, height);\n`;

fs.writeFileSync(perspectivePath, perspective);

const visualsPath = 'src/game/ui/openingVisuals.ts';
let visuals = fs.readFileSync(visualsPath, 'utf8');

visuals = replaceOnce(
  visuals,
  `import { attachPouchPerspective, type PouchPerspectiveController } from './pouchPerspective';`,
  `import {\n  attachCollectiblePerspective,\n  attachPouchPerspective,\n  type PouchPerspectiveController,\n} from './pouchPerspective';`,
  'perspective import',
);

visuals = replaceOnce(
  visuals,
  `export interface CollectibleVisual {\n  group: Phaser.GameObjects.Container;\n  accentColor: number;\n  presentation: CollectiblePresentation;\n}`,
  `export interface CollectibleVisual {\n  group: Phaser.GameObjects.Container;\n  accentColor: number;\n  presentation: CollectiblePresentation;\n  perspective: PouchPerspectiveController | null;\n}`,
  'collectible visual interface',
);

const assetPattern = /const createAssetCollectible = \([\s\S]*?\n};\n\nexport const createCollectibleVisual/;
const assetMatches = visuals.match(new RegExp(assetPattern.source, 'g')) ?? [];
if (assetMatches.length !== 1) throw new Error(`Expected one createAssetCollectible block, found ${assetMatches.length}`);

const assetReplacement = `const createAssetCollectible = (\n  scene: Phaser.Scene,\n  presentation: CollectiblePresentation,\n  textureKey: string,\n): { group: Phaser.GameObjects.Container; perspective: PouchPerspectiveController | null } => {\n  const group = scene.add.container(0, 0);\n  const artTarget = scene.add.container(0, 0);\n  const artContent = scene.add.container(0, 0);\n  const image = scene.add\n    .image(presentation.artOffsetX, presentation.artOffsetY, textureKey)\n    .setOrigin(0.5);\n  image.setScale(presentation.assetWidth / Math.max(1, image.width));\n  artContent.add(image);\n  artTarget.add(artContent);\n\n  const visualBottom = presentation.artOffsetY + image.displayHeight / 2;\n  const shadowWidth = presentation.assetWidth * 0.72;\n  const shadow = scene.add.ellipse(\n    presentation.artOffsetX,\n    visualBottom - 8,\n    shadowWidth,\n    28,\n    0x050408,\n    0.2,\n  );\n  group.add([shadow, artTarget]);\n  artTarget.setDepth(1);\n\n  const filterWidth = Math.max(320, presentation.assetWidth + 72);\n  const filterHeight = Math.max(320, image.displayHeight + 72);\n  const perspective = attachCollectiblePerspective(scene, artTarget, filterWidth, filterHeight);\n  return { group, perspective };\n};\n\nexport const createCollectibleVisual`;
visuals = visuals.replace(assetPattern, assetReplacement);

const createVisualPattern = /  const textureKey = collectibleId \? collectibleTextureKey\(collectibleId\) : null;\n  const group =\n[\s\S]*?\n          : createGenericDevice\(scene, accentColor\);/;
const createVisualMatches = visuals.match(new RegExp(createVisualPattern.source, 'g')) ?? [];
if (createVisualMatches.length !== 1) throw new Error(`Expected one collectible group selection block, found ${createVisualMatches.length}`);

const createVisualReplacement = `  const textureKey = collectibleId ? collectibleTextureKey(collectibleId) : null;\n  const assetVisual =\n    textureKey && scene.textures.exists(textureKey)\n      ? createAssetCollectible(scene, presentation, textureKey)\n      : null;\n  const group = assetVisual?.group\n    ?? (familyId === 'camera'\n      ? createCamera(scene, accentColor)\n      : familyId === 'flip-phone'\n        ? createFlipPhone(scene, accentColor)\n        : createGenericDevice(scene, accentColor));\n  const perspective = assetVisual?.perspective ?? null;\n  group.setData('perspective', perspective);`;
visuals = visuals.replace(createVisualPattern, createVisualReplacement);

visuals = replaceOnce(
  visuals,
  `  return { group, accentColor, presentation };`,
  `  return { group, accentColor, presentation, perspective };`,
  'collectible return',
);

fs.writeFileSync(visualsPath, visuals);

const openingPath = 'src/game/scenes/OpeningScene.ts';
let opening = fs.readFileSync(openingPath, 'utf8');

opening = replaceOnce(
  opening,
  `import { addCoverArt } from '../ui/staticArt';`,
  `import { addCoverArt } from '../ui/staticArt';\nimport type { PouchPerspectiveController } from '../ui/pouchPerspective';`,
  'perspective controller import',
);

opening = replaceOnce(
  opening,
  `const POUCH_POINTER_PERSPECTIVE_RESPONSE_MS = 105;`,
  `const POUCH_POINTER_PERSPECTIVE_RESPONSE_MS = 105;\nconst COLLECTIBLE_POINTER_PERSPECTIVE_YAW_MAX = 0.85;\nconst COLLECTIBLE_POINTER_PERSPECTIVE_PITCH_MAX = 0.55;`,
  'collectible perspective constants',
);

const updatePattern = /  public update\(_time: number, delta: number\): void \{[\s\S]*?\n  \}\n\n  private async initialize/;
const updateMatches = opening.match(new RegExp(updatePattern.source, 'g')) ?? [];
if (updateMatches.length !== 1) throw new Error(`Expected one update method, found ${updateMatches.length}`);

const updateReplacement = `  public update(_time: number, delta: number): void {\n    const pointer = this.input.activePointer;\n    const pointerType = (pointer.event as PointerEvent | undefined)?.pointerType;\n    const canFollowPointer =\n      Boolean(pointer.event) &&\n      this.game.canvas.matches(':hover') &&\n      !pointer.isDown &&\n      (pointerType === undefined || pointerType === 'mouse');\n\n    let normalizedX = 0;\n    let normalizedY = 0;\n    if (canFollowPointer) {\n      const halfWidth = Math.max(1, this.scale.width * 0.5);\n      const halfHeight = Math.max(1, this.scale.height * 0.5);\n      normalizedX = Phaser.Math.Clamp((pointer.x - halfWidth) / halfWidth, -1, 1);\n      normalizedY = Phaser.Math.Clamp((pointer.y - halfHeight) / halfHeight, -1, 1);\n    }\n\n    const response = 1 - Math.exp(-Math.max(0, delta) / POUCH_POINTER_PERSPECTIVE_RESPONSE_MS);\n    const drivePerspective = (\n      perspective: PouchPerspectiveController | null | undefined,\n      enabled: boolean,\n      yawMax: number,\n      pitchMax: number,\n    ): void => {\n      if (!perspective) return;\n      const targetYaw = enabled ? normalizedX * yawMax : 0;\n      const targetPitch = enabled ? -normalizedY * pitchMax : 0;\n      perspective.yaw = Phaser.Math.Linear(perspective.yaw, targetYaw, response);\n      perspective.pitch = Phaser.Math.Linear(perspective.pitch, targetPitch, response);\n      if (Math.abs(perspective.yaw - targetYaw) < 0.001) perspective.yaw = targetYaw;\n      if (Math.abs(perspective.pitch - targetPitch) < 0.001) perspective.pitch = targetPitch;\n    };\n\n    const pouch = this.pouch;\n    if (pouch?.group.active) {\n      drivePerspective(\n        pouch.perspective,\n        this.phase === 'idle' &&\n          !this.dropSwitchInFlight &&\n          !this.pouchArtLoadInFlight &&\n          canFollowPointer,\n        POUCH_POINTER_PERSPECTIVE_YAW_MAX,\n        POUCH_POINTER_PERSPECTIVE_PITCH_MAX,\n      );\n      pouch.group.angle = 0;\n    }\n\n    const resultTarget = this.resultBreathTarget;\n    const collectiblePerspective = resultTarget?.getData('perspective') as\n      | PouchPerspectiveController\n      | null\n      | undefined;\n    drivePerspective(\n      collectiblePerspective,\n      this.phase === 'result' && Boolean(resultTarget?.active) && canFollowPointer,\n      COLLECTIBLE_POINTER_PERSPECTIVE_YAW_MAX,\n      COLLECTIBLE_POINTER_PERSPECTIVE_PITCH_MAX,\n    );\n  }\n\n  private async initialize`;
opening = opening.replace(updatePattern, updateReplacement);

opening = replaceOnce(
  opening,
  `  private stopRewardBreathing(): void {\n    if (!this.resultBreathTarget) return;\n    this.tweens.killTweensOf(this.resultBreathTarget);\n    this.resultBreathTarget.setScale(this.resultBreathBaseScale);\n    this.resultBreathTarget = null;\n    this.resultBreathBaseScale = 1;\n  }`,
  `  private stopRewardBreathing(): void {\n    if (!this.resultBreathTarget) return;\n    this.tweens.killTweensOf(this.resultBreathTarget);\n    this.resultBreathTarget.setScale(this.resultBreathBaseScale);\n    const perspective = this.resultBreathTarget.getData('perspective') as\n      | PouchPerspectiveController\n      | null\n      | undefined;\n    if (perspective) {\n      perspective.yaw = 0;\n      perspective.pitch = 0;\n    }\n    this.resultBreathTarget = null;\n    this.resultBreathBaseScale = 1;\n  }`,
  'stop reward breathing',
);

fs.writeFileSync(openingPath, opening);
