# Analytics event contract

The production analytics boundary is `PlatformRuntime.analytics.track(event, params)`. When `VITE_YANDEX_METRICA_ID` is configured, `MetricaAnalyticsAdapter` forwards the same event name and params to Yandex Metrica as `reachGoal`. No event in this contract should contain PII.

## Core activation / opening funnel

- `platform_ready` — one-shot runtime-ready marker; aligned with Yandex `LoadingAPI.ready()`.
- `first_package_interaction` — first successful package interaction for a new save.
- `pouch_selected` — player explicitly changes Basic/Charged selection; params include `pouchType`, `lootPoolId`, and current `chips`.
- `opening_started` — durable reveal preparation succeeded; params include `openingNumber`, `lootPoolId`, and `pouchType`.
- `reveal_complete` — opening result has committed and reached the result state; includes rarity/newness, pouch/drop, CHIPS, Signal, Overcharge, cache and Hidden Pocket outcome fields.
- `result_collected` — player accepts the resolved result and starts banking it; includes opening/drop/pouch, rarity/newness, Hidden Pocket presence, and whether banking starts from the standard or Secret page.

Recommended activation funnel:

`platform_ready → first_package_interaction → opening_started → reveal_complete → result_collected`

## Drop / collection exploration

- `drop_selected` — durable active Drop changes; `source` distinguishes Opening from Collection.
- `collection_open` — Collection scene opened with global standard/Secret counts.
- `collection_view_changed` — Shelf/Library switch with the currently browsed Drop.
- `collection_drop_browsed` — local Collection Drop paging; params include Drop, current view and direction.
- `collection_return` — return from Collection to Opening with view, Drop and current standard progress.

## Reward / progression

- `signal_lock_reached`
- `signal_lock_consumed`
- `signal_lock_retained`
- `overcharge_gained`
- `overcharge_cashed_out`
- `chips_cache_hit`
- `hidden_pocket_triggered`
- `secret_discovered` / `secret_duplicate`
- `standard_collection_complete`
- `pending_reveal_recovered`

## Platform / ads diagnostics

- `platform_pause` / `platform_resume`
- `ad_interstitial_request`, `ad_interstitial_open`, `ad_interstitial_close`, `ad_interstitial_error`
- `ad_rewarded_request`, `ad_rewarded_open`, `ad_rewarded_grant`, `ad_rewarded_close`, `ad_rewarded_error`
- `ad_sticky_change`

These ad events currently validate the adapter and debug probes. Normal-player monetization CTA placement is a separate product decision.

## Useful funnels / cuts

- Charged adoption: `pouch_selected(pouchType=charged) → opening_started(pouchType=charged) → reveal_complete`.
- Result acceptance: `opening_started → reveal_complete → result_collected`.
- Secret loop: `hidden_pocket_triggered → secret_discovered|secret_duplicate → result_collected`.
- Meta engagement: `collection_open → collection_view_changed|collection_drop_browsed → collection_return`.

The event contract is intentionally compact. Add events only when they answer a concrete product, economy, retention, or monetization question.
