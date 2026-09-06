# Decision ledger

This file is the canonical decision ledger for the current project state.

Status meanings:

- **LOCKED** — source of truth unless new evidence invalidates it.
- **CURRENT RUNTIME** — implemented behavior in current `main`.
- **COMPLETE** — implementation/asset work is integrated and has passed its technical gate.
- **OPEN FOR TUNING** — implemented concept; numbers/pacing may change from evidence.
- **OPEN FOR RELEASE** — deliberately deferred until larger content scale exists.
- **HYPOTHESIS** — useful working assumption, not a commitment.
- **PARKED** — not current scope; revisit only for a proven problem.
- **LOCKED OUT** — excluded unless product direction changes materially.

---

## Product / staging

| Decision | Status | Current answer |
|---|---|---|
| Platform | LOCKED | Yandex Games |
| Engine | LOCKED | Phaser 4.2.1 + Vite + strict TypeScript |
| Theme | LOCKED | Y2K / retro pocket gadgets |
| Core fantasy | LOCKED | Open tiny mystery tech and build a visible nostalgic collection |
| Core loop | CURRENT RUNTIME | **Basic → collectible + CHIPS → duplicate recycle + SIGNAL → Charged → better roll → repeat** |
| Current stage | LOCKED | Lite V2 implementation + exact-revision visual gate are complete; **direct 20–50 opening hands-on is next**, then real Yandex DRAFT |
| Two-family build | CURRENT RUNTIME | private development base: Digital Camera + Flip Phone, 4 standard rarities each + 2 Secrets |
| Public content direction | LOCKED | materially expand after hands-on + hosted draft validation |
| Expansion organization | LOCKED | themed Drops/loot pools; no global mega-pool |
| Public family count | OPEN FOR RELEASE | choose from measured art throughput/quality; no arbitrary commitment |
| Production philosophy | LOCKED | low production burden, repeatable content factory, minimal gameplay-system count |

---

## Gameplay Loop Lite V2

| Decision | Status | Current answer |
|---|---|---|
| Basic Pouch | CURRENT RUNTIME | free/unlimited; one standard collectible + guaranteed base CHIPS + independent cache roll + optional Hidden Pocket |
| CHIPS | CURRENT RUNTIME | one global spendable currency used for Charged Pouch |
| CHIPS HUD | COMPLETE | persistent counter with bounded token presentation/flight |
| CHIPS cache | CURRENT RUNTIME | independent `none/cache/big/mega` bonus roll; collectible rarity and cache luck are separate axes |
| Charged Pouch | CURRENT RUNTIME | selected directly from Opening; costs CHIPS; no shop scene |
| Charged reward | CURRENT RUNTIME | one standard collectible, stronger CHIPS/cache profile, stronger Rare/Epic profile, Legendary access, higher Hidden Pocket chance |
| Charged selection continuity | CURRENT RUNTIME | remains selected across repeated openings while still affordable; falls back to Basic when not affordable |
| Charged-ready milestone | COMPLETE | threshold crossing produces a visible `CHARGED POUCH READY` beat before result transition |
| Charged economy invariant | LOCKED | expected CHIPS return stays below cost; rare jackpots may fund several future Charged openings |
| Multi-standard drops | LOCKED OUT | not in Lite V2 |
| Duplicate behavior | CURRENT RUNTIME | automatic `DUPLICATE → RECYCLED → CHIPS + SIGNAL` |
| Signal | CURRENT RUNTIME | non-spendable duplicate pity, separate from CHIPS |
| Signal rule | CURRENT RUNTIME | duplicate `+1`; `4/4` arms lock; next selected-pouch-eligible NEW is guaranteed; consume → `0/4` |
| Legacy Signal migration | CURRENT RUNTIME | `min(4, floor(oldSignal / 25))` |
| Complete Drop + armed Signal | CURRENT RUNTIME | lock remains armed if no undiscovered eligible standard item exists |
| Basic-only zero-eligible edge | CURRENT RUNTIME | if only Legendary remains, Basic resolves normally and Signal stays `4/4`; UI communicates `SIGNAL LOCK · CHARGED` |
| Reward sequencing | CURRENT RUNTIME | tear → CHIPS/cache → standard → NEW/recycle → optional Hidden Pocket → resources/result |
| No fake economy choice | LOCKED | duplicate recycle is automatic; meaningful spend choice is Basic vs Charged |

### Current provisional balance

These values are implemented in typed config and are **OPEN FOR TUNING**, not release-locked.

| Value | Basic | Charged |
|---|---:|---:|
| Cost | `0` | `60` |
| Base CHIPS | `6–10` | `18–24` |
| Cache weights `none/cache/big/mega` | `90 / 7 / 2.5 / 0.5` | `78 / 15 / 5.5 / 1.5` |
| Cache payouts | `0 / 20–35 / 45–75 / 120–180` | same ranges |
| Rarity weights C/R/E/L | `72 / 25 / 3 / 0` | `35 / 40 / 20 / 5` |
| Hidden Pocket from opening #4 | `1.5%` | `6%` |

Duplicate recycle CHIPS by rarity: `2 / 4 / 8 / 15` for Common/Rare/Epic/Legendary.

Onboarding protection: first 3 standard openings protected where eligible; opening #2 prefers the other family when possible.

Current deterministic economy analysis gives Charged an expected all-duplicate CHIPS return of about `35.3` against cost `60`, so the sink invariant currently holds. Hands-on/content-scale simulation may change the numbers without changing the loop contract.

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
| Drop size | HYPOTHESIS | roughly 3–5 families per Drop as a starting heuristic |
| Family targeting | PARKED | add only if real completion data proves Drop-level targeting insufficient |

