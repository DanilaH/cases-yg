import Phaser from 'phaser';

import { getPlatformRuntime } from '../../app/runtime';
import { getMessages } from '../../i18n';
import { staticTextureKey } from '../data/artAssets';
import { LITE_V2_BALANCE, type ChipsCacheTierId, type PouchType } from '../data/balance';
import { SLICE_REGISTRY, type StandardRarity } from '../data/collectibles';
import {
  AMBIENT_PRESENTATION,
  getCarouselSpacing,
  getCarouselVisualState,
  getCollectiblePresentation,
  MOTION_PRESENTATION,
  OPENING_FEEL_PRESENTATION,
  POUCH_PRESENTATION,
  REVEAL_FX_PRESETS,
  REVEAL_MOTION_PRESENTATION,
  RESULT_PRESENTATION,
  resolveCarouselIndex,
} from '../data/presentation';
import { getGameAudio } from '../systems/audio';
import { chipEmissionDelay, createChipFlightPlan, shouldPlayChipClack } from '../systems/chipFlight';
import type { PendingReveal } from '../systems/drops';
import { createLayoutMetrics, readSafeAreaInsets, type LayoutMetrics } from '../systems/layout';
import { computeRewardTrayPlacement } from '../systems/rewardLayout';
import {
  canAffordPouch,
  crossedChargedReadyThreshold,
  getChargedCost,
  isSignalWaitingForCharged,
} from '../systems/openingEconomy';
import { OpeningSession } from '../systems/openingSession';
import { MathRandomSource } from '../systems/random';
import { PresentationSkipController } from '../systems/presentationSkip';
import { SaveRepository, type SaveState } from '../systems/save';
import { persistMutedPreference } from '../systems/settings';
import { isStandardCollectionComplete } from '../systems/signal';
import {
  createCollectibleVisual,
  createPouchVisual,
  createRevealRing,
  RARITY_REVEAL_COLORS,
  SECRET_REVEAL_COLOR,
  type PouchVisual,
} from '../ui/openingVisuals';
import {
  CHARGED_ACCENT,
  CHARGED_TEXT_COLOR,
  CHIPS_TEXT_COLOR,
  DIGITAL_FONT_FAMILY,
  createChargedAura,
  createChipToken,
  createFlyingChipToken,
  createHudShimmer,
  createSignalToken,
} from '../ui/openingEconomyVisuals';
import { addCoverArt } from '../ui/staticArt';

const LOGICAL_HEIGHT = 720;
const POUCH_Y = POUCH_PRESENTATION.groupY;
const DRAG_THRESHOLD = POUCH_PRESENTATION.dragThreshold;
const RESULT_HOLD_MS = OPENING_FEEL_PRESENTATION.resultReadHoldMs;

type OpeningPhase = 'booting' | 'idle' | 'dragging' | 'revealing' | 'result' | 'banking' | 'failed' | 'shutdown';

interface DragState {
  pointerId: number;
  startPointerX: number;
  progress: number;
}

interface ResultCarouselDrag {
  pointerId: number;
  startPointerX: number;
  startPointerY: number;
  deltaX: number;
  deltaY: number;
  startedInCarousel: boolean;
  readyAtStart: boolean;
}

export class OpeningScene extends Phaser.Scene {
  private phase: OpeningPhase = 'booting';
  private root: Phaser.GameObjects.Container | null = null;
  private metrics: LayoutMetrics | null = null;
  private pouch: PouchVisual | null = null;
  private collectionButton: Phaser.GameObjects.Text | null = null;
  private resultActionPanel: Phaser.GameObjects.Container | null = null;
  private drag: DragState | null = null;
  private session: OpeningSession | null = null;
  private saveState: SaveState | null = null;
  private lastReveal: PendingReveal | null = null;
  private resultReady = false;
  private deferredResize = false;
  private ignoreNextResultTap = false;
  private firstInteractionTracked = false;
  private standardResultLabels: Phaser.GameObjects.Text[] = [];
  private standardResultScrim: Phaser.GameObjects.Graphics | null = null;
  private resultCarouselItems: Phaser.GameObjects.Container[] = [];
  private resultCarouselDots: Phaser.GameObjects.Arc[] = [];
  private resultCarouselHeading: Phaser.GameObjects.Text | null = null;
  private resultCarouselIndex = 0;
  private resultCarouselDrag: ResultCarouselDrag | null = null;
  private resultCarouselZone: Phaser.GameObjects.Zone | null = null;
  private ambientParticles: Phaser.GameObjects.Arc[] = [];
  private resultBreathTarget: Phaser.GameObjects.Container | null = null;
  private resultBreathBaseScale = 1;
  private selectedPouchType: PouchType = 'basic';
  private pouchSelectorButtons: Phaser.GameObjects.Container[] = [];
  private pouchSelectorLabel: Phaser.GameObjects.Text | null = null;
  private chipsHudContainer: Phaser.GameObjects.Container | null = null;
  private chipsHudText: Phaser.GameObjects.Text | null = null;
  private chipsHudValue = 0;
  private signalHudContainer: Phaser.GameObjects.Container | null = null;
  private signalHudSegments: Phaser.GameObjects.Rectangle[] = [];
  private hudShimmers: Phaser.GameObjects.Rectangle[] = [];
  private chargedReadyPulsePending = false;
  private chargedAura: Phaser.GameObjects.Container | null = null;
  private rewardTrayContainer: Phaser.GameObjects.Container | null = null;
  private tearHint: Phaser.GameObjects.Text | null = null;
  private readonly presentationSkip = new PresentationSkipController();

  public constructor() {
    super('OpeningScene');
  }

  public create(): void {
    // Phaser reuses the Scene instance after Collection -> Opening. Shutdown is
    // terminal only for the previous activation, so reset activation state here.
    this.phase = 'booting';
    this.drag = null;
    this.resultCarouselDrag = null;
    this.resultReady = false;
    this.deferredResize = false;
    this.ignoreNextResultTap = false;
    this.chargedReadyPulsePending = false;
    this.presentationSkip.reset();

    const platform = getPlatformRuntime();
    platform.activity.setGameplayDesired(true);

    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);

