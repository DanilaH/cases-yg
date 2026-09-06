from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text()

old = """      // Container auto hit areas are centered on the local origin, while this
      // card is authored from local (0, 0) to (width, height). Give the Container
      // an explicit local rectangle so input matches the full visible card exactly.
      card.add([background, marker, titleText, subtitleText]);
      card
        .setSize(width, height)
        .setInteractive({
          hitArea: new Phaser.Geom.Rectangle(0, 0, width, height),
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
          useHandCursor: true,
        });
      const idleAlpha = available ? (selected ? 1 : 0.84) : OPENING_FEEL_PRESENTATION.railUnavailableAlpha;
      card.setAlpha(idleAlpha);
      card.setData('available', available);
      card.setData('idleAlpha', idleAlpha);
      card.setData('pouchType', pouchType);
      card.on('pointerover', () => {
        if (this.phase !== 'idle') return;
        this.tweens.killTweensOf(card);
        this.tweens.add({ targets: card, scale: 1.025, duration: 90, ease: 'Sine.Out' });
      });
      card.on('pointerout', () => {
        if (this.phase !== 'idle') return;
        this.tweens.killTweensOf(card);
        this.tweens.add({ targets: card, scale: 1, duration: 110, ease: 'Sine.Out' });
      });
      card.on('pointerdown', () => {
        if (this.phase !== 'idle') return;
        this.tweens.killTweensOf(card);
        this.tweens.add({ targets: card, scale: 0.985, duration: 55, ease: 'Sine.Out' });
      });
      card.on('pointerup', () => {
        if (this.phase !== 'idle') return;
        if (!available) {
          this.showUnavailableChargedFeedback(card);
          return;
        }
        this.selectPouchType(pouchType, card);
      });
      root.add(card);
      this.pouchSelectorButtons.push(card);
"""
new = """      card.add([background, marker, titleText, subtitleText]);
      const hitTarget = this.add
        .zone(railX + width / 2, y + height / 2, width, height)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      const idleAlpha = available ? (selected ? 1 : 0.84) : OPENING_FEEL_PRESENTATION.railUnavailableAlpha;
      card.setAlpha(idleAlpha);
      card.setData('available', available);
      card.setData('idleAlpha', idleAlpha);
      card.setData('pouchType', pouchType);
      card.setData('hitTarget', hitTarget);
      hitTarget.on('pointerover', () => {
        if (this.phase !== 'idle') return;
        this.tweens.killTweensOf(card);
        this.tweens.add({ targets: card, scale: 1.025, duration: 90, ease: 'Sine.Out' });
      });
      hitTarget.on('pointerout', () => {
        if (this.phase !== 'idle') return;
        this.tweens.killTweensOf(card);
        this.tweens.add({ targets: card, scale: 1, duration: 110, ease: 'Sine.Out' });
      });
      hitTarget.on('pointerdown', () => {
        if (this.phase !== 'idle') return;
        this.tweens.killTweensOf(card);
        this.tweens.add({ targets: card, scale: 0.985, duration: 55, ease: 'Sine.Out' });
      });
      hitTarget.on('pointerup', () => {
        if (this.phase !== 'idle') return;
        if (!available) {
          this.showUnavailableChargedFeedback(card);
          return;
        }
        this.selectPouchType(pouchType, card);
      });
      root.add([card, hitTarget]);
      this.pouchSelectorButtons.push(card);
"""
if old not in text:
    raise SystemExit('selector interaction block not found')
text = text.replace(old, new, 1)

old_chrome = """    for (const button of this.pouchSelectorButtons) {
      const idleAlpha = Number(button.getData('idleAlpha') ?? 1);
      button.setAlpha(enabled ? idleAlpha : 0.16);
      if (button.input) button.input.enabled = enabled;
    }
"""
new_chrome = """    for (const button of this.pouchSelectorButtons) {
      const idleAlpha = Number(button.getData('idleAlpha') ?? 1);
      const hitTarget = button.getData('hitTarget') as Phaser.GameObjects.Zone | undefined;
      button.setAlpha(enabled ? idleAlpha : 0.16);
      if (hitTarget?.input) hitTarget.input.enabled = enabled;
    }
"""
if old_chrome not in text:
    raise SystemExit('selector chrome block not found')
text = text.replace(old_chrome, new_chrome, 1)

path.write_text(text)
