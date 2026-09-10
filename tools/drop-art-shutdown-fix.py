from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    file.write_text(text.replace(old, new, 1))


# Dynamic loads belong to the current Scene activation. If Phaser shuts the
# scene down while the loader is in flight, detach our listeners and settle the
# Promise so no async continuation is retained indefinitely.
replace_once(
    'src/game/systems/artLoading.ts',
    "  const missing = getRuntimeCollectibleArtForLootPool(registry, lootPoolId).filter(\n    ({ textureKey }) => !scene.textures.exists(textureKey),\n  );\n  if (missing.length === 0) return;\n\n  await new Promise<void>((resolve, reject) => {\n    const pendingKeys = new Set(missing.map(({ textureKey }) => textureKey));\n    const failedKeys = new Set<string>();\n\n    const cleanup = (): void => {\n      scene.load.off('loaderror', onLoadError);\n      scene.load.off(Phaser.Loader.Events.COMPLETE, onComplete);\n    };\n    const onLoadError = (file: Phaser.Loader.File): void => {\n      const key = String(file.key);\n      if (pendingKeys.has(key)) failedKeys.add(key);\n    };\n    const onComplete = (): void => {\n      cleanup();\n      if (failedKeys.size > 0) {\n        reject(new Error(`Failed to load collectible art: ${[...failedKeys].join(', ')}`));\n        return;\n      }\n      resolve();\n    };\n\n    scene.load.on('loaderror', onLoadError);\n    scene.load.once(Phaser.Loader.Events.COMPLETE, onComplete);\n    missing.forEach(({ textureKey, assetPath }) => scene.load.image(textureKey, assetPath));\n    scene.load.start();\n  });",
    "  if (!scene.sys.isActive()) return;\n\n  const missing = getRuntimeCollectibleArtForLootPool(registry, lootPoolId).filter(\n    ({ textureKey }) => !scene.textures.exists(textureKey),\n  );\n  if (missing.length === 0) return;\n\n  await new Promise<void>((resolve, reject) => {\n    const pendingKeys = new Set(missing.map(({ textureKey }) => textureKey));\n    const failedKeys = new Set<string>();\n    let settled = false;\n\n    const cleanup = (): void => {\n      scene.load.off('loaderror', onLoadError);\n      scene.load.off(Phaser.Loader.Events.COMPLETE, onComplete);\n      scene.events.off(Phaser.Scenes.Events.SHUTDOWN, onShutdown);\n    };\n    const finish = (error?: Error): void => {\n      if (settled) return;\n      settled = true;\n      cleanup();\n      if (error) reject(error);\n      else resolve();\n    };\n    const onLoadError = (file: Phaser.Loader.File): void => {\n      const key = String(file.key);\n      if (pendingKeys.has(key)) failedKeys.add(key);\n    };\n    const onComplete = (): void => {\n      if (failedKeys.size > 0) {\n        finish(new Error(`Failed to load collectible art: ${[...failedKeys].join(', ')}`));\n        return;\n      }\n      finish();\n    };\n    const onShutdown = (): void => finish();\n\n    scene.load.on('loaderror', onLoadError);\n    scene.load.once(Phaser.Loader.Events.COMPLETE, onComplete);\n    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, onShutdown);\n    missing.forEach(({ textureKey, assetPath }) => scene.load.image(textureKey, assetPath));\n    scene.load.start();\n  });",
)

# Initialization can be interrupted by Opening -> Collection -> Opening scene
# changes or external lifecycle transitions. Do not render or emit analytics for
# a Collection activation that was already shut down while its art was loading.
replace_once(
    'src/game/scenes/CollectionScene.ts',
    "    } catch (error: unknown) {\n      console.warn('[art] Collection active Drop art failed to load; using fallbacks', error);\n    }\n\n    getPlatformRuntime().analytics.track('collection_open', {",
    "    } catch (error: unknown) {\n      console.warn('[art] Collection active Drop art failed to load; using fallbacks', error);\n    }\n\n    if (!this.sys.isActive()) return;\n\n    getPlatformRuntime().analytics.track('collection_open', {",
)
