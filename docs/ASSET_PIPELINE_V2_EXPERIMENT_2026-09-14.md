# Asset Pipeline V2 experiment — 2026-09-14

## Status

**EXPERIMENT ONLY — NOT APPROVED FOR MERGE.**

The artifact research is now broad enough to choose a production direction. The experiment has measured the untouched baseline, conservative runtime right-sizing, transparent trim, representative GPU-native compression, Basis/KTX2 network compression, current startup residency, and an adjacent startup-staging opportunity.

The current recommendation is intentionally narrower than the full experiment:

1. **Adopt right-sized WebP as the production baseline, pending real-phone visual acceptance.**
2. **Treat alpha trim as an optional second memory layer, not a network optimization.** Phaser 4.2.1 can preserve logical geometry with `Frame.setTrim`, so runtime integration can stay localized at texture registration.
3. **Do not adopt atlases for the current Drop texture structure.** Packing waste can materially increase resident memory.
4. **Do not adopt ASTC/ETC KTX for cold-start bandwidth.** They are materially larger than the optimized WebP path for this art.
5. **Do not adopt Basis/KTX2 yet.** ETC1S is directionally smaller than WebP, but the current game does not justify a WASM transcoder and CPU-transcode layer without stronger device evidence.
6. **Separately remove Collection-only scene art from the blocking Boot preload.** This is a zero-quality structural startup win and does not require a new image format.

The branch remains a draft because no generated candidate has yet been accepted in the actual game on the target phone/browser.

## Product/runtime constraints

- Preserve Phaser `4.2.1`, Vite and strict TypeScript.
- Do not change gameplay, reward probabilities, economy, save semantics, onboarding semantics, tear geometry, Signal, Overcharge, Hidden Pocket, collection ownership, or monetization behavior.
- Preserve authored art quality. A smaller build that materially damages pouch/collectible presentation is a failed experiment.
- Do not introduce a player-facing loader after gameplay becomes visible merely to support an optimization.
- Prefer build-time work over runtime format/transcoding complexity when the measured user benefit is similar.

## Phase 0 — untouched baseline — COMPLETE

The application was built from the branch base (`ff20397555e25bda7bffe032facd2f3c231c8f42`) before candidate image conversion was introduced.

Measured baseline:

- `dist/`: **17,814,357 B** across 134 files;
- `dist/assets/`: **17,811,512 B** across 133 files;
- shipped images: **15,874,076 B** across 116 files;
- production JS bundle: **1,629,617 B** before gzip (~426.5 KB gzip);
- tests: **243 passed**;
- typecheck, asset self-test, asset validation and production build: green.

Images account for about 89% of baseline `dist/`, so image work is material rather than micro-optimization.

## Phase 1 — runtime inventory — COMPLETE FOR THE CURRENT DECISION

The experiment records encoded bytes, dimensions, alpha presence, estimated RGBA texture bytes, classification and representative alpha bounds. The important correction is that the full-catalog RGBA number is **not startup resident VRAM**.

Current runtime behavior:

- Boot initially loads three shared scene images;
- after save resolution, only the active Drop's reviewed art is loaded into Phaser;
- other assets are network-prefetched after `Game Ready`;
- Phaser textures are not currently evicted when more Drops are visited, so resident texture memory may accumulate during a long multi-Drop session.

Therefore both budgets matter:

- **cold-start active set** for time-to-playable;
- **catalog/visited-Drop accumulation** for long-session memory pressure.

## Phase 2A — right-size + conservative WebP — COMPLETE, STRONGLY POSITIVE

Candidate dimensions:

- collectibles: max `768x768` instead of `1024x1024`;
- pouch bodies: max width `896`;
- compact pouch tear strips: max width `768`;
- pouch star tabs: max width `640`;
- backgrounds: untouched;
- WebP: quality `88`, alpha quality `100`, smart subsampling;
- committed production assets remain untouched; experiment output lives under `.asset-build/public-v2`.

These dimensions are tied to real presentation demand rather than arbitrary compression targets. With the project's DPR cap of `2`:

- largest normal collectible demand is about `684` physical px vs a `768` texture;
- pouch body demand is about `840` px vs `896`;
- tear strip demand is about `720` px vs `768`;
- star tab demand is about `572` px vs `640`.

### Measured full-build result

| Metric | Baseline | Phase 2A | Delta |
| --- | ---: | ---: | ---: |
| `dist/` bytes | 17,814,357 | 11,500,013 | **-6,314,344 (-35.45%)** |
| `dist/` file count | 134 | 134 | 0 |
| `dist/assets/` bytes | 17,811,512 | 11,497,168 | **-6,314,344** |
| shipped image bytes | 15,874,076 | 9,559,732 | **-6,314,344 (-39.78%)** |
| shipped image count | 116 | 116 | 0 |
| pixel-derived RGBA total | 443,115,456 | 260,040,704 | **-183,074,752 (-41.32%)** |

The saving is entirely image-side; application JS/CSS/font output is unchanged and no decoder/WASM runtime cost was introduced.

### Cold-start active-set result

