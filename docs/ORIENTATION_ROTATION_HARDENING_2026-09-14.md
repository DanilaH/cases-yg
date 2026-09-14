# Signal 2000 — Orientation Rotation Hardening

**Date:** 2026-09-14  
**Status:** REAL-PHONE CORRECTION IN PROGRESS  
**Trigger:** repeated real-phone failure where portrait/landscape rotation could leave the rotate gate or game layout stale.

## First root cause corrected

The previous hotfix correctly defended against stale `visualViewport`, but it promoted `screen.orientation.type` to orientation truth. That is unsafe on mobile browsers and webviews: `screen.orientation` can lag behind layout geometry or remain stale while `innerWidth/innerHeight` and document client bounds have already rotated. Because the rotate gate and viewport selection both trusted that hint, one stale orientation API could keep the game blocked or sized for the wrong orientation.

There was also a reliability hole if the browser dropped the useful resize/orientation event while the game loop was sleeping behind the portrait gate. The first hardening pass therefore added coherent viewport resolution, settle checks and a geometry watchdog.

## Real-phone evidence after that pass

The first hardening pass was not sufficient. On Android Chrome, the real Pages build still showed the correct portrait rotate gate but could return to landscape as a blank game surface with the DOM debug control still alive. A brief dark/black frame could appear during the rotation.

That evidence narrows the failure below boot/save/UI chrome: the page and orientation gate remain alive, while the Phaser presentation path is being cleared/restarted and not reliably producing the next visible frame.

The problematic lifecycle was:

1. portrait geometry arrives;
2. CSS viewport and the Phaser backing store are both resized even though the portrait gate fully covers the game;
3. scene resize handlers can rebuild/restart presentation, including `FirstRunScene`;
4. the orientation blocker then sleeps the Phaser loop;
5. landscape return resizes/restarts again and relies on `game.loop.wake()` after mobile browser rotation.

That work is unnecessary for portrait presentation and creates a fragile clear/restart/sleep/wake sequence on the exact target device class that exposed the bug.

## Current correction

- Portrait remains a gameplay/activity blocker, so Yandex gameplay markup and game audio still stop correctly.
- **Orientation alone no longer suspends the Phaser render loop.** Ads, platform pause and document visibility still perform a real loop suspension.
- The activity coordinator now exposes blocker-level snapshots so runtime suspension policy does not have to infer the reason from one aggregate boolean.
- The Phaser backing store is **not resized while portrait owns presentation**. The last valid game canvas remains intact behind the DOM gate.
- CSS viewport variables and the orientation gate still track live portrait geometry.
- When coherent landscape geometry returns, the backing store is resized to that landscape geometry and the gate is released.
- Existing layout-geometry truth, settle checks, watchdog, `pageshow`, `focus`, `visualViewport`, `screen.orientation` event source and media-query event source remain in place.

This deliberately removes lifecycle work rather than adding another recovery timer.

## Automated coverage

Focused tests now cover:

- normal agreement across all geometry sources;
- stale portrait `visualViewport` after layout geometry rotates to landscape;
- stale media orientation that disagrees with otherwise consistent layout geometry;
- transient disagreement between layout sources with media used only as a tie-breaker;
- operation with only one usable geometry source and no orientation API;
- portrait suppressing Phaser backing-store synchronization while landscape permits it;
- orientation-only blocking not suspending the Phaser loop;
- orientation plus visibility still suspending the loop;
- blocker-level transitions being emitted even when the aggregate `blocked=true` value does not change.

## Guardrails

No gameplay, economy, RNG, save, reward transaction, onboarding reward semantics, Signal/Overcharge, pouch odds, tear geometry, or Yandex monetization semantics change.

## Acceptance

Automated gate: typecheck, complete unit suite, asset self-test, asset validation, production build.

Final acceptance is still hands-on and must be performed on the real GitHub Pages build:

- load directly in landscape and confirm a playable first frame;
- `landscape → portrait → landscape` at least three times;
- repeat once during first-run entrance/idle if onboarding is active;
- portrait must show the rotate gate without a persistent black/blank game state;
- landscape must recover without save reset/repair/reload;
- DEBUG DOM control remaining alive while Phaser stays blank is a failure, not acceptance.
