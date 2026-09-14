import Phaser from 'phaser';

import { onGameAnalyticsEvent, type GameAnalyticsEvent } from '../../app/analyticsEvents';
import { getPlatformRuntime } from '../../app/runtime';
import { getMessages } from '../../i18n';
import { LITE_V2_BALANCE, type PouchType } from '../data/balance';
import { GAME_REGISTRY } from '../data/collectibles';
import { OPENING_FEEL_PRESENTATION, POUCH_PRESENTATION, RESULT_PRESENTATION } from '../data/presentation';
import { createLayoutMetrics, readSafeAreaInsets, type LayoutMetrics } from '../systems/layout';
import {
  hasCommittedStandardLegendary,
  loadOnboardingHintState,
  saveOnboardingHintState,
  shouldShowChargedOnboardingPointer,
  type OnboardingHintState,
} from '../systems/onboarding';
import { isSignalWaitingForCharged } from '../systems/openingEconomy';
import { getRenderPixelRatio } from '../systems/renderDensity';
import { SaveRepository, type SaveState } from '../systems/save';
import { installSceneTextSharpness } from '../systems/uiSharpness';
import { createGuidancePointer, type GuidancePointer } from '../ui/onboardingGuidance';

const POUCH_Y = POUCH_PRESENTATION.groupY;

type HintKind = 'signal-gain' | 'signal-lock';

interface QueuedHint {
  kind: HintKind;
  text: string;
}

export class GuidanceScene extends Phaser.Scene {
  private root: Phaser.GameObjects.Container | null = null;
  private metrics: LayoutMetrics | null = null;
  private state: SaveState | null = null;
  private selectedPouchType: PouchType = 'basic';
  private chargedPointer: GuidancePointer | null = null;
  private resultPointer: GuidancePointer | null = null;
  private waitingLabel: Phaser.GameObjects.Container | null = null;
  private hintContainer: Phaser.GameObjects.Container | null = null;
  private hintQueue: QueuedHint[] = [];
  private hintShowing = false;
  private hints: OnboardingHintState = { signalGainSeen: false, signalLockSeen: false };
  private removeAnalyticsListener: (() => void) | null = null;
  private resultPointerTimer: Phaser.Time.TimerEvent | null = null;
  private chargedEmphasisPlayed = false;
  private openingTransactionActive = false;
  private wasOpeningSceneActive = false;

  public constructor() {
    super('GuidanceScene');
  }

  public create(): void {
    installSceneTextSharpness(this);
    this.rebuildRoot();
    this.scene.bringToTop();
    this.removeAnalyticsListener = onGameAnalyticsEvent((event) => this.handleAnalyticsEvent(event));
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    void this.initializeState();
  }

  public update(): void {
    const openingSceneActive = this.scene.isActive('OpeningScene');
    if (openingSceneActive === this.wasOpeningSceneActive) return;
    this.wasOpeningSceneActive = openingSceneActive;

    if (!openingSceneActive) {
      this.hideOpeningGuidance();
      return;
    }

    void this.refreshState();
  }

  private async initializeState(): Promise<void> {
    const platform = getPlatformRuntime();
    this.hints = await loadOnboardingHintState(platform.storage);
    this.wasOpeningSceneActive = this.scene.isActive('OpeningScene');
    await this.refreshState();
  }

  private async refreshState(): Promise<void> {
    try {
      this.state = await new SaveRepository(getPlatformRuntime().storage).load();
      this.syncChargedPointer();
      this.syncWaitingLabel();
    } catch (error: unknown) {
      console.warn('[onboarding] guidance state refresh failed', error);
    }
  }

