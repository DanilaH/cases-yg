# Implementation roadmap

The project is no longer planned as a tiny public behavioral release. Execution now has four stages:

1. **Internal vertical slice** — make the core game fully playable for direct user review, with Yandex SDK/ads integrated from the start.
2. **User review / correction pass** — fix feel, UX and production-pipeline issues found hands-on.
3. **Content + release build** — scale the roster substantially, rebalance progression and finalize monetization/Collection at release scale.
4. **Release hardening** — store materials, Yandex draft QA, moderation and launch.

The two-family slice is never the public product.

---

# Phase 1 — internal vertical slice

Working target remains roughly **5–8 focused days**, but this is now an internal-development target, not submission-ready timing.

## PR-1 — foundation + production platform boundaries

Build:

- Vite + strict TypeScript;
- Phaser 4.2.1 pinned;
- `BootScene`, `OpeningScene`, `CollectionScene`;
- shared adaptive `LayoutMetrics`;
- content registry that supports arbitrary families;
- Yandex SDK adapter;
- `StorageAdapter` (`ysdk.getStorage()` in Yandex, localStorage fallback locally);
- analytics adapter;
- **ads adapter from day one**;
- local/mock platform implementation;
- dev-only force/debug panel.

Suggested source:

```text
src/
  game/
    scenes/
      BootScene.ts
      OpeningScene.ts
      CollectionScene.ts
    systems/
      drops.ts
      signal.ts
      collection.ts
      save.ts
      layout.ts
      audio.ts
    data/
      collectibles.ts
      balance.ts
      collection-groups.ts
    ui/
  platform/
    yandex.ts
    storage.ts
    analytics.ts
    ads.ts
  i18n/
    en.ts
    ru.ts
  main.ts
```

Ad adapter must cover:

- interstitial;
- rewarded;
- sticky-banner visibility boundary;
- pause/resume cooperation;
- rewarded exactly-once semantics;
- error/no-ad path.

Definition of done: local build and Yandex draft/debug build both boot, resize, persist state, and can deliberately exercise all ad API paths without scenes calling Yandex globals directly.

---

## PR-2 — deterministic reward engine + save transaction

Implement current **slice config**:

- Camera / Flip Phone;
- Common 60 / Rare 28 / Epic 10 / Legendary 2;
- first-three undiscovered protection;
- Signal slice values/rules;
- Hidden Pocket 3% slice rules;
- two slice Secrets;
- `pendingReveal` anti-reroll transaction.

Tests:

- onboarding guarantees;
- probability table shape;
- all Signal paths;
- early/late SIGNAL LOCK;
- Hidden Pocket/Secret uniqueness;
- pending transaction recovery/idempotency;
- arbitrary third mock family can be added through registry without rewriting drop/Collection primitives.

Definition of done: pure engine produces complete `PendingReveal` from config/state without touching Phaser.

---

## PR-3 — OpeningScene + reveal + Hidden Pocket

Implement:

- three-layer pouch composition;
- star-tab drag with generous mobile hit area;
- deterministic tear threshold;
- ~1.0–1.4 s standard reveal;
- runtime rarity FX;
- NEW / duplicate / Signal feedback;
- ~0.6 s minimum result hold;
- tap-to-next after hold;
- Hidden Pocket automatic second beat;
- no reveal skip initially.

Definition of done: 50–100 forced/random opens can be played without stuck input, visible load, rerolls or double commits.

---

## PR-4 — Collection + localization + audio

Internal slice presentation:

- Shelf defaults to Camera + Flip Phone hero display;
- Library renders all slice entries from registry;
- 8/8 standard + Secrets 0/2 counters for slice;
- Collection code uses generic family list/cards, not two-family hard-coded state;
- RU/EN;
- SFX + mute;
- pause/minimize handling.

Definition of done: adding a fake third family in config proves the Collection can scale structurally even if final release layout/grouping is still undecided.

---

## PR-5 — SDK/ads/analytics integration validation + slice polish

Validate in Yandex draft/debug environment:

