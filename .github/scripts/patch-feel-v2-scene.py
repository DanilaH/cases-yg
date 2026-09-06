from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    if old not in text:
        raise SystemExit(f"{path}: expected text not found: {old[:120]!r}")
    file.write_text(text.replace(old, new, 1))


def replace_between(path: str, start: str, end: str, replacement: str) -> None:
    file = Path(path)
    text = file.read_text()
    start_index = text.find(start)
    if start_index < 0:
        raise SystemExit(f"{path}: start marker not found: {start!r}")
    end_index = text.find(end, start_index)
    if end_index < 0:
        raise SystemExit(f"{path}: end marker not found: {end!r}")
    file.write_text(text[:start_index] + replacement + text[end_index:])


path = "src/game/scenes/OpeningScene.ts"

replace_between(
    path,
    "  private clearAmbientMotion(): void {",
    "  private startStarPulse(): void {",
    '''  private clearAmbientMotion(): void {
    for (const particle of this.ambientParticles) {
      this.tweens.killTweensOf(particle);
    }
    this.ambientParticles = [];
  }

  private clearHudMotion(): void {
    for (const shimmer of this.hudShimmers) this.tweens.killTweensOf(shimmer);
    this.hudShimmers = [];
    this.signalHudSegments = [];
  }

  private addHudShimmer(
    container: Phaser.GameObjects.Container,
    width: number,
    height: number,
    delay = 0,
  ): Phaser.GameObjects.Rectangle {
    const shimmer = createHudShimmer(this, height).setAlpha(0.015);
    container.add(shimmer);
    this.hudShimmers.push(shimmer);
    this.tweens.add({
      targets: shimmer,
      x: width - 10,
      alpha: 0.12,
      duration: OPENING_FEEL_PRESENTATION.hudShimmerDurationMs,
      delay,
      repeat: -1,
      repeatDelay: OPENING_FEEL_PRESENTATION.hudShimmerRepeatDelayMs,
      ease: 'Sine.InOut',
      onRepeat: () => {
        if (shimmer.active) shimmer.setX(10).setAlpha(0.015);
      },
    });
    return shimmer;
  }

  private animateSignalArrival(pending: PendingReveal): void {
    if (pending.signal.gain <= 0 || this.signalHudSegments.length === 0) return;
    const threshold = LITE_V2_BALANCE.signalThreshold;
    const start = Phaser.Math.Clamp(Math.floor(pending.signal.before), 0, threshold);
    const end = Phaser.Math.Clamp(start + Math.floor(pending.signal.gain), 0, threshold);
    for (let index = start; index < end; index += 1) {
      const segment = this.signalHudSegments[index];
      if (!segment) continue;
      segment.setScale(0.05, 1).setAlpha(0.36);
      this.tweens.add({
        targets: segment,
        scaleX: 1,
        alpha: 1,
        duration: 180,
        delay: (index - start) * 45,
        ease: 'Cubic.Out',
      });
    }
    if (pending.signal.lockReached) {
      this.time.delayedCall(190, () => {
        if (this.isSceneShutdown()) return;
        this.tweens.add({
          targets: this.signalHudSegments,
          alpha: 0.62,
          duration: 105,
          yoyo: true,
          repeat: 1,
          ease: 'Sine.InOut',
        });
      });
    }
  }

''',
)

replace_between(
    path,
    "  private startResultPanelPulse(): void {",
    "  private startRewardBreathing(",
    '''  private startResultPanelPulse(): void {
    if (!this.resultActionPanel || !this.resultReady || this.phase !== 'result') return;
    const glow = this.resultActionPanel.getData('readyGlow') as Phaser.GameObjects.Graphics | undefined;
    if (!glow) return;
    this.tweens.killTweensOf(glow);
    glow.setAlpha(MOTION_PRESENTATION.resultReadyGlowMinAlpha);
    this.tweens.add({
      targets: glow,
      alpha: MOTION_PRESENTATION.resultReadyGlowMaxAlpha,
      duration: MOTION_PRESENTATION.resultReadyGlowDuration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private stopResultPanelPulse(): void {
    if (!this.resultActionPanel) return;
    const glow = this.resultActionPanel.getData('readyGlow') as Phaser.GameObjects.Graphics | undefined;
    if (glow) {
      this.tweens.killTweensOf(glow);
      glow.setAlpha(MOTION_PRESENTATION.resultReadyGlowMinAlpha);
    }
    this.tweens.killTweensOf(this.resultActionPanel);
    this.resultActionPanel.setY(RESULT_PRESENTATION.panelY);
  }

''',
)

replace_once(
    path,
    "    this.renderPouchSelector(root);\n    this.startStarPulse();",
    "    this.renderPouchSelector(root);\n    if (this.chargedReadyPulsePending) {\n      this.chargedReadyPulsePending = false;\n      this.showChargedReadyOnSelector();\n    }\n    this.startStarPulse();",
)

