from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'missing anchor: {label}')
    return text.replace(old, new, 1)

# presentation.ts
p = Path('src/game/data/presentation.ts')
t = p.read_text()
t = replace_once(t, """export const COLLECTION_MILESTONE_PRESENTATION = {
  width: 320,
  minWidth: 270,
  height: 58,
  safeSidePadding: 42,
  centerTopOffset: 78,
  introOffsetY: -8,
  introMs: 180,
  holdMs: 880,
  exitOffsetY: -6,
  exitMs: 210,
} as const;
""", """export const COLLECTION_MILESTONE_PRESENTATION = {
  width: 292,
  minWidth: 250,
  height: 60,
  safeSidePadding: 28,
  centerTopOffset: 78,
  objectGap: 28,
  verticalOffset: -20,
  minCenterY: 218,
  resultGap: 20,
  introOffsetX: 10,
  introOffsetY: 2,
  introMs: 240,
  holdMs: 1850,
  exitOffsetY: -4,
  exitMs: 320,
} as const;
""", 'milestone presentation')
t = replace_once(t, """  discoveryFrameWidth: 288,
  discoveryFrameHeight: 208,
  discoveryLabelOffsetY: 120,
  discoveryIntroMs: 120,
  discoveryHoldMs: 80,
  discoverySettleMs: 200,
""", """  discoveryFrameWidth: 288,
  discoveryFrameHeight: 208,
  discoveryOutlineCopies: 8,
  discoveryOutlineRadius: 3.2,
  discoveryOutlineAlpha: 0.62,
  discoveryLabelOffsetY: 120,
  discoveryIntroMs: 220,
  discoveryHoldMs: 90,
  discoverySettleMs: 250,
  revealBackdropFadeInMs: 280,
  revealBackdropFadeOutMs: 300,
""", 'discovery presentation')
p.write_text(t)

