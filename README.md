# Mystery Pocket Tech

Yandex Games collectible opener built around nostalgic Y2K pocket electronics.

> Open a mystery pouch → reveal a stylized retro gadget → build a visible collection → earn CHIPS → save for Charged Pouches → repeat.

## Current phase

**Gameplay Loop Lite V2, Phase 2.6 Signal Overcharge, Phase 2.7 Secret reward correction, and the final merged-main repeated-use regression are accepted. Real hosted Yandex DRAFT validation is the next gate.**

Current private content:

- Digital Camera;
- Flip Phone;
- Common / Rare / Epic / Legendary for each;
- 2 Secrets.

This two-family build is a development base, not the public release.

Current runtime loop:

> **Basic Pouch → collectible + CHIPS → duplicate recycle + SIGNAL → Charged Pouch → better roll → Hidden Pocket jackpot → repeat.**

Implemented mechanics:

- one global CHIPS wallet;
- Basic free/unlimited, always one standard collectible + base CHIPS;
- independent Cache / Big / Mega CHIPS roll;
- duplicate auto-recycle → rarity-dependent CHIPS + one Signal segment;
- `4/4` Signal lock with selected-pouch eligibility;
- Basic C/R/E only, no standard Legendary;
- Charged costs CHIPS, materially stronger top-end odds + Legendary access;
- strict `SIGNAL LOCK · CHARGED` edge when only Legendary remains;
- Overcharge applies the persisted multiplier to `base + cache + recycle`, then gains/reset according to lock retention/consumption;
- Hidden Pocket grants a persisted `+40 CHIPS` Secret jackpot that is not multiplied by Overcharge;
- missing Secrets are selected before duplicates; after all Secrets are owned, Hidden Pocket remains live as a Secret duplicate jackpot;
- Secret result has a distinct ruby/gold identity and persistent premium FX until collect;
- loot-pool-aware resolution;
- atomic recoverable Basic/Charged reward transaction through Save V4 `pendingReveal`.

### Current provisional balance

| | Basic | Charged |
|---|---:|---:|
| Cost | 0 CHIPS | 60 CHIPS |
| Base CHIPS | 6–10 | 18–24 |
| Rarity C/R/E/L | 72 / 25 / 3 / 0 | 35 / 40 / 20 / 5 |
| Hidden Pocket | 1.5% from opening #4 | 6% from opening #4 |

Duplicate recycle C/R/E/L = `2 / 4 / 8 / 15`. Mega currently pays `120–180 CHIPS`. Secret jackpot currently pays `+40 CHIPS`.

These are provisional development values, not final public-release tuning.

## Opening feel / presentation

Current presentation includes:

- tap/click fast-forward of reveal presentation;
- immediate grab/tension/tear recoil;
- staged reward → sequential CHIPS banking;
- larger CHIPS card, animated count-up, local pulse/shake;
- synthesized `chip-clack` banking cue plus a synth-only `pouch-grab` cue;
- duplicate → recycle CHIPS + Signal physical transfer;
- left-side Basic/Charged gameplay rail;
- stronger Charged cyan/violet/iridescent treatment;
- compact reward tray that prefers the right-side slot and switches content between standard/Secret carousel pages;
- Secret entrance burst followed by persistent halo/cloud/sparkles/breathing until collect;
- one accent digital/pixel-like font for short system data;
- restrained neon/shimmer rarity hierarchy.

Visual rule:

> **Cozy Y2K world, electric digital UI.**

No custom shader is required in the current slice; treatment uses Phaser Text/Graphics/tint/blend/highlight/tweens.

The request for exact odds + Drop contents + discovered/unknown items remains deliberately deferred until hosted DRAFT evidence. No permanent giant sidebar or always-visible odds table is planned.

## Acceptance path

Completed:

