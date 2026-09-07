from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected 1 match, got {count}: {old[:120]!r}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')


def replace_between(path: str, start: str, end: str, replacement: str) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    a = text.find(start)
    if a < 0:
        raise SystemExit(f'{path}: missing start marker {start!r}')
    b = text.find(end, a)
    if b < 0:
        raise SystemExit(f'{path}: missing end marker {end!r}')
    p.write_text(text[:a] + replacement + text[b:], encoding='utf-8')


# i18n: explicit Signal/Overcharge/Secret semantics.
replace_once(
    'src/i18n/en.ts',
    "    signalLock: 'SIGNAL LOCK',\n    signalCharged: 'LOCK · CHARGED',\n    locked: 'LOCKED',",
    "    signal: 'SIGNAL',\n    signalLock: 'SIGNAL LOCK',\n    signalLockReady: 'LOCK READY',\n    signalLockRetained: 'LOCK RETAINED',\n    signalLockConsumed: 'LOCK CONSUMED',\n    signalCharged: 'LOCK · CHARGED',\n    overcharge: 'OVERCHARGE',\n    overchargeMax: 'OVERCHARGE MAX',\n    total: 'TOTAL',\n    raw: 'RAW',\n    addedToCollection: 'ADDED TO COLLECTION',\n    locked: 'LOCKED',",
)
replace_once(
    'src/i18n/ru.ts',
    "    signalLock: 'SIGNAL LOCK',\n    signalCharged: 'LOCK · CHARGED',\n    locked: 'ЗАФИКСИРОВАНО',",
    "    signal: 'SIGNAL',\n    signalLock: 'SIGNAL LOCK',\n    signalLockReady: 'LOCK ГОТОВ',\n    signalLockRetained: 'LOCK СОХРАНЁН',\n    signalLockConsumed: 'LOCK ИСПОЛЬЗОВАН',\n    signalCharged: 'LOCK · CHARGED',\n    overcharge: 'OVERCHARGE',\n    overchargeMax: 'OVERCHARGE MAX',\n    total: 'ИТОГО',\n    raw: 'ДО БОНУСА',\n    addedToCollection: 'ДОБАВЛЕНО В КОЛЛЕКЦИЮ',\n    locked: 'ЗАФИКСИРОВАНО',",
)

# OpeningScene imports Overcharge formatting from the pure system.
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "import { OpeningSession } from '../systems/openingSession';\nimport { MathRandomSource } from '../systems/random';",
    "import { OpeningSession } from '../systems/openingSession';\nimport { formatOverchargeMultiplier } from '../systems/overcharge';\nimport { MathRandomSource } from '../systems/random';",
)

