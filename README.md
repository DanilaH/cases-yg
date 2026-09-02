# Mystery Pocket Tech

Small Yandex Games collectible opener built around nostalgic Y2K pocket electronics.

> Open a mystery pouch → reveal a stylized retro gadget → discover rarity → improve a visible collection → repeat.

## Current phase

**Implementation-ready behavioral probe.** Product scope, core UX, drop model, Signal, Hidden Pocket, Collection semantics, responsive architecture, analytics gates and art-production workflow are locked.

First probe content is intentionally tiny:

- Digital Camera;
- Flip Phone;
- Common / Rare / Epic / Legendary for each;
- 2 Secrets;
- 8 standard + 2 Secret collectible assets total.

Do not expand content or meta systems before the probe validates.

## Source of truth

- [`docs/DECISIONS.md`](docs/DECISIONS.md) — canonical decision ledger.
- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product thesis, scope, player fantasy, progression and monetization stance.
- [`docs/GAMEPLAY_SYSTEMS.md`](docs/GAMEPLAY_SYSTEMS.md) — opener, drop odds, Signal, Hidden Pocket, Collection behavior.
- [`docs/TECHNICAL_DIRECTION.md`](docs/TECHNICAL_DIRECTION.md) — Phaser/Vite/TypeScript architecture, save transaction, responsive layout, Yandex integration.
- [`docs/ART_DIRECTION.md`](docs/ART_DIRECTION.md) — collectible visual language, rarity grammar, Secrets, package and store visual direction.
- [`docs/ART_PRODUCTION.md`](docs/ART_PRODUCTION.md) — operational generation/export/cleanup pipeline.
- [`docs/PROBE_VALIDATION.md`](docs/PROBE_VALIDATION.md) — analytics events, continuation gates, kill/tune/continue rules, rebased effort.
- [`docs/COMPETITIVE_REFERENCE.md`](docs/COMPETITIVE_REFERENCE.md) — competitor mechanics worth stealing, transforming or avoiding.
- [`docs/OPEN_QUESTIONS.md`](docs/OPEN_QUESTIONS.md) — post-validation/parked queue; no current implementation blockers.

## Locked probe direction

- Platform: **Yandex Games**.
- Engine: **Phaser 4.x + Vite + strict TypeScript**.
- Runtime scenes: **Boot → Opening ↔ Collection**.
- Landscape-only adaptive layout.
- One free/unlimited Mystery Pouch; no package currency, energy or tiers.
- One deterministic left-to-right star-tab tear gesture.
- Standard odds: **60% Common / 28% Rare / 10% Epic / 2% Legendary**.
- Signal is the only standard duplicate-mitigation system.
- Hidden Pocket: separate 3% post-standard chase roll from opening #4, while a Secret remains.
- Collection: Shelf + Library; standard completion **8/8**, Secrets separate **0/2**.
- No Tech Parts / Mod Bench / ads / dailies / leaderboard / extra gadget families in first probe.
- Analytics: Yandex built-ins + custom Yandex Metrica gameplay events.
- Working delivery target: **~5–8 focused days**, excluding moderation waiting time.

## Product principle

The project should win through **visual desirability, fast anticipation/reveal, collection payoff and very cheap visible progression** — not through feature count, 3D complexity, worlds, minigames or a giant economy.
