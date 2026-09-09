# Independent Review — Hands-on Feel Corrections

Status: **REVIEWED / IMPLEMENTATION CONSTRAINTS LOCKED / AUDIO PASS STRUCTURALLY VALIDATED**

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

---

## Implementation and validation status — 2026-09-09

### Visual correction

The visual half was merged through PR #86 (`8a50653b7ceeb24d667c9a79c90119911b1a358b`). The implementation preserves the environment object identity across ordinary reveal → result → idle transitions, moves the broad reveal tint into the persistent environment stack, replaces the generic NEW rectangle with an 8-copy image-backed silhouette accent, and positions collection milestone toasts from transformed active collectible bounds.

The visual browser gate was run as Actions run `34317073916`, artifact digest `sha256:cab020ae63cb586bc69a9e7c8de22ba01544ad371a9542cc6642cf8fbcddab42`. It confirmed environment continuity, silhouette cleanup/bounds and safe milestone placement at both the normal and narrower viewport.

### Audio correction implementation

The second pass keeps the existing audio controller and state ownership model; it does not introduce a new audio subsystem.

Implemented correction points:

- base ambience bus reduced and the old low machine-hum layer disabled (`humGain = 0`);
- room noise is substantially quieter and high-passed to remove fan/server-room pressure;
- the base pad moves upward into a softer sine-only voicing;
- persistent Rare/Epic/Legendary/Secret tones also use a calmer sine-based family with reduced low sustained pressure;
- base result mix now ducks materially harder under rarity ownership: Rare `0.68`, Epic `0.55`, Legendary `0.43`, Secret `0.31`;
- ordinary repeated one-shots receive bounded presentation-only pitch variation for both decoded samples and synth fallback;
- CHIPS clacks use one global pitch contour across all reward legs in one banking sequence, with only small local jitter;
- `carousel-switch` is a quiet procedural cue and fires only when the resolved carousel index actually changes.

Static validation run `34318192656` passed typecheck, the full test suite, asset self-test, asset validation and production build.

Runtime browser/audio lifecycle gate `34319503347` passed with artifact digest `sha256:3a0e119bdc1027f4972db3c0c213392d38ffdf17ec27ae0d577609172ca68b79`:

- no page errors or bad local HTTP responses;
- sub-threshold carousel drag emitted zero switch cues;
- every real standard ↔ Secret page change emitted exactly one switch cue;
- persistent source count moved from 13 on the Secret page to 6 on the standard/Common page and returned to the same counts on repeated cycles, so no rarity source stacking was observed;
- collect/banking returned to the 6-source base state;
- the observed CHIPS clack contour rose from about `1096 Hz` at the start to about `1390–1400 Hz` near the end while remaining inside the bounded ceiling.

### Remaining acceptance boundary

These gates validate contracts, lifecycle ownership, source cleanup, hierarchy and the intended pitch contour. They do **not** prove subjective acoustic comfort. Final acceptance of the new timbre still requires hands-on listening on headphones and normal speakers. In particular, “cozy rather than server-room”, long-hold rarity comfort and perceived loudness balance remain ear-check items; they must not be marked final solely from automated validation.