# Signal HUD: explicit cause/effect states + dormant/active/MAX Overcharge line.
replace_between(
    'src/game/scenes/OpeningScene.ts',
    '  private renderSignalHud(root: Phaser.GameObjects.Container, state: SaveState): void {',
    '  private renderPouchSelector(root: Phaser.GameObjects.Container): void {',
    r'''  private renderSignalHud(root: Phaser.GameObjects.Container, state: SaveState): void {
    if (!this.metrics) return;
    const previousShimmer = this.signalHudContainer?.getData('shimmer') as Phaser.GameObjects.Rectangle | undefined;
    if (previousShimmer) {
      this.tweens.killTweensOf(previousShimmer);
      this.hudShimmers = this.hudShimmers.filter((item) => item !== previousShimmer);
    }
    this.signalHudContainer?.destroy(true);
    this.signalHudSegments = [];

    const threshold = LITE_V2_BALANCE.signalThreshold;
    const clamped = Phaser.Math.Clamp(Math.floor(state.signal), 0, threshold);
    const lockReady = clamped >= threshold;
    const waitingForCharged = isSignalWaitingForCharged(state, SLICE_REGISTRY, LITE_V2_BALANCE);
    const overcharge = Phaser.Math.Clamp(
      state.overchargeHundredths,
      100,
      LITE_V2_BALANCE.overchargeCapHundredths,
    );
    const overchargeActive = overcharge > 100;
    const overchargeMax = overcharge >= LITE_V2_BALANCE.overchargeCapHundredths;
    const messages = getMessages(getPlatformRuntime().language);
    const labelText = lockReady ? messages.opening.signalLockReady : messages.opening.signal;
    const x = this.metrics.safeLeft;
    const y = this.metrics.safeTop + OPENING_FEEL_PRESENTATION.railTopOffset + OPENING_FEEL_PRESENTATION.chipsHudHeight + 10;
    const width = OPENING_FEEL_PRESENTATION.signalHudWidth;
    const height = OPENING_FEEL_PRESENTATION.signalHudHeight;
    const container = this.add.container(x, y);
    const background = this.add.graphics();
    background.fillStyle(0x17101f, 0.84);
    background.fillRoundedRect(0, 0, width, height, 18);
    background.lineStyle(
      overchargeMax ? 1.9 : 1.5,
      overchargeMax ? 0xff6f9f : waitingForCharged ? 0x9d7cff : 0x76e9f5,
      overchargeMax ? 0.64 : 0.38,
    );
    background.strokeRoundedRect(0, 0, width, height, 18);
    container.add(background);
    const shimmer = this.addHudShimmer(container, width, height, 360);
    container.setData('shimmer', shimmer);

    const label = this.add.text(14, 7, labelText, {
      color: lockReady ? '#d7ceff' : '#b9f7ff',
      stroke: '#160f20',
      strokeThickness: 2,
      fontFamily: DIGITAL_FONT_FAMILY,
      fontSize: lockReady ? '8px' : '9px',
    });
    const value = this.add.text(width - 14, 7, `${clamped}/${threshold}`, {
      color: '#f7fdff',
      stroke: '#160f20',
      strokeThickness: 2,
      fontFamily: DIGITAL_FONT_FAMILY,
      fontSize: '9px',
    }).setOrigin(1, 0);

    const overchargeColor = overchargeMax ? '#ff7aa8' : overchargeActive ? '#8df8ff' : '#81788a';
    const overchargeLabel = this.add.text(14, 27, messages.opening.overcharge, {
      color: overchargeActive || overchargeMax ? overchargeColor : '#6e6677',
      fontFamily: DIGITAL_FONT_FAMILY,
      fontSize: '7px',
    });
    const overchargeValue = this.add.text(
      width - 14,
      27,
      `${formatOverchargeMultiplier(overcharge)}${overchargeMax ? ' · MAX' : ''}`,
      {
        color: overchargeColor,
        stroke: overchargeActive || overchargeMax ? '#160f20' : undefined,
        strokeThickness: overchargeActive || overchargeMax ? 2 : 0,
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: '7px',
      },
    ).setOrigin(1, 0);
    container.add([label, value, overchargeLabel, overchargeValue]);

    const segmentGap = 6;
    const segmentWidth = (width - 28 - segmentGap * (threshold - 1)) / threshold;
    for (let index = 0; index < threshold; index += 1) {
      const active = index < clamped;
      const segment = this.add
        .rectangle(
          14 + index * (segmentWidth + segmentGap),
          50,
          segmentWidth,
          8,
          active ? (waitingForCharged ? 0x9d7cff : 0x76e9f5) : 0x3a3146,
          active ? 0.98 : 0.72,
        )
        .setOrigin(0, 0.5)
        .setStrokeStyle(1, active ? 0xeefcff : 0x766b82, active ? 0.5 : 0.18);
      container.add(segment);
      this.signalHudSegments.push(segment);
    }

    if (lockReady) {
      const readyDot = this.add.circle(width - 10, 10, 3, overchargeMax ? 0xff6f9f : 0x9d7cff, 0.8);
      container.add(readyDot);
      this.tweens.add({
        targets: readyDot,
        alpha: 0.24,
        scale: 1.45,
        duration: 620,
        yoyo: true,
        repeat: -1,
        repeatDelay: 1150,
        ease: 'Sine.InOut',
      });
    }

    container.bringToTop(shimmer);
    root.add(container);
    this.signalHudContainer = container;
  }

''',
)

