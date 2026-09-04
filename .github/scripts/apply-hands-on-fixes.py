from __future__ import annotations

from pathlib import Path
import re


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f"missing replacement anchor: {label}")
    return text.replace(old, new, 1)


def replace_regex(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f"regex replacement failed ({count}): {label}")
    return updated


# 1) Pouch interaction alignment + phone visual pivot.
p = Path('src/game/ui/openingVisuals.ts')
s = p.read_text()
s = replace_once(
    s,
    "const POUCH_TAB_LOCAL_X = -114;\nconst POUCH_TAB_LOCAL_Y = -99;\nconst POUCH_TAB_HIT_SIZE = 152;",
    "const POUCH_TAB_LOCAL_X = -126;\nconst POUCH_TAB_LOCAL_Y = -126;\nconst POUCH_TAB_HIT_SIZE = 140;",
    'pouch tab geometry',
)
s = replace_once(
    s,
    """  const targetWidth = familyId === 'flip-phone' ? 300 : 246;\n  const image = scene.add.image(0, 0, textureKey).setOrigin(0.5);\n  image.setScale(targetWidth / Math.max(1, image.width));\n  const visualBottom = image.displayHeight / 2;\n  const shadowWidth = familyId === 'flip-phone' ? 170 : 220;\n  const shadow = scene.add.ellipse(0, visualBottom - 8, shadowWidth, 28, 0x050408, 0.2);""",
    """  const targetWidth = familyId === 'flip-phone' ? 300 : 246;\n  // The phone art includes a long charm on the left, so centering the full 1024 canvas\n  // makes the phone body read too far right. Offset the rendered art around the body pivot.\n  const artOffsetX = familyId === 'flip-phone' ? -24 : 0;\n  const image = scene.add.image(artOffsetX, 0, textureKey).setOrigin(0.5);\n  image.setScale(targetWidth / Math.max(1, image.width));\n  const visualBottom = image.displayHeight / 2;\n  const shadowWidth = familyId === 'flip-phone' ? 170 : 220;\n  const shadow = scene.add.ellipse(artOffsetX, visualBottom - 8, shadowWidth, 28, 0x050408, 0.2);""",
    'phone art pivot',
)
p.write_text(s)


# 2) Give decoded SFX a short tail fade so encoded endings never sound hard-clipped.
p = Path('src/game/systems/audio.ts')
s = p.read_text()
s = replace_once(
    s,
    """    if (sample) {\n      const source = context.createBufferSource();\n      const gain = context.createGain();\n      source.buffer = sample;\n      gain.gain.value = 0.9;\n      source.connect(gain);\n      gain.connect(context.destination);\n      source.start();\n      return;\n    }""",
    """    if (sample) {\n      const source = context.createBufferSource();\n      const gain = context.createGain();\n      const start = context.currentTime;\n      const tail = Math.min(0.12, Math.max(0.05, sample.duration * 0.1));\n      const fadeStart = start + Math.max(0, sample.duration - tail);\n      source.buffer = sample;\n      gain.gain.setValueAtTime(0.72, start);\n      gain.gain.setValueAtTime(0.72, fadeStart);\n      gain.gain.exponentialRampToValueAtTime(0.0001, start + sample.duration);\n      source.connect(gain);\n      gain.connect(context.destination);\n      source.start(start);\n      return;\n    }""",
    'sample tail fade',
)
p.write_text(s)


# 3) Make Collection -> Opening transition deterministic after the input dispatch finishes.
p = Path('src/game/scenes/CollectionScene.ts')
s = p.read_text()
s = replace_once(
    s,
    """    back.on('pointerup', () => {\n      getPlatformRuntime().analytics.track('collection_return', {\n        view: this.view,\n        standardCount: this.snapshot?.standardCount ?? 0,\n      });\n      this.scene.start('OpeningScene');\n    });""",
    """    back.on('pointerdown', () => {\n      back.disableInteractive().setAlpha(0.65);\n      getPlatformRuntime().analytics.track('collection_return', {\n        view: this.view,\n        standardCount: this.snapshot?.standardCount ?? 0,\n      });\n      // Defer scene replacement until the current pointer dispatch has completed.\n      this.time.delayedCall(0, () => this.scene.start('OpeningScene'));\n    });""",
    'collection open more transition',
)
p.write_text(s)


# 4) Result navigation, text rendering, Hidden Pocket centered carousel, and staggered audio.
p = Path('src/game/scenes/OpeningScene.ts')
s = p.read_text()

