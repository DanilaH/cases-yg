import Phaser from 'phaser';

const FILTER_NODE = 'FilterPouchPerspective';
const FILTER_BASE_WIDTH = 520;
const FILTER_BASE_HEIGHT = 620;
const FILTER_MAX_SUPERSAMPLE = 3;

const FRAGMENT_SHADER = [
  '#pragma phaserTemplate(shaderName)',
  'precision mediump float;',
  'uniform sampler2D uMainSampler;',
  'uniform vec3 invH0;',
  'uniform vec3 invH1;',
  'uniform vec3 invH2;',
  'uniform float poseYaw;',
  'uniform float posePitch;',
  'uniform float sheenStrength;',
  'uniform float rimStrength;',
  'uniform vec3 materialTint;',
  'varying vec2 outTexCoord;',
  '#pragma phaserTemplate(fragmentHeader)',
  'void main()',
  '{',
  '    vec3 p = vec3(outTexCoord, 1.0);',
  '    float w = dot(invH2, p);',
  '    float safeW = abs(w) < 0.00001 ? (w < 0.0 ? -0.00001 : 0.00001) : w;',
  '    vec2 uv = vec2(dot(invH0, p), dot(invH1, p)) / safeW;',
  '',
  '    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0)',
  '    {',
  '        gl_FragColor = vec4(0.0);',
  '    }',
  '    else',
  '    {',
  '        vec4 sampled = texture2D(uMainSampler, uv);',
  '        float motion = clamp(length(vec2(poseYaw, posePitch)), 0.0, 1.0);',
  '        float sheenCoord = uv.x * 0.72 + uv.y * 0.28;',
  '        float sheenCenter = 0.5 + clamp(poseYaw * 0.20 - posePitch * 0.14, -0.26, 0.26);',
  '        float sheen = 1.0 - smoothstep(0.055, 0.18, abs(sheenCoord - sheenCenter));',
  '        float edgeDistance = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));',
  '        float rimMask = 1.0 - smoothstep(0.0, 0.075, edgeDistance);',
  '        vec2 fromCenter = uv - vec2(0.5);',
  '        float nearBias = clamp(0.5 + poseYaw * fromCenter.x * 2.2 - posePitch * fromCenter.y * 2.0, 0.0, 1.0);',
  '        float alphaMask = sampled.a;',
  '        float sheenAmount = sheenStrength * sheen * (0.08 + 0.92 * motion) * alphaMask;',
  '        float rimAmount = rimStrength * rimMask * (0.25 + 0.75 * nearBias) * alphaMask;',
  '        sampled.rgb += materialTint * (sheenAmount + rimAmount);',
  '        gl_FragColor = sampled;',
  '    }',
  '}',
].join('\n');

type HomographyRows = readonly [number[], number[], number[]];

const identityHomography = (): HomographyRows => [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

/**
 * Build the inverse homography for a flat unit square projected into a convex
 * quadrilateral. Unlike the old row/column squash, a homography preserves
 * straight lines, so the pouch reads as one planar card/foil surface turning in
 * perspective instead of a surface bending inward like a shallow bowl.
 */
const buildInverseHomography = (yaw: number, pitch: number): HomographyRows => {
  const yawSpread = yaw * 0.04;
  const pitchSpread = pitch * 0.03;
  const shiftX = yaw * 0.006;
  const shiftY = -pitch * 0.004;

  // Source corner order: top-left, top-right, bottom-right, bottom-left.
  // Positive yaw means the cursor is to the right: the right edge becomes the
  // near edge and grows, while the left edge recedes. Positive pitch means the
  // cursor is above: the top edge becomes the near edge and grows.
  const x0 = -pitchSpread + shiftX;
  const y0 = yawSpread + shiftY;
  const x1 = 1 + pitchSpread + shiftX;
  const y1 = -yawSpread + shiftY;
  const x2 = 1 - pitchSpread + shiftX;
  const y2 = 1 + yawSpread + shiftY;
  const x3 = pitchSpread + shiftX;
  const y3 = 1 - yawSpread + shiftY;

  // Closed-form square -> quad projective transform.
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const perspectiveDenominator = dx1 * dy2 - dx2 * dy1;

  let g = 0;
  let h = 0;
  if (Math.abs(perspectiveDenominator) > 1e-8) {
    g = (dx3 * dy2 - dx2 * dy3) / perspectiveDenominator;
    h = (dx1 * dy3 - dx3 * dy1) / perspectiveDenominator;
  }

  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + h * x3;
  const c = x0;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + h * y3;
  const f = y0;

  // Invert [a b c; d e f; g h 1] so the fragment shader can map each output
  // pixel back into the original pouch texture.
  const m00 = e - f * h;
  const m01 = c * h - b;
  const m02 = b * f - c * e;
  const m10 = f * g - d;
  const m11 = a - c * g;
  const m12 = c * d - a * f;
  const m20 = d * h - e * g;
  const m21 = b * g - a * h;
  const m22 = a * e - b * d;
  const determinant = a * m00 + b * m10 + c * m20;

  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-8) {
    return identityHomography();
  }

  const invDet = 1 / determinant;
  return [
    [m00 * invDet, m01 * invDet, m02 * invDet],
    [m10 * invDet, m11 * invDet, m12 * invDet],
    [m20 * invDet, m21 * invDet, m22 * invDet],
  ];
};

