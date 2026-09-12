import fs from 'node:fs';

const replaceOnce = (source, before, after, label) => {
  const first = source.indexOf(before);
  if (first === -1) throw new Error(`Missing ${label}`);
  if (source.indexOf(before, first + before.length) !== -1) throw new Error(`Expected one ${label}`);
  return source.slice(0, first) + after + source.slice(first + before.length);
};

const path = 'src/game/scenes/OpeningScene.ts';
let source = fs.readFileSync(path, 'utf8');

source = replaceOnce(
  source,
  `    const response = 1 - Math.exp(-Math.max(0, delta) / POUCH_POINTER_PERSPECTIVE_RESPONSE_MS);\n    const drivePerspective = (\n      perspective: PouchPerspectiveController | null | undefined,\n      enabled: boolean,\n      yawMax: number,\n      pitchMax: number,\n    ): void => {\n      if (!perspective) return;\n      const targetYaw = enabled ? heroX * yawMax : 0;\n      const targetPitch = enabled ? -heroY * pitchMax : 0;\n      perspective.yaw = Phaser.Math.Linear(perspective.yaw, targetYaw, response);\n      perspective.pitch = Phaser.Math.Linear(perspective.pitch, targetPitch, response);\n      if (Math.abs(perspective.yaw - targetYaw) < 0.001) perspective.yaw = targetYaw;\n      if (Math.abs(perspective.pitch - targetPitch) < 0.001) perspective.pitch = targetPitch;\n    };\n\n    const syncDepthShadow = (\n      shadow: Phaser.GameObjects.Ellipse | null | undefined,\n      perspective: PouchPerspectiveController | null | undefined,\n      xAmount: number,\n      yAmount: number,\n    ): void => {\n      if (!shadow?.active || !perspective) return;\n      const baseX = Number(shadow.getData('depthBaseX') ?? shadow.x);\n      const baseY = Number(shadow.getData('depthBaseY') ?? shadow.y);\n      const baseAlpha = Number(shadow.getData('depthBaseAlpha') ?? shadow.alpha);\n      shadow\n        .setPosition(baseX - perspective.yaw * xAmount, baseY + perspective.pitch * yAmount)\n        .setScale(\n          1 - Math.min(0.045, Math.abs(perspective.yaw) * 0.035),\n          1 + Math.min(0.035, Math.abs(perspective.pitch) * 0.03),\n        )\n        .setAlpha(Math.max(0.1, baseAlpha - Math.abs(perspective.pitch) * 0.025));\n    };\n\n    const pouch = this.pouch;`,
  `    const response = 1 - Math.exp(-Math.max(0, delta) / POUCH_POINTER_PERSPECTIVE_RESPONSE_MS);\n\n    const pouch = this.pouch;`,
  'per-frame helper closures',
);

source = replaceOnce(
  source,
  `      drivePerspective(\n        pouch.perspective,\n        this.phase === 'idle' &&\n          !this.dropSwitchInFlight &&\n          !this.pouchArtLoadInFlight &&\n          canFollowPointer,\n        POUCH_POINTER_PERSPECTIVE_YAW_MAX,\n        POUCH_POINTER_PERSPECTIVE_PITCH_MAX,\n      );\n      syncDepthShadow(pouch.shadow, pouch.perspective, 5.5, 3.2);`,
  `      this.drivePerspective(\n        pouch.perspective,\n        this.phase === 'idle' &&\n          !this.dropSwitchInFlight &&\n          !this.pouchArtLoadInFlight &&\n          canFollowPointer,\n        POUCH_POINTER_PERSPECTIVE_YAW_MAX,\n        POUCH_POINTER_PERSPECTIVE_PITCH_MAX,\n        heroX,\n        heroY,\n        response,\n      );\n      this.syncDepthShadow(pouch.shadow, pouch.perspective, 5.5, 3.2);`,
  'pouch helper calls',
);

source = replaceOnce(
  source,
  `    drivePerspective(\n      collectiblePerspective,\n      this.phase === 'result' && Boolean(resultTarget?.active) && canFollowPointer,\n      COLLECTIBLE_POINTER_PERSPECTIVE_YAW_MAX,\n      COLLECTIBLE_POINTER_PERSPECTIVE_PITCH_MAX,\n    );\n    const collectibleShadow = resultTarget?.getData('depthShadow') as Phaser.GameObjects.Ellipse | null | undefined;\n    syncDepthShadow(collectibleShadow, collectiblePerspective, 4.2, 2.4);`,
  `    this.drivePerspective(\n      collectiblePerspective,\n      this.phase === 'result' && Boolean(resultTarget?.active) && canFollowPointer,\n      COLLECTIBLE_POINTER_PERSPECTIVE_YAW_MAX,\n      COLLECTIBLE_POINTER_PERSPECTIVE_PITCH_MAX,\n      heroX,\n      heroY,\n      response,\n    );\n    const collectibleShadow = resultTarget?.getData('depthShadow') as Phaser.GameObjects.Ellipse | null | undefined;\n    this.syncDepthShadow(collectibleShadow, collectiblePerspective, 4.2, 2.4);`,
  'collectible helper calls',
);

source = replaceOnce(
  source,
  `  private async initialize(): Promise<void> {`,
  `  private drivePerspective(\n    perspective: PouchPerspectiveController | null | undefined,\n    enabled: boolean,\n    yawMax: number,\n    pitchMax: number,\n    heroX: number,\n    heroY: number,\n    response: number,\n  ): void {\n    if (!perspective) return;\n    const targetYaw = enabled ? heroX * yawMax : 0;\n    const targetPitch = enabled ? -heroY * pitchMax : 0;\n    perspective.yaw = Phaser.Math.Linear(perspective.yaw, targetYaw, response);\n    perspective.pitch = Phaser.Math.Linear(perspective.pitch, targetPitch, response);\n    if (Math.abs(perspective.yaw - targetYaw) < 0.001) perspective.yaw = targetYaw;\n    if (Math.abs(perspective.pitch - targetPitch) < 0.001) perspective.pitch = targetPitch;\n  }\n\n  private syncDepthShadow(\n    shadow: Phaser.GameObjects.Ellipse | null | undefined,\n    perspective: PouchPerspectiveController | null | undefined,\n    xAmount: number,\n    yAmount: number,\n  ): void {\n    if (!shadow?.active || !perspective) return;\n    const baseX = Number(shadow.getData('depthBaseX') ?? shadow.x);\n    const baseY = Number(shadow.getData('depthBaseY') ?? shadow.y);\n    const baseAlpha = Number(shadow.getData('depthBaseAlpha') ?? shadow.alpha);\n    shadow\n      .setPosition(baseX - perspective.yaw * xAmount, baseY + perspective.pitch * yAmount)\n      .setScale(\n        1 - Math.min(0.045, Math.abs(perspective.yaw) * 0.035),\n        1 + Math.min(0.035, Math.abs(perspective.pitch) * 0.03),\n      )\n      .setAlpha(Math.max(0.1, baseAlpha - Math.abs(perspective.pitch) * 0.025));\n  }\n\n  private async initialize(): Promise<void> {`,
  'class helper methods',
);

fs.writeFileSync(path, source);
