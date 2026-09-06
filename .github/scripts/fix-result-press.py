from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text()
old = '''    actionZone.on('pointerdown', () => {
      if (this.phase !== 'result' || !this.resultReady) return;
      this.tweens.killTweensOf(panel);
      this.tweens.add({
        targets: panel,
        y: RESULT_PRESENTATION.panelY + 2,
        duration: OPENING_FEEL_PRESENTATION.uiPressMs,
        yoyo: true,
        ease: 'Sine.Out',
      });
      this.continueFromResult();
    });
'''
new = '''    actionZone.on('pointerdown', () => {
      if (this.phase !== 'result' || !this.resultReady) return;
      this.tweens.killTweensOf(panel);
      this.tweens.add({
        targets: panel,
        y: RESULT_PRESENTATION.panelY + 2,
        duration: OPENING_FEEL_PRESENTATION.uiPressMs,
        yoyo: true,
        ease: 'Sine.Out',
      });
      // Acceptance stays on the scene-level pointerup gesture. Starting banking
      // here would let this same pointerdown be reinterpreted as a banking skip.
    });
'''
if old not in text:
    raise SystemExit('result action pointerdown block not found')
path.write_text(text.replace(old, new, 1))
