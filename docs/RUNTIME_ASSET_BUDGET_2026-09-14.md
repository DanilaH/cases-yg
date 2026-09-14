# Runtime asset budget — production adoption (2026-09-14)

## Decision

Signal 2000 adopts a presentation-budget image baseline without changing gameplay or authored composition.

Production runtime budgets:

- collectibles: max `768x768`;
- pouch bodies: max width `896`;
- pouch tear strips: max width `768`;
- pouch star tabs: max width `640`;
- backgrounds remain at authored size;
- WebP quality `88`, alpha quality `100`, smart subsampling, effort `4`.

The limits cover the current maximum raster demand with the project's DPR cap of 2 while removing source resolution that the renderer never displays. Generic image preparation/validation remains owned by `@danilah/mini-games-kit/assets`; this repository owns only Signal-specific budgets, outputs and residency policy.

## Measured evidence

Untouched baseline from `ff20397555e25bda7bffe032facd2f3c231c8f42`:

- shipped images: **15,874,076 B**;
- full `dist/`: **17,814,357 B**;
- pixel-derived RGBA from shipped image dimensions: **443,115,456 B**.

Final effort-4 runtime candidate:

- 112 optimized runtime images;
- optimized subset: **15,416,894 -> 9,404,032 B**;
- all shipped images: **15,874,076 -> 9,861,214 B**;
- expected full `dist/`: about **11.80 MB**, with JS/CSS/fonts unchanged;
- pixel-derived RGBA: **443,115,456 -> 260,040,704 B**;
- measured cold conversion on GitHub runner: about **9.7 s**.

Effort 6 was only ~301 KB smaller across the catalog but took ~240 s in the measured full-catalog A/B, so effort 4 is the production default.

## Startup residency

Only `opening-bg` remains in the generic Boot static bundle. The two Collection-only scene layers are no longer allowed to block the first Opening frame.

After `Game Ready`, browser prefetch prioritizes `collection-bg` and `collection-foreground`, then warms the rest of the reviewed catalog. Prefetch is deliberately **not** a correctness dependency: `CollectionScene` ensures both authored Collection layers plus the selected Drop collectibles through the normal Phaser runtime loader before its first render. An immediate Collection open therefore uses the existing authored loading surface instead of exposing missing-art flicker.

Research estimates put the combined right-size + Collection deferral blocking image set at roughly **1.23–1.62 MB** and ~**39.4 MB** pixel-derived RGBA depending on active Drop, versus roughly **2.23–2.94 MB** and ~**75.5 MB** for the pre-optimization baseline. Real-phone timing remains the acceptance authority.

## Explicit non-goals

This production change does **not** add alpha trim, atlases, ASTC/ETC, Basis/KTX2, AVIF negotiation, service workers or texture eviction. Those solve different problems and do not have enough target-device evidence to justify extra runtime complexity here.

Alpha trim remains the only strong follow-up candidate if long-session memory profiling demands it: research showed only ~107 KB network saving but ~88.4 MB less pixel-derived RGBA across the full right-sized catalog. Phaser `Frame.setTrim()` is the preferred integration seam if that work is ever reopened.

## Acceptance

Automated merge gate:

```bash
npm ci
npm run typecheck
npm test
npm run assets:selftest
npm run assets:validate
npm run build
```

Hands-on gate on the target phone:

1. cold/fresh first-run and existing-save startup;
2. immediate Collection open before speculative warmup would normally finish;
3. Collection after warmup;
4. several Drop switches and reveals, including detailed Legendary/Secret art and neon pouch skins;
5. 3–5 portrait/landscape transitions;
6. compare time-to-playable against the previous build.

Do not call startup performance fixed from byte counts alone. The original slow-load evidence was device-side, so device-side acceptance closes the change.
