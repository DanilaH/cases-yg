from pathlib import Path


def read(path: str) -> str:
    return Path(path).read_text()


def write(path: str, text: str) -> None:
    Path(path).write_text(text)


def replace_once(path: str, old: str, new: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one match, found {count}: {old[:120]!r}")
    write(path, text.replace(old, new, 1))


# Production Drop id type.
replace_once(
    'src/game/data/collectibles.ts',
    "export const GAME_LOOT_POOL_IDS = [\n  DEFAULT_LOOT_POOL_ID,\n  'video-link',\n  'pocket-office',\n  'pocket-audio',\n  'game-zone',\n  'analog-nights',\n] as const;",
    "export const GAME_LOOT_POOL_IDS = [\n  DEFAULT_LOOT_POOL_ID,\n  'video-link',\n  'pocket-office',\n  'pocket-audio',\n  'game-zone',\n  'analog-nights',\n] as const;\nexport type GameLootPoolId = (typeof GAME_LOOT_POOL_IDS)[number];",
)

# Localized Drop names and switch feedback.
replace_once('src/i18n/en.ts', "    collection: 'Collection →',", "    collection: 'Collection →',\n    drop: 'DROP',\n    dropSwitchError: 'Could not switch Drop. Try again.',")
replace_once(
    'src/i18n/en.ts',
    "  audio: {",
    "  drops: {\n    'y2k-essentials': 'Y2K Essentials',\n    'video-link': 'Video Link',\n    'pocket-office': 'Pocket Office',\n    'pocket-audio': 'Pocket Audio',\n    'game-zone': 'Game Zone',\n    'analog-nights': 'Analog Nights',\n  },\n  audio: {",
)
replace_once('src/i18n/ru.ts', "    collection: 'Коллекция →',", "    collection: 'Коллекция →',\n    drop: 'DROP',\n    dropSwitchError: 'Не удалось переключить Drop. Попробуйте ещё раз.',")
replace_once(
    'src/i18n/ru.ts',
    "  audio: {",
    "  drops: {\n    'y2k-essentials': 'Y2K Essentials',\n    'video-link': 'Видео-связь',\n    'pocket-office': 'Карманный офис',\n    'pocket-audio': 'Карманное аудио',\n    'game-zone': 'Игровая зона',\n    'analog-nights': 'Аналоговые ночи',\n  },\n  audio: {",
)

# OpeningSession is the single persistence authority for Drop switches.
replace_once(
    'src/game/systems/openingSession.ts',
    "import type { ContentRegistry } from '../data/collectibles';",
    "import type { ContentRegistry, LootPoolId } from '../data/collectibles';",
)
replace_once(
    'src/game/systems/openingSession.ts',
    "const matchesCommittedPending = (state: SaveState, pending: PendingReveal): boolean =>\n  state.pendingReveal === null &&\n  state.totalOpens === pending.commit.totalOpens &&\n  state.chips === pending.commit.chips &&\n  state.signal === pending.commit.signal &&\n  state.overchargeHundredths === pending.commit.overchargeHundredths &&\n  state.activeLootPoolId === pending.commit.activeLootPoolId &&\n  state.stats.duplicates === pending.commit.stats.duplicates &&\n  state.stats.hiddenPockets === pending.commit.stats.hiddenPockets &&\n  sameStrings(state.discoveredStandard, pending.commit.discoveredStandard) &&\n  sameStrings(state.discoveredSecrets, pending.commit.discoveredSecrets);",
    "const matchesCommittedPending = (state: SaveState, pending: PendingReveal): boolean =>\n  state.pendingReveal === null &&\n  state.totalOpens === pending.commit.totalOpens &&\n  state.chips === pending.commit.chips &&\n  state.signal === pending.commit.signal &&\n  state.overchargeHundredths === pending.commit.overchargeHundredths &&\n  state.activeLootPoolId === pending.commit.activeLootPoolId &&\n  state.stats.duplicates === pending.commit.stats.duplicates &&\n  state.stats.hiddenPockets === pending.commit.stats.hiddenPockets &&\n  sameStrings(state.discoveredStandard, pending.commit.discoveredStandard) &&\n  sameStrings(state.discoveredSecrets, pending.commit.discoveredSecrets);\n\nconst matchesLootPoolSwitch = (before: SaveState, after: SaveState, lootPoolId: LootPoolId): boolean =>\n  after.pendingReveal === null &&\n  after.version === before.version &&\n  after.muted === before.muted &&\n  after.activeLootPoolId === lootPoolId &&\n  after.totalOpens === before.totalOpens &&\n  after.chips === before.chips &&\n  after.signal === before.signal &&\n  after.overchargeHundredths === before.overchargeHundredths &&\n  after.stats.duplicates === before.stats.duplicates &&\n  after.stats.hiddenPockets === before.stats.hiddenPockets &&\n  sameStrings(after.discoveredStandard, before.discoveredStandard) &&\n  sameStrings(after.discoveredSecrets, before.discoveredSecrets);",
)
replace_once(
    'src/game/systems/openingSession.ts',
    "  public getPendingReveal(): PendingReveal | null {\n    return this.getState().pendingReveal;\n  }\n\n  public async prepareReveal",
    "  public getPendingReveal(): PendingReveal | null {\n    return this.getState().pendingReveal;\n  }\n\n  public async selectLootPool(lootPoolId: LootPoolId): Promise<SaveState> {\n    const current = this.getState();\n    if (!this.options.registry.lootPoolById.has(lootPoolId)) {\n      throw new Error(`Unknown loot pool: ${lootPoolId}`);\n    }\n    if (current.pendingReveal) {\n      throw new Error('Cannot switch loot pool while a reveal is pending');\n    }\n    if (current.activeLootPoolId === lootPoolId) return current;\n\n    const next: SaveState = { ...current, activeLootPoolId: lootPoolId };\n    try {\n      await this.options.repository.write(next);\n      this.state = next;\n      return next;\n    } catch (error: unknown) {\n      // A storage promise can reject after the write became durable. Reload and\n      // accept only the exact pool-only transition we attempted.\n      try {\n        const reloaded = await this.options.repository.load();\n        this.state = reloaded;\n        if (matchesLootPoolSwitch(current, reloaded, lootPoolId)) return reloaded;\n      } catch {\n        // Preserve the original write error.\n      }\n      throw error;\n    }\n  }\n\n  public async prepareReveal",
)

# Opening scene: accept a Collection-requested Drop, render a compact selector,
# and route all persistence through OpeningSession.selectLootPool().
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "import { GAME_REGISTRY, type StandardRarity } from '../data/collectibles';",
    "import { GAME_LOOT_POOL_IDS, GAME_REGISTRY, type GameLootPoolId, type StandardRarity } from '../data/collectibles';",
)
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "interface DragState {",
    "interface OpeningSceneData {\n  lootPoolId?: GameLootPoolId;\n}\n\ninterface DragState {",
)
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "  private selectedPouchType: PouchType = 'basic';\n  private pouchSelectorButtons",
    "  private selectedPouchType: PouchType = 'basic';\n  private requestedLootPoolId: GameLootPoolId | null = null;\n  private dropSwitchInFlight = false;\n  private pouchSelectorButtons",
)
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "  public constructor() {\n    super('OpeningScene');\n  }\n\n  public create(): void {",
    "  public constructor() {\n    super('OpeningScene');\n  }\n\n  public init(data: OpeningSceneData = {}): void {\n    this.requestedLootPoolId = data.lootPoolId ?? null;\n  }\n\n  public create(): void {",
)
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "    this.chargedReadyPulsePending = false;\n    this.presentationSkip.reset();",
    "    this.chargedReadyPulsePending = false;\n    this.dropSwitchInFlight = false;\n    this.presentationSkip.reset();",
)
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "      this.saveState = await this.session.load();\n    } catch (error: unknown) {",
    "      this.saveState = await this.session.load();\n      const requestedLootPoolId = this.requestedLootPoolId;\n      this.requestedLootPoolId = null;\n      if (requestedLootPoolId && !this.saveState.pendingReveal) {\n        this.saveState = await this.session.selectLootPool(requestedLootPoolId);\n      }\n    } catch (error: unknown) {",
)
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "    this.createMuteButton(root);\n\n    if (this.selectedPouchType === 'charged')",
    "    this.createMuteButton(root);\n    this.renderDropSelector(root);\n\n    if (this.selectedPouchType === 'charged')",
)

