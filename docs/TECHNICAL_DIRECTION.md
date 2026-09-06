# Technical direction

## 1. Stack — LOCKED

Use:

- **Phaser 4.2.1** pinned in lockfile;
- **Vite**;
- **strict TypeScript**;
- **Yandex Games SDK** behind thin platform adapters.

No React runtime. Physics stays off unless a concrete later mechanic proves it necessary.

Target release platforms: Desktop + Mobile landscape. TV-specific UX is not current scope.

---

## 2. Current architecture goal

The current two-family opener is already a functioning internal base. The next architecture work is narrowly scoped to **Gameplay Loop Lite V2**:

- global CHIPS wallet;
- Basic/Charged pouch profiles;
- automatic duplicate recycle;
- simplified Signal pity;
- Drop/loot-pool-aware reward selection;
- atomic cost/reward recovery.

Do not use this pass as an excuse to introduce a generalized economy framework, ECS, backend or content service.

---

## 3. Scenes

Keep:

```text
BootScene
OpeningScene
CollectionScene
```

Reveal stays inside `OpeningScene` to preserve physical continuity with the pouch.

Lite V2 UI also stays inside the existing scenes:

- CHIPS counter in Opening chrome;
- Basic/Charged choice/ready state in Opening;
- no ShopScene;
- Drop selector remains hidden while there is one Drop;
- Collection remains Shelf/Library and becomes Drop-group-aware only when multiple Drops exist.

---

## 4. Source structure

Current structure remains appropriate:

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
      presentation.ts
    ui/
  platform/
    yandex.ts
    storage.ts
    analytics.ts
    ads.ts
    activity.ts
  i18n/
    en.ts
    ru.ts
  main.ts
```

If a tiny `economy.ts` / `pouches.ts` pure module improves separation during Lite V2, that is acceptable. Do not build an abstract currency subsystem for hypothetical future currencies.

---

## 5. Content registry / Drops — LOCKED TARGET

Content must become explicitly Drop-aware before the catalog expands.

Conceptual types:

```ts
type PouchType = 'basic' | 'charged';

type LootPoolId = string;

interface GadgetFamilyDefinition {
  id: string;
  dropId: LootPoolId;
  nameKey: string;
  standard: Record<StandardRarity, CollectibleDefinition>;
  secrets: CollectibleDefinition[];
}

interface LootPoolDefinition {
  id: LootPoolId;
  familyIds: readonly string[];
}
```

Exact shape may differ from this sketch; the invariants matter:

- every eligible family is resolvable to one Drop/loot pool;
- Basic and Charged take an active `lootPoolId`;
- Signal Lock searches missing standard collectibles only inside that pool;
- CHIPS/Signal remain global state;
- adding Drop #2 is data/config work, not a reward-engine rewrite.

Do not implement player-facing Drop selection until multiple Drops exist.

---

## 6. Balance boundaries — LOCKED TARGET

Keep all numbers in typed config.

Lite V2 needs separate profile/config entries for conceptually:

```ts
interface PouchProfile {
  chipsCost: number;
  chipsReward: /* deterministic/weighted range config */ unknown;
  rarityWeights: Readonly<Record<StandardRarity, number>>;
  hiddenPocketChance: number;
}

