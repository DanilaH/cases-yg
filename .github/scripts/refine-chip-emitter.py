from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text()

old = """  private getRewardBankOrigin(): { x: number; y: number } {
    if (this.rewardTrayContainer?.active) {
      const height = Number(this.rewardTrayContainer.getData('height') ?? 0);
      return { x: this.rewardTrayContainer.x, y: this.rewardTrayContainer.y + height / 2 };
    }
    return { x: this.metrics?.centerX ?? 450, y: 430 };
  }
"""
new = """  private getRewardBankOrigin(): { x: number; y: number } {
    if (this.rewardTrayContainer?.active) {
      const height = Number(this.rewardTrayContainer.getData('height') ?? 0);
      return {
        x: this.rewardTrayContainer.x - OPENING_FEEL_PRESENTATION.rewardTrayWidth / 2 - 4,
        y: this.rewardTrayContainer.y + height / 2,
      };
    }
    return { x: this.metrics?.centerX ?? 450, y: 430 };
  }
"""
if old not in text:
    raise SystemExit('reward bank origin block not found')
text = text.replace(old, new, 1)

old = """    const tray = this.renderRewardTray(pending, this.root, true);
    const anchor = this.getRewardBankOrigin();
    const heroY = getCollectiblePresentation(pending.standard.familyId).revealY;
"""
new = """    const tray = this.renderRewardTray(pending, this.root, true);
    const trayCenterX = tray.x;
    const heroY = getCollectiblePresentation(pending.standard.familyId).revealY;
"""
if old not in text:
    raise SystemExit('reward staging anchor block not found')
text = text.replace(old, new, 1)
text = text.replace("x: anchor.x - 70 + index * 18,", "x: trayCenterX - 70 + index * 18,", 1)

old = """        const token = createFlyingChipToken(
          this,
          origin.x - 54 + lane * 27,
          origin.y + ((index % 3) - 1) * 7,
          0.72 + (index % 2) * 0.08,
        );
"""
new = """        const token = createFlyingChipToken(
          this,
          origin.x + lane * 6,
          origin.y + ((index % 5) - 2) * 4,
          0.72 + (index % 2) * 0.08,
        );
"""
if old not in text:
    raise SystemExit('chip emitter block not found')
text = text.replace(old, new, 1)

text = text.replace(".circle(origin.x + 60, origin.y + 10, 8, 0x76e9f5, 0.94)", ".circle(origin.x + 17, origin.y + 10, 8, 0x76e9f5, 0.94)", 1)

path.write_text(text)
