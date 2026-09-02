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

# 2. Stage-aware architecture

The first build is an **internal vertical slice**, but architecture must already support the later content-heavy public release.

Therefore:

- gameplay systems may use slice balance values, but must be config-driven;
- content registries must support arbitrary gadget-family count;
- Collection must render from data, not `if camera / if flip-phone` branches;
- Yandex SDK, storage, lifecycle, analytics and ads are production boundaries from day one;
- do not scaffold speculative large-game architecture unrelated to known release needs.

---

# 3. Scenes

```text
BootScene
OpeningScene
CollectionScene
```

Reveal stays inside `OpeningScene` to preserve physical continuity with the pouch.

`CollectionScene` has Shelf/Library internal states. The internal slice may display only two families, but the implementation must accept an arbitrary list of family records and layout/group them from config.

Example opening presentation phase:

```ts
type OpeningPhase =
  | 'idle'
  | 'dragging'
  | 'revealing'
  | 'hidden-pocket'
  | 'result-hold'
  | 'result-ready';
```

---

# 4. Source structure

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
    activity.ts
  i18n/
    en.ts
    ru.ts
  main.ts
```

Do not add React/Redux/ECS/backend just because the release will have more content.

---

# 5. Content registry — LOCKED FOR RELEASE ARCHITECTURE

Use data-first definitions such as:

```ts
interface GadgetFamilyDefinition {
  id: string;
  nameKey: string;
  groupId?: string;
  standard: Record<StandardRarity, CollectibleDefinition>;
  secrets: CollectibleDefinition[];
}
```

Core systems consume the registry. Camera and Flip Phone are just the first two entries.

Release expansion must be possible by adding/configuring families and assets rather than rewriting drop logic or Collection scene structure.

---

# 6. Persistent state / transaction

Keep save versioned and provider-agnostic.

Conceptually:

```ts
interface SaveState {
  version: number;
  discoveredStandard: string[];
  discoveredSecrets: string[];
  signal: number;
  totalOpens: number;
  pendingReveal: PendingReveal | null;
  muted: boolean;
  stats: {
    duplicates: number;
    hiddenPockets: number;
  };
}
```

`pendingReveal` must predetermine the complete reward transaction before presentation so refresh/crash cannot reroll or double-commit.

Provider:

- Yandex runtime: `await ysdk.getStorage()` behind `StorageAdapter`;
- local development: browser `localStorage` fallback.

Do not require account/backend/cloud sync for the internal slice. Reconsider cloud/player save only if release requirements justify it.

---

# 7. Drop/balance boundaries

All numbers live in typed config:

```ts
STANDARD_ODDS
FAMILY_WEIGHTS
SIGNAL_GAINS
SIGNAL_LOCK_RULES
HIDDEN_POCKET_RULES
REVEAL_TIMINGS
RESULT_HOLD_MS
```

The current 2-family numbers are `slice` balance, not permanent release constants.

When content expands:

1. choose release roster/grouping;
2. define family weighting/package behavior;
3. rerun progression simulations;
4. update config without rewriting scenes.

---

# 8. Yandex SDK boundary — REQUIRED FROM FIRST SLICE

`platform/yandex.ts` owns:

- `YaGames.init()`;
- language/environment access;
- safe storage acquisition;
- `LoadingAPI.ready()`;
- `GameplayAPI.start()/stop()` mapping;
- `game_api_pause` / `game_api_resume` subscriptions;
- platform availability/capability information needed by adapters.

The slice must run in local mock/fallback mode and Yandex draft/debug mode.

---

# 9. Advertising boundary — REQUIRED FROM FIRST SLICE

Advertising follows the **current Yandex Games SDK and moderation requirements by default**. Do not invent a separate ad policy when the platform already defines the compliance baseline.

Add `platform/ads.ts` immediately. A practical API may look like:

```ts
interface AdsAdapter {
  showInterstitial(): Promise<{
    wasShown: boolean;
    reason?: string;
  }>;

  showRewarded(rewardId: string): Promise<{
    rewardEarned: boolean;
    reason?: string;
  }>;

