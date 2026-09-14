# Signal 2000 — Orientation Rotation Hardening

**Date:** 2026-09-14  
**Trigger:** repeated real-phone failure where portrait/landscape rotation could leave the rotate gate or game layout stale.

## Root cause

The previous hotfix correctly defended against stale `visualViewport`, but it promoted `screen.orientation.type` to orientation truth. That is still unsafe on mobile browsers and webviews: `screen.orientation` can lag behind layout geometry or remain stale while `innerWidth/innerHeight` and document client bounds have already rotated. Because the rotate gate and viewport selection both trusted that hint, one stale orientation API could keep the game blocked or sized for the wrong orientation.

There was a second reliability hole: if the browser dropped the useful resize/orientation event while the game loop was sleeping behind the portrait gate, no later callback was guaranteed to re-evaluate the viewport.

## Fix

- Orientation truth now comes primarily from layout geometry: `innerWidth/innerHeight` and document client bounds.
- `visualViewport` remains preferred for actual visible size only when its portrait/landscape shape agrees with the resolved layout orientation.
- `matchMedia('(orientation: portrait)')` is only a tie-breaker during a transient disagreement between the two layout geometry sources.
- `screen.orientation` remains only as an event source. Its reported type is no longer trusted as state.
- CSS viewport sizing, Phaser backing-store resize, and the rotate gate now consume one coherent resolved viewport snapshot.
- Rotation settle checks extend through 2 seconds.
- A cheap 500 ms geometry watchdog guarantees eventual recovery even if a mobile browser/webview misses the useful rotation event. It schedules the expensive resize path only when the resolved viewport signature changes.
- `pageshow` and `focus` also force a re-check after browser/tab transitions.

## Automated coverage

Focused viewport tests cover:

- normal agreement across all geometry sources;
- stale portrait `visualViewport` after the layout has rotated to landscape;
- stale media orientation that disagrees with otherwise consistent layout geometry;
- transient disagreement between layout sources with media used only as a tie-breaker;
- operation with only one usable geometry source and no orientation API.

## Guardrails

No gameplay, economy, RNG, save, reward transaction, onboarding, Signal/Overcharge, pouch odds, or Yandex monetization semantics change.

## Acceptance

Automated gate: typecheck, unit tests, asset self-test, asset validation, production build. Final acceptance remains repeated real-phone `portrait → landscape → portrait → landscape` cycling from the GitHub Pages build, including a cycle while the rotate gate is actively blocking the Phaser loop.
