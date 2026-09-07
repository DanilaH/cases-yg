from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text()

assert text.count("  private resultCarouselDots: Phaser.GameObjects.Arc[] = [];\n") == 1
text = text.replace(
    "  private resultCarouselDots: Phaser.GameObjects.Arc[] = [];\n",
    "  private resultCarouselDots: Phaser.GameObjects.Arc[] = [];\n  private resultCarouselHeading: Phaser.GameObjects.Text | null = null;\n",
    1,
)

assert text.count("  private pouchSelectorButtons: Phaser.GameObjects.Container[] = [];\n") == 1
text = text.replace(
    "  private pouchSelectorButtons: Phaser.GameObjects.Container[] = [];\n",
    "  private pouchSelectorButtons: Phaser.GameObjects.Container[] = [];\n  private pouchSelectorLabel: Phaser.GameObjects.Text | null = null;\n",
    1,
)

assert text.count("    this.resultCarouselDots = [];\n") == 1
text = text.replace(
    "    this.resultCarouselDots = [];\n",
    "    this.resultCarouselDots = [];\n    this.resultCarouselHeading = null;\n",
    1,
)

assert text.count("    this.pouchSelectorButtons = [];\n") == 1
text = text.replace(
    "    this.pouchSelectorButtons = [];\n",
    "    this.pouchSelectorButtons = [];\n    this.pouchSelectorLabel = null;\n",
    1,
)

old = """    for (const card of this.pouchSelectorButtons) {
      const targetY = card.y;
      const targetAlpha = Number(card.getData('idleAlpha') ?? 1);
      card.setY(targetY + 4).setAlpha(0);
      this.tweens.add({
        targets: card,
        y: targetY,
        alpha: targetAlpha,
        duration: OPENING_FEEL_PRESENTATION.uiFadeInMs,
        ease: 'Sine.Out',
      });
    }
"""
new = """    if (this.pouchSelectorLabel) {
      const targetY = this.pouchSelectorLabel.y;
      this.pouchSelectorLabel.setY(targetY + 2).setAlpha(0);
      this.tweens.add({
        targets: this.pouchSelectorLabel,
        y: targetY,
        alpha: 1,
        duration: OPENING_FEEL_PRESENTATION.uiFadeInMs,
        ease: 'Sine.Out',
      });
    }

    for (const card of this.pouchSelectorButtons) {
      const targetY = card.y;
      const targetAlpha = Number(card.getData('idleAlpha') ?? 1);
      card.setY(targetY + 4).setAlpha(0);
      this.tweens.add({
        targets: card,
        y: targetY,
        alpha: targetAlpha,
        duration: OPENING_FEEL_PRESENTATION.uiFadeInMs,
        ease: 'Sine.Out',
      });
    }
"""
assert text.count(old) == 1
text = text.replace(old, new, 1)

old = """    root.add(sectionLabel);

    const createCard = (
"""
new = """    root.add(sectionLabel);
    this.pouchSelectorLabel = sectionLabel;

    const createCard = (
"""
assert text.count(old) == 1
text = text.replace(old, new, 1)

old = """    root.add(
      this.add.text(metrics.centerX, 126, messages.opening.hiddenPocket, {
        color: '#8df8ff',
        stroke: '#160f20',
        strokeThickness: 3,
        fontFamily: 'monospace',
        fontSize: '22px',
        fontStyle: 'bold',
      }).setOrigin(0.5),
    );

    const standardPage = this.add.container(0, getCollectiblePresentation(pending.standard.familyId).revealY);
"""
new = """    const heading = this.add.text(metrics.centerX, 126, messages.opening.hiddenPocket, {
      color: '#8df8ff',
      stroke: '#160f20',
      strokeThickness: 3,
      fontFamily: 'monospace',
      fontSize: '22px',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    root.add(heading);
    this.resultCarouselHeading = heading;

    const standardPage = this.add.container(0, getCollectiblePresentation(pending.standard.familyId).revealY);
"""
assert text.count(old) == 1
text = text.replace(old, new, 1)

old = """    if (this.rewardTrayContainer?.active) fadeTargets.push(this.rewardTrayContainer);
    if (this.resultActionPanel?.active) fadeTargets.push(this.resultActionPanel);
    if (this.resultCarouselItems.length > 0) {
"""
new = """    if (this.rewardTrayContainer?.active) fadeTargets.push(this.rewardTrayContainer);
    if (this.resultActionPanel?.active) fadeTargets.push(this.resultActionPanel);
    if (this.resultCarouselHeading?.active) fadeTargets.push(this.resultCarouselHeading);
    if (this.resultCarouselDots.length > 0) {
      fadeTargets.push(...this.resultCarouselDots.filter((dot) => dot.active));
    }
    if (this.resultCarouselItems.length > 0) {
"""
assert text.count(old) == 1
text = text.replace(old, new, 1)

path.write_text(text)