replace_between(
    path,
    "  private renderChipsHud(",
    "  private setChipsHudValue(",
    '''  private renderChipsHud(root: Phaser.GameObjects.Container, chips: number): void {
    if (!this.metrics) return;
    const messages = getMessages(getPlatformRuntime().language);
    const x = this.metrics.safeLeft;
    const y = this.metrics.safeTop + OPENING_FEEL_PRESENTATION.railTopOffset;
    const width = OPENING_FEEL_PRESENTATION.chipsHudWidth;
    const height = OPENING_FEEL_PRESENTATION.chipsHudHeight;
    const container = this.add.container(x, y);
    const background = this.add.graphics();
    background.fillStyle(0x17101f, 0.9);
    background.fillRoundedRect(0, 0, width, height, 18);
    background.lineStyle(2, 0x8df8ff, 0.38);
    background.strokeRoundedRect(0, 0, width, height, 18);
    const glow = this.add.graphics().setAlpha(0.14);
    glow.lineStyle(5, 0x8df8ff, 0.16);
    glow.strokeRoundedRect(2, 2, width - 4, height - 4, 16);
    container.add([background, glow]);
    const shimmer = this.addHudShimmer(container, width, height, 0);
    container.setData('glow', glow);
    container.setData('shimmer', shimmer);

    const token = createChipToken(this, 24, 37, 0.86);
    const label = this.add
      .text(49, 10, messages.opening.chips, {
        color: '#bffaff',
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: '9px',
      })
      .setOrigin(0, 0);
    const valueText = this.add
      .text(48, 40, `${Math.max(0, Math.floor(chips))}`, {
        color: '#f4feff',
        stroke: '#11333b',
        strokeThickness: 2,
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: '19px',
      })
      .setOrigin(0, 0.5);
    container.add([token, label, valueText]);
    root.add(container);
    this.chipsHudContainer = container;
    this.chipsHudText = valueText;
    this.chipsHudValue = Math.max(0, Math.floor(chips));
  }

''',
)

replace_between(
    path,
    "  private setChipsHudValue(",
    "  private renderSignalHud(",
    '''  private setChipsHudValue(value: number, pulse = false): void {
    if (!this.chipsHudText) return;
    this.chipsHudValue = Math.max(0, Math.floor(value));
    this.chipsHudText.setText(`${this.chipsHudValue}`);
    if (!pulse || !this.chipsHudContainer) return;
    this.tweens.killTweensOf(this.chipsHudContainer);
    this.chipsHudContainer.setScale(1);
    this.tweens.add({
      targets: this.chipsHudContainer,
      scale: 1.045,
      duration: 82,
      yoyo: true,
      ease: 'Sine.Out',
    });
    const glow = this.chipsHudContainer.getData('glow') as Phaser.GameObjects.Graphics | undefined;
    if (glow) {
      this.tweens.killTweensOf(glow);
      glow.setAlpha(0.16);
      this.tweens.add({ targets: glow, alpha: 0.58, duration: 90, yoyo: true, ease: 'Sine.Out' });
    }
  }

''',
)

replace_between(
    path,
    "  private renderSignalHud(",
    "  private renderPouchSelector(",
    '''  private renderSignalHud(root: Phaser.GameObjects.Container, state: SaveState): void {
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
    const waitingForCharged = isSignalWaitingForCharged(state, SLICE_REGISTRY, LITE_V2_BALANCE);
    const messages = getMessages(getPlatformRuntime().language);
    const labelText = waitingForCharged
      ? messages.opening.signalCharged
      : clamped >= threshold
        ? messages.opening.signalLock
        : 'SIGNAL';
    const x = this.metrics.safeLeft;
    const y = this.metrics.safeTop + OPENING_FEEL_PRESENTATION.railTopOffset + OPENING_FEEL_PRESENTATION.chipsHudHeight + 10;
    const width = OPENING_FEEL_PRESENTATION.signalHudWidth;
    const height = OPENING_FEEL_PRESENTATION.signalHudHeight;
    const container = this.add.container(x, y);
    const background = this.add.graphics();
    background.fillStyle(0x17101f, 0.84);
    background.fillRoundedRect(0, 0, width, height, 18);
    background.lineStyle(1.5, waitingForCharged ? 0x9d7cff : 0x76e9f5, 0.38);
    background.strokeRoundedRect(0, 0, width, height, 18);
    container.add(background);
    const shimmer = this.addHudShimmer(container, width, height, 360);
    container.setData('shimmer', shimmer);

    const label = this.add.text(14, 10, labelText, {
      color: waitingForCharged ? CHARGED_TEXT_COLOR : '#b9f7ff',
      stroke: '#160f20',
      strokeThickness: 2,
      fontFamily: DIGITAL_FONT_FAMILY,
      fontSize: waitingForCharged ? '8px' : '10px',
    });
    const value = this.add.text(width - 14, 10, `${clamped}/${threshold}`, {
      color: '#f7fdff',
      stroke: '#160f20',
      strokeThickness: 2,
      fontFamily: DIGITAL_FONT_FAMILY,
      fontSize: '10px',
    }).setOrigin(1, 0);
    container.add([label, value]);

    const segmentGap = 6;
    const segmentWidth = (width - 28 - segmentGap * (threshold - 1)) / threshold;
    for (let index = 0; index < threshold; index += 1) {
      const active = index < clamped;
      const segment = this.add
        .rectangle(
          14 + index * (segmentWidth + segmentGap),
          47,
          segmentWidth,
          9,
          active ? (waitingForCharged ? 0x9d7cff : 0x76e9f5) : 0x3a3146,
          active ? 0.98 : 0.72,
        )
        .setOrigin(0, 0.5)
        .setStrokeStyle(1, active ? 0xeefcff : 0x766b82, active ? 0.5 : 0.18);
      container.add(segment);
      this.signalHudSegments.push(segment);
    }

    root.add(container);
    this.signalHudContainer = container;
  }

''',
)

