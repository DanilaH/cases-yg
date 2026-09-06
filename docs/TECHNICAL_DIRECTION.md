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
- guaranteed base CHIPS + independent cache bonus resolution;
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

Exact shape may differ; invariants matter:

- every eligible family is resolvable to one Drop/loot pool;
- Basic and Charged take an active `lootPoolId`;
- Signal Lock searches missing standard collectibles only inside that pool and only among rarities eligible for the selected pouch;
- if the selected pouch has no eligible missing item, the resolver must retain the lock rather than bypass rarity gates;
- CHIPS/Signal remain global state;
- adding Drop #2 is data/config work, not a reward-engine rewrite.

Do not implement player-facing Drop selection until multiple Drops exist.

---

## 6. Balance boundaries — LOCKED TARGET

Keep all numbers in typed config.

Lite V2 needs separate pouch profiles for cost, base CHIPS, cache bonus, rarity access/weights and Hidden Pocket chance.

Conceptual shape:

```ts
interface ChipsRange {
  min: number;
  max: number;
}

interface ChipsCacheTier {
  id: string;
  weight: number;
  reward: ChipsRange;
}

interface PouchProfile {
  chipsCost: number;
  baseChipsReward: ChipsRange;
  cacheTiers: readonly ChipsCacheTier[];
  rarityWeights: Readonly<Record<StandardRarity, number>>;
  hiddenPocketChance: number;
}

interface EconomyBalance {
  signalThreshold: number; // target: 4
  duplicateRecycleChips: Readonly<Record<StandardRarity, number>>;
  pouchProfiles: Readonly<Record<PouchType, PouchProfile>>;
}
```

Do not lock implementation to this exact type shape. The semantic requirements are:

- Basic cost = 0;
- Basic always awards one standard collectible + guaranteed base CHIPS;
- Basic rarity profile has `Legendary = 0`; Common/Rare/Epic remain eligible;
- Charged cost > 0 CHIPS;
- Charged standard profile has non-zero Legendary and materially stronger Rare/Epic than Basic;
- both pouch profiles may define independent cache bonus tiers on top of base CHIPS;
- cache roll is independent of collectible rarity roll;
- a top cache may be large enough to fund several Charged openings;
- Charged expected CHIPS return must remain below its cost over repeated play;
- duplicate recycle CHIPS may scale by rarity and stack with pouch payout;
- Signal increments exactly one segment per duplicate;
- Signal threshold target is 4;
- Signal never overrides a zero-weight rarity in the selected pouch profile;
- Basic Hidden Pocket remains possible but lower than Charged.