# Store canonical card transform and add a calm availability pulse without moving the card.
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "      card.setData('available', available);\n      card.setData('idleAlpha', idleAlpha);\n      card.setData('pouchType', pouchType);",
    "      card.setData('available', available);\n      card.setData('idleAlpha', idleAlpha);\n      card.setData('baseX', railX);\n      card.setData('baseY', y);\n      card.setData('pouchType', pouchType);",
)
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "    createCard(\n      'charged',\n      firstCardY + height + OPENING_FEEL_PRESENTATION.railGap,\n      `⚡ ${messages.opening.chargedPouch}`,\n      chargedAvailable\n        ? `${cost} ${messages.opening.chips}`\n        : `${this.saveState.chips}/${cost} ${messages.opening.chips}`,\n      chargedAvailable,\n    );\n  }\n\n  private showUnavailableChargedFeedback(card: Phaser.GameObjects.Container): void {",
    "    const chargedCard = createCard(\n      'charged',\n      firstCardY + height + OPENING_FEEL_PRESENTATION.railGap,\n      `⚡ ${messages.opening.chargedPouch}`,\n      chargedAvailable\n        ? `${cost} ${messages.opening.chips}`\n        : `${this.saveState.chips}/${cost} ${messages.opening.chips}`,\n      chargedAvailable,\n    );\n    if (chargedAvailable && this.selectedPouchType !== 'charged') {\n      this.startPaidPouchAvailabilityPulse(chargedCard, this.saveState.signal >= LITE_V2_BALANCE.signalThreshold);\n    }\n  }\n\n  private startPaidPouchAvailabilityPulse(card: Phaser.GameObjects.Container, linkedToSignal: boolean): void {\n    const width = OPENING_FEEL_PRESENTATION.railCardWidth;\n    const height = OPENING_FEEL_PRESENTATION.railCardHeight;\n    const outline = this.add.graphics().setAlpha(0.04);\n    outline.lineStyle(2.5, linkedToSignal ? 0x9d7cff : CHARGED_ACCENT, linkedToSignal ? 0.72 : 0.46);\n    outline.strokeRoundedRect(2, 2, width - 4, height - 4, 14);\n    card.add(outline);\n    this.tweens.add({\n      targets: outline,\n      alpha: linkedToSignal ? 0.34 : 0.2,\n      duration: linkedToSignal ? 520 : 720,\n      yoyo: true,\n      repeat: -1,\n      repeatDelay: linkedToSignal ? 1550 : 3300,\n      ease: 'Sine.InOut',\n    });\n  }\n\n  private showUnavailableChargedFeedback(card: Phaser.GameObjects.Container): void {",
)
replace_between(
    'src/game/scenes/OpeningScene.ts',
    '  private showUnavailableChargedFeedback(card: Phaser.GameObjects.Container): void {',
    '  private selectPouchType(pouchType: PouchType, sourceCard?: Phaser.GameObjects.Container): void {',
    r'''  private showUnavailableChargedFeedback(card: Phaser.GameObjects.Container): void {
    if (!this.chipsHudContainer) return;
    getGameAudio().play('ui-denied');
    const baseX = Number(card.getData('baseX') ?? card.x);
    const baseY = Number(card.getData('baseY') ?? card.y);
    this.tweens.killTweensOf(card);
    card.setPosition(baseX, baseY).setScale(1);
    this.tweens.add({
      targets: card,
      x: baseX + 6,
      duration: 55,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.InOut',
      onComplete: () => card.setPosition(baseX, baseY).setScale(1),
    });
    this.setChipsHudValue(this.chipsHudValue, true);
  }

''',
)

