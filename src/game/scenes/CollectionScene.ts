import Phaser from 'phaser';

import { getPlatformRuntime } from '../../app/runtime';
import { getMessages } from '../../i18n';
import { staticTextureKey } from '../data/artAssets';
import { GAME_LOOT_POOL_IDS, GAME_REGISTRY, type GadgetFamilyDefinition, type GameLootPoolId, type StandardRarity } from '../data/collectibles';
import { getGameAudio } from '../systems/audio';
import { ensureLootPoolCollectibleArt } from '../systems/artLoading';
import {
  buildCollectionSnapshot,
  getShelfFeaturedOwned,
  getStandardLootPoolNearCompletion,
  type CollectionSnapshot,
} from '../systems/collection';
import { createLayoutMetrics, readSafeAreaInsets, type LayoutMetrics } from '../systems/layout';
import { SaveRepository, type SaveState } from '../systems/save';
import { persistMutedPreference } from '../systems/settings';
import { createCollectibleVisual, RARITY_REVEAL_COLORS, SECRET_REVEAL_COLOR } from '../ui/openingVisuals';
import { addCoverArt } from '../ui/staticArt';

const LOGICAL_HEIGHT = 720;
const FAMILIES_PER_PAGE = 2;
const RARITIES: readonly StandardRarity[] = ['common', 'rare', 'epic', 'legendary'];

type CollectionView = 'shelf' | 'library';

export class CollectionScene extends Phaser.Scene {
  private root: Phaser.GameObjects.Container | null = null;
  private metrics: LayoutMetrics | null = null;
  private saveState: SaveState | null = null;
  private snapshot: CollectionSnapshot | null = null;
  private view: CollectionView = 'shelf';
  private page = 0;
  private dropBrowseInFlight = false;

  public constructor() {
    super('CollectionScene');
  }