replace_once(
    path,
    "  private showUnavailableChargedFeedback(card: Phaser.GameObjects.Container): void {\n    if (!this.chipsHudContainer) return;",
    "  private showUnavailableChargedFeedback(card: Phaser.GameObjects.Container): void {\n    if (!this.chipsHudContainer) return;\n    getGameAudio().play('ui-denied');",
)

replace_between(
    path,
    "  private selectPouchType(",
    "  private renderChargedPouchAura(",
    '''  private selectPouchType(pouchType: PouchType, sourceCard?: Phaser.GameObjects.Container): void {
    if (this.phase !== 'idle' || !this.saveState || this.selectedPouchType === pouchType) return;
    if (!canAffordPouch(this.saveState, pouchType, LITE_V2_BALANCE)) return;
    this.selectedPouchType = pouchType;
    getGameAudio().play('pouch-select');
    if (sourceCard) {
      this.tweens.killTweensOf(sourceCard);
      this.tweens.add({
        targets: sourceCard,
        scale: 1.025,
        duration: OPENING_FEEL_PRESENTATION.uiPressMs,
        yoyo: true,
        ease: 'Sine.Out',
      });
    }
    if (this.pouch) {
      this.tweens.killTweensOf(this.pouch.group);
      this.tweens.add({
        targets: this.pouch.group,
        scale: 0.97,
        alpha: 0.78,
        duration: 90,
        ease: 'Sine.In',
      });
    }
    this.time.delayedCall(95, () => {
      if (this.phase === 'idle') this.renderIdle();
    });
  }

''',
)

replace_between(
    path,
    "  private createCollectionButton(",
    "  private createMuteButton(",
    '''  private createCollectionButton(root: Phaser.GameObjects.Container, enabled: boolean): void {
    if (!this.metrics) return;

    const button = this.add
      .text(this.metrics.safeRight, this.metrics.safeBottom - 8, getMessages(getPlatformRuntime().language).opening.collection, {
        color: '#f5eefc',
        backgroundColor: '#312746',
        padding: { x: 16, y: 10 },
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
      })
      .setOrigin(1, 1);

    if (enabled) {
      button.setInteractive({ useHandCursor: true });
      button.on('pointerup', () => {
        getGameAudio().play('ui-click');
        this.ignoreNextResultTap = true;
        this.scene.start('CollectionScene');
      });
    } else {
      button.setAlpha(0.32);
    }

    this.collectionButton = button;
    root.add(button);
  }

''',
)

replace_between(
    path,
    "  private createMuteButton(",
    "  private setChromeEnabled(",
    '''  private createMuteButton(root: Phaser.GameObjects.Container): void {
    if (!this.metrics) return;
    const audio = getGameAudio();
    const messages = getMessages(getPlatformRuntime().language);
    const button = this.add
      .text(this.metrics.safeRight, this.metrics.safeTop + 8, audio.isMuted() ? `🔇 ${messages.audio.unmute}` : `🔊 ${messages.audio.mute}`, {
        color: '#d9cfe4',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        backgroundColor: '#312746',
        padding: { x: 10, y: 7 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    button.on('pointerup', () => {
      this.ignoreNextResultTap = true;
      const wasMuted = audio.isMuted();
      if (!wasMuted) audio.play('ui-click');
      const muted = audio.toggleMuted();
      if (wasMuted && !muted) audio.play('ui-click');
      button.setText(muted ? `🔇 ${messages.audio.unmute}` : `🔊 ${messages.audio.mute}`);
      void persistMutedPreference(getPlatformRuntime().storage, muted).catch((error: unknown) => {
        console.warn('[settings] failed to persist mute preference', error);
      });
    });
    root.add(button);
  }

''',
)