# Reward tray: compact tags, explicit Signal progress, Secret collection semantics and Overcharge accounting.
replace_between(
    'src/game/scenes/OpeningScene.ts',
    '  private renderRewardTray(',
    '  private async animateRewardStaging(',
    r'''  private renderRewardTray(
    pending: PendingReveal,
    root: Phaser.GameObjects.Container,
    animate = false,
  ): Phaser.GameObjects.Container {
    this.rewardTrayContainer?.destroy(true);
    const messages = getMessages(getPlatformRuntime().language);
    const cacheLabel = this.getCacheLabel(pending.chips.cacheTier);
    const rarityColor = `#${RARITY_REVEAL_COLORS[pending.standard.rarity].toString(16).padStart(6, '0')}`;
    const rarityCode = pending.standard.rarity.toUpperCase();
    type RewardRow = {
      kind: 'chips' | 'signal' | 'overcharge' | 'secret' | 'total';
      text: string;
      color: string;
      tag?: string;
      tagColor?: string;
      countBonus?: boolean;
    };
    const rows: RewardRow[] = [
      { kind: 'chips', text: `+${pending.chips.base} ${messages.opening.chips}`, color: CHIPS_TEXT_COLOR },
    ];
    if (cacheLabel && pending.chips.cacheBonus > 0) {
      rows.push({
        kind: 'chips',
        text: `${cacheLabel} +${pending.chips.cacheBonus}`,
        color: pending.chips.cacheTier === 'mega' ? '#ffe59a' : pending.chips.cacheTier === 'big' ? CHARGED_TEXT_COLOR : '#7ee8c8',
      });
    }
    if (pending.chips.recycle > 0) {
      rows.push({
        kind: 'chips',
        text: `${messages.opening.recycled} +${pending.chips.recycle}`,
        color: '#c7f8ff',
        tag: rarityCode,
        tagColor: rarityColor,
      });
    }
    if (pending.overcharge.beforeHundredths > 100) {
      rows.push({
        kind: 'chips',
        text: `${messages.opening.raw} +${pending.chips.rawEarned}`,
        color: '#b9c8d7',
      });
      rows.push({
        kind: 'overcharge',
        text: `${messages.opening.overcharge} ${formatOverchargeMultiplier(pending.overcharge.beforeHundredths)}`,
        color: '#8df8ff',
        tag: `+${animate ? 0 : pending.chips.overchargeBonus}`,
        tagColor: '#8df8ff',
        countBonus: animate && pending.chips.overchargeBonus > 0,
      });
      rows.push({
        kind: 'total',
        text: `${messages.opening.total} +${pending.chips.totalEarned}`,
        color: '#f4feff',
      });
    }
    if (pending.signal.gain > 0) {
      const signalResult = pending.signal.lockReached
        ? messages.opening.signalLockReady
        : `${pending.signal.after}/${LITE_V2_BALANCE.signalThreshold}`;
      rows.push({
        kind: 'signal',
        text: `${messages.opening.signal} +${pending.signal.gain} · ${signalResult}`,
        color: '#b7a7ff',
      });
    } else if (pending.signal.lockConsumed) {
      rows.push({ kind: 'signal', text: messages.opening.signalLockConsumed, color: '#ff9ed4' });
    } else if (pending.signal.lockRetained) {
      rows.push({ kind: 'signal', text: messages.opening.signalLockRetained, color: '#b7a7ff' });
    }
    if (pending.hiddenPocket) {
      rows.push({ kind: 'secret', text: messages.opening.addedToCollection, color: '#8df8ff' });
    }
    if (pending.signal.lockRetained) {
      if (pending.overcharge.appliedGainHundredths > 0) {
        rows.push({
          kind: 'overcharge',
          text: `${messages.opening.overcharge} +${(pending.overcharge.appliedGainHundredths / 100).toFixed(2)}`,
          color: pending.overcharge.afterHundredths >= LITE_V2_BALANCE.overchargeCapHundredths ? '#ff7aa8' : '#8df8ff',
          tag: pending.overcharge.afterHundredths >= LITE_V2_BALANCE.overchargeCapHundredths ? 'MAX' : undefined,
          tagColor: '#ff7aa8',
        });
      } else if (pending.overcharge.beforeHundredths >= LITE_V2_BALANCE.overchargeCapHundredths) {
        rows.push({ kind: 'overcharge', text: messages.opening.overchargeMax, color: '#ff7aa8' });
      }
    }

    const width = OPENING_FEEL_PRESENTATION.rewardTrayWidth;
    const rowHeight = 21;
    const height = 30 + rows.length * rowHeight;
    const placement = computeRewardTrayPlacement({
      safeLeft: this.metrics!.safeLeft,
      safeRight: this.metrics!.safeRight,
      safeTop: this.metrics!.safeTop,
      centerX: this.metrics!.centerX,
      railRight: this.metrics!.safeLeft + OPENING_FEEL_PRESENTATION.railCardWidth,
      resultPanelTop: RESULT_PRESENTATION.panelY - RESULT_PRESENTATION.panelHeight / 2,
      trayWidth: width,
      trayHeight: height,
      heroHalfWidth: OPENING_FEEL_PRESENTATION.rewardTrayHeroHalfWidth,
      sideGap: OPENING_FEEL_PRESENTATION.rewardTraySideGap,
      resultGap: OPENING_FEEL_PRESENTATION.rewardTrayResultGap,
    });
    const tray = this.add.container(placement.x, placement.y - height / 2);
    tray.setData('height', height);
    tray.setData('side', placement.side);
    const background = this.add.graphics();
    background.fillStyle(0x17101f, 0.9);
    background.fillRoundedRect(-width / 2, 0, width, height, 16);
    background.lineStyle(1.5, 0x8df8ff, 0.3);
    background.strokeRoundedRect(-width / 2, 0, width, height, 16);
    const header = this.add.text(-width / 2 + 13, 9, 'REWARD', {
      color: '#d9cbef',
      fontFamily: DIGITAL_FONT_FAMILY,
      fontSize: '7px',
    });
    tray.add([background, header]);
    rows.forEach((row, index) => {
      const iconY = 30 + index * rowHeight;
      const icon = row.kind === 'signal'
        ? createSignalToken(this, -width / 2 + 17, iconY, false)
        : row.kind === 'secret'
          ? this.add.circle(-width / 2 + 17, iconY, 5.5, SECRET_REVEAL_COLOR, 0.94).setStrokeStyle(1.5, 0xffffff, 0.5)
          : createChipToken(this, -width / 2 + 17, iconY, row.kind === 'overcharge' ? 0.36 : 0.42);
      if (row.kind === 'overcharge') icon.setAlpha(0.88);
      const text = this.add.text(-width / 2 + 31, 25 + index * rowHeight, row.text, {
        color: row.color,
        stroke: '#100b16',
        strokeThickness: 2,
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: getPlatformRuntime().language === 'ru' ? '6px' : '7px',
      });
      tray.add([icon, text]);
      if (row.tag) {
        const tag = this.add.text(width / 2 - 12, 25 + index * rowHeight, row.tag, {
          color: row.tagColor ?? row.color,
          stroke: '#100b16',
          strokeThickness: 2,
          fontFamily: DIGITAL_FONT_FAMILY,
          fontSize: '6px',
        }).setOrigin(1, 0);
        tray.add(tag);
        if (row.countBonus) {
          const counter = { value: 0 };
          this.tweens.add({
            targets: counter,
            value: pending.chips.overchargeBonus,
            delay: 90,
            duration: 360,
            ease: 'Cubic.Out',
            onUpdate: () => tag.setText(`+${Math.round(counter.value)}`),
            onComplete: () => tag.setText(`+${pending.chips.overchargeBonus}`),
          });
        }
      }
    });
    root.add(tray);
    this.rewardTrayContainer = tray;
    if (animate) {
      const targetY = tray.y;
      tray.setAlpha(0).setY(targetY + 7);
      this.tweens.add({
        targets: tray,
        alpha: 1,
        y: targetY,
        duration: OPENING_FEEL_PRESENTATION.uiFadeInMs,
        ease: 'Sine.Out',
      });
    }
    return tray;
  }

''',
)