The current blocking image set is 19 images: three shared scene layers plus 10 active-Drop collectibles and six active-Drop pouch layers.

Depending on the saved active Drop, image bytes fall approximately:

- **2.23–2.94 MB baseline → 1.45–1.85 MB Phase 2A**;
- decoded RGBA estimate: **~75.5 MB → ~49.3 MB**.

This is directly relevant to startup, but it does not by itself prove the cause of the previously observed >30 s phone load. Real startup marks/network/decode timing are still required.

### Visual QA

Before/after evidence covers an ordinary collectible, detailed Legendary, detailed Secret, neon pouch body, tear strip, star tab and unchanged background control. No obvious composition, alpha-edge or detail regression was found at target-resolution desktop inspection.

Final acceptance remains real-device acceptance in the actual game.

### Build-time cost

WebP `effort: 6` is the largest tooling cost. After bounded concurrency and removal of redundant full-catalog alpha decoding, cold conversion has measured roughly **209–240 s** across GitHub-hosted runners.

A local representative A/B indicates `effort: 4` is promising: on seven representative V2 images it was essentially the same encoded size as the effort-6 candidate (~0.06% difference on that sample) while encoding dramatically faster. This is **directional only** until a full-catalog effort-4 A/B is run.

A reusable production pipeline should also avoid rerunning image conversion for unrelated code-only commits; cache by asset/tool settings or run generation only when asset inputs change.

## Source-of-truth note

The repository already has a sensible collectible preparation path: manifest-driven raw source preparation, foreground trim/normalization and final WebP generation. Production adoption should ideally generate the new 768 runtime collectibles from raw/master sources rather than permanently doing `public WebP -> WebP` lossy-to-lossy conversion.

However `assets-src/raw/` is intentionally gitignored and not present in a normal CI checkout. The experiment therefore uses committed runtime WebPs as reproducible inputs. Final one-time collectible regeneration can happen from the archived/local masters without adding high-resolution masters to the shipped repository.

## Phase 2B — transparent trim — ARTIFACT BENCHMARK COMPLETE

Trim was tested independently with:

- alpha threshold `8`;
- **4 px transparent gutter** around visible bounds to protect filtering/perspective edges;
- collectibles, pouch bodies and pouch star tabs;
- tear strips intentionally excluded because they show effectively no transparent-bound win and participate in the interactive tear crop.

### Full-catalog result after Phase 2A

| Metric | Right-sized WebP | + alpha trim | Delta |
| --- | ---: | ---: | ---: |
| shipped image bytes | 9,559,732 | 9,452,594 | **-107,138 (-1.12%)** |
| pixel-derived RGBA total | 260,040,704 | 171,622,344 | **-88,418,360 (-34.00%)** |

By class:

| Kind | Encoded bytes before → after | RGBA bytes before → after | RGBA saving |
| --- | ---: | ---: | ---: |
| 70 collectibles | 5,625,236 → 5,559,626 | 165,150,720 → 104,426,240 | **-60,724,480** |
| 14 pouch bodies | 2,658,256 → 2,632,966 | 44,957,696 → 38,507,304 | **-6,450,392** |
| 14 star tabs | 166,794 → 150,556 | 22,937,600 → 1,694,112 | **-21,243,488 (-92.61%)** |

Interpretation: **trim is a memory optimization, not a bandwidth optimization.** Transparent WebP padding was already cheap on disk/network, but it remains expensive once represented as ordinary GPU texture pixels.

Representative outputs were reconstructed onto their original logical canvases using generated trim metadata. Geometry/alpha placement remained exact; visible RGB differences were only small repeat-WebP encode noise. A production source-based generation pass avoids that extra lossy generation.

### Runtime integration seam

Phaser 4.2.1 already provides the correct abstraction. A loaded texture frame can call:

`frame.setTrim(actualWidth, actualHeight, trimX, trimY, trimWidth, trimHeight)`

Phaser then keeps the logical source size in `frame.realWidth/realHeight`, while rendering only the trimmed raster at its recorded source offset. Existing Images initialize native width/height from those logical real dimensions.

That means the preferred integration is **one texture-registration adapter**, not custom offset/scale compensation throughout Opening/Collection UI. Existing presentation arithmetic can keep using the logical dimensions.

This substantially lowers the maintenance cost of trim, but production integration should still wait for real-device memory/startup evidence because it barely helps network bytes.

## Atlas experiment — REJECT FOR CURRENT STRUCTURE

The active Drop already consists of relatively large independent textures: 10 collectibles, two pouch bodies, two strips and two tabs.

Naive power-of-two packing is actively harmful to resident memory. The same active-Drop image set that is roughly **34.4 MB RGBA** as right-sized individual textures would require approximately four `2048x2048` pages (or one `4096x4096` page), both around **67 MB RGBA** before considering other art.

Atlas packing could reduce requests/texture binds, but startup has only 16 Drop-specific image requests and no measured texture-bind bottleneck. Do not pay approximately 2x texture-page memory merely to follow a generic game-asset convention.

Revisit atlases only if a renderer profile shows a real batching/texture-switch problem.

