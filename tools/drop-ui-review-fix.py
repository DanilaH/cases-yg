from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    file.write_text(text.replace(old, new, 1))


# `page` now represents the browsed Drop, so switching Shelf/Library must not
# silently jump back to the first Drop.
replace_once(
    'src/game/scenes/CollectionScene.ts',
    "      this.view = view;\n      this.page = 0;\n      this.render();",
    "      this.view = view;\n      this.render();",
)

# A failed requested Drop switch is not a save-load failure. Keep the loaded
# save usable, synchronize from OpeningSession after its recovery attempt, and
# surface the normal non-fatal switch feedback.
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "    try {\n      this.saveState = await this.session.load();\n      const requestedLootPoolId = this.requestedLootPoolId;\n      this.requestedLootPoolId = null;\n      if (requestedLootPoolId && !this.saveState.pendingReveal) {\n        this.saveState = await this.session.selectLootPool(requestedLootPoolId);\n      }\n    } catch (error: unknown) {\n      this.phase = 'failed';\n      this.renderFailure(getMessages(platform.language).opening.saveLoadError);\n      platform.markReady();\n      console.error(error);\n      return;\n    }\n\n    if (this.isSceneShutdown()) return;\n\n    const pending = this.saveState.pendingReveal;\n    if (pending) this.selectedPouchType = pending.pouchType;\n    this.renderIdle();",
    "    try {\n      this.saveState = await this.session.load();\n    } catch (error: unknown) {\n      this.phase = 'failed';\n      this.renderFailure(getMessages(platform.language).opening.saveLoadError);\n      platform.markReady();\n      console.error(error);\n      return;\n    }\n\n    let idleMessage: string | undefined;\n    const requestedLootPoolId = this.requestedLootPoolId;\n    this.requestedLootPoolId = null;\n    if (requestedLootPoolId && !this.saveState.pendingReveal) {\n      try {\n        const previousLootPoolId = this.saveState.activeLootPoolId;\n        this.saveState = await this.session.selectLootPool(requestedLootPoolId);\n        if (previousLootPoolId !== requestedLootPoolId) {\n          platform.analytics.track('drop_selected', {\n            lootPoolId: requestedLootPoolId,\n            source: 'collection',\n          });\n        }\n      } catch (error: unknown) {\n        this.saveState = this.session.getState();\n        idleMessage = getMessages(platform.language).opening.dropSwitchError;\n        console.error('[drop] failed to apply Collection Drop selection', error);\n      }\n    }\n\n    if (this.isSceneShutdown()) return;\n\n    const pending = this.saveState.pendingReveal;\n    if (pending) this.selectedPouchType = pending.pouchType;\n    this.renderIdle(idleMessage);",
)