# Result must show the multiplier that priced the current opening, not the already-committed next state.
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "      ...this.saveState,\n      chips: pending.chips.before - pending.chips.cost,\n      signal: visualSignal,\n    };",
    "      ...this.saveState,\n      chips: pending.chips.before - pending.chips.cost,\n      signal: visualSignal,\n      overchargeHundredths: pending.overcharge.beforeHundredths,\n    };",
)

# Explicit post-reward Overcharge gain/MAX/discharge choreography.
replace_once(
    'src/game/scenes/OpeningScene.ts',
    '  private finishDeferredBankingResize(): boolean {',
    r'''  private async animateOverchargeTransition(pending: PendingReveal): Promise<void> {
    if (!this.root || !this.metrics || !this.saveState) return;
    const before = pending.overcharge.beforeHundredths;
    const after = pending.overcharge.afterHundredths;
    const signalTarget = {
      x: this.metrics.safeLeft + OPENING_FEEL_PRESENTATION.signalHudWidth / 2,
      y:
        this.metrics.safeTop +
        OPENING_FEEL_PRESENTATION.railTopOffset +
        OPENING_FEEL_PRESENTATION.chipsHudHeight +
        10 +
        OPENING_FEEL_PRESENTATION.signalHudHeight / 2,
    };

    if (pending.signal.lockRetained && pending.overcharge.appliedGainHundredths > 0) {
      const origin = this.getRewardBankOrigin();
      const reachesMax = after >= LITE_V2_BALANCE.overchargeCapHundredths;
      const color = reachesMax ? 0xff6f9f : 0x8df8ff;
      const fragment = this.add
        .circle(origin.x + 26, origin.y + 7, 7, color, 0.96)
        .setStrokeStyle(2, 0xffffff, 0.58);
      this.root.add(fragment);
      getGameAudio().play('signal-gain');
      await this.runSkippableTween(
        {
          targets: fragment,
          x: signalTarget.x,
          y: signalTarget.y,
          scale: 0.42,
          alpha: 0.28,
          duration: 330,
          ease: 'Cubic.In',
        },
        () => fragment.destroy(),
      );
      if (this.isSceneShutdown()) return;
      this.renderSignalHud(this.root, { ...this.saveState, signal: pending.signal.after, overchargeHundredths: after });
      if (this.signalHudContainer) {
        this.tweens.killTweensOf(this.signalHudContainer);
        this.tweens.add({
          targets: this.signalHudContainer,
          scale: reachesMax ? 1.055 : 1.035,
          duration: 105,
          yoyo: true,
          repeat: reachesMax ? 1 : 0,
          ease: 'Sine.Out',
        });
      }
      return;
    }

    if (pending.signal.lockRetained && before >= LITE_V2_BALANCE.overchargeCapHundredths) {
      this.renderSignalHud(this.root, { ...this.saveState, signal: pending.signal.after, overchargeHundredths: after });
      if (this.signalHudContainer) {
        this.tweens.add({ targets: this.signalHudContainer, scale: 1.035, duration: 100, yoyo: true, ease: 'Sine.Out' });
      }
      return;
    }

    if (pending.signal.lockConsumed) {
      const targetY = getCollectiblePresentation(pending.standard.familyId).revealY;
      const discharge = this.add
        .circle(signalTarget.x, signalTarget.y, 9, 0xff8ed1, 0.96)
        .setStrokeStyle(2, 0xffffff, 0.62);
      const ring = this.add.circle(signalTarget.x, signalTarget.y, 18, 0x9d7cff, 0.12).setStrokeStyle(3, 0x9d7cff, 0.72);
      this.root.add([ring, discharge]);
      getGameAudio().play('signal-lock');
      this.tweens.add({
        targets: ring,
        scale: 2.4,
        alpha: 0,
        duration: 280,
        ease: 'Cubic.Out',
        onComplete: () => ring.destroy(),
      });
      await this.runSkippableTween(
        {
          targets: discharge,
          x: this.metrics.centerX,
          y: targetY,
          scale: 0.55,
          alpha: 0.2,
          duration: 360,
          ease: 'Cubic.In',
        },
        () => discharge.destroy(),
      );
      if (this.isSceneShutdown()) return;
      this.cameras.main.shake(95, 0.0019);
      this.renderSignalHud(this.root, this.saveState);
      if (this.signalHudContainer) {
        this.tweens.add({ targets: this.signalHudContainer, scale: 0.97, duration: 85, yoyo: true, ease: 'Sine.Out' });
      }
    }
  }

  private finishDeferredBankingResize(): boolean {''',
)