replace_between(
    path,
    "  private handlePointerDown(",
    "  private handlePointerMove(",
    '''  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.phase === 'revealing' || this.phase === 'banking') {
      if (this.requestPresentationFastForward()) getGameAudio().play('ui-skip');
      return;
    }

    if (this.phase !== 'result') return;
    if (!this.resultReady && this.requestPresentationFastForward()) {
      getGameAudio().play('ui-skip');
      return;
    }
    if (this.resultCarouselDrag?.pointerId === pointer.id) return;
    this.resultCarouselDrag = {
      pointerId: pointer.id,
      startPointerX: pointer.x,
      startPointerY: pointer.y,
      deltaX: 0,
      deltaY: 0,
      startedInCarousel: false,
      readyAtStart: this.resultReady,
    };
  }

''',
)

replace_between(
    path,
    "  private async animateChipsPrelude(",
    "  private getRewardTrayAnchor(",
    '''  private async animateChipsPrelude(pending: PendingReveal): Promise<void> {
    if (!this.root || !this.metrics || pending.chips.cost <= 0) return;
    const afterSpend = pending.chips.before - pending.chips.cost;
    const width = OPENING_FEEL_PRESENTATION.chipsHudWidth;
    const height = OPENING_FEEL_PRESENTATION.chipsHudHeight;
    const debitX = this.metrics.safeLeft + width - 14;
    const debitY = this.metrics.safeTop + OPENING_FEEL_PRESENTATION.railTopOffset + height / 2;
    const debit = this.add
      .text(debitX + 7, debitY, `−${pending.chips.cost}`, {
        color: '#ff9ee0',
        stroke: '#160f20',
        strokeThickness: 2,
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: '10px',
      })
      .setOrigin(1, 0.5)
      .setAlpha(0);
    this.root.add(debit);
    this.tweens.add({
      targets: debit,
      x: debitX,
      alpha: 1,
      duration: OPENING_FEEL_PRESENTATION.uiFadeInMs,
      ease: 'Sine.Out',
    });

    const hudTarget = this.getChipsHudTarget();
    for (let index = 0; index < 4; index += 1) {
      const token = createFlyingChipToken(this, hudTarget.x + index * 7 - 10, hudTarget.y + (index % 2) * 5, 0.72);
      this.root.add(token);
      this.tweens.add({
        targets: token,
        x: this.metrics.centerX - 38 + index * 25,
        y: POUCH_Y - 54 + (index % 2) * 10,
        alpha: 0.18,
        scale: 0.42,
        angle: token.angle + (index % 2 === 0 ? 80 : -80),
        delay: index * 22,
        duration: 230,
        ease: 'Cubic.In',
        onComplete: () => token.destroy(),
      });
    }

    getGameAudio().play('charged-spend');
    const counter = { value: pending.chips.before };
    await this.runSkippableTween({
      targets: counter,
      value: afterSpend,
      duration: 250,
      ease: 'Cubic.Out',
      onUpdate: () => this.setChipsHudValue(Math.round(counter.value), false),
    });
    this.setChipsHudValue(afterSpend, true);
    if (debit.active) {
      this.tweens.add({
        targets: debit,
        y: debit.y - 5,
        alpha: 0,
        delay: 100,
        duration: OPENING_FEEL_PRESENTATION.uiFadeOutMs,
        ease: 'Sine.In',
        onComplete: () => debit.destroy(),
      });
    }
  }

''',
)