# OpeningScene.ts
p = Path('src/game/scenes/OpeningScene.ts')
t = p.read_text()
t = replace_once(t, """  private root: Phaser.GameObjects.Container | null = null;
  private metrics: LayoutMetrics | null = null;
""", """  private root: Phaser.GameObjects.Container | null = null;
  private environmentRoot: Phaser.GameObjects.Container | null = null;
  private environmentLayoutKey = '';
  private environmentBaseLayerCount = 0;
  private metrics: LayoutMetrics | null = null;
""", 'environment fields')
t = replace_once(t, """    this.presentationSkip.reset();
    this.clearCollectionMilestoneMotion();
    getGameAudio().stopDragTexture(true);
    getGameAudio().clearResultAmbience();
    this.tweens.killAll();
""", """    this.presentationSkip.reset();
    this.clearCollectionMilestoneMotion();
    getGameAudio().stopDragTexture(true);
    getGameAudio().clearResultAmbience();
    this.clearAmbientMotion();
    if (this.environmentRoot?.active) this.environmentRoot.destroy(true);
    this.environmentRoot = null;
    this.environmentLayoutKey = '';
    this.environmentBaseLayerCount = 0;
    this.tweens.killAll();
""", 'shutdown environment cleanup')
t = replace_once(t, """    this.stopRewardBreathing();
    this.clearAmbientMotion();
    this.clearSecretPremiumMotion();
""", """    this.stopRewardBreathing();
    this.clearSecretPremiumMotion();
""", 'preserve ambient on foreground rebuild')
old_root = """    const metrics = createLayoutMetrics(this.scale.width, this.scale.height, readSafeAreaInsets());
    this.metrics = metrics;
    const root = this.add.container(metrics.offsetX, 0).setScale(metrics.scale);
    this.root = root;

    const background = addCoverArt(
      this,
      root,
      staticTextureKey('opening-bg'),
      metrics.logicalWidth,
      LOGICAL_HEIGHT,
    );
    if (!background) {
      root.add(
        this.add.rectangle(metrics.logicalWidth / 2, LOGICAL_HEIGHT / 2, metrics.logicalWidth, LOGICAL_HEIGHT, 0x171421),
      );
      const haze = this.add.ellipse(
        metrics.centerX,
        330,
        Math.min(metrics.logicalWidth * 0.72, 920),
        520,
        0x4b365e,
        0.22,
      );
      root.add(haze);
    }

    this.addAmbientMotion(root, metrics);

    return root;
  }

  private clearAmbientMotion(): void {
"""
new_root = """    const metrics = createLayoutMetrics(this.scale.width, this.scale.height, readSafeAreaInsets());
    this.metrics = metrics;
    this.ensureEnvironment(metrics);
    const root = this.add.container(metrics.offsetX, 0).setScale(metrics.scale);
    this.root = root;

    return root;
  }

  private ensureEnvironment(metrics: LayoutMetrics): void {
    const layoutKey = [
      metrics.offsetX.toFixed(3),
      metrics.scale.toFixed(5),
      metrics.logicalWidth.toFixed(3),
      LOGICAL_HEIGHT,
    ].join(':');
    if (this.environmentRoot?.active && this.environmentLayoutKey === layoutKey) return;

    this.clearAmbientMotion();
    if (this.environmentRoot?.active) this.environmentRoot.destroy(true);

    const environment = this.add.container(metrics.offsetX, 0).setScale(metrics.scale);
    const background = addCoverArt(
      this,
      environment,
      staticTextureKey('opening-bg'),
      metrics.logicalWidth,
      LOGICAL_HEIGHT,
    );
    if (!background) {
      environment.add(
        this.add.rectangle(metrics.logicalWidth / 2, LOGICAL_HEIGHT / 2, metrics.logicalWidth, LOGICAL_HEIGHT, 0x171421),
      );
      const haze = this.add.ellipse(
        metrics.centerX,
        330,
        Math.min(metrics.logicalWidth * 0.72, 920),
        520,
        0x4b365e,
        0.22,
      );
      environment.add(haze);
    }

    this.environmentBaseLayerCount = environment.list.length;
    this.addAmbientMotion(environment, metrics);
    this.environmentRoot = environment;
    this.environmentLayoutKey = layoutKey;
  }

  private clearAmbientMotion(): void {
"""
t = replace_once(t, old_root, new_root, 'persistent environment root')
old_backdrop = """  private createRevealBackdrop(alpha: number, duration: number): void {
    if (!this.root || !this.metrics) return;
    const backdrop = this.add
      .rectangle(
        this.metrics.centerX,
        LOGICAL_HEIGHT / 2,
        this.metrics.logicalWidth,
        LOGICAL_HEIGHT,
        0x120c1b,
        0,
      )
      .setOrigin(0.5);
    this.root.add(backdrop);
    this.tweens.add({
      targets: backdrop,
      alpha,
      duration: 90,
      ease: 'Sine.Out',
      onComplete: () => {
        if (!backdrop.active) return;
        this.tweens.add({
          targets: backdrop,
          alpha: 0,
          delay: 120,
          duration: duration + 140,
          ease: 'Sine.In',
          onComplete: () => backdrop.destroy(),
        });
      },
    });
  }
"""
new_backdrop = """  private createRevealBackdrop(alpha: number, duration: number): void {
    if (!this.environmentRoot || !this.metrics) return;
    const environment = this.environmentRoot;
    const backdrop = this.add
      .rectangle(
        this.metrics.centerX,
        LOGICAL_HEIGHT / 2,
        this.metrics.logicalWidth,
        LOGICAL_HEIGHT,
        0x120c1b,
        0,
      )
      .setOrigin(0.5);
    environment.addAt(
      backdrop,
      Math.min(this.environmentBaseLayerCount, environment.list.length),
    );
    const fadeInMs = OPENING_FEEL_PRESENTATION.revealBackdropFadeInMs;
    const fadeOutMs = OPENING_FEEL_PRESENTATION.revealBackdropFadeOutMs;
    const holdMs = Math.max(80, duration - fadeInMs);
    this.tweens.add({
      targets: backdrop,
      alpha,
      duration: fadeInMs,
      ease: 'Sine.Out',
      onComplete: () => {
        if (!backdrop.active) return;
        this.tweens.add({
          targets: backdrop,
          alpha: 0,
          delay: holdMs,
          duration: fadeOutMs,
          ease: 'Sine.InOut',
          onComplete: () => backdrop.destroy(),
        });
      },
    });
  }
"""
t = replace_once(t, old_backdrop, new_backdrop, 'reveal backdrop lifecycle')