# Bank the Overcharge CHIPS bonus as its own leg, then stage gain/reset after current reward cash-out.
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "    await bankLeg(pending.chips.recycle);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;\n    await this.bankSignalGain(pending);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;\n\n    this.setChipsHudValue(pending.chips.after, false);",
    "    await bankLeg(pending.chips.recycle);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;\n    await bankLeg(pending.chips.overchargeBonus);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;\n    await this.bankSignalGain(pending);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;\n    await this.animateOverchargeTransition(pending);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;\n\n    this.setChipsHudValue(pending.chips.after, false);",
)

# Signal status copy distinguishes ready / retained / consumed.
replace_between(
    'src/game/scenes/OpeningScene.ts',
    '  private getStandardResultStatus(pending: PendingReveal): string {',
    '  private addStandardResultLabels(',
    r'''  private getStandardResultStatus(pending: PendingReveal): string {
    const messages = getMessages(getPlatformRuntime().language);
    let status = pending.standard.isNew ? messages.opening.newItem : messages.opening.duplicate;
    if (pending.signal.lockConsumed) {
      status += ` · ${messages.opening.signalLockConsumed}`;
    } else if (pending.signal.lockRetained) {
      status += ` · ${messages.opening.signalLockRetained}`;
    } else if (pending.signal.lockReached) {
      status += ` · ${messages.opening.signalLockReady}`;
    } else if (pending.signal.gain > 0) {
      status += ` · ${messages.opening.signal} +${pending.signal.gain} · ${pending.signal.after}/${LITE_V2_BALANCE.signalThreshold}`;
    }
    return status;
  }

''',
)

