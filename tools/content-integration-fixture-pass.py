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


# Existing pure-resolver tests that are not about onboarding need to state that
# the active Drop has already left its starter phase. Keep the seeded standards
# away from the camera targets used by deterministic roll assertions.
path = 'tests/lite-pouches.test.ts'
text = read(path)
anchor = "import { SequenceRandom } from './helpers';\n\n"
if anchor not in text:
    raise SystemExit('lite-pouches: import anchor missing')
text = text.replace(
    anchor,
    anchor + "const POST_ONBOARDING_STANDARD_IDS = ['flip-phone-common', 'flip-phone-rare', 'flip-phone-legendary'] as const;\n\n",
    1,
)
text = text.replace('  discoveredStandard: [],\n', '  discoveredStandard: [...POST_ONBOARDING_STANDARD_IDS],\n', 1)
text = text.replace(
    "state: makeState({ discoveredStandard: ['camera-common'] }),",
    "state: makeState({ discoveredStandard: [...POST_ONBOARDING_STANDARD_IDS, 'camera-common'] }),",
    1,
)
needle = "state: makeState({ signal: 3, discoveredStandard: ['camera-common'] }),"
count = text.count(needle)
if count != 2:
    raise SystemExit(f'lite-pouches: expected two signal duplicate fixtures, found {count}')
text = text.replace(
    needle,
    "state: makeState({ signal: 3, discoveredStandard: [...POST_ONBOARDING_STANDARD_IDS, 'camera-common'] }),",
)
write(path, text)

# Transaction integration duplicate/third-family cases also need an explicitly
# post-onboarding active pool. The actual onboarding test remains untouched.
path = 'tests/reward-engine.test.ts'
text = read(path)
replace_old = """      totalOpens: 3,
      discoveredStandard: ['camera-common'],
"""
replace_new = """      totalOpens: 3,
      discoveredStandard: ['flip-phone-common', 'flip-phone-rare', 'flip-phone-legendary', 'camera-common'],
"""
if replace_old not in text:
    raise SystemExit('reward-engine: duplicate fixture missing')
text = text.replace(replace_old, replace_new, 1)
old = """    const state: SaveState = {
      ...createInitialSaveState(),
      totalOpens: 3,
    };
    const pending = createPendingReveal({
      state,
      registry,
"""
new = """    const state: SaveState = {
      ...createInitialSaveState(),
      totalOpens: 3,
      discoveredStandard: ['flip-phone-common', 'flip-phone-rare', 'flip-phone-legendary'],
    };
    const pending = createPendingReveal({
      state,
      registry,
"""
if old not in text:
    raise SystemExit('reward-engine: third-family fixture missing')
text = text.replace(old, new, 1)
write(path, text)

# Presentation-economy duplicate fixture is not an onboarding scenario.
replace_once(
    'tests/opening-economy.test.ts',
    "      discoveredStandard: ['camera-common'],",
    "      discoveredStandard: ['flip-phone-common', 'flip-phone-rare', 'flip-phone-legendary', 'camera-common'],",
)

# Debug force scenarios must bypass starter protection so their explicit random
# sequences continue to force the requested rarity/family/duplicate. Seed three
# standards that do not collide with any camera target or the epic-phone target.
path = 'src/debug/debugScenarios.ts'
text = read(path)
old = """  totalOpens: Math.max(3, state.totalOpens),
  pendingReveal: null,
  // Debug scenarios must never inherit an incompatible armed Overcharge state.
"""
new = """  totalOpens: Math.max(3, state.totalOpens),
  pendingReveal: null,
  discoveredStandard: unique([
    ...state.discoveredStandard,
    phoneItemId('common'),
    phoneItemId('rare'),
    phoneItemId('legendary'),
  ]),
  // Debug scenarios must never inherit an incompatible armed Overcharge state.
"""
if old not in text:
    raise SystemExit('debugScenarios: base state anchor missing')
text = text.replace(old, new, 1)
write(path, text)
