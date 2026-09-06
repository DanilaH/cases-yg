from pathlib import Path
import re

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, got {count}')
    text = text.replace(old, new, 1)


def regex_once(pattern: str, replacement: str, label: str) -> None:
    global text
    text, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one regex match, got {count}')


replace_once(
    "import { SLICE_BALANCE } from '../data/balance';",
    "import { LITE_V2_BALANCE, type ChipsCacheTierId, type PouchType } from '../data/balance';",
    'balance import',
)
replace_once(
    "import { createLayoutMetrics, readSafeAreaInsets, type LayoutMetrics } from '../systems/layout';\nimport { OpeningSession } from '../systems/openingSession';",
    "import { createLayoutMetrics, readSafeAreaInsets, type LayoutMetrics } from '../systems/layout';\nimport {\n  canAffordPouch,\n  crossedChargedReadyThreshold,\n  getChargedCost,\n  getPreludeChipsAfter,\n  isSignalWaitingForCharged,\n} from '../systems/openingEconomy';\nimport { OpeningSession } from '../systems/openingSession';",
    'opening economy import',
)
replace_once(
    "} from '../ui/openingVisuals';\nimport { addCoverArt } from '../ui/staticArt';",
    "} from '../ui/openingVisuals';\nimport {\n  CHARGED_TEXT_COLOR,\n  CHIPS_TEXT_COLOR,\n  createChargedAura,\n  createChipToken,\n} from '../ui/openingEconomyVisuals';\nimport { addCoverArt } from '../ui/staticArt';",
    'economy visuals import',
)

replace_once(
    "  private resultBreathBaseScale = 1;",
    "  private resultBreathBaseScale = 1;\n  private selectedPouchType: PouchType = 'basic';\n  private pouchSelectorButtons: Phaser.GameObjects.Text[] = [];\n  private chipsHudText: Phaser.GameObjects.Text | null = null;\n  private chipsHudValue = 0;\n  private signalHudContainer: Phaser.GameObjects.Container | null = null;\n  private chargedAura: Phaser.GameObjects.Container | null = null;",
    'scene fields',
)

replace_once(
    "    this.ignoreNextResultTap = false;\n\n    const platform = getPlatformRuntime();",
    "    this.ignoreNextResultTap = false;\n    this.selectedPouchType = 'basic';\n\n    const platform = getPlatformRuntime();",
    'activation reset',
)

replace_once(
    "    if (this.isSceneShutdown()) return;\n\n    this.renderIdle();\n    platform.markReady();\n\n    const pending = this.saveState.pendingReveal;\n    if (pending) {",
    "    if (this.isSceneShutdown()) return;\n\n    const pending = this.saveState.pendingReveal;\n    if (pending) this.selectedPouchType = pending.pouchType;\n    this.renderIdle();\n    platform.markReady();\n\n    if (pending) {",
    'recovered pouch context',
)

replace_once(
    "    this.clearAmbientMotion();\n    this.root?.destroy(true);\n    this.pouch = null;",
    "    this.clearAmbientMotion();\n    if (this.chargedAura) this.tweens.killTweensOf(this.chargedAura);\n    this.root?.destroy(true);\n    this.pouch = null;",
    'root aura cleanup',
)
replace_once(
    "    this.resultCarouselZone = null;\n    const metrics = createLayoutMetrics",
    "    this.resultCarouselZone = null;\n    this.pouchSelectorButtons = [];\n    this.chipsHudText = null;\n    this.signalHudContainer = null;\n    this.chargedAura = null;\n    const metrics = createLayoutMetrics",
    'root economy refs reset',
)

replace_once(
    "    const root = this.createRoot();\n    const metrics = this.metrics!;\n    this.renderSignalHud(root, this.saveState.signal);\n    if (this.saveState.totalOpens > 0) {\n      this.createCollectionButton(root, true);\n      this.createMuteButton(root);\n    }\n\n    this.pouch = createPouchVisual(this, root, metrics.centerX, POUCH_Y);\n    this.pouch.dragZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.beginDrag(pointer));\n    this.startStarPulse();",
    "    if (this.selectedPouchType === 'charged' && !canAffordPouch(this.saveState, 'charged', LITE_V2_BALANCE)) {\n      this.selectedPouchType = 'basic';\n    }\n\n    const root = this.createRoot();\n    const metrics = this.metrics!;\n    this.renderResourceHud(root, this.saveState);\n    if (this.saveState.totalOpens > 0) {\n      this.createCollectionButton(root, true);\n      this.createMuteButton(root);\n    }\n\n    if (this.selectedPouchType === 'charged') this.renderChargedPouchAura(root);\n    this.pouch = createPouchVisual(this, root, metrics.centerX, POUCH_Y);\n    this.pouch.dragZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.beginDrag(pointer));\n    this.renderPouchSelector(root);\n    this.startStarPulse();",
    'idle economy UI',
)