# Secret: moving diffuse cloud behind the object + bounded object shake/settle.
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "    const heroX = metrics.centerX;\n    const heroY = secretPresentation.revealY;\n    this.createRevealBackdrop(fx.backdropAlpha, fx.particleDuration);\n    const halo = this.add.circle(heroX, heroY, 158, SECRET_REVEAL_COLOR, fx.glowAlpha).setScale(0.34);",
    "    const heroX = metrics.centerX;\n    const heroY = secretPresentation.revealY;\n    this.createRevealBackdrop(fx.backdropAlpha, fx.particleDuration);\n    const auraCloud = this.add.container(heroX, heroY).setAlpha(0);\n    const cloudA = this.add.ellipse(-28, 8, 280, 176, SECRET_REVEAL_COLOR, 0.13).setBlendMode(Phaser.BlendModes.ADD);\n    const cloudB = this.add.ellipse(42, -20, 220, 142, 0xff8ed1, 0.09).setBlendMode(Phaser.BlendModes.ADD);\n    auraCloud.add([cloudA, cloudB]);\n    root.add(auraCloud);\n    this.tweens.add({\n      targets: auraCloud,\n      alpha: 0.9,\n      scale: 1.12,\n      angle: 3,\n      duration: 520,\n      yoyo: true,\n      hold: 210,\n      ease: 'Sine.InOut',\n      onComplete: () => auraCloud.destroy(),\n    });\n    this.tweens.add({ targets: cloudA, x: 18, duration: 760, yoyo: true, ease: 'Sine.InOut' });\n    this.tweens.add({ targets: cloudB, x: -16, y: 8, duration: 680, yoyo: true, ease: 'Sine.InOut' });\n    const halo = this.add.circle(heroX, heroY, 158, SECRET_REVEAL_COLOR, fx.glowAlpha).setScale(0.34);",
)
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "    await this.runSkippableTween({\n      targets: secret.group,\n      scale: secretPresentation.revealScale,\n      duration: fx.settleDuration,\n      ease: 'Sine.Out',\n    });\n    this.cameras.main.shake(110, fx.shake);",
    "    await this.runSkippableTween({\n      targets: secret.group,\n      scale: secretPresentation.revealScale,\n      duration: fx.settleDuration,\n      ease: 'Sine.Out',\n    });\n    this.cameras.main.shake(120, Math.min(0.0054, fx.shake * 1.18));\n    await this.runSkippableTween({\n      targets: secret.group,\n      x: heroX + 5,\n      angle: 1.1,\n      duration: 52,\n      yoyo: true,\n      repeat: 2,\n      ease: 'Sine.InOut',\n    });\n    secret.group.setPosition(heroX, heroY).setAngle(0);",
)

