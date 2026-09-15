# Signal 2000 — tight alpha trim experiment

Date: 2026-09-15
Base: `main` at `85379257a90761b45723ec54f39462a4b1cb0ec7`

## Goal

Reduce decoded/GPU image footprint after the zero-runtime-loading change without changing any authored scene coordinates, visual scale, origin, gameplay semantics, or loading policy.

## Scope

Trim only alpha-heavy runtime textures with high expected return:

- every reviewed collectible;
- Basic/Charged pouch body layers for every Drop;
- Basic/Charged pouch star-tab layers for every Drop.

Do not trim in this pass:

- tear strips — the live tear effect uses texture cropping and prior measurement showed little memory return;
- authored backgrounds / Collection foreground — different cover/compositing semantics and lower need;
- audio, fonts or JS.

## Geometry contract

A physically cropped file must remain logically identical to the previous full transparent canvas.

For each trimmed texture record:

- `logicalWidth` / `logicalHeight`: original full-canvas dimensions;
- `x` / `y`: crop position in that original canvas;
- `width` / `height`: physical cropped texture dimensions.

The crop includes a 4px gutter around alpha bounds to protect bilinear filtering and edge feathering.

Immediately after Boot preload completes, before any gameplay Scene creates Images, apply:

`frame.setTrim(logicalWidth, logicalHeight, x, y, width, height)`

Phaser 4.2.1 treats `sourceSize` as the frame's real/logical size. `Image`, display sizing, default input bounds and rendering therefore continue to use the original logical dimensions/origin while only the cropped source pixels remain resident.

No scene-level offset compensation is allowed in this pass. If the stock Phaser trim path cannot preserve geometry, reject the experiment instead of spreading manual corrections through presentation code.

## Encoding / quality policy

The repository does not currently contain every master source image needed to regenerate the whole runtime catalog from lossless originals in CI. The experiment therefore crops current reviewed WebP outputs and re-encodes at the existing runtime preset (`quality 88`, `alphaQuality 100`, `effort 4`).

Before acceptance the generator reconstructs each cropped candidate onto its original logical canvas and compares it with the current reviewed runtime image. A candidate fails if geometry shifts or the visible-pixel error exceeds the bounded QA threshold.

This is an experiment. If second-generation WebP quality is visible on target phones, keep the metadata/runtime seam but regenerate affected outputs from master sources before production merge.

## Independent plan review

1. **Do not use an atlas merely to obtain trim metadata.** Current large texture sizes make atlas packing wasteful and the project does not need the draw-call optimization enough to pay that memory cost.
2. **Do not trim tear strips.** Their interactive crop path makes them a higher-risk, low-return target.
3. **Do not manually move Images.** Phaser already has first-class trimmed-frame semantics; scene-specific offsets would create maintenance debt and make future art replacement fragile.
4. **Do not mix runtime loading back in.** All cropped files remain part of the complete startup preload introduced by the zero-runtime-loading contract.
5. **Do not claim network savings as the goal.** Transparent pixels already compress well in WebP. The expected win is decoded/GPU footprint, not necessarily shipped bytes.

## Acceptance

Automated:

- generated trim records are unique and correspond only to reviewed runtime art;
- every crop remains inside its original logical canvas;
- every physical file dimensions match its trim metadata;
- reconstructed candidates preserve alpha placement and remain inside the visual-difference threshold;
- trim metadata is applied before Boot hands off to FirstRun/Opening;
- no presentation scene contains manual trim offsets;
- zero-runtime-loading tests remain green;
- full typecheck/tests/assets/build gate passes.

Measured:

- report before/after shipped bytes for trimmed files;
- report before/after physical RGBA pixel footprint;
- keep the change only if memory reduction is material.

Hands-on:

- pouch bodies/tabs occupy exactly the same visual positions and scale;
- collectible reveal, result carousel, shelf and library positions are unchanged;
- pointer perspective/origin behavior is unchanged;
- tear interaction remains unchanged;
- no in-game loader returns;
- orientation/resize remains stable.