hud_methods = r'''  private renderResourceHud(root: Phaser.GameObjects.Container, state: SaveState): void {
    this.renderChipsHud(root, state.chips);
    this.renderSignalHud(root, state);
  }

  private renderChipsHud(root: Phaser.GameObjects.Container, chips: number): void {
    if (!this.metrics) return;
    const messages = getMessages(getPlatformRuntime().language);
    const x = this.metrics.safeLeft;
    const y = this.metrics.safeTop + 8;
    const token = createChipToken(this, x + 10, y + 11, 0.72);
    const label = this.add
      .text(x + 30, y, `${messages.opening.chips} ${Math.max(0, Math.floor(chips))}`, {
        color: CHIPS_TEXT_COLOR,
        stroke: '#160f20',
        strokeThickness: 2,
        fontFamily: 'monospace',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);
    root.add([token, label]);
    this.chipsHudText = label;
    this.chipsHudValue = Math.max(0, Math.floor(chips));
  }

  private setChipsHudValue(value: number, pulse = false): void {
    if (!this.chipsHudText) return;
    const messages = getMessages(getPlatformRuntime().language);
    this.chipsHudValue = Math.max(0, Math.floor(value));
    this.chipsHudText.setText(`${messages.opening.chips} ${this.chipsHudValue}`);
    if (!pulse) return;
    this.tweens.killTweensOf(this.chipsHudText);
    this.chipsHudText.setScale(1);
    this.tweens.add({
      targets: this.chipsHudText,
      scale: 1.1,
      duration: 105,
      yoyo: true,
      ease: 'Sine.Out',
    });
  }

  private renderSignalHud(root: Phaser.GameObjects.Container, state: SaveState): void {
    if (!this.metrics) return;
    this.signalHudContainer?.destroy(true);

    const threshold = LITE_V2_BALANCE.signalThreshold;
    const clamped = Phaser.Math.Clamp(Math.floor(state.signal), 0, threshold);
    const waitingForCharged = isSignalWaitingForCharged(state, SLICE_REGISTRY, LITE_V2_BALANCE);
    const messages = getMessages(getPlatformRuntime().language);
    const labelText = waitingForCharged
      ? messages.opening.signalCharged
      : clamped >= threshold
        ? messages.opening.signalLock
        : `SIGNAL ${clamped}/${threshold}`;
    const x = this.metrics.safeLeft;
    const y = this.metrics.safeTop + 48;
    const container = this.add.container(x, y);
    const label = this.add.text(0, 0, labelText, {
      color: waitingForCharged ? CHARGED_TEXT_COLOR : '#b9f7ff',
      stroke: '#160f20',
      strokeThickness: 2,
      fontFamily: 'monospace',
      fontSize: waitingForCharged ? '14px' : '15px',
      fontStyle: 'bold',
    });
    container.add(label);

    const segmentWidth = 34;
    const segmentGap = 7;
    for (let index = 0; index < threshold; index += 1) {
      const active = index < clamped;
      const segment = this.add
        .rectangle(
          index * (segmentWidth + segmentGap),
          31,
          segmentWidth,
          10,
          active ? (waitingForCharged ? 0x9d7cff : 0x76e9f5) : 0x3a3146,
          active ? 0.96 : 0.82,
        )
        .setOrigin(0, 0.5)
        .setStrokeStyle(1, active ? 0xeefcff : 0x766b82, active ? 0.38 : 0.2);
      container.add(segment);
    }

    root.add(container);
    this.signalHudContainer = container;
  }

  private renderPouchSelector(root: Phaser.GameObjects.Container): void {
    if (!this.metrics || !this.saveState) return;
    const messages = getMessages(getPlatformRuntime().language);
    const cost = getChargedCost(LITE_V2_BALANCE);
    const chargedAvailable = canAffordPouch(this.saveState, 'charged', LITE_V2_BALANCE);
    const y = 116;

    const createButton = (
      pouchType: PouchType,
      x: number,
      label: string,
      available: boolean,
    ): Phaser.GameObjects.Text => {
      const selected = this.selectedPouchType === pouchType;
      const idleAlpha = available ? (selected ? 1 : 0.84) : 0.42;
      const button = this.add
        .text(x, y, label, {
          color: available
            ? pouchType === 'charged'
              ? CHARGED_TEXT_COLOR
              : '#f7f2ff'
            : '#81768d',
          backgroundColor: selected
            ? pouchType === 'charged'
              ? '#443668'
              : '#493a5d'
            : '#2b2237',
          padding: { x: 13, y: 8 },
          fontFamily: 'monospace',
          fontSize: '13px',
          fontStyle: selected ? 'bold' : 'normal',
        })
        .setOrigin(0.5)
        .setAlpha(idleAlpha);
      button.setData('available', available);
      button.setData('idleAlpha', idleAlpha);
      if (available) {
        button.setInteractive({ useHandCursor: true });
        button.on('pointerup', () => this.selectPouchType(pouchType));
      }
      root.add(button);
      this.pouchSelectorButtons.push(button);
      return button;
    };

    createButton(
      'basic',
      this.metrics.centerX - 110,
      `${messages.opening.basicPouch} · ${messages.opening.free}`,
      true,
    );
    createButton(
      'charged',
      this.metrics.centerX + 110,
      chargedAvailable
        ? `⚡ ${messages.opening.chargedPouch} · ${cost} ${messages.opening.chips}`
        : `⚡ ${messages.opening.chargedPouch} · ${this.saveState.chips}/${cost}`,
      chargedAvailable,
    );
  }

  private selectPouchType(pouchType: PouchType): void {
    if (this.phase !== 'idle' || !this.saveState || this.selectedPouchType === pouchType) return;
    if (!canAffordPouch(this.saveState, pouchType, LITE_V2_BALANCE)) return;
    this.selectedPouchType = pouchType;
    this.time.delayedCall(0, () => {
      if (this.phase === 'idle') this.renderIdle();
    });
  }

  private renderChargedPouchAura(root: Phaser.GameObjects.Container): void {
    if (!this.metrics) return;
    const aura = createChargedAura(this, root, this.metrics.centerX, POUCH_Y - 12).setAlpha(0.82);
    this.chargedAura = aura;
    this.tweens.add({
      targets: aura,
      scale: 1.025,
      alpha: 1,
      duration: 760,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private getChipsHudTarget(): { x: number; y: number } {
    if (!this.metrics) return { x: 36, y: 24 };
    return { x: this.metrics.safeLeft + 10, y: this.metrics.safeTop + 19 };
  }

'''
regex_once(
    r"  private renderSignalHud\(root: Phaser\.GameObjects\.Container, signal: number, lockText = false\): void \{.*?\n  \}\n\n  private createCollectionButton",
    hud_methods + '  private createCollectionButton',
    'resource HUD methods',
)

