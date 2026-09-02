# Decision ledger

This file is the canonical decision ledger. The project now has **three explicit stages**:

1. **INTERNAL SLICE** — Camera + Flip Phone vertical slice used only for developer/user hands-on review and technical validation. It is not a public release.
2. **CONTENT / RELEASE BUILD** — expand the same game substantially with more gadget families, rebalance progression, finish monetization UX and scale Collection.
3. **PUBLIC RELEASE** — Yandex Games submission only after the expanded content build is complete and release QA passes.

Status meanings:

- **LOCKED** — source of truth unless new evidence invalidates it.
- **LOCKED FOR SLICE** — fixed for the internal vertical slice; not automatically final release balance/content.
- **LOCKED FOR RELEASE ARCHITECTURE** — must be designed correctly from the start because the public build will depend on it.
- **OPEN FOR RELEASE** — intentionally deferred until internal feedback/content scale is known.
- **PARKED** — not required for the slice; may return during release expansion.
- **LOCKED OUT** — deliberately excluded unless the product direction changes materially.
- **HYPOTHESIS** — assumption to validate.

---

## Product / staging

| Decision | Status | Current answer |
|---|---|---|
| Platform | LOCKED | Yandex Games |
| Engine | LOCKED | Phaser 4.2.1 + Vite + strict TypeScript |
| Theme | LOCKED | Y2K / retro pocket gadgets |
| Core fantasy | LOCKED | Open tiny mystery tech and build a visible nostalgic collection |
| Core loop | LOCKED | tear package → anticipation/reveal → rarity → new/duplicate progression → collection → repeat |
| Internal slice purpose | LOCKED | private hands-on vertical slice for the user: validate feel, UX, correctness, SDK/ads integration and art pipeline; **do not publish it** |
| Internal slice package model | LOCKED FOR SLICE | one unlimited free Mystery Pouch; no package currency/energy/tier friction while judging the core interaction |
| Internal slice content | LOCKED FOR SLICE | Digital Camera + Flip Phone; 4 standard rarities each + 2 Secrets = 10 collectible assets |
| Public content direction | LOCKED | materially expand beyond two families before release; Camera/Flip Phone are only the first production batch |
| Public family count | OPEN FOR RELEASE | choose after the slice proves the production/art pipeline; previous ~24+ scale may be reconsidered, and a larger set is allowed if quality/throughput support it |
| Candidate expansion families | OPEN FOR RELEASE | MP3 player, pager, mini camcorder, handheld console, PDA, portable disc/MiniDisc-like player, pocket radio, virtual-pet-like electronics, plus additional suitable Y2K gadget archetypes |
| Public package/economy model | OPEN FOR RELEASE | unlimited free vs light soft-currency/access model, package pools/tiers and acquisition pacing are decided together with final content + monetization; do not assume slice unlimited-free rules are final |
| Public balance | OPEN FOR RELEASE | slice odds/Signal/Hidden Pocket values must be re-simulated and rebalanced after final launch content count/package model is chosen |
| Public Collection structure | OPEN FOR RELEASE | scale Shelf/Library for many families; exact grouping/pages/themed shelves depend on launch roster |
| Production philosophy | LOCKED | low production burden per family; scale through a repeatable asset factory rather than feature-heavy gameplay |

---

## Core UX

| Decision | Status | Current answer |
|---|---|---|
| Package | LOCKED | silver/translucent-lavender anti-static / foil Mystery Pouch |
| Tear | LOCKED | one short deterministic left-to-right drag using the star tear-tab; no physics/multistage unpacking |
| Reveal | LOCKED | pouch remains source ~0.3–0.4 s; total standard reveal ~1.0–1.4 s; runtime FX; collectible becomes final hero |
| Result hold | LOCKED | final result stays readable at least ~0.6 s; then tap/click outside navigation advances; no timer auto-dismiss |
| Quick Reveal | PARKED | not needed for initial slice; explicitly review from hands-on repeated-opening feedback and before public release |
| Scenes | LOCKED | `BootScene`, `OpeningScene`, `CollectionScene`; reveal remains a phase inside Opening |
| Responsive | LOCKED | landscape adaptive layout, 16:9 reference, coherent ~5:4–12:5; no fixed-board FIT strategy |
| Audio | LOCKED FOR SLICE | SFX-only + persistent mute; no background music requirement |
| Localization | LOCKED FOR RELEASE ARCHITECTURE | RU + EN typed strings, EN fallback; no text baked into gameplay art |

---

## Slice balance — NOT PUBLIC-LAUNCH BALANCE

| Decision | Status | Current answer |
|---|---|---|
| Standard rarity ladder | LOCKED | Common → Rare → Epic → Legendary |
| Slice odds | LOCKED FOR SLICE | Common 60%, Rare 28%, Epic 10%, Legendary 2% |
| Slice family split | LOCKED FOR SLICE | Camera / Flip Phone 50/50 |
| Slice onboarding | LOCKED FOR SLICE | first 3 standard openings are undiscovered variants; #2 uses opposite family from #1 |
| Signal gains | LOCKED FOR SLICE | Common dup +25, Rare +20, Epic +15, Legendary +10 |
| Early SIGNAL LOCK | LOCKED FOR SLICE | next standard result is one missing non-Legendary variant while any remain |
| Late SIGNAL LOCK | LOCKED FOR SLICE | Rare 60 / Epic 30 / Legendary 10, family 50/50; armed result does not immediately rebuild Signal |
| Hidden Pocket | LOCKED FOR SLICE | disabled openings 1–3; 3% from #4 while an undiscovered Secret remains |
| Secret behavior | LOCKED FOR SLICE | exactly one Camera Secret + one Flip Phone Secret; Hidden Pocket awards an undiscovered Secret; no Secret duplicates |
| Slice completion | LOCKED FOR SLICE | standard 8/8; Secrets 0/2 separately |
| Release rebalance | LOCKED | rerun probability/simulation work when the expanded content roster, package model and progression systems are known |

