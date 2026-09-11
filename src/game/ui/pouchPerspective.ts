import Phaser from 'phaser';

const FILTER_NODE = 'FilterPouchPerspective';

const FRAGMENT_SHADER = [
  '#pragma phaserTemplate(shaderName)',
  'precision mediump float;',
  'uniform sampler2D uMainSampler;',
  'uniform float yaw;',
  'uniform float pitch;',
  'varying vec2 outTexCoord;',
  '#pragma phaserTemplate(fragmentHeader)',
  'void main()',
  '{',
  '    vec2 q = outTexCoord;',
  '    float yawAbs = abs(yaw);',
  '    float pitchAbs = abs(pitch);',
  '',
  '    float widthBase = 1.0 - 0.055 * yawAbs - 0.030 * pitchAbs;',
  '    float rowWidth = widthBase * (1.0 + pitch * (q.y - 0.5) * 0.14);',
  '    float centerX = 0.5 + yaw * 0.015;',
  '    float u = (q.x - centerX) / max(0.72, rowWidth) + 0.5;',
  '',
  '    float heightBase = 1.0 - 0.030 * yawAbs - 0.050 * pitchAbs;',
  '    float colHeight = heightBase * (1.0 - yaw * (u - 0.5) * 0.18);',
  '    float centerY = 0.5 - pitch * 0.012;',
  '    float v = (q.y - centerY) / max(0.72, colHeight) + 0.5;',
  '',
  '    if (u < 0.0 || u > 1.0 || v < 0.0 || v > 1.0)',
  '    {',
  '        gl_FragColor = vec4(0.0);',
  '    }',
  '    else',
  '    {',
  '        gl_FragColor = texture2D(uMainSampler, vec2(u, v));',
  '    }',
  '}',
].join('\n');

export class PouchPerspectiveController extends Phaser.Filters.Controller {
  public yaw = 0;
  public pitch = 0;

  public constructor(camera: Phaser.Cameras.Scene2D.Camera) {
    super(camera, FILTER_NODE);
  }
}

class FilterPouchPerspective extends Phaser.Renderer.WebGL.RenderNodes.BaseFilterShader {
  public constructor(manager: Phaser.Renderer.WebGL.RenderNodes.RenderNodeManager) {
    super(FILTER_NODE, manager, null, FRAGMENT_SHADER);
  }

  public setupUniforms(controller: Phaser.Filters.Controller): void {
    const perspective = controller as PouchPerspectiveController;
    this.programManager.setUniform('yaw', perspective.yaw);
    this.programManager.setUniform('pitch', perspective.pitch);
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

  // The authored pouch occupies roughly 420x430 logical pixels, but the tear tab
  // and lower shadow need a little breathing room. The filter target is the art
  // container only, so the interaction geometry remains unchanged.
  target.setSize(500, 560);
  target.enableFilters();
  const camera = target.filterCamera;
  const filters = target.filters;
  if (!camera || !filters) return null;

  const controller = new PouchPerspectiveController(camera);
  controller.setPaddingOverride(8, 8, 8, 8);
  filters.internal.add(controller);
  return controller;
};