anchor = """  private async animateDiscoveryBeat(
    pending: PendingReveal,
    standardVisual: Phaser.GameObjects.Container,
  ): Promise<void> {
"""
helper = """  private createDiscoverySilhouetteAccent(
    standardVisual: Phaser.GameObjects.Container,
    color: number,
  ): Phaser.GameObjects.GameObject[] {
    const sourceImage = standardVisual.list.find(
      (child): child is Phaser.GameObjects.Image => child instanceof Phaser.GameObjects.Image,
    );
    if (!sourceImage) {
      const fallback = this.add
        .ellipse(
          getCollectiblePresentation(this.lastReveal?.standard.familyId ?? '').artOffsetX,
          getCollectiblePresentation(this.lastReveal?.standard.familyId ?? '').artOffsetY,
          210,
          190,
          color,
          0,
        )
        .setStrokeStyle(3, color, 0.58)
        .setBlendMode(Phaser.BlendModes.ADD);
      standardVisual.addAt(fallback, 0);
      return [fallback];
    }

    const sourceIndex = Math.max(0, standardVisual.getIndex(sourceImage));
    const targets: Phaser.GameObjects.Image[] = [];
    const copies = OPENING_FEEL_PRESENTATION.discoveryOutlineCopies;
    const radius = OPENING_FEEL_PRESENTATION.discoveryOutlineRadius;
    for (let index = 0; index < copies; index += 1) {
      const angle = (Math.PI * 2 * index) / copies;
      const outline = this.add
        .image(
          sourceImage.x + Math.cos(angle) * radius,
          sourceImage.y + Math.sin(angle) * radius,
          sourceImage.texture.key,
          sourceImage.frame.name,
        )
        .setOrigin(sourceImage.originX, sourceImage.originY)
        .setScale(sourceImage.scaleX, sourceImage.scaleY)
        .setTintFill(color)
        .setAlpha(0)
        .setBlendMode(Phaser.BlendModes.ADD);
      standardVisual.addAt(outline, sourceIndex);
      targets.push(outline);
    }
    return targets;
  }

""" + anchor
t = replace_once(t, anchor, helper, 'discovery silhouette helper')

old_discovery = """    const rarityColor = RARITY_REVEAL_COLORS[pending.standard.rarity];
    const frameWidth = OPENING_FEEL_PRESENTATION.discoveryFrameWidth;
    const frameHeight = OPENING_FEEL_PRESENTATION.discoveryFrameHeight;
    const beat = this.add.container(heroX, heroY).setAlpha(0).setScale(0.96);
    beat.setData('rewardMeaning', 'discovery');

    const frame = this.add.graphics();
    frame.lineStyle(2.2, 0x8df8ff, 0.76);
    frame.strokeRoundedRect(-frameWidth / 2, -frameHeight / 2, frameWidth, frameHeight, 22);
    frame.lineStyle(1.2, rarityColor, 0.54);
    frame.strokeRoundedRect(
      -frameWidth / 2 + 8,
      -frameHeight / 2 + 8,
      frameWidth - 16,
      frameHeight - 16,
      18,
    );
    const marker = this.add
      .rectangle(-frameWidth / 2 + 16, -frameHeight / 2 + 16, 7, 7, 0xffd36a, 0.94)
      .setRotation(Math.PI / 4)
      .setStrokeStyle(1, 0xffffff, 0.38);
    const label = this.add
      .text(0, OPENING_FEEL_PRESENTATION.discoveryLabelOffsetY, messages.opening.addedToCollection, {
        color: '#dffcff',
        backgroundColor: '#182130',
        padding: { x: 9, y: 5 },
        stroke: '#100b16',
        strokeThickness: 2,
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: '8px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    beat.add([frame, marker, label]);
    this.root.add(beat);

    getGameAudio().play('new-discovery');
    await Promise.all([
      this.runSkippableTween({
        targets: beat,
        alpha: 1,
        scale: 1,
        duration: OPENING_FEEL_PRESENTATION.discoveryIntroMs,
        ease: 'Back.Out',
      }),
      this.runSkippableTween({
        targets: standardVisual,
        scale: presentation.revealScale * OPENING_FEEL_PRESENTATION.discoveryPopScale,
        duration: OPENING_FEEL_PRESENTATION.discoveryIntroMs,
        ease: 'Back.Out',
      }),
    ]);
    if (this.isSceneShutdown()) {
      if (beat.active) beat.destroy(true);
      return;
    }

    await this.waitPresentation(OPENING_FEEL_PRESENTATION.discoveryHoldMs);
    if (this.isSceneShutdown()) {
      if (beat.active) beat.destroy(true);
      return;
    }

    await Promise.all([
      this.runSkippableTween({
        targets: beat,
        y: heroY - 5,
        alpha: 0,
        scale: 1.025,
        duration: OPENING_FEEL_PRESENTATION.discoverySettleMs,
        ease: 'Sine.Out',
      }),
      this.runSkippableTween({
        targets: standardVisual,
        scale: presentation.revealScale,
        duration: OPENING_FEEL_PRESENTATION.discoverySettleMs,
        ease: 'Sine.Out',
      }),
    ]);
    if (beat.active) beat.destroy(true);
"""
new_discovery = """    const rarityColor = RARITY_REVEAL_COLORS[pending.standard.rarity];
    const outlineTargets = this.createDiscoverySilhouetteAccent(standardVisual, rarityColor);
    const label = this.add
      .text(heroX, heroY + OPENING_FEEL_PRESENTATION.discoveryLabelOffsetY, messages.opening.addedToCollection, {
        color: '#dffcff',
        backgroundColor: '#182130',
        padding: { x: 9, y: 5 },
        stroke: '#100b16',
        strokeThickness: 2,
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: '8px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(0.96);
    label.setData('rewardMeaning', 'discovery');
    this.root.add(label);

    const cleanup = (): void => {
      for (const target of outlineTargets) {
        this.tweens.killTweensOf(target);
        if (target.active) target.destroy();
      }
      if (label.active) label.destroy();
    };

    getGameAudio().play('new-discovery');
    await Promise.all([
      this.runSkippableTween({
        targets: outlineTargets,
        alpha: OPENING_FEEL_PRESENTATION.discoveryOutlineAlpha,
        duration: OPENING_FEEL_PRESENTATION.discoveryIntroMs,
        ease: 'Sine.Out',
      }),
      this.runSkippableTween({
        targets: label,
        alpha: 1,
        scale: 1,
        duration: OPENING_FEEL_PRESENTATION.discoveryIntroMs,
        ease: 'Back.Out',
      }),
      this.runSkippableTween({
        targets: standardVisual,
        scale: presentation.revealScale * OPENING_FEEL_PRESENTATION.discoveryPopScale,
        duration: OPENING_FEEL_PRESENTATION.discoveryIntroMs,
        ease: 'Back.Out',
      }),
    ]);
    if (this.isSceneShutdown()) {
      cleanup();
      return;
    }

    await this.waitPresentation(OPENING_FEEL_PRESENTATION.discoveryHoldMs);
    if (this.isSceneShutdown()) {
      cleanup();
      return;
    }

    await Promise.all([
      this.runSkippableTween({
        targets: outlineTargets,
        alpha: 0,
        duration: OPENING_FEEL_PRESENTATION.discoverySettleMs,
        ease: 'Sine.InOut',
      }),
      this.runSkippableTween({
        targets: label,
        y: label.y - 5,
        alpha: 0,
        scale: 1.015,
        duration: OPENING_FEEL_PRESENTATION.discoverySettleMs,
        ease: 'Sine.Out',
      }),
      this.runSkippableTween({
        targets: standardVisual,
        scale: presentation.revealScale,
        duration: OPENING_FEEL_PRESENTATION.discoverySettleMs,
        ease: 'Sine.Out',
      }),
    ]);
    cleanup();
"""
t = replace_once(t, old_discovery, new_discovery, 'discovery frame replacement')

