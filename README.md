# Mystery Pocket Tech

Small Yandex Games collectible opener built around nostalgic Y2K pocket electronics.

> Open a mystery package → reveal a stylized retro gadget → discover rarity → add it to a visible collection → repeat.

## Current phase

**Selected game / pre-production.** The concept is chosen. The current job is to finish the source-of-truth documentation, lock the remaining UX/economy decisions, validate the art system across several device families, and then build the smallest playable probe.

## Source of truth

- [`docs/DECISIONS.md`](docs/DECISIONS.md) — decision ledger: locked, accepted-for-probe, provisional, parked, open.
- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product thesis, audience hypothesis, core loop, scope guardrails, validation goals.
- [`docs/ART_DIRECTION.md`](docs/ART_DIRECTION.md) — collectible visual language, rarity grammar, Secret/Chase rules.
- [`docs/GAMEPLAY_SYSTEMS.md`](docs/GAMEPLAY_SYSTEMS.md) — opener loop, Signal, duplicates/Mod Bench, Secrets, collection meta.
- [`docs/TECHNICAL_DIRECTION.md`](docs/TECHNICAL_DIRECTION.md) — Phaser/Vite/TypeScript direction, save model, Yandex integration boundaries.
- [`docs/COMPETITIVE_REFERENCE.md`](docs/COMPETITIVE_REFERENCE.md) — competitor mechanics worth stealing, transforming, or explicitly avoiding.
- [`docs/OPEN_QUESTIONS.md`](docs/OPEN_QUESTIONS.md) — unresolved decisions to close before implementation.

## Locked high-level direction

- Platform: **Yandex Games**.
- Theme: **Y2K / retro pocket gadgets** inspired by recognizable real device archetypes.
- Product fantasy: **tiny mystery tech + rarity + visible cozy collection**.
- Rendering: **stylized 2D / painted 2.5D**; no photoreal product-render look.
- Engine: **Phaser 4.x + Vite + strict TypeScript**.
- No React in the game runtime.
- No physics unless a later requirement proves it necessary.
- Standard rarity ladder: **Common → Rare → Epic → Legendary**.
- Separate **Secret / Chase** class outside the normal rarity ladder.
- Low production burden is a first-class product constraint.

## Product principle

The project should win through **strong visual desirability, fast anticipation/reveal, collection payoff, and a few cheap retention primitives** — not through feature count, 3D complexity, worlds, minigames, or a giant economy.
