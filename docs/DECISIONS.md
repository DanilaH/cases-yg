# Decision ledger

This file is the canonical decision ledger for the current project state.

Status meanings:

- **LOCKED** — source of truth unless new evidence invalidates it.
- **CURRENT RUNTIME** — implemented behavior in current `main`.
- **LOCKED NEXT** — evidence-backed behavior approved for the immediate correction pass but not merged yet.
- **COMPLETE** — implementation/asset work is integrated and has passed its technical gate.
- **OPEN** — required future gate/work item that has not been completed yet.
- **CONDITIONAL** — allowed only when the named review/acceptance condition requires it.
- **OPEN FOR TUNING** — implemented concept; numbers/pacing may change from evidence.
- **OPEN FOR RELEASE** — deliberately deferred until larger content scale exists.
- **HYPOTHESIS** — useful working assumption, not a commitment.
- **PARKED** — not current scope; revisit only for a proven problem.
- **PARKED NEXT CANDIDATE** — deliberately outside the current pass but an explicit candidate to revisit after its acceptance gate.
- **LOCKED OUT / LOCKED OUT FOR THIS PASS** — excluded globally or for the named current pass unless new evidence explicitly reopens it.

---

## Product / staging

| Decision | Status | Current answer |
|---|---|---|
| Platform | LOCKED | Yandex Games |
| Engine | LOCKED | Phaser 4.2.1 + Vite + strict TypeScript |
| Theme | LOCKED | Y2K / retro pocket gadgets |
| Core fantasy | LOCKED | Open tiny mystery tech and build a visible nostalgic collection |
| Core loop | CURRENT RUNTIME | **Basic → collectible + CHIPS → duplicate recycle + SIGNAL → Charged → better roll → repeat** |
| Current stage | LOCKED | Opening Feel Correction is merged and exact-revision/manual-review approved; current gate is the second **20–30 opening hands-on**, then real Yandex DRAFT if accepted |
| Two-family build | CURRENT RUNTIME | private development base: Digital Camera + Flip Phone, 4 standard rarities each + 2 Secrets |
| Public content direction | LOCKED | materially expand only after corrected hands-on + hosted draft validation |
| Expansion organization | LOCKED | themed Drops/loot pools; no global mega-pool |
| Production philosophy | LOCKED | low production burden, repeatable content factory, minimal gameplay-system count |

---

## Gameplay Loop Lite V2

The mechanics remain accepted. The current correction is presentation/interaction work and must not silently redesign the economy.

| Decision | Status | Current answer |
|---|---|---|
| Basic Pouch | CURRENT RUNTIME | free/unlimited; one standard collectible + guaranteed base CHIPS + independent cache roll + optional Hidden Pocket |
| CHIPS | CURRENT RUNTIME | one global spendable currency used for Charged Pouch |
| CHIPS cache | CURRENT RUNTIME | independent `none/cache/big/mega` bonus roll; collectible rarity and cache luck are separate axes |
| Charged Pouch | CURRENT RUNTIME | selected directly from Opening; costs CHIPS; no shop scene |
| Charged reward | CURRENT RUNTIME | one standard collectible, stronger CHIPS/cache profile, stronger Rare/Epic profile, Legendary access, higher Hidden Pocket chance |
| Charged selection continuity | CURRENT RUNTIME | remains selected while still affordable; falls back to Basic when not affordable |
| Charged economy invariant | LOCKED | expected CHIPS return stays below cost; rare jackpots may fund several future Charged openings |
| Multi-standard drops | LOCKED OUT | not in Lite V2 |
| Duplicate behavior | CURRENT RUNTIME | automatic `DUPLICATE → RECYCLED → CHIPS + SIGNAL` |
| Signal | CURRENT RUNTIME | non-spendable duplicate pity, separate from CHIPS |
| Signal rule | CURRENT RUNTIME | duplicate `+1`; `4/4` arms lock; next selected-pouch-eligible NEW is guaranteed; consume → `0/4` |
| Basic-only zero-eligible edge | CURRENT RUNTIME | if only Legendary remains, Basic resolves normally and Signal stays `4/4`; UI communicates `SIGNAL LOCK · CHARGED` |
| Reward transaction | CURRENT RUNTIME | pouch cost + base/cache/recycle + Signal + collectible + Hidden Pocket are one recoverable deterministic transaction |
| Balance during feel correction | LOCKED | no tuning-number changes in the correction pass unless separately approved from evidence |

### Current provisional balance

These values are implemented and remain **OPEN FOR TUNING**, not release-locked.

