from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text()

old = "    copies = OPENING_FEEL_PRESENTATION.discoveryOutlineCopies,\n    radius = OPENING_FEEL_PRESENTATION.discoveryOutlineRadius,\n  ): Phaser.GameObjects.GameObject[] {"
new = "    copies: number = OPENING_FEEL_PRESENTATION.discoveryOutlineCopies,\n    radius: number = OPENING_FEEL_PRESENTATION.discoveryOutlineRadius,\n  ): Array<Phaser.GameObjects.Image | Phaser.GameObjects.Arc> {"
if text.count(old) != 1:
    raise SystemExit(f'expected one discovery silhouette signature, found {text.count(old)}')
text = text.replace(old, new, 1)
path.write_text(text)
