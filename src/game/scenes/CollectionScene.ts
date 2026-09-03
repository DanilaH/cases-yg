import Phaser from 'phaser';

import { getPlatformRuntime } from '../../app/runtime';
import { getMessages } from '../../i18n';
import { staticTextureKey } from '../data/artAssets';
import { SLICE_REGISTRY, type GadgetFamilyDefinition, type StandardRarity } from '../data/collectibles';
import { getGameAudio } from '../systems/audio';
import { buildCollectionSnapshot, type CollectionSnapshot, type FamilyCollectionSnapshot } from '../systems/collection';
import { createLayoutMetrics, readSafeAreaInsets, type LayoutMetrics } from '../systems/layout';
import { SaveRepository, type SaveState } from '../systems/save';
import { persistMutedPreference } from '../systems/settings';
import { createCollectibleVisual, RARITY_REVEAL_COLORS } from '../ui/openingVisuals';
import { addCoverArt } from '../ui/staticArt';

const LOGICAL_HEIGHT = 720;
const FAMILIES_PER_PAGE = 2;
const RARITIES: readonly StandardRarity[] = ['common', 'rare', 'epic', 'legendary'];

type CollectionView = 'shelf' | 'library';

const highestOwnedRarity = (snapshot: FamilyCollectionSnapshot): StandardRarity | null => {
  for (const rarity of ['legendary', 'epic', 'rare', 'common'] as const) {
    if (snapshot.standardOwned[rarity]) return rarity;
  }
  return null;
};

export class CollectionScene extends Phaser.Scene {
  private root: Phaser.GameObjects.Container | null = null;
  private metrics: LayoutMetrics | null = null;
  private saveState: SaveState | null = null;
  private snapshot: CollectionSnapshot | null = null;
  private view: CollectionView = 'shelf';
  private page = 0;

  public constructor() {
    super('CollectionScene');
  }

  public create(): void {
    const platform = getPlatformRuntime();
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
      this.snapshot = buildCollectionSnapshot(SLICE_REGISTRY, this.saveState);
    } catch (error: unknown) {
      console.error(error);
      this.renderFailure();
      return;
    }

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

    addCoverArt(
      this,
      root,
      staticTextureKey('collection-foreground'),
      metrics.logicalWidth,
      LOGICAL_HEIGHT,
    );

