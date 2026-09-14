import Phaser from 'phaser';

import { getPlatformRuntime } from '../../app/runtime';
import { staticTextureKey } from '../data/artAssets';
import { LITE_V2_BALANCE } from '../data/balance';
import { DEFAULT_LOOT_POOL_ID, GAME_REGISTRY, type GameLootPoolId } from '../data/collectibles';
import { POUCH_PRESENTATION } from '../data/presentation';
import { getGameAudio } from '../systems/audio';
import { createLayoutMetrics, readSafeAreaInsets, type LayoutMetrics } from '../systems/layout';
import { ensureInitialOnboardingChips, shouldRunPrimaryOnboarding } from '../systems/onboarding';
import { OpeningSession } from '../systems/openingSession';
import { MathRandomSource } from '../systems/random';
import { getRenderPixelRatio } from '../systems/renderDensity';
import { SaveRepository, type SaveState } from '../systems/save';
import { installSceneTextSharpness } from '../systems/uiSharpness';
import { createGuidancePointer, type GuidancePointer } from '../ui/onboardingGuidance';
import { createPouchVisual, type PouchVisual } from '../ui/openingVisuals';
import { addCoverArt } from '../ui/staticArt';

const LOGICAL_HEIGHT = 720;
const POUCH_Y = POUCH_PRESENTATION.groupY;
const ENTRY_OFFSET_Y = 430;

type FirstRunPhase = 'loading' | 'arriving' | 'idle' | 'dragging' | 'transitioning' | 'failed' | 'shutdown';

interface DragState {
  pointerId: number;
  startPointerX: number;
  progress: number;
  lastPointerTime: number;
}

export class FirstRunScene extends Phaser.Scene {
  private phase: FirstRunPhase = 'loading';
  private root: Phaser.GameObjects.Container | null = null;
  private metrics: LayoutMetrics | null = null;
  private pouch: PouchVisual | null = null;
  private groundShadow: Phaser.GameObjects.Ellipse | null = null;
  private gesturePointer: GuidancePointer | null = null;
  private pointerTimer: Phaser.Time.TimerEvent | null = null;
  private drag: DragState | null = null;
  private session: OpeningSession | null = null;
  private saveState: SaveState | null = null;
  private activationGeneration = 0;

  public constructor() {
    super('FirstRunScene');
  }

  public create(): void {
    installSceneTextSharpness(this);
    const generation = ++this.activationGeneration;
    this.phase = 'loading';
    this.drag = null;
    getPlatformRuntime().activity.setGameplayDesired(false);

    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);

