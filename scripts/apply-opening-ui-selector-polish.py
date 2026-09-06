from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text()

replacements = [
    (
        "    const y = 116;",
        "    const y = 96;",
        "selector vertical position",
    ),
    (
        "      const idleAlpha = available ? (selected ? 1 : 0.84) : 0.42;",
        "      const idleAlpha = available ? (selected ? 1 : 0.84) : 0.62;",
        "disabled selector alpha",
    ),
    (
        "            : '#81768d',",
        "            : '#a69ab2',",
        "disabled selector text color",
    ),
    (
        "      button.setAlpha(enabled ? idleAlpha : Math.min(0.32, idleAlpha));",
        "      button.setAlpha(enabled ? idleAlpha : 0);",
        "hide selector during active reveal",
    ),
]

for old, new, label in replacements:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 match, found {count}')
    text = text.replace(old, new, 1)

path.write_text(text)
