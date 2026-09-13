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
| Current stage | LOCKED | Seven-Drop production candidate and directed onboarding are merged. Onboarding implementation passed full CI; direct onboarding hands-on acceptance is the next local gate, then real Yandex DRAFT validation |
| Historical two-family slice | COMPLETE | Digital Camera + Flip Phone established the original interaction/content-production baseline; it is no longer the full production roster |
| Production content | CURRENT RUNTIME | seven themed Drops / fourteen families / seventy authored collectibles; no further content expansion before hosted/player evidence |
| Expansion organization | LOCKED | themed Drops/loot pools; no global mega-pool |
| Production philosophy | LOCKED | low production burden, repeatable content factory, minimal gameplay-system count |

---

## Gameplay Loop Lite V2

The Lite V2 baseline remains accepted. Phase 2.6 contains one explicit bounded economy extension — Signal Overcharge — and otherwise must not silently redesign legacy CHIPS, rarity, cache, recycle or pouch-cost economics.

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
| Signal clarity extension | CURRENT RUNTIME | ordinary `SIGNAL +1` resolves in the reward/result phase; a consumed armed lock visibly leaves the HUD and impacts the still-closed pouch before reveal, with the HUD already showing post-consume state; no tutorial modal required |
| Signal Overcharge | CURRENT RUNTIME | if Signal was already `4/4` and the selected pouch cannot consume the lock, current Overcharge multiplies `base + cache + recycle`, then that pouch increases the multiplier for the next opening; consuming the lock cashes out the current multiplier then resets to `x1.00`; cap is finite and remains useful at MAX |
| Overcharge tuning | CURRENT RUNTIME | Phase 2.6 validation candidate uses Basic `+0.10`, Charged `+0.50`, cap `x1.50`; reopen only from final hands-on, hosted, or content-scale evidence |
| Basic-only zero-eligible edge | CURRENT RUNTIME | if only Legendary remains, Basic resolves normally and Signal stays `4/4`; UI communicates `SIGNAL LOCK · CHARGED` |
| Reward transaction | CURRENT RUNTIME | pouch cost + base/cache/recycle + Signal + collectible + Hidden Pocket are one recoverable deterministic transaction |
| Balance through feel correction | COMPLETE | no steady-state tuning-number changes occurred; current provisional values remain unchanged pending later evidence |

### Current provisional steady-state balance

These values are implemented and remain **OPEN FOR TUNING**, not release-locked. Directed onboarding exceptions are listed separately below and do not alter these ordinary tables.

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

## Directed onboarding — CURRENT RUNTIME / HANDS-ON PENDING

Canonical contract: `docs/ONBOARDING.md`.

| Decision | Status | Current answer |
|---|---|---|
| First-run shell | CURRENT RUNTIME | before the first tear, show the authored environment + real Basic pouch only; no normal gameplay chrome or blocking tutorial UI |
| Tear teaching | CURRENT RUNTIME | gesture pointer demonstrates the existing star tear interaction; tutorial-only geometry/thresholds are forbidden |
| Starting wallet | CURRENT RUNTIME | untouched save receives one durable `10 CHIPS` grant; ambiguous write is reconciled by reload/exact-state verification |
| First Basic | CURRENT RUNTIME | opening #1 resolves through the real transaction as NEW Rare + normal Basic `6–10` base + exact `cache +20` |
| Primary recovery | CURRENT RUNTIME | tutorial presentation may restart, but persisted `pendingReveal` is reused exactly; no reroll or duplicate reward |
| First Charged cue | CURRENT RUNTIME | when first affordable, point to Charged; first selection receives one short non-blocking premium emphasis |
| First Charged reward | CURRENT RUNTIME | first Charged resolves as NEW Legendary when eligible; ordinary cost/base/cache/Hidden rules otherwise apply |
| First Charged + Signal | CURRENT RUNTIME | authored Legendary may satisfy/consume an armed Signal in the same transaction; never create a second guaranteed item |
| Milestone completion evidence | CURRENT RUNTIME | owning any standard Legendary currently proves first-Charged completion because Basic has zero standard-Legendary weight; revisit if another source can grant standard Legendaries |
| Signal hints | CURRENT RUNTIME | first duplicate and first `4/4` use short contextual copy; `Signal is waiting for Charged` is recurring live-state communication |
| Hint persistence | CURRENT RUNTIME | hint-seen state is separate cosmetic storage; losing it may repeat copy but cannot alter economy/progression |
| Steady-state boundary | LOCKED | onboarding is a bounded new-player exception; normal Basic/Charged distributions, Signal, Hidden Pocket and Overcharge stay unchanged afterward |
| Early economy audit relation | LOCKED | Sep-10 first-60/first-Charged timing is superseded for new players by the intentional +10 start/+20 first cache; do not treat this as steady-state balance evidence |
| Implementation gate | COMPLETE | PR #149 merged at `2f2a0dcad60e61896394c5f8ca831b374f5884ce`; install/typecheck/tests/assets/build green |
| Direct onboarding acceptance | OPEN | real-speed review still required for landing feel, pointer readability, first reveal handoff, refresh/recovery and first-Charged emphasis |

