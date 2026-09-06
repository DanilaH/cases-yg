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
- insufficient-CHIPS Charged rejection without mutation;
- atomic Charged cost + reward transaction;
- duplicate recycle CHIPS;
- 4-segment Signal lock;
- Drop-scoped NEW guarantee;
- save migration from pre-Lite state;
- pending reveal recovery/idempotency with wallet fields;
- rewarded dev CHIPS exactly-once path.

## DRAFT — boot / LoadingAPI

1. Upload the exact Lite V2 production build as a Yandex Games draft.
2. Open it through the Yandex debug environment; append `debug=1` if needed.
3. Confirm platform debug says `Platform: yandex`, not `mock`.
4. Confirm loader disappears only after storage + initial scene are ready.
5. Reload repeatedly and confirm no double-ready or visible late-init jump.
6. Confirm an existing pre-Lite save migrates without losing discovered collectibles/Secrets.

## DRAFT — pause / resume and audio

1. Start an opening so gameplay is active.
2. Trigger normal Yandex pause/resume behavior through overlay/tab/ad flow.
3. Confirm gameplay/input/tweens are blocked appropriately.
4. Confirm Phaser/Web Audio SFX stay silent through the blocked interval.
5. Confirm return does not leave stuck input, duplicate tweens or stale reward HUD state.

## DRAFT — interstitial

Use the debug interstitial action.

Expected:

- gameplay/audio block for ad interval;
- successful open/close resolves;
- no-fill/throttle/error releases the blocker;
- another fullscreen request while one is active is rejected safely;
- analytics records request/result events.

Never request interstitial during active tear/reveal.

## DRAFT — rewarded

After Lite V2 Signal migration, the technical rewarded probe must use a **clearly dev-only CHIPS grant**, not `+25 Signal`.

Expected:

- reward grants only from rewarded completion callback, never close alone;
- one ad call can persist the CHIPS grant at most once even if callbacks repeat;
- reload preserves the grant;
- persistence failure returns an error instead of claiming success;
- close/error releases gameplay/audio safely;
- no Signal pity mutation occurs as a side effect of the technical ad probe.

The dev CHIPS amount is not the final public rewarded economy.

## DRAFT — sticky banner boundary

Use debug show/hide controls if API-managed sticky mode is being exercised.

Expected:

- returned status matches Yandex state;
- disabled/unavailable banner reports a reason instead of throwing;
- banner does not cover required gameplay/UI;
- scenes do not call Yandex ad globals directly.

## DRAFT — interrupted Basic reveal recovery

1. Start a Basic opening.
2. Reload/close during reveal before the result returns to idle.
3. Reopen draft.
4. Confirm staged `pendingReveal` is recovered rather than rerolled.
5. Confirm collectible/CHIPS/Signal/Hidden Pocket outcome commits exactly once.
6. Confirm opening count increments once.

Repeat with duplicate/recycle and Hidden Pocket paths where practical through debug tooling.

## DRAFT — interrupted Charged reveal recovery — CRITICAL

This is a new Lite V2 release blocker.

1. Ensure wallet can afford Charged.
2. Record CHIPS before opening.
3. Choose Charged and complete the tear.
4. Reload/close at several points during its reward sequence.
5. Reopen draft.

Expected:

- the same Charged transaction is recovered;
- CHIPS cost is not charged twice;
- cost is not lost without preserving the rolled reward;
- base/recycle CHIPS rewards are not granted twice;
- same collectible/Hidden Pocket outcome is preserved;
- final wallet equals the transaction's deterministic committed value;
- active Drop/profile remains the one stored in the transaction.

This must be tested in the actual Yandex storage environment, not only localStorage.

## DRAFT — Signal migration / lock

With a migrated legacy save and/or debug seed:

- partial old Signal converts according to the explicitly chosen migration rule;
- old fully armed Signal does not silently lose the lock;
- one duplicate fills exactly one Lite segment;
- `4/4` arms lock;
- next standard roll returns an undiscovered item in the active Drop when one exists;
- lock resets after consumption;
- complete active Drop does not consume/waste the armed lock.

## DRAFT — CHIPS / Charged UI

Confirm at representative hosted sizes:

- CHIPS HUD remains visible and readable;
- reward token flight ends at the correct HUD destination;
- wallet display ends at committed value even if animation is interrupted;
- crossing affordability triggers clear Charged-ready feedback once;
- Charged cannot be opened when balance is insufficient;
- no modal/store is required for the Basic/Charged choice.

## DRAFT — Metrica

If a tag is configured, validate relevant semantic goals such as:

```text
platform_ready
first_package_interaction
pouch_open_started
reveal_complete
chips_earned
duplicate_recycled
signal_lock_reached
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

The pass is complete only when the exact hosted Lite V2 build proves:

> **SDK boot + lifecycle + storage migration + Basic/Charged atomic recovery + ads + audio + analytics are all safe in the real Yandex environment.**