marker = "  private renderPouchSelector(root: Phaser.GameObjects.Container): void {"
text = read('src/game/scenes/OpeningScene.ts')
if text.count(marker) != 1:
    raise SystemExit('OpeningScene.ts: renderPouchSelector marker mismatch')
drop_methods = r'''  private getActiveDropIndex(): number {
    if (!this.saveState) return 0;
    const index = GAME_LOOT_POOL_IDS.indexOf(this.saveState.activeLootPoolId as GameLootPoolId);
    return index >= 0 ? index : 0;
  }

  private renderDropSelector(root: Phaser.GameObjects.Container): void {
    if (!this.metrics || !this.saveState) return;
    const messages = getMessages(getPlatformRuntime().language);
    const index = this.getActiveDropIndex();
    const poolId = GAME_LOOT_POOL_IDS[index];
    const owned = new Set(this.saveState.discoveredStandard);
    const standards = GAME_REGISTRY.standardItems.filter((item) => item.lootPoolId === poolId);
    const standardCount = standards.filter(({ collectible }) => owned.has(collectible.id)).length;
    const width = Math.min(360, Math.max(270, this.metrics.logicalWidth * 0.34));
    const height = 54;
    const x = this.metrics.centerX;
    const y = this.metrics.safeTop + 10;
    const panel = this.add.container(x, y);
    const background = this.add.graphics();
    background.fillStyle(0x17101f, 0.84);
    background.fillRoundedRect(-width / 2, 0, width, height, 18);
    background.lineStyle(1.5, 0x8df8ff, 0.28);
    background.strokeRoundedRect(-width / 2, 0, width, height, 18);
    const label = this.add
      .text(0, 10, `${messages.opening.drop} · ${messages.drops[poolId]}`, {
        color: '#f7f2ff',
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: getPlatformRuntime().language === 'ru' ? '9px' : '10px',
      })
      .setOrigin(0.5, 0);
    const progress = this.add
      .text(0, 34, `${standardCount}/${standards.length}   ·   ${index + 1}/${GAME_LOOT_POOL_IDS.length}`, {
        color: '#9fdfe8',
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: '8px',
      })
      .setOrigin(0.5, 0);
    const previous = this.add
      .text(-width / 2 + 20, height / 2, '‹', {
        color: '#e9e0f4',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const next = this.add
      .text(width / 2 - 20, height / 2, '›', {
        color: '#e9e0f4',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    previous.on('pointerup', () => void this.switchDrop(-1));
    next.on('pointerup', () => void this.switchDrop(1));
    panel.add([background, label, progress, previous, next]);
    root.add(panel);
  }

  private async switchDrop(direction: -1 | 1): Promise<void> {
    if (this.phase !== 'idle' || this.dropSwitchInFlight || !this.session || !this.saveState) return;
    const currentIndex = this.getActiveDropIndex();
    const nextIndex = (currentIndex + direction + GAME_LOOT_POOL_IDS.length) % GAME_LOOT_POOL_IDS.length;
    const nextPoolId = GAME_LOOT_POOL_IDS[nextIndex];
    if (nextPoolId === this.saveState.activeLootPoolId) return;

    this.dropSwitchInFlight = true;
    getGameAudio().play('ui-click');
    try {
      this.saveState = await this.session.selectLootPool(nextPoolId);
      getPlatformRuntime().analytics.track('drop_selected', {
        lootPoolId: nextPoolId,
        source: 'opening',
      });
      this.dropSwitchInFlight = false;
      this.renderIdle();
    } catch (error: unknown) {
      this.dropSwitchInFlight = false;
      console.error('[drop] failed to switch Drop', error);
      this.renderIdle(getMessages(getPlatformRuntime().language).opening.dropSwitchError);
    }
  }

'''
write('src/game/scenes/OpeningScene.ts', text.replace(marker, drop_methods + marker, 1))