regex_once(
    r"  private setChromeEnabled\(enabled: boolean\): void \{.*?\n  \}\n\n  private beginDrag",
    r'''  private setChromeEnabled(enabled: boolean): void {
    if (this.collectionButton) {
      this.collectionButton.setAlpha(enabled ? 1 : 0.32);
      if (enabled) {
        this.collectionButton.setInteractive({ useHandCursor: true });
      } else {
        this.collectionButton.disableInteractive();
      }
    }

    for (const button of this.pouchSelectorButtons) {
      const available = Boolean(button.getData('available'));
      const idleAlpha = Number(button.getData('idleAlpha') ?? 1);
      button.setAlpha(enabled ? idleAlpha : Math.min(0.32, idleAlpha));
      if (enabled && available) {
        button.setInteractive({ useHandCursor: true });
      } else {
        button.disableInteractive();
      }
    }
  }

  private beginDrag''',
    'chrome enabled',
)

replace_once(
    "      const pending = await this.session.prepareReveal();",
    "      const pending = await this.session.prepareReveal(this.selectedPouchType);",
    'selected pouch prepare',
)

replace_once(
    "    } else {\n      const standardVisual = await this.animateStandardReveal(pending);\n      if (this.isSceneShutdown()) return;\n\n      if (pending.hiddenPocket) {",
    "    } else {\n      await this.animateChipsPrelude(pending);\n      if (this.isSceneShutdown()) return;\n\n      const standardVisual = await this.animateStandardReveal(pending);\n      if (this.isSceneShutdown()) return;\n\n      await this.animatePostStandardEconomy(pending, standardVisual);\n      if (this.isSceneShutdown()) return;\n      if (crossedChargedReadyThreshold(pending, LITE_V2_BALANCE)) this.showChargedReadyBeat();\n\n      if (pending.hiddenPocket) {",
    'reward sequence',
)

