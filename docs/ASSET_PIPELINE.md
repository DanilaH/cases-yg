# Asset production pipeline

This pipeline turns raw generated collectible images into deterministic runtime assets without manual resize/canvas work.

## Decisions

- Canonical runtime collectible output remains an **individual transparent 1024×1024 WebP per item** for the internal slice.
- Atlas generation is available as an **optional build/inspection artifact**, but the runtime is **not switched to atlases yet**. The slice is too small to justify changing the loader, and release-scale packing/loading should be chosen after real mobile memory/profile data exists.
- `sharp` handles cutout cleanup, trim, resize, centering, WebP encoding and validation.
- `free-tex-packer-core` creates optional Phaser-compatible WebP atlases.
- Do **not** add a heavyweight ML background-removal dependency to the game/toolchain by default. Current generated collectible sources use a clean isolated subject on a smooth background, so the project uses a deterministic border-connected background remover with safety checks. If it fails on a source, provide a cleaner/already-transparent source instead of accepting a bad automatic mask.

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

Tracked runtime outputs:

```text
public/assets/collectibles/camera-common.webp
...
public/assets/collectibles/flip-phone-secret-noir.webp
```

Optional atlas output (git-ignored, not shipped):

```text
.asset-build/atlases/<family>/
```

High-resolution generation sources are deliberately not committed automatically. The repo keeps accepted runtime exports plus prompt/revision documentation; raw masters can be archived separately if needed.

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

Run the tooling smoke test:

```bash
npm run assets:selftest
```

## Processing contract

For each manifest entry the prepare step:

1. reads the raw source;
2. preserves an existing meaningful alpha channel if one is already present;
3. otherwise removes only smooth border-connected background pixels;
4. fails if the resulting foreground ratio is implausible instead of silently writing a broken cutout;
5. trims transparent excess;
6. scales the collectible proportionally inside the configured safe area;
7. centers it on a transparent square canvas, with optional per-item visual offsets in the manifest;
8. exports WebP with alpha;
9. writes to the exact runtime path declared in the manifest.

Default slice output:

```text
canvas: 1024×1024
safe padding: 64 px
WebP quality: 90
alpha quality: 100
```

Per-item overrides can be added under an entry's `options` object, for example:

```json
{
  "id": "example",
  "options": {
    "offsetX": -12,
    "offsetY": 8,
    "backgroundStepTolerance": 16
  }
}
```

Use offsets only for optical alignment; do not use them to compensate for a bad crop/source.

## Validation contract

`assets:validate` checks:

- WebP format;
- exact configured canvas size;
- meaningful transparency;
- non-empty visible foreground;
- safe transparent margin around the item;
- encoded size, with >500 KB treated as a warning by default.

Use `--strict-size` only when intentionally enforcing the soft size target. Visible quality wins over shaving a few KB from an otherwise good collectible.

## Background-removal limitations

The built-in remover is intentionally conservative. It is designed for the current generation style: one isolated gadget, clear silhouette, smooth light background, no object touching the image boundary.

Reject or manually fix a cutout if any of these occur:

- halo around the silhouette;
- charm/strap/antenna disappears;
- light-colored body panels develop holes;
- object touches the source boundary;
- foreground/background are highly textured or similarly colored.

For such a file, make an already-transparent cutout first and rerun the same normalization/export pipeline. Do not tune global thresholds around one pathological source and risk the rest of the catalog.

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

Permanent CI runs `assets:selftest`. This verifies that image normalization/background removal, WebP output, validation and atlas generation still work after dependency/tooling changes without requiring real art files in CI.

Real committed collectible outputs are additionally checked by `npm run assets:validate`; missing not-yet-produced slice assets are warnings until a family is explicitly validated with `--require-all`.
