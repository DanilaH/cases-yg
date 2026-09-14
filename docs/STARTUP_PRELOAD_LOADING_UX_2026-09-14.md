# Startup preload / loading UX — 2026-09-14

## Goal

Add a polished startup overlay that makes real boot work legible on mobile and distinguishes a slow-but-live runtime from a blank Phaser/render failure.

This is a presentation/runtime-UX change only. It must not change reward resolution, economy values, save semantics, onboarding reward semantics, pouch geometry, RNG, Signal/Overcharge behavior or monetization behavior.

## Why DOM, not a Phaser scene

The loader must remain visible even if the Phaser canvas/render path is the thing that is slow or broken. The existing orientation gate and Pages DEBUG controls have already demonstrated that DOM UI can remain alive while the Phaser surface is unavailable.

The startup loader therefore lives in the page shell, above the game canvas and below the orientation gate / DEBUG panel.

Layering contract:

1. DEBUG controls — highest diagnostics layer on Pages;
2. orientation gate — the user must see rotate guidance in portrait;
3. startup preload / fatal startup state;
4. Phaser canvas.

## Visual contract

The loader uses the current Signal 2000 visual language instead of generic browser/loading chrome:

- deep purple / near-black background;
- cyan, lavender and pink glow accents;
- centered signal-ring spinner with a small core/star;
- readable themed status copy;
- fake progress bar with restrained glow;
- mobile-safe sizing and safe-area padding.

Default copy:

- `PREPARING DROP`
- `STABILIZING SIGNAL...`

The loader copy is localized once platform language is known. Before platform bootstrap resolves, the critical HTML shell may briefly show the English fallback.

## State / timing contract

Startup loader states:

- `idle`
- `pending-show`
- `visible`
- `completing`
- `hidden`
- `failed`

Behavior:

- startup begins immediately when the module runs;
- loader does not visibly flash for very fast boots;
- delayed show: about 200 ms;
- once visible, keep it readable for at least about 500 ms;
- fake progress advances quickly into the mid-range, then slows and caps below completion;
- fake progress never reaches 100% before a real ready signal;
- real readiness advances to 100%, holds briefly, then fades away;
- timers are cleaned up deterministically;
- repeated `begin()` / `complete()` calls are idempotent.

## Readiness handoff

Do not hide the loader merely after `new Phaser.Game()`.

The current canonical platform-ready signal already lives in the first presentable gameplay/recovery surfaces:

- `FirstRunScene` calls `platform.markReady()` after its authored entrance stage has been rendered;
- `OpeningScene` calls `platform.markReady()` after save recovery + required active art are ready and the usable Opening frame exists;
- the save-load failure surface also calls `platform.markReady()` so the platform loader does not hide a recoverable error UI.

The startup overlay hooks that existing idempotent semantic signal. It completes only after that signal and a bounded browser-frame handoff so the canvas has had an opportunity to present the authored frame.

`platform.markReady()` remains the platform API owner. The overlay must not introduce a second platform-ready call or move durable state into presentation code.

## Orientation interaction

The orientation gate remains above the startup overlay.

Portrait does not reset or restart startup progress. Boot may continue under the gate. When coherent landscape geometry returns:

- if startup is still waiting for readiness, the loader remains visible;
- if readiness already completed, the game is shown immediately;
- the loader must not trigger Phaser resize/restart or modify the #162 orientation runtime lifecycle.

## Failure / timeout behavior

The loader must not disguise a fatal startup forever.

A generous bounded startup timeout transitions the overlay to an explicit failure state. The fatal `boot()` catch also transitions the same overlay to failure instead of repurposing the orientation gate as an error box.

The controller still accepts a later real ready signal after a timeout state so an unusually slow platform bootstrap can recover instead of leaving a false terminal overlay. A real thrown fatal boot never emits readiness and therefore remains visible.

## Diagnostic value

After this change, a real-phone rotate/startup failure is easier to classify:

- loader visible: DOM/runtime controller is alive and still waiting for presentable readiness;
- loader hidden + DEBUG alive + blank Phaser surface: the failure is below startup ownership, so next instrumentation should target canvas/WebGL/scene/render state;
- loader failure state: startup did not reach presentable readiness inside the bounded window or threw a fatal error.

Do not respond to the third case by adding more orientation heuristics without evidence.

## Test contract

Unit-test controller timing/state behavior without requiring a browser DOM:

- quick complete before show -> no flash;
- slow boot -> loader becomes visible;
- visible completion -> 100% then hide after minimum visible duration;
- repeated begin/complete is idempotent;
- fake progress never exceeds the pre-complete cap;
- timeout exposes failure;
- a later real ready signal can recover from timeout;
- destroy clears scheduled work.

Full project gate before merge:

```bash
npm ci
npm run typecheck
npm test
npm run assets:selftest
npm run assets:validate
npm run build
```

## Hands-on acceptance after deploy

On the cache-busted GitHub Pages build, test on the real phone:

1. clean landscape load;
2. reload / visibly slow load;
3. portrait load;
4. landscape -> portrait -> landscape;
5. repeat rotation 3-5 times;
6. loader does not look like generic browser chrome;
7. loader never covers the rotate gate in portrait;
8. DEBUG remains usable on Pages;
9. no blank Phaser surface after rotation;
10. if blank surface still occurs after loader is hidden, instrument canvas/WebGL/scene state next instead of rewriting viewport heuristics.