Candidate future families remain MP3 player, pager, mini camcorder, handheld console, PDA, portable disc/MiniDisc-like player, pocket radio, virtual-pet-like electronics and other suitable Y2K archetypes.

---

## Core UX

| Decision | Status | Current answer |
|---|---|---|
| Package | CURRENT RUNTIME | silver/translucent-lavender anti-static / foil Mystery Pouch |
| Tear | CURRENT RUNTIME | one short deterministic left-to-right star-tab drag |
| Reveal | CURRENT RUNTIME | stable pouch→reward layering; collectible becomes final hero |
| Result hold | CURRENT RUNTIME | at least ~0.6 s; no timer auto-dismiss |
| Reward CTA | CURRENT RUNTIME | explicitly actionable after hold; tap/click continues |
| CHIPS token | CURRENT RUNTIME | Phaser-rendered reusable chip identity; no dedicated raster required |
| Charged presentation | CURRENT RUNTIME | reuse pouch art + runtime aura/accent/treatment |
| Quick Reveal | PARKED | add only if repeated hands-on proves pacing friction |
| Scenes | LOCKED | `BootScene`, `OpeningScene`, `CollectionScene` |
| Responsive | CURRENT RUNTIME | landscape adaptive, logical height 720, coherent 900–1728 logical width |
| Audio | CURRENT RUNTIME | existing SFX set + persistent mute; no new CHIPS/Charged cue currently required |
| Localization | CURRENT RUNTIME | RU + EN typed strings, EN fallback, no baked gameplay text |

---

## Rarity / Hidden Pocket

| Decision | Status | Current answer |
|---|---|---|
| Standard rarity ladder | LOCKED | Common → Rare → Epic → Legendary |
| Basic rarity access | CURRENT RUNTIME | Common/Rare/Epic; Legendary weight `0` |
| Charged rarity access | CURRENT RUNTIME | Common/Rare/Epic/Legendary; materially stronger top-end profile |
| Hidden Pocket role | LOCKED | rare automatic Secret second beat outside standard rarity ladder |
| Basic Secret access | CURRENT RUNTIME | possible from opening #4 at current 1.5% profile while an undiscovered Secret exists |
| Charged Secret access | CURRENT RUNTIME | current 6% profile from opening #4 while an undiscovered Secret exists |
| Secret duplicates | OPEN FOR RELEASE | current two-family slice has no Secret duplicate loop |

---

## Persistence / architecture

| Decision | Status | Current answer |
|---|---|---|
| Save | CURRENT RUNTIME | versioned local-first state behind injected `StorageAdapter` |
| Save version | CURRENT RUNTIME | V2 fields include CHIPS, segmented Signal, active loot pool and pending Lite reveal |
| Anti-reroll | CURRENT RUNTIME | full `pendingReveal` persisted before presentation and committed once |
| Lite transaction | CURRENT RUNTIME | Charged cost + base/cache/recycle + Signal + collectible + Hidden Pocket are one recoverable transaction |
| Save migration | CURRENT RUNTIME | legacy slice saves migrate forward without wiping collection progress |
| Data-driven content | CURRENT RUNTIME | family/collectible/loot-pool IDs and pouch balance profiles come from config/registry |
| Asset loading | CURRENT RUNTIME | current small catalog preloads; release strategy waits for real expanded-catalog profiling |
| React / physics / backend | LOCKED OUT | do not add without a concrete need |

---

## SDK / ads / analytics

| Decision | Status | Current answer |
|---|---|---|
| Yandex SDK | CURRENT RUNTIME | thin platform adapter |
| Ads | CURRENT RUNTIME | SDK-only; interstitial outside active reveal; rewarded voluntary/exactly-once; pause/resume safe |
| Rewarded dev probe | CURRENT RUNTIME | clearly dev-only CHIPS grant; pity state is not manipulated |
| Public monetization tuning | OPEN FOR RELEASE | choose actual reward/cadence/sticky use after loop/content validation |
| Analytics | CURRENT RUNTIME | provider-independent semantic events + Yandex Metrica adapter; failure never blocks game |
| Real hosted validation | OPEN | Yandex DRAFT remains required; local CI cannot complete this gate |

---

## Visual QA / acceptance workflow

| Decision | Status | Current answer |
|---|---|---|
| Technical green | COMPLETE | current merged Lite V2 revision passes typecheck, 87 tests, assets and build |
| Exact-revision browser audit | COMPLETE | critical Basic/Charged/cache/recycle/Signal/Hidden/recovery/responsive states captured and reviewed |
| Post-merge CI | COMPLETE | merged Lite V2 + Charged-ready correction are green |
| User repeated hands-on | OPEN | current decisive gate for tactile feel, pacing, fatigue and reward satisfaction |
| Real Yandex DRAFT | OPEN | next gate after hands-on acceptance |

Technical green ≠ visual approved ≠ hands-on approved ≠ hosted-platform approved.

---

## Explicitly parked / excluded

PARKED:

- timed Basic charges/energy;
- offline income;
- collection passive CHIPS production;
- Overcharge;
- Archive levels;
- collection upgrade/set-bonus trees;
- separate shop;
- multiple spendable currencies;
- multi-standard collectible drops;
- auto-open/x5;
- prestige;
- crafting/merge;
- Daily Spotlight/shelf evolution unless evidence gives them a concrete job.

LOCKED OUT unless direction changes materially:

- trading/market;
- crash/double/jackpot/betting framing;
- large minigame suite;
- real-time 3D inspection/world;
- feature-count arms race.

---

## Current stage

> **GO: direct repeated Lite V2 hands-on. If accepted, run real Yandex DRAFT validation. Do not expand content or add meta systems before those gates.**
