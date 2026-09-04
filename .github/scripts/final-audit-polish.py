from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'Expected snippet not found in {path}: {old!r}')
    p.write_text(text.replace(old, new, 1))


replace_once(
    'src/game/ui/openingVisuals.ts',
    "const targetWidth = familyId === 'flip-phone' ? 190 : 246;",
    "const targetWidth = familyId === 'flip-phone' ? 300 : 246;",
)

replace_once(
    'src/game/scenes/CollectionScene.ts',
    "          visual.group.setScale(entry.secret ? 0.29 : 0.27);",
    """          visual.group.setScale(
            family.id === 'flip-phone' ? (entry.secret ? 0.38 : 0.36) : entry.secret ? 0.29 : 0.27,
          );""",
)

replace_once(
    'index.html',
    '    <meta name="apple-mobile-web-app-capable" content="yes" />\n',
    '    <meta name="apple-mobile-web-app-capable" content="yes" />\n    <link rel="icon" href="data:," />\n',
)

replace_once(
    'src/game/scenes/OpeningScene.ts',
    ".text(metrics.centerX + 72, 490, `${familyName} · SECRET`, {",
    """.text(
          metrics.centerX + 72,
          490,
          `${familyName} · ${getMessages(getPlatformRuntime().language).rarity.secret}`,
          {""",
)

replace_once(
    'src/game/scenes/OpeningScene.ts',
    "`${standardFamily?.name[getPlatformRuntime().language] ?? pending.standard.familyId} · ${pending.standard.rarity.toUpperCase()}`",
    "`${standardFamily?.name[getPlatformRuntime().language] ?? pending.standard.familyId} · ${getMessages(getPlatformRuntime().language).rarity[pending.standard.rarity]}`",
)

replace_once(
    'src/game/scenes/OpeningScene.ts',
    ".text(metrics.centerX + 72, 490, `${family?.name[getPlatformRuntime().language] ?? pending.hiddenPocket.familyId} · SECRET`, {",
    """.text(
          metrics.centerX + 72,
          490,
          `${family?.name[getPlatformRuntime().language] ?? pending.hiddenPocket.familyId} · ${getMessages(getPlatformRuntime().language).rarity.secret}`,
          {""",
)
