# Asset production pipeline

This pipeline turns raw generated collectible images into consistent runtime assets without manual resize/canvas work.

## Decisions

- Canonical runtime collectible output remains an **individual transparent 1024×1024 WebP per item** for the internal slice.
- Source image dimensions may vary; manual pre-resizing is not required before ingestion.
- The pipeline preserves aspect ratio, trims transparent excess, fits the complete collectible inside a **64 px safe margin on every side** and normalizes it onto the 1024×1024 canvas.
- Family variants must retain comparable perceived scale and the same camera angle; source-canvas differences must not make one rarity appear arbitrarily larger or smaller.
- Atlas generation is available as an **optional build/inspection artifact**, but the runtime is **not switched to atlases yet**. Release-scale packing/loading is chosen after real mobile profiling.
- `sharp` handles trim, resize, centering, WebP encoding, deterministic background cleanup and validation.
- `free-tex-packer-core` creates optional Phaser-compatible WebP atlases.
- Background removal uses a **hybrid two-tier pipeline**: cheap deterministic cleanup first for clean generated backgrounds, with an opt-in/local U2NetP fallback for difficult sources.
- The AI runtime is tooling-only. It is an optional dependency and is not bundled into the game.

## Source/output layout

Tracked manifest:

```text
assets-src/collectibles.manifest.json
```

Local raw inputs (git-ignored):

```text
assets-src/raw/camera/common.png
...
assets-src/raw/flip-phone/secret-noir.png
```

Raw source filenames are semantic. Do not preserve ChatGPT/export timestamps as production IDs. The source file for each manifest entry is renamed/mapped to its semantic slot before processing.

Tracked runtime outputs:

```text
public/assets/collectibles/camera-common.webp
...
public/assets/collectibles/flip-phone-secret-noir.webp
```

Runtime naming is locked to lowercase kebab-case:

```text
<family>-common.webp
<family>-rare.webp
<family>-epic.webp
<family>-legendary.webp
<family>-secret-<edition>.webp
```

For the accepted Flip Phone family:

```text
flip-phone-common.webp
flip-phone-rare.webp
flip-phone-epic.webp
flip-phone-legendary.webp
flip-phone-secret-noir.webp
```

Local model cache (git-ignored, never shipped):

```text
.asset-models/u2netp.onnx
```

Optional atlas output (git-ignored, not shipped):

```text
.asset-build/atlases/<family>/
```

High-resolution generation sources are deliberately not committed automatically. The repo keeps accepted runtime exports plus prompt/revision documentation; raw masters can be archived separately if needed.

## Accepted source contract

Preferred production input:

- PNG or WebP;
- meaningful alpha/transparency already present when available;
- full collectible visible, including charm/strap/antenna/accessories;
- no clipped extremities;
- no baked glow or reveal FX;
- source dimensions may differ between files;
- do **not** manually stretch or square the source just to satisfy the runtime target.

A source such as 1024×1536, 1236×1273 or 1224×1285 is valid input. The pipeline owns normalization to the runtime square.

If a source has no useful alpha, background removal may be attempted according to its manifest mode. An already-transparent source is preferred because it removes segmentation ambiguity from the production path.

## Commands

Prepare every raw source that currently exists:

```bash
npm run assets:prepare
```

Prepare one family:

```bash
npm run assets:prepare -- --family flip-phone
```

Prepare one exact item:

```bash
npm run assets:prepare -- --id flip-phone-secret-noir
```

Require all selected raw files to exist:

```bash
npm run assets:prepare -- --family flip-phone --require-all
```

Prefetch/verify the optional U2NetP model:

```bash
npm run assets:model:u2netp
```

Run the normal deterministic tooling smoke test:

```bash
npm run assets:selftest
```

Run the opt-in AI runtime/inference smoke test:

```bash
npm run assets:model:u2netp
npm run assets:ai:selftest
```

Validate committed/generated runtime outputs:

```bash
npm run assets:validate
```

Require the selected family to be complete:

```bash
npm run assets:validate -- --family flip-phone --require-all
```

Build optional Phaser atlas artifacts from prepared files:

```bash
npm run assets:atlas -- --family flip-phone
```

## Processing contract

For each manifest entry the prepare step:

1. reads the raw source at its native dimensions;
2. preserves an existing meaningful alpha channel if one is already present;
3. otherwise applies the configured background-removal mode;
4. trims transparent excess around the complete collectible;
5. scales the collectible **proportionally** to fit inside the locked 896×896 maximum content box (1024 canvas minus 64 px safe margin on each side);
6. centers it geometrically on the transparent square canvas;
7. applies only small per-item `offsetX` / `offsetY` corrections when visual/optical centering requires them;
8. exports WebP with alpha;
9. validates the candidate before replacing any reviewed runtime output;
10. writes to the exact runtime path declared in the manifest only after validation succeeds.

Default slice output:

```text
canvas: 1024×1024
safe padding: 64 px on every side
maximum fitted content box: 896×896
WebP quality: 90
alpha quality: 100
non-uniform stretch: forbidden
```

### Framing acceptance rule

For all variants of one family:

- same canonical camera angle;
- comparable perceived object scale;
- complete silhouette/accessories inside safe area;
- no rarity should look larger/smaller simply because its original source canvas had different dimensions;
- geometric centering is the default;
- optical offsets are corrections, not a second layout system.

If normalization produces visibly inconsistent family scale, correct the manifest offset/source crop or source art and rerun; do not hand-edit the final runtime WebP as a one-off exception.

## Background-removal modes

Manifest `backgroundRemoval` accepts:

- `auto` — deterministic remover first; if its safety checks reject the result, retry with U2NetP;
- `deterministic` — corner-model/border-connected cleanup only;
- `ai` — U2NetP directly; use only after visual QA shows that deterministic cleanup is not good enough;
- `preserve` — do not cut the background; mainly useful for diagnostics or already-specialized source workflows.

An already-transparent source is always preserved rather than unnecessarily re-segmented.

`auto` deliberately does **not** pretend it can detect every aesthetically bad halo. A deterministic mask may be structurally valid while still retaining a subtle warm shadow. When real-art visual QA catches that case, change only that manifest entry to `backgroundRemoval: "ai"`, rerun the pipeline and inspect the result. If the AI mask damages the object, use an already-transparent cutout instead. Do not weaken global thresholds around one difficult source.

Per-item overrides live under `options`, for example:

```json
{
  "id": "example",
  "options": {
    "backgroundRemoval": "ai",
    "offsetX": -12,
    "offsetY": 8,
    "aiMaskLow": 0.02,
    "aiMaskHigh": 0.98
  }
}
```

For deterministic sources, `backgroundColorTolerance` can be overridden per item. Lower it if a pale collectible edge is being removed; raise it cautiously if a genuinely smooth background remains.

## AI implementation and model provenance

The optional AI path uses `onnxruntime-node` only as a local inference runtime. No image is uploaded to a background-removal API.

The model is U2NetP at 320×320. The downloader verifies both exact byte size and SHA-256 before accepting it:

```text
file: u2netp.onnx
size: 4,574,861 bytes
sha256: 309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8
```

Pinned source/mirror:

```text
https://huggingface.co/edgetools/u2netp
```

The model card identifies the artifact as the U²-Net portable weights, marks it Apache-2.0, records the same SHA-256, and links the Apache-2.0 upstream U²-Net project. `onnxruntime-node` is MIT-licensed. The model file stays in `.asset-models/` and is excluded from Git and from the shipped game.

This provenance is an engineering dependency gate, not legal advice. Do not silently swap the model URL/weights for BRIA RMBG or another model with different commercial terms.

## Validation contract

`assets:validate` checks:

- WebP format;
- exact configured canvas size;
- meaningful transparency;
- non-empty visible foreground;
- safe transparent margin around the item;
- encoded size, with >500 KB treated as a warning by default.

Use `--strict-size` only when intentionally enforcing the soft size target. Visible quality wins over shaving a few KB from an otherwise good collectible.

Automated alpha validation does **not** replace visual inspection. Before accepting an item, still check:

- no warm/bright halo;
- charm/strap/antenna intact;
- no holes in pale/translucent body panels;
- no clipped extremities;
- scale/optical centering matches the rest of the family.

## Atlas policy

The atlas command uses trimming, small padding/extrusion, no rotation and the Phaser exporter. Its job right now is to answer practical questions such as atlas dimensions and packed weight.

Do **not** replace the current individual-texture runtime path merely because an atlas can be generated. Before a public catalog switch, compare on real mobile hardware:

- startup/network cost;
- decoded GPU memory;
- maximum texture dimensions;
- Collection loading behavior;
- whether family/group atlases improve or worsen residency.

For a larger release, family/group atlases or on-demand individual textures are both valid outcomes. Profiling decides.

## CI

Permanent CI uses normal `npm ci`. Do **not** globally omit optional dependencies: `sharp` itself relies on platform-specific optional packages, so `npm ci --omit=optional` can break the deterministic image tooling we are trying to verify.

Ordinary CI executes `assets:selftest` but does not download the U2NetP model or run inference. This covers deterministic cutout, normalization, WebP validation and atlas generation while keeping network/model work out of every run. `onnxruntime-node` remains tooling-only and is never imported by the game bundle.

The AI path has a separate opt-in `assets:ai:selftest`. That smoke test verifies the pinned model can be downloaded, loaded and executed and that it produces a structurally plausible alpha result. It deliberately does **not** certify semantic cutout quality on every art style; accepted production assets still pass visual QA.

Real committed collectible outputs are additionally checked by `npm run assets:validate`; missing not-yet-produced slice assets are warnings until a family is explicitly validated with `--require-all`.
