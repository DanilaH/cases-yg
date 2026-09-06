# Decision ledger

This file is the canonical decision ledger.

Status meanings:

- **LOCKED** — source of truth unless new evidence invalidates it.
- **LOCKED TARGET** — agreed next implementation behavior; current runtime may still be on the pre-migration behavior until the corresponding pass lands.
- **LOCKED FOR RELEASE ARCHITECTURE** — must scale correctly from the start because later content depends on it.
- **OPEN FOR TUNING** — concept is decided; numbers/pacing remain to be tuned.
- **OPEN FOR RELEASE** — deliberately deferred until larger content scale exists.
- **PARKED** — not part of current scope; may return only if evidence gives it a concrete job.
- **LOCKED OUT** — excluded unless product direction changes materially.

---

## Product / staging

| Decision | Status | Current answer |
|---|---|---|
| Platform | LOCKED | Yandex Games |
| Engine | LOCKED | Phaser 4.2.1 + Vite + strict TypeScript |
| Theme | LOCKED | Y2K / retro pocket gadgets |
| Core fantasy | LOCKED | Open tiny mystery tech and build a visible nostalgic collection |
| Core physical loop | LOCKED | tear pouch → reveal reward → rarity/new/duplicate feedback → collection/progress → repeat |
| Next gameplay loop | LOCKED TARGET | **Basic → collectible + CHIPS → duplicate recycle + SIGNAL → Charged Pouch → better roll → repeat** |
| Current stage | LOCKED | Implement Gameplay Loop Lite V2 on top of the visually accepted two-family opener, then hands-on, then real Yandex DRAFT |
| Two-family build | LOCKED | private development base only; Digital Camera + Flip Phone, 4 standard rarities each + 2 Secrets |
| Public content direction | LOCKED | materially expand beyond two families after Lite V2 + hosted draft validation |
| Expansion organization | LOCKED FOR RELEASE ARCHITECTURE | themed Drops/loot pools; do not grow one global mega-pool |
| Public family count | OPEN FOR RELEASE | choose from measured art throughput/quality; no arbitrary ~24 commitment |
| Production philosophy | LOCKED | low production burden, repeatable content factory, minimal gameplay-system count |

---

## Gameplay Loop Lite V2

| Decision | Status | Current answer |
|---|---|---|
| Basic Pouch access | LOCKED TARGET | free/unlimited; no timer/energy in Lite V2 |
| Basic reward | LOCKED TARGET | one standard collectible + small CHIPS reward + optional Hidden Pocket |
| CHIPS | LOCKED TARGET | one global spendable currency used for Charged Pouch |
| CHIPS HUD | LOCKED TARGET | persistent compact counter; reward tokens visibly fly into it after reveal resolution |
| Charged Pouch | LOCKED TARGET | bought with CHIPS directly from Opening UI; no store scene |
| Charged reward | LOCKED TARGET | one standard collectible, larger CHIPS payout, better rarity profile, higher Hidden Pocket chance |
| Multi-standard drops | LOCKED OUT FOR LITE | no 2–3 normal collectibles from one pouch; multi-reward feel comes from CHIPS + hero collectible + optional Secret |
| Duplicate behavior | LOCKED TARGET | automatic `DUPLICATE → RECYCLED → CHIPS + SIGNAL`; no manual sell choice |
| Duplicate CHIPS | OPEN FOR TUNING | rarity-dependent small rebate; exact values TBD |
| Signal purpose | LOCKED | non-spendable duplicate pity, separate from CHIPS |
| Signal Lite rule | LOCKED TARGET | any standard duplicate `+1`; `4/4` arms SIGNAL LOCK; next standard collectible is undiscovered in active Drop; consume → `0/4` |
| Complete Drop + armed Signal | LOCKED TARGET | lock is not wasted/consumed if active Drop has no undiscovered standard item |
| Charged cost | OPEN FOR TUNING | exact CHIPS price TBD |
| Basic/Charged CHIPS payout | OPEN FOR TUNING | exact values TBD |
| Charged rarity weights | OPEN FOR TUNING | must be meaningfully better than Basic; exact table TBD |
| Basic/Charged Hidden Pocket | OPEN FOR TUNING | Charged must be meaningfully higher; exact probabilities TBD |
| Reward sequencing | LOCKED TARGET | tear → CHIPS presentation → one collectible → NEW/recycle → optional Hidden Pocket → resource transfer → result ready |
| No fake economy choice | LOCKED | duplicate recycle is automatic; CHIPS spending choice is Basic vs Charged, not “sell or keep duplicate” |

