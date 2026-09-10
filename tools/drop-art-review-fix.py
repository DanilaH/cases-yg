from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:100]!r}')
    file.write_text(text.replace(old, new, 1))


path = 'src/game/scenes/OpeningScene.ts'

# A Drop preload is part of the switch transaction from the UI's point of view.
# Do not let the old Drop start an opening while its replacement is loading.
replace_once(
    path,
    "  private beginDrag(pointer: Phaser.Input.Pointer): void {\n    if (this.phase !== 'idle' || !this.pouch || !this.metrics) return;",
    "  private beginDrag(pointer: Phaser.Input.Pointer): void {\n    if (this.phase !== 'idle' || this.dropSwitchInFlight || !this.pouch || !this.metrics) return;",
)

# Changing pouch presentation while the Drop switch is awaiting network I/O can
# rebuild the idle root underneath the switch. Keep the selector stable instead.
replace_once(
    path,
    "  private selectPouchType(pouchType: PouchType, sourceCard?: Phaser.GameObjects.Container): void {\n    if (this.phase !== 'idle' || !this.saveState || this.selectedPouchType === pouchType) return;",
    "  private selectPouchType(pouchType: PouchType, sourceCard?: Phaser.GameObjects.Container): void {\n    if (this.phase !== 'idle' || this.dropSwitchInFlight || !this.saveState || this.selectedPouchType === pouchType) return;",
)

# Collection navigation destroys Opening. Do not allow it to race a Drop load;
# otherwise the async continuation could persist/render after scene shutdown.
replace_once(
    path,
    "      button.on('pointerup', () => {\n        getGameAudio().play('ui-click');\n        this.ignoreNextResultTap = true;\n        this.scene.start('CollectionScene');",
    "      button.on('pointerup', () => {\n        if (this.dropSwitchInFlight) return;\n        getGameAudio().play('ui-click');\n        this.ignoreNextResultTap = true;\n        this.scene.start('CollectionScene');",
)

# Still defend against external scene shutdowns while the loader Promise is in
# flight. Persistence belongs only to the still-active Opening activation.
replace_once(
    path,
    "    } catch (error: unknown) {\n      console.warn('[art] target Drop collectible art failed to load; using fallbacks', error);\n    }\n    try {\n      this.saveState = await this.session.selectLootPool(nextPoolId);",
    "    } catch (error: unknown) {\n      console.warn('[art] target Drop collectible art failed to load; using fallbacks', error);\n    }\n    if (this.isSceneShutdown()) {\n      this.dropSwitchInFlight = false;\n      return;\n    }\n    try {\n      this.saveState = await this.session.selectLootPool(nextPoolId);",
)
