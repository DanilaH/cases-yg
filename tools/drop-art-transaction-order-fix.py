from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:140]!r}')
    file.write_text(text.replace(old, new, 1))


path = 'src/game/scenes/OpeningScene.ts'

# Collection-return selection should follow the same ordering as the direct
# Opening selector: finish the target Drop preload attempt first, then persist
# only if this Scene activation is still alive.
replace_once(
    path,
    "    let idleMessage: string | undefined;\n    const requestedLootPoolId = this.requestedLootPoolId;\n    this.requestedLootPoolId = null;\n    if (requestedLootPoolId && !this.saveState.pendingReveal) {\n      try {\n        const previousLootPoolId = this.saveState.activeLootPoolId;\n        this.saveState = await this.session.selectLootPool(requestedLootPoolId);\n        if (previousLootPoolId !== requestedLootPoolId) {\n          platform.analytics.track('drop_selected', {\n            lootPoolId: requestedLootPoolId,\n            source: 'collection',\n          });\n        }\n      } catch (error: unknown) {\n        this.saveState = this.session.getState();\n        idleMessage = getMessages(platform.language).opening.dropSwitchError;\n        console.error('[drop] failed to apply Collection Drop selection', error);\n      }\n    }\n\n    try {\n      await ensureLootPoolCollectibleArt(this, GAME_REGISTRY, this.saveState.activeLootPoolId);\n    } catch (error: unknown) {\n      console.warn('[art] active Drop collectible art failed to load; using fallbacks', error);\n    }\n\n    if (this.isSceneShutdown()) return;",
    "    let idleMessage: string | undefined;\n    const requestedLootPoolId = this.requestedLootPoolId;\n    this.requestedLootPoolId = null;\n    const targetLootPoolId =\n      requestedLootPoolId && !this.saveState.pendingReveal\n        ? requestedLootPoolId\n        : this.saveState.activeLootPoolId;\n\n    try {\n      await ensureLootPoolCollectibleArt(this, GAME_REGISTRY, targetLootPoolId);\n    } catch (error: unknown) {\n      console.warn('[art] active Drop collectible art failed to load; using fallbacks', error);\n    }\n\n    if (this.isSceneShutdown()) return;\n\n    if (requestedLootPoolId && !this.saveState.pendingReveal) {\n      try {\n        const previousLootPoolId = this.saveState.activeLootPoolId;\n        this.saveState = await this.session.selectLootPool(requestedLootPoolId);\n        if (this.isSceneShutdown()) return;\n        if (previousLootPoolId !== requestedLootPoolId) {\n          platform.analytics.track('drop_selected', {\n            lootPoolId: requestedLootPoolId,\n            source: 'collection',\n          });\n        }\n      } catch (error: unknown) {\n        this.saveState = this.session.getState();\n        if (this.isSceneShutdown()) return;\n        idleMessage = getMessages(platform.language).opening.dropSwitchError;\n        console.error('[drop] failed to apply Collection Drop selection', error);\n      }\n    }",
)

# Storage completion is another async boundary. Even after the art load is done,
# an external scene transition can happen while the Drop save is being written.
# Keep the durable selection, but suppress stale analytics/render afterwards.
replace_once(
    path,
    "    try {\n      this.saveState = await this.session.selectLootPool(nextPoolId);\n      getPlatformRuntime().analytics.track('drop_selected', {\n        lootPoolId: nextPoolId,\n        source: 'opening',\n      });\n      this.dropSwitchInFlight = false;\n      this.renderIdle();\n    } catch (error: unknown) {\n      this.dropSwitchInFlight = false;\n      this.saveState = this.session.getState();\n      console.error('[drop] failed to switch Drop', error);\n      this.renderIdle(getMessages(getPlatformRuntime().language).opening.dropSwitchError);\n    }",
    "    try {\n      this.saveState = await this.session.selectLootPool(nextPoolId);\n      if (this.isSceneShutdown()) {\n        this.dropSwitchInFlight = false;\n        return;\n      }\n      getPlatformRuntime().analytics.track('drop_selected', {\n        lootPoolId: nextPoolId,\n        source: 'opening',\n      });\n      this.dropSwitchInFlight = false;\n      this.renderIdle();\n    } catch (error: unknown) {\n      this.dropSwitchInFlight = false;\n      this.saveState = this.session.getState();\n      if (this.isSceneShutdown()) return;\n      console.error('[drop] failed to switch Drop', error);\n      this.renderIdle(getMessages(getPlatformRuntime().language).opening.dropSwitchError);\n    }",
)