  private handleAnalyticsEvent(message: GameAnalyticsEvent): void {
    const { event, params } = message;

    if (event === 'pouch_selected') {
      const pouchType = params?.pouchType;
      if (pouchType === 'basic' || pouchType === 'charged') {
        this.selectedPouchType = pouchType;
        if (
          pouchType === 'charged' &&
          this.state &&
          !hasCommittedStandardLegendary(this.state, GAME_REGISTRY)
        ) {
          this.hideChargedPointer();
          this.playFirstChargedEmphasis();
        } else {
          this.syncChargedPointer();
        }
        this.syncWaitingLabel();
      }
      return;
    }

    if (event === 'opening_started' || event === 'pending_reveal_recovered') {
      this.openingTransactionActive = true;
      this.hideChargedPointer();
      this.hideWaitingLabel();
      return;
    }

    if (event === 'onboarding_result_ready') {
      const openingNumber = Number(params?.openingNumber ?? -1);
      if (openingNumber === 1) this.scheduleResultPointer();
      return;
    }

    if (event === 'reveal_complete') {
      const isNew = params?.isNew === true;
      const chipsAfter = Number(params?.chipsAfter ?? Number.NaN);
      const signalGain = Number(params?.signalGain ?? 0);

      if (Number.isFinite(chipsAfter) && this.state) {
        this.state = { ...this.state, chips: Math.max(0, Math.floor(chipsAfter)) };
      }

      // Reward resolution already knows whether this exact opening gained Signal.
      // Consume that durable semantic fact directly instead of racing an async
      // guidance-side save reload against the reveal-complete event.
      if (!isNew && signalGain > 0 && !this.hints.signalGainSeen) {
        this.hints = { ...this.hints, signalGainSeen: true };
        void saveOnboardingHintState(getPlatformRuntime().storage, this.hints);
        this.enqueueHint('signal-gain', getMessages(getPlatformRuntime().language).opening.onboardingSignalGain);
      }

      void this.refreshState();
      return;
    }

    if (event === 'signal_lock_reached' && !this.hints.signalLockSeen) {
      this.hints = { ...this.hints, signalLockSeen: true };
      void saveOnboardingHintState(getPlatformRuntime().storage, this.hints);
      this.enqueueHint('signal-lock', getMessages(getPlatformRuntime().language).opening.onboardingSignalReady);
      return;
    }

    if (event === 'result_collected') {
      this.openingTransactionActive = false;
      this.hideResultPointer();
      void this.refreshState();
      return;
    }

    if (event === 'drop_selected') {
      void this.refreshState();
    }
  }

  private syncChargedPointer(): void {
    if (!this.root || !this.metrics || !this.state || !this.isOpeningGuidanceAvailable()) {
      this.hideChargedPointer();
      return;
    }
    const shouldShow = shouldShowChargedOnboardingPointer(
      this.state,
      this.selectedPouchType,
      GAME_REGISTRY,
      LITE_V2_BALANCE,
    );
    if (!shouldShow) {
      this.hideChargedPointer();
      return;
    }
    if (this.chargedPointer) return;

    const { x, y } = this.getChargedCardPointerPosition();
    this.chargedPointer = createGuidancePointer(this, this.root, x, y, {
      travelX: this.metrics.compactChrome ? -34 : -24,
      durationMs: 620,
      repeatDelayMs: 360,
      angle: 180,
      scale: this.metrics.compactChrome ? 1.12 : 0.9,
    });
  }

  private hideChargedPointer(): void {
    this.chargedPointer?.destroy();
    this.chargedPointer = null;
  }

  private scheduleResultPointer(): void {
    this.hideResultPointer();
    this.resultPointerTimer = this.time.delayedCall(1020, () => {
      this.resultPointerTimer = null;
      if (!this.root || !this.metrics || !this.scene.isActive('OpeningScene')) return;
      this.resultPointer = createGuidancePointer(
        this,
        this.root,
        this.metrics.centerX + RESULT_PRESENTATION.panelMaxWidth / 2 + 26,
        RESULT_PRESENTATION.panelY + RESULT_PRESENTATION.hintY,
        {
          travelX: this.metrics.compactChrome ? -30 : -20,
          durationMs: 580,
          repeatDelayMs: 320,
          angle: 180,
          scale: this.metrics.compactChrome ? 1.08 : 0.86,
        },
      );
    });
  }

