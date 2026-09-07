# Mystery Pocket Tech

Yandex Games collectible opener built around nostalgic Y2K pocket electronics.

> Open a mystery pouch → reveal a stylized retro gadget → build a visible collection → earn CHIPS → save for Charged Pouches → repeat.

## Current phase

**Gameplay Loop Lite V2 and the previous feel-correction passes are implemented/audited. Final direct hands-on completed with a bounded new finding set. The current product gate is Phase 2.6: fix those issues and implement the approved deterministic Signal Overcharge extension, then exact/direct regression; real Yandex DRAFT follows only if accepted.**

Current approved scope: [`docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md`](docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md). Historical feel-correction contract: [`docs/OPENING_FEEL_CORRECTION_SCOPE.md`](docs/OPENING_FEEL_CORRECTION_SCOPE.md).

Current private content:

- Digital Camera;
- Flip Phone;
- Common / Rare / Epic / Legendary for each;
- 2 Secrets.

This two-family build is a development base, not the public release.

Current runtime loop:

> **Basic Pouch → collectible + CHIPS → duplicate recycle + SIGNAL → Charged Pouch → better roll → repeat.**

Implemented Lite V2 mechanics retained through the correction:

- one global CHIPS wallet;
- Basic free/unlimited, always one standard collectible + base CHIPS;
- independent Cache / Big / Mega CHIPS roll;
- duplicate auto-recycle → rarity-dependent CHIPS + one Signal segment;
- `4/4` Signal lock with selected-pouch eligibility;
- Basic C/R/E only, no standard Legendary;
- Charged costs CHIPS, materially stronger top-end odds + Legendary access;
- strict `SIGNAL LOCK · CHARGED` edge when only Legendary remains;
- loot-pool-aware resolution;
- atomic recoverable Charged cost/reward transaction.

### Current provisional balance

| | Basic | Charged |
|---|---:|---:|
| Cost | 0 CHIPS | 60 CHIPS |
| Base CHIPS | 6–10 | 18–24 |
| Rarity C/R/E/L | 72 / 25 / 3 / 0 | 35 / 40 / 20 / 5 |
| Hidden Pocket | 1.5% from opening #4 | 6% from opening #4 |

Duplicate recycle C/R/E/L = `2 / 4 / 8 / 15`. Mega currently pays `120–180 CHIPS`.

These are starting values, not final release balance. They stayed unchanged through the feel-correction pass and remain provisional pending repeated-use/content-scale evidence.

## Opening Feel Correction

First hands-on found:

- CHIPS need stronger sound/tactile feedback;
- CHIPS HUD is too small/weak;
- wallet values need count-up + local receiving reaction;
- Basic/Charged selector is cramped and selected state unclear;
- transient feedback is too brief;
- earned CHIPS should stage with the result and bank after acceptance;
- Charged is not visually distinct enough;
- `RESULT LOCKED` / dead tapping is frustrating;
- UI needs a stronger electronic/neon Y2K identity.

The merged correction adds **feel, not mechanics**:

- tap/click fast-forward of reveal presentation;
- immediate grab/tension/tear recoil;
- staged reward → sequential CHIPS banking;
- larger CHIPS card, animated count-up, local pulse/shake;
- synthesized `chip-clack` banking cue plus a synth-only `pouch-grab` cue;
- duplicate → recycle CHIPS + Signal physical transfer;
- clearer left-side Basic/Charged gameplay rail;
- stronger Charged cyan/violet/iridescent treatment;
- one accent digital/pixel-like font for short system data;
- restrained neon/shimmer rarity hierarchy.

Visual rule:

> **Cozy Y2K world, electric digital UI.**

No custom shader was added in this pass. The runtime treatment uses Phaser Text/Graphics/tint/blend/highlight/tweens.

The player request for exact odds + Drop contents + discovered/unknown items is valid but deliberately deferred to a possible on-demand info drawer **after Phase 2.6 + hosted DRAFT evidence**. No permanent giant sidebar or always-visible odds table is planned now.