- Lite V2 engine/save/recovery;
- Opening economy presentation;
- Opening Feel Correction + Charged-ready follow-ups;
- Phase 2.6 Overcharge implementation and exact audits;
- stale Overcharge tween lifecycle crash found by repeated-use browser QA and fixed;
- reward tray hierarchy/readability/placement correction;
- debug scenario save-state normalization;
- Phase 2.7 Secret reward correction:
  - Save V4;
  - persisted `+40 CHIPS` Secret jackpot;
  - Secret duplicates after collection completion;
  - NEW/duplicate Secret reward semantics;
  - ruby/gold Secret identity;
  - persistent premium FX;
  - carousel-aware reward tray;
- Secret browser acceptance — NEW/duplicate, RU/EN, recovery, fast-forward, persistent FX;
- final merged-main repeated-use regression — 24 real openings + Secret lifecycle/navigation stress, **82/82 PASS**, runtime/request/HTTP failures **0/0/0**;
- current automated suite: **131 tests** after the pre-DRAFT platform lifecycle regression was added, plus typecheck/assets/build gates;
- Yandex production archive shape verified from the exact accepted tree.

Current order:

1. run real hosted Yandex DRAFT validation;
2. fix only hosted-platform defects that the draft actually exposes;
3. decide deferred Drop/odds/progress work from evidence;
4. content expansion only after hosted validation.

Do not add unrelated meta systems/content before the hosted gate.

## Production-grade boundaries already present

- Phaser 4.2.1 + Vite + strict TypeScript;
- Yandex SDK adapter;
- startup pause/resume subscription before async storage initialization;
- activity coordinator that replays the current blocked state to late Phaser/WebAudio subscribers;
- injected safe storage + Save V4 versioned `pendingReveal`;
- responsive Desktop/Mobile landscape layout;
- data-driven gadget/loot-pool registry;
- integrated Camera/Flip Phone art;
- production pouch/background/SFX assets;
- Phaser-rendered CHIPS token + Charged aura;
- deterministic debug scenarios;
- permanent CI;
- Yandex Metrica + ad adapters;
- rewarded dev-probe reload after durable out-of-session CHIPS mutation;
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
- [`docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md`](docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md) — Phase 2.6 mechanic/presentation/validation contract;
- [`docs/SECRET_REWARD_CORRECTION.md`](docs/SECRET_REWARD_CORRECTION.md) — Phase 2.7 Secret reward/economy/presentation contract;
- [`docs/OPENING_FEEL_CORRECTION_SCOPE.md`](docs/OPENING_FEEL_CORRECTION_SCOPE.md) — implemented correction contract and acceptance history;
- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product staging/guardrails;
- [`docs/GAMEPLAY_SYSTEMS.md`](docs/GAMEPLAY_SYSTEMS.md) — mechanics + current presentation contract;
- [`docs/TECHNICAL_DIRECTION.md`](docs/TECHNICAL_DIRECTION.md) — architecture/recovery/presentation boundaries;
- [`docs/IMPLEMENTATION_ROADMAP.md`](docs/IMPLEMENTATION_ROADMAP.md) — execution order;
- [`docs/PROBE_VALIDATION.md`](docs/PROBE_VALIDATION.md) — correction validation gates;
- [`docs/OPEN_QUESTIONS.md`](docs/OPEN_QUESTIONS.md) — genuinely unresolved choices;
- [`docs/INFRASTRUCTURE_STATUS.md`](docs/INFRASTRUCTURE_STATUS.md) — actual infrastructure status;
- [`docs/ASSET_MANIFEST.md`](docs/ASSET_MANIFEST.md) — current + correction asset impact;
- [`docs/YANDEX_SLICE_VALIDATION.md`](docs/YANDEX_SLICE_VALIDATION.md) — hosted checks local CI cannot replace.

## Product principle

Scale primarily through desirable collectible content and a repeatable art pipeline while keeping gameplay-system count low.

> **Make the current loop feel expensive before making the game structurally bigger.**
