# Yandex slice validation

This checklist is the manual/draft-environment half of Phase 1 / PR-5.

The repository now provides code-level guards and a `?debug=1` panel for all advertising paths, but a real Yandex draft URL / game ID is not stored in the repository. Therefore unit/build verification can be completed in CI, while the items explicitly marked **DRAFT** must be checked after an internal build is uploaded to Yandex Games.

## Build configuration

- Production Yandex runtime loads `/sdk.js` unless `VITE_YANDEX_SDK_URL` is deliberately overridden.
- Optional custom-event analytics uses `VITE_YANDEX_METRICA_ID`.
- With a valid Metrica tag ID, the runtime loads the Yandex Metrica tag and sends existing analytics event names through `reachGoal`.
- Without a Metrica ID, analytics remains console-only in debug mode; this is not a release error.
- Add `debug=1` to the game URL to expose the internal ad test panel without forcing the mock platform.

## Automated checks

These must be green before merging PR-5:

- `npm ci`
- `npm run typecheck`
- `npm test`
- `npm run build`
- rewarded `onRewarded` callback is exactly-once even if the SDK repeats it;
- a reward persistence failure returns an error and does not leave gameplay/audio blocked;
- gameplay/audio is released as soon as rewarded close/error settles even if reward persistence is still finishing;
- a missing fullscreen SDK callback times out and releases the ad blocker;
- interstitial error releases the ad blocker.

## DRAFT — boot / LoadingAPI

1. Upload the current production build as a Yandex Games draft.
2. Open it through the Yandex debug environment and append `debug=1` if needed.
3. Confirm the platform debug panel says `Platform: yandex`, not `mock`.
4. Confirm the Yandex loader disappears only after save loading and the initial Opening scene are ready.
5. Reload repeatedly and confirm there is no double-ready error or visible late initialization jump.

## DRAFT — pause / resume and audio

1. Start an opening so the game is in an active gameplay state.
2. Trigger Yandex `game_api_pause` / `game_api_resume` through normal platform behavior (tab visibility, platform overlay, or ad flow).
3. Confirm gameplay stops while blocked and resumes afterwards.
4. Confirm both Phaser sound and the Web Audio SFX controller are silent for the complete blocked interval.
5. Confirm returning from the overlay/ad does not create a stuck input state.

## DRAFT — interstitial

Use the debug-panel `Interstitial` button.

Expected:

- gameplay/audio block immediately for the ad interval;
- successful open/close resolves the debug action;
- a Yandex-side no-fill / throttled / error path resolves instead of leaving the game blocked;
- another fullscreen request while one is active returns `AD_ALREADY_IN_PROGRESS`;
- analytics receives request/open/close or error events.

## DRAFT — rewarded

Use `Rewarded +25 Signal` in the debug panel.

Expected:

- the reward is granted only from the rewarded callback, never from close alone;
- one ad call can persist the reward at most once even if callbacks repeat;
- successful reward adds 25 Signal, capped at the slice Signal threshold;
- reload after the reward preserves the Signal grant;
- failure to persist the reward returns an error instead of claiming success;
- ad close/error releases gameplay/audio immediately; persistence may finish just after the fullscreen surface is gone;
- a second fullscreen ad cannot start until the current reward persistence has settled;
- the `+25 Signal` grant is a development probe only and is not the final production economy.

## DRAFT — sticky banner boundary

Use `Sticky: show` and `Sticky: hide`.

Expected:

- returned status matches Yandex banner state;
- disabled/unavailable banner reports a reason rather than throwing into game code;
- no scene calls Yandex advertising globals directly.

## DRAFT — interrupted reveal recovery

1. Complete the tear and reload/close the page during reveal animation, before the resolved result returns to idle.
2. Reopen the draft.
3. Confirm the staged `pendingReveal` is replayed rather than rerolled.
4. Confirm the reward is committed once and the next opening number increments once.
5. Repeat with a Hidden Pocket result if convenient through debug/forced RNG tooling.

## DRAFT — Metrica

If a tag is configured:

1. Create JavaScript-event goals for the event identifiers that matter for the slice funnel (at minimum `platform_ready`, `first_package_interaction`, `reveal_complete`, `collection_open`, `hidden_pocket_triggered`, `standard_collection_complete`, and the ad request/result events).
2. Confirm `reachGoal` calls are visible with Yandex Metrica debugging/network tooling.
3. Confirm no production build uses the mock platform merely because `debug=1` is present.

Do not mark PR-5's Yandex-draft validation complete from CI alone. CI proves adapter behavior and build integrity; the Yandex-hosted checks prove the actual platform integration.
