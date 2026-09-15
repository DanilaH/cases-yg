# Startup asset staging — 2026-09-14

Status: superseded on 2026-09-15 by the zero-runtime-loading product decision.

Real-phone acceptance originally showed cold startup above 30 seconds, which led to staged active-Drop loading and later a polished runtime loading surface. Subsequent product acceptance rejected any in-game loading surface as a class of UX.

The current canonical contract is recorded in `docs/ZERO_RUNTIME_LOADING_2026-09-15.md`.

## Historical staging approach

The previous implementation reduced cold-start work by loading only the active Drop before first play and relying on browser prefetch plus Phaser runtime loading for other Drops. It preserved correctness, but it necessarily meant that visiting uncached content could create an in-game wait state.

That trade-off is no longer accepted.

## Current contract

- The only loading surface is the startup loader.
- `BootScene.preload()` owns the complete reviewed session-critical image set: Opening/Collection static art, every Basic/Charged pouch layer for every Drop, and every reviewed collectible.
- Semantic Game Ready is not reached until Phaser's blocking preload has settled and the playable/recoverable scene is ready.
- Runtime `ensure*Art` helpers are readiness assertions only. They never enqueue or start a Phaser Loader transaction.
- There is no post-Ready image prefetch/warmup system because the complete session set is already Phaser-ready.
- There is no runtime loading overlay.
- A confirmed missing startup texture may still exercise the existing emergency procedural fallback, but normal network/decode latency must never create a placeholder or loading UI after Game Ready.

## Expected startup shape

Cold/new or uncached launch:

`complete reviewed image preload -> load/reconcile save -> scene handoff -> first usable frame -> Game Ready -> uninterrupted session`

Warm launch:

`same correctness path with browser HTTP cache acceleration -> uninterrupted session`

The browser cache is an optimization only; correctness does not depend on speculative prefetch retention.

## Why the policy changed

The previous runtime loader was technically correct but product-wrong. Hiding missing art behind a polished loading screen still interrupted a tiny high-frequency game loop. Hiding the loading UI while keeping network work would be worse because it would create an unexplained stall.

The selected trade-off is therefore explicit: pay the complete session image cost once under the startup loader, then keep the live session interruption-free. The earlier image-budget pass reduced shipped image bytes enough to make this worth testing on target phones.

## Memory follow-up

Full session residency raises the importance of decoded/GPU memory. The next independent optimization is tight alpha cropping with preserved logical frame metadata. That work is intentionally separate from the loading-policy change so coordinate/presentation regressions cannot be confused with loader-policy regressions.

## Acceptance

1. Exactly one loading surface exists: startup.
2. Switching through all Drops never shows loading UI.
3. Basic/Charged switching never shows loading UI.
4. Collection opening/paging never shows loading UI.
5. Reward reveal never exposes a temporary authored-art placeholder under normal successful loading.
6. Runtime art helpers contain no Phaser loader start/enqueue path.
7. Orientation gate remains independent and may still cover portrait presentation; it is not an asset loader.
8. Full typecheck/tests/assets/build gate remains green.
