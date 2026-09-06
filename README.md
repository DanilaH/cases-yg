# Mystery Pocket Tech

Yandex Games collectible opener built around nostalgic Y2K pocket electronics.

> Open a mystery pouch → reveal a stylized retro gadget → build a visible collection → earn CHIPS → save for Charged Pouches → repeat.

## Current phase

**Gameplay Loop Lite V2 is implemented and has passed technical + exact-revision browser/visual validation. The current gate is direct repeated hands-on.**

Current private content:

- Digital Camera;
- Flip Phone;
- Common / Rare / Epic / Legendary for each;
- 2 Secrets.

This two-family build is a development base, not the public release.

Current runtime loop:

> **Basic Pouch → collectible + CHIPS → duplicate recycle + SIGNAL → Charged Pouch → better roll → repeat.**

Implemented Lite V2 behavior:

- one global CHIPS wallet;
- Basic is free and always gives one standard collectible + base CHIPS;
- independent Cache / Big / Mega CHIPS bonus roll;
- duplicate auto-recycle → rarity-dependent CHIPS + one Signal segment;
- `4/4` Signal arms `SIGNAL LOCK`;
- Signal guarantees NEW only among undiscovered items eligible for the selected pouch;
- Basic can roll Common / Rare / Epic but never standard Legendary;
- Charged costs CHIPS, has materially stronger Rare/Epic odds and non-zero Legendary access;
- if only Legendary remains, Basic keeps Signal armed and the UI communicates `SIGNAL LOCK · CHARGED`;
- Basic and Charged resolve inside the active loot pool; CHIPS and Signal remain global;
- Charged cost + all rewards are one recoverable `pendingReveal` transaction;
- CHIPS/Signal HUD, recycle feedback, cache beats, Charged aura/selection and `CHARGED POUCH READY` presentation are integrated.

### Current provisional balance

All values live in typed config and remain open to tuning from hands-on evidence:

| | Basic | Charged |
|---|---:|---:|
| Cost | 0 CHIPS | 60 CHIPS |
| Base CHIPS | 6–10 | 18–24 |
| Rarity weights | 72 / 25 / 3 / 0 | 35 / 40 / 20 / 5 |
| Hidden Pocket | 1.5% from opening #4 | 6% from opening #4 |

Rarity order is Common / Rare / Epic / Legendary. Duplicate recycle is currently `2 / 4 / 8 / 15` CHIPS by rarity. Cache tiers are also config-driven; the rare Mega tier pays `120–180` CHIPS.

These are **implemented starting values, not final release balance**. Current deterministic economy analysis keeps Charged a CHIPS sink even in the all-duplicate case.

## Current acceptance state

Completed:

- Lite V2 pure engine, save migration and atomic recovery;
- Opening economy UI/presentation;
- deterministic tests and debug scenarios;
- typecheck + 87 unit tests + asset validation + production build;
- exact-revision browser audit across Basic/Charged, cache, recycle, Signal, Hidden Pocket, recovery, compact/RU states;
- manual artifact review;
- post-merge CI;
- correction for the initially invisible `CHARGED POUCH READY` beat, followed by a second exact-revision audit.

Still required before Yandex DRAFT:

1. direct 20–50 opening hands-on test for pacing, comprehension and reward feel;
2. fix only evidence-backed friction found there;
3. real hosted Yandex DRAFT validation.

Do **not** start broad content expansion or add new meta systems before those gates.

## Production-grade boundaries already present

- Phaser 4.2.1 + Vite + strict TypeScript;
- Yandex Games SDK adapter;
- injected safe storage + versioned transactional `pendingReveal`;
- adaptive Desktop/Mobile landscape layout;
- data-driven gadget/loot-pool registry and Collection;
- integrated Camera/Flip Phone collectible art;
- integrated production pouch/background/SFX assets;
- Phaser-rendered reusable CHIPS token and Charged aura;
- manifest-driven collectible preprocessing;
- deterministic debug scenarios;
- permanent CI;
- Yandex Metrica adapter;
- Yandex ad adapter: interstitial + rewarded + sticky-banner boundary;
- dev-only rewarded CHIPS grant for exactly-once plumbing checks;
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

## Source of truth

Canonical current docs:

- [`docs/DECISIONS.md`](docs/DECISIONS.md) — canonical decisions + current runtime/tuning state;
- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product thesis, staging and scope guardrails;
- [`docs/GAMEPLAY_SYSTEMS.md`](docs/GAMEPLAY_SYSTEMS.md) — actual Lite V2 mechanics and balance model;
- [`docs/TECHNICAL_DIRECTION.md`](docs/TECHNICAL_DIRECTION.md) — implemented architecture, save/recovery and platform boundaries;
- [`docs/IMPLEMENTATION_ROADMAP.md`](docs/IMPLEMENTATION_ROADMAP.md) — current execution order through release;
- [`docs/PROBE_VALIDATION.md`](docs/PROBE_VALIDATION.md) — direct/local Lite V2 validation gate;
- [`docs/OPEN_QUESTIONS.md`](docs/OPEN_QUESTIONS.md) — only genuinely unresolved questions;
- [`docs/INFRASTRUCTURE_STATUS.md`](docs/INFRASTRUCTURE_STATUS.md) — current infrastructure/runtime status;
- [`docs/ASSET_MANIFEST.md`](docs/ASSET_MANIFEST.md) — actual integrated asset/runtime-visual state;
- [`docs/YANDEX_SLICE_VALIDATION.md`](docs/YANDEX_SLICE_VALIDATION.md) — hosted checks that local CI cannot replace.

Historical implementation/audit notes remain useful records but are not current specifications when they conflict with the canonical files above.

## Product principle

Scale primarily through desirable collectible content and a repeatable art pipeline while keeping the gameplay-system count low.

> **First prove the implemented Basic → CHIPS → Charged loop through repeated hands-on and hosted Yandex validation. Add another system only when a specific observed problem requires it.**
