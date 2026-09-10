from pathlib import Path
import re


def read(path: str) -> str:
    return Path(path).read_text()


def write(path: str, text: str) -> None:
    Path(path).write_text(text)


def replace_once(path: str, old: str, new: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    write(path, text.replace(old, new, 1))


# Remove production compatibility exports now that runtime is GAME_REGISTRY-based.
path = 'src/game/data/collectibles.ts'
text = read(path)
legacy = """
/** @deprecated Compatibility-only first-Drop slice. Production runtime uses GAME_REGISTRY. */
export const SLICE_LOOT_POOL_ID = DEFAULT_LOOT_POOL_ID;
/** @deprecated Compatibility-only first-Drop slice. Production runtime uses GAME_FAMILIES. */
export const SLICE_FAMILIES = GAME_FAMILIES.filter((familyDefinition) => familyDefinition.dropId === DEFAULT_LOOT_POOL_ID);
/** @deprecated Compatibility-only first-Drop slice. Production runtime uses GAME_REGISTRY. */
export const SLICE_REGISTRY = createContentRegistry(SLICE_FAMILIES);
"""
if text.count(legacy) != 1:
    raise SystemExit('collectibles.ts: legacy slice export block mismatch')
write(path, text.replace(legacy, '\n', 1))

# SLICE_BALANCE has no consumers; remove the dead pre-Lite shape instead of
# preserving another compatibility contract through the balance pass.
path = 'src/game/data/balance.ts'
text = read(path)
marker = """
/**
 * Compatibility aliases for older call sites that still read the Basic profile through
 * the pre-Lite `SLICE_BALANCE` shape. All values resolve from the active Lite V2 config.
 */
export const SLICE_BALANCE = {
  ...LITE_V2_BALANCE,
  standardRarityWeights: LITE_V2_BALANCE.pouchProfiles.basic.rarityWeights,
  signal: {
    threshold: LITE_V2_BALANCE.signalThreshold,
  },
  hiddenPocket: {
    startOpening: LITE_V2_BALANCE.hiddenPocketStartOpening,
    chance: LITE_V2_BALANCE.pouchProfiles.basic.hiddenPocketChance,
  },
} as const;
"""
if text.count(marker) != 1:
    raise SystemExit('balance.ts: SLICE_BALANCE block mismatch')
write(path, text.replace(marker, '\n', 1))

# Debug scenarios keep their historical first/default-Drop behaviour, but use
# the production registry explicitly instead of a second registry export.
path = 'src/debug/debugScenarios.ts'
replace_once(
    path,
    "import {\n  SLICE_LOOT_POOL_ID,\n  SLICE_REGISTRY,\n  STANDARD_RARITIES,\n  type StandardRarity,\n} from '../game/data/collectibles';",
    "import {\n  DEFAULT_LOOT_POOL_ID,\n  GAME_REGISTRY,\n  STANDARD_RARITIES,\n  type StandardRarity,\n} from '../game/data/collectibles';",
)
replace_once(
    path,
    "const unique = (values: readonly string[]): string[] => [...new Set(values)];",
    "const defaultDropStandardItems = GAME_REGISTRY.standardItems.filter(\n  ({ lootPoolId }) => lootPoolId === DEFAULT_LOOT_POOL_ID,\n);\nconst defaultDropSecrets = GAME_REGISTRY.secrets.filter(\n  ({ lootPoolId }) => lootPoolId === DEFAULT_LOOT_POOL_ID,\n);\n\nconst unique = (values: readonly string[]): string[] => [...new Set(values)];",
)
text = read(path)
text = text.replace('SLICE_LOOT_POOL_ID', 'DEFAULT_LOOT_POOL_ID')
text = text.replace('SLICE_REGISTRY.standardItems', 'defaultDropStandardItems')
text = text.replace('SLICE_REGISTRY.secrets', 'defaultDropSecrets')
text = text.replace('registry: SLICE_REGISTRY', 'registry: GAME_REGISTRY')
if 'SLICE_' in text:
    raise SystemExit('debugScenarios.ts: legacy SLICE symbol remains')
write(path, text)

# Unit tests intentionally exercise the compact first-Drop fixture. Keep that
# fixture test-local so production exports no longer carry vertical-slice debt.
fixture_path = Path('tests/defaultDropFixture.ts')
fixture_path.write_text("""import {
  DEFAULT_LOOT_POOL_ID,
  GAME_FAMILIES,
  createContentRegistry,
} from '../src/game/data/collectibles';

export const DEFAULT_DROP_FAMILIES = GAME_FAMILIES.filter(
  ({ dropId }) => dropId === DEFAULT_LOOT_POOL_ID,
);

export const DEFAULT_DROP_REGISTRY = createContentRegistry(DEFAULT_DROP_FAMILIES);
""")

affected_tests = [
    'tests/lite-pouches.test.ts',
    'tests/reward-engine.test.ts',
    'tests/secret-reward.test.ts',
    'tests/runtime-assets.test.ts',
    'tests/opening-economy.test.ts',
    'tests/save-migration.test.ts',
    'tests/collection-milestones.test.ts',
    'tests/near-completion.test.ts',
]

collectibles_import_re = re.compile(
    r"import\s*\{(?P<body>.*?)\}\s*from '../src/game/data/collectibles';",
    re.DOTALL,
)

for path in affected_tests:
    text = read(path)
    needed_fixture = set()
    if 'SLICE_REGISTRY' in text:
        text = text.replace('SLICE_REGISTRY', 'DEFAULT_DROP_REGISTRY')
        needed_fixture.add('DEFAULT_DROP_REGISTRY')
    if 'SLICE_FAMILIES' in text:
        text = text.replace('SLICE_FAMILIES', 'DEFAULT_DROP_FAMILIES')
        needed_fixture.add('DEFAULT_DROP_FAMILIES')
    if 'SLICE_LOOT_POOL_ID' in text:
        text = text.replace('SLICE_LOOT_POOL_ID', 'DEFAULT_LOOT_POOL_ID')

    match = collectibles_import_re.search(text)
    if match:
        raw_parts = [part.strip() for part in match.group('body').split(',') if part.strip()]
        fixture_names = {'DEFAULT_DROP_REGISTRY', 'DEFAULT_DROP_FAMILIES'}
        raw_parts = [part for part in raw_parts if part not in fixture_names]
        if 'DEFAULT_LOOT_POOL_ID' in text and 'DEFAULT_LOOT_POOL_ID' not in raw_parts:
            raw_parts.append('DEFAULT_LOOT_POOL_ID')
        if raw_parts:
            replacement = "import {\n  " + ",\n  ".join(raw_parts) + ",\n} from '../src/game/data/collectibles';"
        else:
            replacement = ''
        text = text[:match.start()] + replacement + text[match.end():]
    elif 'DEFAULT_LOOT_POOL_ID' in text:
        text = "import { DEFAULT_LOOT_POOL_ID } from '../src/game/data/collectibles';\n" + text

    if needed_fixture:
        fixture_import = "import { " + ', '.join(sorted(needed_fixture)) + " } from './defaultDropFixture';\n"
        # Insert after the final top-level import declaration block by placing it
        # before the first relative systems/test-helper import when possible.
        text = fixture_import + text

    if 'SLICE_' in text:
        raise SystemExit(f'{path}: legacy SLICE symbol remains')
    write(path, text)