  private hideResultPointer(): void {
    this.resultPointerTimer?.remove(false);
    this.resultPointerTimer = null;
    this.resultPointer?.destroy();
    this.resultPointer = null;
  }

  private playFirstChargedEmphasis(): void {
    if (this.chargedEmphasisPlayed || !this.root || !this.metrics || !this.scene.isActive('OpeningScene')) return;
    this.chargedEmphasisPlayed = true;

    const ringA = this.add.circle(this.metrics.centerX, POUCH_Y + 82, 168, 0x7eeaff, 0).setStrokeStyle(4, 0x7eeaff, 0.76);
    const ringB = this.add.circle(this.metrics.centerX, POUCH_Y + 82, 136, 0xd39bff, 0).setStrokeStyle(3, 0xd39bff, 0.62);
    ringA.setScale(0.72).setAlpha(0.8);
    ringB.setScale(0.66).setAlpha(0.72);
    this.root.add([ringA, ringB]);

    this.tweens.add({
      targets: ringA,
      scale: 1.25,
      alpha: 0,
      duration: 720,
      ease: 'Cubic.Out',
      onComplete: () => ringA.destroy(),
    });
    this.tweens.add({
      targets: ringB,
      scale: 1.12,
      alpha: 0,
      duration: 560,
      delay: 80,
      ease: 'Cubic.Out',
      onComplete: () => ringB.destroy(),
    });
  }

  private enqueueHint(kind: HintKind, text: string): void {
    this.hintQueue.push({ kind, text });
    if (!this.hintShowing) this.showNextHint();
  }

  private showNextHint(): void {
    if (!this.root || !this.metrics || !this.scene.isActive('OpeningScene')) {
      this.hintShowing = false;
      return;
    }
    const next = this.hintQueue.shift();
    if (!next) {
      this.hintShowing = false;
      return;
    }
    this.hintShowing = true;
    this.hintContainer?.destroy(true);

    const compact = this.metrics.compactChrome;
    const width = compact
      ? Math.min(470, Math.max(360, this.metrics.logicalWidth * 0.36))
      : Math.min(390, Math.max(270, this.metrics.logicalWidth * 0.31));
    const signalY =
      this.metrics.safeTop +
      OPENING_FEEL_PRESENTATION.railTopOffset +
      (compact ? 92 : OPENING_FEEL_PRESENTATION.chipsHudHeight) +
      10 +
      (compact ? 100 : OPENING_FEEL_PRESENTATION.signalHudHeight) / 2;
    const x = Math.min(
      this.metrics.safeRight - width,
      this.metrics.safeLeft + (compact ? 300 : OPENING_FEEL_PRESENTATION.signalHudWidth) + 18,
    );
    const panelHeight = compact ? 80 : 60;
    const container = this.add.container(x, signalY - panelHeight / 2).setAlpha(0);
    const panel = this.add.graphics();
    panel.fillStyle(0x17101f, 0.94);
    panel.fillRoundedRect(0, 0, width, panelHeight, 14);
    panel.lineStyle(2, next.kind === 'signal-lock' ? 0xd39bff : 0x7eeaff, 0.74);
    panel.strokeRoundedRect(0, 0, width, panelHeight, 14);
    const label = this.add
      .text(16, panelHeight / 2, next.text, {
        color: '#f7efff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: compact ? '18px' : '14px',
        fontStyle: '600',
        wordWrap: { width: width - 32 },
        align: 'left',
      })
      .setOrigin(0, 0.5);
    container.add([panel, label]);
    this.root.add(container);
    this.hintContainer = container;

    this.tweens.add({
      targets: container,
      alpha: 1,
      x: x + 7,
      duration: 180,
      ease: 'Sine.Out',
      onComplete: () => {
        this.time.delayedCall(2200, () => {
          if (!container.active) return;
          this.tweens.add({
            targets: container,
            alpha: 0,
            y: container.y - 5,
            duration: 220,
            ease: 'Sine.In',
            onComplete: () => {
              if (container.active) container.destroy(true);
              if (this.hintContainer === container) this.hintContainer = null;
              this.hintShowing = false;
              this.showNextHint();
            },
          });
        });
      },
    });
  }

