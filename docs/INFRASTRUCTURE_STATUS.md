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
- permanent GitHub Actions CI (`npm ci`, typecheck, tests, production build);
- deterministic debug controls for Common/Rare/Epic/Legendary, duplicate, SIGNAL LOCK reach/consume and Hidden Pocket;
- debug collection seeding/reset and Yandex ad controls;
- focused activity/ad/reward-engine/asset-manifest tests;
- reviewed collectible-art manifest and preload boundary: approved item exports replace procedural fallbacks in Opening and Collection without scene rewrites;
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
- release Collection grouping/pagination design — depends on actual family roster;
- release economy/package/Tech Parts decisions — depend on the expanded content matrix;
- final ad placements/reward value — infrastructure is present, product tuning follows the real loop;
- public store assets and moderation package.

Do not build speculative CMS/backend/ECS/asset-streaming architecture before those inputs exist.

## How reviewed assets enter the build

No scene/audio implementation rewrite is required when art arrives.

1. Put collectible WebP exports under `public/assets/collectibles/` and add their collectible ids to `AVAILABLE_COLLECTIBLE_ART_IDS`.
2. Put pouch/background WebP exports at the paths declared in `src/game/data/artAssets.ts` and add their ids to `AVAILABLE_STATIC_ART_IDS`.
3. Put reviewed MP3 files under `public/assets/audio/` and add their cue ids to `AVAILABLE_SFX_CUES`.
4. Run CI. Missing/unapproved assets continue using procedural/synth fallback rather than becoming broken runtime references.

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