replace_between(
    path,
    "  private getRewardTrayAnchor(",
    "  private async animateRewardStaging(",
    '''  private getRewardBankOrigin(): { x: number; y: number } {
    if (this.rewardTrayContainer?.active) {
      const height = Number(this.rewardTrayContainer.getData('height') ?? 0);
      return { x: this.rewardTrayContainer.x, y: this.rewardTrayContainer.y + height / 2 };
    }
    return { x: this.metrics?.centerX ?? 450, y: 430 };
  }

  private renderRewardTray(
    pending: PendingReveal,
    root: Phaser.GameObjects.Container,
    animate = false,
  ): Phaser.GameObjects.Container {
    this.rewardTrayContainer?.destroy(true);
    const messages = getMessages(getPlatformRuntime().language);
    const cacheLabel = this.getCacheLabel(pending.chips.cacheTier);
    const rows: Array<{ kind: 'chips' | 'signal'; text: string; color: string }> = [
      { kind: 'chips', text: `+${pending.chips.base} ${messages.opening.chips}`, color: CHIPS_TEXT_COLOR },
    ];
    if (cacheLabel && pending.chips.cacheBonus > 0) {
      rows.push({
        kind: 'chips',
        text: `${cacheLabel} +${pending.chips.cacheBonus}`,
        color: pending.chips.cacheTier === 'mega' ? '#ffe59a' : pending.chips.cacheTier === 'big' ? CHARGED_TEXT_COLOR : CHIPS_TEXT_COLOR,
      });
    }
    if (pending.chips.recycle > 0) {
      rows.push({ kind: 'chips', text: `${messages.opening.recycled} +${pending.chips.recycle}`, color: '#aefcff' });
    }
    if (pending.signal.gain > 0) {
      rows.push({ kind: 'signal', text: `+${pending.signal.gain} SIGNAL`, color: '#b7a7ff' });
    }

    const width = OPENING_FEEL_PRESENTATION.rewardTrayWidth;
    const height = 30 + rows.length * 22;
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
    background.fillStyle(0x17101f, 0.88);
    background.fillRoundedRect(-width / 2, 0, width, height, 16);
    background.lineStyle(1.5, 0x8df8ff, 0.3);
    background.strokeRoundedRect(-width / 2, 0, width, height, 16);
    const header = this.add.text(-width / 2 + 13, 10, 'REWARD', {
      color: '#d9cbef',
      fontFamily: DIGITAL_FONT_FAMILY,
      fontSize: '7px',
    });
    tray.add([background, header]);
    rows.forEach((row, index) => {
      const iconY = 31 + index * 22;
      const icon = row.kind === 'chips'
        ? createChipToken(this, -width / 2 + 17, iconY, 0.42)
        : createSignalToken(this, -width / 2 + 17, iconY, false);
      const text = this.add.text(-width / 2 + 31, 26 + index * 22, row.text, {
        color: row.color,
        stroke: '#100b16',
        strokeThickness: 2,
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: getPlatformRuntime().language === 'ru' ? '7px' : '8px',
      });
      tray.add([icon, text]);
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

replace_once(path, "    const anchor = this.getRewardTrayAnchor();", "    const anchor = this.getRewardBankOrigin();")

replace_between(
    path,
    "  private async bankChipLeg(",
    "  private async bankSignalGain(",
    '''  private async bankChipLeg(
    targetValue: number,
    emphasis: number,
    chargedReadyOnArrival: boolean,
  ): Promise<void> {
    if (!this.root || !this.metrics || targetValue <= this.chipsHudValue) return;
    const startValue = this.chipsHudValue;
    const amount = Math.max(0, targetValue - startValue);
    const plan = createChipFlightPlan(
      amount,
      OPENING_FEEL_PRESENTATION.bankLegMinDuration,
      OPENING_FEEL_PRESENTATION.bankLegMaxDuration,
    );
    const origin = this.getRewardBankOrigin();
    const target = this.getChipsHudTarget();
    const tweens: Phaser.Tweens.Tween[] = [];

    await new Promise<void>((resolve) => {
      let arrived = 0;
      let settled = false;
      let fastForwarding = false;
      let clearSkip = (): void => undefined;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        clearSkip();
        this.setChipsHudValue(targetValue, true);
        if (chargedReadyOnArrival) this.chargedReadyPulsePending = true;
        resolve();
      };

      for (let index = 0; index < plan.amount; index += 1) {
        const lane = index % 5;
        const token = createFlyingChipToken(
          this,
          origin.x - 54 + lane * 27,
          origin.y + ((index % 3) - 1) * 7,
          0.72 + (index % 2) * 0.08,
        );
        this.root!.add(token);
        const targetX = target.x + ((index % 3) - 1) * 3;
        const targetY = target.y + ((index % 4) - 1.5) * 2;
        const tween = this.tweens.add({
          targets: token,
          x: targetX,
          y: targetY,
          scale: 0.38,
          angle: token.angle + (index % 2 === 0 ? 105 : -105),
          delay: chipEmissionDelay(plan, index),
          duration: plan.flightDuration,
          ease: 'Cubic.In',
          onComplete: () => {
            if (token.active) token.destroy();
            arrived += 1;
            this.setChipsHudValue(startValue + arrived, false);
            if (!fastForwarding && shouldPlayChipClack(plan, index)) getGameAudio().play('chip-clack');
            if (arrived >= plan.amount) finish();
          },
        });
        tweens.push(tween);
      }

      if (plan.amount === 0) {
        finish();
        return;
      }
      clearSkip = this.presentationSkip.register(() => {
        fastForwarding = true;
        for (const tween of tweens) {
          if (!tween.isFinished()) this.completeTweenToEnd(tween);
        }
        finish();
      });
    });
  }