milestone_anchor = """  private showCollectionMilestone(milestone: CollectionMilestone): void {
"""
milestone_helpers = """  private getActiveResultCollectibleLogicalBounds(): {
    left: number;
    right: number;
    centerY: number;
  } | null {
    if (!this.metrics) return null;
    const activePage = this.resultCarouselItems[this.resultCarouselIndex];
    const pageTarget = activePage?.getData('breathTarget') as Phaser.GameObjects.Container | undefined;
    const target = pageTarget?.active
      ? pageTarget
      : this.resultBreathTarget?.active
        ? this.resultBreathTarget
        : null;
    if (!target) return null;
    const bounds = target.getBounds();
    const scale = Math.max(0.0001, this.metrics.scale);
    return {
      left: (bounds.left - this.metrics.offsetX) / scale,
      right: (bounds.right - this.metrics.offsetX) / scale,
      centerY: bounds.centerY / scale,
    };
  }

  private getCollectionMilestonePosition(width: number): { x: number; y: number } {
    const metrics = this.metrics!;
    const halfWidth = width / 2;
    const halfHeight = COLLECTION_MILESTONE_PRESENTATION.height / 2;
    const minX = metrics.safeLeft + COLLECTION_MILESTONE_PRESENTATION.safeSidePadding + halfWidth;
    const maxX = metrics.safeRight - COLLECTION_MILESTONE_PRESENTATION.safeSidePadding - halfWidth;
    const panelTop = RESULT_PRESENTATION.panelY - RESULT_PRESENTATION.panelHeight / 2;
    const minY = metrics.safeTop + COLLECTION_MILESTONE_PRESENTATION.minCenterY;
    const maxY = panelTop - halfHeight - COLLECTION_MILESTONE_PRESENTATION.resultGap;
    const bounds = this.getActiveResultCollectibleLogicalBounds();
    if (!bounds) {
      return {
        x: Phaser.Math.Clamp(metrics.centerX, minX, maxX),
        y: Phaser.Math.Clamp(
          metrics.safeTop + COLLECTION_MILESTONE_PRESENTATION.centerTopOffset,
          minY,
          maxY,
        ),
      };
    }

    const rightCandidate = bounds.right + COLLECTION_MILESTONE_PRESENTATION.objectGap + halfWidth;
    const leftCandidate = bounds.left - COLLECTION_MILESTONE_PRESENTATION.objectGap - halfWidth;
    const x = rightCandidate <= maxX
      ? rightCandidate
      : leftCandidate >= minX
        ? leftCandidate
        : Phaser.Math.Clamp(rightCandidate, minX, maxX);
    return {
      x,
      y: Phaser.Math.Clamp(
        bounds.centerY + COLLECTION_MILESTONE_PRESENTATION.verticalOffset,
        minY,
        maxY,
      ),
    };
  }

""" + milestone_anchor
t = replace_once(t, milestone_anchor, milestone_helpers, 'milestone placement helpers')

