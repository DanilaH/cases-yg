# Signal 2000 — zero runtime loading contract

Date: 2026-09-15
Base: `main` at `10436295ec3c09a4994e1fb751dbbd1d92cf8914`

## Product decision

After the game becomes playable, Signal 2000 must not present a loader, loading overlay, skeleton, shimmer, temporary placeholder, or other wait-state for authored game art.

The only loading surface is the startup loader before semantic Game Ready.

Because every Drop, both pouch variants, Collection and every collectible can become relevant during the same session, image availability is a session-level readiness requirement rather than a best-effort runtime concern.

## Implementation plan

1. Queue all reviewed runtime static art and all reviewed collectible art in `BootScene.preload()`.
2. Keep the startup DOM loader visible until Phaser preload, save resolution, scene handoff and the existing semantic Game Ready boundary complete.
3. Remove post-Ready browser image warmup; it is redundant once the complete session art set is already loaded through Phaser.
4. Change runtime `ensure*Art` helpers from network loaders into readiness assertions only. They may detect a missing texture and allow the existing confirmed-failure fallback path, but they must never enqueue or start a Phaser Loader transaction after Game Ready.
5. Delete the runtime loading overlay implementation entirely.
6. Add source-contract tests proving that no runtime art helper invokes `scene.load`, no runtime overlay exists, and Boot owns the complete reviewed session art set.

## Independent plan review

A second pass rejected three tempting alternatives:

- **Do not merely hide the loader.** Removing the overlay while keeping runtime image requests would replace an explicit loader with an invisible stall and would still violate the product decision.
- **Do not rely on browser prefetch as correctness.** Prefetch is advisory and evictable; a cache hit cannot be guaranteed. Phaser texture readiness must be established before Game Ready.
- **Do not combine alpha trim in the same PR.** Tight cropping changes texture metadata and presentation geometry even when implemented correctly. It should be a separate measured change after the loading contract is stable so regressions have one cause.

The cost is deliberate: a cold launch downloads/decodes the complete reviewed image set before gameplay. The preceding asset-budget pass reduced shipped image bytes enough to make this a reasonable production experiment. Memory optimization (tight alpha trim and, if justified later, GPU compression) follows separately.

## Coordinate invariant for future trim work

Physical alpha cropping must not change authored layout coordinates.

For every cropped texture the pipeline must preserve:

- original logical width/height;
- cropped rectangle (`x`, `y`, `width`, `height`);
- a small transparent/filtering gutter where needed.

After the physical image is loaded, Phaser frame trim metadata must restore the original logical source size and cropped offset. Existing layout code must continue to observe the same logical image dimensions/origin, so a collectible/pouch remains pixel-equivalent in scene space while the GPU stores fewer transparent pixels.

## Acceptance

Automated:

- `npm run typecheck` passes;
- full Vitest suite passes;
- `npm run assets:selftest` passes;
- `npm run assets:validate` passes;
- `npm run build` passes;
- Boot queues every reviewed collectible plus every reviewed static art texture exactly once;
- runtime art helpers contain no loader enqueue/start path;
- runtime overlay and post-Ready image warmup modules are absent.

Hands-on:

- one startup loader only;
- switching through all seven Drops never reveals a loader or loading UI;
- Basic/Charged pouch switching never reveals a loader;
- Collection opening and paging through all Drops never reveals a loader;
- reward reveal never shows a temporary authored-art placeholder;
- orientation/resize behavior remains stable;
- first-run and pending-reveal recovery remain unchanged.