''',
)

replace_between(
    path,
    "  private async bankSignalGain(",
    "  private async animateRewardBanking(",
    '''  private async bankSignalGain(pending: PendingReveal): Promise<void> {
    if (!this.root || !this.metrics || !this.saveState || pending.signal.gain <= 0) return;
    const origin = this.getRewardBankOrigin();
    const signalTarget = {
      x: this.metrics.safeLeft + OPENING_FEEL_PRESENTATION.signalHudWidth / 2,
      y:
        this.metrics.safeTop +
        OPENING_FEEL_PRESENTATION.railTopOffset +
        OPENING_FEEL_PRESENTATION.chipsHudHeight +
        10 +
        OPENING_FEEL_PRESENTATION.signalHudHeight / 2,
    };
    const spark = this.add
      .circle(origin.x + 60, origin.y + 10, 8, 0x76e9f5, 0.94)
      .setStrokeStyle(2, 0xffffff, 0.58);
    this.root.add(spark);
    await this.runSkippableTween(
      {
        targets: spark,
        x: signalTarget.x,
        y: signalTarget.y,
        scale: 0.38,
        alpha: 0.22,
        duration: 280,
        ease: 'Cubic.In',
      },
      () => spark.destroy(),
    );
    if (!this.root || this.isSceneShutdown()) return;
    this.renderSignalHud(this.root, this.saveState);
    this.animateSignalArrival(pending);
    if (this.signalHudContainer) {
      this.tweens.killTweensOf(this.signalHudContainer);
      this.tweens.add({
        targets: this.signalHudContainer,
        scale: pending.signal.lockReached ? 1.045 : 1.025,
        duration: 90,
        yoyo: true,
        ease: 'Sine.Out',
      });
    }
    getGameAudio().play(pending.signal.lockReached ? 'signal-lock' : 'signal-gain');
  }

''',
)

replace_between(
    path,
    "  private async animateRewardBanking(",
    "  private async animatePostStandardEconomy(",
    '''  private async animateRewardBanking(pending: PendingReveal): Promise<void> {
    if (!this.saveState || !this.root || this.isSceneShutdown()) return;
    this.phase = 'banking';
    this.resultReady = false;
    this.stopResultPanelPulse();
    if (this.resultActionPanel?.active) {
      this.tweens.add({
        targets: this.resultActionPanel,
        alpha: 0.42,
        duration: 150,
        ease: 'Sine.Out',
      });
    }

    let nextValue = pending.chips.before - pending.chips.cost;
    const chargedCost = getChargedCost(LITE_V2_BALANCE);
    let readyShown = false;
    const bankLeg = async (amount: number, emphasis: number): Promise<void> => {
      if (amount <= 0) return;
      const target = nextValue + amount;
      const crossesReady =
        !readyShown &&
        crossedChargedReadyThreshold(pending, LITE_V2_BALANCE) &&
        nextValue < chargedCost &&
        target >= chargedCost;
      await this.bankChipLeg(target, emphasis, crossesReady);
      readyShown ||= crossesReady;
      nextValue = target;
    };

    await bankLeg(pending.chips.base, 1);
    if (this.isSceneShutdown()) return;
    await bankLeg(
      pending.chips.cacheBonus,
      pending.chips.cacheTier === 'mega' ? 1.25 : pending.chips.cacheTier === 'big' ? 1.14 : 1.06,
    );
    if (this.isSceneShutdown()) return;
    await bankLeg(pending.chips.recycle, 1.08);
    if (this.isSceneShutdown()) return;
    await this.bankSignalGain(pending);
    if (this.isSceneShutdown()) return;

    this.setChipsHudValue(pending.chips.after, false);
    this.renderSignalHud(this.root, this.saveState);
    const fadeTargets: Phaser.GameObjects.GameObject[] = [];
    if (this.rewardTrayContainer?.active) fadeTargets.push(this.rewardTrayContainer);
    if (this.resultActionPanel?.active) fadeTargets.push(this.resultActionPanel);
    if (fadeTargets.length > 0) {
      this.tweens.add({
        targets: fadeTargets,
        alpha: 0,
        y: '-=5',
        duration: OPENING_FEEL_PRESENTATION.uiFadeOutMs,
        ease: 'Sine.In',
      });
    }
    await this.waitPresentation(OPENING_FEEL_PRESENTATION.uiFadeOutMs);
    if (!this.isSceneShutdown()) this.renderIdle();
  }