animation_methods = r'''  private async animateChipReward(
    labelText: string,
    targetValue: number,
    tokenCount: number,
    labelColor = CHIPS_TEXT_COLOR,
    emphasis = 1,
  ): Promise<void> {
    if (!this.root || !this.metrics) return;
    const root = this.root;
    const centerX = this.metrics.centerX;
    const spawnY = POUCH_Y - 60;
    const label = this.add
      .text(centerX, 207, labelText, {
        color: labelColor,
        stroke: '#160f20',
        strokeThickness: 3,
        fontFamily: 'monospace',
        fontSize: emphasis > 1.15 ? '23px' : '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(0.82);
    root.add(label);

    const tokens: Phaser.GameObjects.Container[] = [];
    for (let index = 0; index < tokenCount; index += 1) {
      const spread = (index - (tokenCount - 1) / 2) * 25;
      const token = createChipToken(this, centerX, spawnY, 0.48 + (index % 2) * 0.08).setAlpha(0);
      root.add(token);
      tokens.push(token);
      this.tweens.add({
        targets: token,
        x: centerX + spread,
        y: spawnY + 24 + (index % 3) * 12,
        alpha: 1,
        scale: 0.92 + emphasis * 0.12,
        angle: (index % 2 === 0 ? 1 : -1) * (16 + index * 3),
        duration: 125 + index * 8,
        ease: 'Back.Out',
      });
    }
    this.tweens.add({
      targets: label,
      alpha: 1,
      scale: emphasis,
      duration: 135,
      ease: 'Back.Out',
    });

    await this.wait(145);
    if (!this.root || this.isSceneShutdown()) return;
    const target = this.getChipsHudTarget();
    tokens.forEach((token, index) => {
      this.tweens.add({
        targets: token,
        x: target.x,
        y: target.y,
        scale: 0.36,
        alpha: 0.18,
        angle: token.angle + 70,
        delay: index * 14,
        duration: 205,
        ease: 'Cubic.In',
        onComplete: () => token.destroy(),
      });
    });
    this.tweens.add({
      targets: label,
      y: label.y - 18,
      alpha: 0,
      delay: 70,
      duration: 210,
      ease: 'Sine.In',
      onComplete: () => label.destroy(),
    });
    await this.wait(235 + tokenCount * 14);
    this.setChipsHudValue(targetValue, true);
  }

  private getCacheLabel(tier: ChipsCacheTierId): string | null {
    const messages = getMessages(getPlatformRuntime().language);
    if (tier === 'cache') return messages.opening.chipCache;
    if (tier === 'big') return messages.opening.bigCache;
    if (tier === 'mega') return messages.opening.megaCache;
    return null;
  }

  private async animateChipsPrelude(pending: PendingReveal): Promise<void> {
    if (!this.root || !this.metrics) return;
    const messages = getMessages(getPlatformRuntime().language);
    const afterSpend = pending.chips.before - pending.chips.cost;

    if (pending.chips.cost > 0) {
      this.setChipsHudValue(afterSpend, true);
      const spend = this.add
        .text(
          this.metrics.centerX,
          157,
          `⚡ ${messages.opening.chargedPouch} −${pending.chips.cost} ${messages.opening.chips}`,
          {
            color: CHARGED_TEXT_COLOR,
            stroke: '#160f20',
            strokeThickness: 2,
            fontFamily: 'monospace',
            fontSize: '14px',
            fontStyle: 'bold',
          },
        )
        .setOrigin(0.5);
      this.root.add(spend);
      this.tweens.add({
        targets: spend,
        alpha: 0,
        y: spend.y - 12,
        delay: 110,
        duration: 220,
        onComplete: () => spend.destroy(),
      });
    }

    await this.animateChipReward(
      `+${pending.chips.base} ${messages.opening.chips}`,
      afterSpend + pending.chips.base,
      4,
    );
    if (this.isSceneShutdown()) return;

    const cacheLabel = this.getCacheLabel(pending.chips.cacheTier);
    if (cacheLabel && pending.chips.cacheBonus > 0) {
      const mega = pending.chips.cacheTier === 'mega';
      const big = pending.chips.cacheTier === 'big';
      await this.animateChipReward(
        `${cacheLabel} +${pending.chips.cacheBonus}`,
        getPreludeChipsAfter(pending),
        mega ? 9 : big ? 7 : 5,
        mega ? '#ffe59a' : big ? CHARGED_TEXT_COLOR : CHIPS_TEXT_COLOR,
        mega ? 1.24 : big ? 1.15 : 1.08,
      );
    }
  }

  private updateSignalHudFromPending(pending: PendingReveal): void {
    if (!this.root || !this.saveState) return;
    const discoveredStandard = pending.standard.isNew
      ? [...this.saveState.discoveredStandard, pending.standard.collectibleId]
      : [...this.saveState.discoveredStandard];
    this.renderSignalHud(this.root, {
      ...this.saveState,
      signal: pending.signal.after,
      discoveredStandard,
    });
  }

  private async animateDuplicateRecycle(
    pending: PendingReveal,
    standardVisual: Phaser.GameObjects.Container,
  ): Promise<void> {
    if (!this.root || !this.metrics || pending.chips.recycle <= 0) {
      this.updateSignalHudFromPending(pending);
      return;
    }

    const messages = getMessages(getPlatformRuntime().language);
    const heroY = getCollectiblePresentation(pending.standard.familyId).revealY;
    const label = this.add
      .text(
        this.metrics.centerX,
        Math.min(500, heroY + 165),
        `${messages.opening.recycled} +${pending.chips.recycle} ${messages.opening.chips}`,
        {
          color: CHIPS_TEXT_COLOR,
          stroke: '#160f20',
          strokeThickness: 3,
          fontFamily: 'monospace',
          fontSize: '17px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5)
      .setAlpha(0);
    this.root.add(label);

    const tokenCount = Math.min(5, Math.max(2, pending.chips.recycle <= 2 ? 2 : 3));
    const tokens: Phaser.GameObjects.Container[] = [];
    for (let index = 0; index < tokenCount; index += 1) {
      const token = createChipToken(
        this,
        standardVisual.x + (index - (tokenCount - 1) / 2) * 20,
        heroY + 56 + (index % 2) * 10,
        0.7,
      );
      this.root.add(token);
      tokens.push(token);
    }

    this.tweens.add({ targets: label, alpha: 1, y: label.y - 8, duration: 130, ease: 'Sine.Out' });
    await this.wait(115);
    const chipsTarget = this.getChipsHudTarget();
    tokens.forEach((token, index) => {
      this.tweens.add({
        targets: token,
        x: chipsTarget.x,
        y: chipsTarget.y,
        scale: 0.32,
        alpha: 0.15,
        delay: index * 18,
        duration: 230,
        ease: 'Cubic.In',
        onComplete: () => token.destroy(),
      });
    });

    if (pending.signal.gain > 0) {
      const signalSpark = this.add
        .circle(this.metrics.centerX, heroY + 36, 8, 0x76e9f5, 0.92)
        .setStrokeStyle(2, 0xffffff, 0.52);
      this.root.add(signalSpark);
      this.tweens.add({
        targets: signalSpark,
        x: this.metrics.safeLeft + 70,
        y: this.metrics.safeTop + 79,
        scale: 0.35,
        alpha: 0.18,
        duration: 255,
        ease: 'Cubic.In',
        onComplete: () => signalSpark.destroy(),
      });
    }

    this.tweens.add({
      targets: label,
      alpha: 0,
      delay: 130,
      duration: 180,
      onComplete: () => label.destroy(),
    });
    await this.wait(270 + tokenCount * 18);
    this.setChipsHudValue(pending.chips.after, true);
    this.updateSignalHudFromPending(pending);
  }

  private async animatePostStandardEconomy(
    pending: PendingReveal,
    standardVisual: Phaser.GameObjects.Container,
  ): Promise<void> {
    if (!pending.standard.isNew && pending.chips.recycle > 0) {
      await this.animateDuplicateRecycle(pending, standardVisual);
      return;
    }
    this.setChipsHudValue(pending.chips.after, false);
    this.updateSignalHudFromPending(pending);
  }

  private showChargedReadyBeat(): void {
    if (!this.root || !this.metrics) return;
    const messages = getMessages(getPlatformRuntime().language);
    const banner = this.add
      .text(this.metrics.centerX, 150, `⚡ ${messages.opening.chargedReady}`, {
        color: '#f2ebff',
        backgroundColor: '#443668',
        padding: { x: 16, y: 8 },
        stroke: '#160f20',
        strokeThickness: 2,
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(0.82)
      .setAlpha(0);
    this.root.add(banner);
    this.tweens.add({
      targets: banner,
      alpha: 1,
      scale: 1.05,
      duration: 180,
      ease: 'Back.Out',
      onComplete: () => {
        if (!banner.active) return;
        this.tweens.add({
          targets: banner,
          alpha: 0,
          y: banner.y - 12,
          delay: 420,
          duration: 220,
          onComplete: () => banner.destroy(),
        });
      },
    });
  }

'''
replace_once(
    "  private async animateStandardReveal(pending: PendingReveal): Promise<Phaser.GameObjects.Container> {",
    animation_methods + "  private async animateStandardReveal(pending: PendingReveal): Promise<Phaser.GameObjects.Container> {",
    'economy animation methods',
)

