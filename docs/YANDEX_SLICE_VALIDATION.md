# Yandex DRAFT validation

This checklist is the hosted-platform gate that runs **after Phase 2.6 Signal Overcharge + Phase 2.7 Secret reward correction + final merged-main repeated-use acceptance**.

Unit tests, CI and local browser automation prove code behavior; they do not prove the actual Yandex-hosted SDK/storage/ad lifecycle.

## Build configuration

- Production Yandex runtime loads `/sdk.js` unless `VITE_YANDEX_SDK_URL` is deliberately overridden.
- Optional custom-event analytics uses `VITE_YANDEX_METRICA_ID`.
- With a valid Metrica tag ID, runtime sends semantic events through `reachGoal`.
- Without a Metrica ID, analytics can remain console-only in debug mode; this is not a release error.
- Add `debug=1` to expose internal test controls without forcing the mock platform.
- Save schema is V4. V1/V2/V3 migration remains supported and must preserve already-staged transactions without retroactively adding the V4 Secret jackpot.

## Automated precondition

Before upload, the exact candidate revision must pass:

- `npm ci`;
- `npm run typecheck`;
- `npm test`;
- `npm run assets:selftest`;
- `npm run assets:validate`;
- `npm run build`;
- exact-revision browser visual/interaction audit for the current loop.

Automated coverage must include:

- Basic/Charged profile selection;
- Basic normal roll cannot produce Legendary;
- Charged normal roll can produce Legendary;
- independent collectible rarity + CHIPS-cache resolution;
- insufficient-CHIPS Charged rejection without mutation;
- atomic Charged cost + base/cache/recycle reward transaction;
- duplicate recycle CHIPS;
- 4-segment Signal lock;
- exact legacy Signal mapping `min(4, floor(oldSignal / 25))`;
- Drop-scoped NEW guarantee preserving selected pouch rarity profile;
- strict Signal gate: Basic retains `4/4` when only Legendary remains, then Charged guarantees/consumes it;
- pending reveal recovery/idempotency with wallet/cache/Signal/Overcharge fields;
- V1/V2/V3 → V4 migration, including an already-staged pre-V4 Hidden Pocket that keeps its old exact wallet outcome;
- Secret `+40 CHIPS` stored inside the exact pending transaction;
- Secret bonus excluded from Overcharge multiplication;
- missing Secrets chosen before Secret duplicates, then duplicates remain possible after `2/2`;
- Secret NEW/duplicate collection semantics;
- late activity subscribers immediately receive the current aggregate blocked state;
- rewarded adapter exactly-once/error/timeout behavior;
- debug rewarded CHIPS probe reloads after a durable grant before another pouch can use stale in-memory session state.

## DRAFT — boot / LoadingAPI

1. Upload the exact accepted production build as a Yandex Games draft.
2. Open through Yandex debug environment; append `debug=1` if needed.
3. Confirm platform debug says `Platform: yandex`, not `mock`.
4. Confirm loader disappears only after storage + initial scene are ready.
5. Reload repeatedly and confirm no double-ready or visible late-init jump.
6. Confirm existing V1/V2/V3 saves migrate into V4 without losing discovered collectibles/Secrets or changing already-staged pre-V4 rewards.

### Startup pause race — explicit check

The runtime subscribes to `game_api_pause` / `game_api_resume` immediately after `YaGames.init()`, before awaiting storage. The activity coordinator also replays its current aggregate blocked state to late subscribers.

Verify in the hosted environment:

- if Yandex pauses the game during startup/storage initialization, Phaser and WebAudio are already blocked when the game runtime attaches;
- a startup ad/overlay cannot briefly run gameplay or SFX behind it;
- resume wakes the game once and does not leave a stale blocker;
- repeated pause/resume around startup does not produce duplicate start/stop behavior.

## DRAFT — pause / resume and audio

1. Start an opening so gameplay is active.
2. Trigger normal Yandex pause/resume behavior through overlay/tab/ad flow.
3. Confirm gameplay/input/tweens are blocked appropriately.
4. Confirm Phaser/Web Audio SFX stay silent through blocked interval.
5. Confirm return does not leave stuck input, duplicate tweens or stale reward HUD state.
6. Repeat while a Secret premium state is visible; persistent Secret tweens must resume cleanly and still teardown on collect/navigation.

