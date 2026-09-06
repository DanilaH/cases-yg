from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text()

old = """      // A Container's auto hit area is centered on its local origin, while this
      // card's visuals are authored from local (0, 0) to (width, height). Use an
      // explicit centered Zone so every visible pixel of the card is clickable.
      const hitZone = this.add
        .zone(width / 2, height / 2, width, height)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      card.add([background, marker, titleText, subtitleText, hitZone]);
      card.setSize(width, height);
"""
new = """      // Container auto hit areas are centered on the local origin, while this
      // card is authored from local (0, 0) to (width, height). Give the Container
      // an explicit local rectangle so input matches the full visible card exactly.
      card.add([background, marker, titleText, subtitleText]);
      card
        .setSize(width, height)
        .setInteractive(
          new Phaser.Geom.Rectangle(0, 0, width, height),
          Phaser.Geom.Rectangle.Contains,
          { useHandCursor: true },
        );
"""
if old not in text:
    raise SystemExit('selector Zone block not found')
text = text.replace(old, new, 1)

text = text.replace("      card.setData('hitZone', hitZone);\n", "", 1)
text = text.replace("      hitZone.on('pointerover', () => {", "      card.on('pointerover', () => {", 1)
text = text.replace("      hitZone.on('pointerout', () => {", "      card.on('pointerout', () => {", 1)
text = text.replace("      hitZone.on('pointerdown', () => {", "      card.on('pointerdown', () => {", 1)
text = text.replace("      hitZone.on('pointerup', () => {", "      card.on('pointerup', () => {", 1)

old_enable = """    for (const button of this.pouchSelectorButtons) {
      const idleAlpha = Number(button.getData('idleAlpha') ?? 1);
      const hitZone = button.getData('hitZone') as Phaser.GameObjects.Zone | undefined;
      button.setAlpha(enabled ? idleAlpha : 0.16);
      if (enabled) {
        hitZone?.setInteractive({ useHandCursor: true });
      } else {
        hitZone?.disableInteractive();
      }
    }
"""
new_enable = """    for (const button of this.pouchSelectorButtons) {
      const idleAlpha = Number(button.getData('idleAlpha') ?? 1);
      button.setAlpha(enabled ? idleAlpha : 0.16);
      if (button.input) button.input.enabled = enabled;
    }
"""
if old_enable not in text:
    raise SystemExit('selector chrome block not found')
text = text.replace(old_enable, new_enable, 1)

path.write_text(text)