''',
)

replace_between(
    path,
    "  private showChargedReadyBeat(): void {",
    "  private showRarityAccentSweep(",
    '''  private showChargedReadyOnSelector(): void {
    const card = this.pouchSelectorButtons.find((button) => button.getData('pouchType') === 'charged');
    if (!card) return;
    const width = OPENING_FEEL_PRESENTATION.railCardWidth;
    const height = OPENING_FEEL_PRESENTATION.railCardHeight;
    const outline = this.add.graphics().setAlpha(0);
    outline.lineStyle(3, CHARGED_ACCENT, 0.88);
    outline.strokeRoundedRect(1, 1, width - 2, height - 2, 15);
    const ready = this.add
      .text(width - 12, 10, 'READY', {
        color: '#8df8ff',
        stroke: '#160f20',
        strokeThickness: 2,
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: '7px',
      })
      .setOrigin(1, 0)
      .setAlpha(0);
    card.add([outline, ready]);
    this.tweens.add({
      targets: [outline, ready],
      alpha: 1,
      duration: 170,
      ease: 'Sine.Out',
      onComplete: () => {
        this.tweens.add({
          targets: [outline, ready],
          alpha: 0,
          delay: 430,
          duration: 190,
          ease: 'Sine.In',
          onComplete: () => {
            outline.destroy();
            ready.destroy();
          },
        });
      },
    });
  }

