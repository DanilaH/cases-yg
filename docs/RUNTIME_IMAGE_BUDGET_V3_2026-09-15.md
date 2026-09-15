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

## Measured result

Full branch benchmark and project gate completed successfully on 2026-09-15.

Baseline: **116 WebP files / 9.39 MiB / 42.9 MP physical pixels**.

| Variant | Total bytes | Byte saving | Pixel saving | Mean RGB MAE | P95 RGB MAE | Max file RGB MAE |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `q84` | 8.58 MiB | **8.7%** | 0% | 1.865 | 2.628 | 3.038 |
| `q82` | 8.21 MiB | **12.6%** | 0% | 2.174 | 3.073 | 3.528 |
| `scale90-q88` | 7.70 MiB | 18.0% | 16.0% | 8.444 | 16.184 | 19.213 |
| `scale85-q88` | 7.20 MiB | 23.3% | 23.4% | 8.507 | 16.135 | 19.318 |

Representative baseline / q84 / q82 / scale90 / scale85 assets were archived from the same run for visual inspection. q84 and q82 remained visually very close to baseline in the sampled collectible and pouch art. The global scale candidates showed the expected extra softness at full-frame comparison.

## Independent raster-headroom review

The current textures are already much closer to their maximum real raster demand than the raw logical canvas sizes suggest. `Frame#setTrim()` preserves a larger logical canvas, but the physical cropped pixels are what must cover the visible trim region after display scaling, reveal overshoot, and DPR.

At the current max render DPR of 2, approximate source-pixel consumption at the largest authored state is already:

- default collectible at Secret overshoot: **~0.94 source pixel per output pixel**;
- camera family at Secret overshoot: **~0.97**;
- flip-phone family at Secret overshoot: **~1.09** — it is already mildly upsampled at the peak;
- Basic pouch body before perspective deformation: **~0.94**;
- pouch star tab at its pulse peak: **~0.96**.

A global 90% physical resize would therefore push several high-salience states past 1:1 sampling, and an 85% resize would be more aggressive still. The pixel saving is real, but it is not free headroom.

## Verdict

### Reject global physical downscale

Do **not** adopt `scale90-q88` or `scale85-q88` as a global production policy. The current right-size + trim pipeline is already close to the real DPR-2 presentation budget, and flip-phone reveal peaks have essentially no spare raster headroom.

A future lower-resolution variant only makes sense together with an explicit lower render-density policy or a tightly bounded class-specific asset whose maximum displayed sampling is proven lower. Do not downscale the whole catalog just to improve a synthetic byte/pixel score.

### Quality-only compression remains viable

`q84` is the conservative production candidate: approximately **0.81 MiB / 8.7%** less cold image transfer with very small measured reconstruction error and no extra runtime contract.

`q82` saves approximately **1.18 MiB / 12.6%** with only a modest increase in measured error. It is still visually plausible, but the extra gain over q84 is only about **0.37 MiB**, so it needs stronger hands-on justification before becoming the default quality floor.

Neither quality variant reduces decoded pixel count or GPU upload size. It addresses the network portion of cold start only.

## Decision rule

Prefer the lowest-complexity candidate that produces a material cold-start byte/decode/pixel reduction with no visible regression.

Current recommendation: pursue the safe critical-path/startup-overlap optimizations first, then use **q84** as the next production image candidate if cold network remains material. Keep q82 as the bounded A/B challenger rather than immediately lowering the whole portfolio default.