regex_once(
    r"  private getStandardResultStatus\(pending: PendingReveal\): string \{.*?\n  \}\n\n  private addStandardResultLabels",
    r'''  private getStandardResultStatus(pending: PendingReveal): string {
    const messages = getMessages(getPlatformRuntime().language);
    let status = pending.standard.isNew ? messages.opening.newItem : messages.opening.duplicate;
    if (pending.signal.lockConsumed || pending.signal.lockReached) {
      status += ` · ${messages.opening.signalLock}`;
    } else if (pending.signal.gain > 0) {
      status += ` · +${pending.signal.gain} SIGNAL`;
    }
    return status;
  }

  private addStandardResultLabels''',
    'result status',
)

replace_once(
    "      hiddenPocket: pending.hiddenPocket !== null,\n      signalAfter: committed.signal,",
    "      pouchType: pending.pouchType,\n      lootPoolId: pending.lootPoolId,\n      hiddenPocket: pending.hiddenPocket !== null,\n      chipsEarned: pending.chips.totalEarned,\n      chipsAfter: committed.chips,\n      cacheTier: pending.chips.cacheTier,\n      recycleChips: pending.chips.recycle,\n      signalAfter: committed.signal,",
    'analytics reward fields',
)
replace_once(
    "    if (pending.signal.lockConsumed) {\n      analytics.track('signal_lock_consumed', { openingNumber: pending.openingNumber });\n    }",
    "    if (pending.signal.lockConsumed) {\n      analytics.track('signal_lock_consumed', { openingNumber: pending.openingNumber });\n    }\n    if (pending.signal.lockRetained) {\n      analytics.track('signal_lock_retained', { openingNumber: pending.openingNumber, pouchType: pending.pouchType });\n    }\n    if (pending.chips.cacheTier !== 'none') {\n      analytics.track('chips_cache_hit', {\n        openingNumber: pending.openingNumber,\n        pouchType: pending.pouchType,\n        cacheTier: pending.chips.cacheTier,\n        cacheChips: pending.chips.cacheBonus,\n      });\n    }",
    'analytics economy events',
)