  setStickyBannerVisible(visible: boolean): Promise<{
    isShowing: boolean;
    reason?: string;
  }>;
}
```

Yandex implementation wraps:

- `ysdk.adv.showFullscreenAdv()`;
- `ysdk.adv.showRewardedVideo()`;
- sticky-banner SDK control when the release enables API-managed sticky banners in the Yandex Console.

### Locked compliance behavior

- scenes do not call `ysdk.adv` directly;
- interstitials are requested only at logical pauses and never during active tear/reveal;
- do not implement repeating timer spam for fullscreen ads; Yandex controls actual interstitial display frequency;
- rewarded is always voluntary;
- rewarded CTA explicitly communicates that an ad will be watched and names the exact reward;
- reward is persisted/granted **exactly once on the rewarded callback**, not merely because the ad closed;
- close/error without rewarded completion grants nothing;
- ad error/unavailability never blocks save/gameplay;
- full-screen/rewarded ads pause gameplay and all audio;
- sticky banner, if used, may be platform-managed or API-managed; if API-managed, enable the matching Yandex Console option and ensure it never covers required controls.

### Activity / pause ownership

Do not let ad callbacks, visibility events and `game_api_pause/resume` each independently toggle Phaser activity.

Use a tiny activity coordinator, e.g.:

```ts
type PauseReason = 'platform' | 'visibility' | 'ad' | 'menu';
```

Gameplay is active only when no blocking pause reason is present and the current scene/state is playable.

This prevents:

- duplicate `GameplayAPI.start()`;
- premature resume while an ad/platform pause is still active;
- audio restarting behind an ad;
- double processing caused by `onClose` plus `game_api_resume`.

### Internal slice ad test

Expose deliberate dev-only actions for:

- interstitial request;
- rewarded request;
- rewarded success;
- close without reward;
- error/unavailable;
- sticky show/hide when API-managed mode is being exercised.

For the internal slice only, a clearly dev-labelled test reward such as `+25 Signal` may prove reward plumbing. Do not encode that as public monetization design.

Final release tuning — exact rewarded benefit, useful compliant pause points, whether sticky is worth using — happens after content/economy expansion. No additional architecture decision is required now.

---

# 10. Analytics

Use Yandex built-in metrics + typed Yandex Metrica adapter.

Keep semantic gameplay events provider-independent. The internal slice uses events for verification/debugging; public KPI gates are defined later for the expanded release.

Also log/test ad lifecycle semantically, for example:

```text
ad_interstitial_requested
ad_interstitial_closed
ad_rewarded_requested
ad_rewarded_earned
ad_error
```

Do not let analytics failure block gameplay or rewards.

---

# 11. Responsive layout

Locked landscape strategy remains:

```text
logicalHeight = 720
logicalWidth = clamp(viewportAspect * 720, 900, 1728)
```

Modes:

```text
compact   1.25–1.50
standard  >1.50–1.95
wide      >1.95–2.40
```

Shared `LayoutMetrics`, safe insets, ~44 CSS px effective touch targets, no non-uniform stretching, no browser scrolling/overscroll gesture conflicts.

The slice Shelf can be a two-hero composition. **Do not encode two slots into collection data structures.** Release Collection will choose pagination/grouping once family count is locked.

---

# 12. Asset loading

Internal slice: preload/cache the 10 collectibles, pouch layers, scene backgrounds and SFX before ready because the payload is tiny.

Public release: do not assume dozens/hundreds of 1024 textures should all stay resident. Once the release roster exists, profile real mobile memory and choose among:

- preload essential opener/shared assets;
- grouped Collection loading;
- on-demand family batches;
- smaller runtime derivatives for thumbnails.

Whatever strategy is chosen, Opening ↔ currently available Collection content must not produce page-like waits.

---

# 13. Localization/audio

RU + EN typed dictionaries, unsupported language → EN. Keep text out of image assets.

SFX-only is sufficient for the slice. Persist mute. Audio and tweens/input pause on Yandex/platform pause and during full-screen/rewarded ads.

---

# 14. Testing

Small pure-logic tests are required for:

- drop/onboarding rules;
- Signal rules;
- Hidden Pocket;
- pendingReveal idempotency/recovery;
- config-driven family addition;
- rewarded-ad exactly-once reward handling;
- ad close/error/no-reward paths;
- activity coordinator with overlapping pause reasons.

Dev-only controls should force rarity, duplicates, SIGNAL LOCK, Hidden Pocket/Secret and ad flows.

---

# 15. Engineering guardrails

Do not introduce by default:

- React;
- Redux/Zustand-style state framework;
- ECS;
- physics;
- backend/websockets;
- real-time 3D;
- generalized content CMS/pipeline server;
- premature abstractions for systems that may never ship.

But **do** build the known scale boundaries correctly now: data-driven content, provider-based storage/analytics/ads and configurable balance.