- `LoadingAPI.ready()` timing;
- gameplay pause/resume lifecycle;
- safe storage and interrupted reveal recovery;
- Metrica events;
- interstitial call and close/error behavior;
- rewarded call, `onRewarded` equivalent handling and exactly-once dev reward;
- sticky banner show/hide API boundary if enabled;
- audio paused throughout full-screen/rewarded ads;
- ad failure cannot deadlock opener.

Dev-only rewarded test may grant `+25 Signal`; production config must not treat that as final economy.

---

## PR-6 — final slice art integration + user-review build

Produce/integrate:

- Camera canonical master + four rarities + Secret;
- Flip Phone canonical master + four rarities + Secret;
- pouch layers;
- Opening background;
- Collection depth layers;
- SFX.

No final store icon/cover/screenshots are required for this internal build.

Slice acceptance is defined in `PROBE_VALIDATION.md`.

---

# Phase 2 — direct user review

Run the slice hands-on and explicitly assess:

- tear gesture feel;
- reveal timing/juice after repeated opens;
- rarity visual hierarchy;
- duplicate/Signal clarity;
- Hidden Pocket surprise;
- Collection payoff/navigation;
- desktop/mobile landscape composition;
- ad pause/resume intrusiveness and technical correctness.

Fix UX/art/technical issues immediately.

This is the checkpoint for deciding Quick Reveal before scaling content.

There is **no public traffic gate** before Phase 3.

---

# Phase 3 — content and release build

## 3.1 Lock release roster

Choose a materially larger set of gadget families using:

- visual desirability;
- silhouette diversity;
- Y2K recognition;
- asset-generation consistency;
- actual measured per-family production burden from Camera/Flip Phone.

Existing candidate pool:

- MP3 player;
- pager;
- mini camcorder;
- handheld console;
- PDA;
- portable disc/MiniDisc-like player;
- pocket radio;
- virtual-pet-like electronic;
- additional discovered archetypes.

Do not artificially cap at the old ~24 if production is cheap; do not chase a number if quality drops. Exact launch family count remains a deliberate release decision.

## 3.2 Content factory

For each approved family:

```text
6–10 explorations
→ canonical master
→ Common / Rare / Epic / Legendary
→ Secret only where the release content plan calls for one
→ cleanup/export/log
```

Batch families and review consistency between batches.

## 3.3 Rebalance progression

Once roster and Secret count are known:

- family/package weighting;
- rarity odds;
- onboarding protection;
- Signal gains/threshold/reward;
- Hidden Pocket chance/reward pool;
- completion expectations;
- duplicate pressure.

Rerun simulation. Slice 60/28/10/2 and 3% Hidden Pocket are not assumed correct at release scale.

## 3.4 Scale Collection

Choose based on real family count:

- themed shelves/collections;
- pages/groups;
- Library density/filtering;
- headline completion semantics;
- Secret presentation;
- whether shelf/environment evolves.

Keep rendering/data generic and navigation fast.

## 3.5 Revisit parked systems

Evaluate only now, with a real large pool:

- Tech Parts / Mod Bench;
- package tiers;
- Daily Spotlight;
- shelf milestones;
- other cheap retention hooks.

Add only systems with a clear job.

## 3.6 Final monetization design

Infrastructure already exists. Now choose:

- rewarded placement + exact reward;
- interstitial logical pause points;
- whether sticky banner is worth the layout cost;
- analytics events/experiments around monetization.

Never place interstitial during active tear/reveal and never make rewarded mandatory for core continuation.

---

# Phase 4 — public release hardening

Only now:

- finalize RU/EN title/metadata;
- produce icon/cover/optional hero from release key visual;
- capture localized release screenshots;
- final asset-memory/loading strategy for expanded catalog;
- moderation viewport/input checks;
- ads in real release configuration;
- save/recovery/lifecycle QA;
- Metrica/product analytics QA;
- Yandex draft/debug pass;
- moderation submission.

Use `YANDEX_SUBMISSION_CHECKLIST.md`.

---

# Roadmap guardrail

The internal slice should stay small, but **the project itself is not a small two-family release**.

Optimize Phase 1 for fast feedback while making only the scale decisions we already know are necessary:

- data-driven family registry;
- scalable Collection primitives;
- configurable balance;
- SDK/storage/analytics/**ads** provider boundaries.

Everything else earns its complexity during Phase 3.
