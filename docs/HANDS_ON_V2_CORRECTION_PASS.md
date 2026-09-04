# Hands-on V2 correction pass

## Source feedback

This pass addresses the third direct hands-on review of merged Reveal Presentation V2.

Observed issues:

1. Pouch top strip is still too dominant and the star tab does not read as a natural pull handle.
2. `Drag the star to tear` overlaps the pouch.
3. Once the result action becomes available, the panel does not read strongly enough as tappable. The idle star has the same discoverability problem.
4. Reveal FX are technically present but too faint against the production background.
5. The opening/result environment feels too static between interactions.
6. The active reward should have a subtle idle breathing motion, but that motion must not fight carousel scale interpolation.

## Implementation plan

### A. Readability and interaction

- Rebalance pouch layer transforms rather than changing source art:
  - reduce tear-strip visual dominance;
  - reposition/resize the star tab and hitbox so it reads as the left pull handle;
  - keep body as the primary silhouette.
- Move the tear hint below the pouch with a guaranteed visual gap.
- Add restrained idle attraction animation to the star tab; stop it immediately when drag begins.
- When `resultReady` becomes true, pulse the whole result action panel gently with a heartbeat-like two-step pulse. Stop/reset it during carousel manipulation or transition.

### B. Spectacle and ambient motion

- Improve reveal separation from the illustrated background:
  - add a short local/background dim layer for reveal moments;
  - increase halo/ring/flash visibility and sparkle size/opacity;
  - keep the rarity ladder monotonic, with Epic/Legendary/Secret clearly stronger.
- Add sparse translucent ambient particles behind gameplay UI/rewards. Keep density low and movement slow.
- Add subtle idle breathing only to the active collectible visual:
  - non-carousel result: breathe from the family reveal scale;
  - Hidden Pocket carousel: breathe the inner collectible of the active page;
  - stop breathing before/while drag or page transition;
  - inactive page returns to its normal inner visual scale while the page container continues to own carousel scale/alpha.

## Guardrails

- Do not touch drop selection, SIGNAL, Hidden Pocket probability, save transaction semantics, recovery semantics, or Yandex integration.
- Do not add post-processing or a heavy particle system.
- Do not animate carousel page scale independently of `positionResultCarousel`.
- All looping tweens must be killed/reset on root recreation / scene shutdown.
- Recovered pending reveal remains deliberately calmer than a fresh reveal.

## Independent review corrections

The first draft was tightened before implementation:

- Ambient loops must be explicitly killed on root recreation/shutdown to avoid tween leaks.
- Reward breathing must target the inner collectible visual, not a carousel page container, so carousel scale interpolation remains authoritative.
- Reveal readability should come from contrast separation plus stronger FX visibility rather than particle-count inflation alone.
- Pouch correction remains a transform/layout pass; source assets are not regenerated without evidence that the art itself is unusable.

## Validation

- Typecheck, unit tests, asset self-test/validation, build.
- Regression assertions for pouch hierarchy and stronger FX ladder.
- Browser sanity screenshots for idle pouch, Common/Epic/Legendary result, Epic Phone, Hidden Pocket active/drag/other page.
- Independent diff review before merge.
