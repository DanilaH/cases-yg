from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OPENING = ROOT / 'src/game/scenes/OpeningScene.ts'
COLLECTION = ROOT / 'src/game/scenes/CollectionScene.ts'


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected 1 match, found {count}')
    return text.replace(old, new, 1)


def replace_regex(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f'{label}: expected 1 regex match, found {count}')
    return updated


def patch_opening() -> None:
    text = OPENING.read_text(encoding='utf-8')

    text = replace_once(
        text,
        "import { SLICE_REGISTRY, type StandardRarity } from '../data/collectibles';\nimport { getGameAudio } from '../systems/audio';",
        "import { SLICE_REGISTRY, type StandardRarity } from '../data/collectibles';\nimport {\n  getCarouselSpacing,\n  getCarouselVisualState,\n  getCollectiblePresentation,\n  POUCH_PRESENTATION,\n  REVEAL_FX_PRESETS,\n  RESULT_PRESENTATION,\n  resolveCarouselIndex,\n} from '../data/presentation';\nimport { getGameAudio } from '../systems/audio';",
        'presentation import',
    )

    text = replace_once(
        text,
        "const LOGICAL_HEIGHT = 720;\nconst POUCH_Y = 392;\nconst DRAG_THRESHOLD = 238;\nconst RESULT_HOLD_MS = 600;",
        "const LOGICAL_HEIGHT = 720;\nconst POUCH_Y = POUCH_PRESENTATION.groupY;\nconst DRAG_THRESHOLD = POUCH_PRESENTATION.dragThreshold;\nconst RESULT_HOLD_MS = 600;",
        'opening constants',
    )

    text = replace_once(
        text,
        "interface ResultCarouselDrag {\n  pointerId: number;\n  startPointerX: number;\n  deltaX: number;\n}",
        "interface ResultCarouselDrag {\n  pointerId: number;\n  startPointerX: number;\n  startPointerY: number;\n  deltaX: number;\n  deltaY: number;\n  startedInCarousel: boolean;\n  readyAtStart: boolean;\n}",
        'result gesture interface',
    )

    text = replace_once(
        text,
        "  private resultPrompt: Phaser.GameObjects.Text | null = null;",
        "  private resultActionPanel: Phaser.GameObjects.Container | null = null;",
        'result panel field',
    )

    text = replace_once(
        text,
        "    this.input.on('pointermove', this.handlePointerMove, this);\n    this.input.on('pointerup', this.handlePointerUp, this);",
        "    this.input.on('pointerdown', this.handlePointerDown, this);\n    this.input.on('pointermove', this.handlePointerMove, this);\n    this.input.on('pointerup', this.handlePointerUp, this);",
        'pointer listeners',
    )

    text = replace_once(
        text,
        "    this.input.off('pointermove', this.handlePointerMove, this);\n    this.input.off('pointerup', this.handlePointerUp, this);",
        "    this.input.off('pointerdown', this.handlePointerDown, this);\n    this.input.off('pointermove', this.handlePointerMove, this);\n    this.input.off('pointerup', this.handlePointerUp, this);",
        'pointer shutdown listeners',
    )

    text = replace_once(
        text,
        "    this.resultPrompt = null;",
        "    this.resultActionPanel = null;",
        'root result panel reset',
    )

    marker = "  private handlePointerMove(pointer: Phaser.Input.Pointer): void {"
    handle_down = """  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.phase !== 'result') return;
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

"""
    text = replace_once(text, marker, handle_down + marker, 'global result pointerdown')

    text = replace_once(
        text,
        """    if (this.phase === 'result' && this.resultCarouselDrag && this.metrics) {
      if (pointer.id !== this.resultCarouselDrag.pointerId) return;
      const delta = (pointer.x - this.resultCarouselDrag.startPointerX) / this.metrics.scale;
      this.resultCarouselDrag.deltaX = Phaser.Math.Clamp(delta, -220, 220);
      this.positionResultCarousel(this.resultCarouselDrag.deltaX, false);
      return;
    }
""",
        """    if (this.phase === 'result' && this.resultCarouselDrag && this.metrics) {
      if (pointer.id !== this.resultCarouselDrag.pointerId) return;
      const deltaX = (pointer.x - this.resultCarouselDrag.startPointerX) / this.metrics.scale;
      const deltaY = (pointer.y - this.resultCarouselDrag.startPointerY) / this.metrics.scale;
      this.resultCarouselDrag.deltaX = Phaser.Math.Clamp(
        deltaX,
        -RESULT_PRESENTATION.dragClamp,
        RESULT_PRESENTATION.dragClamp,
      );
      this.resultCarouselDrag.deltaY = deltaY;
      if (this.resultCarouselDrag.startedInCarousel && this.resultCarouselItems.length > 1) {
        this.positionResultCarousel(this.resultCarouselDrag.deltaX, false);
      }
      return;
    }
""",
        'result pointermove',
    )

    text = replace_once(
        text,
        """    if (this.phase === 'result') {
      if (this.resultCarouselDrag && this.metrics && pointer.id === this.resultCarouselDrag.pointerId) {
        const delta = this.resultCarouselDrag.deltaX;
        this.resultCarouselDrag = null;
        if (Math.abs(delta) >= 72) {
          const direction = delta < 0 ? 1 : -1;
          this.resultCarouselIndex = Phaser.Math.Clamp(
            this.resultCarouselIndex + direction,
            0,
            Math.max(0, this.resultCarouselItems.length - 1),
          );
        }
        this.positionResultCarousel(0, true);
      }
      return;
    }
""",
        """    if (this.phase === 'result') {
      const gesture = this.resultCarouselDrag;
      if (!gesture || !this.metrics || pointer.id !== gesture.pointerId) return;
      this.resultCarouselDrag = null;

      if (gesture.startedInCarousel && this.resultCarouselItems.length > 1) {
        this.resultCarouselIndex = resolveCarouselIndex(
          this.resultCarouselIndex,
          this.resultCarouselItems.length,
          gesture.deltaX,
        );
        this.positionResultCarousel(0, true);
        if (this.lastReveal) this.renderResultActionPanel(this.lastReveal);
        return;
      }

      const moved = Math.hypot(gesture.deltaX, gesture.deltaY);
      if (
        gesture.readyAtStart &&
        this.resultReady &&
        moved <= RESULT_PRESENTATION.tapMoveTolerance
      ) {
        this.continueFromResult();
      }
      return;
    }
""",
        'result pointerup gesture policy',
    )

    text = replace_once(
        text,
        """    const standardVisual = await this.animateStandardReveal(pending);
    if (this.isSceneShutdown()) return;

    if (pending.hiddenPocket) {
      await this.animateHiddenPocket(pending, standardVisual);
      if (this.isSceneShutdown()) return;
    }
""",
        """    if (recovered) {
      await this.animateRecoveredReveal(pending);
      if (this.isSceneShutdown()) return;
    } else {
      const standardVisual = await this.animateStandardReveal(pending);
      if (this.isSceneShutdown()) return;

      if (pending.hiddenPocket) {
        await this.animateHiddenPocket(pending, standardVisual);
        if (this.isSceneShutdown()) return;
      }
    }
""",
        'recovered reveal branch',
    )

    text = replace_once(
        text,
        """    this.resultReady = true;
    if (this.resultPrompt) {
      this.resultPrompt.setText(getMessages(getPlatformRuntime().language).opening.tapNext);
      this.resultPrompt.setAlpha(1);
    }
""",
        """    this.resultReady = true;
    this.renderResultActionPanel(pending);
""",
        'result unlock panel',
    )

    new_standard = r"""  private async animateStandardReveal(pending: PendingReveal): Promise<Phaser.GameObjects.Container> {
    const root = this.root!;
    const pouch = this.pouch!;
    const color = RARITY_REVEAL_COLORS[pending.standard.rarity];
    const presentation = getCollectiblePresentation(pending.standard.familyId);
    const fx = REVEAL_FX_PRESETS[pending.standard.rarity];
    const heroX = this.metrics!.centerX;
    const heroY = presentation.revealY;
    const finalScale = presentation.revealScale;

    getGameAudio().play('reveal-pop');

    const halo = this.add.circle(heroX, heroY, 118, color, fx.glowAlpha).setScale(0.42);
    const flash = this.add.circle(heroX, heroY, 86, color, fx.flashAlpha).setScale(0.28);
    root.add([halo, flash]);
    const ring = createRevealRing(this, root, heroX, heroY, color).setScale(0.48).setAlpha(0.16);
    if (fx.secondaryRing) {
      const secondary = createRevealRing(this, root, heroX, heroY, color)
        .setScale(0.3)
        .setAlpha(0.38)
        .setStrokeStyle(3, color, 0.5);
      this.tweens.add({
        targets: secondary,
        scale: fx.ringScale * 1.25,
        alpha: 0,
        duration: fx.particleDuration + 120,
        ease: 'Cubic.Out',
        onComplete: () => secondary.destroy(),
      });
    }

    const visual = createCollectibleVisual(
      this,
      root,
      pending.standard.familyId,
      pending.standard.rarity,
      heroX,
      POUCH_Y + 74,
      pending.standard.collectibleId,
    );
    visual.group.setScale(finalScale * 0.3).setAlpha(0);

    this.spawnSparkles(
      heroX,
      heroY,
      color,
      fx.particleCount,
      fx.particleDistance,
      fx.particleDuration,
    );

    this.tweens.add({
      targets: halo,
      scale: 2.8,
      alpha: 0,
      duration: fx.particleDuration + 80,
      ease: 'Cubic.Out',
      onComplete: () => halo.destroy(),
    });
    this.tweens.add({
      targets: flash,
      scale: 3.8,
      alpha: 0,
      duration: Math.max(300, fx.introDuration - 20),
      ease: 'Cubic.Out',
      onComplete: () => flash.destroy(),
    });
    this.tweens.add({
      targets: ring,
      scale: fx.ringScale,
      alpha: 0,
      duration: fx.particleDuration,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    });

    await new Promise<void>((resolve) => {
      this.tweens.add({
        targets: visual.group,
        y: heroY,
        scale: finalScale * fx.overshootScale,
        alpha: 1,
        duration: fx.introDuration,
        ease: 'Back.Out',
        onComplete: () => resolve(),
      });
    });

    this.tweens.add({
      targets: pouch.group,
      y: pouch.group.y + 72,
      scale: 0.92,
      alpha: 0,
      duration: 190,
      ease: 'Cubic.In',
    });

    await new Promise<void>((resolve) => {
      this.tweens.add({
        targets: visual.group,
        scale: finalScale,
        duration: fx.settleDuration,
        ease: 'Sine.Out',
        onComplete: () => resolve(),
      });
    });

    if (fx.shake > 0) this.cameras.main.shake(100, fx.shake);

    getGameAudio().play(pending.standard.rarity);
    if (!pending.standard.isNew) {
      this.time.delayedCall(90, () => getGameAudio().play('duplicate'));
    }
    if (pending.signal.gain > 0) {
      this.time.delayedCall(170, () => getGameAudio().play('signal-gain'));
    }
    if (pending.signal.lockReached || pending.signal.lockConsumed) {
      this.time.delayedCall(250, () => getGameAudio().play('signal-lock'));
    }
    return visual.group;
  }

  private async animateRecoveredReveal(pending: PendingReveal): Promise<void> {
    if (!this.root || !this.metrics) return;
    this.pouch?.group.setAlpha(0);
    const familyId = pending.hiddenPocket?.familyId ?? pending.standard.familyId;
    const rarity = pending.hiddenPocket ? 'secret' : pending.standard.rarity;
    const collectibleId = pending.hiddenPocket?.collectibleId ?? pending.standard.collectibleId;
    const presentation = getCollectiblePresentation(familyId);
    const visual = createCollectibleVisual(
      this,
      this.root,
      familyId,
      rarity,
      this.metrics.centerX,
      presentation.revealY,
      collectibleId,
    );
    visual.group.setScale(presentation.revealScale * 0.9).setAlpha(0);
    await new Promise<void>((resolve) => {
      this.tweens.add({
        targets: visual.group,
        scale: presentation.revealScale,
        alpha: 1,
        duration: 180,
        ease: 'Sine.Out',
        onComplete: () => resolve(),
      });
    });
    await this.wait(90);
  }

"""
    text = replace_regex(
        text,
        r"  private async animateStandardReveal\(pending: PendingReveal\): Promise<Phaser\.GameObjects\.Container> \{.*?\n  private getStandardResultStatus",
        new_standard + "  private getStandardResultStatus",
        'standard reveal method',
    )

    new_hidden = r"""  private async animateHiddenPocket(
    pending: PendingReveal,
    standardVisual: Phaser.GameObjects.Container,
  ): Promise<void> {
    if (!pending.hiddenPocket || !this.root || !this.metrics) return;

    const root = this.root;
    const metrics = this.metrics;
    const spacing = getCarouselSpacing(metrics.logicalWidth);
    const standardPresentation = getCollectiblePresentation(pending.standard.familyId);
    const secretPresentation = getCollectiblePresentation(pending.hiddenPocket.familyId);
    const fx = REVEAL_FX_PRESETS.secret;

    await this.wait(260);
    getGameAudio().play('hidden-pocket');

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

    await Promise.all([
      new Promise<void>((resolve) => {
        this.tweens.add({
          targets: standardVisual,
          x: metrics.centerX - spacing,
          y: standardPresentation.revealY,
          scale: standardPresentation.revealScale * standardPresentation.carouselSideScale,
          alpha: RESULT_PRESENTATION.sideAlpha,
          duration: 260,
          ease: 'Cubic.Out',
          onComplete: () => resolve(),
        });
      }),
      new Promise<void>((resolve) => {
        this.tweens.add({
          targets: hiddenLabel,
          alpha: 1,
          duration: 170,
          onComplete: () => resolve(),
        });
      }),
    ]);

    const heroX = metrics.centerX;
    const heroY = secretPresentation.revealY;
    const halo = this.add.circle(heroX, heroY, 132, SECRET_REVEAL_COLOR, fx.glowAlpha).setScale(0.38);
    const flash = this.add.circle(heroX, heroY, 96, SECRET_REVEAL_COLOR, fx.flashAlpha).setScale(0.26);
    root.add([halo, flash]);
    const ring = createRevealRing(this, root, heroX, heroY, SECRET_REVEAL_COLOR)
      .setScale(0.42)
      .setAlpha(0.38);
    const secondary = createRevealRing(this, root, heroX, heroY, SECRET_REVEAL_COLOR)
      .setScale(0.25)
      .setAlpha(0.3)
      .setStrokeStyle(3, SECRET_REVEAL_COLOR, 0.5);

    getGameAudio().play('secret-reveal');
    const secret = createCollectibleVisual(
      this,
      root,
      pending.hiddenPocket.familyId,
      'secret',
      heroX,
      heroY + 88,
      pending.hiddenPocket.collectibleId,
    );
    secret.group.setScale(secretPresentation.revealScale * 0.28).setAlpha(0);
    this.spawnSparkles(
      heroX,
      heroY,
      SECRET_REVEAL_COLOR,
      fx.particleCount,
      fx.particleDistance,
      fx.particleDuration,
    );

    this.tweens.add({
      targets: halo,
      scale: 3.2,
      alpha: 0,
      duration: fx.particleDuration + 100,
      ease: 'Cubic.Out',
      onComplete: () => halo.destroy(),
    });
    this.tweens.add({
      targets: flash,
      scale: 4,
      alpha: 0,
      duration: fx.introDuration,
      ease: 'Cubic.Out',
      onComplete: () => flash.destroy(),
    });
    this.tweens.add({
      targets: ring,
      scale: fx.ringScale,
      alpha: 0,
      duration: fx.particleDuration,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    });
    this.tweens.add({
      targets: secondary,
      scale: fx.ringScale * 1.25,
      alpha: 0,
      duration: fx.particleDuration + 140,
      ease: 'Cubic.Out',
      onComplete: () => secondary.destroy(),
    });

    await new Promise<void>((resolve) => {
      this.tweens.add({
        targets: secret.group,
        y: heroY,
        scale: secretPresentation.revealScale * fx.overshootScale,
        alpha: 1,
        duration: fx.introDuration,
        ease: 'Back.Out',
        onComplete: () => resolve(),
      });
    });
    await new Promise<void>((resolve) => {
      this.tweens.add({
        targets: secret.group,
        scale: secretPresentation.revealScale,
        duration: fx.settleDuration,
        ease: 'Sine.Out',
        onComplete: () => resolve(),
      });
    });
    this.cameras.main.shake(110, fx.shake);
  }

"""
    text = replace_regex(
        text,
        r"  private async animateHiddenPocket\(.*?\n  private renderHiddenPocketCarousel",
        new_hidden + "  private renderHiddenPocketCarousel",
        'hidden pocket animation',
    )

    new_carousel = r"""  private renderHiddenPocketCarousel(
    pending: PendingReveal,
    root: Phaser.GameObjects.Container,
    metrics: LayoutMetrics,
  ): void {
    if (!pending.hiddenPocket) return;
    const messages = getMessages(getPlatformRuntime().language);

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

    const standardPage = this.add.container(0, getCollectiblePresentation(pending.standard.familyId).revealY);
    root.add(standardPage);
    const standardVisual = createCollectibleVisual(
      this,
      standardPage,
      pending.standard.familyId,
      pending.standard.rarity,
      0,
      0,
      pending.standard.collectibleId,
    );
    standardVisual.group.setScale(standardVisual.presentation.revealScale);
    standardPage.setData('sideScale', standardVisual.presentation.carouselSideScale);

    const secretPage = this.add.container(0, getCollectiblePresentation(pending.hiddenPocket.familyId).revealY);
    root.add(secretPage);
    const secretVisual = createCollectibleVisual(
      this,
      secretPage,
      pending.hiddenPocket.familyId,
      'secret',
      0,
      0,
      pending.hiddenPocket.collectibleId,
    );
    secretVisual.group.setScale(secretVisual.presentation.revealScale);
    secretPage.setData('sideScale', secretVisual.presentation.carouselSideScale);

    this.resultCarouselItems = [standardPage, secretPage];
    this.resultCarouselIndex = 1;
    this.resultCarouselDrag = null;

    this.resultCarouselDots = this.resultCarouselItems.map((_, index) => {
      const dot = this.add.circle(
        metrics.centerX + (index - 0.5) * 22,
        RESULT_PRESENTATION.carouselDotY,
        5,
        0xece4f6,
        0.35,
      );
      root.add(dot);
      return dot;
    });

    const zoneWidth = Math.min(760, metrics.logicalWidth - 150);
    this.resultCarouselZone = this.add
      .zone(metrics.centerX, 326, zoneWidth, 320)
      .setInteractive({ useHandCursor: true });
    this.resultCarouselZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== 'result' || this.resultCarouselItems.length < 2) return;
      this.resultCarouselDrag = {
        pointerId: pointer.id,
        startPointerX: pointer.x,
        startPointerY: pointer.y,
        deltaX: 0,
        deltaY: 0,
        startedInCarousel: true,
        readyAtStart: this.resultReady,
      };
    });
    root.add(this.resultCarouselZone);
    this.positionResultCarousel(0, false);
  }

"""
    text = replace_regex(
        text,
        r"  private renderHiddenPocketCarousel\(.*?\n  private positionResultCarousel",
        new_carousel + "  private positionResultCarousel",
        'resolved hidden carousel',
    )

    new_position = r"""  private positionResultCarousel(dragOffset = 0, animate = false): void {
    if (!this.metrics || this.resultCarouselItems.length === 0) return;
    const spacing = getCarouselSpacing(this.metrics.logicalWidth);
    this.resultCarouselItems.forEach((item, index) => {
      const sideScale = Number(item.getData('sideScale') ?? 0.72);
      const state = getCarouselVisualState(
        index,
        this.resultCarouselIndex,
        dragOffset,
        spacing,
        sideScale,
      );
      const targetX = this.metrics!.centerX + state.xOffset;
      if (animate) {
        this.tweens.add({
          targets: item,
          x: targetX,
          scale: state.scaleMultiplier,
          alpha: state.alpha,
          duration: 190,
          ease: 'Cubic.Out',
        });
      } else {
        item.setX(targetX).setScale(state.scaleMultiplier).setAlpha(state.alpha);
      }
    });
    this.resultCarouselDots.forEach((dot, index) => {
      dot.setFillStyle(
        index === this.resultCarouselIndex ? 0x8df8ff : 0xece4f6,
        index === this.resultCarouselIndex ? 0.95 : 0.35,
      );
    });
  }

"""
    text = replace_regex(
        text,
        r"  private positionResultCarousel\(.*?\n  private spawnSparkles",
        new_position + "  private spawnSparkles",
        'carousel interpolation',
    )

    new_sparkles = r"""  private spawnSparkles(
    x: number,
    y: number,
    color: number,
    count: number,
    distance: number,
    duration: number,
  ): void {
    if (!this.root) return;
    const root = this.root;
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + 0.12 * (index % 3);
      const distanceJitter = distance * (0.74 + (index % 4) * 0.09);
      const sparkle = this.add.circle(
        x,
        y,
        index % 3 === 0 ? 6 : index % 2 === 0 ? 4 : 3,
        color,
        0.94,
      );
      root.add(sparkle);
      this.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * distanceJitter,
        y: y + Math.sin(angle) * distanceJitter * 0.78 - 12,
        alpha: 0,
        scale: 0.18,
        duration: duration + (index % 4) * 34,
        ease: 'Cubic.Out',
        onComplete: () => sparkle.destroy(),
      });
    }
  }

"""
    text = replace_regex(
        text,
        r"  private spawnSparkles\(.*?\n  private trackRevealCompletion",
        new_sparkles + "  private trackRevealCompletion",
        'rarity particle burst',
    )

    new_panel = r"""  private getResultPanelCopy(pending: PendingReveal): {
    title: string;
    status: string;
    titleColor: string;
    statusColor: string;
  } {
    const language = getPlatformRuntime().language;
    const messages = getMessages(language);
    if (pending.hiddenPocket && this.resultCarouselIndex === 1) {
      const family = SLICE_REGISTRY.familyById.get(pending.hiddenPocket.familyId);
      return {
        title: `${family?.name[language] ?? pending.hiddenPocket.familyId} · ${messages.rarity.secret}`,
        status: messages.opening.secretDiscovered,
        titleColor: '#8df8ff',
        statusColor: '#f5f0ff',
      };
    }

    const family = SLICE_REGISTRY.familyById.get(pending.standard.familyId);
    return {
      title: `${family?.name[language] ?? pending.standard.familyId} · ${messages.rarity[pending.standard.rarity]}`,
      status: this.getStandardResultStatus(pending),
      titleColor: `#${RARITY_REVEAL_COLORS[pending.standard.rarity].toString(16).padStart(6, '0')}`,
      statusColor: pending.standard.isNew ? '#f7f2ff' : '#c7f8ff',
    };
  }

  private renderResultActionPanel(pending: PendingReveal): void {
    if (!this.root || !this.metrics || this.phase !== 'result') return;
    this.resultActionPanel?.destroy(true);

    const messages = getMessages(getPlatformRuntime().language);
    const copy = this.getResultPanelCopy(pending);
    const panel = this.add.container(this.metrics.centerX, RESULT_PRESENTATION.panelY);
    const title = this.add.text(0, -34, copy.title, {
      color: copy.titleColor,
      stroke: '#160f20',
      strokeThickness: 3,
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const status = this.add.text(0, -3, copy.status, {
      color: copy.statusColor,
      stroke: '#160f20',
      strokeThickness: 2,
      fontFamily: 'monospace',
      fontSize: '15px',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const readyHint = pending.hiddenPocket
      ? `↔ ${messages.opening.swipeItems} · ${messages.opening.tapNext}`
      : messages.opening.tapNext;
    const hint = this.add.text(0, 34, this.resultReady ? readyHint : messages.opening.resultLocked, {
      color: this.resultReady ? '#ffffff' : '#bfb3ca',
      fontFamily: 'system-ui, sans-serif',
      fontSize: pending.hiddenPocket ? '13px' : '15px',
      fontStyle: this.resultReady ? 'bold' : 'normal',
    }).setOrigin(0.5);

    const desiredWidth = Math.max(title.width, status.width, hint.width) + 46;
    const panelWidth = Phaser.Math.Clamp(
      desiredWidth,
      RESULT_PRESENTATION.panelMinWidth,
      Math.min(RESULT_PRESENTATION.panelMaxWidth, this.metrics.logicalWidth - 120),
    );
    const background = this.add.graphics();
    background.fillStyle(0x21172e, 0.82);
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
    const actionZone = this.add
      .zone(0, 0, panelWidth, RESULT_PRESENTATION.panelHeight)
      .setInteractive({ useHandCursor: true });
    actionZone.on('pointerdown', () => {
      if (this.phase !== 'result' || !this.resultReady) return;
      this.continueFromResult();
    });

    panel.add([background, title, status, hint, actionZone]);
    this.root.add(panel);
    this.resultActionPanel = panel;
  }

  private continueFromResult(): void {
    if (this.phase !== 'result' || !this.resultReady) return;
    this.resultCarouselDrag = null;
    this.renderIdle();
  }

"""
    text = replace_regex(
        text,
        r"  private addResultPrompt\(\): void \{.*?\n  private addLockedSaveFailure",
        new_panel + "  private addLockedSaveFailure",
        'unified result action panel',
    )

    new_resolved = r"""  private renderResolvedResult(pending: PendingReveal): void {
    if (!this.saveState || this.isSceneShutdown()) return;
    const root = this.createRoot();
    const metrics = this.metrics!;
    this.renderSignalHud(root, this.saveState.signal, this.saveState.signal >= SLICE_BALANCE.signal.threshold);
    this.createCollectionButton(root, true);
    this.createMuteButton(root);
    this.pouch = null;

    if (pending.hiddenPocket) {
      this.renderHiddenPocketCarousel(pending, root, metrics);
    } else {
      const standard = createCollectibleVisual(
        this,
        root,
        pending.standard.familyId,
        pending.standard.rarity,
        metrics.centerX,
        getCollectiblePresentation(pending.standard.familyId).revealY,
        pending.standard.collectibleId,
      );
      standard.group.setScale(standard.presentation.revealScale);
    }

    this.renderResultActionPanel(pending);
  }

"""
    text = replace_regex(
        text,
        r"  private renderResolvedResult\(pending: PendingReveal\): void \{.*?\n  private isSceneShutdown",
        new_resolved + "  private isSceneShutdown",
        'resolved result layout',
    )

    OPENING.write_text(text, encoding='utf-8')


def patch_collection() -> None:
    text = COLLECTION.read_text(encoding='utf-8')
    text = replace_once(
        text,
        "        visual.group.setScale(featured.rarity === 'secret' ? 0.82 : 0.78);",
        "        visual.group.setScale(\n          featured.rarity === 'secret' ? visual.presentation.shelfSecretScale : visual.presentation.shelfScale,\n        );",
        'shelf presentation scale',
    )
    text = replace_once(
        text,
        """          visual.group.setScale(
            family.id === 'flip-phone' ? (entry.secret ? 0.38 : 0.36) : entry.secret ? 0.29 : 0.27,
          );
""",
        """          visual.group.setScale(
            entry.secret ? visual.presentation.librarySecretScale : visual.presentation.libraryScale,
          );
""",
        'library presentation scale',
    )
    COLLECTION.write_text(text, encoding='utf-8')


if __name__ == '__main__':
    patch_opening()
    patch_collection()
