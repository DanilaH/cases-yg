import fs from 'node:fs';

const replaceOnce = (source, before, after, label) => {
  const first = source.indexOf(before);
  if (first === -1) throw new Error(`Missing ${label}`);
  if (source.indexOf(before, first + before.length) !== -1) {
    throw new Error(`Expected one ${label}`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
};

const path = 'src/game/ui/pouchPerspective.ts';
let source = fs.readFileSync(path, 'utf8');

source = replaceOnce(
  source,
  `  'uniform vec3 materialTint;',\n  'varying vec2 outTexCoord;',`,
  `  'uniform vec3 materialTint;',\n  'uniform vec2 texelSize;',\n  'varying vec2 outTexCoord;',`,
  'texel size uniform',
);

source = replaceOnce(
  source,
  `  '        float edgeDistance = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));',\n  '        float rimMask = 1.0 - smoothstep(0.0, 0.075, edgeDistance);',\n  '        vec2 fromCenter = uv - vec2(0.5);',`,
  `  '        vec2 edgeStep = texelSize * 2.0;',\n  '        float alphaLeft = texture2D(uMainSampler, clamp(uv - vec2(edgeStep.x, 0.0), vec2(0.0), vec2(1.0))).a;',\n  '        float alphaRight = texture2D(uMainSampler, clamp(uv + vec2(edgeStep.x, 0.0), vec2(0.0), vec2(1.0))).a;',\n  '        float alphaUp = texture2D(uMainSampler, clamp(uv - vec2(0.0, edgeStep.y), vec2(0.0), vec2(1.0))).a;',\n  '        float alphaDown = texture2D(uMainSampler, clamp(uv + vec2(0.0, edgeStep.y), vec2(0.0), vec2(1.0))).a;',\n  '        float alphaDrop = max(max(sampled.a - alphaLeft, sampled.a - alphaRight), max(sampled.a - alphaUp, sampled.a - alphaDown));',\n  '        float rimMask = smoothstep(0.04, 0.35, alphaDrop);',\n  '        vec2 fromCenter = uv - vec2(0.5);',`,
  'silhouette rim sampling',
);

source = replaceOnce(
  source,
  `  public rimStrength = 0;\n  public materialTint: [number, number, number] = [1, 1, 1];`,
  `  public rimStrength = 0;\n  public materialTint: [number, number, number] = [1, 1, 1];\n  public texelSize: [number, number] = [1 / FILTER_BASE_WIDTH, 1 / FILTER_BASE_HEIGHT];`,
  'controller texel size',
);

source = replaceOnce(
  source,
  `    this.programManager.setUniform('rimStrength', perspective.rimStrength);\n    this.programManager.setUniform('materialTint', perspective.materialTint);`,
  `    this.programManager.setUniform('rimStrength', perspective.rimStrength);\n    this.programManager.setUniform('materialTint', perspective.materialTint);\n    this.programManager.setUniform('texelSize', perspective.texelSize);`,
  'texel uniform setup',
);

source = replaceOnce(
  source,
  `  const controller = new PouchPerspectiveController(camera);\n  filters.internal.add(controller);`,
  `  const controller = new PouchPerspectiveController(camera);\n  controller.texelSize = [\n    1 / Math.max(1, target.width),\n    1 / Math.max(1, target.height),\n  ];\n  filters.internal.add(controller);`,
  'controller texel sizing',
);

fs.writeFileSync(path, source);
