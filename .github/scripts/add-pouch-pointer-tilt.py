from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text()

old_constants = "const RESULT_HOLD_MS = OPENING_FEEL_PRESENTATION.resultReadHoldMs;\n"
new_constants = old_constants + "const POUCH_POINTER_TILT_MAX_DEG = 2.2;\nconst POUCH_POINTER_TILT_RESPONSE_MS = 85;\n"
if old_constants not in text:
    raise SystemExit('constant anchor missing')
text = text.replace(old_constants, new_constants, 1)

old_anchor = "    void this.initialize();\n  }\n\n  private async initialize(): Promise<void> {"
new_anchor = """    void this.initialize();
  }

  public update(_time: number, delta: number): void {
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

  private async initialize(): Promise<void> {"""
if old_anchor not in text:
    raise SystemExit('create/initialize anchor missing')
text = text.replace(old_anchor, new_anchor, 1)

path.write_text(text)
