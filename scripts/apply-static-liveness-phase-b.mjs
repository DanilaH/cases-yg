import fs from 'node:fs';

const replaceOnce = (source, before, after, label) => {
  const first = source.indexOf(before);
  if (first === -1) throw new Error(`Missing ${label}`);
  if (source.indexOf(before, first + before.length) !== -1) {
    throw new Error(`Expected one ${label}`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
};

const perspectivePath = 'src/game/ui/pouchPerspective.ts';
let perspective = fs.readFileSync(perspectivePath, 'utf8');

perspective = replaceOnce(
  perspective,
  `  'uniform vec3 invH2;',\n  'varying vec2 outTexCoord;',`,
  `  'uniform vec3 invH2;',\n  'uniform float poseYaw;',\n  'uniform float posePitch;',\n  'uniform float sheenStrength;',\n  'uniform float rimStrength;',\n  'uniform vec3 materialTint;',\n  'varying vec2 outTexCoord;',`,
  'material uniforms',
);

perspective = replaceOnce(
  perspective,
  `  '    else',\n  '    {',\n  '        gl_FragColor = texture2D(uMainSampler, uv);',\n  '    }',`,
  `  '    else',\n  '    {',\n  '        vec4 sampled = texture2D(uMainSampler, uv);',\n  '        float motion = clamp(length(vec2(poseYaw, posePitch)), 0.0, 1.0);',\n  '        float sheenCoord = uv.x * 0.72 + uv.y * 0.28;',\n  '        float sheenCenter = 0.5 + clamp(poseYaw * 0.20 - posePitch * 0.14, -0.26, 0.26);',\n  '        float sheen = 1.0 - smoothstep(0.055, 0.18, abs(sheenCoord - sheenCenter));',\n  '        float edgeDistance = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));',\n  '        float rimMask = 1.0 - smoothstep(0.0, 0.075, edgeDistance);',\n  '        vec2 fromCenter = uv - vec2(0.5);',\n  '        float nearBias = clamp(0.5 + poseYaw * fromCenter.x * 2.2 - posePitch * fromCenter.y * 2.0, 0.0, 1.0);',\n  '        float alphaMask = sampled.a;',\n  '        float sheenAmount = sheenStrength * sheen * (0.08 + 0.92 * motion) * alphaMask;',\n  '        float rimAmount = rimStrength * rimMask * (0.25 + 0.75 * nearBias) * alphaMask;',\n  '        sampled.rgb += materialTint * (sheenAmount + rimAmount);',\n  '        gl_FragColor = sampled;',\n  '    }',`,
  'material shader body',
);

perspective = replaceOnce(
  perspective,
  `export class PouchPerspectiveController extends Phaser.Filters.Controller {\n  public yaw = 0;\n  public pitch = 0;`,
  `export interface PerspectiveMaterialProfile {\n  sheenStrength: number;\n  rimStrength: number;\n  tint: readonly [number, number, number];\n}\n\nexport class PouchPerspectiveController extends Phaser.Filters.Controller {\n  public yaw = 0;\n  public pitch = 0;\n  public sheenStrength = 0;\n  public rimStrength = 0;\n  public materialTint: [number, number, number] = [1, 1, 1];`,
  'controller material fields',
);

perspective = replaceOnce(
  perspective,
  `    const [invH0, invH1, invH2] = buildInverseHomography(-perspective.yaw, perspective.pitch);\n    this.programManager.setUniform('invH0', invH0);\n    this.programManager.setUniform('invH1', invH1);\n    this.programManager.setUniform('invH2', invH2);`,
  `    const projectedYaw = -perspective.yaw;\n    const [invH0, invH1, invH2] = buildInverseHomography(projectedYaw, perspective.pitch);\n    this.programManager.setUniform('invH0', invH0);\n    this.programManager.setUniform('invH1', invH1);\n    this.programManager.setUniform('invH2', invH2);\n    this.programManager.setUniform('poseYaw', projectedYaw);\n    this.programManager.setUniform('posePitch', perspective.pitch);\n    this.programManager.setUniform('sheenStrength', perspective.sheenStrength);\n    this.programManager.setUniform('rimStrength', perspective.rimStrength);\n    this.programManager.setUniform('materialTint', perspective.materialTint);`,
  'material uniform setup',
);

perspective += `\n\nexport const configurePerspectiveMaterial = (\n  controller: PouchPerspectiveController | null,\n  profile: PerspectiveMaterialProfile,\n): void => {\n  if (!controller) return;\n  controller.sheenStrength = Math.max(0, profile.sheenStrength);\n  controller.rimStrength = Math.max(0, profile.rimStrength);\n  controller.materialTint = [\n    Phaser.Math.Clamp(profile.tint[0], 0, 1),\n    Phaser.Math.Clamp(profile.tint[1], 0, 1),\n    Phaser.Math.Clamp(profile.tint[2], 0, 1),\n  ];\n};\n`;

fs.writeFileSync(perspectivePath, perspective);

const visualsPath = 'src/game/ui/openingVisuals.ts';
let visuals = fs.readFileSync(visualsPath, 'utf8');

visuals = replaceOnce(
  visuals,
  `import {\n  attachCollectiblePerspective,\n  attachPouchPerspective,\n  type PouchPerspectiveController,\n} from './pouchPerspective';`,
  `import {\n  attachCollectiblePerspective,\n  attachPouchPerspective,\n  configurePerspectiveMaterial,\n  type PerspectiveMaterialProfile,\n  type PouchPerspectiveController,\n} from './pouchPerspective';`,
  'material imports',
);

visuals = replaceOnce(
  visuals,
  `export const SECRET_REVEAL_COLOR = 0xff4d6d;\nexport const SECRET_PREMIUM_GOLD = 0xffd36a;`,
  `export const SECRET_REVEAL_COLOR = 0xff4d6d;\nexport const SECRET_PREMIUM_GOLD = 0xffd36a;\n\nconst POUCH_MATERIAL_PROFILES: Readonly<Record<PouchArtVariant, PerspectiveMaterialProfile>> = {\n  basic: { sheenStrength: 0.045, rimStrength: 0.022, tint: [0.96, 0.94, 1] },\n  charged: { sheenStrength: 0.072, rimStrength: 0.034, tint: [0.86, 0.95, 1] },\n};\n\nconst COLLECTIBLE_MATERIAL_PROFILES: Readonly<\n  Record<StandardRarity | 'secret', PerspectiveMaterialProfile>\n> = {\n  common: { sheenStrength: 0.014, rimStrength: 0.008, tint: [0.98, 0.97, 1] },\n  rare: { sheenStrength: 0.032, rimStrength: 0.016, tint: [0.70, 0.93, 1] },\n  epic: { sheenStrength: 0.050, rimStrength: 0.023, tint: [0.90, 0.72, 1] },\n  legendary: { sheenStrength: 0.070, rimStrength: 0.031, tint: [1, 0.83, 0.46] },\n  secret: { sheenStrength: 0.084, rimStrength: 0.038, tint: [1, 0.72, 0.86] },\n};`,
  'material profiles',
);

visuals = replaceOnce(
  visuals,
  `  const perspective = attachPouchPerspective(scene, perspectiveGroup);\n\n  shadow.setData('depthBaseX', shadow.x);`,
  `  const perspective = attachPouchPerspective(scene, perspectiveGroup);\n  configurePerspectiveMaterial(perspective, POUCH_MATERIAL_PROFILES[variant]);\n\n  shadow.setData('depthBaseX', shadow.x);`,
  'pouch material config',
);

visuals = replaceOnce(
  visuals,
  `  const shadow = assetVisual?.shadow ?? null;\n  group.setData('perspective', perspective);`,
  `  const shadow = assetVisual?.shadow ?? null;\n  configurePerspectiveMaterial(perspective, COLLECTIBLE_MATERIAL_PROFILES[rarity]);\n  group.setData('perspective', perspective);`,
  'collectible material config',
);

fs.writeFileSync(visualsPath, visuals);

const scenePath = 'src/game/scenes/OpeningScene.ts';
let scene = fs.readFileSync(scenePath, 'utf8');

scene = replaceOnce(
  scene,
  `    const environment = this.add.container(metrics.offsetX, 0).setScale(metrics.scale);\n    const backgroundLayer = this.add.container(0, 0);\n    const ambientLayer = this.add.container(0, 0);\n    environment.add([backgroundLayer, ambientLayer]);`,
  `    const environment = this.add.container(metrics.offsetX, 0).setScale(metrics.scale);\n    const backgroundLayer = this.add.container(0, 0);\n    const ambientLayer = this.add.container(0, 0);\n    environment.add(backgroundLayer);`,
  'environment layer ordering start',
);

scene = replaceOnce(
  scene,
  `    this.environmentBaseLayerCount = environment.list.length;\n    this.addAmbientMotion(ambientLayer, metrics);`,
  `    // Reveal backdrops are inserted after the background but before ambient\n    // motes, matching the original compositing order.\n    this.environmentBaseLayerCount = environment.list.length;\n    environment.add(ambientLayer);\n    this.addAmbientMotion(ambientLayer, metrics);`,
  'environment layer ordering finish',
);

fs.writeFileSync(scenePath, scene);