## DRAFT — interstitial

Use debug interstitial action.

Expected:

- gameplay/audio block for ad interval;
- successful open/close resolves;
- no-fill/throttle/error releases blocker;
- another fullscreen request while one is active is rejected safely;
- analytics records request/result events.

Never request interstitial during active tear/reveal in the public product.

## DRAFT — rewarded

Technical rewarded probe uses a **clearly dev-only CHIPS grant**, not Signal.

Expected:

- reward grants only from rewarded completion callback, never close alone;
- one ad call can persist CHIPS grant at most once even if callbacks repeat;
- persistence failure returns an error instead of claiming success;
- close/error releases gameplay/audio safely;
- no Signal pity mutation occurs as a side effect of technical ad probe;
- after a successful durable grant, the debug probe reloads before another pouch can stage from the old in-memory `OpeningSession` state;
- after reload, CHIPS include the grant and the next Basic/Charged transaction uses that updated wallet;
- a successful grant cannot disappear after the next opening;
- if a pending reveal already exists, the debug grant preserves the pending transaction invariant and recovery still commits exactly once.

The dev CHIPS amount is not final public rewarded economy.

## DRAFT — sticky banner boundary

Use debug show/hide controls if API-managed sticky mode is being exercised.

Expected:

- returned status matches Yandex state;
- disabled/unavailable banner reports a reason instead of throwing;
- banner does not cover required gameplay/UI;
- scenes do not call Yandex ad globals directly.

## DRAFT — interrupted Basic reveal recovery

1. Start a Basic opening.
2. Reload/close during reveal before result returns to idle.
3. Reopen draft.
4. Confirm staged `pendingReveal` is recovered rather than rerolled.
5. Confirm collectible/base CHIPS/cache bonus/recycle/Signal/Overcharge/Hidden Pocket outcome commits exactly once.
6. Confirm opening count increments once.

Repeat with a forced large cache outcome, duplicate/recycle and Hidden Pocket paths through debug tooling. Also repeat a Basic opening while Signal is armed and only Legendary remains; after recovery the same Basic result must be preserved and Signal must still be `4/4`.

For retained-lock Overcharge openings, interrupt before/after visible bonus/gain staging. Reload must preserve the same multiplier-before, bonus CHIPS and multiplier-after without double gain.

## DRAFT — interrupted Charged reveal recovery — CRITICAL

1. Ensure wallet can afford Charged.
2. Record CHIPS before opening.
3. Force or obtain a known cache outcome where useful.
4. Choose Charged and complete tear.
5. Reload/close at several points during reward sequence.
6. Reopen draft.

Expected:

- same Charged transaction is recovered;
- CHIPS cost is not charged twice;
- cost is not lost without preserving rolled reward;
- base/cache/recycle CHIPS rewards are not granted twice;
- same cache tier/amount is preserved rather than rerolled;
- same collectible/Hidden Pocket outcome is preserved;
- final wallet equals transaction's deterministic committed value;
- active Drop/profile remains the one stored in transaction;
- if the opening cashes out Overcharge through a consuming lock, the same bonus CHIPS and reset-to-`x1.00` outcome are recovered exactly once;
- if a Hidden Pocket is part of the transaction, its persisted Secret bonus is neither dropped nor duplicated.

This must be tested in actual Yandex storage environment, not only localStorage.

## DRAFT — Secret V4 jackpot / persistent presentation

Test both forced NEW Secret and forced Secret duplicate.

Expected:

- NEW Secret awards exactly `+40 CHIPS` as a separate persisted Secret bonus and adds the Secret to Collection once;
- Secret duplicate awards exactly `+40 CHIPS` without adding another collection ID;
- before all Secrets are owned, Hidden Pocket selects from missing Secrets; after `2/2`, Hidden Pocket can still resolve to a duplicate;
- Secret bonus is not included in `base + cache + recycle` and is not multiplied by Overcharge;
- standard reward page and Secret page switch the same reward tray rather than rendering competing trays;
- Secret page uses the Secret-specific rarity identity and `SECRET DISCOVERED` / `SECRET DUPLICATE` semantics;
- entrance burst is followed by persistent premium ambience (halo/cloud/sparkles/breathing) for several seconds until collect;
- swiping away suppresses the Secret atmosphere; returning restores it;
- collect/navigation destroys persistent Secret tweens and no stale callbacks affect the next opening;
- reload during a staged Hidden Pocket recovers the exact same Secret ID, NEW/duplicate flag and `bonusChips` value;
- migrated pre-V4 staged Hidden Pockets keep `bonusChips: 0` and are never retroactively credited `+40`.

