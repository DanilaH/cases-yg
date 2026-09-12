import fs from 'node:fs';

const replaceOnce = (source, before, after, label) => {
  const first = source.indexOf(before);
  if (first === -1) throw new Error(`Missing ${label}`);
  if (source.indexOf(before, first + before.length) !== -1) {
    throw new Error(`Expected one ${label}`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
};

const visualsPath = 'src/game/ui/openingVisuals.ts';
let visuals = fs.readFileSync(visualsPath, 'utf8');

visuals = replaceOnce(
  visuals,
  `export interface PouchVisual {\n  group: Phaser.GameObjects.Container;\n  body: Phaser.GameObjects.Rectangle;`,
  `export interface PouchVisual {\n  group: Phaser.GameObjects.Container;\n  shadow: Phaser.GameObjects.Ellipse;\n  body: Phaser.GameObjects.Rectangle;`,
  'pouch shadow interface',
);

visuals = replaceOnce(
  visuals,
  `  const visual: PouchVisual = {\n    group,\n    body,`,
  `  shadow.setData('depthBaseX', shadow.x);\n  shadow.setData('depthBaseY', shadow.y);\n  shadow.setData('depthBaseAlpha', shadow.alpha);\n\n  const visual: PouchVisual = {\n    group,\n    shadow,\n    body,`,
  'pouch visual shadow',
);

visuals = replaceOnce(
  visuals,
  `export interface CollectibleVisual {\n  group: Phaser.GameObjects.Container;\n  accentColor: number;\n  presentation: CollectiblePresentation;\n  perspective: PouchPerspectiveController | null;\n}`,
  `export interface CollectibleVisual {\n  group: Phaser.GameObjects.Container;\n  shadow: Phaser.GameObjects.Ellipse | null;\n  accentColor: number;\n  presentation: CollectiblePresentation;\n  perspective: PouchPerspectiveController | null;\n}`,
  'collectible interface shadow',
);

visuals = replaceOnce(
  visuals,
  `  filterWidth: number;\n  filterHeight: number;\n} => {`,
  `  filterWidth: number;\n  filterHeight: number;\n  shadow: Phaser.GameObjects.Ellipse;\n} => {`,
  'asset collectible return shadow',
);

visuals = replaceOnce(
  visuals,
  `  const filterWidth = Math.max(320, presentation.assetWidth + 72);\n  const filterHeight = Math.max(320, image.displayHeight + 72);\n  return { group, artTarget, filterWidth, filterHeight };`,
  `  shadow.setData('depthBaseX', shadow.x);\n  shadow.setData('depthBaseY', shadow.y);\n  shadow.setData('depthBaseAlpha', shadow.alpha);\n\n  const filterWidth = Math.max(320, presentation.assetWidth + 72);\n  const filterHeight = Math.max(320, image.displayHeight + 72);\n  return { group, artTarget, filterWidth, filterHeight, shadow };`,
  'asset collectible shadow data',
);

visuals = replaceOnce(
  visuals,
  `  group.setData('perspective', perspective);\n\n  const pouch = root.getData('activePouchVisual') as PouchVisual | undefined;`,
  `  const shadow = assetVisual?.shadow ?? null;\n  group.setData('perspective', perspective);\n  group.setData('depthShadow', shadow);\n\n  const pouch = root.getData('activePouchVisual') as PouchVisual | undefined;`,
  'collectible group shadow data',
);

visuals = replaceOnce(
  visuals,
  `  return { group, accentColor, presentation, perspective };`,
  `  return { group, shadow, accentColor, presentation, perspective };`,
  'collectible return shadow',
);

fs.writeFileSync(visualsPath, visuals);

const scenePath = 'src/game/scenes/OpeningScene.ts';
let scene = fs.readFileSync(scenePath, 'utf8');

scene = replaceOnce(
  scene,
  `const COLLECTIBLE_POINTER_PERSPECTIVE_YAW_MAX = 0.85;\nconst COLLECTIBLE_POINTER_PERSPECTIVE_PITCH_MAX = 0.55;`,
  `const COLLECTIBLE_POINTER_PERSPECTIVE_YAW_MAX = 0.85;\nconst COLLECTIBLE_POINTER_PERSPECTIVE_PITCH_MAX = 0.55;\nconst POINTER_IDLE_DRIFT_DELAY_MS = 1800;\nconst POINTER_IDLE_DRIFT_RAMP_MS = 1200;\nconst HERO_IDLE_DRIFT_YAW = 0.085;\nconst HERO_IDLE_DRIFT_PITCH = 0.055;\nconst BACKGROUND_PARALLAX_X = 1.8;\nconst BACKGROUND_PARALLAX_Y = 1.1;\nconst AMBIENT_PARALLAX_X = 4.6;\nconst AMBIENT_PARALLAX_Y = 2.8;\nconst ENVIRONMENT_PARALLAX_RESPONSE_MS = 180;`,
  'liveness constants',
);

scene = replaceOnce(
  scene,
  `  private environmentRoot: Phaser.GameObjects.Container | null = null;\n  private environmentLayoutKey = '';\n  private environmentBaseLayerCount = 0;`,
  `  private environmentRoot: Phaser.GameObjects.Container | null = null;\n  private environmentBackgroundLayer: Phaser.GameObjects.Container | null = null;\n  private environmentAmbientLayer: Phaser.GameObjects.Container | null = null;\n  private environmentLayoutKey = '';\n  private environmentBaseLayerCount = 0;\n  private pointerLastX = Number.NaN;\n  private pointerLastY = Number.NaN;\n  private pointerLastMovedAt = 0;`,
  'environment fields',
);

scene = replaceOnce(
  scene,
  `    this.pouchArtLoadInFlight = false;\n    this.clearTearHintTimer();`,
  `    this.pouchArtLoadInFlight = false;\n    this.pointerLastX = Number.NaN;\n    this.pointerLastY = Number.NaN;\n    this.pointerLastMovedAt = 0;\n    this.clearTearHintTimer();`,
  'pointer state reset',
);

const updatePattern = /  public update\(_time: number, delta: number\): void \{[\s\S]*?\n  \}\n\n  private async initialize/;
const updateMatches = scene.match(new RegExp(updatePattern.source, 'g')) ?? [];
if (updateMatches.length !== 1) throw new Error(`Expected one update block, found ${updateMatches.length}`);

const updateReplacement = `  public update(_time: number, delta: number): void {
    const pointer = this.input.activePointer;
    const pointerType = (pointer.event as PointerEvent | undefined)?.pointerType;
    const canFollowPointer =
      Boolean(pointer.event) &&
      this.game.canvas.matches(':hover') &&
      !pointer.isDown &&
      (pointerType === undefined || pointerType === 'mouse');

    let normalizedX = 0;
    let normalizedY = 0;
    if (canFollowPointer) {
      const halfWidth = Math.max(1, this.scale.width * 0.5);
      const halfHeight = Math.max(1, this.scale.height * 0.5);
      normalizedX = Phaser.Math.Clamp((pointer.x - halfWidth) / halfWidth, -1, 1);
      normalizedY = Phaser.Math.Clamp((pointer.y - halfHeight) / halfHeight, -1, 1);

      const moved =
        !Number.isFinite(this.pointerLastX) ||
        Math.hypot(pointer.x - this.pointerLastX, pointer.y - this.pointerLastY) > 0.35;
      if (moved) this.pointerLastMovedAt = _time;
      this.pointerLastX = pointer.x;
      this.pointerLastY = pointer.y;
    } else {
      this.pointerLastX = Number.NaN;
      this.pointerLastY = Number.NaN;
      this.pointerLastMovedAt = _time;
    }

    const idleWeight = canFollowPointer
      ? Phaser.Math.Clamp(
          (_time - this.pointerLastMovedAt - POINTER_IDLE_DRIFT_DELAY_MS) / POINTER_IDLE_DRIFT_RAMP_MS,
          0,
          1,
        )
      : 0;
    const driftX = Math.sin(_time / 3180) * HERO_IDLE_DRIFT_YAW * idleWeight;
    const driftY = Math.cos(_time / 4170) * HERO_IDLE_DRIFT_PITCH * idleWeight;
    const heroX = Phaser.Math.Clamp(normalizedX + driftX, -1, 1);
    const heroY = Phaser.Math.Clamp(normalizedY + driftY, -1, 1);

    const response = 1 - Math.exp(-Math.max(0, delta) / POUCH_POINTER_PERSPECTIVE_RESPONSE_MS);
    const drivePerspective = (
      perspective: PouchPerspectiveController | null | undefined,
      enabled: boolean,
      yawMax: number,
      pitchMax: number,
    ): void => {
      if (!perspective) return;
      const targetYaw = enabled ? heroX * yawMax : 0;
      const targetPitch = enabled ? -heroY * pitchMax : 0;
      perspective.yaw = Phaser.Math.Linear(perspective.yaw, targetYaw, response);
      perspective.pitch = Phaser.Math.Linear(perspective.pitch, targetPitch, response);
      if (Math.abs(perspective.yaw - targetYaw) < 0.001) perspective.yaw = targetYaw;
      if (Math.abs(perspective.pitch - targetPitch) < 0.001) perspective.pitch = targetPitch;
    };

    const syncDepthShadow = (
      shadow: Phaser.GameObjects.Ellipse | null | undefined,
      perspective: PouchPerspectiveController | null | undefined,
      xAmount: number,
      yAmount: number,
    ): void => {
      if (!shadow?.active || !perspective) return;
      const baseX = Number(shadow.getData('depthBaseX') ?? shadow.x);
      const baseY = Number(shadow.getData('depthBaseY') ?? shadow.y);
      const baseAlpha = Number(shadow.getData('depthBaseAlpha') ?? shadow.alpha);
      shadow
        .setPosition(baseX - perspective.yaw * xAmount, baseY + perspective.pitch * yAmount)
        .setScale(
          1 - Math.min(0.045, Math.abs(perspective.yaw) * 0.035),
          1 + Math.min(0.035, Math.abs(perspective.pitch) * 0.03),
        )
        .setAlpha(Math.max(0.1, baseAlpha - Math.abs(perspective.pitch) * 0.025));
    };

    const pouch = this.pouch;
    if (pouch?.group.active) {
      drivePerspective(
        pouch.perspective,
        this.phase === 'idle' &&
          !this.dropSwitchInFlight &&
          !this.pouchArtLoadInFlight &&
          canFollowPointer,
        POUCH_POINTER_PERSPECTIVE_YAW_MAX,
        POUCH_POINTER_PERSPECTIVE_PITCH_MAX,
      );
      syncDepthShadow(pouch.shadow, pouch.perspective, 5.5, 3.2);
      pouch.group.angle = 0;
    }

    const resultTarget = this.resultBreathTarget;
    const collectiblePerspective = resultTarget?.getData('perspective') as
      | PouchPerspectiveController
      | null
      | undefined;
    drivePerspective(
      collectiblePerspective,
      this.phase === 'result' && Boolean(resultTarget?.active) && canFollowPointer,
      COLLECTIBLE_POINTER_PERSPECTIVE_YAW_MAX,
      COLLECTIBLE_POINTER_PERSPECTIVE_PITCH_MAX,
    );
    const collectibleShadow = resultTarget?.getData('depthShadow') as Phaser.GameObjects.Ellipse | null | undefined;
    syncDepthShadow(collectibleShadow, collectiblePerspective, 4.2, 2.4);

    const parallaxResponse = 1 - Math.exp(-Math.max(0, delta) / ENVIRONMENT_PARALLAX_RESPONSE_MS);
    const environmentX = canFollowPointer ? heroX : 0;
    const environmentY = canFollowPointer ? heroY : 0;
    if (this.environmentBackgroundLayer?.active) {
      this.environmentBackgroundLayer.x = Phaser.Math.Linear(
        this.environmentBackgroundLayer.x,
        -environmentX * BACKGROUND_PARALLAX_X,
        parallaxResponse,
      );
      this.environmentBackgroundLayer.y = Phaser.Math.Linear(
        this.environmentBackgroundLayer.y,
        -environmentY * BACKGROUND_PARALLAX_Y,
        parallaxResponse,
      );
    }
    if (this.environmentAmbientLayer?.active) {
      this.environmentAmbientLayer.x = Phaser.Math.Linear(
        this.environmentAmbientLayer.x,
        -environmentX * AMBIENT_PARALLAX_X,
        parallaxResponse,
      );
      this.environmentAmbientLayer.y = Phaser.Math.Linear(
        this.environmentAmbientLayer.y,
        -environmentY * AMBIENT_PARALLAX_Y,
        parallaxResponse,
      );
    }
  }

  private async initialize`;
scene = scene.replace(updatePattern, updateReplacement);

scene = replaceOnce(
  scene,
  `    this.environmentRoot = null;\n    this.environmentLayoutKey = '';`,
  `    this.environmentRoot = null;\n    this.environmentBackgroundLayer = null;\n    this.environmentAmbientLayer = null;\n    this.environmentLayoutKey = '';`,
  'shutdown environment layers',
);

const environmentPattern = /  private ensureEnvironment\(metrics: LayoutMetrics\): void \{[\s\S]*?\n  \}\n\n  private clearAmbientMotion/;
const environmentMatches = scene.match(new RegExp(environmentPattern.source, 'g')) ?? [];
if (environmentMatches.length !== 1) throw new Error(`Expected one ensureEnvironment block, found ${environmentMatches.length}`);

const environmentReplacement = `  private ensureEnvironment(metrics: LayoutMetrics): void {
    const layoutKey = [
      metrics.offsetX.toFixed(3),
      metrics.scale.toFixed(5),
      metrics.logicalWidth.toFixed(3),
      LOGICAL_HEIGHT,
    ].join(':');
    if (this.environmentRoot?.active && this.environmentLayoutKey === layoutKey) return;

    this.clearAmbientMotion();
    if (this.environmentRoot?.active) this.environmentRoot.destroy(true);

    const environment = this.add.container(metrics.offsetX, 0).setScale(metrics.scale);
    const backgroundLayer = this.add.container(0, 0);
    const ambientLayer = this.add.container(0, 0);
    environment.add([backgroundLayer, ambientLayer]);

    const background = addCoverArt(
      this,
      backgroundLayer,
      staticTextureKey('opening-bg'),
      metrics.logicalWidth,
      LOGICAL_HEIGHT,
    );
    if (background) {
      // Small overscan keeps the 1-2 px camera parallax from exposing canvas edges.
      background.setScale(background.scaleX * 1.012, background.scaleY * 1.012);
    } else {
      backgroundLayer.add(
        this.add.rectangle(
          metrics.logicalWidth / 2,
          LOGICAL_HEIGHT / 2,
          metrics.logicalWidth + 16,
          LOGICAL_HEIGHT + 16,
          0x171421,
        ),
      );
      const haze = this.add.ellipse(
        metrics.centerX,
        330,
        Math.min(metrics.logicalWidth * 0.72, 920),
        520,
        0x4b365e,
        0.22,
      );
      backgroundLayer.add(haze);
    }

    this.environmentBaseLayerCount = environment.list.length;
    this.addAmbientMotion(ambientLayer, metrics);
    this.environmentRoot = environment;
    this.environmentBackgroundLayer = backgroundLayer;
    this.environmentAmbientLayer = ambientLayer;
    this.environmentLayoutKey = layoutKey;
  }

  private clearAmbientMotion`;
scene = scene.replace(environmentPattern, environmentReplacement);

scene = replaceOnce(
  scene,
  `    if (perspective) {\n      perspective.yaw = 0;\n      perspective.pitch = 0;\n    }\n    this.resultBreathTarget = null;`,
  `    if (perspective) {\n      perspective.yaw = 0;\n      perspective.pitch = 0;\n    }\n    const shadow = this.resultBreathTarget.getData('depthShadow') as Phaser.GameObjects.Ellipse | null | undefined;\n    if (shadow?.active) {\n      shadow\n        .setPosition(\n          Number(shadow.getData('depthBaseX') ?? shadow.x),\n          Number(shadow.getData('depthBaseY') ?? shadow.y),\n        )\n        .setScale(1)\n        .setAlpha(Number(shadow.getData('depthBaseAlpha') ?? shadow.alpha));\n    }\n    this.resultBreathTarget = null;`,
  'reward shadow reset',
);

fs.writeFileSync(scenePath, scene);