| Value | Basic | Charged |
|---|---:|---:|
| Cost | `0` | `60` |
| Base CHIPS | `6–10` | `18–24` |
| Cache weights `none/cache/big/mega` | `90 / 7 / 2.5 / 0.5` | `78 / 15 / 5.5 / 1.5` |
| Cache payouts | `0 / 20–35 / 45–75 / 120–180` | same ranges |
| Rarity weights C/R/E/L | `72 / 25 / 3 / 0` | `35 / 40 / 20 / 5` |
| Hidden Pocket from opening #4 | `1.5%` | `6%` |

Duplicate recycle CHIPS: Common/Rare/Epic/Legendary = `2 / 4 / 8 / 15`.

---

## Opening Feel Correction — CURRENT RUNTIME

Detailed contract: `docs/OPENING_FEEL_CORRECTION_SCOPE.md`.

| Decision | Status | Current answer |
|---|---|---|
| Player-facing `RESULT LOCKED` | CURRENT RUNTIME | remove the frustrating dead-input state |
| Reveal acceleration | CURRENT RUNTIME | intentional tap/click fast-forwards active presentation only; transaction/result never changes |
| Tear-release safety | CURRENT RUNTIME | short input guard prevents drag release from accidentally skipping the next beat |
| Quick Reveal mode | PARKED | no separate setting/toggle; first solve responsiveness with direct fast-forward |
| Pouch tactile feel | CURRENT RUNTIME | immediate grab response, progressive tension, short tear recoil/snap; no physics |
| Reward arrival | CURRENT RUNTIME | preserve established emerge/overshoot/settle, improve anticipation/rarity impact where useful |
| CHIPS staging | CURRENT RUNTIME | earned base/cache/recycle first read beside result; visual banking occurs on result acceptance |
| Charged cost presentation | CURRENT RUNTIME | cost remains communicated at opening time; only earned CHIPS are visually staged for later banking |
| CHIPS bank order | CURRENT RUNTIME | base → optional cache → optional recycle; Signal has its own destination transfer |
| CHIPS HUD | CURRENT RUNTIME | larger resource card, clearer token, larger digital number, animated count-up and bounded local punch/shake |
| CHIPS sound | CURRENT RUNTIME | add one concise reusable `chips-collect` cue; no sound per cache tier |
| Charged-ready feedback | CURRENT RUNTIME | trigger when displayed wallet actually crosses cost during banking; activate CHIPS/Charged UI without a mandatory blocking banner |
| Duplicate tactile conversion | CURRENT RUNTIME | duplicate visibly converts into recycle CHIPS + one Signal transfer after collectible reveal |
| Signal presentation | CURRENT RUNTIME | stronger electronic/digital segmented HUD with destination pulse/brief lock glitch |
| Basic/Charged selector | CURRENT RUNTIME | move into clearer left-side gameplay rail; selected state must be obvious without relying on color |
| Unaffordable Charged attempt | CURRENT RUNTIME | acknowledge input with wiggle/cost flash/HUD response; no modal and no mutation |
| Charged differentiation | CURRENT RUNTIME | substantially stronger runtime cyan/violet/iridescent treatment; same pouch geometry and tear mechanic |
| Charged raster fallback | CONDITIONAL | allowed only if label-hidden visual audit still reads as “Basic with glow” |
| Callout readability | CURRENT RUNTIME | longer readable holds + semantic positions; experienced player can fast-forward |
| Random callout positions | LOCKED OUT | no arbitrary random screen placement; only bounded decorative jitter |
| Controlled micro-variation | CURRENT RUNTIME | small rotation/overshoot/spark/token-trajectory variation without changing learned rhythm |

---

## Visual language

| Decision | Status | Current answer |
|---|---|---|
| Art-language principle | CURRENT RUNTIME | **Cozy Y2K world, electric digital UI** |
| Hotline Miami reference | CURRENT RUNTIME | use as energy/neon/digital-reference only; do not copy full aesthetic |
| Accent typography | CURRENT RUNTIME | one bundled digital/pixel-like accent font for short system labels/numbers only |
| Main typography | LOCKED | readable clean sans remains for instructions, long copy and ordinary navigation |
| Neon implementation | CURRENT RUNTIME | Phaser Text/Graphics, duplicate glow layers, tint, blend, moving highlights, rings/sparks/tweens first |
| Custom shader | LOCKED OUT FOR THIS PASS | no custom WebGL shader until a reviewed no-shader result proves one specific effect cannot be sold cheaply |
| Rarity shimmer | CURRENT RUNTIME | restrained Common → stronger Rare/Epic/Legendary electronic/iridescent hierarchy; Secret remains strongest/distinct |
| Fullscreen CRT/VHS | LOCKED OUT FOR THIS PASS | no global scanlines/noise/chromatic-aberration treatment |

