# Yandex DRAFT validation

This checklist is the hosted-platform gate that runs **after Gameplay Loop Lite V2 hands-on acceptance**.

Unit tests, CI and local browser automation prove code behavior; they do not prove the actual Yandex-hosted SDK/storage/ad lifecycle.

## Build configuration

- Production Yandex runtime loads `/sdk.js` unless `VITE_YANDEX_SDK_URL` is deliberately overridden.
- Optional custom-event analytics uses `VITE_YANDEX_METRICA_ID`.
- With a valid Metrica tag ID, runtime sends semantic events through `reachGoal`.
- Without a Metrica ID, analytics can remain console-only in debug mode; this is not a release error.
- Add `debug=1` to expose internal test controls without forcing the mock platform.

## Automated precondition

Before upload, the exact candidate revision must pass:

- `npm ci`;
- `npm run typecheck`;
- `npm test`;
- `npm run assets:selftest`;
- `npm run assets:validate`;
- `npm run build`;
- exact-revision browser visual/interaction audit for the Lite loop.

Lite-specific automated coverage must include:

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
- save migration from pre-Lite state;
- pending reveal recovery/idempotency with wallet/cache/Signal-retention fields;
- rewarded dev CHIPS exactly-once path.

## DRAFT — boot / LoadingAPI

1. Upload exact Lite V2 production build as a Yandex Games draft.
2. Open through Yandex debug environment; append `debug=1` if needed.
3. Confirm platform debug says `Platform: yandex`, not `mock`.
4. Confirm loader disappears only after storage + initial scene are ready.
5. Reload repeatedly and confirm no double-ready or visible late-init jump.
6. Confirm existing pre-Lite save migrates without losing discovered collectibles/Secrets.

## DRAFT — pause / resume and audio

1. Start an opening so gameplay is active.
2. Trigger normal Yandex pause/resume behavior through overlay/tab/ad flow.
3. Confirm gameplay/input/tweens are blocked appropriately.
4. Confirm Phaser/Web Audio SFX stay silent through blocked interval.
5. Confirm return does not leave stuck input, duplicate tweens or stale reward HUD state.

## DRAFT — interstitial

Use debug interstitial action.

Expected:

- gameplay/audio block for ad interval;
- successful open/close resolves;
- no-fill/throttle/error releases blocker;
- another fullscreen request while one is active is rejected safely;
- analytics records request/result events.

Never request interstitial during active tear/reveal.

## DRAFT — rewarded

After Lite V2 Signal migration, technical rewarded probe must use a **clearly dev-only CHIPS grant**, not `+25 Signal`.

Expected:

- reward grants only from rewarded completion callback, never close alone;
- one ad call can persist CHIPS grant at most once even if callbacks repeat;
- reload preserves grant;
- persistence failure returns an error instead of claiming success;
- close/error releases gameplay/audio safely;
- no Signal pity mutation occurs as a side effect of technical ad probe.

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
5. Confirm collectible/base CHIPS/cache bonus/recycle/Signal/Hidden Pocket outcome commits exactly once.
6. Confirm opening count increments once.

Repeat with a forced large cache outcome, duplicate/recycle and Hidden Pocket paths through debug tooling. Also repeat a Basic opening while Signal is armed and only Legendary remains; after recovery the same Basic result must be preserved and Signal must still be `4/4`.

## DRAFT — interrupted Charged reveal recovery — CRITICAL

This is a Lite V2 release blocker.

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
- active Drop/profile remains the one stored in transaction.

This must be tested in actual Yandex storage environment, not only localStorage.

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
- complete active Drop does not consume/waste armed lock.

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
- no modal/store is required for Basic/Charged choice.

## DRAFT — Metrica

If a tag is configured, validate relevant semantic goals such as:

```text
platform_ready
first_package_interaction
pouch_open_started
reveal_complete
chips_earned
chips_cache_hit
duplicate_recycled
signal_lock_reached
signal_lock_waiting_for_eligible_pouch
signal_lock_consumed
charged_ready
charged_opened
hidden_pocket_triggered
collection_open
ad_* events
```

Confirm `reachGoal` traffic in Yandex tooling and confirm `debug=1` does not force mock platform behavior.

## Gate

Do not mark Yandex DRAFT validation complete from CI or local visual audits.

The pass is complete only when exact hosted Lite V2 build proves:

> **SDK boot + lifecycle + storage migration + Basic/Charged atomic recovery + cache persistence + strict Signal gating + ads + audio + analytics are all safe in the real Yandex environment.**