replace_once(
    "    const family = SLICE_REGISTRY.familyById.get(pending.standard.familyId);\n    return {\n      title: `${family?.name[language] ?? pending.standard.familyId} · ${messages.rarity[pending.standard.rarity]}`,
",
    "    const family = SLICE_REGISTRY.familyById.get(pending.standard.familyId);\n    const pouchPrefix = pending.pouchType === 'charged' ? '⚡ ' : '';\n    return {\n      title: `${pouchPrefix}${family?.name[language] ?? pending.standard.familyId} · ${messages.rarity[pending.standard.rarity]}`,
",
    'charged result prefix',
)

replace_once(
    "  private continueFromResult(): void {\n    if (this.phase !== 'result' || !this.resultReady) return;\n    this.resultCarouselDrag = null;\n    this.renderIdle();\n  }",
    "  private continueFromResult(): void {\n    if (this.phase !== 'result' || !this.resultReady) return;\n    this.resultCarouselDrag = null;\n    this.selectedPouchType = 'basic';\n    this.renderIdle();\n  }",
    'safe default after result',
)

replace_once(
    "    this.renderSignalHud(root, this.saveState.signal, this.saveState.signal >= SLICE_BALANCE.signal.threshold);",
    "    this.renderResourceHud(root, this.saveState);",
    'result resource HUD',
)

replace_once(
    "      balance: SLICE_BALANCE,",
    "      balance: LITE_V2_BALANCE,",
    'OpeningSession Lite balance',
)

path.write_text(text)
print('OpeningScene Lite V2 UI patch applied')