## Phase 3 — GPU-compressed formats — BENCHMARK COMPLETE FOR CURRENT DECISION

A six-asset representative set was encoded after Phase 2A. The ASTC harness was fixed to preserve 6x6 and 8x8 outputs separately; the corrected run is green.

| Format | Six-sample bytes | vs optimized WebP | Runtime status |
| --- | ---: | ---: | --- |
| WebP | **543,300** | baseline | native browser image |
| ASTC 6x6 KTX | 1,393,512 | **+156.5%** | Phaser-native compressed texture |
| ASTC 8x8 KTX | 781,208 | **+43.8%** | Phaser-native compressed texture |
| ETC2 RGBA KTX | 3,123,608 | **+474.9%** | Phaser-native compressed texture |
| Basis ETC1S KTX2 | 350,868 | **-35.4%** | requires transcoder; not Phaser-native |
| Basis UASTC KTX2 | 3,124,352 | **+475.1%** | requires transcoder; not Phaser-native |

Pixel/block-size estimates for the full right-sized catalog are similarly unfavorable for raw native KTX bandwidth:

- optimized WebP: **9.56 MB**;
- ASTC 6x6: ~**28.98 MB**;
- ASTC 8x8: ~**16.26 MB**;
- ETC2 RGBA: ~**65.03 MB**.

ASTC/ETC can still reduce actual GPU storage/upload work versus RGBA8, but they are not a cold-network win for this content. Adopt them only if real-device profiling identifies GPU memory/upload as the dominant problem and the WebP/trim path is insufficient.

### Basis/KTX2 verdict

ETC1S is the only tested compressed representation that beat optimized WebP network bytes on the representative set. It is not currently justified for Signal 2000 because:

- Phaser's normal compressed-texture path does not natively consume this KTX2/Basis flow;
- a browser WASM transcoder is required;
- the current official Basis runtime transcoder build is roughly 1 MB raw plus JS glue before any custom pruning;
- transcoding adds cold-start CPU work;
- the benchmark wrapper used Basis Universal 1.16.3, so the byte result is directional and must be repeated with current official Basis before any adoption decision.

With current active-Drop WebP payload already only ~1.45–1.85 MB, paying a roughly-megabyte transcoder on first load is especially unattractive. A future large-content game may cross the threshold where ETC1S/Basis makes sense; this game currently does not.

## Adjacent startup finding — Collection art should not block Opening

Current Boot preload fetches `opening-bg`, `collection-bg` and `collection-foreground` before the game routes to Opening.

The two Collection-only layers contribute:

- **222,620 B** encoded bytes;
- about **9.95 MB** decoded RGBA pixels.

They are not needed to render the first Opening frame. Moving them out of the blocking Boot preload and warming them immediately after Opening becomes usable would reduce the V2 blocking image set to roughly:

- **1.23–1.62 MB**, depending on active Drop;
- **~39.4 MB** decoded RGBA.

Compared with the actual current baseline startup image set, `right-size WebP + non-blocking Collection art` would reduce blocking image bytes by roughly **42–45%** and pixel-derived RGBA by about **48%**, with no image-quality tradeoff.

Collection currently already has procedural/background fallbacks, but production behavior should still explicitly warm these authored textures and use the existing loading-overlay semantics if the user opens Collection before warmup finishes. This is a separate runtime-staging change, not part of the asset-format experiment.

## Production recommendation from the experiment

The highest-value production candidate is deliberately simple:

`raw/master art -> presentation-budget right-size -> WebP q88 -> optional trim metadata -> committed/runtime assets`

with startup staging changed so only art required for the first visible interaction blocks `Game Ready`.

Do **not** bundle atlases, ASTC/ETC variants, KTX2/Basis, custom transcoding or texture-residency policy into the first production adoption. Those changes solve different problems and do not have enough measured value here.

Suggested production sequence:

1. run a full-catalog WebP `effort 4 vs 6` benchmark and choose the cheaper setting if byte regression remains negligible;
2. generate the right-sized runtime candidate and inspect it in the actual game on the target phone;
3. measure cold-start network/decode/ready timings against the existing production build;
4. move Collection-only scene art off the blocking Boot path and remeasure;
5. only then decide whether the additional trim layer is needed for memory/long-session stability;
6. leave GPU compression/atlas work closed unless a device profile demonstrates the corresponding bottleneck.

## Validation evidence

Latest research-code run (`CI #625`, PR #167 head before this docs-only update) completed successfully:

- typecheck: green;
- 243 tests: green;
- asset self-test: green;
- asset validation: green;
- untouched baseline build: green;
- right-sized V2 build: green;
- alpha-trim benchmark: green;
- corrected GPU benchmark: green;
- evidence artifact uploaded.

No experiment output has been merged into `main` or substituted for production runtime assets.

## Acceptance rule before any production merge

A production PR still requires:

```bash
npm ci
npm run typecheck
npm test
npm run assets:selftest
npm run assets:validate
npm run build
```

and, more importantly, direct phone acceptance of visual quality plus measured startup behavior. Green CI alone cannot prove raster quality, device memory behavior or time-to-playable.
