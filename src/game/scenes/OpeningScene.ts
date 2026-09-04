import Phaser from 'phaser';

import { getPlatformRuntime } from '../../app/runtime';
import { getMessages } from '../../i18n';
import { staticTextureKey } from '../data/artAssets';
import { SLICE_BALANCE } from '../data/balance';
import { SLICE_REGISTRY, type StandardRarity } from '../data/collectibles';
import { getGameAudio } from '../systems/audio';
import type { PendingReveal } from '../systems/drops';
import { createLayoutMetrics, readSafeAreaInsets, type LayoutMetrics } from '../systems/layout';
import { OpeningSession } from '../systems/openingSession';
import { MathRandomSource } from '../systems/random';
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
import { addCoverArt } from '../ui/staticArt';

const LOGICAL_HEIGHT = 720;
const POUCH_Y = 392;
const DRAG_THRESHOLD = 238;
const RESULT_HOLD_MS = 600;

type OpeningPhase = 'booting' | 'idle' | 'dragging' | 'revealing' | 'result' | 'failed' | 'shutdown';

interface DragState {
  pointerId: number;
  startPointerX: number;
  progress: number;
}

interface ResultCarouselDrag {
  pointerId: number;
  startPointerX: number;
  deltaX: number;
}

export class OpeningScene extends Phaser.Scene {
  private phase: OpeningPhase = 'booting';
  private root: Phaser.GameObjects.Container | null = null;
  private metrics: LayoutMetrics | null = null;
  private pouch: PouchVisual | null = null;
  private collectionButton: Phaser.GameObjects.Text | null = null;
  private resultPrompt: Phaser.GameObjects.Text | null = null;
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
  private resultCarouselIndex = 0;
  private resultCarouselDrag: ResultCarouselDrag | null = null;
  private resultCarouselZone: Phaser.GameObjects.Zone | null = null;

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

    const platform = getPlatformRuntime();
    platform.activity.setGameplayDesired(true);

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
      balance: SLICE_BALANCE,
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

    this.renderIdle();
    platform.markReady();