interface EconomyBalance {
  signalThreshold: number; // target: 4
  duplicateRecycleChips: Readonly<Record<StandardRarity, number>>;
  pouchProfiles: Readonly<Record<PouchType, PouchProfile>>;
}
```

Do not lock an implementation to the sketch's exact type shape.

Known target semantics:

- Basic cost = 0;
- Charged cost > 0 CHIPS;
- Basic grants CHIPS;
- Charged grants more CHIPS and uses a better rarity/Hidden Pocket profile;
- duplicate recycle CHIPS may scale by rarity;
- Signal increments exactly one segment per duplicate;
- Signal threshold target is 4.

Open tuning values must remain explicit config, not magic constants scattered through scenes.

---

## 7. Persistent state / transaction — CRITICAL

Keep save versioned and provider-agnostic.

Existing state conceptually grows from:

```ts
interface SaveState {
  version: number;
  discoveredStandard: string[];
  discoveredSecrets: string[];
  signal: number;
  totalOpens: number;
  pendingReveal: PendingReveal | null;
  muted: boolean;
  stats: { ... };
}
```

toward Lite V2 fields such as:

```ts
interface SaveState {
  version: number;
  discoveredStandard: string[];
  discoveredSecrets: string[];
  chips: number;
  signal: number; // 0..threshold segments
  activeLootPoolId: string;
  totalOpens: number;
  pendingReveal: PendingReveal | null;
  muted: boolean;
  stats: { ... };
}
```

A migration must initialize new fields for existing saves without deleting collection progress.

### Atomic reveal contract

`pendingReveal` must predetermine the entire economic transaction before presentation.

For Lite V2 it must retain enough information to recover conceptually:

```text
transaction id
base total opens
pouch type
loot pool id
base chips
chips cost
base pouch chips reward
duplicate recycle chips reward
standard collectible
Signal before/after/lock state
Hidden Pocket result
final committed progress/wallet snapshot
```

Critical invariants:

- Charged cost and reward are one transaction;
- crash after choosing Charged cannot lose cost without preserving reward;
- refresh cannot reroll Charged into a better result;
- recovery cannot grant wallet rewards twice;
- visual token flight never owns currency state;
- the transaction keeps the original lootPool/profile even if active UI selection changes later.

Provider remains:

- Yandex runtime: safe storage behind `StorageAdapter`;
- local development: browser `localStorage` fallback.

---

## 8. Signal migration

Current runtime has a 0–100 rarity-weighted Signal implementation.

Lite V2 target replaces it completely:

```text
standard duplicate → +1
4/4 → armed lock
next standard roll → missing standard item in active Drop
consume → 0
```

Implementation rules:

- do not retain late-lock weighted fallback as a second hidden rule;
- if active Drop has no missing standard item, armed lock remains armed and is not consumed;
- if a future Drop selector changes active pool while lock is armed, the lock applies to the newly selected active Drop at roll time;
- new standard item does not add Signal;
- Secret handling stays outside standard Signal unless a later explicit design changes it.

Tests must cover migration from legacy saved Signal values. A deterministic mapping must be chosen during implementation (see `OPEN_QUESTIONS.md`); do not silently reinterpret `75/100` as an arbitrary segment count.

---

## 9. Opening presentation / resource transfer

CHIPS animation is visual feedback, not economy logic.

Recommended structure:

```text
resolve + persist pending transaction
→ play tear
→ show chip reward burst
→ reveal collectible
→ show duplicate recycle if applicable
→ optional Hidden Pocket
→ animate CHIPS/SIGNAL toward HUD
→ commit/show final HUD state
```

Implementation may commit before the visual flight for safety, while tweening the displayed counter from the stored pre-value to the stored final value. The important contract is that stopping a tween cannot change the economic outcome.

Do not instantiate one persisted object per visible chip particle. Particles are presentation instances of an aggregate reward amount.

---

## 10. Yandex SDK boundary

`platform/yandex.ts` continues to own:

- `YaGames.init()`;
- language/environment access;
- safe storage acquisition;
- `LoadingAPI.ready()`;
- `GameplayAPI.start()/stop()` mapping;
- platform pause/resume events;
- capabilities needed by adapters.

After Lite V2 hands-on, run real hosted Yandex DRAFT validation before content expansion.

---

## 11. Advertising boundary

Advertising remains behind `platform/ads.ts`.

Locked behavior remains:

- scenes do not call `ysdk.adv` directly;
- interstitials only at logical pauses outside active tear/reveal;
- rewarded is voluntary and explicit;
- reward grants exactly once only on rewarded completion;
- ad failure never blocks gameplay;
- fullscreen/rewarded pause gameplay/audio correctly;
- pause reasons are coordinated.

### Rewarded dev probe migration

The old `+25 Signal` dev reward was valid only for the old 0–100 slice pity.

After Lite V2 Signal migration, use a clearly dev-only CHIPS grant to test exactly-once rewarded persistence. Do not use rewarded ads to mutate Signal pity just because that was convenient in the old test harness.

Final public rewarded benefit remains open for release tuning.

---

## 12. Analytics

Keep semantic events provider-independent.

Lite V2 should add useful events around:

```text
pouch_open_started { pouchType, lootPoolId }
chips_earned { source, amount }
duplicate_recycled { rarity, chips, signalAfter }
signal_lock_reached
signal_lock_consumed
charged_ready
charged_opened
hidden_pocket_triggered { pouchType, lootPoolId }
```

Do not over-instrument every animation particle. Analytics failure never blocks gameplay/reward.

---

## 13. Responsive layout

Locked strategy remains:

```text
logicalHeight = 720
logicalWidth = clamp(viewportAspect * 720, 900, 1728)
```

Lite V2 UI must preserve the established vertical rhythm:

- CHIPS HUD cannot compete with title/reward hero;
- Charged-ready affordance must fit 900 logical width;
- resource-flight destination must remain stable across resize;
- if resize occurs during result state, wallet/Signal state and Hidden Pocket selected page must remain correct.

---

## 14. Asset loading

Current integrated production assets are small enough to preload:

- 10 collectible textures;
- current pouch layers including compact tear strip;
- Opening/Collection environment layers;
- current SFX set.

Lite V2 adds at most a tiny CHIPS icon/token asset plus optional concise SFX. Charged presentation should reuse current pouch assets with runtime treatment first.

Release-scale loading remains a profiling decision after real content expansion.

---

## 15. Testing requirements

Pure tests must cover at minimum:

- Basic vs Charged profile selection;
- insufficient CHIPS rejects Charged without mutation;
- Charged cost + reward atomicity;
- duplicate recycle CHIPS by rarity config;
- Signal +1 semantics and 4/4 lock;
- lock targets missing standard item in active Drop;
- lock preserved for complete active Drop;
- Drop scoping for Basic/Charged;
- save migration from pre-Lite version;
- pending transaction recovery/idempotency with CHIPS;
- existing Hidden Pocket/onboarding behavior under profiles;
- rewarded dev CHIPS exactly-once path;
- overlapping platform/ad/visibility pause reasons.

Browser visual regression must additionally cover:

- CHIPS token transfer;
- recycle feedback;
- crossing Charged-ready threshold;
- Basic vs Charged presentation;
- Signal segment fill/lock;
- responsive 900/1024/1280/1728 states;
- interrupted/recovered Charged reveal.

---

## 16. Engineering guardrails

Do not introduce by default:

- React;
- Redux/Zustand-style state framework;
- ECS;
- physics;
- backend/websockets;
- generalized economy/currency framework;
- shop scene;
- timers/offline scheduler;
- real-time 3D;
- content CMS/server;
- abstractions for Overcharge/Archive/prestige systems that are not in Lite V2.

Build only the scale boundaries already justified: Drop-aware content, typed pouch profiles, versioned atomic save transactions and provider boundaries.
