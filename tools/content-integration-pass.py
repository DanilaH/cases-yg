from pathlib import Path


def read(path: str) -> str:
    return Path(path).read_text()


def write(path: str, text: str) -> None:
    Path(path).write_text(text)


def replace_once(path: str, old: str, new: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one replacement, found {count}: {old[:120]!r}')
    write(path, text.replace(old, new, 1))


# 1) Production registry: 12 families / 6 Drops while retaining a small
# deprecated compatibility slice for old tests/debug until the later sweep.
path = 'src/game/data/collectibles.ts'
text = read(path)
marker = "export const SLICE_LOOT_POOL_ID = 'y2k-essentials';"
if marker not in text:
    raise SystemExit('collectibles.ts: slice marker not found')
prefix = text.split(marker, 1)[0]
production = r'''export const DEFAULT_LOOT_POOL_ID = 'y2k-essentials';

export const GAME_LOOT_POOL_IDS = [
  DEFAULT_LOOT_POOL_ID,
  'video-link',
  'pocket-office',
  'pocket-audio',
  'game-zone',
  'analog-nights',
] as const;

const secret = (id: string): CollectibleDefinition => ({
  id,
  assetPath: `assets/collectibles/${id}.webp`,
  secret: true,
});

const family = (
  id: string,
  dropId: LootPoolId,
  name: Readonly<Record<'en' | 'ru', string>>,
  secretId: string,
): GadgetFamilyDefinition => ({
  id,
  dropId,
  name,
  standard: {
    common: standard(id, 'common'),
    rare: standard(id, 'rare'),
    epic: standard(id, 'epic'),
    legendary: standard(id, 'legendary'),
  },
  secrets: [secret(secretId)],
});

export const GAME_FAMILIES: readonly GadgetFamilyDefinition[] = [
  family('camera', DEFAULT_LOOT_POOL_ID, { en: 'Digital Camera', ru: 'Цифровая камера' }, 'camera-secret-cosmic'),
  family('flip-phone', DEFAULT_LOOT_POOL_ID, { en: 'Flip Phone', ru: 'Раскладушка' }, 'flip-phone-secret-noir'),
  family('mini-camcorder', 'video-link', { en: 'Mini Camcorder', ru: 'Мини-камкордер' }, 'mini-camcorder-secret-prototype'),
  family('webcam', 'video-link', { en: 'Webcam', ru: 'Веб-камера' }, 'webcam-secret-stereo'),
  family('pda', 'pocket-office', { en: 'PDA / Pocket Organizer', ru: 'КПК / Карманный органайзер' }, 'pda-secret-flip'),
  family('pager', 'pocket-office', { en: 'Pager / Pocket Communicator', ru: 'Пейджер / Карманный коммуникатор' }, 'pager-secret-flip'),
  family('mp3-player', 'pocket-audio', { en: 'MP3 Player', ru: 'MP3-плеер' }, 'mp3-player-secret-pearl'),
  family('portable-disc-player', 'pocket-audio', { en: 'Portable Disc Player', ru: 'Портативный дисковый плеер' }, 'portable-disc-player-secret-remote'),
  family('handheld-console', 'game-zone', { en: 'Handheld Console', ru: 'Портативная консоль' }, 'handheld-console-secret-phone'),
  family('home-console', 'game-zone', { en: 'Home Console', ru: 'Домашняя консоль' }, 'home-console-secret-noir'),
  family('cassette-player', 'analog-nights', { en: 'Cassette Player', ru: 'Кассетный плеер' }, 'cassette-player-secret-remote'),
  family('crt-tv', 'analog-nights', { en: 'Pocket CRT TV', ru: 'Карманный ЭЛТ-телевизор' }, 'crt-tv-secret-communicator'),
] as const;

export const GAME_REGISTRY = createContentRegistry(GAME_FAMILIES);

/** @deprecated Compatibility-only first-Drop slice. Production runtime uses GAME_REGISTRY. */
export const SLICE_LOOT_POOL_ID = DEFAULT_LOOT_POOL_ID;
/** @deprecated Compatibility-only first-Drop slice. Production runtime uses GAME_FAMILIES. */
export const SLICE_FAMILIES = GAME_FAMILIES.filter((familyDefinition) => familyDefinition.dropId === DEFAULT_LOOT_POOL_ID);
/** @deprecated Compatibility-only first-Drop slice. Production runtime uses GAME_REGISTRY. */
export const SLICE_REGISTRY = createContentRegistry(SLICE_FAMILIES);
'''
write(path, prefix + production)

# 2) Pool-aware near completion API while preserving the global helper for
# compatibility/tests that intentionally reason about an entire registry.
path = 'src/game/systems/collection.ts'
text = read(path)
text = text.replace(
    "import type { ContentRegistry, GadgetFamilyDefinition, StandardRarity } from '../data/collectibles';",
    "import type { ContentRegistry, GadgetFamilyDefinition, LootPoolId, StandardRarity } from '../data/collectibles';",
)
start = text.index('export const getStandardNearCompletion = (')
end = text.index('export const buildCollectionSnapshot = (')
replacement = r'''const getNearCompletionFromItems = (
  items: ContentRegistry['standardItems'],
  state: Pick<SaveState, 'discoveredStandard'>,
): StandardNearCompletion | null => {
  const total = items.length;
  if (total < 2) return null;

  const owned = new Set(state.discoveredStandard);
  const missing = items.filter(({ collectible }) => !owned.has(collectible.id));
  if (missing.length !== 1) return null;

  const last = missing[0];
  if (!last) return null;
  return {
    current: total - 1,
    total,
    missingCollectibleId: last.collectible.id,
    familyId: last.familyId,
    rarity: last.rarity,
  };
};

export const getStandardNearCompletion = (
  registry: ContentRegistry,
  state: Pick<SaveState, 'discoveredStandard'>,
): StandardNearCompletion | null => getNearCompletionFromItems(registry.standardItems, state);

export const getStandardLootPoolNearCompletion = (
  registry: ContentRegistry,
  lootPoolId: LootPoolId,
  state: Pick<SaveState, 'discoveredStandard'>,
): StandardNearCompletion | null => {
  if (!registry.lootPoolById.has(lootPoolId)) {
    throw new Error(`Unknown loot pool: ${lootPoolId}`);
  }
  return getNearCompletionFromItems(
    registry.standardItems.filter((item) => item.lootPoolId === lootPoolId),
    state,
  );
};

'''
write(path, text[:start] + replacement + text[end:])

# 3) Opening celebration milestones are scoped to the reveal's Drop.
replace_once(
    'src/game/systems/collectionMilestones.ts',
    "  const standardIds = new Set(registry.standardItems.map(({ collectible }) => collectible.id));\n  const secretIds = new Set(registry.secrets.map(({ collectible }) => collectible.id));",
    "  if (!registry.lootPoolById.has(pending.lootPoolId)) {\n    throw new Error(`Unknown loot pool: ${pending.lootPoolId}`);\n  }\n  const standardIds = new Set(\n    registry.standardItems\n      .filter(({ lootPoolId }) => lootPoolId === pending.lootPoolId)\n      .map(({ collectible }) => collectible.id),\n  );\n  const secretIds = new Set(\n    registry.secrets\n      .filter(({ lootPoolId }) => lootPoolId === pending.lootPoolId)\n      .map(({ collectible }) => collectible.id),\n  );",
)

# 4) Starter protection is derived from unique standards owned in the active
# Drop, not global totalOpens. Hidden Pocket opening-number semantics remain global.
path = 'src/game/systems/pouches.ts'
text = read(path)
old = "  profile: PouchProfile,\n  openingNumber: number,\n  random: RandomSource,\n): StandardCollectibleRecord | null => {"
new = "  profile: PouchProfile,\n  ownedInPool: number,\n  random: RandomSource,\n): StandardCollectibleRecord | null => {"
if text.count(old) != 1:
    raise SystemExit(f'pouches.ts: chooseProtectedStandard signature count={text.count(old)}')
text = text.replace(old, new, 1)
text = text.replace(
    '  if (openingNumber === 2 && balance.onboarding.secondOpeningDifferentFamily) {',
    '  if (ownedInPool === 1 && balance.onboarding.secondOpeningDifferentFamily) {',
    1,
)
old = "  profile: PouchProfile,\n  openingNumber: number,\n  random: RandomSource,\n): { selected: StandardCollectibleRecord; signalLockConsumed: boolean } => {"
new = "  profile: PouchProfile,\n  random: RandomSource,\n): { selected: StandardCollectibleRecord; signalLockConsumed: boolean } => {"
if text.count(old) != 1:
    raise SystemExit(f'pouches.ts: resolveStandard signature count={text.count(old)}')
text = text.replace(old, new, 1)
old = """  if (openingNumber <= balance.onboarding.protectedOpenings) {
    const protectedResult = chooseProtectedStandard(state, registry, balance, profile, openingNumber, random);
    if (protectedResult) {
      return { selected: protectedResult, signalLockConsumed: false };
    }
  }
"""
new = """  const discovered = new Set(state.discoveredStandard);
  const ownedInPool = registry.standardItems.reduce(
    (count, item) => count + (item.lootPoolId === state.activeLootPoolId && discovered.has(item.collectible.id) ? 1 : 0),
    0,
  );
  if (ownedInPool < balance.onboarding.protectedOpenings) {
    const protectedResult = chooseProtectedStandard(state, registry, balance, profile, ownedInPool, random);
    if (protectedResult) {
      return { selected: protectedResult, signalLockConsumed: false };
    }
  }
"""
if old not in text:
    raise SystemExit('pouches.ts: protected opening block not found')
text = text.replace(old, new, 1)
old_call = """  const { selected, signalLockConsumed } = resolveStandard(
    state,
    registry,
    balance,
    profile,
    openingNumber,
    random,
  );
"""
new_call = """  const { selected, signalLockConsumed } = resolveStandard(
    state,
    registry,
    balance,
    profile,
    random,
  );
"""
if old_call not in text:
    raise SystemExit('pouches.ts: resolveStandard call not found')
text = text.replace(old_call, new_call, 1)
write(path, text)

# 5) Production scenes use the full registry. Collection/opening completion
# semantics use the active/reveal Drop.
path = 'src/game/scenes/OpeningScene.ts'
text = read(path).replace('SLICE_REGISTRY', 'GAME_REGISTRY')
text = text.replace(
    "import { getStandardNearCompletion } from '../systems/collection';",
    "import { getStandardLootPoolNearCompletion } from '../systems/collection';",
)
text = text.replace(
    "import { isStandardCollectionComplete } from '../systems/signal';",
    "import { isStandardLootPoolComplete } from '../systems/signal';",
)
text = text.replace(
    'const nearCompletion = getStandardNearCompletion(GAME_REGISTRY, pending.commit);',
    'const nearCompletion = getStandardLootPoolNearCompletion(GAME_REGISTRY, pending.lootPoolId, pending.commit);',
)
old = """    if (isStandardCollectionComplete(GAME_REGISTRY, committed.discoveredStandard)) {
      const wasCompleteBefore = isStandardCollectionComplete(
        GAME_REGISTRY,
        pending.standard.isNew
          ? committed.discoveredStandard.filter((id) => id !== pending.standard.collectibleId)
          : committed.discoveredStandard,
      );
"""
new = """    if (isStandardLootPoolComplete(GAME_REGISTRY, pending.lootPoolId, committed.discoveredStandard)) {
      const wasCompleteBefore = isStandardLootPoolComplete(
        GAME_REGISTRY,
        pending.lootPoolId,
        pending.standard.isNew
          ? committed.discoveredStandard.filter((id) => id !== pending.standard.collectibleId)
          : committed.discoveredStandard,
      );
"""
if old not in text:
    raise SystemExit('OpeningScene.ts: completion block not found')
text = text.replace(old, new, 1)
write(path, text)

path = 'src/game/scenes/CollectionScene.ts'
text = read(path).replace('SLICE_REGISTRY', 'GAME_REGISTRY')
text = text.replace('getStandardNearCompletion', 'getStandardLootPoolNearCompletion')
text = text.replace(
    'getStandardLootPoolNearCompletion(GAME_REGISTRY, this.saveState)',
    'getStandardLootPoolNearCompletion(GAME_REGISTRY, this.saveState.activeLootPoolId, this.saveState)',
)
write(path, text)

path = 'src/game/scenes/BootScene.ts'
write(path, read(path).replace('SLICE_REGISTRY', 'GAME_REGISTRY'))

path = 'src/game/systems/save.ts'
text = read(path).replace(
    "import { SLICE_LOOT_POOL_ID, STANDARD_RARITIES, type StandardRarity } from '../data/collectibles';",
    "import { DEFAULT_LOOT_POOL_ID as GAME_DEFAULT_LOOT_POOL_ID, STANDARD_RARITIES, type StandardRarity } from '../data/collectibles';",
)
text = text.replace('export const DEFAULT_LOOT_POOL_ID = SLICE_LOOT_POOL_ID;', 'export const DEFAULT_LOOT_POOL_ID = GAME_DEFAULT_LOOT_POOL_ID;')
write(path, text)

# 6) High-signal contract/semantics tests for this pass.
test = r'''import { describe, expect, it } from 'vitest';

import { LITE_V2_BALANCE } from '../src/game/data/balance';
import { GAME_LOOT_POOL_IDS, GAME_REGISTRY } from '../src/game/data/collectibles';
import { getStandardLootPoolNearCompletion } from '../src/game/systems/collection';
import { resolveCollectionMilestone } from '../src/game/systems/collectionMilestones';
import { createPendingReveal } from '../src/game/systems/drops';
import { resolveLitePouchReward, type LiteRewardState } from '../src/game/systems/pouches';
import { createInitialSaveState } from '../src/game/systems/save';
import { SequenceRandom } from './helpers';

const poolItems = (poolId: string) => GAME_REGISTRY.standardItems.filter((item) => item.lootPoolId === poolId);
const poolSecrets = (poolId: string) => GAME_REGISTRY.secrets.filter((item) => item.lootPoolId === poolId);

const rewardState = (poolId: string, overrides: Partial<LiteRewardState> = {}): LiteRewardState => ({
  chips: 0,
  signal: 0,
  overchargeHundredths: 100,
  totalOpens: 50,
  activeLootPoolId: poolId,
  discoveredStandard: [],
  discoveredSecrets: [],
  ...overrides,
});

describe('production content registry and Drop semantics', () => {
  it('contains exactly 6 Drops, 12 families, 48 standards and 12 Secrets', () => {
    expect(GAME_REGISTRY.lootPools.map(({ id }) => id)).toEqual([...GAME_LOOT_POOL_IDS]);
    expect(GAME_REGISTRY.families).toHaveLength(12);
    expect(GAME_REGISTRY.standardItems).toHaveLength(48);
    expect(GAME_REGISTRY.secrets).toHaveLength(12);
    expect(GAME_REGISTRY.collectibleFamilyById.size).toBe(60);

    for (const poolId of GAME_LOOT_POOL_IDS) {
      expect(GAME_REGISTRY.lootPoolById.get(poolId)?.familyIds).toHaveLength(2);
      expect(poolItems(poolId)).toHaveLength(8);
      expect(poolSecrets(poolId)).toHaveLength(2);
    }
  });

  it('keeps starter protection local to a Drop even after many global openings', () => {
    const poolId = 'video-link';
    const first = resolveLitePouchReward({
      state: rewardState(poolId),
      pouchType: 'basic',
      registry: GAME_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0, 0]),
    });
    expect(first.standard.isNew).toBe(true);
    expect(GAME_REGISTRY.familyById.get(first.standard.familyId)?.dropId).toBe(poolId);

    const second = resolveLitePouchReward({
      state: rewardState(poolId, {
        totalOpens: 51,
        discoveredStandard: [first.standard.collectibleId],
      }),
      pouchType: 'basic',
      registry: GAME_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0, 0]),
    });
    expect(second.standard.isNew).toBe(true);
    expect(second.standard.familyId).not.toBe(first.standard.familyId);
  });

  it('computes near-completion inside one Drop and ignores progress in others', () => {
    const poolId = 'pocket-audio';
    const items = poolItems(poolId);
    const missing = items.at(-1);
    if (!missing) throw new Error('Pocket Audio requires standards');
    const unrelated = poolItems('y2k-essentials').map(({ collectible }) => collectible.id);

    expect(getStandardLootPoolNearCompletion(GAME_REGISTRY, poolId, {
      discoveredStandard: [...unrelated, ...items.slice(0, -1).map(({ collectible }) => collectible.id)],
    })).toEqual({
      current: 7,
      total: 8,
      missingCollectibleId: missing.collectible.id,
      familyId: missing.familyId,
      rarity: missing.rarity,
    });
  });

  it('emits standard completion for the reveal Drop without requiring 48/48 globally', () => {
    const poolId = 'pocket-office';
    const items = poolItems(poolId);
    const missing = items.find(({ rarity }) => rarity === 'common');
    if (!missing) throw new Error('Pocket Office requires a Common');
    const ownedInPool = items.filter((item) => item.collectible.id !== missing.collectible.id).map(({ collectible }) => collectible.id);
    const unrelated = poolItems('y2k-essentials').map(({ collectible }) => collectible.id);
    const initial = createInitialSaveState();
    const state = {
      ...initial,
      totalOpens: 60,
      signal: 4,
      activeLootPoolId: poolId,
      discoveredStandard: [...unrelated, ...ownedInPool],
    };
    const pending = createPendingReveal({
      state,
      registry: GAME_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0, 0]),
      transactionId: 'pool-complete',
      pouchType: 'basic',
    });

    expect(pending.standard.collectibleId).toBe(missing.collectible.id);
    expect(resolveCollectionMilestone(GAME_REGISTRY, pending, { ...state, ...pending.commit, pendingReveal: null })).toEqual({
      kind: 'standards-complete',
      current: 8,
      total: 8,
    });
  });
});
'''
write('tests/content-scale-semantics.test.ts', test)
