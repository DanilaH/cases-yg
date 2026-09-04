# Reveal Presentation V2

Status: active implementation scope after the second hands-on review.

## Goal

Increase reward readability and payoff without changing drop/economy/save semantics. The pass is limited to presentation, input handling around resolved reveals, pouch geometry, and regression coverage.

## User-observed problems

1. The selected reward is too small for the available center stage.
2. Hidden Pocket side items do not read strongly enough as non-selected carousel items.
3. The production pouch still looks geometrically wrong.
4. Flip Phone still does not read visually centered.
5. Tall phone art sits too close to its result information.
6. Carousel input removed the convenient large tap-to-continue target; the separate continue prompt is too small.
7. Reveal payoff is too weak; rarity should drive stronger scale, particles, glow and brightness.

## Locked implementation scope

### Collectible presentation configuration

Create one presentation source of truth for each family. It owns production-art width, visual offset, reveal scale, side-carousel scale, shelf/library scale, and result spacing. Scene files must stop accumulating independent `flip-phone ? ... : ...` scale/offset rules.

Initial families: `camera`, `flip-phone`.

Before finalizing Flip Phone offsets, measure actual alpha bounds of every production phone texture. Do not retain the existing `-24` X compensation simply because it already exists.

### Main reveal scale

Increase selected reward visual weight by roughly 20–25% versus the current presentation while preserving the title and bottom action area. Scale is based on the visible subject, not the 1024x1024 source canvas.

### Hidden Pocket carousel

The selected item is always centered. Neighboring items are visibly subordinate:

- selected: scale 1.00, alpha 1.00
- side: target scale around 0.70–0.76, alpha around 0.22–0.32

During drag, position, scale and alpha interpolate continuously. A side item should remain partially visible as a teaser. Pager dots remain.

### Unified bottom result/action panel

Replace the separate result info block and small `Tap for next pouch` prompt with one large interactive panel containing:

- family + rarity
- NEW / DUPLICATE / SIGNAL state
- continuation affordance

The whole panel is clickable/tappable.

Restore tap-anywhere convenience without breaking the carousel:

- carousel drag above threshold = page change, never continue
- small movement inside carousel = no accidental continue
- tap on bottom action panel = continue
- tap on free background after `resultReady` = continue

Gesture classification must explicitly suppress the pointer-up that terminates a carousel drag from also advancing to the next pouch.

### Portrait/tall-item spacing

Result placement must respect the visible bottom of the selected art. Use presentation metadata derived from measured alpha bounds or a deterministic family presentation value. Maintain at least roughly 28px of visual breathing room between the reward and the result panel.

### Pouch rebuild

Treat the current pouch as unresolved.

Before changing presentation constants, measure all three production files:

- texture dimensions
- alpha bbox
- alpha bbox center
- alpha coverage

Generate a diagnostic composite showing body, strip, tab, alpha bboxes, star hitbox, drag start/end and tear path.

Then choose one of two outcomes:

1. If source layers are already geometrically aligned, introduce explicit layer transforms (`body`, `strip`, `tab`, `hitbox`, `tear`) and remove the assumption that all layers share one generic transform.
2. If the runtime layers themselves are badly exported, rebuild the three runtime WebPs first rather than hiding bad source geometry behind many runtime offsets.

Pouch DoD:

- strip reads as part of the pouch upper edge
- star starts at the tear path
- hitbox follows visible star
- 50% drag visually tracks the tear line
- 100% drag cleanly separates the strip
- body does not jump or change alignment

### Reveal FX hierarchy

Create rarity-driven FX presets. Do not scatter hard-coded particle counts/timings through `OpeningScene`.

Expected hierarchy:

- Common: short pop, restrained particles
- Rare: brighter ring / more particles
- Epic: obvious radial burst
- Legendary: strong flash, glow and larger burst
- Secret: strongest burst plus secondary ring / halo

Reward animation should use a visible overshoot, approximately `0.35 -> 1.12–1.18 -> 1.00`, with rarity-dependent timing.

Use cheap Phaser primitives/tweens: colored halo, rings and particles. Do not add a heavyweight post-processing dependency for this pass.

### Recovered reveal behavior

Drop/save transaction semantics do not change. A recovered pending reveal uses a short settled presentation and must not replay the full reward spectacle or create duplicate audio/reward effects.

## Independent plan review

The implementation plan was re-evaluated separately before coding. Adjustments:

1. **Pouch diagnosis is a hard gate.** Another blind constant tweak is explicitly rejected because the prior pass technically changed geometry but did not materially improve the user's screen.
2. **Do not compute a phone pivot solely from the alpha centroid.** The left charm is intentional visible art and will bias both bbox center and centroid. Measurements are evidence; final `visualOffsetX/Y` remains a presentation decision validated by screenshots of the phone body in Opening, Shelf and Library.
3. **Do not make result-panel Y fully dynamic from Phaser object bounds.** Tween scale and container transforms make that fragile. Use measured source bounds + deterministic presentation metadata, then validate the minimum gap at target viewports.
4. **Tap-anywhere and carousel drag need one gesture policy.** Independent handlers are rejected because they recreate the accidental-skip regression. Pointer displacement / origin zone must decide the gesture exactly once.
5. **FX intensity is rarity-driven but size is layout-constrained.** Legendary/Secret must feel stronger mainly through burst/glow/ring/timing, not by scaling the object so large that portrait items collide with UI.
6. **No public-content expansion is included.** This remains an internal two-family slice presentation pass.

## Expected product files

Primary:

- `src/game/data/presentation.ts` (new)
- `src/game/ui/openingVisuals.ts`
- `src/game/scenes/OpeningScene.ts`
- `src/game/scenes/CollectionScene.ts`

Conditional, only if diagnostics prove source-layer problems:

- `public/assets/package/pouch-body.webp`
- `public/assets/package/pouch-tear-strip.webp`
- `public/assets/package/pouch-star-tab.webp`

Tests may add/update focused presentation and input regressions.

## Browser validation matrix

Viewports:

- 1728x720
- 1280x720
- 1024x720
- 900x720
- RU 1024x768
- portrait orientation gate

Required screenshots / flows:

- idle pouch
- pouch at ~50% drag
- Common reveal
- Epic Flip Phone reveal
- Legendary Camera reveal
- Hidden Pocket selected standard
- Hidden Pocket drag midpoint
- Hidden Pocket selected Secret
- tap bottom panel -> next pouch
- free-background tap -> next pouch
- Collection -> Open more -> working Opening

Debug controls must not obscure screenshots.

## Definition of Done

Do not merge the first technically green revision. Merge only after final screenshots independently confirm:

- pouch has materially improved and its layers/drag geometry agree
- Flip Phone body reads centered
- selected reward is visibly larger than the prior version
- portrait reward has breathing room above the result panel
- carousel side item is clearly smaller/dimmer than selected
- scale/alpha interpolate during drag
- large continuation target exists and free-background tap works
- swipe cannot accidentally continue
- Epic is clearly more dramatic than Common
- Legendary/Secret produce an obvious payoff spike
- no console errors or failed asset requests
- typecheck, tests, asset checks and production build are green