    root.add(
      this.add
        .text(metrics.centerX, 48, messages.collection.title, {
          color: '#f7f2ff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '30px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );

    root.add(
      this.add
        .text(
          metrics.centerX,
          86,
          `${messages.collection.standards} ${this.snapshot.standardCount}/${this.snapshot.standardTotal}   ·   ${messages.collection.secrets} ${this.snapshot.secretCount}/${this.snapshot.secretTotal}`,
          {
            color: '#cfc3dd',
            fontFamily: 'monospace',
            fontSize: '15px',
          },
        )
        .setOrigin(0.5),
    );

    this.createTab(root, metrics.centerX - 78, 128, 'shelf', messages.collection.shelf);
    this.createTab(root, metrics.centerX + 78, 128, 'library', messages.collection.library);
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
    back.on('pointerup', () => {
      getPlatformRuntime().analytics.track('collection_return', {
        view: this.view,
        standardCount: this.snapshot?.standardCount ?? 0,
      });
      this.scene.start('OpeningScene');
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
    const tab = this.add
      .text(x, y, label, {
        color: active ? '#211b2c' : '#e7def0',
        backgroundColor: active ? '#e4d7f2' : '#3a3049',
        padding: { x: 18, y: 8 },
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: active ? 'bold' : 'normal',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    tab.on('pointerup', () => {
      if (this.view === view) return;
      this.view = view;
      this.page = 0;
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
      audio.toggleMuted();
      this.render();
    });
    root.add(button);
  }

  private visibleFamilies(): readonly GadgetFamilyDefinition[] {
    const start = this.page * FAMILIES_PER_PAGE;
    return SLICE_REGISTRY.families.slice(start, start + FAMILIES_PER_PAGE);
  }

  private renderShelf(root: Phaser.GameObjects.Container): void {
    const metrics = this.metrics!;
    const messages = getMessages(getPlatformRuntime().language);
    const families = this.visibleFamilies();
    const cardWidth = Math.min(320, (metrics.logicalWidth - 150) / Math.max(1, families.length) - 22);
    const gap = 34;
    const totalWidth = cardWidth * families.length + gap * Math.max(0, families.length - 1);
    const startX = metrics.centerX - totalWidth / 2 + cardWidth / 2;

    families.forEach((family, index) => {
      const familySnapshot = this.snapshot!.families.find(({ familyId }) => familyId === family.id)!;
      const x = startX + index * (cardWidth + gap);
      const card = this.add
        .rectangle(x, 380, cardWidth, 392, 0x342a42, 0.92)
        .setStrokeStyle(2, 0x6a5a7d, 0.72);
      root.add(card);
      root.add(
        this.add
          .text(x, 210, family.name[getPlatformRuntime().language], {
            color: '#f4edf9',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '20px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5),
      );

      const best = highestOwnedRarity(familySnapshot);
      if (best) {
        const visual = createCollectibleVisual(this, root, family.id, best, x, 365, family.standard[best].id);
        visual.group.setScale(0.78);
        root.add(
          this.add
            .text(x, 518, `${messages.collection.bestOwned}: ${messages.rarity[best]}`, {
              color: `#${RARITY_REVEAL_COLORS[best].toString(16).padStart(6, '0')}`,
              fontFamily: 'system-ui, sans-serif',
              fontSize: '15px',
              fontStyle: 'bold',
            })
            .setOrigin(0.5),
        );
      } else {
        root.add(this.add.circle(x, 365, 76, 0x282130, 0.85).setStrokeStyle(3, 0x5c4e69, 0.7));
        root.add(
          this.add
            .text(x, 355, '?', {
              color: '#756681',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '76px',
              fontStyle: 'bold',
            })
            .setOrigin(0.5),
        );
        root.add(
          this.add
            .text(x, 505, messages.collection.emptyShelf, {
              color: '#a99bb5',
              align: 'center',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '14px',
              wordWrap: { width: cardWidth - 36 },
            })
            .setOrigin(0.5),
        );
      }

      if (familySnapshot.secretOwned.length > 0) {
        root.add(
          this.add
            .text(x, 556, `✦ ${messages.collection.secret}`, {
              color: '#8df8ff',
              fontFamily: 'monospace',
              fontSize: '14px',
              fontStyle: 'bold',
            })
            .setOrigin(0.5),
        );
      }
      root.add(
        this.add
          .text(x, 588, `${familySnapshot.standardCount}/${familySnapshot.standardTotal}`, {
            color: '#c8bbd4',
            fontFamily: 'monospace',
            fontSize: '14px',
          })
          .setOrigin(0.5),
      );
    });
  }

  private renderLibrary(root: Phaser.GameObjects.Container): void {
    const metrics = this.metrics!;
    const messages = getMessages(getPlatformRuntime().language);
    const families = this.visibleFamilies();
    const rowStartY = families.length === 1 ? 320 : 245;
    const rowGap = 255;

    families.forEach((family, familyIndex) => {
      const familySnapshot = this.snapshot!.families.find(({ familyId }) => familyId === family.id)!;
      const y = rowStartY + familyIndex * rowGap;
      root.add(
        this.add
          .text(metrics.safeLeft + 24, y - 80, family.name[getPlatformRuntime().language], {
            color: '#f4edf9',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
          })
          .setOrigin(0, 0.5),
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
        root.add(
          this.add
            .rectangle(x, y, cardWidth, 154, entry.owned ? 0x382e46 : 0x292231, 0.96)
            .setStrokeStyle(2, borderColor, entry.owned ? 0.75 : 0.25),
        );
        if (entry.owned) {
          const visual = createCollectibleVisual(this, root, family.id, entry.rarity, x, y - 8, entry.id);
          visual.group.setScale(entry.secret ? 0.29 : 0.27);
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
    const pageCount = Math.ceil(SLICE_REGISTRY.families.length / FAMILIES_PER_PAGE);
    if (pageCount <= 1) return;

    const y = 640;
    const previous = this.add
      .text(this.metrics.centerX - 72, y, '‹', {
        color: this.page > 0 ? '#f1e8f7' : '#5b5064',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '32px',
      })
      .setOrigin(0.5);
    const next = this.add
      .text(this.metrics.centerX + 72, y, '›', {
        color: this.page < pageCount - 1 ? '#f1e8f7' : '#5b5064',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '32px',
      })
      .setOrigin(0.5);
    const pageLabel = this.add
      .text(this.metrics.centerX, y, `${this.page + 1}/${pageCount}`, {
        color: '#a99bb5',
        fontFamily: 'monospace',
        fontSize: '13px',
      })
      .setOrigin(0.5);

    if (this.page > 0) {
      previous.setInteractive({ useHandCursor: true }).on('pointerup', () => {
        this.page -= 1;
        this.render();
      });
    }
    if (this.page < pageCount - 1) {
      next.setInteractive({ useHandCursor: true }).on('pointerup', () => {
        this.page += 1;
        this.render();
      });
    }
    root.add([previous, pageLabel, next]);
  }

  private renderFailure(): void {
    const root = this.createRoot();
    const metrics = this.metrics!;
    root.add(
      this.add
        .text(metrics.centerX, metrics.centerY, getMessages(getPlatformRuntime().language).collection.loadError, {
          color: '#ffb7c8',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
        })
        .setOrigin(0.5),
    );
  }
}