# Collection page is explicitly a Drop page: browse locally, apply on return.
replace_once(
    'src/game/scenes/CollectionScene.ts',
    "import { GAME_REGISTRY, type GadgetFamilyDefinition, type StandardRarity } from '../data/collectibles';",
    "import { GAME_LOOT_POOL_IDS, GAME_REGISTRY, type GadgetFamilyDefinition, type GameLootPoolId, type StandardRarity } from '../data/collectibles';",
)
replace_once(
    'src/game/scenes/CollectionScene.ts',
    "      this.saveState = await new SaveRepository(getPlatformRuntime().storage).load();\n      this.snapshot = buildCollectionSnapshot(GAME_REGISTRY, this.saveState);",
    "      this.saveState = await new SaveRepository(getPlatformRuntime().storage).load();\n      this.snapshot = buildCollectionSnapshot(GAME_REGISTRY, this.saveState);\n      const activeDropIndex = GAME_LOOT_POOL_IDS.indexOf(this.saveState.activeLootPoolId as GameLootPoolId);\n      this.page = activeDropIndex >= 0 ? activeDropIndex : 0;",
)
replace_once(
    'src/game/scenes/CollectionScene.ts',
    "    root.add(\n      this.add\n        .text(\n          metrics.centerX,\n          86,\n          `${messages.collection.standards} ${this.snapshot.standardCount}/${this.snapshot.standardTotal}   ·   ${messages.collection.secrets} ${this.snapshot.secretCount}/${this.snapshot.secretTotal}`",
    "    const poolProgress = this.selectedPoolProgress();\n    root.add(\n      this.add\n        .text(\n          metrics.centerX,\n          86,\n          `${messages.collection.standards} ${poolProgress.standardCount}/${poolProgress.standardTotal}   ·   ${messages.collection.secrets} ${poolProgress.secretCount}/${poolProgress.secretTotal}`",
)
replace_once(
    'src/game/scenes/CollectionScene.ts',
    "      getPlatformRuntime().analytics.track('collection_return', {\n        view: this.view,\n        standardCount: this.snapshot?.standardCount ?? 0,\n      });\n      // Defer scene replacement until the current pointer dispatch has completed.\n      this.time.delayedCall(0, () => this.scene.start('OpeningScene'));",
    "      const lootPoolId = this.selectedLootPoolId();\n      getPlatformRuntime().analytics.track('collection_return', {\n        view: this.view,\n        lootPoolId,\n        standardCount: this.selectedPoolProgress().standardCount,\n      });\n      // Collection browsing is local. OpeningSession owns the durable switch.\n      // Defer scene replacement until the current pointer dispatch has completed.\n      this.time.delayedCall(0, () => this.scene.start('OpeningScene', { lootPoolId }));",
)
replace_once(
    'src/game/scenes/CollectionScene.ts',
    "  private visibleFamilies(): readonly GadgetFamilyDefinition[] {\n    const start = this.page * FAMILIES_PER_PAGE;\n    return GAME_REGISTRY.families.slice(start, start + FAMILIES_PER_PAGE);\n  }",
    "  private selectedLootPoolId(): GameLootPoolId {\n    return GAME_LOOT_POOL_IDS[this.page] ?? GAME_LOOT_POOL_IDS[0];\n  }\n\n  private selectedPoolProgress(): { standardCount: number; standardTotal: number; secretCount: number; secretTotal: number } {\n    const poolId = this.selectedLootPoolId();\n    const familyIds = new Set(GAME_REGISTRY.lootPoolById.get(poolId)?.familyIds ?? []);\n    const families = this.snapshot?.families.filter(({ familyId }) => familyIds.has(familyId)) ?? [];\n    return families.reduce(\n      (progress, family) => ({\n        standardCount: progress.standardCount + family.standardCount,\n        standardTotal: progress.standardTotal + family.standardTotal,\n        secretCount: progress.secretCount + family.secretOwned.length,\n        secretTotal: progress.secretTotal + family.secretTotal,\n      }),\n      { standardCount: 0, standardTotal: 0, secretCount: 0, secretTotal: 0 },\n    );\n  }\n\n  private visibleFamilies(): readonly GadgetFamilyDefinition[] {\n    const pool = GAME_REGISTRY.lootPoolById.get(this.selectedLootPoolId());\n    if (!pool) return [];\n    return pool.familyIds\n      .map((familyId) => GAME_REGISTRY.familyById.get(familyId))\n      .filter((family): family is GadgetFamilyDefinition => Boolean(family))\n      .slice(0, FAMILIES_PER_PAGE);\n  }",
)
replace_once(
    'src/game/scenes/CollectionScene.ts',
    "getStandardLootPoolNearCompletion(GAME_REGISTRY, this.saveState.activeLootPoolId, this.saveState)",
    "getStandardLootPoolNearCompletion(GAME_REGISTRY, this.selectedLootPoolId(), this.saveState)",
)
# Same expression occurs twice; replace the remaining one.
replace_once(
    'src/game/scenes/CollectionScene.ts',
    "getStandardLootPoolNearCompletion(GAME_REGISTRY, this.saveState.activeLootPoolId, this.saveState)",
    "getStandardLootPoolNearCompletion(GAME_REGISTRY, this.selectedLootPoolId(), this.saveState)",
)
replace_once(
    'src/game/scenes/CollectionScene.ts',
    "    const pageCount = Math.ceil(GAME_REGISTRY.families.length / FAMILIES_PER_PAGE);",
    "    const pageCount = GAME_LOOT_POOL_IDS.length;",
)
replace_once(
    'src/game/scenes/CollectionScene.ts',
    "      .text(this.metrics.centerX, y, `${this.page + 1}/${pageCount}`, {",
    "      .text(this.metrics.centerX, y, `${getMessages(getPlatformRuntime().language).drops[this.selectedLootPoolId()]} · ${this.page + 1}/${pageCount}`, {",
)