s = replace_once(
    s,
    """interface DragState {\n  pointerId: number;\n  startPointerX: number;\n  progress: number;\n}\n""",
    """interface DragState {\n  pointerId: number;\n  startPointerX: number;\n  progress: number;\n}\n\ninterface ResultCarouselDrag {\n  pointerId: number;\n  startPointerX: number;\n  deltaX: number;\n}\n""",
    'carousel drag interface',
)

s = replace_once(
    s,
    """  private standardResultLabels: Phaser.GameObjects.Text[] = [];\n  private standardResultScrim: Phaser.GameObjects.Graphics | null = null;\n""",
    """  private standardResultLabels: Phaser.GameObjects.Text[] = [];\n  private standardResultScrim: Phaser.GameObjects.Graphics | null = null;\n  private resultCarouselItems: Phaser.GameObjects.Container[] = [];\n  private resultCarouselDots: Phaser.GameObjects.Arc[] = [];\n  private resultCarouselIndex = 0;\n  private resultCarouselDrag: ResultCarouselDrag | null = null;\n  private resultCarouselZone: Phaser.GameObjects.Zone | null = null;\n""",
    'carousel fields',
)

s = replace_once(
    s,
    """    this.standardResultLabels = [];\n    this.standardResultScrim = null;\n    const metrics = createLayoutMetrics""",
    """    this.standardResultLabels = [];\n    this.standardResultScrim = null;\n    this.resultCarouselItems = [];\n    this.resultCarouselDots = [];\n    this.resultCarouselIndex = 0;\n    this.resultCarouselDrag = null;\n    this.resultCarouselZone = null;\n    const metrics = createLayoutMetrics""",
    'carousel reset',
)

s = replace_regex(
    s,
    r"  private handlePointerMove\(pointer: Phaser\.Input\.Pointer\): void \{.*?\n  \}\n\n  private handlePointerUp",
    """  private handlePointerMove(pointer: Phaser.Input.Pointer): void {\n    if (this.phase === 'result' && this.resultCarouselDrag && this.metrics) {\n      if (pointer.id !== this.resultCarouselDrag.pointerId) return;\n      const delta = (pointer.x - this.resultCarouselDrag.startPointerX) / this.metrics.scale;\n      this.resultCarouselDrag.deltaX = Phaser.Math.Clamp(delta, -220, 220);\n      this.positionResultCarousel(this.resultCarouselDrag.deltaX, false);\n      return;\n    }\n\n    if (this.phase !== 'dragging' || !this.drag || !this.pouch || !this.metrics) return;\n    if (pointer.id !== this.drag.pointerId) return;\n\n    const logicalDelta = Math.max(0, (pointer.x - this.drag.startPointerX) / this.metrics.scale);\n    const travel = this.pouch.tabEndX - this.pouch.tabStartX;\n    const progress = Math.min(1, logicalDelta / DRAG_THRESHOLD);\n    this.drag.progress = progress;\n    const tabX = this.pouch.tabStartX + travel * progress;\n    this.pouch.tab.setX(tabX);\n    this.pouch.strip.setAlpha(1 - progress * 0.08);\n\n    if (progress >= 1) {\n      const firstInteraction = this.saveState?.totalOpens === 0 && !this.firstInteractionTracked;\n      void this.completeTear(firstInteraction);\n    }\n  }\n\n  private handlePointerUp""",
    'pointer move',
)

s = replace_regex(
    s,
    r"  private handlePointerUp\(pointer: Phaser\.Input\.Pointer\): void \{.*?\n  \}\n\n  private async completeTear",
    """  private handlePointerUp(pointer: Phaser.Input.Pointer): void {\n    if (this.ignoreNextResultTap) {\n      this.ignoreNextResultTap = false;\n      return;\n    }\n\n    if (this.phase === 'result') {\n      if (this.resultCarouselDrag && this.metrics && pointer.id === this.resultCarouselDrag.pointerId) {\n        const delta = this.resultCarouselDrag.deltaX;\n        this.resultCarouselDrag = null;\n        if (Math.abs(delta) >= 72) {\n          const direction = delta < 0 ? 1 : -1;\n          this.resultCarouselIndex = Phaser.Math.Clamp(\n            this.resultCarouselIndex + direction,\n            0,\n            Math.max(0, this.resultCarouselItems.length - 1),\n          );\n        }\n        this.positionResultCarousel(0, true);\n      }\n      return;\n    }\n\n    if (this.phase !== 'dragging' || !this.drag || !this.pouch) return;\n    if (pointer.id !== this.drag.pointerId) return;\n\n    if (this.drag.progress >= 1) return;\n\n    this.drag = null;\n    this.phase = 'idle';\n    this.setChromeEnabled(true);\n    const pouch = this.pouch;\n    this.tweens.add({\n      targets: pouch.tab,\n      x: pouch.tabStartX,\n      duration: 170,\n      ease: 'Sine.Out',\n    });\n    this.tweens.add({\n      targets: pouch.strip,\n      alpha: 1,\n      duration: 140,\n      ease: 'Sine.Out',\n    });\n  }\n\n  private async completeTear""",
    'pointer up',
)

