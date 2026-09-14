# Asset Pipeline V2 experiment — 2026-09-14

## Status

**EXPERIMENT ONLY — NOT APPROVED FOR MERGE.**

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

### Phase 0 — baseline (must complete before pipeline implementation)

Build the untouched application output from the branch base and record, with a reproducible CI report:

- total `dist/` bytes;
- total file count;
- bytes under `dist/assets/`;
- image bytes and image file count;
- largest shipped files;
- normal Vite build output.

Only documentation and measurement instrumentation may differ from `main` during this phase; runtime code and runtime assets must remain byte-for-byte unchanged.

### Phase 1 — asset inventory / budget

Produce a machine-readable report for current runtime images containing at least:

- path;
- encoded bytes;
- width/height;
- alpha presence;
- visible alpha bounds where applicable;
- estimated uncompressed RGBA memory;
- classification (`background`, `pouch`, `collectible`, `ui`, other).

This report should identify oversized dimensions, transparent waste and the main contributors to startup/network/GPU budgets before choosing compression presets.

### Phase 2 — lossless structural wins first

Test, in order:

1. right-sizing to actual presentation needs;
2. trimming transparent excess where runtime positioning can preserve authored composition;
3. atlas/group packing where it improves request count/batching without forcing huge resident textures;
4. existing WebP fallback re-encoding only when measurable.

Do not introduce GPU compression before structural waste is measured; otherwise the experiment cannot tell which optimization produced the gain.

### Phase 3 — GPU-compressed variants

Evaluate Phaser-native compressed-texture loading using offline generated KTX variants, with WebP fallback. Candidate device classes/presets:

- mobile high support: ASTC;
- mobile fallback: ETC2;
- desktop: S3TC/BC where supported;
- fallback: WebP.

Compression quality must be selected by visual acceptance on representative pouch, alpha-heavy layer, ordinary collectible, detailed Legendary/Secret collectible and background assets.

KTX2/Basis is a separate optional investigation. Do not introduce a custom runtime transcoder into Signal 2000 unless the simpler Phaser-native KTX route fails the network-size target and the additional integration cost is justified by measured evidence.

### Phase 4 — runtime integration only if the artifact experiment wins

If generated variants materially improve the measured budget, wire the selected runtime representation into Phaser. The startup contract remains:

`startup preload -> required session textures ready -> Game Ready -> zero player-facing runtime loaders`

Do not merge an artifact-generation experiment that does not have a safe runtime-loading path and a deterministic fallback.

## Before/after comparison contract

The final report must compare the same metrics from the same CI measurement step.

At minimum:

| Metric | Baseline | Experiment | Delta |
| --- | ---: | ---: | ---: |
| `dist/` bytes | TBD | TBD | TBD |
| `dist/` file count | TBD | TBD | TBD |
| `dist/assets/` bytes | TBD | TBD | TBD |
| shipped image bytes | TBD | TBD | TBD |
| shipped image count | TBD | TBD | TBD |
| estimated resident texture memory for the tested preload set | TBD | TBD | TBD |
| cold build time (CI, directional only) | TBD | TBD | TBD |

Also record any required decoder/runtime JS/WASM overhead separately so compression is not credited with a fake win that merely moved bytes elsewhere.

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

Automated green is not sufficient for compressed-image quality. Final acceptance also requires direct visual comparison of representative assets on a real target phone/browser.