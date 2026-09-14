# Asset Pipeline V2 experiment — 2026-09-14

## Status

**EXPERIMENT ONLY — NOT APPROVED FOR MERGE.**

Phase 0 baseline and the first Phase 2A candidate are complete. The first measured candidate is strongly positive on bytes/pixel footprint, but it is not yet a production decision: real-device visual acceptance and the remaining pipeline choices still matter.

This branch tests whether a more game-oriented image pipeline can materially reduce shipped texture/build size without visible quality regressions, runtime loading surfaces, gameplay changes, or fragile browser-specific behavior.

The production decision is evidence-driven: keep the experiment only if the before/after measurements justify its complexity.

## Product/runtime constraints

- Preserve Phaser `4.2.1`, Vite and strict TypeScript.
- Do not change gameplay, reward probabilities, economy, save semantics, onboarding semantics, tear geometry, Signal, Overcharge, Hidden Pocket, collection ownership, or monetization behavior.
- The desired end-state remains: one startup preload is allowed; once gameplay is visible, player-facing runtime loaders are not acceptable.
- Do not use visual placeholders as a normal slow-network state.
- Preserve authored art quality. A smaller build that materially damages pouch/collectible presentation is a failed experiment.
- Keep a normal image fallback path for devices/browser combinations that cannot use a selected GPU-compressed format.

## Why this experiment exists

The current runtime assets are predominantly individual WebP files. WebP reduces network/disk size, but it does not by itself solve:

1. excessive source/runtime resolution;
2. transparent padding and unused pixels;
3. request/texture count;
4. renderer texture switching and batching pressure;
5. decoded/GPU memory pressure;
6. GPU-native compression.

The existing tooling already contains useful building blocks (`sharp`, manifest-driven preparation, validation, optional atlas generation). V2 should extend those seams rather than replace the whole asset-production system.

## Experiment phases

### Phase 0 — baseline — COMPLETE

The untouched application output from the branch base (`ff20397555e25bda7bffe032facd2f3c231c8f42`) was built before any candidate image conversion was introduced.

Measured baseline:

- `dist/`: **17,814,357 B** across 134 files;
- `dist/assets/`: **17,811,512 B** across 133 files;
- shipped images: **15,874,076 B** across 116 files;
- production JS bundle: **1,629,617 B** before gzip;
- tests: **243 passed**;
- typecheck, asset self-test, asset validation and production build: green.

Images account for about 89% of the baseline `dist/`, so image work is a material optimization target rather than micro-optimization.

### Phase 1 — asset inventory / budget — PARTIAL, AUTOMATED

The candidate generator emits a machine-readable report containing:

- path and classification;
- encoded bytes before/after;
- width/height before/after;
- alpha presence;
- estimated RGBA bytes from pixel dimensions;
- per-file savings;
- representative pixel-level alpha QA for selected samples.

A full second alpha decode of every output was intentionally removed from the reusable build path after the first run showed it was pure reporting cost. Pixel-level alpha inspection remains on representative QA samples.

### Phase 2A — right-size + conservative WebP candidate — COMPLETE

The first candidate deliberately does **not** add atlases, KTX, a runtime decoder or any runtime code. It tests the cheapest structural win independently.

Candidate profiles:

- collectibles: max `768x768` instead of `1024x1024`;
- pouch bodies: max width `896`;
- compact pouch tear strips: max width `768`;
- pouch star tabs: max width `640`;
- backgrounds: untouched;
- WebP: quality `88`, alpha quality `100`, effort `6`, smart subsampling;
- committed production assets remain untouched; candidate output is generated under `.asset-build/public-v2` and fed to an isolated Vite config.

Why 768 is intentionally conservative for collectibles: current presentation sizes plus the project's render-density cap put the largest normal collectible presentation at roughly the same physical-pixel order on target high-DPI output. This is still subject to real-device acceptance, not assumed correct merely from arithmetic.

#### Measured result

| Metric | Baseline | Phase 2A candidate | Delta |
| --- | ---: | ---: | ---: |
| `dist/` bytes | 17,814,357 | 11,500,013 | **-6,314,344 (-35.45%)** |
| `dist/` file count | 134 | 134 | 0 |
| `dist/assets/` bytes | 17,811,512 | 11,497,168 | **-6,314,344** |
| shipped image bytes | 15,874,076 | 9,559,732 | **-6,314,344 (-39.78%)** |
| shipped image count | 116 | 116 | 0 |
| estimated raw RGBA bytes from shipped-image dimensions | 443,115,456 | 260,040,704 | **-183,074,752 (-41.32%)** |
| Vite production build after conversion | ~0.7 s | ~0.7 s | effectively unchanged |
| cold asset conversion on GitHub-hosted runner | n/a | **239,555 ms (~4 min)** | new build-time cost |

