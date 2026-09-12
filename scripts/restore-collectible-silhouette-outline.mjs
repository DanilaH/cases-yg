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
  "  'uniform float rimStrength;',\n  'uniform vec3 materialTint;',",
  "  'uniform float rimStrength;',\n  'uniform float outlineStrength;',\n  'uniform vec3 materialTint;',",
  'outline uniform',
);

perspective = replaceOnce(
  perspective,
  "  '        float alphaDrop = max(max(sampled.a - alphaLeft, sampled.a - alphaRight), max(sampled.a - alphaUp, sampled.a - alphaDown));',\n  '        float rimMask = smoothstep(0.04, 0.35, alphaDrop);',",
  "  '        float neighbourAlpha = max(max(alphaLeft, alphaRight), max(alphaUp, alphaDown));',\n  '        float alphaDrop = max(max(sampled.a - alphaLeft, sampled.a - alphaRight), max(sampled.a - alphaUp, sampled.a - alphaDown));',\n  '        float rimMask = smoothstep(0.04, 0.35, alphaDrop);',\n  '        float outlineMask = smoothstep(0.04, 0.42, max(0.0, neighbourAlpha - sampled.a));',",
  'outline mask',
);

perspective = replaceOnce(
  perspective,
  "  '        float rimAmount = rimStrength * rimMask * (0.25 + 0.75 * nearBias) * alphaMask;',\n  '        sampled.rgb += materialTint * (sheenAmount + rimAmount);',\n  '        gl_FragColor = sampled;',",
  "  '        float rimAmount = rimStrength * rimMask * (0.25 + 0.75 * nearBias) * alphaMask;',\n  '        float outlineAlpha = outlineStrength * outlineMask * (1.0 - sampled.a);',\n  '        sampled.rgb += materialTint * (sheenAmount + rimAmount + outlineAlpha);',\n  '        sampled.a = max(sampled.a, outlineAlpha);',\n  '        gl_FragColor = sampled;',",
  'outline composite',
);

perspective = replaceOnce(
  perspective,
  "export interface PerspectiveMaterialProfile {\n  sheenStrength: number;\n  rimStrength: number;\n  tint: readonly [number, number, number];\n}",
  "export interface PerspectiveMaterialProfile {\n  sheenStrength: number;\n  rimStrength: number;\n  outlineStrength: number;\n  tint: readonly [number, number, number];\n}",
  'profile outline field',
);

perspective = replaceOnce(
  perspective,
  "  public sheenStrength = 0;\n  public rimStrength = 0;\n  public materialTint: [number, number, number] = [1, 1, 1];",
  "  public sheenStrength = 0;\n  public rimStrength = 0;\n  public outlineStrength = 0;\n  public materialTint: [number, number, number] = [1, 1, 1];",
  'controller outline field',
);

perspective = replaceOnce(
  perspective,
  "    this.programManager.setUniform('rimStrength', perspective.rimStrength);\n    this.programManager.setUniform('materialTint', perspective.materialTint);",
  "    this.programManager.setUniform('rimStrength', perspective.rimStrength);\n    this.programManager.setUniform('outlineStrength', perspective.outlineStrength);\n    this.programManager.setUniform('materialTint', perspective.materialTint);",
  'outline uniform setup',
);

perspective = replaceOnce(
  perspective,
  "  controller.sheenStrength = Math.max(0, profile.sheenStrength);\n  controller.rimStrength = Math.max(0, profile.rimStrength);\n  controller.materialTint = [",
  "  controller.sheenStrength = Math.max(0, profile.sheenStrength);\n  controller.rimStrength = Math.max(0, profile.rimStrength);\n  controller.outlineStrength = Phaser.Math.Clamp(profile.outlineStrength, 0, 1);\n  controller.materialTint = [",
  'outline material config',
);

fs.writeFileSync(perspectivePath, perspective);

const visualsPath = 'src/game/ui/openingVisuals.ts';
let visuals = fs.readFileSync(visualsPath, 'utf8');

visuals = replaceOnce(
  visuals,
  "  basic: { sheenStrength: 0.045, rimStrength: 0.022, tint: [0.96, 0.94, 1] },\n  charged: { sheenStrength: 0.072, rimStrength: 0.034, tint: [0.86, 0.95, 1] },",
  "  basic: { sheenStrength: 0.045, rimStrength: 0.022, outlineStrength: 0, tint: [0.96, 0.94, 1] },\n  charged: { sheenStrength: 0.072, rimStrength: 0.034, outlineStrength: 0, tint: [0.86, 0.95, 1] },",
  'pouch outline profiles',
);

visuals = replaceOnce(
  visuals,
  "  common: { sheenStrength: 0.014, rimStrength: 0.008, tint: [0.98, 0.97, 1] },\n  rare: { sheenStrength: 0.032, rimStrength: 0.016, tint: [0.70, 0.93, 1] },\n  epic: { sheenStrength: 0.050, rimStrength: 0.023, tint: [0.90, 0.72, 1] },\n  legendary: { sheenStrength: 0.070, rimStrength: 0.031, tint: [1, 0.83, 0.46] },\n  secret: { sheenStrength: 0.084, rimStrength: 0.038, tint: [1, 0.72, 0.86] },",
  "  common: { sheenStrength: 0.014, rimStrength: 0.008, outlineStrength: 0.34, tint: [0.98, 0.97, 1] },\n  rare: { sheenStrength: 0.032, rimStrength: 0.016, outlineStrength: 0.42, tint: [0.70, 0.93, 1] },\n  epic: { sheenStrength: 0.050, rimStrength: 0.023, outlineStrength: 0.46, tint: [0.90, 0.72, 1] },\n  legendary: { sheenStrength: 0.070, rimStrength: 0.031, outlineStrength: 0.50, tint: [1, 0.83, 0.46] },\n  secret: { sheenStrength: 0.084, rimStrength: 0.038, outlineStrength: 0.54, tint: [1, 0.72, 0.86] },",
  'collectible outline profiles',
);

fs.writeFileSync(visualsPath, visuals);
