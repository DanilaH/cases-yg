from pathlib import Path

source_path = Path('tools/drop-ui-pass.py')
source = source_path.read_text()
old = '''replace_once(\n    'src/game/scenes/CollectionScene.ts',\n    "getStandardLootPoolNearCompletion(GAME_REGISTRY, this.saveState.activeLootPoolId, this.saveState)",\n    "getStandardLootPoolNearCompletion(GAME_REGISTRY, this.selectedLootPoolId(), this.saveState)",\n)\n# Same expression occurs twice; replace the remaining one.\nreplace_once(\n    'src/game/scenes/CollectionScene.ts',\n    "getStandardLootPoolNearCompletion(GAME_REGISTRY, this.saveState.activeLootPoolId, this.saveState)",\n    "getStandardLootPoolNearCompletion(GAME_REGISTRY, this.selectedLootPoolId(), this.saveState)",\n)'''
new = '''collection_path = 'src/game/scenes/CollectionScene.ts'\ncollection_text = read(collection_path)\nold_near = "getStandardLootPoolNearCompletion(GAME_REGISTRY, this.saveState.activeLootPoolId, this.saveState)"\nnew_near = "getStandardLootPoolNearCompletion(GAME_REGISTRY, this.selectedLootPoolId(), this.saveState)"\nif collection_text.count(old_near) != 2:\n    raise SystemExit(f"CollectionScene.ts: expected two near-completion matches, found {collection_text.count(old_near)}")\nwrite(collection_path, collection_text.replace(old_near, new_near))'''
if source.count(old) != 1:
    raise SystemExit('drop-ui-pass.py: expected replacement block not found')
exec(compile(source.replace(old, new), str(source_path), 'exec'))
