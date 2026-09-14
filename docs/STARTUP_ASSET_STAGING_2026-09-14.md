# Startup asset staging — 2026-09-14

Status: implementation pass.

Real-phone acceptance showed that cold startup can exceed 30 seconds. The current boot path also preloads pouch art for every Drop before the first playable frame. This pass reduces the blocking startup set while preserving the invariant that slow asset loading must never produce temporary procedural placeholders.

## Contract

- Phaser's first blocking preload contains only the shared authored scene backgrounds.
- The active Drop is resolved from the durable save before scene handoff.
- Active Drop collectible and pouch textures are awaited through the existing Phaser loader before FirstRun/Opening can render them.
- A slow request waits; it is not treated as a missing asset.
- Procedural fallback remains only for a confirmed load failure.
- After semantic Game Ready, the complete reviewed image catalog is offered to the browser as low-priority `prefetch` work in small staggered batches.
- Background warmup never inserts speculative assets into Phaser's TextureManager, so it does not decode the full catalog into GPU/mobile memory.
- Browser HTTP-cache retention is an optimization, not durable state: the browser may evict or ignore speculative cache work. Correctness always remains on the existing on-demand Phaser readiness gates.

## Expected startup shape

Cold/new or uncached launch:

`shared backgrounds -> load save -> active Drop art -> first usable frame -> Game Ready -> background cache warmup`

Later launch when the browser retained the warmed responses:

`shared backgrounds from cache -> load save -> active Drop art from cache -> first usable frame`

The later launch must still work normally when the cache was cleared or evicted; it simply falls back to the same awaited on-demand loading path.

## Placeholder invariant

Background cache warmup is never considered proof that a texture exists in Phaser. Before a Drop is shown, its scene path still awaits the Phaser loader's `COMPLETE` signal. That applies to initial active-Drop handoff and the existing Opening/Collection lazy-loading paths.

Therefore:

- `slow` means wait;
- `already cached` means the wait should be short;
- `confirmed loaderror` may use the existing procedural emergency fallback.

## Acceptance

1. No Drop/pouch/collectible placeholder may appear merely because an asset is still downloading.
2. First-run pouch/reveal remains fully authored.
3. Returning saves start with their actual active Drop rather than paying for the default Drop first.
4. Browsing a not-yet-decoded Drop still waits for its Phaser loader completion before rendering.
5. Background warmup is staggered, low-priority and non-fatal; speculative misses do not block gameplay.
6. The full catalog is not eagerly decoded into Phaser/GPU memory.
7. Full typecheck/tests/assets/build gate remains green.
