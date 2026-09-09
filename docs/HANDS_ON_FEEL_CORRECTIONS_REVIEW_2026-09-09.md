# Independent Review — Hands-on Feel Corrections

Status: **REVIEWED / IMPLEMENTATION CONSTRAINTS LOCKED**

This review checks `HANDS_ON_FEEL_CORRECTIONS_2026-09-09.md` against the current code and the existing `AUDIO_AND_REWARD_FEEL_POLISH_PLAN.md` before implementation.

## Findings

### 1. The visual environment jump has a concrete root cause

The problem is not only the reveal backdrop fade. `renderResolvedResult()` currently calls `createRoot()`, and `createRoot()` clears ambient motion and destroys/recreates the entire root. That means the authored background/ambient motes/glow pools are regenerated between reveal choreography and stable result state. With presentation-randomized ambient positions this can visibly read as the room jumping.

**Implementation requirement:** separate the persistent environment layer from the foreground/chrome root, or otherwise preserve the exact same environment objects across reveal → stable result and stable result → idle transitions. Re-randomizing ambient positions at those transitions is not acceptable.

A resize may legitimately rebuild the environment for new layout metrics, but ordinary reveal/result/collect state changes must not.

The broad reveal backdrop should live inside the persistent environment stack, above base art but below ambient motes/glow pools, so it can tint the room without visually erasing the ambient life. Its broad fade should move toward ~300 ms in/out.

### 2. The new sound direction intentionally supersedes parts of the old plan

The old plan's references to transformer/CRT/electronics hum were useful as an initial hypothesis but failed hands-on. Where the documents conflict, the 2026-09-09 hands-on correction wins:

- no dominant 55/110-Hz machine-hum identity;
- no fan-like broadband bed;
- rarity states must not use low sustained pressure as their main identity;
- calm repeated-use comfort is more important than preserving the first procedural timbre.

This is a correction of implementation direction, not scope expansion.

### 3. CHIPS pitch climb must span the whole banking sequence

The initial plan wording could be read as resetting per reward leg. That would produce multiple little pitch ramps for base/cache/recycle/Overcharge/Secret and weaken the intended accumulation effect.

**Implementation requirement:** one pitch contour spans the entire collect/banking sequence from post-cost value to final CHIPS value, across all reward legs. Reset only when the next result is accepted/banking sequence begins. Individual clacks may have tiny local variation around that global contour.

### 4. Silhouette outline should use existing image-backed production art without a shader framework

Current production collectibles are image-backed. The lowest-risk implementation is duplicate tinted image copies behind the original image in its existing collectible container. This automatically follows source alpha and the actual charm/device silhouette.

- use a bounded number of copies (target 8);
- preserve original image scale/offset;
- insert copies behind the source image and above/beside the shadow as appropriate;
- fade/pulse/destroy deterministically;
- procedural fallback may use a compact local glow, never the old generic frame;
- do not add a custom shader framework for this pass.

### 5. Milestone placement must use transformed active collectible bounds

Hard-coded family coordinates would repeat the same mistake as the discovery rectangle. Resolve the active collectible's actual transformed bounds, convert world coordinates back into the logical/root coordinate system, prefer right-side placement, fall back left, and clamp above the result panel / inside safe horizontal bounds.

The toast position is sampled once at presentation time so it remains UI-stable while the collectible breathes.

### 6. Carousel switch sound must be index-change driven

Do not trigger a sound from every animated `positionResultCarousel()` call. Capture the index before gesture resolution and play the cue only when `resolveCarouselIndex()` produces a different index. This prevents clicks on taps, failed swipes and resize/re-render.

### 7. Scope remains bounded

The correction set is coherent enough to implement in two code passes:

1. visual continuity + discovery outline + contextual milestone toast;
2. calmer audio/mixing + pitch variation + CHIPS contour + carousel switch.

A combined browser/lifecycle acceptance follows. No Collection-scene animation pass, new music system, economy change or content work should be pulled in.