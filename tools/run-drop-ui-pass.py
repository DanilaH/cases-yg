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

exec(compile(source, str(source_path), 'exec'))