---

## Art/content system

| Decision | Status | Current answer |
|---|---|---|
| Rendering | LOCKED | stylized painted 2D/2.5D |
| Brand/IP rule | LOCKED | recognizable archetypes; no logos/model names/unnecessary 1:1 copies |
| Family production rule | LOCKED | ~6–10 exploratory candidates → one canonical master → Common/Rare/Epic/Legendary derived from that master |
| Rarity consistency | LOCKED | same geometry/camera/core controls per family; rarity mainly changes material/color/detail hierarchy |
| Secret rule | LOCKED | outside normal rarity ladder; stronger special-edition treatment; can alter ~15–25% of details/geometry |
| Runtime export | LOCKED | transparent 1024×1024 WebP target; source master target 1536×1536 where practical |
| Expansion pipeline | LOCKED FOR RELEASE ARCHITECTURE | content registry, Collection rendering and loaders must accept additional families from data; never hard-code Camera/Flip Phone into core systems |

---

## SDK / ads / analytics

| Decision | Status | Current answer |
|---|---|---|
| Yandex SDK | LOCKED FOR RELEASE ARCHITECTURE | integrate from the first slice behind a thin platform adapter |
| Advertising policy | LOCKED | advertising follows current Yandex Games SDK and moderation requirements by default; platform compliance is not an open product-design question |
| Ads infrastructure | LOCKED FOR RELEASE ARCHITECTURE | implement from the first slice in `platform/ads.ts`: interstitial, rewarded and sticky-banner control boundary |
| Internal ad testing | LOCKED FOR SLICE | test Yandex draft ad lifecycle/callbacks with dev-only hooks; ad failures must never block gameplay/save |
| Rewarded compliance | LOCKED | rewarded is voluntary; UI clearly says an ad will be watched and names the exact reward; reward grants exactly once only after the rewarded callback; close/error without reward grants nothing |
| Interstitial compliance | LOCKED | request only at logical pauses outside active tear/reveal; never use unsafe timer spam; Yandex controls actual display frequency |
| Sticky-banner compliance | LOCKED | if sticky is used, configure it in Yandex Console; if the game controls visibility, enable API-managed sticky-banner mode; banner must not cover required game interaction/UI |
| Ad pause/resume | LOCKED | fullscreen/rewarded ads pause gameplay and all audio; resume only when platform/game state is actually playable |
| Ad state ownership | LOCKED | coordinate platform/ad/visibility/menu pause reasons so duplicate callbacks cannot cause double `start()`, premature resume, or state corruption |
| Internal rewarded test | LOCKED FOR SLICE | a clearly dev-only test reward such as +25 Signal may verify callback/idempotency plumbing only; it is not public economy design |
| Public monetization tuning | OPEN FOR RELEASE | after expanded content/economy exists, choose the most useful compliant placements/reward values and whether sticky is worth using; this is later tuning, not a blocker or architecture question |
| Analytics adapter | LOCKED FOR RELEASE ARCHITECTURE | Yandex built-ins + typed Yandex Metrica gameplay/ad events; analytics failure never blocks gameplay |

---

## Persistence / architecture

| Decision | Status | Current answer |
|---|---|---|
| Save | LOCKED | local-first, versioned, through injected `StorageAdapter`; Yandex runtime uses `ysdk.getStorage()` |
| Anti-reroll | LOCKED | full `pendingReveal` is persisted before presentation and committed once |
| Data-driven content | LOCKED FOR RELEASE ARCHITECTURE | family IDs, variants, rarity data, Collection groups and asset paths come from config/registry rather than two-family conditionals |
| Asset loading | LOCKED FOR SLICE | preload all slice-critical assets because only 10 collectibles exist |
| Release asset loading | OPEN FOR RELEASE | after content expansion, profile and choose preload groups/lazy loading without introducing user-visible waits |
| React / physics / backend | LOCKED OUT BY DEFAULT | no React runtime, no physics, no backend unless a concrete release requirement appears |

---

## Systems deferred to release expansion

These are **not permanently rejected** just because they are absent from the internal slice:

- Tech Parts / Mod Bench;
- package tiers / other light acquisition economy;
- Daily Spotlight;
- shelf/environment progression;
- additional retention systems.

Re-evaluate them after the content roster is larger. Each must solve a concrete retention/economy problem and stay proportional to production cost.

Still locked out unless direction changes materially:

- trading/market;
- crash/double/jackpot/betting framing;
- large minigame suite;
- real-time 3D inspection/world;
- feature-count arms race.

---

## Current stage

> **GO: build the internal vertical slice now, with production-grade SDK/ads/data boundaries.**

The slice is complete when it is stable and good enough for the user's hands-on review. It does **not** need store media, moderation or public behavioral traffic. After sign-off, immediately move into content expansion and release design rather than publishing the two-family build.