s = replace_once(
    s,
    """    getGameAudio().play(pending.standard.rarity);\n    if (!pending.standard.isNew) getGameAudio().play('duplicate');\n    if (pending.signal.gain > 0) getGameAudio().play('signal-gain');\n    if (pending.signal.lockReached || pending.signal.lockConsumed) getGameAudio().play('signal-lock');""",
    """    getGameAudio().play(pending.standard.rarity);\n    if (!pending.standard.isNew) {\n      this.time.delayedCall(90, () => getGameAudio().play('duplicate'));\n    }\n    if (pending.signal.gain > 0) {\n      this.time.delayedCall(170, () => getGameAudio().play('signal-gain'));\n    }\n    if (pending.signal.lockReached || pending.signal.lockConsumed) {\n      this.time.delayedCall(250, () => getGameAudio().play('signal-lock'));\n    }""",
    'stagger result audio',
)

result_block = r"""  private getStandardResultStatus(pending: PendingReveal): string {
    const messages = getMessages(getPlatformRuntime().language);
    let status = pending.standard.isNew ? messages.opening.newItem : messages.opening.duplicate;
    if (pending.signal.lockConsumed) {
      status += ` · ${messages.opening.signalLock}`;
    } else if (pending.signal.gain > 0) {
      status += ` · +${pending.signal.gain} SIGNAL`;
    }
    if (pending.signal.lockReached) {
      status += ` · ${messages.opening.locked}`;
    }
    return status;
  }

  private addStandardResultLabels(pending: PendingReveal, x: number, y: number): void {
    const root = this.root!;
    const family = SLICE_REGISTRY.familyById.get(pending.standard.familyId);
    const familyName = family?.name[getPlatformRuntime().language] ?? pending.standard.familyId;
    const rarity = getMessages(getPlatformRuntime().language).rarity[pending.standard.rarity];
    const color = `#${RARITY_REVEAL_COLORS[pending.standard.rarity].toString(16).padStart(6, '0')}`;

    for (const label of this.standardResultLabels) label.destroy();
    this.standardResultScrim?.destroy();

    const title = this.add.text(x, y, `${familyName} · ${rarity}`, {
      color,
      stroke: '#160f20',
      strokeThickness: 3,
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const statusText = this.add.text(x, y + 34, this.getStandardResultStatus(pending), {
      color: pending.standard.isNew ? '#f7f2ff' : '#c7f8ff',
      stroke: '#160f20',
      strokeThickness: 2,
      fontFamily: 'monospace',
      fontSize: '16px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const scrimWidth = Math.max(title.width, statusText.width) + 36;
    const scrim = this.add.graphics();
    scrim.fillStyle(0x21172e, 0.68);
    scrim.fillRoundedRect(x - scrimWidth / 2, y - 18, scrimWidth, 78, 18);
    scrim.lineStyle(1, 0xf0ddff, 0.18);
    scrim.strokeRoundedRect(x - scrimWidth / 2, y - 18, scrimWidth, 78, 18);

    this.standardResultScrim = scrim;
    this.standardResultLabels = [title, statusText];
    root.add([scrim, ...this.standardResultLabels]);
  }

  private async animateHiddenPocket(
    pending: PendingReveal,
    standardVisual: Phaser.GameObjects.Container,
  ): Promise<void> {
    if (!pending.hiddenPocket || !this.root || !this.metrics || !this.pouch) return;

    const root = this.root;
    const metrics = this.metrics;
    const pouch = this.pouch;
    const carouselSpacing = Math.min(420, Math.max(340, metrics.logicalWidth * 0.38));
    await this.wait(320);
    getGameAudio().play('hidden-pocket');

    for (const label of this.standardResultLabels) label.destroy();
    this.standardResultLabels = [];
    this.standardResultScrim?.destroy();
    this.standardResultScrim = null;

    const hiddenLabel = this.add.text(
      metrics.centerX,
      126,
      getMessages(getPlatformRuntime().language).opening.hiddenPocket,
      {
        color: '#8df8ff',
        stroke: '#160f20',
        strokeThickness: 3,
        fontFamily: 'monospace',
        fontSize: '22px',
        fontStyle: 'bold',
      },
    ).setOrigin(0.5).setAlpha(0);
    root.add(hiddenLabel);

    this.tweens.add({
      targets: standardVisual,
      x: metrics.centerX - carouselSpacing,
      y: 318,
      scale: 0.72,
      alpha: 0.34,
      duration: 260,
      ease: 'Cubic.Out',
    });

    pouch.group.setPosition(metrics.centerX, POUCH_Y + 92).setScale(0.9).setAlpha(0.8);
    pouch.strip.setAlpha(0);

    await Promise.all([
      new Promise<void>((resolve) => {
        this.tweens.add({
          targets: pouch.group,
          y: POUCH_Y + 36,
          alpha: 1,
          duration: 210,
          ease: 'Back.Out',
          onComplete: () => resolve(),
        });
      }),
      new Promise<void>((resolve) => {
        this.tweens.add({
          targets: hiddenLabel,
          alpha: 1,
          duration: 160,
          onComplete: () => resolve(),
        });
      }),
    ]);

    await new Promise<void>((resolve) => {
      this.tweens.add({
        targets: pouch.group,
        angle: 3,
        duration: 55,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.InOut',
        onComplete: () => resolve(),
      });
    });

    const flash = this.add.circle(metrics.centerX, 322, 90, SECRET_REVEAL_COLOR, 0.22).setScale(0.3);
    root.add(flash);
    const ring = createRevealRing(this, root, metrics.centerX, 318, SECRET_REVEAL_COLOR)
      .setScale(0.5)
      .setAlpha(0.2);
    getGameAudio().play('secret-reveal');
    const secret = createCollectibleVisual(
      this,
      root,
      pending.hiddenPocket.familyId,
      'secret',
      metrics.centerX,
      POUCH_Y + 42,
      pending.hiddenPocket.collectibleId,
    );
    secret.group.setScale(0.26).setAlpha(0);
    this.spawnSparkles(metrics.centerX, 318, SECRET_REVEAL_COLOR, 11);

    this.tweens.add({
      targets: flash,
      scale: 3.3,
      alpha: 0,
      duration: 320,
      ease: 'Cubic.Out',
      onComplete: () => flash.destroy(),
    });
    this.tweens.add({
      targets: ring,
      scale: 1.55,
      alpha: 0,
      duration: 420,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    });

    await new Promise<void>((resolve) => {
      this.tweens.add({
        targets: secret.group,
        y: 314,
        scale: 1.06,
        alpha: 1,
        duration: 410,
        ease: 'Back.Out',
        onComplete: () => resolve(),
      });
    });

    this.tweens.add({
      targets: pouch.group,
      y: POUCH_Y + 108,
      alpha: 0,
      duration: 180,
      ease: 'Cubic.In',
    });
    await new Promise<void>((resolve) => {
      this.tweens.add({
        targets: secret.group,
        scale: 1,
        duration: 120,
        ease: 'Sine.Out',
        onComplete: () => resolve(),
      });
    });

    this.cameras.main.shake(105, 0.0024);
    const family = SLICE_REGISTRY.familyById.get(pending.hiddenPocket.familyId);
    const familyName = family?.name[getPlatformRuntime().language] ?? pending.hiddenPocket.familyId;
    root.add(
      this.add.text(
        metrics.centerX,
        490,
        `${familyName} · ${getMessages(getPlatformRuntime().language).rarity.secret}`,
        {
          color: '#8df8ff',
          stroke: '#160f20',
          strokeThickness: 3,
          fontFamily: 'system-ui, sans-serif',
          fontSize: '22px',
          fontStyle: 'bold',
        },
      ).setOrigin(0.5),
    );
    root.add(
      this.add.text(
        metrics.centerX,
        524,
        getMessages(getPlatformRuntime().language).opening.secretDiscovered,
        {
          color: '#f5f0ff',
          stroke: '#160f20',
          strokeThickness: 2,
          fontFamily: 'monospace',
          fontSize: '16px',
          fontStyle: 'bold',
        },
      ).setOrigin(0.5),
    );
  }

  private renderHiddenPocketCarousel(
    pending: PendingReveal,
    root: Phaser.GameObjects.Container,
    metrics: LayoutMetrics,
  ): void {
    if (!pending.hiddenPocket) return;
    const language = getPlatformRuntime().language;
    const messages = getMessages(language);

    root.add(
      this.add.text(metrics.centerX, 126, messages.opening.hiddenPocket, {
        color: '#8df8ff',
        stroke: '#160f20',
        strokeThickness: 3,
        fontFamily: 'monospace',
        fontSize: '22px',
        fontStyle: 'bold',
      }).setOrigin(0.5),
    );

    const standardPage = this.add.container(0, 0);
    root.add(standardPage);
    const standardVisual = createCollectibleVisual(
      this,
      standardPage,
      pending.standard.familyId,
      pending.standard.rarity,
      0,
      316,
      pending.standard.collectibleId,
    );
    standardVisual.group.setScale(1);
    const standardFamily = SLICE_REGISTRY.familyById.get(pending.standard.familyId);
    const standardTitle = this.add.text(
      0,
      492,
      `${standardFamily?.name[language] ?? pending.standard.familyId} · ${messages.rarity[pending.standard.rarity]}`,
      {
        color: `#${RARITY_REVEAL_COLORS[pending.standard.rarity].toString(16).padStart(6, '0')}`,
        stroke: '#160f20',
        strokeThickness: 3,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      },
    ).setOrigin(0.5);
    const standardStatus = this.add.text(0, 526, this.getStandardResultStatus(pending), {
      color: pending.standard.isNew ? '#f7f2ff' : '#c7f8ff',
      stroke: '#160f20',
      strokeThickness: 2,
      fontFamily: 'monospace',
      fontSize: '16px',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const standardScrim = this.add.graphics();
    const standardScrimWidth = Math.max(standardTitle.width, standardStatus.width) + 36;
    standardScrim.fillStyle(0x21172e, 0.68);
    standardScrim.fillRoundedRect(-standardScrimWidth / 2, 474, standardScrimWidth, 78, 18);
    standardScrim.lineStyle(1, 0xf0ddff, 0.18);
    standardScrim.strokeRoundedRect(-standardScrimWidth / 2, 474, standardScrimWidth, 78, 18);
    standardPage.add([standardScrim, standardTitle, standardStatus]);

    const secretPage = this.add.container(0, 0);
    root.add(secretPage);
    const secretVisual = createCollectibleVisual(
      this,
      secretPage,
      pending.hiddenPocket.familyId,
      'secret',
      0,
      316,
      pending.hiddenPocket.collectibleId,
    );
    secretVisual.group.setScale(1);
    const secretFamily = SLICE_REGISTRY.familyById.get(pending.hiddenPocket.familyId);
    const secretTitle = this.add.text(
      0,
      492,
      `${secretFamily?.name[language] ?? pending.hiddenPocket.familyId} · ${messages.rarity.secret}`,
      {
        color: '#8df8ff',
        stroke: '#160f20',
        strokeThickness: 3,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      },
    ).setOrigin(0.5);
    const secretStatus = this.add.text(0, 526, messages.opening.secretDiscovered, {
      color: '#f5f0ff',
      stroke: '#160f20',
      strokeThickness: 2,
      fontFamily: 'monospace',
      fontSize: '16px',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const secretScrim = this.add.graphics();
    const secretScrimWidth = Math.max(secretTitle.width, secretStatus.width) + 36;
    secretScrim.fillStyle(0x21172e, 0.68);
    secretScrim.fillRoundedRect(-secretScrimWidth / 2, 474, secretScrimWidth, 78, 18);
    secretScrim.lineStyle(1, 0x8df8ff, 0.22);
    secretScrim.strokeRoundedRect(-secretScrimWidth / 2, 474, secretScrimWidth, 78, 18);
    secretPage.add([secretScrim, secretTitle, secretStatus]);

    this.resultCarouselItems = [standardPage, secretPage];
    this.resultCarouselIndex = 1;
    this.resultCarouselDrag = null;

    this.resultCarouselDots = this.resultCarouselItems.map((_, index) => {
      const dot = this.add.circle(metrics.centerX + (index - 0.5) * 22, 574, 5, 0xece4f6, 0.35);
      root.add(dot);
      return dot;
    });

    const zoneWidth = Math.min(760, metrics.logicalWidth - 150);
    this.resultCarouselZone = this.add
      .zone(metrics.centerX, 350, zoneWidth, 420)
      .setInteractive({ useHandCursor: true });
    this.resultCarouselZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== 'result' || this.resultCarouselItems.length < 2) return;
      this.resultCarouselDrag = {
        pointerId: pointer.id,
        startPointerX: pointer.x,
        deltaX: 0,
      };
    });
    root.add(this.resultCarouselZone);
    this.positionResultCarousel(0, false);
  }

  private positionResultCarousel(dragOffset = 0, animate = false): void {
    if (!this.metrics || this.resultCarouselItems.length === 0) return;
    const spacing = Math.min(420, Math.max(340, this.metrics.logicalWidth * 0.38));
    this.resultCarouselItems.forEach((item, index) => {
      const targetX = this.metrics!.centerX + (index - this.resultCarouselIndex) * spacing + dragOffset;
      const alpha = index === this.resultCarouselIndex ? 1 : 0.34;
      if (animate) {
        this.tweens.add({
          targets: item,
          x: targetX,
          alpha,
          duration: 180,
          ease: 'Cubic.Out',
        });
      } else {
        item.setX(targetX).setAlpha(alpha);
      }
    });
    this.resultCarouselDots.forEach((dot, index) => {
      dot.setFillStyle(index === this.resultCarouselIndex ? 0x8df8ff : 0xece4f6, index === this.resultCarouselIndex ? 0.95 : 0.35);
    });
  }

"""

