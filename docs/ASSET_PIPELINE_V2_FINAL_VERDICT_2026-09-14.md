# Asset Pipeline V2 — final experiment verdict (2026-09-14)

## Status

**RESEARCH COMPLETE. DO NOT MERGE THIS EXPERIMENT BRANCH INTO `main`.**

The experiment answered the production question. The winning production change is intentionally smaller than the research branch:

1. commit presentation-budget right-sized WebP runtime assets;
2. use WebP quality `88`, alpha quality `100`, smart subsampling, **effort `4`**;
3. keep only first-screen art on the blocking startup path;
4. leave alpha trim as a later memory optimization if device profiling justifies it;
5. reject atlas and raw ASTC/ETC adoption for the current game;
6. keep Basis/KTX2 and AVIF outside the first production change.

A clean production branch must be created from `main`; it should contain the generated runtime assets, the narrow startup-staging change, tests/docs and nothing from the benchmark harness that is not needed in production.

## Baseline

Untouched `main` base: `ff20397555e25bda7bffe032facd2f3c231c8f42`.

- `dist/`: `17,814,357 B`;
- shipped images: `15,874,076 B`;
- pixel-derived RGBA total from shipped image dimensions: `443,115,456 B`;
- production JS unchanged by every image-only candidate;
- project gate: 243 tests plus typecheck, asset validation and production build green.

## Winning image profile

Runtime presentation demand with the existing DPR cap of `2` supports these conservative limits:

- collectibles: `768x768` maximum;
- pouch bodies: `896 px` maximum width;
- pouch tear strips: `768 px` maximum width;
- pouch star tabs: `640 px` maximum width;
- backgrounds unchanged.

The targets retain approximately 7–12% raster headroom above the largest normal physical-pixel presentation demand in the current game.

## Right-sizing result

The effort-6 research candidate established the structural value independently of encoder-speed tuning:

- `dist/`: `17,814,357 -> 11,500,013 B` (`-35.45%`);
- shipped images: `15,874,076 -> 9,559,732 B` (`-39.78%`);
- pixel-derived RGBA: `443,115,456 -> 260,040,704 B` (`-41.32%`).

Representative visual inspection found no obvious composition, edge or detail regression. Final production acceptance still requires the actual game on the target phone/browser.

## WebP effort 4 vs 6

Full-catalog CI A/B covered all 112 optimized runtime files.

| Metric | effort 6 | effort 4 | Delta |
| --- | ---: | ---: | ---: |
| optimized image bytes | 9,102,550 | 9,404,032 | +301,482 B |
| all shipped image bytes | 9,559,732 | 9,861,214 | +301,482 B |
| cold conversion time on the measured GitHub runner | 240,045 ms | 9,644 ms | about 25x faster |

Interpretation:

- effort 4 gives up only ~301 KB relative to effort 6;
- the full build remains roughly one third smaller than baseline;
- conversion becomes cheap enough to be practical rather than a multi-minute tax.

**Production default: effort 4.** Effort 6 is not justified for this project merely to recover the final ~301 KB.

## Startup staging result

The current boot path still blocks on `opening-bg`, `collection-bg` and `collection-foreground`, although the two Collection-only layers are not needed for the first Opening frame.

After right-sizing, removing the two Collection-only layers from blocking boot is expected to bring the initial image set to approximately:

- `1.23–1.62 MB` encoded, depending on active Drop;
- about `39.4 MB` pixel-derived RGBA.

Compared with the actual current baseline startup set, the combined `right-size + Collection deferral` direction removes roughly 42–45% of blocking image bytes and about 48% of blocking raster pixels.

Correctness rule: Collection authored art must still be ensured before authored Collection rendering. Browser prefetch is an optimization, not a correctness dependency. If the user reaches Collection before warmup is complete, use the existing authored loading surface rather than exposing missing-art flicker.

## Alpha trim verdict

Full-catalog trim benchmark after right-sizing:

- shipped image bytes: `9,559,732 -> 9,452,594 B` (`-107,138 B`, only ~1.1%);
- pixel-derived RGBA: `260,040,704 -> 171,622,344 B` (`-88,418,360 B`, ~34%).

Trim is therefore a **memory/residency optimization, not a network optimization**.

Phaser 4.2.1 has the right integration seam: `Frame.setTrim(...)` preserves the original logical frame size while rendering the smaller physical raster. If trim is adopted later, integrate it once at texture registration rather than teaching every presentation call site about crop offsets.

Do not include trim in the first production PR. First measure the right-sized build on the target phone and only add trim if memory/long-session texture residency remains material.

## Atlas verdict

Reject for the current texture structure.

The active Drop consists of large independent textures. Naive power-of-two packing can push an approximately 34.4 MB right-sized Drop set toward ~67 MB of atlas pages. There is no measured texture-bind/request bottleneck that justifies this memory trade.

Reopen only with renderer-profile evidence.

## GPU-compressed format verdict

Corrected representative six-image benchmark:

| Format | Bytes | vs WebP |
| --- | ---: | ---: |
| WebP | 543,300 | baseline |
| ASTC 8x8 KTX | 781,208 | +43.8% |
| ASTC 6x6 KTX | 1,393,512 | +156.5% |
| ETC2 RGBA KTX | 3,123,608 | +474.9% |
| Basis ETC1S KTX2 | 350,868 | -35.4% |
| Basis UASTC KTX2 | 3,124,352 | +475.1% |

Raw ASTC/ETC can help GPU storage/upload, but they are poor cold-network formats for this art. Basis ETC1S is smaller, but it introduces a transcoder/WASM and cold CPU work. The current game does not justify that complexity after right-sizing.

## AVIF exploratory note

A local representative experiment found AVIF q70 materially smaller than WebP q88 (roughly 31% on the tested sample) with no obvious normal-view visual failure, but local decode work was substantially heavier. This was **not** a target-phone browser benchmark and was not promoted to the reproducible CI evidence set.

Therefore AVIF remains a future device A/B candidate, not a production default. Do not add format negotiation/fallback complexity to the first production change without real mobile startup timing.

## Source-of-truth / reusable tooling boundary

`@danilah/mini-games-kit/assets` already owns generic image preparation and validation. Signal 2000 should not grow a second generic asset framework.

Project-specific policy belongs here:

- which Signal asset class gets which runtime size;
- the accepted committed runtime outputs;
- startup residency policy;
- Signal-specific visual acceptance evidence.

Generic prepare/background-removal/validation remains in `mini-games-kit`.

The repository intentionally excludes `assets-src/raw/`. The experiment uses committed runtime WebPs as reproducible research inputs. When original masters are available, a future one-time source regeneration is preferable to repeated lossy-to-lossy transformation, but master files do not need to be shipped in the production repository.

## Production implementation contract

Create a clean branch from current `main` with only:

- final effort-4 right-sized runtime WebPs;
- Boot preload limited to first-screen shared art;
- explicit lazy/ensure path for Collection static art;
- focused regression tests for startup asset staging and Collection correctness;
- a short production decision/evidence document.

Do not change gameplay, economy, save semantics, onboarding, pouch interaction geometry, reward tables, Signal/Overcharge, Hidden Pocket or monetization.

Do not add atlas, KTX/Basis, AVIF negotiation, service worker caching or texture eviction in the same PR.

## Production acceptance

Before merge:

```bash
npm ci
npm run typecheck
npm test
npm run assets:selftest
npm run assets:validate
npm run build
```

Then deploy a cache-busted Pages candidate and compare on the real target phone:

- fresh/cold load to first usable Opening;
- fresh first-run onboarding;
- existing-save Opening on several Drops;
- immediate Collection open before background warmup is likely complete;
- Collection after warmup;
- Drop switching/reveal quality;
- 3–5 orientation cycles;
- visual inspection of ordinary, detailed Legendary/Secret and neon pouch art.

Do not call the optimization finished from CI alone. The original defect was observed on a real phone; real-phone acceptance closes it.
