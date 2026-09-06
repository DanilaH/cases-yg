from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text()

old = """      card.add([background, marker, titleText, subtitleText]);
      card.setSize(width, height).setInteractive({ useHandCursor: true });
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
"""

new = """      // A Container's auto hit area is centered on its local origin, while this
      // card's visuals are authored from local (0, 0) to (width, height). Use an
      // explicit centered Zone so every visible pixel of the card is clickable.
      const hitZone = this.add
        .zone(width / 2, height / 2, width, height)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      card.add([background, marker, titleText, subtitleText, hitZone]);
      card.setSize(width, height);
      const idleAlpha = available ? (selected ? 1 : 0.84) : OPENING_FEEL_PRESENTATION.railUnavailableAlpha;
      card.setAlpha(idleAlpha);
      card.setData('available', available);
      card.setData('idleAlpha', idleAlpha);
      card.setData('pouchType', pouchType);
      card.setData('hitZone', hitZone);
      hitZone.on('pointerover', () => {
        if (this.phase !== 'idle') return;
        this.tweens.killTweensOf(card);
        this.tweens.add({ targets: card, scale: 1.025, duration: 90, ease: 'Sine.Out' });
      });
      hitZone.on('pointerout', () => {
        if (this.phase !== 'idle') return;
        this.tweens.killTweensOf(card);
        this.tweens.add({ targets: card, scale: 1, duration: 110, ease: 'Sine.Out' });
      });
      hitZone.on('pointerdown', () => {
        if (this.phase !== 'idle') return;
        this.tweens.killTweensOf(card);
        this.tweens.add({ targets: card, scale: 0.985, duration: 55, ease: 'Sine.Out' });
      });
      hitZone.on('pointerup', () => {
        if (this.phase !== 'idle') return;
        if (!available) {
          this.showUnavailableChargedFeedback(card);
          return;
        }
        this.selectPouchType(pouchType, card);
      });
"""

if old not in text:
    raise SystemExit('selector card interaction block not found')
text = text.replace(old, new, 1)

old_chrome = """    for (const button of this.pouchSelectorButtons) {
      const idleAlpha = Number(button.getData('idleAlpha') ?? 1);
      button.setAlpha(enabled ? idleAlpha : 0.16);
      if (enabled) {
        button.setInteractive({ useHandCursor: true });
      } else {
        button.disableInteractive();
      }
    }
"""

new_chrome = """    for (const button of this.pouchSelectorButtons) {
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

if old_chrome not in text:
    raise SystemExit('selector chrome block not found')
text = text.replace(old_chrome, new_chrome, 1)

path.write_text(text)