const resolveFilterSupersample = (target: Phaser.GameObjects.Container): number => {
  const world = target.getWorldTransformMatrix().decomposeMatrix();
  const displayScale = Math.max(Math.abs(world.scaleX), Math.abs(world.scaleY));
  if (!Number.isFinite(displayScale)) return 1;
  return Phaser.Math.Clamp(displayScale, 1, FILTER_MAX_SUPERSAMPLE);
};

const supersampleFilterTarget = (
  target: Phaser.GameObjects.Container,
  supersample: number,
  baseWidth: number,
  baseHeight: number,
): void => {
  if (supersample <= 1.001) {
    target.setSize(baseWidth, baseHeight);
    return;
  }

  // Phaser internal GameObject filters rasterize at the object's raw bounds and
  // only then apply parent/world scaling. Opening's logical root is commonly
  // scaled above 1x (and can reach ~3x on HiDPI displays), so the old 520x620
  // framebuffer was being enlarged after the homography and looked soft.
  //
  // Render the same visual hierarchy at a larger local scale, then cancel that
  // scale on the filtered parent. The on-screen geometry and drag hitbox remain
  // unchanged, while the internal filter framebuffer gets `supersample` times
  // more pixels in each dimension before being composited back to the scene.
  for (const child of target.list) {
    if (child instanceof Phaser.GameObjects.Container) {
      child.setScale(child.scaleX * supersample, child.scaleY * supersample);
    }
  }
  target.setScale(target.scaleX / supersample, target.scaleY / supersample);
  target.setSize(baseWidth * supersample, baseHeight * supersample);
};

export interface PerspectiveMaterialProfile {
  sheenStrength: number;
  rimStrength: number;
  tint: readonly [number, number, number];
}

export class PouchPerspectiveController extends Phaser.Filters.Controller {
  public yaw = 0;
  public pitch = 0;
  public sheenStrength = 0;
  public rimStrength = 0;
  public materialTint: [number, number, number] = [1, 1, 1];

  public constructor(camera: Phaser.Cameras.Scene2D.Camera) {
    super(camera, FILTER_NODE);
  }
}

class FilterPouchPerspective extends Phaser.Renderer.WebGL.RenderNodes.BaseFilterShader {
  public constructor(manager: Phaser.Renderer.WebGL.RenderNodes.RenderNodeManager) {
    super(FILTER_NODE, manager, undefined, FRAGMENT_SHADER);
  }

  public setupUniforms(controller: Phaser.Filters.Controller): void {
    const perspective = controller as PouchPerspectiveController;
    // Horizontal mouse-follow felt mirrored in the planar projection. Keep the
    // vertical response untouched and flip only X/yaw at the projection boundary.
    const projectedYaw = -perspective.yaw;
    const [invH0, invH1, invH2] = buildInverseHomography(projectedYaw, perspective.pitch);
    this.programManager.setUniform('invH0', invH0);
    this.programManager.setUniform('invH1', invH1);
    this.programManager.setUniform('invH2', invH2);
    this.programManager.setUniform('poseYaw', projectedYaw);
    this.programManager.setUniform('posePitch', perspective.pitch);
    this.programManager.setUniform('sheenStrength', perspective.sheenStrength);
    this.programManager.setUniform('rimStrength', perspective.rimStrength);
    this.programManager.setUniform('materialTint', perspective.materialTint);
  }
}

const attachPlanarPerspective = (
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Container,
  baseWidth: number,
  baseHeight: number,
  supersampleBoost = 1,
): PouchPerspectiveController | null => {
  if (scene.game.renderer.type !== Phaser.WEBGL) return null;

  const renderer = scene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
  if (!renderer.renderNodes.hasNode(FILTER_NODE)) {
    renderer.renderNodes.addNodeConstructor(FILTER_NODE, FilterPouchPerspective);
  }

  // Match the internal framebuffer density to the pouch's actual on-screen
  // scale, capped to keep the transient WebGL targets bounded on large/HiDPI
  // displays. This preserves the existing visual size and interaction geometry.
  const supersample = Phaser.Math.Clamp(
    resolveFilterSupersample(target) * supersampleBoost,
    1,
    FILTER_MAX_SUPERSAMPLE,
  );
  supersampleFilterTarget(target, supersample, baseWidth, baseHeight);
  target.enableFilters();
  const camera = target.filterCamera;
  const filters = target.filters;
  if (!camera || !filters) return null;

  const controller = new PouchPerspectiveController(camera);
  filters.internal.add(controller);
  return controller;
};


export const attachPouchPerspective = (
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Container,
): PouchPerspectiveController | null =>
  attachPlanarPerspective(scene, target, FILTER_BASE_WIDTH, FILTER_BASE_HEIGHT);

export const attachCollectiblePerspective = (
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Container,
  width: number,
  height: number,
): PouchPerspectiveController | null =>
  attachPlanarPerspective(scene, target, width, height, 1.25);


export const configurePerspectiveMaterial = (
  controller: PouchPerspectiveController | null,
  profile: PerspectiveMaterialProfile,
): void => {
  if (!controller) return;
  controller.sheenStrength = Math.max(0, profile.sheenStrength);
  controller.rimStrength = Math.max(0, profile.rimStrength);
  controller.materialTint = [
    Phaser.Math.Clamp(profile.tint[0], 0, 1),
    Phaser.Math.Clamp(profile.tint[1], 0, 1),
    Phaser.Math.Clamp(profile.tint[2], 0, 1),
  ];
};