    void this.initialize(generation);
  }

  private async initialize(generation: number): Promise<void> {
    const platform = getPlatformRuntime();
    const repository = new SaveRepository(platform.storage);

    try {
      let state = await repository.load();
      if (!this.isCurrentActivation(generation)) return;
      if (!shouldRunPrimaryOnboarding(state)) {
        this.startOpening();
        return;
      }
      if (state.onboarding.firstRevealReceipt) {
        this.startOpening();
        return;
      }

      state = await ensureInitialOnboardingChips(repository, state);
      if (!this.isCurrentActivation(generation)) return;
      this.session = new OpeningSession({
        repository,
        registry: GAME_REGISTRY,
        balance: LITE_V2_BALANCE,
        random: new MathRandomSource(),
      });
      this.saveState = await this.session.load();
      if (!this.isCurrentActivation(generation)) return;
      if (!shouldRunPrimaryOnboarding(this.saveState)) {
        this.startOpening();
        return;
      }
      if (this.saveState.onboarding.firstRevealReceipt) {
        this.startOpening();
        return;
      }

      this.renderStage();
      // The authored entrance is already visible/playable content, so Game Ready
      // may hide the platform loader here. GameplayAPI remains stopped until the
      // landing has settled and the real star control is interactive.
      platform.markReady();
      await this.animateEntrance(generation);
      if (!this.isCurrentActivation(generation)) return;
      this.phase = 'idle';
      this.pouch?.dragZone.setInteractive({ useHandCursor: true });
      platform.activity.setGameplayDesired(true);
      this.scheduleGesturePointer(120);
    } catch (error: unknown) {
      if (!this.isCurrentActivation(generation)) return;
      this.phase = 'failed';
      console.error('[onboarding] failed to initialize first run', error);
      // Fall back to the mature Opening failure/recovery surface rather than
      // inventing a second save-error UI for the tutorial shell.
      this.startOpening();
    }
  }

  private renderStage(): void {
    this.destroyStage();
    const ratio = getRenderPixelRatio();
    const metrics = createLayoutMetrics(this.scale.width, this.scale.height, readSafeAreaInsets(ratio));
    this.metrics = metrics;

    const root = this.add.container(metrics.offsetX, 0).setScale(metrics.scale);
    this.root = root;
    addCoverArt(this, root, staticTextureKey('opening-bg'), metrics.logicalWidth, LOGICAL_HEIGHT);

    const activeLootPoolId = this.resolveActiveLootPoolId();
    const pouch = createPouchVisual(
      this,
      root,
      metrics.centerX,
      POUCH_Y,
      'basic',
      activeLootPoolId,
    );
    pouch.dragZone.disableInteractive();
    pouch.shadow.setAlpha(0);
    pouch.group.setY(POUCH_Y - ENTRY_OFFSET_Y).setScale(0.985);
    pouch.dragZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.beginDrag(pointer));
    this.pouch = pouch;

    const groundShadow = this.add
      .ellipse(
        metrics.centerX,
        POUCH_Y + POUCH_PRESENTATION.shadowY,
        POUCH_PRESENTATION.shadowWidth,
        34,
        0x08070c,
        0.14,
      )
      .setScale(1.55, 1.34);
    root.addAt(groundShadow, 1);
    this.groundShadow = groundShadow;
  }

  private resolveActiveLootPoolId(): GameLootPoolId {
    const candidate = this.saveState?.activeLootPoolId;
    if (candidate && GAME_REGISTRY.lootPoolById.has(candidate)) {
      return candidate as GameLootPoolId;
    }
    return DEFAULT_LOOT_POOL_ID;
  }

  private async animateEntrance(generation: number): Promise<void> {
    const pouch = this.pouch;
    const shadow = this.groundShadow;
    if (!pouch || !shadow) return;

    this.phase = 'arriving';
    const audio = getGameAudio();
    const entryStartY = pouch.group.y;
    const entryEndY = POUCH_Y + 8;
    audio.primeDragTexture();
    audio.play('pouch-arrival');

    await Promise.all([
      this.tweenPromise({
        targets: pouch.group,
        y: entryEndY,
        scaleX: 1.015,
        scaleY: 0.985,
        duration: 620,
        ease: 'Cubic.In',
        onUpdate: () => {
          if (!this.isCurrentActivation(generation)) return;
          const progress = Phaser.Math.Clamp(
            (pouch.group.y - entryStartY) / Math.max(1, entryEndY - entryStartY),
            0,
            1,
          );
          // A soft filtered noise texture reads closer to air/plastic movement than
          // the ordinary pouch-selection UI tone. Browsers may still defer WebAudio
          // until the first user gesture; hosted acceptance owns that constraint.
          audio.setDragTexture(0.08 + progress * 0.34, 0.16 + progress * 0.46);
        },
      }),
      this.tweenPromise({
        targets: shadow,
        scaleX: 1,
        scaleY: 1,
        alpha: 0.28,
        duration: 620,
        ease: 'Sine.In',
      }),
    ]);
    if (!this.isCurrentActivation(generation)) return;

    // Contact gets a short plastic/material transient on top of the decaying
    // arrival texture, then the visible squash/rebound carries the physical hit.
    audio.setDragTexture(0.58, 0.72);
    audio.play('pouch-land');
    await this.tweenPromise({
      targets: pouch.group,
      y: POUCH_Y + 12,
      scaleX: 1.065,
      scaleY: 0.9,
      duration: 82,
      ease: 'Quad.Out',
    });
    audio.stopDragTexture();
    if (!this.isCurrentActivation(generation)) return;

    await this.tweenPromise({
      targets: pouch.group,
      y: POUCH_Y - 7,
      scaleX: 0.988,
      scaleY: 1.025,
      duration: 118,
      ease: 'Sine.Out',
    });
    if (!this.isCurrentActivation(generation)) return;

    await this.tweenPromise({
      targets: pouch.group,
      y: POUCH_Y,
      scaleX: 1,
      scaleY: 1,
      duration: 155,
      ease: 'Back.Out',
    });
    if (!this.isCurrentActivation(generation)) return;

    pouch.shadow.setAlpha(0.28);
    shadow.destroy();
    this.groundShadow = null;
  }

  private scheduleGesturePointer(delayMs = 520): void {
    this.clearGesturePointer();
    if (this.phase !== 'idle' || !this.root || !this.metrics) return;
    this.pointerTimer = this.time.delayedCall(delayMs, () => {
      this.pointerTimer = null;
      if (this.phase !== 'idle' || !this.root || !this.metrics) return;
      this.gesturePointer = createGuidancePointer(
        this,
        this.root,
        this.metrics.centerX + POUCH_PRESENTATION.hitboxX - 10,
        POUCH_Y + POUCH_PRESENTATION.hitboxY - 44,
        { travelX: 72, durationMs: 720, repeatDelayMs: 420, angle: 0, scale: 0.92 },
      );
    });
  }

  private clearGesturePointer(): void {
    this.pointerTimer?.remove(false);
    this.pointerTimer = null;
    this.gesturePointer?.destroy();
    this.gesturePointer = null;
  }

  private beginDrag(pointer: Phaser.Input.Pointer): void {
    if (this.phase !== 'idle' || !this.pouch || !this.metrics) return;
    this.clearGesturePointer();
    getGameAudio().primeDragTexture();
    getGameAudio().play('pouch-grab');
    this.phase = 'dragging';
    this.drag = {
      pointerId: pointer.id,
      startPointerX: pointer.x,
      progress: 0,
      lastPointerTime: pointer.time,
    };
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.phase !== 'dragging' || !this.drag || !this.pouch || !this.metrics) return;
    if (pointer.id !== this.drag.pointerId) return;

    const logicalDelta = Math.max(0, (pointer.x - this.drag.startPointerX) / this.metrics.scale);
    const travel = this.pouch.tabEndX - this.pouch.tabStartX;
    const progress = Math.min(1, logicalDelta / POUCH_PRESENTATION.dragThreshold);
    const previousProgress = this.drag.progress;
    const elapsedSeconds = Math.max(0.008, (pointer.time - this.drag.lastPointerTime) / 1000);
    const progressDelta = Math.abs(progress - previousProgress);
    const velocity = Phaser.Math.Clamp(progressDelta / elapsedSeconds / 4, 0, 1);
    this.drag.progress = progress;
    this.drag.lastPointerTime = pointer.time;

    this.pouch.tab.setX(this.pouch.tabStartX + travel * progress);
    this.pouch.tab.setScale(1.12 - progress * 0.04);
    this.pouch.strip.setAlpha(1 - progress * 0.08);
    this.pouch.group.setScale(1 + progress * 0.018, 1 - progress * 0.012);
    getGameAudio().setDragTexture(progress, velocity);

    if (progress >= 1) void this.completeTear();
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.phase !== 'dragging' || !this.drag || !this.pouch) return;
    if (pointer.id !== this.drag.pointerId || this.drag.progress >= 1) return;

    getGameAudio().stopDragTexture();
    this.drag = null;
    this.phase = 'idle';
    this.tweens.add({
      targets: this.pouch.tab,
      x: this.pouch.tabStartX,
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: 'Sine.Out',
    });
    this.tweens.add({
      targets: this.pouch.strip,
      alpha: 1,
      duration: 150,
      ease: 'Sine.Out',
    });
    this.tweens.add({
      targets: this.pouch.group,
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: 'Sine.Out',
    });
    this.scheduleGesturePointer(650);
  }

  private async completeTear(): Promise<void> {
    if (this.phase !== 'dragging' || !this.session) return;
    this.phase = 'transitioning';
    this.clearGesturePointer();
    getGameAudio().stopDragTexture(true);
    getGameAudio().play('tear');
    this.pouch?.dragZone.disableInteractive();

    try {
      const pending = await this.session.prepareReveal('basic');
      if (this.isShutdown()) return;
      getPlatformRuntime().analytics.track('first_package_interaction');
      getPlatformRuntime().analytics.track('opening_started', {
        openingNumber: pending.openingNumber,
        lootPoolId: pending.lootPoolId,
        pouchType: pending.pouchType,
      });
      this.startOpening(pending.id);
    } catch (error: unknown) {
      if (this.isShutdown()) return;
      console.error('[onboarding] failed to stage first reward', error);
      this.phase = 'idle';
      this.drag = null;
      this.pouch?.dragZone.setInteractive({ useHandCursor: true });
      this.scheduleGesturePointer(700);
    }
  }

  private startOpening(onboardingHandoffId?: string): void {
    if (this.isShutdown()) return;
    this.scene.start('OpeningScene', onboardingHandoffId ? { onboardingHandoffId } : undefined);
  }

  private handleResize(): void {
    if (this.isShutdown() || this.phase === 'transitioning') return;
    // Restarting this short presentation is safer than trying to preserve a
    // half-finished entrance/drag across a backing-store resize. Durable reward
    // truth is still owned by OpeningSession and therefore cannot duplicate.
    this.scene.restart();
  }

  private handleShutdown(): void {
    this.activationGeneration += 1;
    this.phase = 'shutdown';
    this.clearGesturePointer();
    getGameAudio().stopDragTexture(true);
    getPlatformRuntime().activity.setGameplayDesired(false);
    this.input.off('pointermove', this.handlePointerMove, this);
    this.input.off('pointerup', this.handlePointerUp, this);
    this.scale.off('resize', this.handleResize, this);
    this.destroyStage();
  }

  private destroyStage(): void {
    this.clearGesturePointer();
    this.groundShadow?.destroy();
    this.groundShadow = null;
    this.pouch = null;
    this.root?.destroy(true);
    this.root = null;
  }

  private isShutdown(): boolean {
    return this.phase === 'shutdown';
  }

  private isCurrentActivation(generation: number): boolean {
    return generation === this.activationGeneration && !this.isShutdown();
  }

  private tweenPromise(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((resolve) => {
      this.tweens.add({
        ...config,
        onComplete: () => resolve(),
      });
    });
  }
}