    const pending = this.saveState.pendingReveal;
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
    this.input.off('pointermove', this.handlePointerMove, this);
    this.input.off('pointerup', this.handlePointerUp, this);
    this.scale.off('resize', this.handleResize, this);
    this.tweens.killAll();
    getPlatformRuntime().activity.setGameplayDesired(false);
  }

  private handleResize(): void {
    if (this.phase === 'booting' || this.isSceneShutdown() || this.phase === 'failed') {
      return;
    }

    if (this.phase === 'revealing') {
      this.deferredResize = true;
      return;
    }

    if (this.phase === 'dragging') {
      this.drag = null;
      this.phase = 'idle';
    }

    if (this.phase === 'result' && this.lastReveal) {
      this.renderResolvedResult(this.lastReveal);
      return;
    }

    this.renderIdle();
  }

  private createRoot(): Phaser.GameObjects.Container {
    this.root?.destroy(true);
    this.pouch = null;
    this.collectionButton = null;
    this.resultPrompt = null;
    this.standardResultLabels = [];
    this.standardResultScrim = null;
    this.resultCarouselItems = [];
    this.resultCarouselDots = [];
    this.resultCarouselIndex = 0;
    this.resultCarouselDrag = null;
    this.resultCarouselZone = null;
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

  private renderIdle(message?: string): void {
    if (!this.saveState || this.isSceneShutdown()) return;

    this.phase = 'idle';
    this.resultReady = false;
    this.lastReveal = null;
    this.drag = null;
    this.deferredResize = false;

    const root = this.createRoot();
    const metrics = this.metrics!;
    this.renderSignalHud(root, this.saveState.signal);
    if (this.saveState.totalOpens > 0) {
      this.createCollectionButton(root, true);
      this.createMuteButton(root);
    }

    this.pouch = createPouchVisual(this, root, metrics.centerX, POUCH_Y);
    this.pouch.dragZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.beginDrag(pointer));

    const tearHint = this.add
      .text(metrics.centerX, 610, getMessages(getPlatformRuntime().language).opening.tearHint, {
        color: '#efe7f6',
        backgroundColor: '#2a2037',
        padding: { x: 14, y: 8 },
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
      })
      .setOrigin(0.5)
      .setShadow(0, 2, '#120d19', 3, true, true);
    root.add(tearHint);

    if (message) {
      root.add(
        this.add
          .text(metrics.centerX, 648, message, {
            color: '#ffb7c8',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '15px',
          })
          .setOrigin(0.5),
      );
    }
  }

  private renderFailure(message: string): void {
    const root = this.createRoot();
    const metrics = this.metrics!;
    root.add(
      this.add
        .text(metrics.centerX, metrics.centerY, message, {
          color: '#ffb7c8',
          align: 'center',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '20px',
          wordWrap: { width: Math.min(620, metrics.logicalWidth - 100) },
        })
        .setOrigin(0.5),
    );
  }

  private renderSignalHud(root: Phaser.GameObjects.Container, signal: number, lockText = false): void {
    if (!this.metrics) return;
    if (signal <= 0 && !lockText) return;

    const threshold = SLICE_BALANCE.signal.threshold;
    const width = 190;
    const x = this.metrics.safeLeft;
    const y = this.metrics.safeTop + 18;
    const clamped = Math.min(threshold, Math.max(0, signal));

    const label = this.add.text(x, y, lockText || clamped >= threshold ? 'SIGNAL LOCK' : `SIGNAL ${clamped}/${threshold}`, {
      color: '#b9f7ff',
      fontFamily: 'monospace',
      fontSize: '16px',
      fontStyle: 'bold',
    });
    const track = this.add.rectangle(x, y + 30, width, 13, 0x3a3146, 1).setOrigin(0, 0.5);
    const fill = this.add
      .rectangle(x, y + 30, width * (clamped / threshold), 13, 0x76e9f5, 0.92)
      .setOrigin(0, 0.5);
    root.add([label, track, fill]);
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
      const muted = audio.toggleMuted();
      button.setText(muted ? `🔇 ${messages.audio.unmute}` : `🔊 ${messages.audio.mute}`);
      void persistMutedPreference(getPlatformRuntime().storage, muted).catch((error: unknown) => {
        console.warn('[settings] failed to persist mute preference', error);
      });
    });
    root.add(button);
  }

  private setChromeEnabled(enabled: boolean): void {
    if (!this.collectionButton) return;
    this.collectionButton.setAlpha(enabled ? 1 : 0.32);
    if (enabled) {
      this.collectionButton.setInteractive({ useHandCursor: true });
    } else {
      this.collectionButton.disableInteractive();
    }
  }

  private beginDrag(pointer: Phaser.Input.Pointer): void {
    if (this.phase !== 'idle' || !this.pouch || !this.metrics) return;

    this.phase = 'dragging';
    this.drag = {
      pointerId: pointer.id,
      startPointerX: pointer.x,
      progress: 0,
    };
    this.setChromeEnabled(false);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.phase === 'result' && this.resultCarouselDrag && this.metrics) {
      if (pointer.id !== this.resultCarouselDrag.pointerId) return;
      const delta = (pointer.x - this.resultCarouselDrag.startPointerX) / this.metrics.scale;
      this.resultCarouselDrag.deltaX = Phaser.Math.Clamp(delta, -220, 220);
      this.positionResultCarousel(this.resultCarouselDrag.deltaX, false);
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
    this.pouch.strip.setAlpha(1 - progress * 0.08);

    if (progress >= 1) {
      const firstInteraction = this.saveState?.totalOpens === 0 && !this.firstInteractionTracked;
      void this.completeTear(firstInteraction);
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.ignoreNextResultTap) {
      this.ignoreNextResultTap = false;
      return;
    }

    if (this.phase === 'result') {
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
      duration: 170,
      ease: 'Sine.Out',
    });
    this.tweens.add({
      targets: pouch.strip,
      alpha: 1,
      duration: 140,
      ease: 'Sine.Out',
    });
  }

  private async completeTear(firstInteraction: boolean): Promise<void> {
    if (this.phase !== 'dragging' || !this.session) return;

    this.phase = 'revealing';
    this.drag = null;
    this.pouch?.dragZone.disableInteractive();
    this.setChromeEnabled(false);
    getGameAudio().play('tear');

    try {
      const pending = await this.session.prepareReveal();
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

    if (recovered) {
      this.pouch.tab.setX(this.pouch.tabEndX);
    }

    await this.animateTearDetach(recovered);
    if (this.isSceneShutdown()) return;

    const standardVisual = await this.animateStandardReveal(pending);
    if (this.isSceneShutdown()) return;

    if (pending.hiddenPocket) {
      await this.animateHiddenPocket(pending, standardVisual);
      if (this.isSceneShutdown()) return;
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

    await this.wait(RESULT_HOLD_MS);
    if (this.phase !== 'result') return;
    this.resultReady = true;
    if (this.resultPrompt) {
      this.resultPrompt.setText(getMessages(getPlatformRuntime().language).opening.tapNext);
      this.resultPrompt.setAlpha(1);
    }
  }

  private async animateTearDetach(recovered: boolean): Promise<void> {
    if (!this.pouch) return;
    const pouch = this.pouch;
    const originalY = pouch.group.y;

    await new Promise<void>((resolve) => {
      this.tweens.add({
        targets: pouch.strip,
        x: recovered ? 130 : 172,
        alpha: 0,
        duration: recovered ? 100 : 155,
        ease: 'Cubic.In',
        onComplete: () => resolve(),
      });
    });

    await new Promise<void>((resolve) => {
      this.tweens.add({
        targets: pouch.group,
        y: originalY + 8,
        duration: 55,
        yoyo: true,
        ease: 'Sine.InOut',
        onComplete: () => resolve(),
      });
    });
  }

  private async animateStandardReveal(pending: PendingReveal): Promise<Phaser.GameObjects.Container> {
    const root = this.root!;
    const metrics = this.metrics!;
    const pouch = this.pouch!;
    const color = RARITY_REVEAL_COLORS[pending.standard.rarity];
    getGameAudio().play('reveal-pop');
    const heroX = metrics.centerX;
    const heroY = 320;

    const flash = this.add.circle(heroX, POUCH_Y - 16, 82, color, 0.18).setScale(0.25);
    root.add(flash);
    const ring = createRevealRing(this, root, heroX, heroY, color).setScale(0.55).setAlpha(0);
    const visual = createCollectibleVisual(
      this,
      root,
      pending.standard.familyId,
      pending.standard.rarity,
      heroX,
      POUCH_Y + 52,
      pending.standard.collectibleId,
    );
    visual.group.setScale(0.24).setAlpha(0);

    this.spawnSparkles(heroX, heroY, color, pending.standard.rarity === 'legendary' ? 10 : 7);

    void new Promise<void>((resolve) => {
      this.tweens.add({
        targets: flash,
        scale: 3.1,
        alpha: 0,
        duration: 280,
        ease: 'Cubic.Out',
        onComplete: () => {
          flash.destroy();
          resolve();
        },
      });
    });

    void new Promise<void>((resolve) => {
      this.tweens.add({
        targets: ring,
        scale: 1.35,
        alpha: 0.65,
        duration: 240,
        yoyo: true,
        ease: 'Sine.Out',
        onComplete: () => {
          ring.destroy();
          resolve();
        },
      });
    });

    await new Promise<void>((resolve) => {
      this.tweens.add({
        targets: visual.group,
        y: heroY,
        scale: 1.07,
        alpha: 1,
        duration: 370,
        ease: 'Back.Out',
        onComplete: () => resolve(),
      });
    });

    await new Promise<void>((resolve) => {
      this.tweens.add({
        targets: pouch.group,
        y: pouch.group.y + 82,
        scale: 0.92,
        alpha: 0,
        duration: 220,
        ease: 'Cubic.In',
        onComplete: () => resolve(),
      });
    });

    await new Promise<void>((resolve) => {
      this.tweens.add({
        targets: visual.group,
        scale: 1,
        y: heroY - 4,
        duration: 140,
        ease: 'Sine.Out',
        onComplete: () => resolve(),
      });
    });

    if (pending.standard.rarity === 'epic' || pending.standard.rarity === 'legendary') {
      this.cameras.main.shake(85, pending.standard.rarity === 'legendary' ? 0.0025 : 0.0017);
    }

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
    this.addStandardResultLabels(pending, heroX, 492);
    return visual.group;
  }

  private getStandardResultStatus(pending: PendingReveal): string {
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

  private spawnSparkles(x: number, y: number, color: number, count: number): void {
    if (!this.root) return;
    const root = this.root;
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + 0.18;
      const distance = 82 + (index % 3) * 24;
      const sparkle = this.add.circle(x, y, index % 2 === 0 ? 5 : 3, color, 0.9);
      root.add(sparkle);
      this.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.25,
        duration: 380 + (index % 3) * 70,
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
      hiddenPocket: pending.hiddenPocket !== null,
      signalAfter: committed.signal,
    });

    if (pending.signal.lockReached) {
      analytics.track('signal_lock_reached', { openingNumber: pending.openingNumber });
    }
    if (pending.signal.lockConsumed) {
      analytics.track('signal_lock_consumed', { openingNumber: pending.openingNumber });
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

  private addResultPrompt(): void {
    if (!this.root || !this.metrics) return;
    this.resultPrompt?.destroy();
    this.resultPrompt = this.add
      .text(this.metrics.centerX, 646, getMessages(getPlatformRuntime().language).opening.resultLocked, {
        color: '#eee6f5',
        backgroundColor: '#2a2037',
        padding: { x: 12, y: 7 },
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
      })
      .setOrigin(0.5)
      .setAlpha(0.8)
      .setInteractive({ useHandCursor: true });
    this.resultPrompt.on('pointerup', () => {
      if (this.phase !== 'result' || !this.resultReady) return;
      this.resultCarouselDrag = null;
      this.renderIdle();
    });
    this.root.add(this.resultPrompt);
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

  private renderResolvedResult(pending: PendingReveal): void {
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
        316,
        pending.standard.collectibleId,
      );
      standard.group.setScale(1);
      this.addStandardResultLabels(pending, metrics.centerX, 492);
    }

    this.addResultPrompt();
    if (this.resultReady && this.resultPrompt) {
      this.resultPrompt.setText(getMessages(getPlatformRuntime().language).opening.tapNext).setAlpha(1);
    }
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