The initial sequential implementation required roughly 8 minutes for the candidate step. Bounded conversion concurrency plus removal of redundant catalog-wide alpha decoding reduced the same conversion to roughly 4 minutes while producing the same measured candidate bytes.

The 6.31 MB `dist/` saving is entirely image saving: JS/CSS/font output is unchanged. No decoder/runtime JS/WASM cost has been introduced in Phase 2A.

#### Representative QA

CI exports before/after pairs for:

- ordinary collectible (`camera-common`);
- detailed Legendary (`crt-tv-legendary`);
- detailed Secret (`handheld-console-secret-phone`);
- alpha-heavy pouch body;
- compact tear strip;
- star tab;
- unchanged opening background control.

A direct same-target-resolution desktop inspection found no obvious composition, alpha-edge or detail regression in these representative samples. This is **provisional**: the candidate is not accepted until inspected in the actual game on a target phone/browser, especially the high-detail collectibles and neon pouch art.

### Phase 2B — trim / atlas — NOT STARTED

Still to evaluate independently:

1. transparent trim where runtime positioning can preserve authored composition;
2. atlas/group packing where it improves request count/batching without forcing huge always-resident textures.

Do not mix these into the Phase 2A result: the current `-35.45% dist` result was achieved without atlases, so later changes must prove their own value.

### Phase 3 — GPU-compressed variants — NOT STARTED

Evaluate Phaser-native compressed-texture loading using offline generated KTX variants, with WebP fallback. Candidate device classes/presets:

- mobile high support: ASTC;
- mobile fallback: ETC2;
- desktop: S3TC/BC where supported;
- fallback: WebP.

Compression quality must be selected by visual acceptance on representative pouch, alpha-heavy layer, ordinary collectible, detailed Legendary/Secret collectible and background assets.

KTX2/Basis is a separate optional investigation. Do not introduce a custom runtime transcoder into Signal 2000 unless the simpler Phaser-native KTX route fails the network-size target and the additional integration cost is justified by measured evidence.

Important: total repository/`dist` bytes are not sufficient to judge multi-format GPU variants, because a build can contain several device-specific variants while a client downloads only the supported one. Phase 3 must report both total shipped artifact bytes and **per-device request-path bytes**, plus estimated resident GPU memory.

### Phase 4 — runtime integration only if the artifact experiment wins

If generated variants materially improve the measured budget, wire the selected runtime representation into Phaser. The startup contract remains:

`startup preload -> required session textures ready -> Game Ready -> zero player-facing runtime loaders`

Do not merge an artifact-generation experiment that does not have a safe runtime-loading path and a deterministic fallback.

## Current verdict

**Phase 2A is worth continuing. It is not yet approved for production merge.**

Reasons to continue:

- `dist/` fell by 35.45% with no runtime dependency or decoder overhead;
- shipped image bytes fell by 39.78%;
- pixel-derived raw RGBA estimate fell by 41.32%, materially improving the feasibility of an all-session preload;
- representative QA currently shows no obvious regression;
- normal application code and gameplay semantics are untouched.

Open concerns before production adoption:

- real-phone visual acceptance is still required;
- generated-asset cold build time is about four minutes at WebP effort 6 and should not blindly run on every unrelated CI change in a future reusable pipeline;
- this phase still uses ordinary WebP, so the browser/GPU ultimately sees decoded textures rather than ASTC/ETC/BC-native blocks;
- request count is unchanged because atlas work has not started;
- startup time itself has not yet been measured with a full-session preload.

The next technical experiment should therefore be chosen for a distinct benefit: atlas/trim for request/batching pressure or Phaser-native GPU compression for resident memory. Do not re-optimize WebP simply to chase another small file-size percentage.

## Acceptance / reject rule

Do not merge V2 merely because one format is technically interesting.

Prefer merge only when all of the following are true:

- material shipped-size reduction or material GPU-memory reduction is demonstrated;
- no player-facing runtime loader is required after gameplay becomes visible;
- fallback remains deterministic;
- visual quality is accepted on real representative art;
- mobile compatibility risk is bounded;
- build/tooling complexity is reasonable enough to reuse in later Phaser projects;
- full project gate remains green.

Reject or reduce scope if the measured savings are marginal, visual quality degrades, startup becomes CPU/decode-bound, or maintenance/runtime complexity outweighs the gain.

## Validation gate

Before any merge candidate:

```bash
npm ci
npm run typecheck
npm test
npm run assets:selftest
npm run assets:validate
npm run build
```

The experiment CI additionally builds and measures the isolated V2 candidate. Automated green is not sufficient for image quality. Final acceptance also requires direct visual comparison of representative assets on a real target phone/browser.