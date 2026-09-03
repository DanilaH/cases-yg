# Infrastructure status

This document separates reusable game/platform infrastructure from art/content production.

## Completed in the infrastructure pass

- Phaser/Vite/strict TypeScript application shell;
- config-driven content registry and balance engine;
- transactional `pendingReveal` save/recovery;
- Signal and Hidden Pocket engine paths;
- generic Collection snapshot/rendering boundary;
- Yandex SDK bootstrap, safe storage, LoadingAPI and GameplayAPI lifecycle;
- interstitial/rewarded/sticky ad adapters with exactly-once rewarded persistence semantics;
- Yandex Metrica adapter and semantic game/ad events;
- responsive landscape layout and safe-area handling;
- RU/EN localization and persistent mute;
- permanent GitHub Actions CI (`npm ci`, typecheck, tests, deterministic asset-pipeline smoke test, production build);
- deterministic debug controls for Common/Rare/Epic/Legendary, duplicate, SIGNAL LOCK reach/consume and Hidden Pocket;
- debug collection seeding/reset and Yandex ad controls;
- focused activity/ad/reward-engine/asset-manifest tests;
- reviewed collectible-art manifest and preload boundary: approved item exports replace procedural fallbacks in Opening and Collection without scene rewrites;
- manifest-driven collectible production tooling: existing-alpha preservation, conservative deterministic cutout, opt-in local U2NetP cutout for difficult sources, transparent-canvas normalization, WebP encoding, alpha/dimension/padding validation and optional Phaser atlas generation;
- pinned U2NetP tooling model metadata with exact size/SHA-256 verification; model cache is git-ignored and never shipped with the game;
- reviewed static-art manifest for pouch body/tear strip/star tab plus Opening/Collection background layers;
- final pouch layers use a shared aligned transparent canvas, while the existing procedural pouch remains the safe fallback until each reviewed layer is enabled;
- Opening and Collection use optional cover-art backgrounds with procedural fallbacks;
- Collection supports an optional transparent foreground depth layer while game chrome stays above it;
- reviewed SFX manifest and preload/decode path: approved MP3 cues replace synthesized placeholders individually, with synth fallback on absent/failed samples.

## Intentionally deferred until real assets/content exist

These are not missing infrastructure defects:

- producing the final Camera / Flip Phone collectible exports;
- producing the three aligned Mystery Pouch layer exports;
- producing final Opening / Collection environment art;
- producing final SFX files;
- release-scale grouped/on-demand texture loading strategy — choose after profiling the real expanded catalog on mobile;
- runtime atlas adoption — the project can generate Phaser-compatible family atlases, but individual textures remain canonical until real-device profiling justifies a switch;
- release Collection grouping/pagination design — depends on actual family roster;
- release economy/package/Tech Parts decisions — depend on the expanded content matrix;
- final ad placements/reward value — infrastructure is present, product tuning follows the real loop;
- public store assets and moderation package.

Do not build speculative CMS/backend/ECS/asset-streaming architecture before those inputs exist.

## How reviewed assets enter the build

No scene/audio implementation rewrite is required when art arrives.

1. Put raw collectible generation outputs under the git-ignored `assets-src/raw/` paths declared by `assets-src/collectibles.manifest.json`.
2. Run `npm run assets:prepare`. Existing alpha is preserved; clean backgrounds use deterministic cleanup; manifest entries marked `backgroundRemoval: "ai"` use the local U2NetP path. The first AI use requires a normal `npm install` with optional dependencies and downloads only the pinned/verified model.
3. Visually QA the cutout and run `npm run assets:validate`; for a complete family use `-- --family <id> --require-all`.
4. Add reviewed collectible ids to `AVAILABLE_COLLECTIBLE_ART_IDS`.
5. Put pouch/background WebP exports at the paths declared in `src/game/data/artAssets.ts` and add their ids to `AVAILABLE_STATIC_ART_IDS`.
6. Put reviewed MP3 files under `public/assets/audio/` and add their cue ids to `AVAILABLE_SFX_CUES`.
7. Run CI. Missing/unapproved assets continue using procedural/synth fallback rather than becoming broken runtime references.

`npm run assets:model:u2netp` prefetches/verifies the local model explicitly. `npm run assets:ai:selftest` exercises the AI path. Ordinary CI does not download the model or run inference; it still uses normal `npm ci` because Sharp's own platform binaries are optional packages and must remain installable.

`npm run assets:atlas -- --family <id>` is available for packing/profiling experiments; its output is not the slice's canonical runtime asset path.

The allowlists are deliberate review gates, not a second asset system.

## External validation still required

A real Yandex Games draft is required to complete the hosted checks in `YANDEX_SLICE_VALIDATION.md`:

- actual `/sdk.js` boot;
- LoadingAPI timing;
- real `game_api_pause` / `game_api_resume` behavior;
- real ad no-fill/throttle/close paths;
- safe-storage behavior in the hosted environment;
- optional Metrica goal visibility.

CI cannot truthfully replace these platform-hosted checks.

## Definition of infrastructure-complete for the slice

Infrastructure is complete when CI is green and reviewed collectible, pouch, environment and SFX files can be enabled through their manifests/allowlists and appear in the existing game without rewriting Opening, Collection, reward logic or audio lifecycle code.

At that point the critical path is **asset production → direct hands-on review → content expansion**, not more platform scaffolding.