## DRAFT — Signal migration / lock

With migrated legacy saves and/or debug seeds:

- `0–24→0`, `25–49→1`, `50–74→2`, `75–99→3`, `100→4/LOCK`;
- boundary values `24/25/49/50/74/75/99/100` resolve exactly;
- old fully armed Signal remains armed;
- one duplicate fills exactly one Lite segment;
- `4/4` arms lock;
- when the selected pouch has an eligible undiscovered candidate, the next standard roll returns NEW inside the active Drop and consumes the lock;
- Basic SIGNAL LOCK always obeys Basic rarity access and can never award Legendary;
- with only Legendary missing, opening Basic produces a normal Basic result and leaves Signal at `4/4`;
- that waiting state is clearly communicated in UI, e.g. `SIGNAL LOCK · CHARGED`;
- a following eligible Charged opening guarantees a missing Legendary, preserves Charged weighting if multiple candidates exist, and consumes the lock;
- repeated duplicates while the lock waits do not increase Signal beyond `4/4`;
- complete active Drop does not consume/waste armed lock;
- with an armed retained lock, Overcharge applies the persisted multiplier to `base + cache + recycle`, then persists only the actual clamped pouch gain for the next opening;
- at cap, the multiplier still applies while no fake gain is persisted;
- an eligible consuming lock cashes out the current multiplier and persists reset to `x1.00`;
- reload cannot recalculate or double-apply any Overcharge transition.

## DRAFT — CHIPS / cache / Charged UI

Confirm at representative hosted sizes:

- CHIPS HUD remains visible/readable;
- normal payout token flight ends at correct HUD destination;
- large cache payout uses bounded visual tokens and readable counter animation rather than sprite spam;
- wallet display ends at committed value even if animation is interrupted;
- crossing affordability through normal payout triggers clear Charged-ready feedback once;
- crossing affordability through a cache jump also triggers it once;
- `SIGNAL LOCK · CHARGED` or equivalent does not collide with CHIPS/Charged controls at compact width;
- Charged cannot be opened when balance is insufficient;
- no modal/store is required for Basic/Charged choice;
- active Overcharge reward UI shows the compact source breakdown, Overcharge contribution and final total without overflow; player-facing `RAW` is intentionally not shown;
- inactive `x1.00` remains visually dormant and MAX remains clearly saturated rather than error-like;
- reward tray prefers the right-side slot and does not overlap the left gameplay/pouch rail, hero or result panel at representative 900/1024/1280 widths.

## DRAFT — browser/device compatibility

The current production build target is ES2022. Do not infer full device compatibility from desktop Chromium alone.

For every platform/device class actually selected in Yandex Console:

- launch the exact hosted DRAFT on representative supported browsers/devices;
- confirm no syntax/startup failure before Phaser boot;
- verify landscape resize/orientation behavior;
- verify audio unlock, pointer/touch tear gesture and Collection navigation;
- if an older selected platform cannot execute the build, adjust the supported-platform claim or build target from evidence rather than lowering the target blindly.

## DRAFT — Metrica

If a tag is configured, validate relevant semantic goals actually emitted by the current build, including:

```text
platform_ready
first_package_interaction
reveal_complete
chips_cache_hit
signal_lock_reached
signal_lock_consumed
signal_lock_retained
overcharge_gained
overcharge_cashed_out
hidden_pocket_triggered
secret_discovered
secret_duplicate
standard_collection_complete
collection_open
ad_* events
```

Confirm `reachGoal` traffic in Yandex tooling and confirm `debug=1` does not force mock platform behavior.

## Gate

Do not mark Yandex DRAFT validation complete from CI or local visual audits.

The pass is complete only when the exact hosted V4 build proves:

> **SDK boot + startup pause/lifecycle + storage migration + Basic/Charged atomic recovery + cache/Signal/Overcharge/Secret persistence + ads + audio + analytics are all safe in the real Yandex environment.**