''',
)

replace_between(
    path,
    "  private getResultPanelCopy(",
    "  private continueFromResult(",
    '''  private getResultPanelCopy(pending: PendingReveal): {
    title: string;
    rarity: string;
    rarityColor: string;
    status: string;
    statusColor: string;
  } {
    const language = getPlatformRuntime().language;
    const messages = getMessages(language);
    if (pending.hiddenPocket && this.resultCarouselIndex === 1) {
      const family = SLICE_REGISTRY.familyById.get(pending.hiddenPocket.familyId);
      return {
        title: family?.name[language] ?? pending.hiddenPocket.familyId,
        rarity: messages.rarity.secret,
        rarityColor: '#8df8ff',
        status: messages.opening.secretDiscovered,
        statusColor: '#f5f0ff',
      };
    }

    const family = SLICE_REGISTRY.familyById.get(pending.standard.familyId);
    return {
      title: `${pending.pouchType === 'charged' ? '⚡ ' : ''}${family?.name[language] ?? pending.standard.familyId}`,
      rarity: messages.rarity[pending.standard.rarity],
      rarityColor: `#${RARITY_REVEAL_COLORS[pending.standard.rarity].toString(16).padStart(6, '0')}`,
      status: this.getStandardResultStatus(pending),
      statusColor: pending.standard.isNew ? '#f7f2ff' : '#c7f8ff',
    };
  }

  private positionResultHeading(
    title: Phaser.GameObjects.Text,
    rarity: Phaser.GameObjects.Text,
  ): void {
    const gap = 12;
    const totalWidth = title.width + gap + rarity.width;
    const startX = -totalWidth / 2;
    title.setOrigin(0, 0.5).setPosition(startX, -32);
    rarity.setOrigin(0, 0.5).setPosition(startX + title.width + gap, -32);
  }

  private renderResultActionPanel(pending: PendingReveal): void {
    if (!this.root || !this.metrics || this.phase !== 'result') return;
    const messages = getMessages(getPlatformRuntime().language);
    const copy = this.getResultPanelCopy(pending);
    const readyHint = pending.hiddenPocket
      ? `↔ ${messages.opening.swipeItems} · ${messages.opening.tapCollect}`
      : messages.opening.tapCollect;
    const hintText = this.resultReady ? readyHint : messages.opening.tapToSpeedUp;

    if (this.resultActionPanel?.active) {
      const panel = this.resultActionPanel;
      const title = panel.getData('title') as Phaser.GameObjects.Text | undefined;
      const rarity = panel.getData('rarity') as Phaser.GameObjects.Text | undefined;
      const status = panel.getData('status') as Phaser.GameObjects.Text | undefined;
      const hint = panel.getData('hint') as Phaser.GameObjects.Text | undefined;
      if (title && rarity && status && hint) {
        title.setText(copy.title);
        rarity.setText(`◆ ${copy.rarity.toUpperCase()}`).setColor(copy.rarityColor);
        status.setText(copy.status).setColor(copy.statusColor);
        this.positionResultHeading(title, rarity);
        if (hint.text !== hintText) {
          this.tweens.killTweensOf(hint);
          this.tweens.add({
            targets: hint,
            alpha: 0,
            duration: 90,
            ease: 'Sine.In',
            onComplete: () => {
              if (!hint.active) return;
              hint.setText(hintText);
              hint.setColor(this.resultReady ? '#ffffff' : '#bfb3ca');
              hint.setFontStyle(this.resultReady ? 'bold' : 'normal');
              this.tweens.add({ targets: hint, alpha: 1, duration: 140, ease: 'Sine.Out' });
            },
          });
        }
      }
      if (this.resultReady) this.startResultPanelPulse();
      else this.stopResultPanelPulse();
      return;
    }

    const panelWidth = Math.max(
      RESULT_PRESENTATION.panelMinWidth,
      Math.min(RESULT_PRESENTATION.panelMaxWidth, this.metrics.logicalWidth - 120),
    );
    const panel = this.add.container(this.metrics.centerX, RESULT_PRESENTATION.panelY + 7).setAlpha(0);
    const background = this.add.graphics();
    background.fillStyle(0x21172e, 0.84);
    background.fillRoundedRect(
      -panelWidth / 2,
      -RESULT_PRESENTATION.panelHeight / 2,
      panelWidth,
      RESULT_PRESENTATION.panelHeight,
      22,
    );
    background.lineStyle(1.5, 0xf0ddff, 0.24);
    background.strokeRoundedRect(
      -panelWidth / 2,
      -RESULT_PRESENTATION.panelHeight / 2,
      panelWidth,
      RESULT_PRESENTATION.panelHeight,
      22,
    );
    const readyGlow = this.add.graphics().setAlpha(MOTION_PRESENTATION.resultReadyGlowMinAlpha);
    readyGlow.lineStyle(3, 0x8df8ff, 0.72);
    readyGlow.strokeRoundedRect(
      -panelWidth / 2 + 2,
      -RESULT_PRESENTATION.panelHeight / 2 + 2,
      panelWidth - 4,
      RESULT_PRESENTATION.panelHeight - 4,
      20,
    );
    const title = this.add.text(0, -32, copy.title, {
      color: '#f7f2ff',
      stroke: '#160f20',
      strokeThickness: 3,
      fontFamily: 'system-ui, sans-serif',
      fontSize: '21px',
      fontStyle: 'bold',
    });
    const rarity = this.add.text(0, -32, `◆ ${copy.rarity.toUpperCase()}`, {
      color: copy.rarityColor,
      stroke: '#160f20',
      strokeThickness: 2,
      fontFamily: DIGITAL_FONT_FAMILY,
      fontSize: '8px',
    });
    this.positionResultHeading(title, rarity);
    const status = this.add.text(0, 0, copy.status, {
      color: copy.statusColor,
      stroke: '#160f20',
      strokeThickness: 2,
      fontFamily: DIGITAL_FONT_FAMILY,
      fontSize: '10px',
    }).setOrigin(0.5);
    const hint = this.add.text(0, 35, hintText, {
      color: this.resultReady ? '#ffffff' : '#bfb3ca',
      fontFamily: 'system-ui, sans-serif',
      fontSize: pending.hiddenPocket ? '13px' : '15px',
      fontStyle: this.resultReady ? 'bold' : 'normal',
    }).setOrigin(0.5);
    const actionZone = this.add
      .zone(0, 0, panelWidth, RESULT_PRESENTATION.panelHeight)
      .setInteractive({ useHandCursor: true });
    actionZone.on('pointerover', () => {
      if (this.phase !== 'result' || !this.resultReady) return;
      this.tweens.killTweensOf(panel);
      this.tweens.add({ targets: panel, y: RESULT_PRESENTATION.panelY - 1, duration: 95, ease: 'Sine.Out' });
    });
    actionZone.on('pointerout', () => {
      if (!panel.active) return;
      this.tweens.killTweensOf(panel);
      this.tweens.add({ targets: panel, y: RESULT_PRESENTATION.panelY, duration: 110, ease: 'Sine.Out' });
      if (this.resultReady) this.startResultPanelPulse();
    });
    actionZone.on('pointerdown', () => {
      if (this.phase !== 'result' || !this.resultReady) return;
      this.tweens.killTweensOf(panel);
      this.tweens.add({
        targets: panel,
        y: RESULT_PRESENTATION.panelY + 2,
        duration: OPENING_FEEL_PRESENTATION.uiPressMs,
        yoyo: true,
        ease: 'Sine.Out',
      });
      this.continueFromResult();
    });

    panel.add([background, readyGlow, title, rarity, status, hint, actionZone]);
    panel.setData('readyGlow', readyGlow);
    panel.setData('title', title);
    panel.setData('rarity', rarity);
    panel.setData('status', status);
    panel.setData('hint', hint);
    this.root.add(panel);
    this.resultActionPanel = panel;
    this.tweens.add({
      targets: panel,
      y: RESULT_PRESENTATION.panelY,
      alpha: 1,
      duration: OPENING_FEEL_PRESENTATION.uiFadeInMs,
      ease: 'Sine.Out',
    });
    if (this.resultReady) this.startResultPanelPulse();
  }

''',
)

replace_once(
    path,
    "  private continueFromResult(): void {\n    if (this.phase !== 'result' || !this.resultReady || !this.lastReveal) return;",
    "  private continueFromResult(): void {\n    if (this.phase !== 'result' || !this.resultReady || !this.lastReveal) return;\n    getGameAudio().play('ui-click');",
)
replace_once(path, "    this.renderRewardTray(pending, root, false);", "    this.renderRewardTray(pending, root, true);")
