from pathlib import Path


def replace_exact(text: str, old: str, new: str, label: str, expected: int = 1) -> str:
    count = text.count(old)
    if count != expected:
        raise SystemExit(f"{label}: expected {expected} matches, found {count}")
    return text.replace(old, new)

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text(encoding='utf-8')

text = replace_exact(
    text,
    """    this.clearSecretPremiumMotion();\n    this.clearHudMotion();\n    if (this.chargedAura) this.tweens.killTweensOf(this.chargedAura);\n    this.root?.destroy(true);\n""",
    """    this.clearSecretPremiumMotion();\n    this.clearHudMotion();\n    if (this.chargedAura) this.killContainerTreeTweens(this.chargedAura);\n    this.root?.destroy(true);\n""",
    'clean charged aura child tweens before root replacement',
)

text = replace_exact(
    text,
    """  private startChargedAuraExit(delay: number, duration: number): void {\n""",
    """  private killContainerTreeTweens(container: Phaser.GameObjects.Container): void {\n    this.tweens.killTweensOf(container);\n    for (const child of container.list) {\n      this.tweens.killTweensOf(child);\n      if (child instanceof Phaser.GameObjects.Container) this.killContainerTreeTweens(child);\n    }\n  }\n\n  private startChargedAuraExit(delay: number, duration: number): void {\n""",
    'add recursive charged aura tween cleanup helper',
)

text = replace_exact(
    text,
    """      ease: 'Cubic.InOut',\n      onComplete: () => {\n        if (aura.active) aura.destroy(true);\n        if (this.chargedAura === aura) this.chargedAura = null;\n      },\n""",
    """      ease: 'Cubic.InOut',\n      onComplete: () => {\n        if (aura.active) {\n          this.killContainerTreeTweens(aura);\n          aura.destroy(true);\n        }\n        if (this.chargedAura === aura) this.chargedAura = null;\n      },\n""",
    'clean child tweens after smooth charged aura exit',
)

path.write_text(text, encoding='utf-8')
print('charged aura lifecycle follow-up applied')
