# Runtime Image Budget V3 — experiment

Date: 2026-09-15
Branch: `experiment/runtime-image-budget-v3`

## Why this exists

Signal 2000 now has a hard product contract: one startup loader, then zero runtime image loading. The complete reviewed session image set is Phaser-ready before `Game Ready`.

That removes in-game loader UX, but makes cold-start cost sensitive to every runtime texture byte, decode, and upload. The previous passes already established:

- right-sized WebP materially reduced network/build size;
- alpha trim materially reduced physical RGBA pixels without moving logical geometry;
- further optimization must not trade visible sharpness for a misleading byte win.

## Experiment questions

1. Is current WebP quality 88 leaving a safe network win at quality 84 or 82?
2. Do current trimmed physical dimensions still have enough raster headroom for a 90% or 85% physical downscale?
3. Which classes actually have headroom? Do not assume all collectibles/pouch layers should use one scale.
4. Does any candidate save enough cold-start work to justify a production migration?

## Guardrails

- No runtime loader, progressive image replacement, shimmer, placeholder, or post-Ready network dependency.
- No gameplay/save/economy/RNG changes.
- Logical geometry stays unchanged. A future accepted physical downscale must preserve the existing logical frame and trim destination dimensions.
- This branch is measurement-first. Candidate files are generated under `.asset-build/` only until a variant proves worthwhile.
- Do not merge lossy-to-lossy experiment outputs as production assets. If a variant is accepted, regenerate from the highest-quality available asset source / canonical prepare path where possible.

## Candidates

Baseline: current shipped WebP.

- `q84`: same physical dimensions, WebP quality 84.
- `q82`: same physical dimensions, WebP quality 82.
- `scale90-q88`: alpha-heavy runtime textures at 90% physical dimensions, quality 88.
- `scale85-q88`: alpha-heavy runtime textures at 85% physical dimensions, quality 88.

The scale candidates are evaluated by resizing the candidate back to the current physical frame for pixel comparison. This is a conservative offline proxy; real-phone visual acceptance remains mandatory before production adoption.

## Decision rule

Prefer the lowest-complexity candidate that produces a material cold-start byte/decode/pixel reduction with no visible regression.

Reject a physical downscale globally if the evidence shows some asset families are already near 1:1 sampling. In that case use class/family-specific budgets or keep current dimensions.

A small byte win alone is not enough to justify a new runtime scaling contract.
