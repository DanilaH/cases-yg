# Mystery Pocket Tech

Yandex Games collectible opener built around nostalgic Y2K pocket electronics.

> Open a mystery pouch → reveal a stylized retro gadget → discover rarity → improve a visible collection → repeat.

## Current phase

**Infrastructure-complete internal vertical slice; asset production is the next critical path.**

The first playable build is private and exists for direct user/developer feedback. It uses only:

- Digital Camera;
- Flip Phone;
- Common / Rare / Epic / Legendary for each;
- 2 Secrets.

This two-family slice is **not the public release**.

After hands-on sign-off, the same project moves directly into a materially larger content build. The final release may contain roughly the old ~24-family scale or more if the production pipeline supports it; exact launch count is intentionally decided after the slice establishes real per-family cost/quality.

## What is production-grade from day one

Even though content is tiny in the slice, these boundaries are implemented immediately:

- Phaser 4.2.1 + Vite + strict TypeScript;
- Yandex Games SDK;
- injected safe storage + transactional `pendingReveal`;
- adaptive Desktop/Mobile landscape layout;
- data-driven gadget registry/Collection;
- reviewed collectible/pouch/background/SFX manifests with safe procedural/synth fallbacks;
- deterministic debug scenarios for every critical reward path;
- permanent CI for typecheck/tests/production build;
- Yandex Metrica adapter;
- **Yandex ad adapter: interstitial + rewarded + sticky-banner boundary**;
- platform pause/resume/audio behavior;
- RU + EN architecture.

## Slice gameplay configuration

- one free/unlimited Mystery Pouch;
- deterministic star-tab tear;
- standard slice odds 60/28/10/2;
- Signal duplicate pity;
- Hidden Pocket 3% from opening #4 while a slice Secret remains;
- Shelf + Library;
- slice standard completion 8/8, Secrets 0/2.

These exact numbers are **slice balance only**. Release progression is re-simulated after the larger content roster is locked.

## Source of truth

- [`docs/DECISIONS.md`](docs/DECISIONS.md) — canonical stage/product/technology decisions.
- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product thesis and internal-slice → content-expansion → release staging.
- [`docs/GAMEPLAY_SYSTEMS.md`](docs/GAMEPLAY_SYSTEMS.md) — core mechanics vs slice-only balance.
- [`docs/TECHNICAL_DIRECTION.md`](docs/TECHNICAL_DIRECTION.md) — scalable content architecture, SDK/storage/analytics/ads boundaries.
- [`docs/INFRASTRUCTURE_STATUS.md`](docs/INFRASTRUCTURE_STATUS.md) — what is complete, intentionally deferred and still requires a real Yandex draft.
- [`docs/ART_DIRECTION.md`](docs/ART_DIRECTION.md) — collectible visual language.
- [`docs/ART_PRODUCTION.md`](docs/ART_PRODUCTION.md) — repeatable family production workflow.
- [`docs/ASSET_MANIFEST.md`](docs/ASSET_MANIFEST.md) — slice assets + public content-factory implications.
- [`docs/IMPLEMENTATION_ROADMAP.md`](docs/IMPLEMENTATION_ROADMAP.md) — four-stage execution plan.
- [`docs/PREIMPLEMENTATION_AUDIT.md`](docs/PREIMPLEMENTATION_AUDIT.md) — amended independent audit.
- [`docs/PROBE_VALIDATION.md`](docs/PROBE_VALIDATION.md) — private slice acceptance checklist.
- [`docs/OPEN_QUESTIONS.md`](docs/OPEN_QUESTIONS.md) — release-scale decisions intentionally deferred until after hands-on review.
- [`docs/YANDEX_SLICE_VALIDATION.md`](docs/YANDEX_SLICE_VALIDATION.md) — hosted Yandex draft checks that CI cannot replace.
- [`docs/YANDEX_SUBMISSION_CHECKLIST.md`](docs/YANDEX_SUBMISSION_CHECKLIST.md) — eventual expanded public-release moderation checklist.

## Product principle

Scale primarily through **desirable collectible content and a repeatable art pipeline**, not through feature count. The internal slice stays tiny so mistakes are cheap; the public game does not.
