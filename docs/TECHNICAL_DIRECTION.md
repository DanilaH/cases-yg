# Technical direction

## 1. Stack — LOCKED

Current stack:

- **Phaser 4.2.1**;
- **Vite**;
- **strict TypeScript**;
- **Yandex Games SDK** behind thin platform adapters.

No React runtime. Physics, backend, ECS and real-time 3D stay out unless a concrete future requirement justifies them.

Target platforms: Desktop + Mobile landscape.

---

## 2. Current architecture state

Gameplay Loop Lite V2 is implemented. The architecture already contains the scale boundaries required before content expansion:

- typed Basic/Charged pouch profiles;
- global CHIPS wallet;
- independent base/cache reward resolution;
- automatic duplicate recycle;
- 4-segment Signal pity;
- Drop/loot-pool-aware content selection;
- versioned save migration;
- recoverable atomic cost/reward transaction;
- presentation separated from durable economy mutation.

The next technical work is **hosted validation**, not another architecture layer.

---

## 3. Scenes

Keep:

```text
BootScene
OpeningScene
CollectionScene
```

Reveal remains inside `OpeningScene` for physical continuity.

Opening owns:

- pouch interaction;
- CHIPS/Signal HUD;
- Basic/Charged selection and affordability;
- cache/recycle/Charged-ready presentation;
- result/carousel interaction.

There is no `ShopScene`. Drop selector remains hidden while there is one production Drop.

---

## 4. Current source boundaries

Relevant structure:

```text
src/
  game/
    scenes/
      BootScene.ts
      OpeningScene.ts
      CollectionScene.ts
    systems/
      drops.ts
      pouches.ts
      openingEconomy.ts
      openingSession.ts
      save.ts
      signal.ts
      collection.ts
      layout.ts
      audio.ts
    data/
      collectibles.ts
      balance.ts
      presentation.ts
    ui/
      openingVisuals.ts
      openingEconomyVisuals.ts
      staticArt.ts
  platform/
    yandex.ts
    storage.ts
    analytics.ts
    ads.ts
    activity.ts
  debug/
  i18n/
  main.ts
```

Keep domain logic in pure systems/data modules. Scene code may orchestrate presentation but should not become the source of truth for economy or persistence.

---

## 5. Content registry / loot pools

Current registry is explicitly loot-pool-aware.

Invariants:

- each family/collectible resolves to a loot pool;
- save stores active loot-pool identity;
- Basic/Charged roll only inside active pool;
- Signal finds missing standard candidates only inside that pool and selected-pouch eligibility;
- zero-weight rarities are never bypassed by pity;
- CHIPS/Signal are global;
- adding Drop #2 should primarily be data/config work.

Do not build player-facing Drop selection until multiple real Drops exist.

---

## 6. Typed balance — CURRENT PROVISIONAL CONFIG

`LITE_V2_BALANCE` is the single current tuning source.

Pouch profile semantics:

```ts
interface PouchProfile {
  chipsCost: number;
  baseChipsReward: ChipsRange;
  cacheTiers: readonly ChipsCacheTier[];
  rarityWeights: Readonly<Record<StandardRarity, number>>;
  hiddenPocketChance: number;
}
```

Current structural values:

- Signal threshold: `4`;
- Hidden Pocket start opening: `4`;
- duplicate recycle C/R/E/L: `2 / 4 / 8 / 15`;
- Basic cost/base: `0`, `6–10`;
- Basic rarity C/R/E/L: `72 / 25 / 3 / 0`;
- Basic Hidden Pocket: `1.5%`;
- Charged cost/base: `60`, `18–24`;
- Charged rarity: `35 / 40 / 20 / 5`;
- Charged Hidden Pocket: `6%`.

Cache configuration:

```text
Basic weights:   none 90 / cache 7 / big 2.5 / mega 0.5
Charged weights: none 78 / cache 15 / big 5.5 / mega 1.5
Rewards:         none 0 / cache 20–35 / big 45–75 / mega 120–180
```

These numbers are centralized and intentionally provisional. Hands-on/content-scale simulation may tune them without changing APIs or transaction shape.

---

## 7. Save state and migration

Current save is versioned (`SAVE_VERSION = 2`) and provider-agnostic behind `StorageAdapter`.

Current state includes conceptually:

```ts
interface SaveState {
  version: 2;
  discoveredStandard: string[];
  discoveredSecrets: string[];
  chips: number;
  signal: number; // 0..4
  activeLootPoolId: string;
  totalOpens: number;
  pendingReveal: PendingReveal | null;
  muted: boolean; // compatibility field; runtime preference is separated
  stats: {
    duplicates: number;
    hiddenPockets: number;
  };
}
```

Legacy pre-Lite state migrates forward rather than being wiped.

Legacy Signal mapping:

```text
min(4, floor(oldSignal / 25))
```