## Acceptance path

Completed:

- Lite V2 engine/save/recovery;
- Opening economy presentation;
- 108-test current suite + typecheck/assets/build;
- original exact-revision browser/video audit + manual review;
- Opening Feel Correction + Charged-ready correction;
- first repeated hands-on;
- second repeated hands-on — complete with narrow follow-up findings;
- bounded follow-up fixes through PR #45, exact-revision audited and merged;
- latest audited product tree verified identical to merged `main`;
- post-merge CI #248 — PASS.

Current order:

1. implement final-hands-on fixes + Signal Overcharge;
2. simulate Overcharge gain/cap, then exact-audit + directly regress;
3. if accepted, real hosted Yandex DRAFT;
4. decide deferred Drop/odds/progress work from evidence;
5. content expansion only after hosted validation.

Do not add unrelated meta systems/content or tune legacy economy values by intuition. Overcharge-specific gain/cap tuning is the explicit bounded exception and must be simulation-driven.

## Production-grade boundaries already present

- Phaser 4.2.1 + Vite + strict TypeScript;
- Yandex SDK adapter;
- injected safe storage + versioned `pendingReveal`;
- responsive Desktop/Mobile landscape layout;
- data-driven gadget/loot-pool registry;
- integrated Camera/Flip Phone art;
- production pouch/background/SFX assets;
- Phaser-rendered CHIPS token + Charged aura;
- deterministic debug scenarios;
- permanent CI;
- Yandex Metrica + ad adapters;
- platform pause/resume/audio behavior;
- RU + EN architecture;
- exact-revision browser screenshot/video QA.

## Asset commands

```bash
npm run assets:prepare
npm run assets:validate
npm run assets:atlas -- --family flip-phone
npm run assets:selftest

# Optional local AI cutout path
npm run assets:model:u2netp
npm run assets:ai:selftest
```

Raw generated collectible files live under git-ignored `assets-src/raw/`. Accepted runtime collectibles remain individual transparent 1024×1024 WebPs in `public/assets/collectibles/`.

## Source of truth

Canonical current docs:

- [`docs/DECISIONS.md`](docs/DECISIONS.md) — decisions/current state;
- [`docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md`](docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md) — current Phase 2.6 mechanic/presentation/validation contract;
- [`docs/OPENING_FEEL_CORRECTION_SCOPE.md`](docs/OPENING_FEEL_CORRECTION_SCOPE.md) — implemented correction contract and acceptance history;
- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product staging/guardrails;
- [`docs/GAMEPLAY_SYSTEMS.md`](docs/GAMEPLAY_SYSTEMS.md) — mechanics + current presentation contract;
- [`docs/TECHNICAL_DIRECTION.md`](docs/TECHNICAL_DIRECTION.md) — architecture/recovery/presentation boundaries;
- [`docs/IMPLEMENTATION_ROADMAP.md`](docs/IMPLEMENTATION_ROADMAP.md) — execution order;
- [`docs/PROBE_VALIDATION.md`](docs/PROBE_VALIDATION.md) — correction validation + second hands-on gate;
- [`docs/OPEN_QUESTIONS.md`](docs/OPEN_QUESTIONS.md) — genuinely unresolved choices;
- [`docs/INFRASTRUCTURE_STATUS.md`](docs/INFRASTRUCTURE_STATUS.md) — actual infrastructure status;
- [`docs/ASSET_MANIFEST.md`](docs/ASSET_MANIFEST.md) — current + correction asset impact;
- [`docs/YANDEX_SLICE_VALIDATION.md`](docs/YANDEX_SLICE_VALIDATION.md) — hosted checks local CI cannot replace.

## Product principle

Scale primarily through desirable collectible content and a repeatable art pipeline while keeping gameplay-system count low.

> **Make the current loop feel expensive before making the game structurally bigger.**
