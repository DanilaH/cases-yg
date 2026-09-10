from pathlib import Path


def read(path: str) -> str:
    return Path(path).read_text()


def write(path: str, text: str) -> None:
    Path(path).write_text(text)


def replace_once(path: str, old: str, new: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    write(path, text.replace(old, new, 1))


# All 60 production collectible exports were reviewed/validated in the asset
# preparation pass. Keep the availability gate, but derive its initial contents
# from the production registry so the manifest cannot drift from content data.
replace_once(
    'src/game/data/artAssets.ts',
    "import type { ContentRegistry } from './collectibles';",
    "import { GAME_REGISTRY, type ContentRegistry, type LootPoolId } from './collectibles';",
)
start = "export const AVAILABLE_COLLECTIBLE_ART_IDS = new Set<string>([\n"
end = "]);\nexport const AVAILABLE_STATIC_ART_IDS"
text = read('src/game/data/artAssets.ts')
if text.count(start) != 1 or text.count(end) != 1:
    raise SystemExit('artAssets.ts: collectible availability block mismatch')
prefix, rest = text.split(start, 1)
_, suffix = rest.split(end, 1)
replacement = "export const AVAILABLE_COLLECTIBLE_ART_IDS = new Set<string>(\n  [...GAME_REGISTRY.standardItems, ...GAME_REGISTRY.secrets].map(({ collectible }) => collectible.id),\n);\nexport const AVAILABLE_STATIC_ART_IDS"
write('src/game/data/artAssets.ts', prefix + replacement + suffix)

replace_once(
    'src/game/data/artAssets.ts',
    "export const getRuntimeCollectibleArt = (registry: ContentRegistry): readonly RuntimeCollectibleArt[] => [\n  ...registry.standardItems,\n  ...registry.secrets,\n]\n  .map(({ collectible }) => collectible)\n  .filter(({ id }) => AVAILABLE_COLLECTIBLE_ART_IDS.has(id))\n  .map((collectible) => ({\n    collectibleId: collectible.id,\n    textureKey: collectibleTextureKey(collectible.id),\n    assetPath: collectible.assetPath,\n  }));",
    "const toRuntimeCollectibleArt = (registry: ContentRegistry, lootPoolId?: LootPoolId): readonly RuntimeCollectibleArt[] => [\n  ...registry.standardItems,\n  ...registry.secrets,\n]\n  .filter((record) => lootPoolId === undefined || record.lootPoolId === lootPoolId)\n  .map(({ collectible }) => collectible)\n  .filter(({ id }) => AVAILABLE_COLLECTIBLE_ART_IDS.has(id))\n  .map((collectible) => ({\n    collectibleId: collectible.id,\n    textureKey: collectibleTextureKey(collectible.id),\n    assetPath: collectible.assetPath,\n  }));\n\nexport const getRuntimeCollectibleArt = (registry: ContentRegistry): readonly RuntimeCollectibleArt[] =>\n  toRuntimeCollectibleArt(registry);\n\nexport const getRuntimeCollectibleArtForLootPool = (\n  registry: ContentRegistry,\n  lootPoolId: LootPoolId,\n): readonly RuntimeCollectibleArt[] => {\n  if (!registry.lootPoolById.has(lootPoolId)) {\n    throw new Error(`Unknown loot pool: ${lootPoolId}`);\n  }\n  return toRuntimeCollectibleArt(registry, lootPoolId);\n};",
)

# Cold boot loads only the default Drop's 10 collectible images; static art is
# unchanged. Other Drops are loaded on demand by their scenes.
replace_once(
    'src/game/scenes/BootScene.ts',
    "import { getRuntimeCollectibleArt, getRuntimeStaticArt } from '../data/artAssets';\nimport { GAME_REGISTRY } from '../data/collectibles';",
    "import { getRuntimeCollectibleArtForLootPool, getRuntimeStaticArt } from '../data/artAssets';\nimport { DEFAULT_LOOT_POOL_ID, GAME_REGISTRY } from '../data/collectibles';",
)
replace_once(
    'src/game/scenes/BootScene.ts',
    "    for (const art of getRuntimeCollectibleArt(GAME_REGISTRY)) {",
    "    for (const art of getRuntimeCollectibleArtForLootPool(GAME_REGISTRY, DEFAULT_LOOT_POOL_ID)) {",
)

# Opening always ensures the active Drop is authored before its first render and
# best-effort preloads a target Drop before persisting a direct selector switch.
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "import { getGameAudio } from '../systems/audio';",
    "import { getGameAudio } from '../systems/audio';\nimport { ensureLootPoolCollectibleArt } from '../systems/artLoading';",
)
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "    if (this.isSceneShutdown()) return;\n\n    const pending = this.saveState.pendingReveal;",
    "    try {\n      await ensureLootPoolCollectibleArt(this, GAME_REGISTRY, this.saveState.activeLootPoolId);\n    } catch (error: unknown) {\n      console.warn('[art] active Drop collectible art failed to load; using fallbacks', error);\n    }\n\n    if (this.isSceneShutdown()) return;\n\n    const pending = this.saveState.pendingReveal;",
)
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "    this.dropSwitchInFlight = true;\n    getGameAudio().play('ui-click');\n    try {\n      this.saveState = await this.session.selectLootPool(nextPoolId);",
    "    this.dropSwitchInFlight = true;\n    getGameAudio().play('ui-click');\n    try {\n      await ensureLootPoolCollectibleArt(this, GAME_REGISTRY, nextPoolId);\n    } catch (error: unknown) {\n      console.warn('[art] target Drop collectible art failed to load; using fallbacks', error);\n    }\n    try {\n      this.saveState = await this.session.selectLootPool(nextPoolId);",
)

