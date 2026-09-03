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
- focused activity/ad/reward-engine tests;
- reviewed-art manifest and preload boundary: final collectible art can replace procedural fallbacks by adding an approved asset id, without rewriting reveal/Collection code.

## Intentionally deferred until real assets/content exist

These are not missing infrastructure defects:

- final Camera / Flip Phone art and pouch layer exports;
- final SFX files;
- opening/Collection background art;
- release-scale grouped/on-demand texture loading strategy — choose after profiling the real expanded catalog on mobile;
- release Collection grouping/pagination design — depends on actual family roster;
- release economy/package/Tech Parts decisions — depend on the expanded content matrix;
- final ad placements/reward value — infrastructure is present, product tuning follows the real loop;
- public store assets and moderation package.

Do not build speculative CMS/backend/ECS/asset-streaming architecture before those inputs exist.

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

Infrastructure is considered complete when CI is green and a developer can add reviewed collectible files to `public/assets/collectibles`, add their ids to the reviewed-art manifest, and see those assets used in both Opening and Collection while all unreplaced items continue using safe procedural fallbacks.

From that point forward, the critical path is **art → direct hands-on review → content expansion**, not more platform scaffolding.
