from pathlib import Path

visuals_path = Path('src/game/ui/openingVisuals.ts')
visuals = visuals_path.read_text()

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
  perspectiveLayers: Phaser.GameObjects.Plane[];
  revealOcclusionUsed: boolean;
  tabStartX: number;
  tabEndX: number;
}
"""
if old_interface not in visuals:
    raise SystemExit('PouchVisual interface anchor missing')
visuals = visuals.replace(old_interface, new_interface, 1)

old_add_layer = """const addPouchLayer = (
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
"""
new_add_layer = """const addPouchLayer = (
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  textureKey: string,
  presentation: PouchLayerPresentation,
  perspectiveLayers: Phaser.GameObjects.Plane[],
): Phaser.GameObjects.Image | Phaser.GameObjects.Plane => {
  if (scene.game.renderer.type === Phaser.WEBGL) {
    const frame = scene.textures.getFrame(textureKey);
    const plane = scene.add.plane(presentation.x, presentation.y, textureKey, undefined, 1, 1, false);
    plane.setViewHeight(frame.height);
    plane.setScale(presentation.displayWidth / Math.max(1, frame.width));
    plane.hideCCW = false;
    perspectiveLayers.push(plane);
    container.add(plane);
    return plane;
  }

  const image = scene.add.image(presentation.x, presentation.y, textureKey).setOrigin(0.5);
  image.setScale(presentation.displayWidth / Math.max(1, image.width));
  container.add(image);
  return image;
};
"""
if old_add_layer not in visuals:
    raise SystemExit('addPouchLayer anchor missing')
visuals = visuals.replace(old_add_layer, new_add_layer, 1)

old_group = """  const group = scene.add.container(x, y);
  const shadow = scene.add.ellipse(
"""
new_group = """  const group = scene.add.container(x, y);
  const perspectiveLayers: Phaser.GameObjects.Plane[] = [];
  const shadow = scene.add.ellipse(
"""
if old_group not in visuals:
    raise SystemExit('group anchor missing')
visuals = visuals.replace(old_group, new_group, 1)

visuals = visuals.replace(
    "addPouchLayer(scene, bodyLayer, bodyTexture, bodyPresentation);",
    "addPouchLayer(scene, bodyLayer, bodyTexture, bodyPresentation, perspectiveLayers);",
    1,
)

old_strip = """  const stripTexture = staticTextureKey(pouchStaticArtId(variant, 'tear-strip', lootPoolId));
  let stripImage: Phaser.GameObjects.Image | null = null;
  if (scene.textures.exists(stripTexture)) {
    stripImage = addPouchLayer(scene, strip, stripTexture, stripPresentation);
  } else {
    addProceduralStrip(scene, strip);
  }
"""
new_strip = """  const stripTexture = staticTextureKey(pouchStaticArtId(variant, 'tear-strip', lootPoolId));
  if (scene.textures.exists(stripTexture)) {
    addPouchLayer(scene, strip, stripTexture, stripPresentation, perspectiveLayers);
  } else {
    addProceduralStrip(scene, strip);
  }
"""
if old_strip not in visuals:
    raise SystemExit('strip anchor missing')
visuals = visuals.replace(old_strip, new_strip, 1)

visuals = visuals.replace(
    "addPouchLayer(scene, tab, tabTexture, tabPresentation);",
    "addPouchLayer(scene, tab, tabTexture, tabPresentation, perspectiveLayers);",
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
    perspectiveLayers,
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
const POUCH_POINTER_PERSPECTIVE_YAW_MAX_DEG = 8;
const POUCH_POINTER_PERSPECTIVE_PITCH_MAX_DEG = 4;
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

    // Perspective is applied to the authored raster layers themselves instead of
    // rotating the whole pouch container. This keeps the tear hitbox and drag rail
    // in stable 2D coordinates while the foil art appears to turn toward the mouse.
    pouch.group.angle = 0;

    const pointer = this.input.activePointer;
    const pointerType = (pointer.event as PointerEvent | undefined)?.pointerType;
    const canTilt =
      pouch.perspectiveLayers.length > 0 &&
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
      targetYaw = normalizedX * POUCH_POINTER_PERSPECTIVE_YAW_MAX_DEG;
      targetPitch = -normalizedY * POUCH_POINTER_PERSPECTIVE_PITCH_MAX_DEG;
    }

    const response = 1 - Math.exp(-Math.max(0, delta) / POUCH_POINTER_PERSPECTIVE_RESPONSE_MS);
    for (const layer of pouch.perspectiveLayers) {
      layer.rotateY = Phaser.Math.Linear(layer.rotateY, targetYaw, response);
      layer.rotateX = Phaser.Math.Linear(layer.rotateX, targetPitch, response);
      if (Math.abs(layer.rotateY - targetYaw) < 0.01) layer.rotateY = targetYaw;
      if (Math.abs(layer.rotateX - targetPitch) < 0.01) layer.rotateX = targetPitch;
    }
  }
"""
if old_update not in scene:
    raise SystemExit('pointer tilt update anchor missing')
scene = scene.replace(old_update, new_update, 1)

scene_path.write_text(scene)
