from pathlib import Path

source_path = Path('tools/drop-ui-pass.py')
source = source_path.read_text()

old_near_block = '''replace_once(\n    'src/game/scenes/CollectionScene.ts',\n    "getStandardLootPoolNearCompletion(GAME_REGISTRY, this.saveState.activeLootPoolId, this.saveState)",\n    "getStandardLootPoolNearCompletion(GAME_REGISTRY, this.selectedLootPoolId(), this.saveState)",\n)\n# Same expression occurs twice; replace the remaining one.\nreplace_once(\n    'src/game/scenes/CollectionScene.ts',\n    "getStandardLootPoolNearCompletion(GAME_REGISTRY, this.saveState.activeLootPoolId, this.saveState)",\n    "getStandardLootPoolNearCompletion(GAME_REGISTRY, this.selectedLootPoolId(), this.saveState)",\n)'''
new_near_block = '''collection_path = 'src/game/scenes/CollectionScene.ts'\ncollection_text = read(collection_path)\nold_near = "getStandardLootPoolNearCompletion(GAME_REGISTRY, this.saveState.activeLootPoolId, this.saveState)"\nnew_near = "getStandardLootPoolNearCompletion(GAME_REGISTRY, this.selectedLootPoolId(), this.saveState)"\nif collection_text.count(old_near) != 2:\n    raise SystemExit(f"CollectionScene.ts: expected two near-completion matches, found {collection_text.count(old_near)}")\nwrite(collection_path, collection_text.replace(old_near, new_near))'''

old_registry_block = '''replace_once(\n    'tests/opening-session.test.ts',\n    "    registry: SLICE_REGISTRY,",\n    "    registry: GAME_REGISTRY,",\n)\nreplace_once(\n    'tests/opening-session.test.ts',\n    "      registry: SLICE_REGISTRY,",\n    "      registry: GAME_REGISTRY,",\n)'''
new_registry_block = '''session_test_path = 'tests/opening-session.test.ts'\nsession_test_text = read(session_test_path)\nold_registry = "registry: SLICE_REGISTRY,"\nif session_test_text.count(old_registry) != 2:\n    raise SystemExit(f"opening-session.test.ts: expected two registry matches, found {session_test_text.count(old_registry)}")\nwrite(session_test_path, session_test_text.replace(old_registry, "registry: GAME_REGISTRY,"))'''

for old, new, label in [
    (old_near_block, new_near_block, 'near-completion block'),
    (old_registry_block, new_registry_block, 'session registry block'),
]:
    if source.count(old) != 1:
        raise SystemExit(f'drop-ui-pass.py: expected {label} not found')
    source = source.replace(old, new)

strict_replacements = {
    "    const poolId = GAME_LOOT_POOL_IDS[index];":
        "    const poolId: GameLootPoolId = GAME_LOOT_POOL_IDS[index] ?? GAME_LOOT_POOL_IDS[0];",
    "    const nextPoolId = GAME_LOOT_POOL_IDS[nextIndex];":
        "    const nextPoolId: GameLootPoolId = GAME_LOOT_POOL_IDS[nextIndex] ?? GAME_LOOT_POOL_IDS[0];",
}
for old, new in strict_replacements.items():
    if source.count(old) != 1:
        raise SystemExit(f'drop-ui-pass.py: strict replacement not found: {old}')
    source = source.replace(old, new)

fixture_old = "      signal: 3,\n      overchargeHundredths: 130,"
fixture_new = "      signal: LITE_V2_BALANCE.signalThreshold,\n      overchargeHundredths: 130,"
if source.count(fixture_old) != 1:
    raise SystemExit(f'drop-ui-pass.py: economy fixture replacement not found ({source.count(fixture_old)})')
source = source.replace(fixture_old, fixture_new)

exec(compile(source, str(source_path), 'exec'))
