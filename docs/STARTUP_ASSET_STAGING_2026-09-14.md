# Startup asset staging — 2026-09-14

Status: implementation pass, updated 2026-09-15 by Runtime Performance V2.

Real-phone acceptance showed that cold startup can exceed 30 seconds. The current boot path also preloads pouch art for every Drop before the first playable frame. This pass reduces the blocking startup set while preserving the invariant that slow asset loading must never produce temporary procedural placeholders.

## Contract

- Phaser's first blocking preload contains only the shared authored scene backgrounds.
- The active Drop is resolved from the durable save before scene handoff.
- Active Drop collectible and pouch textures are awaited through the existing Phaser loader before FirstRun/Opening can render them.
- A slow request waits; it is not treated as a missing asset.
- Procedural fallback remains only for a confirmed load failure.
- After semantic Game Ready, browser `prefetch` work is intentionally bounded to likely near-future assets: Collection-only static layers, collectibles for the resolved active Drop, and Basic + Charged pouch layers for that Drop.
- Other Drops are **not** downloaded speculatively merely because the game reached Ready. Their existing runtime loader remains the correctness path when the player actually browses them.
- Background warmup never inserts speculative assets into Phaser's TextureManager, so it does not decode the full catalog into GPU/mobile memory.
- Browser HTTP-cache retention is an optimization, not durable state: the browser may evict or ignore speculative cache work. Correctness always remains on the existing on-demand Phaser readiness gates.

## Expected startup shape

Cold/new or uncached launch:

`shared backgrounds -> load save -> active Drop art -> first usable frame -> Game Ready -> bounded active-Drop/Collection cache warmup`

Later launch when the browser retained the warmed responses:

`shared backgrounds from cache -> load save -> active Drop art from cache -> first usable frame`

The later launch must still work normally when the cache was cleared or evicted; it simply falls back to the same awaited on-demand loading path.

## Placeholder invariant

Background cache warmup is never considered proof that a texture exists in Phaser. Before a Drop is shown, its scene path still awaits the Phaser loader's `COMPLETE` signal. That applies to initial active-Drop handoff and the existing Opening/Collection lazy-loading paths.

Opening has one important edge case: Drop switching intentionally renders the user's target preview before its asynchronous loader starts. Removing the previous all-Drop pouch preload would otherwise expose procedural pouch art during a slow first visit.

The first implementation hid that preview with a separate translucent technical art gate. Real-device acceptance rejected it: the underlying placeholder remained visible through the scrim and the tiny center marker looked like debug UI rather than authored game presentation.

Runtime missing-texture loads now reuse the same authored full-screen startup preload surface: themed opaque background, spinner, status copy and fake progress. The overlay only takes ownership after startup itself is hidden, so initial boot ownership is unchanged. When dynamic art finishes, the scene emits the existing ScaleManager refresh path while the loader still covers the canvas; the overlay then completes to 100% and exits after a short minimum-visible hold.

Therefore:

- `slow` means wait behind the authored loader;
- `already decoded in Phaser` means no loader at all;
- `HTTP-cached but not decoded` means a short polished Phaser load/decode;
- `confirmed loaderror` may use the existing procedural emergency fallback;
- procedural preview art must never be visible through the loading surface.

## Runtime Performance V2 correction

The original warmup deliberately offered the **entire** reviewed image catalog to the browser after Game Ready. That was acceptable as a first correctness-preserving experiment, but it is too eager for production mobile traffic once seven Drops exist.

The revised policy is:

`critical correctness load -> semantic Game Ready -> active-Drop/Collection near-future warm -> intent-driven loading for every other Drop`

This change is network-policy only. It does not weaken any Phaser texture readiness gate and does not introduce durable CacheStorage or a service worker.

## Acceptance

1. No Drop/pouch/collectible placeholder may appear merely because an asset is still downloading.
2. First-run pouch/reveal remains fully authored.
3. Returning saves start with their actual active Drop rather than paying for the default Drop first.
4. Browsing/switching to a not-yet-decoded Drop uses the same polished loader language as startup and rebuilds with authored textures before uncovering the canvas.
5. No translucent debug-style art scrim or standalone center glyph remains.
6. Background warmup is staggered, low-priority and non-fatal; speculative misses do not block gameplay.
7. Background warmup excludes unrelated Drops until player intent requires them.
8. The full catalog is not eagerly decoded into Phaser/GPU memory.
9. Orientation gate still owns portrait presentation above any loading surface.
10. Full typecheck/tests/assets/build gate remains green.