---

## Information / collection visibility

Hands-on also exposed a legitimate desire to understand the active pool, odds and missing items, but this is deliberately separated from the current feel correction.

| Decision | Status | Current answer |
|---|---|---|
| Permanent odds on main screen | LOCKED OUT | would overload the opener and flatten surprise |
| Permanent full collection sidebar | LOCKED OUT | does not scale to 15–25 items per Drop and competes with the hero reward |
| Drop/odds/progress info surface | PARKED NEXT CANDIDATE | after corrected hands-on, consider one on-demand drawer reading exact odds from typed config and showing family/discovered/unknown state |
| Player-facing Drop selector | OPEN FOR RELEASE | expose only when Drop #2 actually exists |

---

## Content growth / Drops

| Decision | Status | Current answer |
|---|---|---|
| Loot-pool identity | CURRENT RUNTIME | families/collectibles resolve through loot-pool membership |
| Active Drop state | CURRENT RUNTIME | Basic/Charged/Signal resolve inside active `lootPoolId` |
| One-Drop UI | CURRENT RUNTIME | selector hidden while one Drop exists |
| Multi-Drop UI | OPEN FOR RELEASE | compact selector once Drop #2 exists |
| Wallet across Drops | LOCKED | CHIPS global |
| Signal across Drops | LOCKED | meter global; lock applies inside selected active Drop and pouch eligibility |
| Family targeting | PARKED | add only if real completion data proves Drop-level targeting insufficient |

---

## Persistence / architecture

| Decision | Status | Current answer |
|---|---|---|
| Save | CURRENT RUNTIME | versioned local-first state behind injected `StorageAdapter` |
| Save version | CURRENT RUNTIME | V2 fields include CHIPS, segmented Signal, active loot pool and pending Lite reveal |
| Anti-reroll | CURRENT RUNTIME | full `pendingReveal` persisted before presentation and committed once |
| Presentation ownership | LOCKED | tween completion, fast-forward and cosmetic banking never own durable economy state |
| Recovery | CURRENT RUNTIME | original pouch/result/cache/Signal/Hidden outcome preserved; no duplicate reward |
| Engineering scope | LOCKED | small presentation helpers are allowed; no generalized animation/economy framework |
| React / physics / backend | LOCKED OUT | do not add without a concrete need |

---

## SDK / ads / analytics

| Decision | Status | Current answer |
|---|---|---|
| Yandex SDK | CURRENT RUNTIME | thin platform adapter |
| Ads | CURRENT RUNTIME | SDK-only; interstitial outside active reveal; rewarded voluntary/exactly-once; pause/resume safe |
| Rewarded dev probe | CURRENT RUNTIME | clearly dev-only CHIPS grant; pity state is not manipulated |
| Real hosted validation | OPEN | Yandex DRAFT follows corrected hands-on and exact-revision approval |

---

## Visual QA / acceptance workflow

| Decision | Status | Current answer |
|---|---|---|
| Existing Lite V2 technical/visual gate | COMPLETE | typecheck/tests/assets/build + exact-revision videos/screens reviewed |
| First direct hands-on | COMPLETE WITH FINDINGS | exposed reward/input/UI feel problems; therefore DRAFT is not yet approved |
| Feel correction exact-revision audit | COMPLETE | r3 exact-revision browser/video audit + manual artifact review passed on the audited product tree |
| Second repeated hands-on | OPEN | **current product gate**: 20–30 normal openings on the merged corrected build before hosted DRAFT |
| Real Yandex DRAFT | OPEN | next external gate after second hands-on acceptance |

Technical green ≠ visual approved ≠ hands-on approved ≠ hosted-platform approved.

---

## Explicitly parked / excluded

PARKED:

- timed Basic charges/energy;
- offline income;
- collection passive CHIPS production;
- Overcharge;
- Archive levels;
- upgrade/set-bonus trees;
- separate shop;
- multiple spendable currencies;
- multi-standard collectible drops;
- auto-open/x5;
- prestige;
- crafting/merge;
- family-targeted pouch;
- odds/Drop-info drawer until the feel correction is re-tested.

LOCKED OUT unless direction changes materially:

- trading/market;
- crash/double/jackpot/betting framing;
- large minigame suite;
- real-time 3D inspection/world;
- feature-count arms race.

---

## Current stage

> **GO: run the second 20–30 opening hands-on on the merged/audited correction. If accepted, proceed to real Yandex DRAFT. Do not add mechanics/content or tune balance before that evidence.**