---

## Opening Feel Correction — CURRENT RUNTIME

Detailed contract: `docs/OPENING_FEEL_CORRECTION_SCOPE.md`.

| Decision | Status | Current answer |
|---|---|---|
| Player-facing `RESULT LOCKED` | CURRENT RUNTIME | remove the frustrating dead-input state |
| Reveal acceleration | CURRENT RUNTIME | intentional tap/click fast-forwards active presentation only; transaction/result never changes |
| Tear-release safety | CURRENT RUNTIME | short input guard prevents drag release from accidentally skipping the next beat |
| Quick Reveal mode | PARKED | no separate setting/toggle; first solve responsiveness with direct fast-forward |
| Pouch tactile feel | CURRENT RUNTIME | immediate grab response with synth-only `pouch-grab` pop/zip cue, progressive tension, short tear recoil/snap; no physics |
| Reward arrival | CURRENT RUNTIME | preserve established emerge/overshoot/settle; reward tray enters once and remains visually continuous while the result panel arrives on a later beat |
| Result rarity hierarchy | CURRENT RUNTIME | rarity remains secondary to item name but must read clearly |
| Rarity badge follow-up | CURRENT RUNTIME | remove the opaque black backing from the current rarity badge; retain prominence with a lighter integrated tinted/outlined treatment |
| Reward tray density | CURRENT RUNTIME | long source combinations wrap into bounded multi-line rows with dynamic tray height; reward content must stay inside the tray at 1280 and compact widths and must not collide with Hidden Pocket/result content |
| CHIPS staging | CURRENT RUNTIME | earned base/cache/recycle first read beside result in a persistent tray; visual banking occurs on result acceptance |
| Charged cost presentation | CURRENT RUNTIME | cost remains communicated at opening time; only earned CHIPS are visually staged for later banking |
| CHIPS bank order | CURRENT RUNTIME | base → optional cache → optional recycle; Signal has its own destination transfer |
| CHIPS HUD | CURRENT RUNTIME | larger resource card, clearer token, larger digital number, animated count-up and bounded local punch/shake |
| CHIPS sound | CURRENT RUNTIME | synthesized percussive `chip-clack` follows CHIPS banking with bounded audio density; no sound per cache tier |
| Charged-ready feedback | CURRENT RUNTIME | trigger when displayed wallet actually crosses cost during banking; activate CHIPS/Charged UI without a mandatory blocking banner |
| Duplicate tactile conversion | CURRENT RUNTIME | duplicate visibly converts into rarity-aware recycle feedback; ordinary Signal transfers once during reward/result staging before acceptance, while recycle CHIPS bank later; collect never replays Signal/Overcharge |
| Signal presentation | CURRENT RUNTIME | stronger segmented HUD; ordinary gain flies from reward staging to HUD, while a consumed lock flies pink/cyan from HUD into the unrevealed pouch with visible trail and resolves HUD state before collectible reveal |
| Basic/Charged selector | CURRENT RUNTIME | clear left-side gameplay rail; selected state must be obvious without relying on color |
| Unaffordable Charged attempt | CURRENT RUNTIME | acknowledge input with wiggle/cost flash/HUD response; no modal and no mutation |
| Charged denial re-entry | CURRENT RUNTIME | rapid repeated denial input must kill/reset the previous denial tween to canonical transform; no cumulative x/y drift |
| Available paid-pouch affordance | CURRENT RUNTIME | affordable non-selected paid pouches may use a rare subtle nudge/pulse; no permanent shake, no Basic/free attention loop |
| Charged differentiation | CURRENT RUNTIME | substantially stronger runtime cyan/violet/iridescent treatment; same pouch geometry and tear mechanic |
| Charged raster fallback | NOT REQUIRED NOW | label-hidden review passed with runtime treatment; reopen only if later hands-on contradicts it |
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
| Secret reward meaning | CURRENT RUNTIME | Hidden Pocket guarantees missing Secrets first, then can roll Secret duplicates after `2/2`; both NEW and duplicate Secret award a separate fixed `+40 CHIPS`, never multiplied by Overcharge; UI communicates `SECRET DISCOVERED` / `SECRET DUPLICATE` |
| Secret celebration | CURRENT RUNTIME | bounded ruby/gold arrival settles into persistent premium ambience until collect; carousel standard page suppresses Secret heading/chrome/ambience and returning to Secret restores them |
| Fullscreen CRT/VHS | LOCKED OUT FOR THIS PASS | no global scanlines/noise/chromatic-aberration treatment |

