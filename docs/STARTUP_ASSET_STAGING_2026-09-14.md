# Startup asset staging — 2026-09-14

Status: implementation pass.

Real-phone acceptance showed that cold startup can exceed 30 seconds. The current boot path also preloads pouch art for every Drop before the first playable frame. This pass reduces the blocking startup set while preserving the invariant that slow asset loading must never produce temporary procedural placeholders.

## Contract

- Boot blocks only on static shell art plus the active Drop required for the first playable scene.
- The active Drop is resolved from the durable save before scene handoff.
- Active Drop collectible and pouch textures are awaited through the existing Phaser loader before FirstRun/Opening can render them.
- A slow request waits; it is not treated as a missing asset.
- Procedural fallback remains only for a confirmed load failure.
- After semantic Game Ready, the remaining reviewed image assets are fetched with bounded concurrency to warm the normal browser HTTP cache.
- Background warmup never inserts those assets into Phaser's TextureManager, so it does not decode the full catalog into GPU/mobile memory.
- Cache presence is an optimization only. Correctness continues to rely on the existing on-demand Phaser readiness gates.

## Expected startup shape

Cold/new or uncached launch:

`static shell -> load save -> active Drop art -> first usable frame -> Game Ready -> background HTTP-cache warmup`

Later launch with a warm browser cache:

`static shell -> load save -> active Drop art from cache -> first usable frame`

## Acceptance

1. No Drop/pouch/collectible placeholder may appear merely because an asset is still downloading.
2. First-run pouch/reveal remains fully authored.
3. Returning saves start with their actual active Drop rather than paying for the default Drop first.
4. Browsing a not-yet-decoded Drop still waits for its Phaser loader completion before rendering.
5. Background warmup is bounded and non-fatal; failed speculative requests do not block gameplay.
6. Full typecheck/tests/assets/build gate remains green.