old_milestone_pos = """    const targetY = this.metrics.safeTop + COLLECTION_MILESTONE_PRESENTATION.centerTopOffset;
    const toast = this.add
      .container(
        this.metrics.centerX,
        targetY + COLLECTION_MILESTONE_PRESENTATION.introOffsetY,
      )
      .setAlpha(0)
      .setScale(0.965);
"""
new_milestone_pos = """    const placement = this.getCollectionMilestonePosition(width);
    const targetX = placement.x;
    const targetY = placement.y;
    const introDirection = targetX >= this.metrics.centerX ? -1 : 1;
    const toast = this.add
      .container(
        targetX + COLLECTION_MILESTONE_PRESENTATION.introOffsetX * introDirection,
        targetY + COLLECTION_MILESTONE_PRESENTATION.introOffsetY,
      )
      .setAlpha(0)
      .setScale(0.965);
"""
t = replace_once(t, old_milestone_pos, new_milestone_pos, 'milestone initial placement')
t = replace_once(t, """    this.tweens.add({
      targets: toast,
      y: targetY,
      alpha: 1,
""", """    this.tweens.add({
      targets: toast,
      x: targetX,
      y: targetY,
      alpha: 1,
""", 'milestone intro tween')
p.write_text(t)

# presentation tests
p = Path('tests/presentation.test.ts')
t = p.read_text()
t = replace_once(t, """  AMBIENT_PRESENTATION,
  COLLECTIBLE_PRESENTATION,
""", """  AMBIENT_PRESENTATION,
  COLLECTION_MILESTONE_PRESENTATION,
  COLLECTIBLE_PRESENTATION,
""", 'test milestone import')
t = replace_once(t, """    expect(OPENING_FEEL_PRESENTATION.discoveryFrameWidth % 8).toBe(0);
    expect(OPENING_FEEL_PRESENTATION.discoveryFrameHeight % 8).toBe(0);
""", """    expect(OPENING_FEEL_PRESENTATION.discoveryOutlineCopies).toBeGreaterThanOrEqual(6);
    expect(OPENING_FEEL_PRESENTATION.discoveryOutlineCopies).toBeLessThanOrEqual(12);
    expect(OPENING_FEEL_PRESENTATION.discoveryOutlineRadius).toBeGreaterThanOrEqual(2);
    expect(OPENING_FEEL_PRESENTATION.discoveryOutlineRadius).toBeLessThanOrEqual(4);
    expect(OPENING_FEEL_PRESENTATION.discoveryOutlineAlpha).toBeLessThanOrEqual(0.7);
    expect(OPENING_FEEL_PRESENTATION.revealBackdropFadeInMs).toBeGreaterThanOrEqual(240);
    expect(OPENING_FEEL_PRESENTATION.revealBackdropFadeOutMs).toBeGreaterThanOrEqual(260);
""", 'test discovery outline')
t = replace_once(t, """    expect(MOTION_PRESENTATION.rewardBreathScale).toBeLessThan(1.05);
  });
""", """    expect(MOTION_PRESENTATION.rewardBreathScale).toBeLessThan(1.05);
    expect(COLLECTION_MILESTONE_PRESENTATION.holdMs).toBeGreaterThanOrEqual(1600);
    expect(COLLECTION_MILESTONE_PRESENTATION.holdMs).toBeLessThanOrEqual(2200);
    expect(COLLECTION_MILESTONE_PRESENTATION.objectGap).toBeGreaterThanOrEqual(20);
    expect(COLLECTION_MILESTONE_PRESENTATION.resultGap).toBeGreaterThanOrEqual(16);
  });
""", 'test milestone timing')
p.write_text(t)

print('hands-on visual correction applied')
