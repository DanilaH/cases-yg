# Mystery Pocket Tech

Yandex Games collectible opener built around nostalgic Y2K pocket electronics.

> Open a mystery pouch → reveal a stylized retro gadget → discover rarity → improve a visible collection → repeat.

## Current phase

**The two-family opener/presentation baseline is stable. Next: Gameplay Loop Lite V2.**

Current private content:

- Digital Camera;
- Flip Phone;
- Common / Rare / Epic / Legendary for each;
- 2 Secrets.

This build is **not the public release**.

The agreed next loop is deliberately small:

> **Basic Pouch → collectible + CHIPS → duplicate recycle + SIGNAL → Charged Pouch → better roll → repeat.**

Lite V2 adds:

- one global CHIPS wallet;
- CHIPS reward on every Basic opening;
- automatic duplicate recycle → CHIPS + Signal;
- simplified Signal pity: one segment per duplicate, target `4/4` → next standard collectible NEW;
- one Charged Pouch tier bought with CHIPS;
- Drop/loot-pool-aware reward data so future content does not become one giant global pool.

It explicitly does **not** add timers, offline income, passive production, Overcharge, Archive levels, shop scene, multi-standard drops, prestige or other full incremental systems.

After Lite V2 implementation: exact-revision visual audit + direct hands-on → real Yandex DRAFT validation → content expansion.

## Production-grade boundaries already present

- Phaser 4.2.1 + Vite + strict TypeScript;
- Yandex Games SDK adapter;
- injected safe storage + transactional `pendingReveal`;
- adaptive Desktop/Mobile landscape layout;
- data-driven gadget registry/Collection;
- integrated Camera/Flip Phone collectible art;
- integrated production pouch/background/SFX assets;
- manifest-driven collectible preprocessing;
- deterministic debug scenarios;
- permanent CI;
- Yandex Metrica adapter;
- Yandex ad adapter: interstitial + rewarded + sticky-banner boundary;
- platform pause/resume/audio behavior;
- RU + EN architecture;
- exact-revision browser screenshot/video visual-QA workflow.

## Asset commands

```bash
npm run assets:prepare
npm run assets:validate
npm run assets:atlas -- --family flip-phone
npm run assets:selftest

# Optional local AI cutout path for difficult sources
npm run assets:model:u2netp
npm run assets:ai:selftest
```

Raw generated collectible files go under git-ignored `assets-src/raw/`. Accepted runtime collectibles remain individual transparent 1024×1024 WebPs in `public/assets/collectibles/`.

## Current runtime vs next target

Current `main` still contains the old slice Signal implementation (`0..100` with rarity-dependent duplicate gains). Lite V2 documentation intentionally records the agreed **next target** (`0..4`, +1 per duplicate) without pretending that migration is already implemented.

The current Basic rarity profile starts from slice odds 60/28/10/2. Charged cost/payout/rarity/Hidden Pocket values are still tuning inputs and must not be silently invented in scene code.

## Source of truth

Canonical current docs:

- [`docs/DECISIONS.md`](docs/DECISIONS.md) — canonical current decisions and implementation target.
- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product thesis, Lite V2 scope and staging.
- [`docs/GAMEPLAY_SYSTEMS.md`](docs/GAMEPLAY_SYSTEMS.md) — detailed Lite V2 mechanics and transaction semantics.
- [`docs/TECHNICAL_DIRECTION.md`](docs/TECHNICAL_DIRECTION.md) — Drop-aware architecture, save migration and atomic economy requirements.
- [`docs/IMPLEMENTATION_ROADMAP.md`](docs/IMPLEMENTATION_ROADMAP.md) — execution order from Lite V2 through release.
- [`docs/ASSET_MANIFEST.md`](docs/ASSET_MANIFEST.md) — actual integrated asset state + minimal Lite V2 asset additions.
- [`docs/OPEN_QUESTIONS.md`](docs/OPEN_QUESTIONS.md) — only unresolved decisions/tuning points.
- [`docs/INFRASTRUCTURE_STATUS.md`](docs/INFRASTRUCTURE_STATUS.md) — current infrastructure/runtime status.
- [`docs/YANDEX_SLICE_VALIDATION.md`](docs/YANDEX_SLICE_VALIDATION.md) — real hosted Yandex checks that CI cannot replace.
- [`docs/ART_DIRECTION.md`](docs/ART_DIRECTION.md), [`docs/ART_PRODUCTION.md`](docs/ART_PRODUCTION.md), [`docs/ASSET_PIPELINE.md`](docs/ASSET_PIPELINE.md) — art/content production rules.
- [`docs/YANDEX_SUBMISSION_CHECKLIST.md`](docs/YANDEX_SUBMISSION_CHECKLIST.md) — eventual public-release moderation checklist.

Historical/audit notes such as `PREIMPLEMENTATION_AUDIT.md`, `REVEAL_PRESENTATION_V2.md` and `HANDS_ON_V2_CORRECTION_PASS.md` document earlier passes but are **not current product specifications** when they conflict with the canonical docs above.

## Product principle

Scale primarily through desirable collectible content and a repeatable art pipeline, while keeping the gameplay loop compact.

> **First prove that Basic → CHIPS → Charged makes the existing opener worth repeating. Add another system only when a specific observed problem requires it.**
