from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text()

replacements = [
    (
        "    container.add([token, label, valueText]);\n    root.add(container);",
        "    container.add([token, label, valueText]);\n    container.bringToTop(shimmer);\n    root.add(container);",
    ),
    (
        "    root.add(container);\n    this.signalHudContainer = container;\n  }\n\n  private renderPouchSelector",
        "    container.bringToTop(shimmer);\n    root.add(container);\n    this.signalHudContainer = container;\n  }\n\n  private renderPouchSelector",
    ),
    (
        "  private async bankChipLeg(\n    targetValue: number,\n    emphasis: number,\n    chargedReadyOnArrival: boolean,\n  ): Promise<void> {",
        "  private async bankChipLeg(\n    targetValue: number,\n    chargedReadyOnArrival: boolean,\n  ): Promise<void> {",
    ),
    (
        "    const bankLeg = async (amount: number, emphasis: number): Promise<void> => {",
        "    const bankLeg = async (amount: number): Promise<void> => {",
    ),
    (
        "      await this.bankChipLeg(target, emphasis, crossesReady);",
        "      await this.bankChipLeg(target, crossesReady);",
    ),
    ("    await bankLeg(pending.chips.base, 1);", "    await bankLeg(pending.chips.base);"),
    (
        "    await bankLeg(\n      pending.chips.cacheBonus,\n      pending.chips.cacheTier === 'mega' ? 1.25 : pending.chips.cacheTier === 'big' ? 1.14 : 1.06,\n    );",
        "    await bankLeg(pending.chips.cacheBonus);",
    ),
    ("    await bankLeg(pending.chips.recycle, 1.08);", "    await bankLeg(pending.chips.recycle);"),
    (
        "    this.setChipsHudValue(pending.chips.after, false);\n    this.renderSignalHud(this.root, this.saveState);",
        "    this.setChipsHudValue(pending.chips.after, false);",
    ),
]

for old, new in replacements:
    if old not in text:
        raise SystemExit(f'expected block not found: {old[:100]!r}')
    text = text.replace(old, new, 1)

path.write_text(text)