s = replace_regex(
    s,
    r"  private addStandardResultLabels\(pending: PendingReveal, x: number, y: number\): void \{.*?(?=  private spawnSparkles)",
    result_block,
    'result labels + hidden carousel block',
)

s = replace_regex(
    s,
    r"  private addResultPrompt\(\): void \{.*?\n  \}\n\n  private addLockedSaveFailure",
    """  private addResultPrompt(): void {\n    if (!this.root || !this.metrics) return;\n    this.resultPrompt?.destroy();\n    this.resultPrompt = this.add\n      .text(this.metrics.centerX, 646, getMessages(getPlatformRuntime().language).opening.resultLocked, {\n        color: '#eee6f5',\n        backgroundColor: '#2a2037',\n        padding: { x: 12, y: 7 },\n        fontFamily: 'system-ui, sans-serif',\n        fontSize: '17px',\n      })\n      .setOrigin(0.5)\n      .setAlpha(0.8)\n      .setInteractive({ useHandCursor: true });\n    this.resultPrompt.on('pointerup', () => {\n      if (this.phase !== 'result' || !this.resultReady) return;\n      this.resultCarouselDrag = null;\n      this.renderIdle();\n    });\n    this.root.add(this.resultPrompt);\n  }\n\n  private addLockedSaveFailure""",
    'result prompt button',
)