### Current runtime migration note

Current `main` still uses the pre-Lite Signal model: threshold 100 with rarity-dependent duplicate gains and the existing slice late-lock behavior. That remains runtime truth until implementation changes it. The Lite decision above is the **superseding target**; do not keep both models after migration.

---

## Content growth / Drops

| Decision | Status | Current answer |
|---|---|---|
| Loot pool identity | LOCKED TARGET | families/collectibles carry `dropId` / `lootPoolId` data |
| Active Drop | LOCKED TARGET | Basic/Charged/Signal resolve inside active Drop |
| One-Drop UI | LOCKED | selector hidden while only one Drop exists |
| Multi-Drop UI | OPEN FOR RELEASE | reveal a compact selector once Drop #2 exists; no separate complex world/map required |
| Wallet across Drops | LOCKED | CHIPS global |
| Signal across Drops | LOCKED | Signal meter global, but lock targets undiscovered standard item inside active Drop |
| Drop size | HYPOTHESIS | roughly 3–5 families per Drop is a useful starting heuristic, not a hard rule |
| Family targeting | PARKED | add only if real completion data shows Drop-level targeting is insufficient |

Candidate future families remain MP3 player, pager, mini camcorder, handheld console, PDA, portable disc/MiniDisc-like player, pocket radio, virtual-pet-like electronics and other suitable Y2K archetypes.

---

## Core UX

| Decision | Status | Current answer |
|---|---|---|
| Package | LOCKED | silver/translucent-lavender anti-static / foil Mystery Pouch |
| Tear | LOCKED | one short deterministic left-to-right drag using star tear-tab; no physics/multistage unpacking |
| Reveal | LOCKED | existing stable pouch→reward layering, runtime FX, collectible becomes final hero |
| Result hold | LOCKED | at least ~0.6 s; no timer auto-dismiss |
| Reward CTA | LOCKED | result becomes explicitly actionable after hold; tap/click continues |
| Quick Reveal | PARKED | add only if repeated Lite V2 hands-on proves full reveal pacing is friction |
| Scenes | LOCKED | `BootScene`, `OpeningScene`, `CollectionScene`; reveal remains inside Opening |
| Responsive | LOCKED | landscape adaptive layout, logical height 720, coherent 900–1728 logical width |
| Audio | LOCKED | SFX-only is sufficient; persistent mute |
| Localization | LOCKED FOR RELEASE ARCHITECTURE | RU + EN typed strings, EN fallback, no text baked into gameplay art |

---

## Rarity / Hidden Pocket

| Decision | Status | Current answer |
|---|---|---|
| Standard rarity ladder | LOCKED | Common → Rare → Epic → Legendary |
| Current Basic baseline | OPEN FOR TUNING | current slice 60/28/10/2 is acceptable starting profile; rebalance with Lite hands-on/content scale |
| Current onboarding | LOCKED TARGET | preserve first 3 standard openings as undiscovered variants; #2 opposite family where possible |
| Hidden Pocket role | LOCKED | rare automatic Secret second beat |
| Current slice Hidden Pocket | CURRENT RUNTIME | disabled openings 1–3; 3% from #4 while undiscovered Secret remains |
| Lite Hidden Pocket profiles | OPEN FOR TUNING | Basic lower; Charged meaningfully higher |
| Secret duplicate behavior | OPEN FOR RELEASE | current two-family slice has no Secret duplicates; re-evaluate with expanded Secret pool |

---

## Collection

| Decision | Status | Current answer |
|---|---|---|
| Core roles | LOCKED | Shelf = attractive best finds; Library = exhaustive ownership/completion view |
| Current slice | LOCKED | Camera + Flip Phone presentation is valid for current content |
| Release grouping | LOCKED DIRECTION | Drops become the first high-level grouping primitive |
| Release pages/filtering | OPEN FOR RELEASE | add only when actual roster density requires it |
| Targeted acquisition | PARKED | not part of Lite V2 |

---

## Art / assets

