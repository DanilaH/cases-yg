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
  `  baseWidth: number,\n  baseHeight: number,\n): PouchPerspectiveController | null => {`,
  `  baseWidth: number,\n  baseHeight: number,\n  supersampleBoost = 1,\n): PouchPerspectiveController | null => {`,
  'planar attach options',
);
perspective = replaceOnce(
  perspective,
  `  supersampleFilterTarget(target, resolveFilterSupersample(target), baseWidth, baseHeight);`,
  `  const supersample = Phaser.Math.Clamp(\n    resolveFilterSupersample(target) * supersampleBoost,\n    1,\n    FILTER_MAX_SUPERSAMPLE,\n  );\n  supersampleFilterTarget(target, supersample, baseWidth, baseHeight);`,
  'planar supersample call',
);
perspective = replaceOnce(
  perspective,
  `  attachPlanarPerspective(scene, target, width, height);`,
  `  attachPlanarPerspective(scene, target, width, height, 1.25);`,
  'collectible supersample boost',
);
fs.writeFileSync(perspectivePath, perspective);

const visualsPath = 'src/game/ui/openingVisuals.ts';
let visuals = fs.readFileSync(visualsPath, 'utf8');

const oldAsset = `): { group: Phaser.GameObjects.Container; perspective: PouchPerspectiveController | null } => {\n  const group = scene.add.container(0, 0);\n  const artTarget = scene.add.container(0, 0);`;
const newAsset = `): {\n  group: Phaser.GameObjects.Container;\n  artTarget: Phaser.GameObjects.Container;\n  filterWidth: number;\n  filterHeight: number;\n} => {\n  const group = scene.add.container(0, 0);\n  const artTarget = scene.add.container(0, 0);`;
visuals = replaceOnce(visuals, oldAsset, newAsset, 'asset collectible return type');

visuals = replaceOnce(
  visuals,
  `  const perspective = attachCollectiblePerspective(scene, artTarget, filterWidth, filterHeight);\n  return { group, perspective };`,
  `  return { group, artTarget, filterWidth, filterHeight };`,
  'asset collectible deferred attachment',
);

visuals = replaceOnce(
  visuals,
  `  const perspective = assetVisual?.perspective ?? null;\n  group.setData('perspective', perspective);\n\n  group.setPosition(x, y);\n  root.add(group);`,
  `  group.setPosition(x, y);\n  root.add(group);\n\n  // Attach only after parenting so framebuffer density sees the real logical\n  // root/display scale. A small extra boost also covers the later reveal-scale\n  // tween without letting the filter become soft at its settled hero size.\n  const perspective = assetVisual\n    ? attachCollectiblePerspective(\n        scene,\n        assetVisual.artTarget,\n        assetVisual.filterWidth,\n        assetVisual.filterHeight,\n      )\n    : null;\n  group.setData('perspective', perspective);`,
  'collectible post-parent attachment',
);

fs.writeFileSync(visualsPath, visuals);
