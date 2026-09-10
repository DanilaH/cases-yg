from pathlib import Path

scene = Path('src/game/scenes/OpeningScene.ts')
text = scene.read_text()

old = ".text(metrics.centerX, tearHintY + 38, message, {"
new = ".text(metrics.centerX, metrics.safeTop + 120, message, {"
if text.count(old) != 1:
    raise SystemExit(f'idle message anchor count={text.count(old)}')
text = text.replace(old, new, 1)

old = """    const dropDots: Phaser.GameObjects.Rectangle[] = [];
    let dotCursorX = -dotRailWidth / 2;
    for (let dotIndex = 0; dotIndex < dotWidths.length; dotIndex += 1) {
      const isActive = dotIndex === index;
      const dotWidth = dotWidths[dotIndex] ?? dotSize;
      const dot = this.add
        .rectangle(
          dotCursorX + dotWidth / 2,
          dotY,
          dotWidth,
          dotHeight,
          isActive ? 0x8df8ff : 0xdccdf0,
          isActive
            ? OPENING_FEEL_PRESENTATION.dropSelectorDotActiveAlpha
            : OPENING_FEEL_PRESENTATION.dropSelectorDotInactiveAlpha,
        )
        .setOrigin(0.5);
      if (isActive) {
        dot.setScale(0.88, 1);
        this.tweens.add({
          targets: dot,
          scaleX: 1,
          alpha: OPENING_FEEL_PRESENTATION.dropSelectorDotActiveAlpha,
          duration: OPENING_FEEL_PRESENTATION.dropSelectorSwitchMs,
          ease: 'Cubic.Out',
        });
      }
      dropDots.push(dot);
      dotCursorX += dotWidth + dotGap;
    }
"""
new = """    const dropDots: Phaser.GameObjects.Graphics[] = [];
    let dotCursorX = -dotRailWidth / 2;
    for (let dotIndex = 0; dotIndex < dotWidths.length; dotIndex += 1) {
      const isActive = dotIndex === index;
      const dotWidth = dotWidths[dotIndex] ?? dotSize;
      const dotAlpha = isActive
        ? OPENING_FEEL_PRESENTATION.dropSelectorDotActiveAlpha
        : OPENING_FEEL_PRESENTATION.dropSelectorDotInactiveAlpha;
      const dot = this.add.graphics();
      dot.fillStyle(isActive ? 0x8df8ff : 0xdccdf0, dotAlpha);
      dot.fillRoundedRect(-dotWidth / 2, -dotHeight / 2, dotWidth, dotHeight, dotHeight / 2);
      dot.setPosition(dotCursorX + dotWidth / 2, dotY);
      if (isActive) {
        dot.setScale(0.88, 1);
        this.tweens.add({
          targets: dot,
          scaleX: 1,
          duration: OPENING_FEEL_PRESENTATION.dropSelectorSwitchMs,
          ease: 'Cubic.Out',
        });
      }
      dropDots.push(dot);
      dotCursorX += dotWidth + dotGap;
    }
"""
if text.count(old) != 1:
    raise SystemExit(f'dot render anchor count={text.count(old)}')
scene.write_text(text.replace(old, new, 1))