| Decision | Status | Current answer |
|---|---|---|
| Rendering | LOCKED | stylized painted 2D/2.5D |
| Brand/IP rule | LOCKED | recognizable archetypes; no logos/model names/unnecessary 1:1 copies |
| Family production rule | LOCKED | ~6–10 explorations → one canonical master → standard rarity derivations |
| Runtime collectible export | LOCKED | individual 1024×1024 transparent WebP; aspect ratio preserved |
| Current collectible set | COMPLETE | Camera + Flip Phone standard rarities + Secrets are integrated and enabled |
| Current environment/SFX | COMPLETE | Opening/Collection environment art and current SFX set are integrated |
| Pouch runtime | LOCKED CURRENT | body + star-tab + **compact authored tear strip**; layers use independent presentation transforms, not a required same-canvas registration contract |
| Lite CHIPS visual asset | LOCKED TARGET | one small reusable CHIPS token/icon asset or equivalent reviewed vector; used for HUD identity + reward particles |
| Charged pouch art | LOCKED TARGET | reuse current pouch art with runtime Charged treatment first; no mandatory second pouch raster set |
| Lite new SFX | MINIMAL TARGET | prefer reuse/synth where good; add only a concise CHIPS collect/transfer cue and Charged-ready cue if existing sounds cannot sell the feedback |

---

## Persistence / architecture

| Decision | Status | Current answer |
|---|---|---|
| Save | LOCKED | local-first, versioned, injected `StorageAdapter`; Yandex runtime uses safe storage |
| Anti-reroll | LOCKED | full `pendingReveal` persisted before presentation and committed once |
| Lite transaction | LOCKED TARGET | Charged cost + CHIPS payouts + recycle + Signal + collectible + Hidden Pocket are one recoverable atomic transaction |
| Save migration | LOCKED TARGET | existing slice saves migrate forward; do not wipe progression merely to add CHIPS/Drop fields |
| Data-driven content | LOCKED FOR RELEASE ARCHITECTURE | family/collectible/drop IDs and balance profiles come from config/registry |
| Asset loading | LOCKED CURRENT | current small catalog can preload; release loading strategy waits for real expanded catalog profiling |
| React / physics / backend | LOCKED OUT BY DEFAULT | no React runtime, physics or backend without a concrete need |

---

## SDK / ads / analytics

| Decision | Status | Current answer |
|---|---|---|
| Yandex SDK | LOCKED FOR RELEASE ARCHITECTURE | thin platform adapter |
| Ads | LOCKED | SDK-only; interstitial outside active reveal; rewarded voluntary/exactly-once; pause/resume safe |
| Legacy rewarded probe | MIGRATE WITH LITE | old dev-only `+25 Signal` probe becomes invalid after 4-segment Signal; switch technical rewarded probe to a clearly dev-only CHIPS grant |
| Public monetization tuning | OPEN FOR RELEASE | choose actual rewarded value/cadence/sticky use after Lite + expanded content |
| Analytics | LOCKED | provider-independent semantic events + Yandex Metrica adapter; failure never blocks game |

---

## Visual QA / acceptance workflow

| Decision | Status | Current answer |
|---|---|---|
| Acceptance states | LOCKED | technical green ≠ visual approved ≠ hands-on approved |
| Static visual gate | LOCKED | visual/layout changes require real screenshots of exact candidate revision |
| Motion visual gate | LOCKED | animation/interaction/effect changes require video or dense frame sequence |
| Artifact review | LOCKED | generated captures do not pass themselves; reviewer must inspect them |
| Exact-revision rule | LOCKED | approval must match the revision intended for merge |
| User hands-on role | LOCKED | final authority for tactile feel, pacing, fatigue and reward satisfaction |
| Merge rule | LOCKED | visual changes merge only after technical + visual gates |

---

## Explicitly parked / excluded from Lite V2

PARKED:

- timed Basic Pouch charges/energy;
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
- Daily Spotlight/shelf evolution unless later evidence gives them a clear job.

LOCKED OUT unless direction changes materially:

- trading/market;
- crash/double/jackpot/betting framing;
- large minigame suite;
- real-time 3D inspection/world;
- feature-count arms race.

---

## Current stage

> **GO: implement Gameplay Loop Lite V2, then run independent visual/interaction review + direct hands-on. If accepted, move to real Yandex DRAFT validation before content expansion.**