# Session tests: use the production registry and cover valid/invalid/pending/ambiguous switches.
replace_once(
    'tests/opening-session.test.ts',
    "import { SLICE_REGISTRY } from '../src/game/data/collectibles';",
    "import { GAME_REGISTRY } from '../src/game/data/collectibles';",
)
replace_once(
    'tests/opening-session.test.ts',
    "    registry: SLICE_REGISTRY,",
    "    registry: GAME_REGISTRY,",
)
replace_once(
    'tests/opening-session.test.ts',
    "      registry: SLICE_REGISTRY,",
    "      registry: GAME_REGISTRY,",
)
insert_marker = "  it('persists the full pending transaction before returning a newly prepared reward', async () => {"
text = read('tests/opening-session.test.ts')
if text.count(insert_marker) != 1:
    raise SystemExit('opening-session.test.ts insertion marker mismatch')
new_tests = r'''  it('persists a valid Drop switch without changing economy or collection progress', async () => {
    const storage = new MemoryStorageAdapter();
    const repository = new SaveRepository(storage);
    const initial = await repository.load();
    await repository.write({
      ...initial,
      chips: 77,
      signal: 3,
      overchargeHundredths: 130,
      totalOpens: 9,
      discoveredStandard: ['camera-common'],
    });
    const session = createSession(storage);
    const before = await session.load();

    const switched = await session.selectLootPool('video-link');
    const persisted = await repository.load();

    expect(switched.activeLootPoolId).toBe('video-link');
    expect(switched).toMatchObject({
      chips: before.chips,
      signal: before.signal,
      overchargeHundredths: before.overchargeHundredths,
      totalOpens: before.totalOpens,
      discoveredStandard: before.discoveredStandard,
    });
    expect(persisted).toEqual(switched);
  });

  it('rejects unknown Drops and refuses to switch while a reveal is pending', async () => {
    const storage = new MemoryStorageAdapter();
    const session = createSession(storage);
    const initial = await session.load();

    await expect(session.selectLootPool('not-a-drop')).rejects.toThrow('Unknown loot pool');
    expect(session.getState()).toEqual(initial);

    const pending = await session.prepareReveal();
    await expect(session.selectLootPool('video-link')).rejects.toThrow('Cannot switch loot pool while a reveal is pending');
    expect(session.getPendingReveal()).toEqual(pending);
  });

  it('accepts an ambiguous Drop-switch write only when reload proves the exact switch is durable', async () => {
    const storage = new WriteThenThrowStorage(1);
    const session = createSession(storage);
    await session.load();

    const switched = await session.selectLootPool('video-link');

    expect(switched.activeLootPoolId).toBe('video-link');
    expect(session.getState()).toEqual(switched);
  });

'''
write('tests/opening-session.test.ts', text.replace(insert_marker, new_tests + insert_marker, 1))