    void this.initialize();
  }

  private async initialize(): Promise<void> {
    const platform = getPlatformRuntime();
    this.session = new OpeningSession({
      repository: new SaveRepository(platform.storage),
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new MathRandomSource(),
    });

    try {
      this.saveState = await this.session.load();
    } catch (error: unknown) {
      this.phase = 'failed';
      this.renderFailure(getMessages(platform.language).opening.saveLoadError);
      platform.markReady();
      console.error(error);
      return;
    }

    if (this.isSceneShutdown()) return;

    const pending = this.saveState.pendingReveal;
    if (pending) this.selectedPouchType = pending.pouchType;
    this.renderIdle();
    platform.markReady();

    if (pending) {
      this.phase = 'revealing';
      this.lastReveal = pending;
      getPlatformRuntime().analytics.track('pending_reveal_recovered', {
        openingNumber: pending.openingNumber,
      });
      void this.playReveal(pending, true);
    }
  }

  private handleShutdown(): void {
    this.phase = 'shutdown';
    this.input.off('pointerdown', this.handlePointerDown, this);
    this.input.off('pointermove', this.handlePointerMove, this);
    this.input.off('pointerup', this.handlePointerUp, this);
    this.scale.off('resize', this.handleResize, this);
    this.presentationSkip.reset();
    this.tweens.killAll();
    getPlatformRuntime().activity.setGameplayDesired(false);
  }

  private handleResize(): void {
    if (this.phase === 'booting' || this.isSceneShutdown() || this.phase === 'failed') {
      return;
    }

    if (this.phase === 'revealing' || this.phase === 'banking') {
      this.deferredResize = true;
      if (this.phase === 'banking') this.requestPresentationFastForward();
      return;
    }

    if (this.phase === 'dragging') {
      this.drag = null;
      this.phase = 'idle';
    }

    if (this.phase === 'result' && this.lastReveal) {
      const selectedCarouselIndex = this.resultCarouselIndex;
      this.renderResolvedResult(this.lastReveal, selectedCarouselIndex);
      return;
    }

    this.renderIdle();
  }

  private createRoot(): Phaser.GameObjects.Container {
    this.stopStarPulse();
    this.stopResultPanelPulse();
    this.stopRewardBreathing();
    this.clearAmbientMotion();
    this.clearHudMotion();
    if (this.chargedAura) this.tweens.killTweensOf(this.chargedAura);
    this.root?.destroy(true);
    this.pouch = null;
    this.collectionButton = null;
    this.resultActionPanel = null;
    this.standardResultLabels = [];
    this.standardResultScrim = null;
    this.resultCarouselItems = [];
    this.resultCarouselDots = [];
    this.resultCarouselHeading = null;
    this.resultCarouselIndex = 0;
    this.resultCarouselDrag = null;
    this.resultCarouselZone = null;
    this.pouchSelectorButtons = [];
    this.pouchSelectorLabel = null;
    this.chipsHudContainer = null;
    this.chipsHudText = null;
    this.signalHudContainer = null;
    this.signalHudSegments = [];
    this.chargedAura = null;
    this.rewardTrayContainer = null;
    this.tearHint = null;
    const metrics = createLayoutMetrics(this.scale.width, this.scale.height, readSafeAreaInsets());
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

    root.add(
      this.add
        .text(metrics.centerX, 62, getMessages(getPlatformRuntime().language).appTitle, {
          color: '#f5eefc',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '30px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );

    return root;
  }

  private clearAmbientMotion(): void {
    for (const particle of this.ambientParticles) {
      this.tweens.killTweensOf(particle);
    }
    this.ambientParticles = [];
  }

  private addAmbientMotion(root: Phaser.GameObjects.Container, metrics: LayoutMetrics): void {
    const usableWidth = Math.max(160, metrics.logicalWidth - 120);
    const colors = [0xf4e5ff, 0xb9efff, 0xffe7f2];
    for (let index = 0; index < AMBIENT_PRESENTATION.count; index += 1) {
      const radiusMix = (index % 4) / 3;
      const alphaMix = (index % 5) / 4;
      const radius = Phaser.Math.Linear(
        AMBIENT_PRESENTATION.minRadius,
        AMBIENT_PRESENTATION.maxRadius,
        radiusMix,
      );
      const alpha = Phaser.Math.Linear(
        AMBIENT_PRESENTATION.minAlpha,
        AMBIENT_PRESENTATION.maxAlpha,
        alphaMix,
      );
      const x = 60 + ((index * 173) % usableWidth);
      const y = 122 + ((index * 97) % 470);
      const particle = this.add.circle(x, y, radius, colors[index % colors.length], alpha);
      root.add(particle);
      this.ambientParticles.push(particle);

      const driftX = (index % 2 === 0 ? 1 : -1) * (18 + (index % 4) * 8);
      const driftY = -(10 + (index % 3) * 7);
      const durationMix = (index % 6) / 5;
      this.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Clamp(driftX, -AMBIENT_PRESENTATION.maxDriftX, AMBIENT_PRESENTATION.maxDriftX),
        y: y + Phaser.Math.Clamp(driftY, -AMBIENT_PRESENTATION.maxDriftY, AMBIENT_PRESENTATION.maxDriftY),
        alpha: Math.min(0.24, alpha * 1.55),
        duration: Phaser.Math.Linear(
          AMBIENT_PRESENTATION.minDuration,
          AMBIENT_PRESENTATION.maxDuration,
          durationMix,
        ),
        delay: index * 110,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
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

  private startStarPulse(): void {
    if (!this.pouch || this.phase !== 'idle') return;
    this.stopStarPulse();
    this.tweens.add({
      targets: this.pouch.tab,
      scale: MOTION_PRESENTATION.starPulseScale,
      duration: MOTION_PRESENTATION.starPulseDuration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private stopStarPulse(): void {
    if (!this.pouch) return;
    this.tweens.killTweensOf(this.pouch.tab);
    this.pouch.tab.setScale(1).setAlpha(1);
  }

  private startResultPanelPulse(): void {
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

  private startRewardBreathing(target: Phaser.GameObjects.Container, baseScale: number): void {
    this.stopRewardBreathing();
    this.resultBreathTarget = target;
    this.resultBreathBaseScale = baseScale;
    target.setScale(baseScale);
    this.tweens.add({
      targets: target,
      scale: baseScale * MOTION_PRESENTATION.rewardBreathScale,
      duration: MOTION_PRESENTATION.rewardBreathDuration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private stopRewardBreathing(): void {
    if (!this.resultBreathTarget) return;
    this.tweens.killTweensOf(this.resultBreathTarget);
    this.resultBreathTarget.setScale(this.resultBreathBaseScale);
    this.resultBreathTarget = null;
    this.resultBreathBaseScale = 1;
  }

  private syncCarouselRewardBreathing(): void {
    this.stopRewardBreathing();
    const activePage = this.resultCarouselItems[this.resultCarouselIndex];
    if (!activePage) return;
    const target = activePage.getData('breathTarget') as Phaser.GameObjects.Container | undefined;
    const baseScale = Number(activePage.getData('breathBaseScale') ?? 1);
    if (target) this.startRewardBreathing(target, baseScale);
  }

  private createRevealBackdrop(alpha: number, duration: number): void {
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

  private completeTweenToEnd(tween: Phaser.Tweens.Tween): void {
    if (!tween.isPlaying() && tween.isFinished()) return;
    tween.seek(tween.totalDuration, 16.6, false);
    tween.complete();
  }

  private runSkippableTween(
    config: Phaser.Types.Tweens.TweenBuilderConfig,
    afterComplete?: () => void,
  ): Promise<void> {
    return new Promise((resolve) => {
      let settled = false;
      let clearSkip = (): void => undefined;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        clearSkip();
        afterComplete?.();
        resolve();
      };
      const tween = this.tweens.add({
        ...config,
        onComplete: finish,
      });
      clearSkip = this.presentationSkip.register(() => this.completeTweenToEnd(tween));
    });
  }

  private waitPresentation(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      let settled = false;
      let clearSkip = (): void => undefined;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        clearSkip();
        resolve();
      };
      const timer = this.time.delayedCall(milliseconds, finish);
      clearSkip = this.presentationSkip.register(() => {
        timer.remove(false);
        finish();
      });
    });
  }

  private requestPresentationFastForward(): boolean {
    return this.presentationSkip.request(this.time.now);
  }

  private renderIdle(message?: string, animateEntry = false): void {
    if (!this.saveState || this.isSceneShutdown()) return;

    this.phase = 'idle';
    this.resultReady = false;
    this.lastReveal = null;
    this.drag = null;
    this.deferredResize = false;

    if (this.selectedPouchType === 'charged' && !canAffordPouch(this.saveState, 'charged', LITE_V2_BALANCE)) {
      this.selectedPouchType = 'basic';
    }

    const root = this.createRoot();
    const metrics = this.metrics!;
    this.renderResourceHud(root, this.saveState);
    if (this.saveState.totalOpens > 0) {
      this.createCollectionButton(root, true);
    }
    this.createMuteButton(root);

    if (this.selectedPouchType === 'charged') this.renderChargedPouchAura(root);
    this.pouch = createPouchVisual(this, root, metrics.centerX, POUCH_Y);
    this.applyChargedPouchTreatment();
    this.pouch.dragZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.beginDrag(pointer));
    this.renderPouchSelector(root);
    if (this.chargedReadyPulsePending) {
      this.chargedReadyPulsePending = false;
      this.showChargedReadyOnSelector();
    }
    this.startStarPulse();

    const tearHint = this.add
      .text(metrics.centerX, MOTION_PRESENTATION.tearHintY, getMessages(getPlatformRuntime().language).opening.tearHint, {
        color: '#efe7f6',
        backgroundColor: '#2a2037',
        padding: { x: 14, y: 8 },
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
      })
      .setOrigin(0.5)
      .setShadow(0, 2, '#120d19', 3, true, true);
    root.add(tearHint);
    this.tearHint = tearHint;

    if (message) {
      root.add(
        this.add
          .text(metrics.centerX, MOTION_PRESENTATION.tearHintY - 42, message, {
            color: '#ffb7c8',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '15px',
          })
          .setOrigin(0.5),
      );
    }

    if (animateEntry) this.animateIdleEntry();
  }

  private animateIdleEntry(): void {
    if (!this.pouch) return;

    const pouch = this.pouch.group;
    const pouchTargetY = pouch.y;
    pouch.setY(pouchTargetY + 8).setAlpha(0);
    this.tweens.add({
      targets: pouch,
      y: pouchTargetY,
      alpha: 1,
      duration: OPENING_FEEL_PRESENTATION.uiFadeInMs,
      ease: 'Cubic.Out',
    });

    if (this.pouchSelectorLabel) {
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

    if (this.tearHint) {
      const targetY = this.tearHint.y;
      this.tearHint.setY(targetY + 4).setAlpha(0);
      this.tweens.add({
        targets: this.tearHint,
        y: targetY,
        alpha: 1,
        duration: OPENING_FEEL_PRESENTATION.uiFadeInMs,
        ease: 'Sine.Out',
      });
    }
  }

  private renderFailure(message: string): void {
    const root = this.createRoot();
    const metrics = this.metrics!;
    const panelWidth = Math.min(660, metrics.logicalWidth - 100);
    const panelHeight = 128;
    const panel = this.add.graphics();
    panel.fillStyle(0x21172e, 0.92);
    panel.fillRoundedRect(
      metrics.centerX - panelWidth / 2,
      metrics.centerY - panelHeight / 2,
      panelWidth,
      panelHeight,
      22,
    );
    panel.lineStyle(1.5, 0xffb7c8, 0.52);
    panel.strokeRoundedRect(
      metrics.centerX - panelWidth / 2,
      metrics.centerY - panelHeight / 2,
      panelWidth,
      panelHeight,
      22,
    );
    const text = this.add
      .text(metrics.centerX, metrics.centerY, message, {
        color: '#fff1f5',
        align: 'center',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        wordWrap: { width: panelWidth - 56 },
      })
      .setOrigin(0.5)
      .setShadow(0, 2, '#120d19', 3, true, true);
    root.add([panel, text]);
  }

  private renderResourceHud(root: Phaser.GameObjects.Container, state: SaveState): void {
    this.renderChipsHud(root, state.chips);
    this.renderSignalHud(root, state);
  }

  private renderChipsHud(root: Phaser.GameObjects.Container, chips: number): void {
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
    container.bringToTop(shimmer);
    root.add(container);
    this.chipsHudContainer = container;
    this.chipsHudText = valueText;
    this.chipsHudValue = Math.max(0, Math.floor(chips));
  }

  private setChipsHudValue(value: number, pulse = false): void {
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

  private renderSignalHud(root: Phaser.GameObjects.Container, state: SaveState): void {
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

    container.bringToTop(shimmer);
    root.add(container);
    this.signalHudContainer = container;
  }

  private renderPouchSelector(root: Phaser.GameObjects.Container): void {
    if (!this.metrics || !this.saveState) return;
    const messages = getMessages(getPlatformRuntime().language);
    const cost = getChargedCost(LITE_V2_BALANCE);
    const chargedAvailable = canAffordPouch(this.saveState, 'charged', LITE_V2_BALANCE);
    const width = OPENING_FEEL_PRESENTATION.railCardWidth;
    const height = OPENING_FEEL_PRESENTATION.railCardHeight;
    const railX = this.metrics.safeLeft;
    const labelY = this.metrics.safeTop + OPENING_FEEL_PRESENTATION.selectorTopOffset;

    const sectionLabel = this.add.text(railX + 2, labelY, 'POUCH', {
      color: '#d8cced',
      fontFamily: DIGITAL_FONT_FAMILY,
      fontSize: '9px',
    });
    root.add(sectionLabel);
    this.pouchSelectorLabel = sectionLabel;

    const createCard = (
      pouchType: PouchType,
      y: number,
      title: string,
      subtitle: string,
      available: boolean,
    ): Phaser.GameObjects.Container => {
      const selected = this.selectedPouchType === pouchType;
      const charged = pouchType === 'charged';
      const card = this.add.container(railX, y);
      const background = this.add.graphics();
      const fill = selected ? (charged ? 0x30234a : 0x282034) : 0x17101f;
      const border = charged ? (selected ? CHARGED_ACCENT : 0x77629e) : selected ? 0xf0ddff : 0x6e627d;
      background.fillStyle(fill, available ? 0.92 : OPENING_FEEL_PRESENTATION.railUnavailableSurfaceAlpha);
      background.fillRoundedRect(0, 0, width, height, 16);
      background.lineStyle(selected ? 2.5 : 1.5, border, selected ? 0.88 : 0.34);
      background.strokeRoundedRect(0, 0, width, height, 16);
      if (selected) {
        const glow = this.add.graphics();
        glow.lineStyle(5, charged ? CHARGED_ACCENT : 0xf0ddff, charged ? 0.1 : 0.06);
        glow.strokeRoundedRect(2, 2, width - 4, height - 4, 14);
        card.add(glow);
      }
      const marker = this.add
        .text(13, height / 2, selected ? '◆' : '◇', {
          color: selected ? (charged ? '#c7b8ff' : '#ffffff') : '#81758f',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5);
      const titleText = this.add.text(38, 11, title, {
        color: available ? (charged ? CHARGED_TEXT_COLOR : '#f7f2ff') : '#b7adbf',
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: getPlatformRuntime().language === 'ru' ? '8px' : '9px',
      });
      const subtitleText = this.add.text(38, 35, subtitle, {
        color: available ? (charged ? '#8df8ff' : '#bfb3ca') : '#a69aae',
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: '8px',
      });
      card.add([background, marker, titleText, subtitleText]);
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
      return card;
    };

    const firstCardY = labelY + 20;
    createCard(
      'basic',
      firstCardY,
      messages.opening.basicPouch,
      messages.opening.free,
      true,
    );
    createCard(
      'charged',
      firstCardY + height + OPENING_FEEL_PRESENTATION.railGap,
      `⚡ ${messages.opening.chargedPouch}`,
      chargedAvailable
        ? `${cost} ${messages.opening.chips}`
        : `${this.saveState.chips}/${cost} ${messages.opening.chips}`,
      chargedAvailable,
    );
  }

  private showUnavailableChargedFeedback(card: Phaser.GameObjects.Container): void {
    if (!this.chipsHudContainer) return;
    getGameAudio().play('ui-denied');
    const baseX = card.x;
    this.tweens.killTweensOf(card);
    card.setScale(1);
    this.tweens.add({
      targets: card,
      x: baseX + 6,
      duration: 55,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.InOut',
      onComplete: () => card.setX(baseX),
    });
    this.setChipsHudValue(this.chipsHudValue, true);
  }

  private selectPouchType(pouchType: PouchType, sourceCard?: Phaser.GameObjects.Container): void {
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

  private renderChargedPouchAura(root: Phaser.GameObjects.Container): void {
    if (!this.metrics) return;
    const aura = createChargedAura(this, root, this.metrics.centerX, POUCH_Y - 12).setAlpha(0.86);
    this.chargedAura = aura;
    const shimmer = aura.getData('shimmer') as Phaser.GameObjects.Rectangle | undefined;
    const ring = aura.getData('ring') as Phaser.GameObjects.Arc | undefined;
    const innerRing = aura.getData('innerRing') as Phaser.GameObjects.Arc | undefined;
    const pinkRing = aura.getData('pinkRing') as Phaser.GameObjects.Arc | undefined;
    this.tweens.add({
      targets: aura,
      scale: 1.035,
      alpha: 1,
      duration: 690,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    if (shimmer) {
      this.tweens.add({
        targets: shimmer,
        x: 155,
        alpha: { from: 0.025, to: 0.1 },
        duration: 1350,
        repeat: -1,
        repeatDelay: 380,
        ease: 'Sine.InOut',
      });
    }
    if (ring) this.tweens.add({ targets: ring, angle: 2.5, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    if (innerRing) this.tweens.add({ targets: innerRing, angle: -2, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    if (pinkRing) this.tweens.add({ targets: pinkRing, alpha: { from: 0.42, to: 0.82 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  private applyChargedPouchTreatment(): void {
    if (!this.pouch || this.selectedPouchType !== 'charged') return;
    const tintChildren = (container: Phaser.GameObjects.Container): void => {
      for (const child of container.list) {
        if (child instanceof Phaser.GameObjects.Image) {
          child.setTint(0xc9f6ff, 0xc4b4ff, 0xffb5e4, 0xa9e8ff);
        } else if (child instanceof Phaser.GameObjects.Container) {
          tintChildren(child);
        }
      }
    };
    tintChildren(this.pouch.bodyLayer);
    tintChildren(this.pouch.strip);
    tintChildren(this.pouch.tab);
  }

  private getChipsHudTarget(): { x: number; y: number } {
    if (!this.metrics) return { x: 36, y: 24 };
    return {
      x: this.metrics.safeLeft + 25,
      y: this.metrics.safeTop + OPENING_FEEL_PRESENTATION.railTopOffset + OPENING_FEEL_PRESENTATION.chipsHudHeight / 2,
    };
  }

  private createCollectionButton(root: Phaser.GameObjects.Container, enabled: boolean): void {
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

  private createMuteButton(root: Phaser.GameObjects.Container): void {
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

  private setChromeEnabled(enabled: boolean): void {
    if (this.collectionButton) {
      this.collectionButton.setAlpha(enabled ? 1 : 0.32);
      if (enabled) {
        this.collectionButton.setInteractive({ useHandCursor: true });
      } else {
        this.collectionButton.disableInteractive();
      }
    }

    for (const button of this.pouchSelectorButtons) {
      const idleAlpha = Number(button.getData('idleAlpha') ?? 1);
      const hitTarget = button.getData('hitTarget') as Phaser.GameObjects.Zone | undefined;
      button.setAlpha(enabled ? idleAlpha : 0.16);
      if (hitTarget?.input) hitTarget.input.enabled = enabled;
    }
  }

  private beginDrag(pointer: Phaser.Input.Pointer): void {
    if (this.phase !== 'idle' || !this.pouch || !this.metrics) return;

    this.stopStarPulse();
    getGameAudio().play('pouch-grab');
    this.phase = 'dragging';
    this.drag = {
      pointerId: pointer.id,
      startPointerX: pointer.x,
      progress: 0,
    };
    this.setChromeEnabled(false);
    this.tweens.killTweensOf(this.pouch.tab);
    this.tweens.killTweensOf(this.pouch.group);
    this.tweens.add({
      targets: this.pouch.tab,
      scale: 1.12,
      duration: 70,
      ease: 'Back.Out',
    });
    this.tweens.add({
      targets: this.pouch.group,
      scaleX: 1.012,
      scaleY: 0.992,
      duration: 90,
      ease: 'Sine.Out',
    });
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.phase === 'revealing' || this.phase === 'banking') {
      if (this.requestPresentationFastForward()) getGameAudio().play('ui-skip');
      return;
    }

    if (this.phase !== 'result') return;
    if (!this.resultReady && this.requestPresentationFastForward()) {
      this.ignoreNextResultTap = true;
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

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.phase === 'result' && this.resultCarouselDrag && this.metrics) {
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

    if (this.phase !== 'dragging' || !this.drag || !this.pouch || !this.metrics) return;
    if (pointer.id !== this.drag.pointerId) return;

    const logicalDelta = Math.max(0, (pointer.x - this.drag.startPointerX) / this.metrics.scale);
    const travel = this.pouch.tabEndX - this.pouch.tabStartX;
    const progress = Math.min(1, logicalDelta / DRAG_THRESHOLD);
    this.drag.progress = progress;
    const tabX = this.pouch.tabStartX + travel * progress;
    this.pouch.tab.setX(tabX);
    this.pouch.tab.setScale(1.12 - progress * 0.04);
    this.pouch.strip.setAlpha(1 - progress * 0.08);
    this.pouch.group.setScale(1 + progress * 0.018, 1 - progress * 0.012);

    if (progress >= 1) {
      const firstInteraction = this.saveState?.totalOpens === 0 && !this.firstInteractionTracked;
      void this.completeTear(firstInteraction);
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.ignoreNextResultTap) {
      this.ignoreNextResultTap = false;
      this.resultCarouselDrag = null;
      return;
    }

    if (this.phase === 'result') {
      const gesture = this.resultCarouselDrag;
      if (!gesture || !this.metrics || pointer.id !== gesture.pointerId) return;
      this.resultCarouselDrag = null;

      const moved = Math.hypot(gesture.deltaX, gesture.deltaY);
      if (gesture.startedInCarousel && this.resultCarouselItems.length > 1) {
        this.resultCarouselIndex = resolveCarouselIndex(
          this.resultCarouselIndex,
          this.resultCarouselItems.length,
          gesture.deltaX,
        );
        this.positionResultCarousel(0, true);
        this.syncCarouselRewardBreathing();
        if (this.lastReveal) this.renderResultActionPanel(this.lastReveal);
        if (
          gesture.readyAtStart &&
          this.resultReady &&
          moved <= RESULT_PRESENTATION.tapMoveTolerance
        ) {
          this.continueFromResult();
        }
        return;
      }

      if (
        gesture.readyAtStart &&
        this.resultReady &&
        moved <= RESULT_PRESENTATION.tapMoveTolerance
      ) {
        this.continueFromResult();
      }
      return;
    }

    if (this.phase !== 'dragging' || !this.drag || !this.pouch) return;
    if (pointer.id !== this.drag.pointerId) return;

    if (this.drag.progress >= 1) return;

    this.drag = null;
    this.phase = 'idle';
    this.setChromeEnabled(true);
    const pouch = this.pouch;
    this.tweens.add({
      targets: pouch.tab,
      x: pouch.tabStartX,
      scale: 1,
      duration: 170,
      ease: 'Sine.Out',
      onComplete: () => {
        if (this.phase === 'idle') this.startStarPulse();
      },
    });
    this.tweens.add({
      targets: pouch.strip,
      alpha: 1,
      duration: 140,
      ease: 'Sine.Out',
    });
    this.tweens.add({
      targets: pouch.group,
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: 'Sine.Out',
    });
  }

  private async completeTear(firstInteraction: boolean): Promise<void> {
    if (this.phase !== 'dragging' || !this.session) return;

    this.stopStarPulse();
    this.phase = 'revealing';
    this.drag = null;
    this.presentationSkip.guardUntilTime(this.time.now + OPENING_FEEL_PRESENTATION.postTearSkipGuardMs);
    this.pouch?.dragZone.disableInteractive();
    this.setChromeEnabled(false);
    getGameAudio().play('tear');

    try {
      const pending = await this.session.prepareReveal(this.selectedPouchType);
      if (this.isSceneShutdown()) return;
      this.lastReveal = pending;
      if (firstInteraction && pending.openingNumber === 1) {
        this.firstInteractionTracked = true;
        getPlatformRuntime().analytics.track('first_package_interaction');
      }
      await this.playReveal(pending, false);
    } catch (error: unknown) {
      if (this.isSceneShutdown()) return;
      console.error(error);
      this.saveState = this.session.getState();
      this.renderIdle(getMessages(getPlatformRuntime().language).opening.saveStageError);
    }
  }

  private async playReveal(pending: PendingReveal, recovered: boolean): Promise<void> {
    if (!this.root || !this.pouch || !this.metrics || !this.session) return;

    this.phase = 'revealing';
    this.setChromeEnabled(false);
    this.pouch.dragZone.disableInteractive();
    if (this.tearHint) {
      this.tweens.killTweensOf(this.tearHint);
      this.tearHint.setAlpha(0);
    }

    if (recovered) {
      this.pouch.tab.setX(this.pouch.tabEndX);
    }

    await this.animateTearDetach(recovered);
    if (this.isSceneShutdown()) return;

    if (recovered) {
      await this.animateRecoveredReveal(pending);
      if (this.isSceneShutdown()) return;
    } else {
      await this.animateChipsPrelude(pending);
      if (this.isSceneShutdown()) return;

      const standardVisual = await this.animateStandardReveal(pending);
      if (this.isSceneShutdown()) return;

      await this.animatePostStandardEconomy(pending, standardVisual);
      if (this.isSceneShutdown()) return;

      if (pending.hiddenPocket) {
        await this.animateHiddenPocket(pending, standardVisual);
        if (this.isSceneShutdown()) return;
      }
    }

    let committed: SaveState | null = null;
    for (let attempt = 0; attempt < 3 && !committed; attempt += 1) {
      try {
        committed = await this.session.commitReveal();
      } catch (error: unknown) {
        console.error(error);
        if (attempt < 2) await this.wait(300 * (attempt + 1));
      }
    }

    if (!committed) {
      this.phase = 'failed';
      this.addLockedSaveFailure();
      return;
    }

    this.saveState = committed;
    this.trackRevealCompletion(pending, committed);
    this.phase = 'result';
    this.resultReady = false;

    this.deferredResize = false;
    this.renderResolvedResult(pending);

    await this.waitPresentation(RESULT_HOLD_MS);
    if (this.phase !== 'result') return;
    this.resultReady = true;
    this.renderResultActionPanel(pending);
  }

  private async animateTearDetach(recovered: boolean): Promise<void> {
    if (!this.pouch) return;
    const pouch = this.pouch;
    const originalY = pouch.group.y;

    await this.runSkippableTween({
      targets: pouch.strip,
      x: recovered ? 130 : 172,
      alpha: 0,
      duration: recovered ? 100 : 155,
      ease: 'Cubic.In',
    });
    if (this.isSceneShutdown()) return;

    await this.runSkippableTween({
      targets: pouch.group,
      y: originalY + 10,
      scaleX: 1.025,
      scaleY: 0.975,
      duration: recovered ? 45 : 62,
      yoyo: true,
      ease: 'Sine.InOut',
    });
    if (!recovered && !this.isSceneShutdown()) {
      await this.waitPresentation(72);
    }
  }

  private getCacheLabel(tier: ChipsCacheTierId): string | null {
    const messages = getMessages(getPlatformRuntime().language);
    if (tier === 'cache') return messages.opening.chipCache;
    if (tier === 'big') return messages.opening.bigCache;
    if (tier === 'mega') return messages.opening.megaCache;
    return null;
  }

  private async animateChipsPrelude(pending: PendingReveal): Promise<void> {
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

  private getRewardBankOrigin(): { x: number; y: number } {
    if (this.rewardTrayContainer?.active) {
      const height = Number(this.rewardTrayContainer.getData('height') ?? 0);
      return {
        x: this.rewardTrayContainer.x - OPENING_FEEL_PRESENTATION.rewardTrayWidth / 2 - 4,
        y: this.rewardTrayContainer.y + height / 2,
      };
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
    const rarityColor = `#${RARITY_REVEAL_COLORS[pending.standard.rarity].toString(16).padStart(6, '0')}`;
    const rarityCode = pending.standard.rarity.toUpperCase();
    const rows: Array<{ kind: 'chips' | 'signal'; text: string; color: string }> = [
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
        text: `${messages.opening.recycled} +${pending.chips.recycle} · ${rarityCode}`,
        color: rarityColor,
      });
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

  private async animateRewardStaging(
    pending: PendingReveal,
    standardVisual: Phaser.GameObjects.Container,
  ): Promise<void> {
    if (!this.root || !this.metrics) return;
    const tray = this.renderRewardTray(pending, this.root, true);
    const trayCenterX = tray.x;
    const heroY = getCollectiblePresentation(pending.standard.familyId).revealY;

    if (!pending.standard.isNew && pending.chips.recycle > 0) {
      const scan = this.add
        .rectangle(this.metrics.centerX - 82, heroY, 12, 170, 0x8df8ff, 0.12)
        .setRotation(0.16)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.root.add(scan);
      this.tweens.add({
        targets: scan,
        x: this.metrics.centerX + 82,
        alpha: 0,
        duration: 220,
        ease: 'Sine.Out',
        onComplete: () => scan.destroy(),
      });
      const tokenCount = Math.min(3, Math.max(2, pending.chips.recycle >= 8 ? 3 : 2));
      for (let index = 0; index < tokenCount; index += 1) {
        const token = createChipToken(
          this,
          standardVisual.x + (index - (tokenCount - 1) / 2) * 22,
          heroY + 46 + (index % 2) * 10,
          0.62,
        );
        this.root.add(token);
        this.tweens.add({
          targets: token,
          x: trayCenterX - 70 + index * 18,
          y: tray.y + 48,
          scale: 0.42,
          alpha: 0.68,
          angle: (index % 2 === 0 ? 1 : -1) * 55,
          delay: index * 18,
          duration: 220,
          ease: 'Cubic.InOut',
          onComplete: () => token.destroy(),
        });
      }
    }

    await this.waitPresentation(440);
  }

  private getResultPresentationState(pending: PendingReveal): SaveState | null {
    if (!this.saveState) return null;
    const visualSignal = pending.signal.gain > 0 ? pending.signal.before : pending.signal.after;
    return {
      ...this.saveState,
      chips: pending.chips.before - pending.chips.cost,
      signal: visualSignal,
    };
  }

  private async bankChipLeg(
    targetValue: number,
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
          origin.x + lane * 6,
          origin.y + ((index % 5) - 2) * 4,
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

  private async bankSignalGain(pending: PendingReveal): Promise<void> {
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
      .circle(origin.x + 17, origin.y + 10, 8, 0x76e9f5, 0.94)
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

  private finishDeferredBankingResize(): boolean {
    if (!this.deferredResize || this.phase !== 'banking' || this.isSceneShutdown()) return false;
    this.presentationSkip.reset();
    this.renderIdle();
    return true;
  }

  private async animateRewardBanking(pending: PendingReveal): Promise<void> {
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

    if (this.finishDeferredBankingResize()) return;

    let nextValue = pending.chips.before - pending.chips.cost;
    const chargedCost = getChargedCost(LITE_V2_BALANCE);
    let readyShown = false;
    const bankLeg = async (amount: number): Promise<void> => {
      if (amount <= 0) return;
      const target = nextValue + amount;
      const crossesReady =
        !readyShown &&
        crossedChargedReadyThreshold(pending, LITE_V2_BALANCE) &&
        nextValue < chargedCost &&
        target >= chargedCost;
      await this.bankChipLeg(target, crossesReady);
      readyShown ||= crossesReady;
      nextValue = target;
    };

    await bankLeg(pending.chips.base);
    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;
    await bankLeg(pending.chips.cacheBonus);
    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;
    await bankLeg(pending.chips.recycle);
    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;
    await this.bankSignalGain(pending);
    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;

    this.setChipsHudValue(pending.chips.after, false);
    const fadeTargets: Phaser.GameObjects.GameObject[] = [];
    if (this.rewardTrayContainer?.active) fadeTargets.push(this.rewardTrayContainer);
    if (this.resultActionPanel?.active) fadeTargets.push(this.resultActionPanel);
    if (this.resultCarouselHeading?.active) fadeTargets.push(this.resultCarouselHeading);
    if (this.resultCarouselDots.length > 0) {
      fadeTargets.push(...this.resultCarouselDots.filter((dot) => dot.active));
    }
    if (this.resultCarouselItems.length > 0) {
      fadeTargets.push(...this.resultCarouselItems.filter((item) => item.active));
    } else if (this.resultBreathTarget?.active) {
      fadeTargets.push(this.resultBreathTarget);
    }
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
    if (!this.isSceneShutdown()) this.renderIdle(undefined, true);
  }

  private async animatePostStandardEconomy(
    pending: PendingReveal,
    standardVisual: Phaser.GameObjects.Container,
  ): Promise<void> {
    await this.animateRewardStaging(pending, standardVisual);
  }

  private showChargedReadyOnSelector(): void {
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

  private showRarityAccentSweep(
    rarity: StandardRarity,
    x: number,
    y: number,
    color: number,
  ): void {
    if (!this.root) return;
    const intensity = rarity === 'legendary' ? 0.18 : rarity === 'epic' ? 0.13 : rarity === 'rare' ? 0.09 : 0.045;
    const width = rarity === 'legendary' ? 38 : rarity === 'epic' ? 30 : 22;
    const sweep = this.add
      .rectangle(x - 112, y, width, 230, color, intensity)
      .setRotation(0.28)
      .setBlendMode(Phaser.BlendModes.ADD);
    const whiteCore = this.add
      .rectangle(x - 118, y, Math.max(5, width * 0.22), 218, 0xffffff, intensity * 0.72)
      .setRotation(0.28)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.root.add([sweep, whiteCore]);
    this.tweens.add({
      targets: [sweep, whiteCore],
      x: x + 112,
      alpha: 0,
      duration: rarity === 'legendary' ? 360 : 300,
      ease: 'Sine.InOut',
      onComplete: () => {
        sweep.destroy();
        whiteCore.destroy();
      },
    });
  }

  private async animateStandardReveal(pending: PendingReveal): Promise<Phaser.GameObjects.Container> {
    const root = this.root!;
    const pouch = this.pouch!;
    const color = RARITY_REVEAL_COLORS[pending.standard.rarity];
    const presentation = getCollectiblePresentation(pending.standard.familyId);
    const fx = REVEAL_FX_PRESETS[pending.standard.rarity];
    this.createRevealBackdrop(fx.backdropAlpha, fx.particleDuration);
    const heroX = this.metrics!.centerX;
    const heroY = presentation.revealY;
    const finalScale = presentation.revealScale;

    getGameAudio().play('reveal-pop');

    const halo = this.add.circle(heroX, heroY, 144, color, fx.glowAlpha).setScale(0.36);
    const flash = this.add.circle(heroX, heroY, 108, color, fx.flashAlpha).setScale(0.24);
    const coreFlash = this.add
      .circle(heroX, heroY, 64, 0xffffff, Math.min(0.58, fx.flashAlpha * 0.72))
      .setScale(0.18);
    root.add([halo, flash, coreFlash]);
    const ring = createRevealRing(this, root, heroX, heroY, color).setScale(0.48).setAlpha(0.38);
    if (fx.secondaryRing) {
      const secondary = createRevealRing(this, root, heroX, heroY, color)
        .setScale(0.3)
        .setAlpha(0.5)
        .setStrokeStyle(4, color, 0.68);
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
      POUCH_Y + REVEAL_MOTION_PRESENTATION.emergeOffsetY,
      pending.standard.collectibleId,
    );
    visual.group
      .setScale(finalScale * 0.3)
      .setAlpha(0)
      .setAngle(((pending.openingNumber % 5) - 2) * 0.85);

    // Keep z-order stable: the reward remains behind the pouch while both move.
    // The pouch exits downward and fades, uncovering the reward continuously.
    this.tweens.add({
      targets: pouch.group,
      y: pouch.group.y + REVEAL_MOTION_PRESENTATION.pouchExitOffsetY,
      scale: REVEAL_MOTION_PRESENTATION.pouchExitScale,
      alpha: 0,
      delay: REVEAL_MOTION_PRESENTATION.pouchExitDelay,
      duration: REVEAL_MOTION_PRESENTATION.pouchExitDuration,
      ease: 'Cubic.InOut',
    });

    this.spawnSparkles(
      heroX,
      heroY,
      color,
      fx.particleCount,
      fx.particleDistance,
      fx.particleDuration,
      fx.sparkleScale,
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
      targets: coreFlash,
      scale: 3.1,
      alpha: 0,
      duration: Math.max(330, fx.introDuration + 40),
      ease: 'Cubic.Out',
      onComplete: () => coreFlash.destroy(),
    });
    this.tweens.add({
      targets: ring,
      scale: fx.ringScale,
      alpha: 0,
      duration: fx.particleDuration,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    });

    await this.runSkippableTween({
      targets: visual.group,
      y: heroY,
      scale: finalScale * fx.overshootScale,
      alpha: 1,
      angle: 0,
      duration: fx.introDuration,
      ease: 'Back.Out',
    });
    if (this.isSceneShutdown()) return visual.group;

    this.showRarityAccentSweep(pending.standard.rarity, heroX, heroY, color);
    await this.runSkippableTween({
      targets: visual.group,
      scale: finalScale,
      duration: fx.settleDuration,
      ease: 'Sine.Out',
    });

    if (fx.shake > 0) this.cameras.main.shake(100, fx.shake);

    getGameAudio().play(pending.standard.rarity);
    if (!pending.standard.isNew) {
      this.time.delayedCall(90, () => getGameAudio().play('duplicate'));
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
    await this.runSkippableTween({
      targets: visual.group,
      scale: presentation.revealScale,
      alpha: 1,
      duration: 180,
      ease: 'Sine.Out',
    });
    await this.waitPresentation(90);
  }

  private getStandardResultStatus(pending: PendingReveal): string {
    const messages = getMessages(getPlatformRuntime().language);
    let status = pending.standard.isNew ? messages.opening.newItem : messages.opening.duplicate;
    if (pending.signal.lockConsumed || pending.signal.lockReached) {
      status += ` · ${messages.opening.signalLock}`;
    } else if (pending.signal.gain > 0) {
      status += ` · +${pending.signal.gain} SIGNAL`;
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
    if (!pending.hiddenPocket || !this.root || !this.metrics) return;

    const root = this.root;
    const metrics = this.metrics;
    const spacing = getCarouselSpacing(metrics.logicalWidth);
    const standardPresentation = getCollectiblePresentation(pending.standard.familyId);
    const secretPresentation = getCollectiblePresentation(pending.hiddenPocket.familyId);
    const fx = REVEAL_FX_PRESETS.secret;

    await this.waitPresentation(260);
    getGameAudio().play('hidden-pocket');

    const hiddenLabel = this.add.text(
      metrics.centerX,
      126,
      getMessages(getPlatformRuntime().language).opening.hiddenPocket,
      {
        color: '#8df8ff',
        stroke: '#160f20',
        strokeThickness: 3,
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: '15px',
        fontStyle: 'bold',
      },
    ).setOrigin(0.5).setAlpha(0);
    root.add(hiddenLabel);

    this.tweens.add({
      targets: hiddenLabel,
      alpha: 1,
      duration: 170,
      ease: 'Sine.Out',
    });
    await this.runSkippableTween({
      targets: standardVisual,
      x: metrics.centerX - spacing,
      y: standardPresentation.revealY,
      scale: standardPresentation.revealScale * standardPresentation.carouselSideScale,
      alpha: RESULT_PRESENTATION.sideAlpha,
      duration: 260,
      ease: 'Cubic.Out',
    });

    const heroX = metrics.centerX;
    const heroY = secretPresentation.revealY;
    this.createRevealBackdrop(fx.backdropAlpha, fx.particleDuration);
    const halo = this.add.circle(heroX, heroY, 158, SECRET_REVEAL_COLOR, fx.glowAlpha).setScale(0.34);
    const flash = this.add.circle(heroX, heroY, 118, SECRET_REVEAL_COLOR, fx.flashAlpha).setScale(0.22);
    const coreFlash = this.add
      .circle(heroX, heroY, 70, 0xffffff, Math.min(0.64, fx.flashAlpha * 0.78))
      .setScale(0.16);
    root.add([halo, flash, coreFlash]);
    const ring = createRevealRing(this, root, heroX, heroY, SECRET_REVEAL_COLOR)
      .setScale(0.42)
      .setAlpha(0.54);
    const secondary = createRevealRing(this, root, heroX, heroY, SECRET_REVEAL_COLOR)
      .setScale(0.25)
      .setAlpha(0.46)
      .setStrokeStyle(4, SECRET_REVEAL_COLOR, 0.68);

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
      fx.sparkleScale,
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
      targets: coreFlash,
      scale: 3.4,
      alpha: 0,
      duration: fx.introDuration + 70,
      ease: 'Cubic.Out',
      onComplete: () => coreFlash.destroy(),
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

    await this.runSkippableTween({
      targets: secret.group,
      y: heroY,
      scale: secretPresentation.revealScale * fx.overshootScale,
      alpha: 1,
      duration: fx.introDuration,
      ease: 'Back.Out',
    });
    await this.runSkippableTween({
      targets: secret.group,
      scale: secretPresentation.revealScale,
      duration: fx.settleDuration,
      ease: 'Sine.Out',
    });
    this.cameras.main.shake(110, fx.shake);
  }

  private renderHiddenPocketCarousel(
    pending: PendingReveal,
    root: Phaser.GameObjects.Container,
    metrics: LayoutMetrics,
    selectedIndex = 1,
  ): void {
    if (!pending.hiddenPocket) return;
    const messages = getMessages(getPlatformRuntime().language);

    const heading = this.add.text(metrics.centerX, 126, messages.opening.hiddenPocket, {
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
    standardPage.setData('breathTarget', standardVisual.group);
    standardPage.setData('breathBaseScale', standardVisual.presentation.revealScale);

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
    secretPage.setData('breathTarget', secretVisual.group);
    secretPage.setData('breathBaseScale', secretVisual.presentation.revealScale);

    this.resultCarouselItems = [standardPage, secretPage];
    this.resultCarouselIndex = Phaser.Math.Clamp(selectedIndex, 0, this.resultCarouselItems.length - 1);
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
      this.stopResultPanelPulse();
      this.stopRewardBreathing();
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
    this.syncCarouselRewardBreathing();
  }

  private positionResultCarousel(dragOffset = 0, animate = false): void {
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

  private spawnSparkles(
    x: number,
    y: number,
    color: number,
    count: number,
    distance: number,
    duration: number,
    sizeScale = 1,
  ): void {
    if (!this.root) return;
    const root = this.root;
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + 0.12 * (index % 3);
      const distanceJitter = distance * (0.74 + (index % 4) * 0.09);
      const sparkle = this.add
        .circle(
          x,
          y,
          (index % 3 === 0 ? 7 : index % 2 === 0 ? 5 : 3.5) * sizeScale,
          color,
          1,
        )
        .setStrokeStyle(1.5, 0xffffff, 0.46);
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

  private trackRevealCompletion(pending: PendingReveal, committed: SaveState): void {
    const analytics = getPlatformRuntime().analytics;
    analytics.track('reveal_complete', {
      openingNumber: pending.openingNumber,
      familyId: pending.standard.familyId,
      rarity: pending.standard.rarity,
      isNew: pending.standard.isNew,
      pouchType: pending.pouchType,
      lootPoolId: pending.lootPoolId,
      hiddenPocket: pending.hiddenPocket !== null,
      chipsEarned: pending.chips.totalEarned,
      chipsAfter: committed.chips,
      cacheTier: pending.chips.cacheTier,
      recycleChips: pending.chips.recycle,
      signalAfter: committed.signal,
    });

    if (pending.signal.lockReached) {
      analytics.track('signal_lock_reached', { openingNumber: pending.openingNumber });
    }
    if (pending.signal.lockConsumed) {
      analytics.track('signal_lock_consumed', { openingNumber: pending.openingNumber });
    }
    if (pending.signal.lockRetained) {
      analytics.track('signal_lock_retained', { openingNumber: pending.openingNumber, pouchType: pending.pouchType });
    }
    if (pending.chips.cacheTier !== 'none') {
      analytics.track('chips_cache_hit', {
        openingNumber: pending.openingNumber,
        pouchType: pending.pouchType,
        cacheTier: pending.chips.cacheTier,
        cacheChips: pending.chips.cacheBonus,
      });
    }
    if (pending.hiddenPocket) {
      analytics.track('hidden_pocket_triggered', { openingNumber: pending.openingNumber });
      analytics.track('secret_discovered', {
        openingNumber: pending.openingNumber,
        familyId: pending.hiddenPocket.familyId,
        collectibleId: pending.hiddenPocket.collectibleId,
      });
    }
    if (isStandardCollectionComplete(SLICE_REGISTRY, committed.discoveredStandard)) {
      const wasCompleteBefore = isStandardCollectionComplete(
        SLICE_REGISTRY,
        pending.standard.isNew
          ? committed.discoveredStandard.filter((id) => id !== pending.standard.collectibleId)
          : committed.discoveredStandard,
      );
      if (!wasCompleteBefore) {
        analytics.track('standard_collection_complete', { openingNumber: pending.openingNumber });
        getGameAudio().play('collection-complete');
      }
    }
  }

  private getResultPanelCopy(pending: PendingReveal): {
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
    const rarityColorNumber = Number.parseInt(copy.rarityColor.slice(1), 16);
    const background = this.add.graphics();
    background.fillStyle(0x21172e, 0.84);
    background.fillRoundedRect(
      -panelWidth / 2,
      -RESULT_PRESENTATION.panelHeight / 2,
      panelWidth,
      RESULT_PRESENTATION.panelHeight,
      22,
    );
    background.lineStyle(2, Number.isFinite(rarityColorNumber) ? rarityColorNumber : 0xf0ddff, 0.44);
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
      backgroundColor: '#18101f',
      padding: { x: 8, y: 4 },
      stroke: '#160f20',
      strokeThickness: 1,
      fontFamily: DIGITAL_FONT_FAMILY,
      fontSize: '10px',
      fontStyle: 'bold',
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
      // Acceptance stays on the scene-level pointerup gesture. Starting banking
      // here would let this same pointerdown be reinterpreted as a banking skip.
    });

    panel.add([background, readyGlow, title, rarity, status, hint, actionZone]);
    panel.setData('readyGlow', readyGlow);
    panel.setData('title', title);
    panel.setData('rarity', rarity);
    panel.setData('status', status);
    panel.setData('hint', hint);
    this.root.add(panel);
    this.resultActionPanel = panel;
    rarity.setScale(0.92).setAlpha(0);
    this.tweens.add({
      targets: panel,
      y: RESULT_PRESENTATION.panelY,
      alpha: 1,
      duration: OPENING_FEEL_PRESENTATION.uiFadeInMs,
      ease: 'Sine.Out',
    });
    this.tweens.add({
      targets: rarity,
      scale: 1,
      alpha: 1,
      delay: 55,
      duration: 135,
      ease: 'Back.Out',
    });
    if (this.resultReady) this.startResultPanelPulse();
  }

  private continueFromResult(): void {
    if (this.phase !== 'result' || !this.resultReady || !this.lastReveal) return;
    getGameAudio().play('ui-click');
    this.resultCarouselDrag = null;
    const pending = this.lastReveal;
    void this.animateRewardBanking(pending).catch((error: unknown) => {
      console.error('[opening] reward banking presentation failed', error);
      if (this.saveState && !this.isSceneShutdown()) this.renderIdle();
    });
  }

  private addLockedSaveFailure(): void {
    if (!this.root || !this.metrics) return;
    this.setChromeEnabled(false);
    this.root.add(
      this.add
        .text(this.metrics.centerX, 640, getMessages(getPlatformRuntime().language).opening.saveConfirmError, {
          color: '#ffb7c8',
          align: 'center',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '15px',
          wordWrap: { width: Math.min(660, this.metrics.logicalWidth - 80) },
        })
        .setOrigin(0.5),
    );
  }

  private renderResolvedResult(pending: PendingReveal, selectedCarouselIndex?: number): void {
    if (!this.saveState || this.isSceneShutdown()) return;
    const root = this.createRoot();
    const metrics = this.metrics!;
    const presentationState = this.getResultPresentationState(pending) ?? this.saveState;
    this.renderResourceHud(root, presentationState);
    this.createCollectionButton(root, true);
    this.createMuteButton(root);
    this.pouch = null;

    if (pending.hiddenPocket) {
      this.renderHiddenPocketCarousel(pending, root, metrics, selectedCarouselIndex);
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
      this.startRewardBreathing(standard.group, standard.presentation.revealScale);
    }

    this.renderRewardTray(pending, root, false);
    this.renderResultActionPanel(pending);
  }

  private isSceneShutdown(): boolean {
    return this.phase === 'shutdown';
  }

  private wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      this.time.delayedCall(milliseconds, () => resolve());
    });
  }
}
