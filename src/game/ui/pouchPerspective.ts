import Phaser from 'phaser';

const FILTER_NODE = 'FilterPouchPerspective';

const FRAGMENT_SHADER = [
  '#pragma phaserTemplate(shaderName)',
  'precision mediump float;',
  'uniform sampler2D uMainSampler;',
  'uniform vec3 invH0;',
  'uniform vec3 invH1;',
  'uniform vec3 invH2;',
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
  '        gl_FragColor = texture2D(uMainSampler, uv);',
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

export class PouchPerspectiveController extends Phaser.Filters.Controller {
  public yaw = 0;
  public pitch = 0;

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
    const [invH0, invH1, invH2] = buildInverseHomography(perspective.yaw, perspective.pitch);
    this.programManager.setUniform('invH0', invH0);
    this.programManager.setUniform('invH1', invH1);
    this.programManager.setUniform('invH2', invH2);
  }
}

export const attachPouchPerspective = (
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Container,
): PouchPerspectiveController | null => {
  if (scene.game.renderer.type !== Phaser.WEBGL) return null;

  const renderer = scene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
  if (!renderer.renderNodes.hasNode(FILTER_NODE)) {
    renderer.renderNodes.addNodeConstructor(FILTER_NODE, FilterPouchPerspective);
  }

  // Give the filtered art enough room for the full body + tear strip + moving tab.
  // The shadow and input geometry remain outside this filtered render target.
  target.setSize(520, 620);
  target.enableFilters();
  const camera = target.filterCamera;
  const filters = target.filters;
  if (!camera || !filters) return null;

  const controller = new PouchPerspectiveController(camera);
  filters.internal.add(controller);
  return controller;
};
