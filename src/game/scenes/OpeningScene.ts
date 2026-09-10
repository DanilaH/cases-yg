import Phaser from 'phaser';

import { getPlatformRuntime } from '../../app/runtime';
import { getMessages } from '../../i18n';
import { staticTextureKey } from '../data/artAssets';
import { LITE_V2_BALANCE, type ChipsCacheTierId, type PouchType } from '../data/balance';
import { GAME_LOOT_POOL_IDS, GAME_REGISTRY, type GameLootPoolId, type StandardRarity } from '../data/collectibles';
import {
  AMBIENT_PRESENTATION,
  COLLECTION_MILESTONE_PRESENTATION,
  getCarouselSpacing,
  getCarouselVisualState,
  getRewardTrayHeight,
  getCollectiblePresentation,
  getStandardResultPresence,
  MOTION_PRESENTATION,
  OPENING_FEEL_PRESENTATION,
  POUCH_PRESENTATION,
  REVEAL_FX_PRESETS,
  REVEAL_MOTION_PRESENTATION,
  RESULT_PRESENTATION,
  resolveCarouselIndex,
} from '../data/presentation';
import { getGameAudio } from '../systems/audio';
import { ensureLootPoolCollectibleArt, ensurePouchArt } from '../systems/artLoading';
import { getStandardLootPoolNearCompletion } from '../systems/collection';
import { chipEmissionDelay, createChipFlightPlan, shouldPlayChipClack } from '../systems/chipFlight';
import type { PendingReveal } from '../systems/drops';
import { createLayoutMetrics, readSafeAreaInsets, type LayoutMetrics } from '../systems/layout';
import { computeRewardTrayPlacement } from '../systems/rewardLayout';
import { createRewardBankingPlan, type RewardBankingOwner } from '../systems/rewardBanking';
import {
  canAffordPouch,
  crossedChargedReadyThreshold,
  getChargedCost,
  isSignalWaitingForCharged,
} from '../systems/openingEconomy';
import { OpeningSession } from '../systems/openingSession';
import {
  resolveCollectionMilestone,
  type CollectionMilestone,
  type CollectionMilestoneKind,
} from '../systems/collectionMilestones';
import { formatOverchargeMultiplier } from '../systems/overcharge';
import { MathRandomSource } from '../systems/random';
import { PresentationSkipController } from '../systems/presentationSkip';
import { SaveRepository, type SaveState } from '../systems/save';
import { persistMutedPreference } from '../systems/settings';
import { isStandardLootPoolComplete } from '../systems/signal';
import {
  createCollectibleVisual,
  createPouchVisual,
  createRevealRing,
  RARITY_REVEAL_COLORS,
  SECRET_PREMIUM_GOLD,
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

interface OpeningSceneData {
  lootPoolId?: GameLootPoolId;
}

interface DragState {
  pointerId: number;
  startPointerX: number;
  progress: number;
  lastPointerTime: number;
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
  private environmentRoot: Phaser.GameObjects.Container | null = null;
  private environmentLayoutKey = '';
  private environmentBaseLayerCount = 0;
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
  private secretPremiumTargets: Phaser.GameObjects.GameObject[] = [];
  private standardPresenceTargets: Phaser.GameObjects.GameObject[] = [];
  private resultBreathTarget: Phaser.GameObjects.Container | null = null;
  private resultBreathBaseScale = 1;
  private selectedPouchType: PouchType = 'basic';
  private requestedLootPoolId: GameLootPoolId | null = null;
  private previewLootPoolId: GameLootPoolId | null = null;
  private dropSwitchInFlight = false;
  private dropSwitchGeneration = 0;
  private dropPreviewDirection: -1 | 0 | 1 = 0;
  private dropSelectorContainer: Phaser.GameObjects.Container | null = null;
  private dropSelectorInteractiveZones: Phaser.GameObjects.Zone[] = [];
  private dropSelectorDrag: { pointerId: number; startX: number } | null = null;
  private dropCompletionNudgePoolId: GameLootPoolId | null = null;
  private pouchArtLoadInFlight = false;
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
  private collectionMilestoneTarget: Phaser.GameObjects.Container | null = null;
  private tearHint: Phaser.GameObjects.Text | null = null;
  private tearHintTimer: Phaser.Time.TimerEvent | null = null;
  private readonly presentationSkip = new PresentationSkipController();

  public constructor() {
    super('OpeningScene');
  }

  public init(data: OpeningSceneData = {}): void {
    this.requestedLootPoolId = data.lootPoolId ?? null;
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
    this.previewLootPoolId = null;
    this.dropSwitchInFlight = false;
    this.dropSwitchGeneration += 1;
    this.dropPreviewDirection = 0;
    this.dropSelectorDrag = null;
    this.dropCompletionNudgePoolId = null;
    this.pouchArtLoadInFlight = false;
    this.clearTearHintTimer();
    this.presentationSkip.reset();

    const platform = getPlatformRuntime();
    // Scene construction/async save + art initialization is still loading, not gameplay.
    // Keep Yandex GameplayAPI stopped until the first playable/recoverable frame is rendered.
    platform.activity.setGameplayDesired(false);

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
      registry: GAME_REGISTRY,
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

    let idleMessage: string | undefined;
    const requestedLootPoolId = this.requestedLootPoolId;
    this.requestedLootPoolId = null;
    const targetLootPoolId =
      requestedLootPoolId && !this.saveState.pendingReveal
        ? requestedLootPoolId
        : this.saveState.activeLootPoolId;

    try {
      await ensureLootPoolCollectibleArt(this, GAME_REGISTRY, targetLootPoolId);
    } catch (error: unknown) {
      console.warn('[art] active Drop collectible art failed to load; using fallbacks', error);
    }

    if (this.isSceneShutdown()) return;

    if (requestedLootPoolId && !this.saveState.pendingReveal) {
      try {
        const previousLootPoolId = this.saveState.activeLootPoolId;
        this.saveState = await this.session.selectLootPool(requestedLootPoolId);
        if (this.isSceneShutdown()) return;
        if (previousLootPoolId !== requestedLootPoolId) {
          platform.analytics.track('drop_selected', {
            lootPoolId: requestedLootPoolId,
            source: 'collection',
          });
        }
      } catch (error: unknown) {
        this.saveState = this.session.getState();
        if (this.isSceneShutdown()) return;
        idleMessage = getMessages(platform.language).opening.dropSwitchError;
        console.error('[drop] failed to apply Collection Drop selection', error);
      }
    }

    const pending = this.saveState.pendingReveal;
    if (pending) {
      this.selectedPouchType = pending.pouchType;
      if (pending.pouchType === 'charged') {
        try {
          await ensurePouchArt(this, 'charged');
        } catch (error: unknown) {
          console.warn('[art] recovered Charged Pouch art failed to load; using fallbacks', error);
        }
        if (this.isSceneShutdown()) return;
      }
    }
    this.renderIdle(idleMessage);
    // Gameplay becomes active only after save recovery + required active art are ready
    // and the first usable Opening frame exists. This keeps GameplayAPI.start aligned
    // with actual gameplay and makes it precede the idempotent Game Ready signal.
    platform.activity.setGameplayDesired(true);
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
    this.dropSwitchGeneration += 1;
    this.previewLootPoolId = null;
    this.dropSelectorDrag = null;
    this.clearTearHintTimer();
    this.input.off('pointerdown', this.handlePointerDown, this);
    this.input.off('pointermove', this.handlePointerMove, this);
    this.input.off('pointerup', this.handlePointerUp, this);
    this.scale.off('resize', this.handleResize, this);
    this.presentationSkip.reset();
    this.clearCollectionMilestoneMotion();
    getGameAudio().stopDragTexture(true);
    getGameAudio().clearResultAmbience();
    this.clearAmbientMotion();
    if (this.environmentRoot?.active) this.environmentRoot.destroy(true);
    this.environmentRoot = null;
    this.environmentLayoutKey = '';
    this.environmentBaseLayerCount = 0;
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
      getGameAudio().stopDragTexture();
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
    this.clearTearHintTimer();
    this.stopStarPulse();
    this.stopResultPanelPulse();
    this.stopRewardBreathing();
    this.clearSecretPremiumMotion();
    this.clearStandardPresenceMotion();
    this.clearCollectionMilestoneMotion();
    this.clearHudMotion();
    if (this.chargedAura) this.killContainerTreeTweens(this.chargedAura);
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
    this.dropSelectorContainer = null;
    this.dropSelectorInteractiveZones = [];
    this.dropSelectorDrag = null;
    this.chipsHudContainer = null;
    this.chipsHudText = null;
    this.signalHudContainer = null;
    this.signalHudSegments = [];
    this.chargedAura = null;
    this.rewardTrayContainer = null;
    this.collectionMilestoneTarget = null;
    this.tearHint = null;
    const metrics = createLayoutMetrics(this.scale.width, this.scale.height, readSafeAreaInsets());
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
    for (const particle of this.ambientParticles) {
      this.tweens.killTweensOf(particle);
    }
    this.ambientParticles = [];
  }

  private clearSecretPremiumMotion(): void {
    for (const target of this.secretPremiumTargets) {
      this.tweens.killTweensOf(target);
    }
    this.secretPremiumTargets = [];
  }

  private trackSecretPremiumTarget<T extends Phaser.GameObjects.GameObject>(target: T): T {
    this.secretPremiumTargets.push(target);
    return target;
  }

  private clearStandardPresenceMotion(): void {
    for (const target of this.standardPresenceTargets) this.tweens.killTweensOf(target);
    this.standardPresenceTargets = [];
  }

  private trackStandardPresenceTarget<T extends Phaser.GameObjects.GameObject>(target: T): T {
    this.standardPresenceTargets.push(target);
    return target;
  }

  private addPersistentStandardRarityState(
    parent: Phaser.GameObjects.Container,
    rarity: StandardRarity,
    x = 0,
    y = 0,
  ): void {
    const profile = getStandardResultPresence(rarity);
    if (!profile.enabled) return;

    const color = RARITY_REVEAL_COLORS[rarity];
    const layer = this.trackStandardPresenceTarget(this.add.container(x, y));
    layer.setData('standardResultPresence', { rarity, ...profile });

    const glow = this.trackStandardPresenceTarget(
      this.add
        .ellipse(0, 6, profile.glowWidth, profile.glowHeight, color, profile.glowAlpha)
        .setBlendMode(Phaser.BlendModes.ADD),
    );
    layer.add(glow);
    this.tweens.add({
      targets: glow,
      scale: profile.pulseScale,
      alpha: 1.3,
      duration: profile.pulseDurationMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    if (profile.ringAlpha > 0) {
      const ring = this.trackStandardPresenceTarget(
        this.add
          .circle(0, 2, Math.min(profile.glowWidth, profile.glowHeight) * 0.57, 0xffffff, 0)
          .setStrokeStyle(2, color, profile.ringAlpha)
          .setBlendMode(Phaser.BlendModes.ADD),
      );
      layer.add(ring);
      this.tweens.add({
        targets: ring,
        scale: profile.pulseScale + 0.025,
        alpha: 0.56,
        duration: profile.pulseDurationMs + 260,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }

    for (let index = 0; index < profile.sparkleCount; index += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const radius = Phaser.Math.FloatBetween(92, 146);
      const sparkle = this.trackStandardPresenceTarget(
        this.add
          .circle(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius * Phaser.Math.FloatBetween(0.62, 0.82),
            Phaser.Math.FloatBetween(1.4, 2.5),
            color,
            Phaser.Math.FloatBetween(0.14, 0.25),
          )
          .setBlendMode(Phaser.BlendModes.ADD),
      );
      layer.add(sparkle);
      const baseY = sparkle.y;
      this.tweens.add({
        targets: sparkle,
        y: baseY - Phaser.Math.FloatBetween(5, 11),
        alpha: Phaser.Math.FloatBetween(0.3, 0.48),
        scale: Phaser.Math.FloatBetween(1.2, 1.48),
        duration: Math.round(profile.pulseDurationMs * Phaser.Math.FloatBetween(0.78, 1.22)),
        delay: Phaser.Math.Between(120, 1250),
        yoyo: true,
        repeat: -1,
        repeatDelay: Phaser.Math.Between(420, 1700),
        ease: 'Sine.InOut',
      });
    }

    parent.add(layer);
  }

  private addPersistentSecretPremiumState(page: Phaser.GameObjects.Container): void {
    const layer = this.trackSecretPremiumTarget(this.add.container(0, 0));
    const backdrop = this.trackSecretPremiumTarget(
      this.add.ellipse(0, 10, 410, 320, 0x2a102a, 0.14).setBlendMode(Phaser.BlendModes.MULTIPLY),
    );
    const halo = this.trackSecretPremiumTarget(
      this.add.circle(0, 0, 158, SECRET_REVEAL_COLOR, 0.13).setBlendMode(Phaser.BlendModes.ADD),
    );
    const cloudA = this.trackSecretPremiumTarget(
      this.add.ellipse(-30, 12, 292, 182, SECRET_REVEAL_COLOR, 0.095).setBlendMode(Phaser.BlendModes.ADD),
    );
    const cloudB = this.trackSecretPremiumTarget(
      this.add.ellipse(44, -18, 238, 150, 0xa45cff, 0.075).setBlendMode(Phaser.BlendModes.ADD),
    );
    layer.add([backdrop, halo, cloudA, cloudB]);

    this.tweens.add({ targets: halo, scale: 1.06, alpha: 0.18, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.tweens.add({ targets: cloudA, x: 22, y: -4, angle: 3, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.tweens.add({ targets: cloudB, x: -18, y: 12, angle: -4, duration: 2100, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // Keep Secret premium presence distributed, but avoid a recognisable fixed
    // ten-point ring on every reveal. This is presentation-only randomness; the
    // persisted loot result is already resolved before this layer is created.
    const sparklePhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    for (let index = 0; index < 10; index += 1) {
      const premium = index % 3 === 0;
      const angle = sparklePhase + (Math.PI * 2 * index) / 10 + Phaser.Math.FloatBetween(-0.28, 0.28);
      const radius = Phaser.Math.FloatBetween(86, 158);
      const sparkle = this.trackSecretPremiumTarget(
        this.add.circle(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * Phaser.Math.FloatBetween(0.64, 0.82),
          premium ? Phaser.Math.FloatBetween(2.8, 3.5) : Phaser.Math.FloatBetween(1.8, 2.5),
          premium ? SECRET_PREMIUM_GOLD : SECRET_REVEAL_COLOR,
          premium ? Phaser.Math.FloatBetween(0.34, 0.48) : Phaser.Math.FloatBetween(0.22, 0.38),
        ).setBlendMode(Phaser.BlendModes.ADD),
      );
      layer.add(sparkle);
      const baseX = sparkle.x;
      const baseY = sparkle.y;
      this.tweens.add({
        targets: sparkle,
        x: baseX + Phaser.Math.FloatBetween(-11, 11),
        y: baseY - Phaser.Math.FloatBetween(11, 23),
        alpha: premium ? Phaser.Math.FloatBetween(0.72, 0.9) : Phaser.Math.FloatBetween(0.48, 0.64),
        scale: premium ? Phaser.Math.FloatBetween(1.42, 1.62) : Phaser.Math.FloatBetween(1.18, 1.34),
        duration: Phaser.Math.Between(1050, 1980),
        delay: Phaser.Math.Between(0, 900),
        yoyo: true,
        repeat: -1,
        repeatDelay: Phaser.Math.Between(260, 980),
        ease: 'Sine.InOut',
      });
    }

    page.add(layer);
    page.sendToBack(layer);
  }

  private addAmbientMotion(root: Phaser.GameObjects.Container, metrics: LayoutMetrics): void {
    const colors = [0xf4e5ff, 0xb9efff, 0xffe7f2];

    // Large, extremely faint pools keep the authored room from reading as a
    // frozen backdrop once the audio bed is alive. They remain behind gameplay
    // chrome and move on deliberately slow, asynchronous cycles.
    for (let index = 0; index < AMBIENT_PRESENTATION.glowCount; index += 1) {
      const radius = Phaser.Math.FloatBetween(
        AMBIENT_PRESENTATION.minGlowRadius,
        AMBIENT_PRESENTATION.maxGlowRadius,
      );
      const x = Phaser.Math.FloatBetween(metrics.logicalWidth * 0.24, metrics.logicalWidth * 0.82);
      const y = Phaser.Math.FloatBetween(150, 570);
      const alpha = Phaser.Math.FloatBetween(
        AMBIENT_PRESENTATION.minGlowAlpha,
        AMBIENT_PRESENTATION.maxGlowAlpha,
      );
      const glow = this.add
        .circle(x, y, radius, colors[index % colors.length], alpha)
        .setScale(Phaser.Math.FloatBetween(1.25, 1.75), Phaser.Math.FloatBetween(0.52, 0.82))
        .setBlendMode(Phaser.BlendModes.ADD);
      root.add(glow);
      this.ambientParticles.push(glow);

      const baseScaleX = glow.scaleX;
      const baseScaleY = glow.scaleY;
      this.tweens.add({
        targets: glow,
        x: x + Phaser.Math.FloatBetween(-38, 38),
        y: y + Phaser.Math.FloatBetween(-24, 24),
        alpha: Math.min(AMBIENT_PRESENTATION.maxGlowAlpha * 1.35, alpha * Phaser.Math.FloatBetween(1.08, 1.3)),
        scaleX: baseScaleX * Phaser.Math.FloatBetween(1.025, 1.06),
        scaleY: baseScaleY * Phaser.Math.FloatBetween(1.025, 1.07),
        duration: Phaser.Math.Between(
          AMBIENT_PRESENTATION.minGlowDuration,
          AMBIENT_PRESENTATION.maxGlowDuration,
        ),
        delay: Phaser.Math.Between(0, 3200),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }

    for (let index = 0; index < AMBIENT_PRESENTATION.count; index += 1) {
      const radius = Phaser.Math.FloatBetween(AMBIENT_PRESENTATION.minRadius, AMBIENT_PRESENTATION.maxRadius);
      const alpha = Phaser.Math.FloatBetween(AMBIENT_PRESENTATION.minAlpha, AMBIENT_PRESENTATION.maxAlpha);
      const x = Phaser.Math.FloatBetween(54, Math.max(55, metrics.logicalWidth - 54));
      const y = Phaser.Math.FloatBetween(108, 622);
      const particle = this.add
        .circle(x, y, radius, colors[Phaser.Math.Between(0, colors.length - 1)], alpha)
        .setBlendMode(Phaser.BlendModes.ADD);
      root.add(particle);
      this.ambientParticles.push(particle);

      const driftX = Phaser.Math.FloatBetween(-AMBIENT_PRESENTATION.maxDriftX, AMBIENT_PRESENTATION.maxDriftX);
      const driftY = Phaser.Math.FloatBetween(-AMBIENT_PRESENTATION.maxDriftY, AMBIENT_PRESENTATION.maxDriftY);
      const targetAlpha = Math.min(0.24, alpha * Phaser.Math.FloatBetween(1.2, 1.72));
      this.tweens.add({
        targets: particle,
        x: x + driftX,
        y: y + driftY,
        alpha: targetAlpha,
        scale: Phaser.Math.FloatBetween(0.82, 1.34),
        duration: Phaser.Math.Between(AMBIENT_PRESENTATION.minDuration, AMBIENT_PRESENTATION.maxDuration),
        delay: Phaser.Math.Between(0, 3400),
        yoyo: true,
        repeat: -1,
        repeatDelay: Phaser.Math.Between(120, 1500),
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
      angle: OPENING_FEEL_PRESENTATION.tearHintNudgeAngle,
      scale: MOTION_PRESENTATION.starPulseScale,
      duration: MOTION_PRESENTATION.starPulseDuration,
      yoyo: true,
      repeat: OPENING_FEEL_PRESENTATION.tearHintNudgeRepeats,
      ease: 'Sine.InOut',
      onComplete: () => {
        if (this.pouch?.tab.active) this.pouch.tab.setAngle(0).setScale(1);
      },
    });
  }

  private stopStarPulse(): void {
    if (!this.pouch) return;
    this.tweens.killTweensOf(this.pouch.tab);
    this.pouch.tab.setScale(1).setAlpha(1).setAngle(0);
  }

  private clearTearHintTimer(): void {
    this.tearHintTimer?.remove(false);
    this.tearHintTimer = null;
  }

  private hideTearHint(): void {
    this.clearTearHintTimer();
    if (!this.tearHint?.active) return;
    this.tweens.killTweensOf(this.tearHint);
    this.tearHint.setAlpha(0).setX(this.metrics?.centerX ?? this.tearHint.x);
    this.stopStarPulse();
  }

  private scheduleTearHint(): void {
    this.clearTearHintTimer();
    if (this.phase !== 'idle' || this.dropSwitchInFlight || this.pouchArtLoadInFlight) return;
    this.tearHintTimer = this.time.delayedCall(
      OPENING_FEEL_PRESENTATION.tearHintIdleDelayMs,
      () => this.showTearHint(),
    );
  }

  private showTearHint(): void {
    this.tearHintTimer = null;
    if (
      this.phase !== 'idle' ||
      this.dropSwitchInFlight ||
      this.pouchArtLoadInFlight ||
      !this.tearHint?.active ||
      !this.pouch?.tab.active
    ) return;
    const centerX = this.metrics?.centerX ?? this.tearHint.x;
    this.tearHint.setX(centerX).setAlpha(0);
    this.tweens.add({
      targets: this.tearHint,
      alpha: 1,
      x: centerX + 6,
      duration: 150,
      yoyo: true,
      repeat: OPENING_FEEL_PRESENTATION.tearHintNudgeRepeats,
      ease: 'Sine.InOut',
      onComplete: () => {
        if (this.tearHint?.active) this.tearHint.setX(centerX).setAlpha(1);
      },
    });
    this.startStarPulse();
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
    this.renderDropSelector(root);

    const displayedLootPoolId = this.getDisplayedLootPoolId();
    if (this.selectedPouchType === 'charged') this.renderChargedPouchAura(root);
    this.pouch = createPouchVisual(
      this,
      root,
      metrics.centerX,
      POUCH_Y,
      this.selectedPouchType,
      displayedLootPoolId,
    );
    getGameAudio().primeDragTexture();
    this.pouch.dragZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.beginDrag(pointer));
    this.renderPouchSelector(root);
    if (this.chargedReadyPulsePending) {
      this.chargedReadyPulsePending = false;
      this.showChargedReadyOnSelector();
    }

    const tearHintY = metrics.safeTop + 82;
    const tearHint = this.add
      .text(metrics.centerX, tearHintY, getMessages(getPlatformRuntime().language).opening.tearHint, {
        color: '#efe7f6',
        backgroundColor: '#2a2037',
        padding: { x: 12, y: 7 },
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setShadow(0, 2, '#120d19', 3, true, true);
    root.add(tearHint);
    this.tearHint = tearHint;
    this.scheduleTearHint();

    if (this.dropPreviewDirection) {
      const direction = this.dropPreviewDirection;
      this.dropPreviewDirection = 0;
      this.animateDropPreview(direction);
    }

    if (message) {
      root.add(
        this.add
          .text(metrics.centerX, tearHintY + 38, message, {
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
    const lockReady = clamped >= threshold;
    const waitingForCharged = isSignalWaitingForCharged(state, GAME_REGISTRY, LITE_V2_BALANCE);
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
        stroke: '#160f20',
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

  private getDisplayedLootPoolId(): GameLootPoolId {
    if (this.previewLootPoolId) return this.previewLootPoolId;
    const active = this.saveState?.activeLootPoolId as GameLootPoolId | undefined;
    return active && GAME_LOOT_POOL_IDS.includes(active) ? active : GAME_LOOT_POOL_IDS[0];
  }

  private getDisplayedDropIndex(): number {
    const index = GAME_LOOT_POOL_IDS.indexOf(this.getDisplayedLootPoolId());
    return index >= 0 ? index : 0;
  }

  private renderDropSelector(root: Phaser.GameObjects.Container): void {
    if (!this.metrics || !this.saveState) return;
    const messages = getMessages(getPlatformRuntime().language);
    const index = this.getDisplayedDropIndex();
    const poolId = this.getDisplayedLootPoolId();
    const ownedStandards = new Set(this.saveState.discoveredStandard);
    const ownedSecrets = new Set(this.saveState.discoveredSecrets);
    const standards = GAME_REGISTRY.standardItems.filter((item) => item.lootPoolId === poolId);
    const secrets = GAME_REGISTRY.secrets.filter((item) => item.lootPoolId === poolId);
    const standardCount = standards.filter(({ collectible }) => ownedStandards.has(collectible.id)).length;
    const secretCount = secrets.filter(({ collectible }) => ownedSecrets.has(collectible.id)).length;
    const width = Math.min(
      OPENING_FEEL_PRESENTATION.dropSelectorMaxWidth,
      Math.max(OPENING_FEEL_PRESENTATION.dropSelectorMinWidth, this.metrics.logicalWidth * 0.48),
    );
    const height = OPENING_FEEL_PRESENTATION.dropSelectorHeight;
    const x = this.metrics.centerX;
    const y = this.metrics.safeBottom - OPENING_FEEL_PRESENTATION.dropSelectorBottomInset - height;
    const panel = this.add.container(x, y);
    this.dropSelectorContainer = panel;

    const background = this.add.graphics();
    background.fillStyle(0x15101f, 0.94);
    background.fillRoundedRect(-width / 2, 0, width, height, 20);
    background.lineStyle(2, 0x8df8ff, 0.46);
    background.strokeRoundedRect(-width / 2, 0, width, height, 20);
    const inner = this.add.graphics().setAlpha(0.42);
    inner.lineStyle(1, 0xf2ddff, 0.24);
    inner.strokeRoundedRect(-width / 2 + 4, 4, width - 8, height - 8, 17);

    const label = this.add
      .text(0, 12, `${messages.opening.drop} ${index + 1}/${GAME_LOOT_POOL_IDS.length} · ${messages.drops[poolId]}`, {
        color: '#fbf7ff',
        stroke: '#100b16',
        strokeThickness: 2,
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: getPlatformRuntime().language === 'ru' ? '9px' : '10px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);
    const standardsLabel = messages.collection.standards.toUpperCase();
    const secretsLabel = messages.collection.secrets.toUpperCase();
    const progress = this.add
      .text(0, 43, `${standardsLabel} ${standardCount}/${standards.length}   ·   ${secretsLabel} ${secretCount}/${secrets.length}`, {
        color: '#9feaf4',
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: '8px',
      })
      .setOrigin(0.5, 0);

    const previousBack = this.add
      .circle(-width / 2 + 34, height / 2, 25, 0x332742, 0.96)
      .setStrokeStyle(1.5, 0xdccdf0, 0.28);
    const nextBack = this.add
      .circle(width / 2 - 34, height / 2, 25, 0x332742, 0.96)
      .setStrokeStyle(1.5, 0xdccdf0, 0.28);
    const previous = this.add
      .text(previousBack.x, previousBack.y - 2, '‹', {
        color: '#f4edff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
      })
      .setOrigin(0.5);
    const next = this.add
      .text(nextBack.x, nextBack.y - 2, '›', {
        color: '#f4edff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
      })
      .setOrigin(0.5);
    const hitWidth = OPENING_FEEL_PRESENTATION.dropSelectorArrowHitWidth;
    const previousHit = this.add
      .zone(previousBack.x, height / 2, hitWidth, height)
      .setInteractive({ useHandCursor: true });
    const nextHit = this.add
      .zone(nextBack.x, height / 2, hitWidth, height)
      .setInteractive({ useHandCursor: true });
    const swipeHit = this.add
      .zone(0, height / 2, Math.max(80, width - hitWidth * 2), height)
      .setInteractive({ useHandCursor: true });

    const pressArrow = (
      direction: -1 | 1,
      back: Phaser.GameObjects.Arc,
      arrow: Phaser.GameObjects.Text,
    ): void => {
      if (this.phase !== 'idle' || this.pouchArtLoadInFlight) return;
      this.hideTearHint();
      this.tweens.killTweensOf([back, arrow]);
      this.tweens.add({
        targets: [back, arrow],
        scale: 0.91,
        duration: OPENING_FEEL_PRESENTATION.uiPressMs,
        yoyo: true,
        ease: 'Sine.Out',
      });
      void this.switchDrop(direction);
    };
    previousHit.on('pointerup', () => pressArrow(-1, previousBack, previous));
    nextHit.on('pointerup', () => pressArrow(1, nextBack, next));

    swipeHit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== 'idle' || this.pouchArtLoadInFlight) return;
      this.hideTearHint();
      this.dropSelectorDrag = { pointerId: pointer.id, startX: pointer.x };
    });
    swipeHit.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const drag = this.dropSelectorDrag;
      this.dropSelectorDrag = null;
      if (!drag || drag.pointerId !== pointer.id || this.phase !== 'idle' || !this.metrics) return;
      const deltaX = (pointer.x - drag.startX) / this.metrics.scale;
      if (Math.abs(deltaX) < OPENING_FEEL_PRESENTATION.dropSelectorSwipeThreshold) {
        this.scheduleTearHint();
        return;
      }
      void this.switchDrop(deltaX < 0 ? 1 : -1);
    });
    swipeHit.on('pointerout', () => {
      this.dropSelectorDrag = null;
    });

    panel.add([background, inner, label, progress, previousBack, nextBack, previous, next, previousHit, nextHit, swipeHit]);
    root.add(panel);
    this.dropSelectorInteractiveZones = [previousHit, nextHit, swipeHit];

    this.tweens.add({
      targets: inner,
      alpha: 0.7,
      duration: 1450,
      yoyo: true,
      repeat: -1,
      repeatDelay: 2600,
      ease: 'Sine.InOut',
    });

    const shouldNudgeNext = this.dropCompletionNudgePoolId === poolId;
    if (shouldNudgeNext) {
      this.dropCompletionNudgePoolId = null;
      const nextLabel = this.add
        .text(width / 2 - 68, 66, messages.opening.nextDrop, {
          color: '#8df8ff',
          stroke: '#100b16',
          strokeThickness: 2,
          fontFamily: DIGITAL_FONT_FAMILY,
          fontSize: '6px',
          fontStyle: 'bold',
        })
        .setOrigin(1, 0.5)
        .setAlpha(0);
      panel.add(nextLabel);
      this.tweens.add({
        targets: [nextBack, next],
        scale: 1.1,
        duration: 230,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.InOut',
      });
      this.tweens.add({
        targets: nextLabel,
        alpha: 1,
        x: nextLabel.x + 4,
        duration: 250,
        yoyo: true,
        repeat: 2,
        hold: 220,
        ease: 'Sine.InOut',
      });
    }
  }

  private animateDropPreview(direction: -1 | 1): void {
    if (!this.pouch?.group.active || !this.dropSelectorContainer?.active) return;
    const pouch = this.pouch.group;
    const panel = this.dropSelectorContainer;
    const pouchX = pouch.x;
    const panelX = panel.x;
    pouch.setX(pouchX + direction * 12).setAlpha(0.78);
    panel.setX(panelX + direction * 8).setAlpha(0.82);
    this.tweens.add({
      targets: pouch,
      x: pouchX,
      alpha: 1,
      duration: OPENING_FEEL_PRESENTATION.dropSelectorSwitchMs,
      ease: 'Cubic.Out',
    });
    this.tweens.add({
      targets: panel,
      x: panelX,
      alpha: 1,
      duration: OPENING_FEEL_PRESENTATION.dropSelectorSwitchMs,
      ease: 'Cubic.Out',
    });
  }

  private async switchDrop(direction: -1 | 1): Promise<void> {
    if (this.phase !== 'idle' || this.pouchArtLoadInFlight || !this.session || !this.saveState) return;
    const currentIndex = this.getDisplayedDropIndex();
    const nextIndex = (currentIndex + direction + GAME_LOOT_POOL_IDS.length) % GAME_LOOT_POOL_IDS.length;
    const nextPoolId: GameLootPoolId = GAME_LOOT_POOL_IDS[nextIndex] ?? GAME_LOOT_POOL_IDS[0];

    this.dropPreviewDirection = direction;
    this.previewLootPoolId = nextPoolId;
    this.dropSwitchGeneration += 1;
    this.dropCompletionNudgePoolId = null;
    this.hideTearHint();
    getGameAudio().play('ui-click');

    // Preview is immediate: pouch skin + selector follow the user's latest intent.
    // Durable storage remains serialized in reconcileDropSelection().
    this.renderIdle();
    void this.reconcileDropSelection();
  }

  private async reconcileDropSelection(): Promise<void> {
    if (this.dropSwitchInFlight || !this.session || !this.saveState || this.phase !== 'idle') return;
    this.dropSwitchInFlight = true;

    try {
      while (!this.isSceneShutdown() && this.phase === 'idle' && this.session && this.saveState) {
        const generation = this.dropSwitchGeneration;
        const target = this.previewLootPoolId ?? (this.session.getState().activeLootPoolId as GameLootPoolId);
        const durableBefore = this.session.getState().activeLootPoolId as GameLootPoolId;

        if (target === durableBefore) {
          if (generation === this.dropSwitchGeneration) {
            this.saveState = this.session.getState();
            this.previewLootPoolId = null;
            this.dropSwitchInFlight = false;
            this.renderIdle();
            return;
          }
          continue;
        }

        try {
          await ensureLootPoolCollectibleArt(this, GAME_REGISTRY, target);
        } catch (error: unknown) {
          console.warn('[art] target Drop collectible art failed to load; using fallbacks', error);
        }
        if (this.isSceneShutdown() || this.phase !== 'idle') return;

        // A newer swipe/click supersedes this target before any durable mutation.
        if (generation !== this.dropSwitchGeneration) continue;

        try {
          const selected = await this.session.selectLootPool(target);
          this.saveState = selected;
        } catch (error: unknown) {
          this.saveState = this.session.getState();
          if (generation !== this.dropSwitchGeneration) continue;
          this.previewLootPoolId = null;
          console.error('[drop] failed to switch Drop', error);
          this.dropSwitchInFlight = false;
          this.renderIdle(getMessages(getPlatformRuntime().language).opening.dropSwitchError);
          return;
        }
        if (this.isSceneShutdown() || this.phase !== 'idle') return;

        if (generation !== this.dropSwitchGeneration) {
          // The just-finished durable write is now intermediate. Keep UI on the
          // latest preview and serialize one more write instead of repainting stale state.
          continue;
        }

        getPlatformRuntime().analytics.track('drop_selected', {
          lootPoolId: target,
          source: 'opening',
        });
        this.previewLootPoolId = null;
        this.dropSwitchInFlight = false;
        this.renderIdle();
        return;
      }
    } finally {
      if (this.isSceneShutdown() || this.phase !== 'idle') {
        this.dropSwitchInFlight = false;
      }
    }

    this.dropSwitchInFlight = false;
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
      card.setData('baseX', railX);
      card.setData('baseY', y);
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
        void this.selectPouchType(pouchType, card);
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
    const chargedCard = createCard(
      'charged',
      firstCardY + height + OPENING_FEEL_PRESENTATION.railGap,
      `⚡ ${messages.opening.chargedPouch}`,
      chargedAvailable
        ? `${cost} ${messages.opening.chips}`
        : `${this.saveState.chips}/${cost} ${messages.opening.chips}`,
      chargedAvailable,
    );
    if (chargedAvailable && this.selectedPouchType !== 'charged') {
      this.startPaidPouchAvailabilityPulse(chargedCard, this.saveState.signal >= LITE_V2_BALANCE.signalThreshold);
    }
  }

  private startPaidPouchAvailabilityPulse(card: Phaser.GameObjects.Container, linkedToSignal: boolean): void {
    const width = OPENING_FEEL_PRESENTATION.railCardWidth;
    const height = OPENING_FEEL_PRESENTATION.railCardHeight;
    const outline = this.add.graphics().setAlpha(0.04);
    outline.lineStyle(2.5, linkedToSignal ? 0x9d7cff : CHARGED_ACCENT, linkedToSignal ? 0.72 : 0.46);
    outline.strokeRoundedRect(2, 2, width - 4, height - 4, 14);
    card.add(outline);
    this.tweens.add({
      targets: outline,
      alpha: linkedToSignal ? 0.34 : 0.2,
      duration: linkedToSignal ? 520 : 720,
      yoyo: true,
      repeat: -1,
      repeatDelay: linkedToSignal ? 1550 : 3300,
      ease: 'Sine.InOut',
    });
  }

  private showUnavailableChargedFeedback(card: Phaser.GameObjects.Container): void {
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

  private async selectPouchType(pouchType: PouchType, sourceCard?: Phaser.GameObjects.Container): Promise<void> {
    if (
      this.phase !== 'idle' ||
      this.dropSwitchInFlight ||
      this.pouchArtLoadInFlight ||
      !this.saveState ||
      this.selectedPouchType === pouchType
    ) return;
    if (!canAffordPouch(this.saveState, pouchType, LITE_V2_BALANCE)) return;

    this.pouchArtLoadInFlight = true;
    try {
      await ensurePouchArt(this, pouchType);
    } catch (error: unknown) {
      console.warn(`[art] ${pouchType} Pouch art failed to load; using fallbacks`, error);
    }
    if (this.isSceneShutdown()) {
      this.pouchArtLoadInFlight = false;
      return;
    }
    if (this.phase !== 'idle' || !this.saveState || !canAffordPouch(this.saveState, pouchType, LITE_V2_BALANCE)) {
      this.pouchArtLoadInFlight = false;
      return;
    }

    this.selectedPouchType = pouchType;
    getGameAudio().play('pouch-select');
    if (sourceCard?.active) {
      this.tweens.killTweensOf(sourceCard);
      this.tweens.add({
        targets: sourceCard,
        scale: 1.025,
        duration: OPENING_FEEL_PRESENTATION.uiPressMs,
        yoyo: true,
        ease: 'Sine.Out',
      });
    }
    if (this.pouch?.group.active) {
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
      this.pouchArtLoadInFlight = false;
      if (this.phase === 'idle' && !this.isSceneShutdown()) this.renderIdle();
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

  private killContainerTreeTweens(container: Phaser.GameObjects.Container): void {
    this.tweens.killTweensOf(container);
    for (const child of container.list) {
      this.tweens.killTweensOf(child);
      if (child instanceof Phaser.GameObjects.Container) this.killContainerTreeTweens(child);
    }
  }

  private startChargedAuraExit(delay: number, duration: number): void {
    const aura = this.chargedAura;
    if (!aura?.active) return;
    this.tweens.killTweensOf(aura);
    const targetY = aura.y + 18;
    this.tweens.add({
      targets: aura,
      y: targetY,
      scale: 0.965,
      alpha: 0,
      delay,
      duration,
      ease: 'Cubic.InOut',
      onComplete: () => {
        if (aura.active) {
          this.killContainerTreeTweens(aura);
          aura.destroy(true);
        }
        if (this.chargedAura === aura) this.chargedAura = null;
      },
    });
  }

  private getChipsHudTarget(): { x: number; y: number } {
    if (!this.metrics) return { x: 36, y: 24 };
    return {
      x: this.metrics.safeLeft + 25,
      y: this.metrics.safeTop + OPENING_FEEL_PRESENTATION.railTopOffset + OPENING_FEEL_PRESENTATION.chipsHudHeight / 2,
    };
  }

  private getBottomActionY(): number {
    const safeBottom = this.metrics?.safeBottom ?? LOGICAL_HEIGHT - 28;
    return safeBottom - OPENING_FEEL_PRESENTATION.bottomActionInset;
  }

  private getHiddenPocketHeadingY(): number {
    return RESULT_PRESENTATION.panelY - RESULT_PRESENTATION.panelHeight / 2 - 24;
  }

  private createCollectionButton(root: Phaser.GameObjects.Container, enabled: boolean): void {
    if (!this.metrics) return;

    const button = this.add
      .text(this.metrics.safeRight, this.getBottomActionY(), getMessages(getPlatformRuntime().language).opening.collection, {
        color: '#f5eefc',
        backgroundColor: '#312746',
        padding: { x: 16, y: 10 },
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
      })
      .setOrigin(1, 0.5);

    if (enabled) {
      button.setInteractive({ useHandCursor: true });
      button.on('pointerup', () => {
        if (this.dropSwitchInFlight || this.pouchArtLoadInFlight) return;
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
    for (const zone of this.dropSelectorInteractiveZones) {
      if (zone.input) zone.input.enabled = enabled;
    }
  }

  private hideDropSelectorForReveal(): void {
    if (!this.dropSelectorContainer?.active) return;
    for (const zone of this.dropSelectorInteractiveZones) zone.disableInteractive();
    this.dropSelectorDrag = null;
    this.tweens.killTweensOf(this.dropSelectorContainer);
    this.tweens.add({
      targets: this.dropSelectorContainer,
      alpha: 0,
      y: this.dropSelectorContainer.y + 6,
      duration: OPENING_FEEL_PRESENTATION.uiFadeOutMs,
      ease: 'Sine.In',
    });
  }

  private beginDrag(pointer: Phaser.Input.Pointer): void {
    if (this.phase !== 'idle' || this.dropSwitchInFlight || this.pouchArtLoadInFlight || !this.pouch || !this.metrics) return;

    this.hideTearHint();
    this.stopStarPulse();
    getGameAudio().primeDragTexture();
    getGameAudio().play('pouch-grab');
    this.phase = 'dragging';
    this.drag = {
      pointerId: pointer.id,
      startPointerX: pointer.x,
      progress: 0,
      lastPointerTime: pointer.time,
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
    if (this.phase === 'idle') {
      this.hideTearHint();
      this.scheduleTearHint();
      return;
    }
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
    const previousProgress = this.drag.progress;
    const elapsedSeconds = Math.max(0.008, (pointer.time - this.drag.lastPointerTime) / 1000);
    const progressDelta = Math.abs(progress - previousProgress);
    const normalizedVelocity = Phaser.Math.Clamp(progressDelta / elapsedSeconds / 4, 0, 1);
    this.drag.progress = progress;
    this.drag.lastPointerTime = pointer.time;
    if (progress > 0.005 && progressDelta > 0.0005) {
      getGameAudio().setDragTexture(progress, normalizedVelocity);
    }
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
        const previousIndex = this.resultCarouselIndex;
        this.resultCarouselIndex = resolveCarouselIndex(
          this.resultCarouselIndex,
          this.resultCarouselItems.length,
          gesture.deltaX,
        );
        if (this.resultCarouselIndex !== previousIndex) getGameAudio().play('carousel-switch');
        this.positionResultCarousel(0, true);
        this.syncCarouselRewardBreathing();
        if (this.lastReveal && this.root) {
          this.renderRewardTray(this.lastReveal, this.root, false);
          this.renderResultActionPanel(this.lastReveal);
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

    getGameAudio().stopDragTexture();
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
        if (this.phase === 'idle') this.scheduleTearHint();
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
    getGameAudio().stopDragTexture(true);
    this.phase = 'revealing';
    this.drag = null;
    this.hideTearHint();
    this.presentationSkip.guardUntilTime(this.time.now + OPENING_FEEL_PRESENTATION.postTearSkipGuardMs);
    this.pouch?.dragZone.disableInteractive();
    this.setChromeEnabled(false);
    this.hideDropSelectorForReveal();
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

      await this.animateSignalLockConsumptionPrelude(pending);
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

    const collectionMilestone = resolveCollectionMilestone(GAME_REGISTRY, pending, committed);
    const activeStandards = GAME_REGISTRY.standardItems.filter(
      (item) => item.lootPoolId === pending.lootPoolId,
    );
    if (
      pending.standard.isNew &&
      activeStandards.length > 0 &&
      activeStandards.every(({ collectible }) => committed.discoveredStandard.includes(collectible.id))
    ) {
      this.dropCompletionNudgePoolId = pending.lootPoolId as GameLootPoolId;
    }
    this.saveState = committed;
    this.trackRevealCompletion(pending, committed);
    this.phase = 'result';
    this.resultReady = false;

    this.deferredResize = false;
    this.renderResolvedResult(pending);
    if (collectionMilestone) this.showCollectionMilestone(collectionMilestone);
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
    const secretSelected = Boolean(pending.hiddenPocket && this.resultCarouselIndex === 1);
    const width = OPENING_FEEL_PRESENTATION.rewardTrayWidth;
    const left = -width / 2;
    const contentLeft = left + OPENING_FEEL_PRESENTATION.rewardTrayContentInset;
    const contentRight = width / 2 - OPENING_FEEL_PRESENTATION.rewardTrayContentInset;
    const iconX = contentLeft + 4;
    const textX = contentLeft + 18;
    const tray = this.add.container(0, 0);
    const background = this.add.graphics();
    tray.add(background);

    const rarityCode = secretSelected ? 'SECRET' : pending.standard.rarity.toUpperCase();
    const rarityColor = secretSelected
      ? '#ff4d6d'
      : `#${RARITY_REVEAL_COLORS[pending.standard.rarity].toString(16).padStart(6, '0')}`;
    const header = this.add.text(textX, 9, 'REWARD', {
      color: '#d9cbef',
      fontFamily: DIGITAL_FONT_FAMILY,
      fontSize: '7px',
    });
    const rarity = this.add.text(contentRight, 9, rarityCode, {
      color: rarityColor,
      fontFamily: DIGITAL_FONT_FAMILY,
      fontSize: '6px',
      fontStyle: 'bold',
    }).setOrigin(1, 0);
    tray.add([header, rarity]);

    let cursorY = 31;
    if (secretSelected && pending.hiddenPocket) {
      const secretStatus = pending.hiddenPocket.isNew
        ? messages.opening.secretDiscovered
        : messages.opening.secretDuplicate;
      const status = this.add.text(textX, cursorY - 2, secretStatus, {
        color: '#ff7088',
        stroke: '#100b16',
        strokeThickness: 2,
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: '8px',
        fontStyle: 'bold',
      });
      tray.add(status);
      cursorY += 23;

      if (pending.chips.secretBonus > 0) {
        const token = createChipToken(this, iconX, cursorY + 4, 0.48);
        const bonus = this.add.text(textX, cursorY - 3, `+${pending.chips.secretBonus} ${messages.opening.chips}`, {
          color: '#ffd36a',
          stroke: '#100b16',
          strokeThickness: 2,
          fontFamily: DIGITAL_FONT_FAMILY,
          fontSize: '9px',
        });
        tray.add([token, bonus]);
        cursorY += 23;
      }

      if (pending.hiddenPocket.isNew) {
        const collection = this.add.text(textX, cursorY, messages.opening.addedToCollection, {
          color: '#ffdca0',
          stroke: '#100b16',
          strokeThickness: 2,
          fontFamily: DIGITAL_FONT_FAMILY,
          fontSize: '6px',
        });
        tray.add(collection);
        cursorY += 18;
      }
    } else {
      const cacheLabel = this.getCacheLabel(pending.chips.cacheTier);
      const standardTotal = pending.chips.totalEarned - pending.chips.secretBonus;
      const breakdownParts = [`${messages.opening.chips} +${pending.chips.base}`];
      if (cacheLabel && pending.chips.cacheBonus > 0) breakdownParts.push(`${cacheLabel} +${pending.chips.cacheBonus}`);
      if (pending.chips.recycle > 0) breakdownParts.push(`${messages.opening.recycled} +${pending.chips.recycle}`);
      if (pending.chips.overchargeBonus > 0) breakdownParts.push(`${messages.opening.overcharge} +${pending.chips.overchargeBonus}`);

      const totalIcon = createChipToken(this, iconX, cursorY + 4, 0.48);
      const animatedTotalStart = animate && pending.chips.overchargeBonus > 0
        ? pending.chips.rawEarned
        : standardTotal;
      const totalText = this.add.text(textX, cursorY - 3, `+${animatedTotalStart} ${messages.opening.chips}`, {
        color: '#f4feff',
        stroke: '#100b16',
        strokeThickness: 2,
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: '9px',
      });
      tray.add([totalIcon, totalText]);
      cursorY += 21;

      if (breakdownParts.length > 1) {
        const breakdownRows = breakdownParts.length <= 2
          ? [breakdownParts.join(' · ')]
          : [breakdownParts.slice(0, 2).join(' · '), breakdownParts.slice(2).join(' · ')];
        for (const row of breakdownRows) {
          const breakdown = this.add.text(textX, cursorY, row, {
            color: '#b9c8d7',
            stroke: '#100b16',
            strokeThickness: 2,
            fontFamily: DIGITAL_FONT_FAMILY,
            fontSize: '6px',
            wordWrap: { width: width - 48, useAdvancedWrap: true },
          });
          tray.add(breakdown);
          cursorY += Math.max(15, breakdown.height + 5);
        }
      } else {
        cursorY += 4;
      }

      let signalText: string | null = null;
      let signalColor = '#b7a7ff';
      if (pending.signal.gain > 0) {
        const signalResult = pending.signal.lockReached
          ? messages.opening.signalLockReady
          : `${pending.signal.after}/${LITE_V2_BALANCE.signalThreshold}`;
        signalText = `${messages.opening.signal} +${pending.signal.gain} · ${signalResult}`;
      } else if (pending.signal.lockConsumed) {
        signalText = messages.opening.signalLockConsumed;
        signalColor = '#ff9ed4';
      } else if (pending.signal.lockRetained) {
        const retainedMultiplier = formatOverchargeMultiplier(pending.overcharge.afterHundredths);
        const maxSuffix = pending.overcharge.afterHundredths >= LITE_V2_BALANCE.overchargeCapHundredths ? ' MAX' : '';
        signalText = `${messages.opening.signalLockRetained} · ${retainedMultiplier}${maxSuffix}`;
        signalColor = pending.overcharge.afterHundredths >= LITE_V2_BALANCE.overchargeCapHundredths ? '#ff9ed4' : '#b7a7ff';
      }
      if (signalText) {
        const icon = createSignalToken(this, iconX, cursorY + 4, false);
        const text = this.add.text(textX, cursorY, signalText, {
          color: signalColor,
          stroke: '#100b16',
          strokeThickness: 2,
          fontFamily: DIGITAL_FONT_FAMILY,
          fontSize: '6px',
          wordWrap: { width: width - 48, useAdvancedWrap: true },
        });
        tray.add([icon, text]);
        cursorY += Math.max(18, text.height + 5);
      }

      const nearCompletion = getStandardLootPoolNearCompletion(GAME_REGISTRY, pending.lootPoolId, pending.commit);
      if (nearCompletion) {
        const nearCompletionText = this.add.text(
          textX,
          cursorY,
          `${messages.opening.nearCompletionStandardSet} ${nearCompletion.current}/${nearCompletion.total} · ${messages.opening.nearCompletionOneLeft}`,
          {
            color: '#8df8ff',
            stroke: '#100b16',
            strokeThickness: 2,
            fontFamily: DIGITAL_FONT_FAMILY,
            fontSize: '6px',
            wordWrap: { width: width - 48, useAdvancedWrap: true },
          },
        );
        nearCompletionText.setData('nearCompletion', true);
        tray.add(nearCompletionText);
        cursorY += Math.max(18, nearCompletionText.height + 5);
      }

      if (animate && pending.chips.overchargeBonus > 0) {
        const counter = { value: pending.chips.rawEarned };
        this.tweens.add({
          targets: counter,
          value: standardTotal,
          delay: 90,
          duration: 360,
          ease: 'Cubic.Out',
          onUpdate: () => {
            if (totalText.active) totalText.setText(`+${Math.round(counter.value)} ${messages.opening.chips}`);
          },
          onComplete: () => {
            if (totalText.active) totalText.setText(`+${standardTotal} ${messages.opening.chips}`);
          },
        });
      }
    }

    const height = getRewardTrayHeight(cursorY + 8);
    const placement = computeRewardTrayPlacement({
      safeLeft: this.metrics!.safeLeft,
      safeRight: this.metrics!.safeRight,
      safeTop: this.metrics!.safeTop,
      topOffset: OPENING_FEEL_PRESENTATION.railTopOffset,
      centerX: this.metrics!.centerX,
      railRight: this.metrics!.safeLeft + OPENING_FEEL_PRESENTATION.railCardWidth,
      resultPanelTop: RESULT_PRESENTATION.panelY - RESULT_PRESENTATION.panelHeight / 2,
      trayWidth: width,
      trayHeight: height,
      heroHalfWidth: OPENING_FEEL_PRESENTATION.rewardTrayHeroHalfWidth,
      sideGap: OPENING_FEEL_PRESENTATION.rewardTraySideGap,
      resultGap: OPENING_FEEL_PRESENTATION.rewardTrayResultGap,
    });
    tray.setPosition(placement.x, placement.y - height / 2);
    tray.setData('height', height);
    tray.setData('side', placement.side);
    background.fillStyle(0x17101f, 0.91);
    background.fillRoundedRect(left, 0, width, height, 16);
    background.lineStyle(1.5, secretSelected ? SECRET_REVEAL_COLOR : 0x8df8ff, secretSelected ? 0.5 : 0.3);
    background.strokeRoundedRect(left, 0, width, height, 16);

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

  private createDiscoverySilhouetteAccent(
    standardVisual: Phaser.GameObjects.Container,
    color: number,
    copies: number = OPENING_FEEL_PRESENTATION.discoveryOutlineCopies,
    radius: number = OPENING_FEEL_PRESENTATION.discoveryOutlineRadius,
  ): Array<Phaser.GameObjects.Image | Phaser.GameObjects.Ellipse> {
    const sourceImage = standardVisual.list.find(
      (child): child is Phaser.GameObjects.Image =>
        child instanceof Phaser.GameObjects.Image && child.getData('silhouetteAccent') !== true,
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
        .setScale(sourceImage.scaleX, sourceImage.scaleY);
      outline.setTint(color);
      outline.setAlpha(0);
      outline.setData('silhouetteAccent', true);
      outline.setBlendMode(Phaser.BlendModes.ADD);
      standardVisual.addAt(outline, sourceIndex);
      targets.push(outline);
    }
    return targets;
  }

  private addPersistentStandardSilhouetteAccent(
    standardVisual: Phaser.GameObjects.Container,
    color: number,
    isNew: boolean,
  ): void {
    const targets = this.createDiscoverySilhouetteAccent(
      standardVisual,
      color,
      OPENING_FEEL_PRESENTATION.standardOutlineCopies,
      OPENING_FEEL_PRESENTATION.standardOutlineRadius,
    );
    const baseAlpha = isNew
      ? OPENING_FEEL_PRESENTATION.newPersistentOutlineAlpha
      : OPENING_FEEL_PRESENTATION.standardOutlineAlpha;
    const peakAlpha = isNew
      ? OPENING_FEEL_PRESENTATION.newPersistentOutlinePeakAlpha
      : OPENING_FEEL_PRESENTATION.standardOutlinePeakAlpha;
    for (const target of targets) {
      this.trackStandardPresenceTarget(target);
      target.setAlpha(baseAlpha);
    }
    this.tweens.add({
      targets,
      alpha: peakAlpha,
      duration: isNew ? 1150 : 1550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private async animateDiscoveryBeat(
    pending: PendingReveal,
    standardVisual: Phaser.GameObjects.Container,
  ): Promise<void> {
    if (!this.root || !this.metrics || !pending.standard.isNew) return;

    const messages = getMessages(getPlatformRuntime().language);
    const presentation = getCollectiblePresentation(pending.standard.familyId);
    const heroX = this.metrics.centerX;
    const heroY = presentation.revealY;
    const rarityColor = RARITY_REVEAL_COLORS[pending.standard.rarity];
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
      const messages = getMessages(getPlatformRuntime().language);
      getGameAudio().play('duplicate');
      const conversionLabel = this.add
        .text(
          this.metrics.centerX,
          heroY + 106,
          `${messages.opening.recycled} +${pending.chips.recycle}`,
          {
            color: '#c8fbff',
            backgroundColor: '#182431',
            padding: { x: 8, y: 4 },
            stroke: '#100b16',
            strokeThickness: 2,
            fontFamily: DIGITAL_FONT_FAMILY,
            fontSize: '8px',
            fontStyle: 'bold',
          },
        )
        .setOrigin(0.5)
        .setAlpha(0);
      conversionLabel.setData('rewardMeaning', 'conversion');
      this.root.add(conversionLabel);
      this.tweens.add({
        targets: conversionLabel,
        y: heroY + 100,
        alpha: 1,
        duration: 90,
        ease: 'Sine.Out',
        onComplete: () => {
          if (!conversionLabel.active) return;
          this.tweens.add({
            targets: conversionLabel,
            y: heroY + 94,
            alpha: 0,
            duration: OPENING_FEEL_PRESENTATION.duplicateConversionAccentMs - 90,
            ease: 'Sine.In',
            onComplete: () => conversionLabel.destroy(),
          });
        },
      });

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
    return {
      ...this.saveState,
      chips: pending.chips.before - pending.chips.cost,
      signal: pending.signal.after,
      overchargeHundredths: pending.overcharge.afterHundredths,
    };
  }

  private async bankChipLeg(
    targetValue: number,
    chargedReadyOnArrival: boolean,
    sequenceStartAmount: number,
    sequenceTotalAmount: number,
    pageStartAmount: number,
    pageTotalAmount: number,
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
        getGameAudio().setResultBankingProgress(
          (pageStartAmount + amount) / Math.max(1, pageTotalAmount),
        );
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
            const pageProgress =
              (pageStartAmount + arrived) / Math.max(1, pageTotalAmount);
            const sequenceProgress =
              (sequenceStartAmount + arrived) / Math.max(1, sequenceTotalAmount);
            getGameAudio().setResultBankingProgress(pageProgress);
            if (!fastForwarding && shouldPlayChipClack(plan, index)) {
              getGameAudio().playChipClack(sequenceProgress);
            }
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

  private async animateSignalLockConsumptionPrelude(pending: PendingReveal): Promise<void> {
    if (!pending.signal.lockConsumed || !this.root || !this.metrics || !this.saveState || !this.pouch) return;

    const signalOrigin = {
      x: this.metrics.safeLeft + OPENING_FEEL_PRESENTATION.signalHudWidth / 2,
      y:
        this.metrics.safeTop +
        OPENING_FEEL_PRESENTATION.railTopOffset +
        OPENING_FEEL_PRESENTATION.chipsHudHeight +
        10 +
        OPENING_FEEL_PRESENTATION.signalHudHeight / 2,
    };
    const pouchTarget = {
      x: this.pouch.group.x,
      y: this.pouch.group.y + POUCH_PRESENTATION.body.y,
    };
    const discharge = this.add
      .circle(signalOrigin.x, signalOrigin.y, 9, 0xff8ed1, 0.98)
      .setStrokeStyle(2, 0xffffff, 0.72)
      .setBlendMode(Phaser.BlendModes.ADD);
    const ring = this.add
      .circle(signalOrigin.x, signalOrigin.y, 18, 0x9d7cff, 0.12)
      .setStrokeStyle(3, 0x9d7cff, 0.76)
      .setBlendMode(Phaser.BlendModes.ADD);
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

    let lastTrailAt = Number.NEGATIVE_INFINITY;
    await this.runSkippableTween(
      {
        targets: discharge,
        x: pouchTarget.x,
        y: pouchTarget.y,
        scale: 0.5,
        alpha: 0.34,
        duration: 420,
        ease: 'Cubic.In',
        onUpdate: () => {
          if (!discharge.active || !this.root || this.isSceneShutdown()) return;
          if (this.time.now - lastTrailAt < 28) return;
          lastTrailAt = this.time.now;
          const trailColor = Math.floor(this.time.now / 28) % 2 === 0 ? 0xff8ed1 : 0x8df8ff;
          const trail = this.add
            .circle(discharge.x, discharge.y, 5.2, trailColor, 0.7)
            .setBlendMode(Phaser.BlendModes.ADD);
          this.root.add(trail);
          this.tweens.add({
            targets: trail,
            alpha: 0,
            scale: 0.12,
            duration: 220,
            ease: 'Sine.Out',
            onComplete: () => trail.destroy(),
          });
        },
      },
      () => discharge.destroy(),
    );
    if (!this.root || this.isSceneShutdown()) return;

    const impact = this.add
      .circle(pouchTarget.x, pouchTarget.y, 16, 0x8df8ff, 0.28)
      .setStrokeStyle(3, 0xff8ed1, 0.82)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.root.add(impact);
    this.tweens.add({
      targets: impact,
      scale: 2.2,
      alpha: 0,
      duration: 240,
      ease: 'Cubic.Out',
      onComplete: () => impact.destroy(),
    });
    this.cameras.main.shake(95, 0.0019);
    this.renderSignalHud(this.root, {
      ...this.saveState,
      signal: pending.signal.after,
      overchargeHundredths: pending.overcharge.afterHundredths,
    });
    if (this.signalHudContainer) {
      this.tweens.add({ targets: this.signalHudContainer, scale: 0.97, duration: 85, yoyo: true, ease: 'Sine.Out' });
    }
    await this.waitPresentation(90);
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
    let lastTrailAt = Number.NEGATIVE_INFINITY;
    await this.runSkippableTween(
      {
        targets: spark,
        x: signalTarget.x,
        y: signalTarget.y,
        scale: 0.38,
        alpha: 0.22,
        duration: 320,
        ease: 'Cubic.In',
        onUpdate: () => {
          if (!spark.active || !this.root || this.isSceneShutdown()) return;
          if (this.time.now - lastTrailAt < 34) return;
          lastTrailAt = this.time.now;
          const trail = this.add
            .circle(spark.x, spark.y, 4.2, 0x8df8ff, 0.58)
            .setBlendMode(Phaser.BlendModes.ADD);
          this.root.add(trail);
          this.tweens.add({
            targets: trail,
            alpha: 0,
            scale: 0.18,
            duration: 180,
            ease: 'Sine.Out',
            onComplete: () => trail.destroy(),
          });
        },
      },
      () => spark.destroy(),
    );
    if (!this.root || this.isSceneShutdown()) return;
    this.renderSignalHud(this.root, {
      ...this.saveState,
      signal: pending.signal.after,
      overchargeHundredths: pending.overcharge.beforeHundredths,
    });
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

  private async animateOverchargeTransition(pending: PendingReveal): Promise<void> {
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

  }

  private finishDeferredBankingResize(): boolean {
    if (!this.deferredResize || this.phase !== 'banking' || this.isSceneShutdown()) return false;
    this.presentationSkip.reset();
    getGameAudio().clearResultAmbience();
    this.renderIdle();
    return true;
  }

  private async animateCollectionAcceptance(
    includeActionChrome = true,
  ): Promise<Phaser.GameObjects.Container[]> {
    if (!this.root || !this.metrics) return [];

    const activeCarouselItem = this.resultCarouselItems[this.resultCarouselIndex];
    const collectTargets = this.resultCarouselItems.length > 0
      ? activeCarouselItem?.active
        ? [activeCarouselItem]
        : []
      : this.resultBreathTarget?.active
        ? [this.resultBreathTarget]
        : [];

    this.stopRewardBreathing();
    this.resultCarouselZone?.disableInteractive();
    this.collectionButton?.disableInteractive();

    const motions: Promise<void>[] = [];
    for (const target of collectTargets) {
      const currentScaleX = target.scaleX;
      const currentScaleY = target.scaleY;
      motions.push(
        this.runSkippableTween({
          targets: target,
          x: target.x + OPENING_FEEL_PRESENTATION.collectItemShiftX,
          y: target.y + OPENING_FEEL_PRESENTATION.collectItemShiftY,
          scaleX: currentScaleX * OPENING_FEEL_PRESENTATION.collectItemScale,
          scaleY: currentScaleY * OPENING_FEEL_PRESENTATION.collectItemScale,
          alpha: Math.max(0.18, target.alpha * 0.8),
          duration: OPENING_FEEL_PRESENTATION.collectAcknowledgeMs,
          ease: 'Cubic.Out',
        }),
      );
    }

    if (includeActionChrome && this.resultActionPanel?.active) {
      motions.push(
        this.runSkippableTween({
          targets: this.resultActionPanel,
          y: this.resultActionPanel.y + 3,
          alpha: OPENING_FEEL_PRESENTATION.collectPanelAlpha,
          duration: OPENING_FEEL_PRESENTATION.collectAcknowledgeMs,
          ease: 'Sine.Out',
        }),
      );
    }

    if (includeActionChrome && this.collectionButton?.active) {
      const button = this.collectionButton;
      this.tweens.killTweensOf(button);
      button.setScale(1);
      motions.push(
        this.runSkippableTween({
          targets: button,
          scale: OPENING_FEEL_PRESENTATION.collectDestinationPulseScale,
          duration: OPENING_FEEL_PRESENTATION.collectAcknowledgeMs / 2,
          yoyo: true,
          ease: 'Sine.Out',
        }),
      );
    }

    await Promise.all(motions);
    return collectTargets;
  }

  private async switchBankingCarouselOwner(
    pending: PendingReveal,
    owner: RewardBankingOwner,
  ): Promise<void> {
    if (!pending.hiddenPocket || this.resultCarouselItems.length < 2 || !this.root) {
      getGameAudio().setResultBankingProgress(0);
      return;
    }

    const targetIndex = owner === 'secret' ? 1 : 0;
    if (this.resultCarouselIndex !== targetIndex) {
      this.resultCarouselIndex = targetIndex;
      getGameAudio().play('carousel-switch');
      this.positionResultCarousel(0, true);
      getGameAudio().setResultBankingProgress(0);
      this.renderRewardTray(pending, this.root, false);
      if (this.resultActionPanel?.active) {
        this.tweens.add({
          targets: this.resultActionPanel,
          alpha: 0,
          duration: 120,
          ease: 'Sine.In',
        });
      }
      await this.waitPresentation(190);
      return;
    }

    getGameAudio().setResultBankingProgress(0);
  }

  private async animateRewardBanking(pending: PendingReveal): Promise<void> {
    if (!this.saveState || !this.root || this.isSceneShutdown()) return;
    this.phase = 'banking';
    this.resultReady = false;
    this.stopResultPanelPulse();

    const bankingPlan = createRewardBankingPlan(pending, this.resultCarouselIndex);
    const collectTargets: Phaser.GameObjects.Container[] = [];
    let nextValue = pending.chips.before - pending.chips.cost;
    let bankedAmount = 0;
    const chargedCost = getChargedCost(LITE_V2_BALANCE);
    let readyShown = false;

    for (let pageIndex = 0; pageIndex < bankingPlan.pages.length; pageIndex += 1) {
      const page = bankingPlan.pages[pageIndex]!;
      await this.switchBankingCarouselOwner(pending, page.owner);
      if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;

      const accepted = await this.animateCollectionAcceptance(pageIndex === 0);
      collectTargets.push(...accepted);
      if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;

      let pageBankedAmount = 0;
      for (const leg of page.legs) {
        const amount = leg.amount;
        const target = nextValue + amount;
        const crossesReady: boolean =
          !readyShown &&
          crossedChargedReadyThreshold(pending, LITE_V2_BALANCE) &&
          nextValue < chargedCost &&
          target >= chargedCost;
        await this.bankChipLeg(
          target,
          crossesReady,
          bankedAmount,
          bankingPlan.totalAmount,
          pageBankedAmount,
          page.totalAmount,
        );
        readyShown ||= crossesReady;
        bankedAmount += amount;
        pageBankedAmount += amount;
        nextValue = target;
        if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;
      }

      if (page.totalAmount > 0) getGameAudio().setResultBankingProgress(1);
    }

    if (bankingPlan.totalAmount > 0) getGameAudio().setResultBankingProgress(1);
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
    } else if (collectTargets.length > 0) {
      fadeTargets.push(...collectTargets.filter((item) => item.active));
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
    if (!this.isSceneShutdown()) {
      getGameAudio().clearResultAmbience();
      this.renderIdle(undefined, true);
    }
  }

  private async animatePostStandardEconomy(
    pending: PendingReveal,
    standardVisual: Phaser.GameObjects.Container,
  ): Promise<void> {
    await this.animateDiscoveryBeat(pending, standardVisual);
    if (this.isSceneShutdown()) return;
    await this.animateRewardStaging(pending, standardVisual);
    if (this.isSceneShutdown()) return;
    await this.bankSignalGain(pending);
    if (this.isSceneShutdown()) return;
    await this.animateOverchargeTransition(pending);
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
    const heroX = this.metrics!.centerX;
    const heroY = presentation.revealY;
    const finalScale = presentation.revealScale;
    const audio = getGameAudio();

    audio.beginRevealAnticipation(pending.standard.rarity, fx.anticipationHoldMs);
    if (fx.anticipationHoldMs > 0) {
      await this.waitPresentation(fx.anticipationHoldMs);
      if (this.isSceneShutdown()) return pouch.group;
    }

    this.createRevealBackdrop(fx.backdropAlpha, fx.particleDuration);
    audio.play('reveal-pop');

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
    // The pouch and its Charged aura exit together so no glow is left hanging behind.
    this.startChargedAuraExit(
      REVEAL_MOTION_PRESENTATION.pouchExitDelay,
      REVEAL_MOTION_PRESENTATION.pouchExitDuration,
    );
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
      ease: fx.introEase,
    });
    if (this.isSceneShutdown()) return visual.group;

    this.showRarityAccentSweep(pending.standard.rarity, heroX, heroY, color);
    await this.runSkippableTween({
      targets: visual.group,
      scale: finalScale,
      duration: fx.settleDuration,
      ease: fx.settleEase,
    });

    if (fx.shake > 0) this.cameras.main.shake(100, fx.shake);
    if (fx.aftershockScale > 1 && fx.aftershockDurationMs > 0) {
      await this.runSkippableTween({
        targets: visual.group,
        scale: finalScale * fx.aftershockScale,
        duration: fx.aftershockDurationMs,
        yoyo: true,
        ease: 'Sine.InOut',
      });
      visual.group.setScale(finalScale);
    }

    this.addPersistentStandardSilhouetteAccent(
      visual.group,
      color,
      pending.standard.isNew,
    );
    audio.play(pending.standard.rarity);
    return visual.group;
  }

  private async animateRecoveredReveal(pending: PendingReveal): Promise<void> {
    if (!this.root || !this.metrics) return;
    if (this.pouch?.group.active) {
      this.tweens.killTweensOf(this.pouch.group);
      this.tweens.add({
        targets: this.pouch.group,
        y: this.pouch.group.y + 22,
        scale: 0.97,
        alpha: 0,
        duration: 180,
        ease: 'Cubic.InOut',
      });
    }
    this.startChargedAuraExit(0, 180);
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

  private getStandardResultStatusParts(pending: PendingReveal): {
    base: string;
    mechanic: string | null;
    mechanicColor: string;
  } {
    const messages = getMessages(getPlatformRuntime().language);
    const base = pending.standard.isNew ? messages.opening.newItem : messages.opening.duplicate;
    if (pending.signal.lockConsumed) {
      return { base, mechanic: messages.opening.signalLockConsumed, mechanicColor: '#ff9ed4' };
    }
    if (pending.signal.lockRetained) {
      return { base, mechanic: messages.opening.signalLockRetained, mechanicColor: '#b7a7ff' };
    }
    if (pending.signal.lockReached) {
      return { base, mechanic: messages.opening.signalLockReady, mechanicColor: '#8df8ff' };
    }
    return { base, mechanic: null, mechanicColor: '#b7a7ff' };
  }

  private getStandardResultStatus(pending: PendingReveal): string {
    const { base, mechanic } = this.getStandardResultStatusParts(pending);
    return mechanic ? `${base} · ${mechanic}` : base;
  }

  private addStandardResultLabels(pending: PendingReveal, x: number, y: number): void {
    const root = this.root!;
    const family = GAME_REGISTRY.familyById.get(pending.standard.familyId);
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
      this.getHiddenPocketHeadingY(),
      getMessages(getPlatformRuntime().language).opening.hiddenPocket,
      {
        color: '#ff7088',
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
    getGameAudio().beginRevealAnticipation('secret', fx.anticipationHoldMs);
    await this.waitPresentation(fx.anticipationHoldMs);
    if (this.isSceneShutdown()) return;
    this.createRevealBackdrop(Math.min(0.58, fx.backdropAlpha * 1.28), fx.particleDuration + 120);
    const auraCloud = this.add.container(heroX, heroY).setAlpha(0);
    const cloudA = this.add.ellipse(-28, 8, 300, 188, SECRET_REVEAL_COLOR, 0.19).setBlendMode(Phaser.BlendModes.ADD);
    const cloudB = this.add.ellipse(42, -20, 238, 154, 0xa45cff, 0.13).setBlendMode(Phaser.BlendModes.ADD);
    auraCloud.add([cloudA, cloudB]);
    root.add(auraCloud);
    this.tweens.add({
      targets: auraCloud,
      alpha: 0.9,
      scale: 1.12,
      angle: 3,
      duration: 520,
      yoyo: true,
      hold: 210,
      ease: 'Sine.InOut',
      onComplete: () => auraCloud.destroy(),
    });
    this.tweens.add({ targets: cloudA, x: 18, duration: 760, yoyo: true, ease: 'Sine.InOut' });
    this.tweens.add({ targets: cloudB, x: -16, y: 8, duration: 680, yoyo: true, ease: 'Sine.InOut' });
    const halo = this.add.circle(heroX, heroY, 158, SECRET_REVEAL_COLOR, fx.glowAlpha).setScale(0.34);
    const flash = this.add.circle(heroX, heroY, 118, SECRET_REVEAL_COLOR, fx.flashAlpha).setScale(0.22);
    const coreFlash = this.add
      .circle(heroX, heroY, 70, 0xffffff, Math.min(0.64, fx.flashAlpha * 0.78))
      .setScale(0.16);
    root.add([halo, flash, coreFlash]);
    const ring = createRevealRing(this, root, heroX, heroY, SECRET_REVEAL_COLOR)
      .setScale(0.42)
      .setAlpha(0.54);
    const secondary = createRevealRing(this, root, heroX, heroY, SECRET_PREMIUM_GOLD)
      .setScale(0.25)
      .setAlpha(0.56)
      .setStrokeStyle(4, SECRET_PREMIUM_GOLD, 0.76);

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
    this.spawnSparkles(
      heroX,
      heroY,
      SECRET_PREMIUM_GOLD,
      Math.max(10, Math.floor(fx.particleCount / 3)),
      fx.particleDistance * 0.82,
      fx.particleDuration + 120,
      fx.sparkleScale * 0.72,
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
      ease: fx.introEase,
    });
    await this.runSkippableTween({
      targets: secret.group,
      scale: secretPresentation.revealScale,
      duration: fx.settleDuration,
      ease: fx.settleEase,
    });
    this.cameras.main.shake(145, Math.min(0.0062, fx.shake * 1.35));
    await this.runSkippableTween({
      targets: secret.group,
      x: heroX + 5,
      angle: 1.1,
      duration: 52,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.InOut',
    });
    secret.group.setPosition(heroX, heroY).setAngle(0);
  }

  private renderHiddenPocketCarousel(
    pending: PendingReveal,
    root: Phaser.GameObjects.Container,
    metrics: LayoutMetrics,
    selectedIndex = 1,
  ): void {
    if (!pending.hiddenPocket) return;
    const messages = getMessages(getPlatformRuntime().language);

    const heading = this.add.text(metrics.centerX, this.getHiddenPocketHeadingY(), messages.opening.hiddenPocket, {
      color: '#ff7088',
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
    this.addPersistentStandardRarityState(standardPage, pending.standard.rarity);
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
    this.addPersistentStandardSilhouetteAccent(
      standardVisual.group,
      RARITY_REVEAL_COLORS[pending.standard.rarity],
      pending.standard.isNew,
    );
    standardPage.setData('sideScale', standardVisual.presentation.carouselSideScale);
    standardPage.setData('breathTarget', standardVisual.group);
    standardPage.setData('breathBaseScale', standardVisual.presentation.revealScale);

    const secretPage = this.add.container(0, getCollectiblePresentation(pending.hiddenPocket.familyId).revealY);
    root.add(secretPage);
    this.addPersistentSecretPremiumState(secretPage);
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
    const activeDotColor = this.lastReveal?.hiddenPocket && this.resultCarouselIndex === 1
      ? SECRET_REVEAL_COLOR
      : 0x8df8ff;
    this.resultCarouselDots.forEach((dot, index) => {
      dot.setFillStyle(
        index === this.resultCarouselIndex ? activeDotColor : 0xece4f6,
        index === this.resultCarouselIndex ? 0.95 : 0.35,
      );
    });

    const secretSelected = Boolean(this.lastReveal?.hiddenPocket && this.resultCarouselIndex === 1);
    if (this.lastReveal) {
      getGameAudio().setResultAmbience(secretSelected ? 'secret' : this.lastReveal.standard.rarity);
    }
    if (this.resultCarouselHeading?.active) {
      const heading = this.resultCarouselHeading;
      this.tweens.killTweensOf(heading);
      if (animate) {
        heading.setVisible(true);
        this.tweens.add({
          targets: heading,
          alpha: secretSelected ? 1 : 0,
          duration: 140,
          ease: 'Sine.Out',
          onComplete: () => {
            if (!secretSelected && heading.active) heading.setVisible(false);
          },
        });
      } else {
        heading.setVisible(secretSelected).setAlpha(secretSelected ? 1 : 0);
      }
    }
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
      // Presentation randomness only: loot resolution is already persisted before
      // this runs. Breaking the old spoke/grid pattern makes repeated openings
      // feel less stamped without touching any gameplay RNG.
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distanceJitter = distance * Phaser.Math.FloatBetween(0.68, 1.08);
      const sparkle = this.add
        .circle(
          x,
          y,
          Phaser.Math.FloatBetween(3.2, 7.2) * sizeScale,
          color,
          Phaser.Math.FloatBetween(0.72, 1),
        )
        .setStrokeStyle(1.5, 0xffffff, Phaser.Math.FloatBetween(0.34, 0.56));
      root.add(sparkle);
      this.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * distanceJitter,
        y: y + Math.sin(angle) * distanceJitter * Phaser.Math.FloatBetween(0.7, 0.86) - Phaser.Math.FloatBetween(6, 18),
        alpha: 0,
        scale: Phaser.Math.FloatBetween(0.12, 0.24),
        duration: Math.round(duration * Phaser.Math.FloatBetween(0.88, 1.14)),
        delay: Phaser.Math.Between(0, 72),
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
      overchargeBefore: pending.overcharge.beforeHundredths,
      overchargeBonusChips: pending.chips.overchargeBonus,
      overchargeGain: pending.overcharge.appliedGainHundredths,
      overchargeAfter: committed.overchargeHundredths,
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
    if (pending.overcharge.appliedGainHundredths > 0) {
      analytics.track('overcharge_gained', {
        openingNumber: pending.openingNumber,
        pouchType: pending.pouchType,
        before: pending.overcharge.beforeHundredths,
        gain: pending.overcharge.appliedGainHundredths,
        after: pending.overcharge.afterHundredths,
      });
    }
    if (pending.signal.lockConsumed && pending.overcharge.beforeHundredths > 100) {
      analytics.track('overcharge_cashed_out', {
        openingNumber: pending.openingNumber,
        before: pending.overcharge.beforeHundredths,
        bonusChips: pending.chips.overchargeBonus,
      });
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
      analytics.track('hidden_pocket_triggered', {
        openingNumber: pending.openingNumber,
        isNew: pending.hiddenPocket.isNew,
        bonusChips: pending.hiddenPocket.bonusChips,
      });
      analytics.track(pending.hiddenPocket.isNew ? 'secret_discovered' : 'secret_duplicate', {
        openingNumber: pending.openingNumber,
        familyId: pending.hiddenPocket.familyId,
        collectibleId: pending.hiddenPocket.collectibleId,
        bonusChips: pending.hiddenPocket.bonusChips,
      });
    }
    if (isStandardLootPoolComplete(GAME_REGISTRY, pending.lootPoolId, committed.discoveredStandard)) {
      const wasCompleteBefore = isStandardLootPoolComplete(
        GAME_REGISTRY,
        pending.lootPoolId,
        pending.standard.isNew
          ? committed.discoveredStandard.filter((id) => id !== pending.standard.collectibleId)
          : committed.discoveredStandard,
      );
      if (!wasCompleteBefore) {
        analytics.track('standard_collection_complete', { openingNumber: pending.openingNumber });
      }
    }
  }

  private clearCollectionMilestoneMotion(): void {
    const target = this.collectionMilestoneTarget;
    if (!target) return;
    this.tweens.killTweensOf(target);
    if (target.active) target.destroy(true);
    this.collectionMilestoneTarget = null;
  }

  private getCollectionMilestoneCopy(kind: CollectionMilestoneKind): {
    title: string;
    accent: number;
  } {
    const messages = getMessages(getPlatformRuntime().language).opening;
    if (kind === 'standards-half') {
      return { title: messages.milestoneStandardsHalf, accent: 0x8df8ff };
    }
    if (kind === 'standards-complete') {
      return { title: messages.milestoneStandardsComplete, accent: 0xffd36a };
    }
    if (kind === 'first-secret') {
      return { title: messages.milestoneFirstSecret, accent: 0xff7088 };
    }
    return { title: messages.milestoneSecretsComplete, accent: 0xff4d6d };
  }

  private getActiveResultCollectibleLogicalBounds(): {
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

  private showCollectionMilestone(milestone: CollectionMilestone): void {
    if (!this.root || !this.metrics || this.isSceneShutdown()) return;
    this.clearCollectionMilestoneMotion();

    const messages = getMessages(getPlatformRuntime().language).opening;
    const copy = this.getCollectionMilestoneCopy(milestone.kind);
    const width = Math.max(
      COLLECTION_MILESTONE_PRESENTATION.minWidth,
      Math.min(
        COLLECTION_MILESTONE_PRESENTATION.width,
        this.metrics.logicalWidth - COLLECTION_MILESTONE_PRESENTATION.safeSidePadding * 2,
      ),
    );
    const placement = this.getCollectionMilestonePosition(width);
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
    const background = this.add.graphics();
    background.fillStyle(0x17101f, 0.93);
    background.fillRoundedRect(
      -width / 2,
      -COLLECTION_MILESTONE_PRESENTATION.height / 2,
      width,
      COLLECTION_MILESTONE_PRESENTATION.height,
      16,
    );
    background.lineStyle(2, copy.accent, 0.66);
    background.strokeRoundedRect(
      -width / 2,
      -COLLECTION_MILESTONE_PRESENTATION.height / 2,
      width,
      COLLECTION_MILESTONE_PRESENTATION.height,
      16,
    );
    const diamond = this.add
      .rectangle(-width / 2 + 18, 0, 7, 7, copy.accent, 0.96)
      .setRotation(Math.PI / 4)
      .setStrokeStyle(1, 0xffffff, 0.34);
    const title = this.add
      .text(0, -9, copy.title, {
        color: '#fff8ff',
        stroke: '#100b16',
        strokeThickness: 2,
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: '8px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const progress = this.add
      .text(0, 12, `${milestone.current}/${milestone.total} ${messages.milestoneCollected}`, {
        color: `#${copy.accent.toString(16).padStart(6, '0')}`,
        stroke: '#100b16',
        strokeThickness: 1,
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: '7px',
      })
      .setOrigin(0.5);
    toast.add([background, diamond, title, progress]);
    toast.setData('milestoneKind', milestone.kind);
    toast.setData('panelWidth', width);
    toast.setData('title', title);
    toast.setData('progress', progress);
    this.root.add(toast);
    this.collectionMilestoneTarget = toast;

    if (milestone.kind === 'standards-complete' || milestone.kind === 'secrets-complete') {
      getGameAudio().play('collection-complete');
    }

    this.tweens.add({
      targets: toast,
      x: targetX,
      y: targetY,
      alpha: 1,
      scale: 1,
      duration: COLLECTION_MILESTONE_PRESENTATION.introMs,
      ease: 'Back.Out',
      onComplete: () => {
        if (!toast.active) return;
        this.tweens.add({
          targets: toast,
          y: targetY + COLLECTION_MILESTONE_PRESENTATION.exitOffsetY,
          alpha: 0,
          scale: 1.015,
          delay: COLLECTION_MILESTONE_PRESENTATION.holdMs,
          duration: COLLECTION_MILESTONE_PRESENTATION.exitMs,
          ease: 'Sine.In',
          onComplete: () => {
            if (toast.active) toast.destroy(true);
            if (this.collectionMilestoneTarget === toast) this.collectionMilestoneTarget = null;
          },
        });
      },
    });
  }

  private getResultPanelCopy(pending: PendingReveal): {
    title: string;
    rarity: string;
    rarityColor: string;
    status: string;
    statusColor: string;
    statusAccent: string | null;
    statusAccentColor: string;
  } {
    const language = getPlatformRuntime().language;
    const messages = getMessages(language);
    if (pending.hiddenPocket && this.resultCarouselIndex === 1) {
      const family = GAME_REGISTRY.familyById.get(pending.hiddenPocket.familyId);
      return {
        title: family?.name[language] ?? pending.hiddenPocket.familyId,
        rarity: messages.rarity.secret,
        rarityColor: '#ff4d6d',
        status: pending.hiddenPocket.isNew ? messages.opening.secretDiscovered : messages.opening.secretDuplicate,
        statusColor: pending.hiddenPocket.isNew ? '#ffdca0' : '#ffb0be',
        statusAccent: null,
        statusAccentColor: '#ff9ed4',
      };
    }

    const family = GAME_REGISTRY.familyById.get(pending.standard.familyId);
    const statusParts = this.getStandardResultStatusParts(pending);
    return {
      title: `${pending.pouchType === 'charged' ? '⚡ ' : ''}${family?.name[language] ?? pending.standard.familyId}`,
      rarity: messages.rarity[pending.standard.rarity],
      rarityColor: `#${RARITY_REVEAL_COLORS[pending.standard.rarity].toString(16).padStart(6, '0')}`,
      status: statusParts.base,
      statusColor: pending.standard.isNew ? '#f7f2ff' : '#c7f8ff',
      statusAccent: statusParts.mechanic,
      statusAccentColor: statusParts.mechanicColor,
    };
  }

  private positionResultHeading(
    title: Phaser.GameObjects.Text,
    rarity: Phaser.GameObjects.Text,
  ): void {
    const headingGap = 12;
    const diamondTextOffset = 11;
    const badgeContentWidth = diamondTextOffset + rarity.width;
    const totalWidth = title.width + headingGap + badgeContentWidth;
    const startX = -totalWidth / 2;
    const headingY = RESULT_PRESENTATION.headingY;
    title.setOrigin(0, 0.5).setPosition(startX, headingY);

    const badgeLeft = startX + title.width + headingGap;
    const diamond = rarity.getData('diamond') as Phaser.GameObjects.Rectangle | undefined;
    if (diamond) diamond.setPosition(badgeLeft + 3.5, headingY);
    rarity.setOrigin(0, 0.5).setPosition(badgeLeft + diamondTextOffset, headingY);

    const capsule = rarity.getData('capsule') as Phaser.GameObjects.Graphics | undefined;
    if (capsule) {
      const capsuleColor = Number(rarity.getData('capsuleColor') ?? 0xf0ddff);
      const contentHeight = Math.max(rarity.height, 7);
      const capsuleLeft = badgeLeft - 7;
      const capsuleTop = headingY - contentHeight / 2 - 4;
      const capsuleWidth = badgeContentWidth + 14;
      const capsuleHeight = contentHeight + 8;
      capsule.clear();
      capsule.fillStyle(capsuleColor, 0.1);
      capsule.fillRoundedRect(capsuleLeft, capsuleTop, capsuleWidth, capsuleHeight, 9);
      capsule.lineStyle(1.5, capsuleColor, 0.5);
      capsule.strokeRoundedRect(capsuleLeft, capsuleTop, capsuleWidth, capsuleHeight, 9);
    }
  }

  private positionResultStatus(
    status: Phaser.GameObjects.Text,
    statusAccent: Phaser.GameObjects.Text,
  ): void {
    const statusY = RESULT_PRESENTATION.statusY;
    status.setY(statusY);
    statusAccent.setY(statusY);
    if (!statusAccent.text) {
      status.setOrigin(0.5, 0.5).setX(0);
      statusAccent.setVisible(false);
      return;
    }

    statusAccent.setVisible(true);
    status.setOrigin(0, 0.5);
    statusAccent.setOrigin(0, 0.5);
    const totalWidth = status.width + statusAccent.width;
    const startX = -totalWidth / 2;
    status.setX(startX);
    statusAccent.setX(startX + status.width);
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
      const statusAccent = panel.getData('statusAccent') as Phaser.GameObjects.Text | undefined;
      const hint = panel.getData('hint') as Phaser.GameObjects.Text | undefined;
      const background = panel.getData('background') as Phaser.GameObjects.Graphics | undefined;
      const panelWidth = Number(panel.getData('panelWidth') ?? 0);
      if (title && rarity && status && statusAccent && hint) {
        title.setText(copy.title);
        rarity.setText(copy.rarity.toUpperCase()).setColor(copy.rarityColor);
        const updatedRarityColor = Number.parseInt(copy.rarityColor.slice(1), 16);
        rarity.setData('capsuleColor', updatedRarityColor);
        if (background && panelWidth > 0) {
          background.clear();
          background.fillStyle(0x21172e, 0.84);
          background.fillRoundedRect(
            -panelWidth / 2,
            -RESULT_PRESENTATION.panelHeight / 2,
            panelWidth,
            RESULT_PRESENTATION.panelHeight,
            22,
          );
          background.lineStyle(2, Number.isFinite(updatedRarityColor) ? updatedRarityColor : 0xf0ddff, 0.44);
          background.strokeRoundedRect(
            -panelWidth / 2,
            -RESULT_PRESENTATION.panelHeight / 2,
            panelWidth,
            RESULT_PRESENTATION.panelHeight,
            22,
          );
        }
        const diamond = rarity.getData('diamond') as Phaser.GameObjects.Rectangle | undefined;
        if (diamond) diamond.setFillStyle(updatedRarityColor, 1).setStrokeStyle(1, 0xffffff, 0.28);
        status.setText(copy.status).setColor(copy.statusColor);
        statusAccent
          .setText(copy.statusAccent ? ` · ${copy.statusAccent}` : '')
          .setColor(copy.statusAccentColor);
        this.positionResultHeading(title, rarity);
        this.positionResultStatus(status, statusAccent);
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
    const title = this.add.text(0, RESULT_PRESENTATION.headingY, copy.title, {
      color: '#f7f2ff',
      stroke: '#160f20',
      strokeThickness: 3,
      fontFamily: 'system-ui, sans-serif',
      fontSize: '21px',
      fontStyle: 'bold',
    });
    const rarityCapsule = this.add.graphics();
    const rarityDiamond = this.add
      .rectangle(0, RESULT_PRESENTATION.headingY, 6, 6, rarityColorNumber, 1)
      .setRotation(Math.PI / 4)
      .setStrokeStyle(1, 0xffffff, 0.28);
    const rarity = this.add.text(0, RESULT_PRESENTATION.headingY, copy.rarity.toUpperCase(), {
      color: copy.rarityColor,
      padding: { x: 0, y: 2 },
      stroke: '#160f20',
      strokeThickness: 1,
      fontFamily: DIGITAL_FONT_FAMILY,
      fontSize: '10px',
      fontStyle: 'bold',
    });
    rarity.setData('capsule', rarityCapsule);
    rarity.setData('capsuleColor', rarityColorNumber);
    rarity.setData('diamond', rarityDiamond);
    this.positionResultHeading(title, rarity);
    const status = this.add.text(0, RESULT_PRESENTATION.statusY, copy.status, {
      color: copy.statusColor,
      stroke: '#160f20',
      strokeThickness: 2,
      fontFamily: DIGITAL_FONT_FAMILY,
      fontSize: '10px',
    }).setOrigin(0.5);
    const statusAccent = this.add.text(
      0,
      RESULT_PRESENTATION.statusY,
      copy.statusAccent ? ` · ${copy.statusAccent}` : '',
      {
        color: copy.statusAccentColor,
        stroke: '#160f20',
        strokeThickness: 2,
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: '10px',
      },
    ).setOrigin(0, 0.5);
    this.positionResultStatus(status, statusAccent);
    const hint = this.add.text(0, RESULT_PRESENTATION.hintY, hintText, {
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

    panel.add([background, readyGlow, title, rarityCapsule, rarityDiamond, rarity, status, statusAccent, hint, actionZone]);
    panel.setData('readyGlow', readyGlow);
    panel.setData('background', background);
    panel.setData('panelWidth', panelWidth);
    panel.setData('title', title);
    panel.setData('rarity', rarity);
    panel.setData('status', status);
    panel.setData('statusAccent', statusAccent);
    panel.setData('hint', hint);
    this.root.add(panel);
    this.resultActionPanel = panel;
    rarity.setScale(0.92).setAlpha(0);
    rarityDiamond.setScale(0.92).setAlpha(0);
    this.tweens.add({
      targets: panel,
      y: RESULT_PRESENTATION.panelY,
      alpha: 1,
      duration: OPENING_FEEL_PRESENTATION.uiFadeInMs,
      ease: 'Sine.Out',
    });
    this.tweens.add({
      targets: [rarity, rarityDiamond],
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
      getGameAudio().clearResultAmbience();
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
      getGameAudio().setResultAmbience(pending.standard.rarity);
      const standardPresentation = getCollectiblePresentation(pending.standard.familyId);
      this.addPersistentStandardRarityState(
        root,
        pending.standard.rarity,
        metrics.centerX,
        standardPresentation.revealY,
      );
      const standard = createCollectibleVisual(
        this,
        root,
        pending.standard.familyId,
        pending.standard.rarity,
        metrics.centerX,
        standardPresentation.revealY,
        pending.standard.collectibleId,
      );
      standard.group.setScale(standard.presentation.revealScale);
      this.addPersistentStandardSilhouetteAccent(
        standard.group,
        RARITY_REVEAL_COLORS[pending.standard.rarity],
        pending.standard.isNew,
      );
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