  private syncWaitingLabel(): void {
    if (!this.root || !this.metrics || !this.state || !this.isOpeningGuidanceAvailable() || this.state.pendingReveal !== null) {
      this.hideWaitingLabel();
      return;
    }
    const waiting = isSignalWaitingForCharged(this.state, GAME_REGISTRY, LITE_V2_BALANCE);
    if (!waiting || this.selectedPouchType === 'charged') {
      this.hideWaitingLabel();
      return;
    }
    if (this.waitingLabel) return;

    const { x, y } = this.getChargedCardPointerPosition();
    const text = getMessages(getPlatformRuntime().language).opening.signalWaitingCharged;
    const label = this.add
      .text(0, 0, text, {
        color: '#dcc2ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: this.metrics.compactChrome ? '17px' : '12px',
        fontStyle: '600',
        backgroundColor: '#17101fe8',
        padding: { x: 9, y: 6 },
      })
      .setOrigin(1, 0.5);
    const container = this.add.container(x - 12, y + 40, [label]).setAlpha(0);
    this.root.add(container);
    this.waitingLabel = container;
    this.tweens.add({ targets: container, alpha: 1, duration: 180, ease: 'Sine.Out' });
  }

  private hideWaitingLabel(): void {
    this.waitingLabel?.destroy(true);
    this.waitingLabel = null;
  }

  private isOpeningGuidanceAvailable(): boolean {
    return this.scene.isActive('OpeningScene') && !this.openingTransactionActive;
  }

  private hideOpeningGuidance(): void {
    this.hideChargedPointer();
    this.hideResultPointer();
    this.hideWaitingLabel();
    this.hintContainer?.destroy(true);
    this.hintContainer = null;
    this.hintShowing = false;
  }

  private getChargedCardPointerPosition(): { x: number; y: number } {
    const metrics = this.metrics!;
    const compact = metrics.compactChrome;
    const selectorTopOffset = compact ? 230 : OPENING_FEEL_PRESENTATION.selectorTopOffset;
    const railCardWidth = compact ? 300 : OPENING_FEEL_PRESENTATION.railCardWidth;
    const railCardHeight = compact ? 82 : OPENING_FEEL_PRESENTATION.railCardHeight;
    const railGap = compact ? 12 : OPENING_FEEL_PRESENTATION.railGap;
    const labelY = metrics.safeTop + selectorTopOffset;
    const firstCardY = labelY + (compact ? 30 : 20);
    const chargedY = firstCardY + railCardHeight + railGap;
    return {
      x: metrics.safeLeft + railCardWidth + (compact ? 44 : 34),
      y: chargedY + railCardHeight / 2,
    };
  }

  private rebuildRoot(): void {
    this.hideOpeningGuidance();
    this.root?.destroy(true);
    const ratio = getRenderPixelRatio();
    this.metrics = createLayoutMetrics(this.scale.width, this.scale.height, readSafeAreaInsets(ratio), ratio);
    this.root = this.add.container(this.metrics.offsetX, 0).setScale(this.metrics.scale).setDepth(10_000);
  }

  private handleResize(): void {
    this.rebuildRoot();
    this.syncChargedPointer();
    this.syncWaitingLabel();
  }

  private handleShutdown(): void {
    this.removeAnalyticsListener?.();
    this.removeAnalyticsListener = null;
    this.scale.off('resize', this.handleResize, this);
    this.hideOpeningGuidance();
    this.root?.destroy(true);
    this.root = null;
  }
}