  public create(): void {
    const platform = getPlatformRuntime();
    this.dropBrowseInFlight = false;
    platform.activity.setGameplayDesired(false);
    this.scale.on('resize', this.render, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.render, this);
    });
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.saveState = await new SaveRepository(getPlatformRuntime().storage).load();
      this.snapshot = buildCollectionSnapshot(GAME_REGISTRY, this.saveState);
      const activeDropIndex = GAME_LOOT_POOL_IDS.indexOf(this.saveState.activeLootPoolId as GameLootPoolId);
      this.page = activeDropIndex >= 0 ? activeDropIndex : 0;
    } catch (error: unknown) {
      console.error(error);
      this.renderFailure();
      return;
    }

    try {
      await ensureLootPoolCollectibleArt(this, GAME_REGISTRY, this.selectedLootPoolId());
    } catch (error: unknown) {
      console.warn('[art] Collection active Drop art failed to load; using fallbacks', error);
    }

    if (!this.sys.isActive()) return;

    getPlatformRuntime().analytics.track('collection_open', {
      standardCount: this.snapshot.standardCount,
      standardTotal: this.snapshot.standardTotal,
      secretCount: this.snapshot.secretCount,
      secretTotal: this.snapshot.secretTotal,
    });
    this.render();
  }

  private createRoot(): Phaser.GameObjects.Container {
    this.root?.destroy(true);
    const metrics = createLayoutMetrics(this.scale.width, this.scale.height, readSafeAreaInsets());
    this.metrics = metrics;
    const root = this.add.container(metrics.offsetX, 0).setScale(metrics.scale);
    this.root = root;

    const background = addCoverArt(
      this,
      root,
      staticTextureKey('collection-bg'),
      metrics.logicalWidth,
      LOGICAL_HEIGHT,
    );
    if (!background) {
      root.add(
        this.add.rectangle(metrics.logicalWidth / 2, LOGICAL_HEIGHT / 2, metrics.logicalWidth, LOGICAL_HEIGHT, 0x211b2c),
      );
      root.add(this.add.ellipse(metrics.centerX, 375, Math.min(metrics.logicalWidth * 0.82, 1050), 610, 0x4c3a5d, 0.2));
    }
    return root;
  }

  private render(): void {
    if (!this.snapshot || !this.saveState) return;
    const root = this.createRoot();
    const metrics = this.metrics!;
    const messages = getMessages(getPlatformRuntime().language);

    if (this.view === 'shelf') {
      this.renderShelf(root);
    } else {
      this.renderLibrary(root);
    }

    if (this.view === 'shelf') {
      addCoverArt(
        this,
        root,
        staticTextureKey('collection-foreground'),
        metrics.logicalWidth,
        LOGICAL_HEIGHT,
      );
    }

    const topScrim = this.add.graphics();
    topScrim.fillStyle(0x1b1425, 0.26);
    topScrim.fillRoundedRect(metrics.centerX - 260, 22, 520, 138, 28);
    root.add(topScrim);

    root.add(
      this.add
        .text(metrics.centerX, 48, messages.collection.title, {
          color: '#f7f2ff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '30px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setShadow(0, 2, '#120d19', 4, true, true),
    );

    const poolProgress = this.selectedPoolProgress();
    root.add(
      this.add
        .text(
          metrics.centerX,
          86,
          `${messages.collection.standards} ${poolProgress.standardCount}/${poolProgress.standardTotal}   ·   ${messages.collection.secrets} ${poolProgress.secretCount}/${poolProgress.secretTotal}`,
          {
            color: '#cfc3dd',
            fontFamily: 'monospace',
            fontSize: '15px',
          },
        )
        .setOrigin(0.5)
        .setShadow(0, 2, '#120d19', 3, true, true),
    );

    const viewSwitcher = this.add.graphics();
    viewSwitcher.fillStyle(0x120d19, 0.9);
    viewSwitcher.fillRoundedRect(metrics.centerX - 166, 104, 332, 50, 18);
    viewSwitcher.lineStyle(2, 0xbda7d6, 0.42);
    viewSwitcher.strokeRoundedRect(metrics.centerX - 166, 104, 332, 50, 18);
    root.add(viewSwitcher);
    this.createTab(root, metrics.centerX - 78, 129, 'shelf', messages.collection.shelf);
    this.createTab(root, metrics.centerX + 78, 129, 'library', messages.collection.library);
    this.createMuteButton(root);

    this.renderPager(root);

    const back = this.add
      .text(metrics.safeLeft, metrics.safeBottom - 8, messages.collection.openMore, {
        color: '#f5eefc',
        backgroundColor: '#312746',
        padding: { x: 16, y: 10 },
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
      })
      .setOrigin(0, 1)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      getGameAudio().play('ui-click');
      back.disableInteractive().setAlpha(0.65);
      const lootPoolId = this.selectedLootPoolId();
      getPlatformRuntime().analytics.track('collection_return', {
        view: this.view,
        lootPoolId,
        standardCount: this.selectedPoolProgress().standardCount,
      });
      // Collection browsing is local. OpeningSession owns the durable switch.
      // Defer scene replacement until the current pointer dispatch has completed.
      this.time.delayedCall(0, () => this.scene.start('OpeningScene', { lootPoolId }));
    });
    root.add(back);
  }

  private createTab(
    root: Phaser.GameObjects.Container,
    x: number,
    y: number,
    view: CollectionView,
    label: string,
  ): void {
    const active = this.view === view;
    const width = 148;
    const height = 42;
    const tab = this.add.container(x, y);
    const background = this.add.graphics();
    background.fillStyle(active ? 0xf0e7fa : 0x251b33, active ? 0.98 : 0.96);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 14);
    background.lineStyle(
      active ? 2.5 : 1.5,
      active ? 0x8df8ff : 0xbda7d6,
      active ? 0.86 : 0.52,
    );
    background.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);
    const marker = this.add
      .rectangle(-width / 2 + 19, 0, 8, 8, active ? 0x8df8ff : 0x7f6f91, active ? 1 : 0.72)
      .setRotation(Math.PI / 4)
      .setStrokeStyle(1, active ? 0x211b2c : 0xe9ddf6, active ? 0.36 : 0.3);
    const text = this.add
      .text(8, 0, label, {
        color: active ? '#211b2c' : '#fff8ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setShadow(0, 1, active ? '#ffffff' : '#120d19', active ? 1 : 3, true, true);
    const zone = this.add
      .zone(0, 0, width, height)
      .setInteractive({ useHandCursor: true });
    tab.add([background, marker, text, zone]);
    zone.on('pointerover', () => {
      this.tweens.killTweensOf(tab);
      this.tweens.add({ targets: tab, scale: 1.025, duration: 90, ease: 'Sine.Out' });
    });
    zone.on('pointerout', () => {
      this.tweens.killTweensOf(tab);
      this.tweens.add({ targets: tab, scale: 1, duration: 110, ease: 'Sine.Out' });
    });
    zone.on('pointerdown', () => {
      this.tweens.killTweensOf(tab);
      this.tweens.add({ targets: tab, scale: 0.975, duration: 60, ease: 'Sine.Out' });
    });
    zone.on('pointerup', () => {
      if (this.view === view) {
        this.tweens.add({ targets: tab, scale: 1, duration: 90, ease: 'Sine.Out' });
        return;
      }
      getGameAudio().play('ui-click');
      this.view = view;
      getPlatformRuntime().analytics.track('collection_view_changed', {
        view,
        lootPoolId: this.selectedLootPoolId(),
      });
      this.render();
    });
    root.add(tab);
  }

  private createMuteButton(root: Phaser.GameObjects.Container): void {
    if (!this.metrics) return;
    const audio = getGameAudio();
    const messages = getMessages(getPlatformRuntime().language);
    const label = audio.isMuted() ? `🔇 ${messages.audio.unmute}` : `🔊 ${messages.audio.mute}`;
    const button = this.add
      .text(this.metrics.safeRight, this.metrics.safeTop + 8, label, {
        color: '#d9cfe4',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        backgroundColor: '#312746',
        padding: { x: 10, y: 7 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    button.on('pointerup', () => {
      const wasMuted = audio.isMuted();
      if (!wasMuted) audio.play('ui-click');
      const muted = audio.toggleMuted();
      if (wasMuted && !muted) audio.play('ui-click');
      void persistMutedPreference(getPlatformRuntime().storage, muted).catch((error: unknown) => {
        console.warn('[settings] failed to persist mute preference', error);
      });
      this.render();
    });
    root.add(button);
  }

  private selectedLootPoolId(): GameLootPoolId {
    return GAME_LOOT_POOL_IDS[this.page] ?? GAME_LOOT_POOL_IDS[0];
  }

  private selectedPoolProgress(): { standardCount: number; standardTotal: number; secretCount: number; secretTotal: number } {
    const poolId = this.selectedLootPoolId();
    const familyIds = new Set(GAME_REGISTRY.lootPoolById.get(poolId)?.familyIds ?? []);
    const families = this.snapshot?.families.filter(({ familyId }) => familyIds.has(familyId)) ?? [];
    return families.reduce(
      (progress, family) => ({
        standardCount: progress.standardCount + family.standardCount,
        standardTotal: progress.standardTotal + family.standardTotal,
        secretCount: progress.secretCount + family.secretOwned.length,
        secretTotal: progress.secretTotal + family.secretTotal,
      }),
      { standardCount: 0, standardTotal: 0, secretCount: 0, secretTotal: 0 },
    );
  }

  private visibleFamilies(): readonly GadgetFamilyDefinition[] {
    const pool = GAME_REGISTRY.lootPoolById.get(this.selectedLootPoolId());
    if (!pool) return [];
    return pool.familyIds
      .map((familyId) => GAME_REGISTRY.familyById.get(familyId))
      .filter((family): family is GadgetFamilyDefinition => Boolean(family))
      .slice(0, FAMILIES_PER_PAGE);
  }

  private renderShelf(root: Phaser.GameObjects.Container): void {
    const metrics = this.metrics!;
    const messages = getMessages(getPlatformRuntime().language);
    const families = this.visibleFamilies();
    const nearCompletion = this.saveState ? getStandardLootPoolNearCompletion(GAME_REGISTRY, this.selectedLootPoolId(), this.saveState) : null;
    const cardWidth = Math.min(300, (metrics.logicalWidth - 150) / Math.max(1, families.length) - 28);
    const gap = 44;
    const totalWidth = cardWidth * families.length + gap * Math.max(0, families.length - 1);
    const startX = metrics.centerX - totalWidth / 2 + cardWidth / 2;

    families.forEach((family, index) => {
      const familySnapshot = this.snapshot!.families.find(({ familyId }) => familyId === family.id)!;
      const familyNearCompletion = nearCompletion?.familyId === family.id;
      const x = startX + index * (cardWidth + gap);

      const glass = this.add.graphics();
      glass.fillStyle(0x251b33, 0.14);
      glass.fillRoundedRect(x - cardWidth / 2, 188, cardWidth, 372, 28);
      glass.lineStyle(1.5, 0xe8d8f7, 0.2);
      glass.strokeRoundedRect(x - cardWidth / 2, 188, cardWidth, 372, 28);
      root.add(glass);

      root.add(
        this.add
          .text(x, 216, family.name[getPlatformRuntime().language], {
            color: '#f8f2fd',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '20px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setShadow(0, 2, '#160f20', 4, true, true),
      );

      const featured = getShelfFeaturedOwned(family, familySnapshot);
      if (featured) {
        const visual = createCollectibleVisual(
          this,
          root,
          family.id,
          featured.rarity,
          x,
          360,
          featured.collectibleId,
        );
        visual.group.setScale(
          featured.rarity === 'secret' ? visual.presentation.shelfSecretScale : visual.presentation.shelfScale,
        );
        const featureColor = featured.rarity === 'secret' ? SECRET_REVEAL_COLOR : RARITY_REVEAL_COLORS[featured.rarity];
        root.add(
          this.add
            .text(x, 510, `${messages.collection.bestOwned}: ${messages.rarity[featured.rarity]}`, {
              color: `#${featureColor.toString(16).padStart(6, '0')}`,
              fontFamily: 'system-ui, sans-serif',
              fontSize: '15px',
              fontStyle: 'bold',
            })
            .setOrigin(0.5)
            .setShadow(0, 2, '#160f20', 4, true, true),
        );
      } else {
        root.add(this.add.circle(x, 360, 70, 0x251d2f, 0.5).setStrokeStyle(2, 0xe7d7f2, 0.18));
        root.add(
          this.add
            .text(x, 352, '?', {
              color: '#8a7a95',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '70px',
              fontStyle: 'bold',
            })
            .setOrigin(0.5)
            .setShadow(0, 2, '#160f20', 4, true, true),
        );
        root.add(
          this.add
            .text(x, 505, messages.collection.emptyShelf, {
              color: '#c1b5ca',
              align: 'center',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '14px',
              wordWrap: { width: cardWidth - 42 },
            })
            .setOrigin(0.5)
            .setShadow(0, 2, '#160f20', 3, true, true),
        );
      }

      root.add(
        this.add
          .text(
            x,
            542,
            `${familySnapshot.standardCount}/${familySnapshot.standardTotal}${familyNearCompletion ? ` · ${messages.collection.nearCompletionOneLeft}` : ''}   ·   ✦ ${familySnapshot.secretOwned.length}/${familySnapshot.secretTotal}`,
            {
              color: familyNearCompletion ? '#8df8ff' : '#ded3e8',
              fontFamily: 'monospace',
              fontSize: '13px',
              fontStyle: familyNearCompletion ? 'bold' : 'normal',
            },
          )
          .setOrigin(0.5)
          .setShadow(0, 2, '#160f20', 3, true, true),
      );
    });
  }

  private renderLibrary(root: Phaser.GameObjects.Container): void {
    const metrics = this.metrics!;
    const messages = getMessages(getPlatformRuntime().language);
    const families = this.visibleFamilies();
    const nearCompletion = this.saveState ? getStandardLootPoolNearCompletion(GAME_REGISTRY, this.selectedLootPoolId(), this.saveState) : null;
    const rowStartY = families.length === 1 ? 330 : 270;
    const rowGap = 245;

    families.forEach((family, familyIndex) => {
      const familySnapshot = this.snapshot!.families.find(({ familyId }) => familyId === family.id)!;
      const y = rowStartY + familyIndex * rowGap;
      root.add(
        this.add
          .text(metrics.centerX, y - 100, family.name[getPlatformRuntime().language], {
            color: '#f4edf9',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setShadow(0, 2, '#160f20', 3, true, true),
      );

      const entries = [
        ...RARITIES.map((rarity) => ({
          id: family.standard[rarity].id,
          rarity,
          secret: false as const,
          owned: familySnapshot.standardOwned[rarity],
        })),
        ...family.secrets.map((secret) => ({
          id: secret.id,
          rarity: 'secret' as const,
          secret: true as const,
          owned: familySnapshot.secretOwned.includes(secret.id),
        })),
      ];
      const availableWidth = metrics.safeRight - metrics.safeLeft - 70;
      const gap = 14;
      const cardWidth = Math.min(154, (availableWidth - gap * Math.max(0, entries.length - 1)) / entries.length);
      const totalWidth = cardWidth * entries.length + gap * Math.max(0, entries.length - 1);
      const startX = metrics.centerX - totalWidth / 2 + cardWidth / 2;

      entries.forEach((entry, index) => {
        const x = startX + index * (cardWidth + gap);
        const borderColor = entry.secret ? 0x65f6ff : RARITY_REVEAL_COLORS[entry.rarity];
        const isLastStandard = Boolean(
          !entry.secret &&
          !entry.owned &&
          nearCompletion?.missingCollectibleId === entry.id,
        );
        const card = this.add
          .rectangle(x, y, cardWidth, 154, entry.owned ? 0x382e46 : isLastStandard ? 0x302b3a : 0x292231, 0.96)
          .setStrokeStyle(isLastStandard ? 3 : 2, borderColor, isLastStandard ? 0.9 : entry.owned ? 0.75 : 0.25);
        card.setData('nearCompletionLastStandard', isLastStandard ? entry.id : null);
        root.add(card);
        if (entry.owned) {
          const visual = createCollectibleVisual(this, root, family.id, entry.rarity, x, y - 8, entry.id);
          visual.group.setScale(
            entry.secret ? visual.presentation.librarySecretScale : visual.presentation.libraryScale,
          );
        } else {
          root.add(
            this.add
              .text(x, y - 8, '?', {
                color: '#62566e',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '42px',
                fontStyle: 'bold',
              })
              .setOrigin(0.5),
          );
        }
        if (isLastStandard) {
          const lastTag = this.add
            .text(x, y + 35, messages.collection.lastStandard, {
              color: '#dffcff',
              backgroundColor: '#203544',
              padding: { x: 5, y: 3 },
              fontFamily: 'monospace',
              fontSize: '7px',
              fontStyle: 'bold',
            })
            .setOrigin(0.5);
          lastTag.setData('nearCompletionLastStandard', entry.id);
          root.add(lastTag);
        }
        root.add(
          this.add
            .text(x, y + 60, messages.rarity[entry.rarity], {
              color: entry.owned ? '#efe8f6' : '#7e7089',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '12px',
              fontStyle: entry.secret ? 'bold' : 'normal',
            })
            .setOrigin(0.5),
        );
      });
    });
  }

  private renderPager(root: Phaser.GameObjects.Container): void {
    if (!this.metrics) return;
    const pageCount = GAME_LOOT_POOL_IDS.length;
    if (pageCount <= 1) return;

    const messages = getMessages(getPlatformRuntime().language);
    const y = 638;
    const width = Phaser.Math.Clamp(this.metrics.logicalWidth * 0.42, 360, 500);
    const height = 66;
    const pager = this.add.container(this.metrics.centerX, y);
    const surface = this.add.graphics();
    surface.fillStyle(0x17101f, 0.94);
    surface.fillRoundedRect(-width / 2, -height / 2, width, height, 22);
    surface.lineStyle(2, 0xbda7d6, 0.36);
    surface.strokeRoundedRect(-width / 2, -height / 2, width, height, 22);

    const title = this.add
      .text(0, -14, messages.drops[this.selectedLootPoolId()], {
        color: '#f7f2ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setShadow(0, 2, '#120d19', 3, true, true);
    const pageLabel = this.add
      .text(0, 6, `${this.page + 1} / ${pageCount}`, {
        color: '#c8b9d8',
        fontFamily: 'monospace',
        fontSize: '10px',
      })
      .setOrigin(0.5);

    const dotGap = 13;
    const dotsWidth = dotGap * (pageCount - 1);
    const dotStartX = -dotsWidth / 2;
    for (let index = 0; index < pageCount; index += 1) {
      const active = index === this.page;
      const dot = this.add
        .rectangle(dotStartX + index * dotGap, 22, active ? 14 : 5, 5, active ? 0xe9ddf6 : 0x7d6d8b, active ? 0.95 : 0.62)
        .setOrigin(0.5);
      if (active) dot.setStrokeStyle(1, 0xffffff, 0.25);
      pager.add(dot);
    }

    let swipeStartX: number | null = null;
    const swipeZone = this.add
      .zone(0, 0, Math.max(120, width - 150), height)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    swipeZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.dropBrowseInFlight) return;
      swipeStartX = pointer.x;
    });
    swipeZone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (swipeStartX === null || this.dropBrowseInFlight) return;
      const delta = pointer.x - swipeStartX;
      swipeStartX = null;
      if (Math.abs(delta) < 34) return;
      const direction: -1 | 1 = delta < 0 ? 1 : -1;
      if ((direction < 0 && this.page === 0) || (direction > 0 && this.page === pageCount - 1)) return;
      void this.browseDrop(direction);
    });
    swipeZone.on('pointerout', () => {
      swipeStartX = null;
    });

    const createArrow = (direction: -1 | 1, x: number, enabled: boolean): Phaser.GameObjects.Container => {
      const button = this.add.container(x, 0);
      const background = this.add
        .rectangle(0, 0, 54, 48, enabled ? 0x302641 : 0x211a2b, enabled ? 0.98 : 0.72)
        .setStrokeStyle(2, enabled ? 0xe8d8f7 : 0x75677f, enabled ? 0.54 : 0.2);
      const glyph = this.add
        .text(0, -1, direction < 0 ? '‹' : '›', {
          color: enabled ? '#fff8ff' : '#6f6377',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '34px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      button.add([background, glyph]);
      if (enabled) {
        background.setInteractive({ useHandCursor: true });
        background.on('pointerover', () => button.setScale(1.035));
        background.on('pointerout', () => button.setScale(1));
        background.on('pointerdown', () => button.setScale(0.95));
        background.on('pointerup', () => {
          button.setScale(1.035);
          if (!this.dropBrowseInFlight) void this.browseDrop(direction);
        });
      }
      return button;
    };

    const previous = createArrow(-1, -width / 2 + 38, this.page > 0);
    const next = createArrow(1, width / 2 - 38, this.page < pageCount - 1);
    pager.add([surface, swipeZone, title, pageLabel, previous, next]);
    pager.sendToBack(surface);
    root.add(pager);
  }

  private async browseDrop(direction: -1 | 1): Promise<void> {
    if (this.dropBrowseInFlight) return;
    const nextPage = this.page + direction;
    if (nextPage < 0 || nextPage >= GAME_LOOT_POOL_IDS.length) return;
    const nextPoolId: GameLootPoolId = GAME_LOOT_POOL_IDS[nextPage] ?? GAME_LOOT_POOL_IDS[0];

    this.dropBrowseInFlight = true;
    getGameAudio().play('carousel-switch');
    try {
      await ensureLootPoolCollectibleArt(this, GAME_REGISTRY, nextPoolId);
    } catch (error: unknown) {
      console.warn('[art] browsed Drop art failed to load; using fallbacks', error);
    }
    if (!this.sys.isActive()) {
      this.dropBrowseInFlight = false;
      return;
    }
    this.page = nextPage;
    this.dropBrowseInFlight = false;
    getPlatformRuntime().analytics.track('collection_drop_browsed', {
      lootPoolId: nextPoolId,
      view: this.view,
      direction,
    });
    this.render();
  }

  private renderFailure(): void {
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
      .text(metrics.centerX, metrics.centerY, getMessages(getPlatformRuntime().language).collection.loadError, {
        color: '#fff1f5',
        align: 'center',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        wordWrap: { width: panelWidth - 56 },
      })
      .setOrigin(0.5)
      .setShadow(0, 2, '#120d19', 3, true, true);
    root.add([panel, text]);
  }
}