s = replace_regex(
    s,
    r"  private renderResolvedResult\(pending: PendingReveal\): void \{.*?\n  \}\n\n  private isSceneShutdown",
    """  private renderResolvedResult(pending: PendingReveal): void {\n    if (!this.saveState || this.isSceneShutdown()) return;\n    const root = this.createRoot();\n    const metrics = this.metrics!;\n    this.renderSignalHud(root, this.saveState.signal, this.saveState.signal >= SLICE_BALANCE.signal.threshold);\n    this.createCollectionButton(root, true);\n    this.createMuteButton(root);\n    this.pouch = null;\n\n    if (pending.hiddenPocket) {\n      this.renderHiddenPocketCarousel(pending, root, metrics);\n    } else {\n      const standard = createCollectibleVisual(\n        this,\n        root,\n        pending.standard.familyId,\n        pending.standard.rarity,\n        metrics.centerX,\n        316,\n        pending.standard.collectibleId,\n      );\n      standard.group.setScale(1);\n      this.addStandardResultLabels(pending, metrics.centerX, 492);\n    }\n\n    this.addResultPrompt();\n    if (this.resultReady && this.resultPrompt) {\n      this.resultPrompt.setText(getMessages(getPlatformRuntime().language).opening.tapNext).setAlpha(1);\n    }\n  }\n\n  private isSceneShutdown""",
    'resolved result',
)

p.write_text(s)
print('hands-on code fixes applied')