---

## Information / collection visibility

Hands-on also exposed a legitimate desire to understand the active pool, odds and missing items, but this is deliberately separated from the current feel correction.

| Decision | Status | Current answer |
|---|---|---|
| Permanent odds on main screen | LOCKED OUT | would overload the opener and flatten surprise |
| Permanent full collection sidebar | LOCKED OUT | does not scale well and competes with the hero reward |
| Drop/odds/progress info surface | PARKED NEXT CANDIDATE | revisit after hosted DRAFT evidence; candidate remains one on-demand drawer reading exact odds from typed config and showing family/discovered/unknown state |
| Player-facing Drop selector | CURRENT RUNTIME | seven-Drop selector is implemented in Opening and Collection with Drop-aware progress/navigation |

---

## Content growth / Drops

| Decision | Status | Current answer |
|---|---|---|
| Loot-pool identity | CURRENT RUNTIME | families/collectibles resolve through loot-pool membership |
| Active Drop state | CURRENT RUNTIME | Basic/Charged/Signal resolve inside active `lootPoolId` |
| Production roster | CURRENT RUNTIME | seven Drops / fourteen families / seventy collectibles |
| Multi-Drop UI | CURRENT RUNTIME | compact selector/navigation exists; alternate Drop art/content loads on demand where applicable |
| Wallet across Drops | LOCKED | CHIPS global |
| Signal across Drops | LOCKED | meter global; lock applies inside selected active Drop and pouch eligibility |
| Family targeting | PARKED | add only if real completion data proves Drop-level targeting insufficient |

---

## Persistence / architecture

| Decision | Status | Current answer |
|---|---|---|
| Save | CURRENT RUNTIME | versioned local-first state behind injected `StorageAdapter` |
| Save version | CURRENT RUNTIME | V4 persists CHIPS, segmented Signal, Overcharge, active loot pool, pending reveal, and exact Hidden Pocket NEW/duplicate + Secret bonus fields; V1/V2/V3 migrations remain supported |
| Anti-reroll | CURRENT RUNTIME | full `pendingReveal` persisted before presentation and committed once |
| Presentation ownership | LOCKED | tween completion, fast-forward and cosmetic banking never own durable economy state |
| Recovery | CURRENT RUNTIME | original pouch/result/cache/Signal/Hidden outcome preserved; no duplicate reward |
| Ambiguous-write recovery | CURRENT RUNTIME | staging/commit and onboarding starting grant reconcile rejected writes by reloading and accepting success only when the exact intended durable state is present |
| Overcharge transaction extension | CURRENT RUNTIME | multiplier-before, bonus CHIPS, actual clamped gain/reset and multiplier-after are predetermined in `pendingReveal`; visual gain/discharge occurs later and never owns durable state |
| Guidance observer isolation | CURRENT RUNTIME | local onboarding/presentation observers cannot throw back into the gameplay analytics/event path |
| Engineering scope | LOCKED | small presentation helpers are allowed; no generalized animation/economy/onboarding framework |
| React / physics / backend | LOCKED OUT | do not add without a concrete need |

