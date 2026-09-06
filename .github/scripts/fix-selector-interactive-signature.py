from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text()
old = """      card
        .setSize(width, height)
        .setInteractive(
          new Phaser.Geom.Rectangle(0, 0, width, height),
          Phaser.Geom.Rectangle.Contains,
          { useHandCursor: true },
        );
"""
new = """      card
        .setSize(width, height)
        .setInteractive({
          hitArea: new Phaser.Geom.Rectangle(0, 0, width, height),
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
          useHandCursor: true,
        });
"""
if old not in text:
    raise SystemExit('interactive signature block not found')
path.write_text(text.replace(old, new, 1))