# Analytics: Overcharge becomes diagnosable without adding another product surface.
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "      recycleChips: pending.chips.recycle,\n      signalAfter: committed.signal,\n    });",
    "      recycleChips: pending.chips.recycle,\n      overchargeBefore: pending.overcharge.beforeHundredths,\n      overchargeBonusChips: pending.chips.overchargeBonus,\n      overchargeGain: pending.overcharge.appliedGainHundredths,\n      overchargeAfter: committed.overchargeHundredths,\n      signalAfter: committed.signal,\n    });",
)
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "    if (pending.signal.lockRetained) {\n      analytics.track('signal_lock_retained', { openingNumber: pending.openingNumber, pouchType: pending.pouchType });\n    }\n    if (pending.chips.cacheTier !== 'none') {",
    "    if (pending.signal.lockRetained) {\n      analytics.track('signal_lock_retained', { openingNumber: pending.openingNumber, pouchType: pending.pouchType });\n    }\n    if (pending.overcharge.appliedGainHundredths > 0) {\n      analytics.track('overcharge_gained', {\n        openingNumber: pending.openingNumber,\n        pouchType: pending.pouchType,\n        before: pending.overcharge.beforeHundredths,\n        gain: pending.overcharge.appliedGainHundredths,\n        after: pending.overcharge.afterHundredths,\n      });\n    }\n    if (pending.signal.lockConsumed && pending.overcharge.beforeHundredths > 100) {\n      analytics.track('overcharge_cashed_out', {\n        openingNumber: pending.openingNumber,\n        before: pending.overcharge.beforeHundredths,\n        bonusChips: pending.chips.overchargeBonus,\n      });\n    }\n    if (pending.chips.cacheTier !== 'none') {",
)

# Integrated rarity capsule: no opaque black block, stays rarity-tinted and updates with carousel page.
replace_between(
    'src/game/scenes/OpeningScene.ts',
    '  private positionResultHeading(',
    '  private renderResultActionPanel(pending: PendingReveal): void {',
    r'''  private positionResultHeading(
    title: Phaser.GameObjects.Text,
    rarity: Phaser.GameObjects.Text,
  ): void {
    const gap = 12;
    const totalWidth = title.width + gap + rarity.width;
    const startX = -totalWidth / 2;
    title.setOrigin(0, 0.5).setPosition(startX, -32);
    rarity.setOrigin(0, 0.5).setPosition(startX + title.width + gap, -32);
    const capsule = rarity.getData('capsule') as Phaser.GameObjects.Graphics | undefined;
    if (capsule) {
      const capsuleColor = Number(rarity.getData('capsuleColor') ?? 0xf0ddff);
      capsule.clear();
      capsule.fillStyle(capsuleColor, 0.1);
      capsule.fillRoundedRect(rarity.x - 7, rarity.y - rarity.height / 2 - 4, rarity.width + 14, rarity.height + 8, 9);
      capsule.lineStyle(1.5, capsuleColor, 0.5);
      capsule.strokeRoundedRect(rarity.x - 7, rarity.y - rarity.height / 2 - 4, rarity.width + 14, rarity.height + 8, 9);
    }
  }

''',
)
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "        rarity.setText(`◆ ${copy.rarity.toUpperCase()}`).setColor(copy.rarityColor);\n        status.setText(copy.status).setColor(copy.statusColor);\n        this.positionResultHeading(title, rarity);",
    "        rarity.setText(`◆ ${copy.rarity.toUpperCase()}`).setColor(copy.rarityColor);\n        rarity.setData('capsuleColor', Number.parseInt(copy.rarityColor.slice(1), 16));\n        status.setText(copy.status).setColor(copy.statusColor);\n        this.positionResultHeading(title, rarity);",
)
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "    const rarity = this.add.text(0, -32, `◆ ${copy.rarity.toUpperCase()}`, {\n      color: copy.rarityColor,\n      backgroundColor: '#18101f',\n      padding: { x: 8, y: 4 },\n      stroke: '#160f20',",
    "    const rarityCapsule = this.add.graphics();\n    const rarity = this.add.text(0, -32, `◆ ${copy.rarity.toUpperCase()}`, {\n      color: copy.rarityColor,\n      padding: { x: 3, y: 2 },\n      stroke: '#160f20',",
)
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "    this.positionResultHeading(title, rarity);\n    const status = this.add.text(0, 0, copy.status, {",
    "    rarity.setData('capsule', rarityCapsule);\n    rarity.setData('capsuleColor', Number.parseInt(copy.rarityColor.slice(1), 16));\n    this.positionResultHeading(title, rarity);\n    const status = this.add.text(0, 0, copy.status, {",
)
replace_once(
    'src/game/scenes/OpeningScene.ts',
    '    panel.add([background, readyGlow, title, rarity, status, hint, actionZone]);',
    '    panel.add([background, readyGlow, title, rarityCapsule, rarity, status, hint, actionZone]);',
)

print('Phase 2.6 presentation patch applied')