---

## SDK / ads / analytics

| Decision | Status | Current answer |
|---|---|---|
| Yandex SDK | CURRENT RUNTIME | thin platform adapter |
| Ads | CURRENT RUNTIME | SDK-only; interstitial outside active reveal; rewarded voluntary/exactly-once; pause/resume safe |
| Rewarded dev probe | CURRENT RUNTIME | clearly dev-only CHIPS grant; pity state is not manipulated |
| Real hosted validation | OPEN | Yandex DRAFT follows direct onboarding hands-on acceptance; actual SDK/storage/ad/device lifecycle remains unproven until hosted validation |

---

## Visual QA / acceptance workflow

| Decision | Status | Current answer |
|---|---|---|
| Existing Lite V2 technical/visual gate | COMPLETE | typecheck/tests/assets/build + exact-revision videos/screens reviewed |
| First direct hands-on | COMPLETE WITH FINDINGS | exposed reward/input/UI feel problems; therefore DRAFT was not approved at that point |
| Feel correction exact-revision audit | COMPLETE | exact-revision browser/video audit + manual artifact review passed on the audited product tree |
| Second repeated hands-on | COMPLETE WITH FINDINGS | repeated-use feedback exposed narrow UI/feel issues; no economy/content expansion was justified |
| Post-hands-on follow-up polish | COMPLETE | transition/input/resize/error-state fixes plus reward continuity, `pouch-grab`, stronger rarity hierarchy and semantic reward colors were independently audited and merged |
| Final hands-on acceptance | COMPLETE WITH FINDINGS | direct play exposed rarity-badge styling, reward overflow, Charged denial drift, Signal/Secret clarity and completed-collection Signal-value issues |
| Final hands-on correction + Signal Overcharge | COMPLETE | implemented and exact-audited |
| Final direct repeated-use regression | COMPLETE | accepted after stale Overcharge reward-tag tween lifecycle race was fixed; exact fixed-tree regression and manual artifact review passed |
| Secret correction + merged-main regression | COMPLETE | Save V4 / fixed `+40` Secret jackpot / persistent Secret presentation merged and regression-reviewed |
| Result choreography correction | COMPLETE | merged after targeted Chromium evidence + manual review of Secret↔standard carousel chrome, dense reward bounds, real pre-reveal Signal-lock consumption, and Charged aura exit/teardown |
| Directed onboarding implementation | COMPLETE | PR #149 merged after full CI and independent compatibility/recovery review |
| Directed onboarding hands-on | OPEN | verify first landing, pointer readability, first result collection guidance, refresh/recovery and first-Charged emphasis at real speed |
| Real Yandex DRAFT | OPEN | next external gate after onboarding hands-on; actual Yandex SDK/storage/ad/device lifecycle remains unproven until hosted validation |

Technical green ≠ visual approved ≠ hands-on approved ≠ hosted-platform approved.

---

## Explicitly parked / excluded

PARKED:

- timed Basic charges/energy;
- offline income;
- collection passive CHIPS production;
- Archive levels;
- upgrade/set-bonus trees;
- separate shop;
- multiple spendable currencies;
- multi-standard collectible drops;
- auto-open/x5;
- prestige;
- crafting/merge;
- family-targeted pouch;
- odds/Drop-info drawer until hosted/player evidence.

LOCKED OUT unless direction changes materially:

- trading/market;
- crash/double/jackpot/betting framing;
- large minigame suite;
- real-time 3D inspection/world;
- feature-count arms race.

---

## Current stage

> **GO: run direct onboarding hands-on acceptance on the merged PR #149 runtime. If that passes, proceed to real Yandex DRAFT validation. Do not add new pouch/content/meta scope before those gates.**