Migration is validated at boundary values and must remain idempotent.

---

## 8. Atomic reveal contract — CRITICAL

`pendingReveal` predetermines the complete economic outcome before visual presentation.

It retains:

```text
transaction id
base total opens
pouch type
loot pool id
opening number
standard result
base/cache/recycle CHIPS transition
Signal transition
Hidden Pocket result
final commit snapshot
```

Invariants:

- no reroll on refresh;
- no cache reroll;
- Charged cost and reward are one transaction;
- no duplicate base/cache/recycle grant;
- retained/consumed Signal outcome cannot change during recovery;
- original pouch profile/loot pool survive recovery;
- presentation tweens never determine durable state.

`OpeningSession` additionally handles ambiguous storage failures: after a failed write promise, it reloads durable state and accepts success only when the persisted transaction/snapshot exactly matches the deterministic expected result.

---

## 9. Signal resolver

Current resolver behavior:

1. detect armed state (`4/4`);
2. collect missing standard items in active pool;
3. filter by selected pouch non-zero rarity weights;
4. if candidates exist, preserve selected-pouch rarity weighting, guarantee NEW and consume lock;
5. if none exist, perform normal selected-pouch roll and retain lock.

Basic Legendary weight is zero, so pity never leaks Legendary into Basic.

This is the only active Signal model; the old 0–100 weighted runtime no longer exists except as migration input compatibility.

---

## 10. Opening presentation boundary

Presentation sequence is orchestrated by `OpeningScene`, but durable economy is already stored in pending transaction data.

Conceptually:

```text
persist pending transaction
→ tear
→ base CHIPS
→ optional cache beat
→ standard reveal
→ optional recycle + Signal
→ optional Hidden Pocket
→ optional Charged-ready milestone
→ commit/render result
```

Resource animations are bounded visual samples. A `+150` result never requires 150 economic sprites.

The Charged-ready threshold beat is awaited long enough to be perceptible before result re-render; this is presentation timing only, not an economy delay contract.

---

## 11. UI implementation

CHIPS identity and Charged aura are currently Phaser Graphics/shape implementations in `openingEconomyVisuals.ts`; no dedicated CHIPS raster or second Charged pouch raster set is required.

Responsive strategy remains:

```text
logicalHeight = 720
logicalWidth = clamp(viewportAspect * 720, 900, 1728)
```

Critical compact states (`900/1024`) and RU copy are covered by browser audits.

---

## 12. Yandex boundary

`platform/yandex.ts` owns SDK boot/capabilities and lifecycle mapping. Storage, ads, analytics and gameplay activity remain behind adapters.

The local implementation gate is complete, but a **real hosted Yandex DRAFT** is still required for:

- actual `/sdk.js` boot and `LoadingAPI.ready()` timing;
- hosted safe storage;
- platform pause/resume/audio;
- real ad no-fill/throttle/close behavior;
- interrupted Basic/Charged recovery;
- Metrica visibility where configured.

Do not infer hosted correctness from local CI.

---

## 13. Ads / debug reward

Advertising remains behind `platform/ads.ts`.

Locked rules:

- scenes do not call Yandex ad APIs directly;
- interstitial outside active reveal;
- rewarded is voluntary;
- reward persists exactly once;
- ad failure never blocks gameplay;
- fullscreen/rewarded pause gameplay/audio correctly.

The current debug rewarded probe grants CHIPS, not Signal. Public rewarded value/cadence remains release tuning.

---

## 14. Analytics

Keep semantic events provider-independent. Analytics failure cannot block gameplay/reward.

Useful Lite V2 semantics include pouch type, CHIPS/cache/recycle outcomes, Signal reach/wait/consume, Charged readiness/opening and Hidden Pocket. Do not instrument individual presentation particles as economy events.

---

## 15. Asset loading

Current catalog can preload safely:

- 10 collectible textures;
- current pouch layers;
- Opening/Collection environments;
- current SFX set.

Release-scale loading strategy remains a profiling decision after actual content expansion. Do not build streaming infrastructure based on hypothetical texture counts.

---

## 16. Validation state

Current merged tree has passed:

- `npm ci`;
- strict typecheck;
- `87/87` Vitest tests;
- asset self-test/validation;
- production build;
- exact-revision browser audit + manual artifact review;
- post-merge CI.

The next gate is direct repeated hands-on. After acceptance, execute `YANDEX_SLICE_VALIDATION.md` in a real hosted draft.

---

## 17. Engineering guardrails

Do not introduce by default:

- React/state framework;
- ECS;
- physics;
- backend/websockets;
- generalized multi-currency economy framework;
- shop scene;
- timers/offline scheduler;
- real-time 3D;
- content CMS/server;
- abstractions for parked Overcharge/Archive/prestige ideas.

Build new architecture only for a measured requirement, not for speculative flexibility.