# Collection loads the saved active Drop on entry and loads browsed Drops on
# demand before rendering them. Failed downloads degrade to existing procedural
# visuals and can be retried on the next visit.
replace_once(
    'src/game/scenes/CollectionScene.ts',
    "import { getGameAudio } from '../systems/audio';",
    "import { getGameAudio } from '../systems/audio';\nimport { ensureLootPoolCollectibleArt } from '../systems/artLoading';",
)
replace_once(
    'src/game/scenes/CollectionScene.ts',
    "  private view: CollectionView = 'shelf';\n  private page = 0;",
    "  private view: CollectionView = 'shelf';\n  private page = 0;\n  private dropBrowseInFlight = false;",
)
replace_once(
    'src/game/scenes/CollectionScene.ts',
    "    const platform = getPlatformRuntime();\n    platform.activity.setGameplayDesired(false);",
    "    const platform = getPlatformRuntime();\n    this.dropBrowseInFlight = false;\n    platform.activity.setGameplayDesired(false);",
)
replace_once(
    'src/game/scenes/CollectionScene.ts',
    "    getPlatformRuntime().analytics.track('collection_open', {",
    "    try {\n      await ensureLootPoolCollectibleArt(this, GAME_REGISTRY, this.selectedLootPoolId());\n    } catch (error: unknown) {\n      console.warn('[art] Collection active Drop art failed to load; using fallbacks', error);\n    }\n\n    getPlatformRuntime().analytics.track('collection_open', {",
)
replace_once(
    'src/game/scenes/CollectionScene.ts',
    "    if (this.page > 0) {\n      previous.setInteractive({ useHandCursor: true }).on('pointerup', () => {\n        getGameAudio().play('ui-click');\n        this.page -= 1;\n        this.render();\n      });\n    }\n    if (this.page < pageCount - 1) {\n      next.setInteractive({ useHandCursor: true }).on('pointerup', () => {\n        getGameAudio().play('ui-click');\n        this.page += 1;\n        this.render();\n      });\n    }",
    "    if (this.page > 0) {\n      previous.setInteractive({ useHandCursor: true }).on('pointerup', () => void this.browseDrop(-1));\n    }\n    if (this.page < pageCount - 1) {\n      next.setInteractive({ useHandCursor: true }).on('pointerup', () => void this.browseDrop(1));\n    }",
)
marker = "  private renderFailure(): void {"
text = read('src/game/scenes/CollectionScene.ts')
if text.count(marker) != 1:
    raise SystemExit('CollectionScene.ts: renderFailure marker mismatch')
browse_method = r'''  private async browseDrop(direction: -1 | 1): Promise<void> {
    if (this.dropBrowseInFlight) return;
    const nextPage = this.page + direction;
    if (nextPage < 0 || nextPage >= GAME_LOOT_POOL_IDS.length) return;
    const nextPoolId: GameLootPoolId = GAME_LOOT_POOL_IDS[nextPage] ?? GAME_LOOT_POOL_IDS[0];

    this.dropBrowseInFlight = true;
    getGameAudio().play('ui-click');
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
    this.render();
  }

'''
write('src/game/scenes/CollectionScene.ts', text.replace(marker, browse_method + marker, 1))

# Runtime manifest tests now assert production art completeness and 10-asset
# Drop slices while retaining the availability-gate behavior tests.
replace_once(
    'tests/runtime-assets.test.ts',
    "  getRuntimeCollectibleArt,\n  getRuntimeStaticArt,",
    "  getRuntimeCollectibleArt,\n  getRuntimeCollectibleArtForLootPool,\n  getRuntimeStaticArt,",
)
replace_once(
    'tests/runtime-assets.test.ts',
    "import { SLICE_REGISTRY } from '../src/game/data/collectibles';",
    "import { GAME_LOOT_POOL_IDS, GAME_REGISTRY, SLICE_REGISTRY } from '../src/game/data/collectibles';",
)
insert = "  it('exposes reviewed collectible art using registry paths and stable texture keys', () => {"
text = read('tests/runtime-assets.test.ts')
if text.count(insert) != 1:
    raise SystemExit('runtime-assets.test.ts: insertion marker mismatch')
new_tests = r'''  it('covers all production collectible exports and slices them to 10 assets per Drop', () => {
    replaceSetContents(AVAILABLE_COLLECTIBLE_ART_IDS, defaultCollectibleArtIds);

    expect(getRuntimeCollectibleArt(GAME_REGISTRY)).toHaveLength(60);
    expect(AVAILABLE_COLLECTIBLE_ART_IDS.size).toBe(60);
    for (const lootPoolId of GAME_LOOT_POOL_IDS) {
      const art = getRuntimeCollectibleArtForLootPool(GAME_REGISTRY, lootPoolId);
      expect(art).toHaveLength(10);
      expect(new Set(art.map(({ collectibleId }) => collectibleId)).size).toBe(10);
    }
  });

  it('rejects an unknown Drop art request instead of silently returning an empty manifest', () => {
    replaceSetContents(AVAILABLE_COLLECTIBLE_ART_IDS, defaultCollectibleArtIds);
    expect(() => getRuntimeCollectibleArtForLootPool(GAME_REGISTRY, 'missing-drop')).toThrow('Unknown loot pool');
  });

'''
write('tests/runtime-assets.test.ts', text.replace(insert, new_tests + insert, 1))