Open tuning values remain config, not magic constants scattered through scenes.

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
cache tier id / cache chips reward
duplicate recycle chips reward
standard collectible
Signal before/after/lock reached/consumed/retained state
Hidden Pocket result
final committed progress/wallet snapshot
```

Critical invariants:

- Charged cost and reward are one transaction;
- crash after choosing Charged cannot lose cost without preserving reward;
- refresh cannot reroll Charged, collectible rarity or cache tier into a better result;
- recovery cannot grant base/cache/recycle wallet rewards twice;
- a Basic result that retains an armed Signal lock must recover with the same retained-lock outcome rather than recomputing eligibility from later state;
- visual token flight never owns currency state;
- transaction keeps original lootPool/profile even if active UI selection changes later.

Provider remains:

- Yandex runtime: safe storage behind `StorageAdapter`;
- local development: browser `localStorage` fallback.

---

## 8. Signal migration — LOCKED

Current runtime has a 0–100 rarity-weighted Signal implementation.

Lite V2 target replaces it completely:

```text
standard duplicate → +1
4/4 → armed lock
next standard roll with eligible missing item → guaranteed NEW
consume → 0
```

Legacy mapping is fixed:

```ts
newSignal = Math.min(4, Math.floor(oldSignal / 25));
```

Therefore `0–24→0`, `25–49→1`, `50–74→2`, `75–99→3`, `100→4`.

Implementation rules:

- do not retain late-lock weighted fallback as a second hidden rule;
- if active Drop has no missing standard item, armed lock remains armed and is not consumed;
- if the selected pouch has no missing item with non-zero eligibility/weight, that pouch resolves normally and the armed lock remains armed;
- specifically, Basic can never receive Legendary from Signal because Basic `Legendary = 0`;
- if only Legendary remains, repeated Basic openings may still produce normal Basic results while Signal stays `4/4`; an eligible Charged opening is required to consume it;
- if a future Drop selector changes active pool while lock is armed, the lock applies to the newly selected active Drop at roll time;
- new standard item does not add Signal;
- a duplicate while Signal is already armed cannot increase it beyond `4/4`;
- Secret handling stays outside standard Signal unless a later explicit design changes it;
- a fully armed old lock must remain armed after migration;
- migration must be versioned and idempotent.

### Signal Lock candidate weighting

When lock is armed:

1. collect missing standard candidates in active Drop;
2. remove candidates whose rarity has zero eligibility/weight for the selected pouch;
3. if candidates remain, apply selected pouch rarity weighting among them, select one NEW result and consume lock;
4. if none remain, execute the selected pouch's normal standard roll and retain lock unchanged.

This preserves Charged's rarity advantage under pity and protects the strict Basic/Charged rarity gate.

---

## 9. Opening presentation / resource transfer

CHIPS animation is visual feedback, not economy logic.

Recommended structure:

```text
resolve + persist pending transaction
→ play tear
→ show base CHIPS burst
→ if cache bonus: play stronger cache beat
→ reveal collectible
→ show duplicate recycle if applicable
→ optional Hidden Pocket
→ animate CHIPS/SIGNAL toward HUD
→ commit/show final HUD state
```

Implementation may commit before visual flight for safety, while tweening displayed counter from stored pre-value to stored final value. Stopping a tween cannot change economic outcome.

Do not instantiate one persisted object per visible chip particle. Particles are presentation instances of aggregate numeric rewards. A large jackpot should use a bounded number of visual tokens plus stronger FX/counter animation.

When Signal is armed but Basic has no eligible NEW, the HUD/result presentation must not falsely imply that the lock was consumed. Prefer a concise state such as `SIGNAL LOCK · CHARGED` until an eligible opening occurs.

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

The old `+25 Signal` dev reward was valid only for old 0–100 slice pity.

After Lite V2 Signal migration, use a clearly dev-only CHIPS grant to test exactly-once rewarded persistence. Do not use rewarded ads to mutate Signal pity merely because that was convenient in old harness.

Final public rewarded benefit remains open for release tuning.

---

## 12. Analytics

Keep semantic events provider-independent.

Lite V2 should add useful events around:

```text
pouch_open_started { pouchType, lootPoolId }
chips_earned { source, amount }
chips_cache_hit { pouchType, tier, amount }
duplicate_recycled { rarity, chips, signalAfter }
signal_lock_reached
signal_lock_waiting_for_eligible_pouch { pouchType, lootPoolId }
signal_lock_consumed
charged_ready
charged_opened
hidden_pocket_triggered { pouchType, lootPoolId }
```

Do not over-instrument individual chip particles. Analytics failure never blocks gameplay/reward.

---

## 13. Responsive layout

Locked strategy remains:

```text
logicalHeight = 720
logicalWidth = clamp(viewportAspect * 720, 900, 1728)
```

Lite V2 UI must preserve established vertical rhythm:

- CHIPS HUD cannot compete with title/reward hero;
- Charged-ready affordance must fit 900 logical width;
- `SIGNAL LOCK · CHARGED` or equivalent must remain legible at compact width when applicable;
- resource-flight destination must remain stable across resize;
- large cache counter animation must not overflow compact HUD;
- if resize occurs during result state, wallet/Signal state and Hidden Pocket selected page must remain correct.

---

## 14. Asset loading

Current integrated production assets are small enough to preload:

- 10 collectible textures;
- current pouch layers including compact tear strip;
- Opening/Collection environment layers;
- current SFX set.

Lite V2 adds at most one tiny CHIPS icon/token asset plus optional concise SFX. The same CHIPS identity handles normal and cache payouts. Charged presentation should reuse current pouch assets with runtime treatment first.

Release-scale loading remains a profiling decision after real content expansion.

---

## 15. Testing requirements

Pure tests must cover at minimum:

- Basic vs Charged profile selection;
- Basic never standard-rolls Legendary;
- Charged can standard-roll Legendary;
- independent collectible rarity and CHIPS-cache resolution;
- cache payout boundaries/weights from config;
- Charged expected-value simulation guard or deterministic balance report showing expected CHIPS return below cost;
- insufficient CHIPS rejects Charged without mutation;
- Charged cost + base/cache/recycle reward atomicity;
- duplicate recycle CHIPS by rarity config;
- Signal +1 semantics and 4/4 lock;
- exact legacy Signal mapping including 24/25/49/50/74/75/99/100 boundaries;
- lock targets missing standard item in active Drop;
- lock preserves Basic/Charged rarity profile among missing candidates;
- when only Legendary remains, Basic performs a normal roll and retains `4/4` without ever awarding Legendary;
- an eligible Charged opening after that state guarantees NEW Legendary and consumes the lock;
- repeated duplicates while lock is armed do not overfill/duplicate Signal;
- lock preserved for a fully complete active Drop;
- Drop scoping for Basic/Charged;
- save migration from pre-Lite version;
- pending transaction recovery/idempotency with CHIPS/cache and retained Signal state;
- existing Hidden Pocket/onboarding behavior under profiles;
- rewarded dev CHIPS exactly-once path;
- overlapping platform/ad/visibility pause reasons.

Browser visual regression must additionally cover:

- normal CHIPS token transfer;
- at least one large cache presentation;
- recycle feedback;
- crossing Charged-ready threshold, including a cache jump across it;
- Basic vs Charged presentation;
- Signal segment fill/lock;
- `SIGNAL LOCK · CHARGED` state when Basic has no eligible NEW;
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

Build only scale boundaries already justified: Drop-aware content, typed pouch/cache profiles, versioned atomic save transactions and provider boundaries.
