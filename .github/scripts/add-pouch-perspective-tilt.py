from pathlib import Path

visuals_path = Path('src/game/ui/openingVisuals.ts')
visuals = visuals_path.read_text()

import_anchor = "import Phaser from 'phaser';\n\n"
import_replacement = "import Phaser from 'phaser';\n\nimport { attachPouchPerspective, type PouchPerspectiveController } from './pouchPerspective';\n\n"
if import_anchor not in visuals:
    raise SystemExit('openingVisuals import anchor missing')
visuals = visuals.replace(import_anchor, import_replacement, 1)

old_interface = """export interface PouchVisual {
  group: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Rectangle;
  bodyLayer: Phaser.GameObjects.Container;
  strip: Phaser.GameObjects.Container;
  tab: Phaser.GameObjects.Container;
  dragZone: Phaser.GameObjects.Zone;
  revealOcclusionUsed: boolean;
  tabStartX: number;
  tabEndX: number;
}
"""
new_interface = """export interface PouchVisual {
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
"""
if old_interface not in visuals:
    raise SystemExit('PouchVisual interface anchor missing')
visuals = visuals.replace(old_interface, new_interface, 1)

old_shadow_add = """  group.add(shadow);

  const bodyLayer = scene.add.container(0, 0);
"""
new_shadow_add = """  group.add(shadow);

  // Only the authored pouch art is perspective-warped. The shadow and all input
  // geometry stay in ordinary 2D space, so this effect cannot move the tear rail.
  const perspectiveGroup = scene.add.container(0, 0);
  group.add(perspectiveGroup);

  const bodyLayer = scene.add.container(0, 0);
"""
if old_shadow_add not in visuals:
    raise SystemExit('shadow/body anchor missing')
visuals = visuals.replace(old_shadow_add, new_shadow_add, 1)

if "  group.add(bodyLayer);\n" not in visuals:
    raise SystemExit('bodyLayer parent anchor missing')
visuals = visuals.replace("  group.add(bodyLayer);\n", "  perspectiveGroup.add(bodyLayer);\n", 1)

if "  group.add(strip);\n  root.add(group);\n" not in visuals:
    raise SystemExit('strip/root anchor missing')
visuals = visuals.replace(
    "  group.add(strip);\n  root.add(group);\n",
    "  perspectiveGroup.add(strip);\n  root.add(group);\n\n  const perspective = attachPouchPerspective(scene, perspectiveGroup);\n",
    1,
)

old_visual = """    strip,
    tab,
    dragZone,
    revealOcclusionUsed: false,
"""
new_visual = """    strip,
    tab,
    dragZone,
    perspective,
    revealOcclusionUsed: false,
"""
if old_visual not in visuals:
    raise SystemExit('visual object anchor missing')
visuals = visuals.replace(old_visual, new_visual, 1)

visuals_path.write_text(visuals)

scene_path = Path('src/game/scenes/OpeningScene.ts')
scene = scene_path.read_text()

old_constants = """const RESULT_HOLD_MS = OPENING_FEEL_PRESENTATION.resultReadHoldMs;
const POUCH_POINTER_TILT_MAX_DEG = 2.2;
const POUCH_POINTER_TILT_RESPONSE_MS = 85;
"""
new_constants = """const RESULT_HOLD_MS = OPENING_FEEL_PRESENTATION.resultReadHoldMs;
const POUCH_POINTER_PERSPECTIVE_YAW_MAX = 1;
const POUCH_POINTER_PERSPECTIVE_PITCH_MAX = 0.65;
const POUCH_POINTER_PERSPECTIVE_RESPONSE_MS = 105;
"""
if old_constants not in scene:
    raise SystemExit('pointer tilt constants anchor missing')
scene = scene.replace(old_constants, new_constants, 1)

old_update = """  public update(_time: number, delta: number): void {
    const pouch = this.pouch;
    if (!pouch?.group.active) return;

    const pointer = this.input.activePointer;
    const pointerType = (pointer.event as PointerEvent | undefined)?.pointerType;
    const canTilt =
      this.phase === 'idle' &&
      !this.dropSwitchInFlight &&
      !this.pouchArtLoadInFlight &&
      Boolean(pointer.event) &&
      this.game.canvas.matches(':hover') &&
      !pointer.isDown &&
      (pointerType === undefined || pointerType === 'mouse');

    let targetAngle = 0;
    if (canTilt) {
      const halfWidth = Math.max(1, this.scale.width * 0.5);
      const normalizedX = Phaser.Math.Clamp((pointer.x - halfWidth) / halfWidth, -1, 1);
      targetAngle = normalizedX * POUCH_POINTER_TILT_MAX_DEG;
    }

    const response = 1 - Math.exp(-Math.max(0, delta) / POUCH_POINTER_TILT_RESPONSE_MS);
    pouch.group.angle = Phaser.Math.Linear(pouch.group.angle, targetAngle, response);
    if (Math.abs(pouch.group.angle - targetAngle) < 0.01) pouch.group.angle = targetAngle;
  }
"""
new_update = """  public update(_time: number, delta: number): void {
    const pouch = this.pouch;
    if (!pouch?.group.active) return;

    // PR #123 used ordinary 2D rotation. Keep the pouch itself unrotated now and
    // drive a projective shader on the art container instead.
    pouch.group.angle = 0;

    const perspective = pouch.perspective;
    if (!perspective) return;

    const pointer = this.input.activePointer;
    const pointerType = (pointer.event as PointerEvent | undefined)?.pointerType;
    const canTilt =
      this.phase === 'idle' &&
      !this.dropSwitchInFlight &&
      !this.pouchArtLoadInFlight &&
      Boolean(pointer.event) &&
      this.game.canvas.matches(':hover') &&
      !pointer.isDown &&
      (pointerType === undefined || pointerType === 'mouse');

    let targetYaw = 0;
    let targetPitch = 0;
    if (canTilt) {
      const halfWidth = Math.max(1, this.scale.width * 0.5);
      const halfHeight = Math.max(1, this.scale.height * 0.5);
      const normalizedX = Phaser.Math.Clamp((pointer.x - halfWidth) / halfWidth, -1, 1);
      const normalizedY = Phaser.Math.Clamp((pointer.y - halfHeight) / halfHeight, -1, 1);
      targetYaw = normalizedX * POUCH_POINTER_PERSPECTIVE_YAW_MAX;
      targetPitch = -normalizedY * POUCH_POINTER_PERSPECTIVE_PITCH_MAX;
    }

    const response = 1 - Math.exp(-Math.max(0, delta) / POUCH_POINTER_PERSPECTIVE_RESPONSE_MS);
    perspective.yaw = Phaser.Math.Linear(perspective.yaw, targetYaw, response);
    perspective.pitch = Phaser.Math.Linear(perspective.pitch, targetPitch, response);
    if (Math.abs(perspective.yaw - targetYaw) < 0.001) perspective.yaw = targetYaw;
    if (Math.abs(perspective.pitch - targetPitch) < 0.001) perspective.pitch = targetPitch;
  }
"""
if old_update not in scene:
    raise SystemExit('pointer tilt update anchor missing')
scene = scene.replace(old_update, new_update, 1)

scene_path.write_text(scene)
