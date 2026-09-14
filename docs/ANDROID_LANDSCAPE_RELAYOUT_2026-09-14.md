# Android landscape relayout hardening — 2026-09-14

## Evidence

Real-phone acceptance of build `52e25182` established two facts:

1. the startup overlay can reach its 30 s diagnostic timeout (`SIGNAL LOST`) and the game can still become presentable afterwards, so 30 s is not a valid fatal threshold for the current hosted/mobile asset path;
2. after the runtime becomes visible in landscape, the Opening/main scene can still retain presentation geometry that visually matches the previous tall/portrait layout: the Phaser surface is alive, but the authored chrome is oversized/cropped instead of being rebuilt for the current landscape backing size.

This means PR #162 materially improved Android runtime survival, but rotation acceptance is not complete yet.

## Root-cause seam

The current viewport architecture intends CSS, orientation gate and Phaser to use one coherent resolved viewport snapshot. In `main.ts`, however, CSS is updated from that snapshot and Phaser backing-store sync then re-reads `#game.getBoundingClientRect()` independently. During Android rotation/toolbar settling those two geometry reads can disagree.

Opening presentation also relies on Phaser's Scale Manager `RESIZE` event to rebuild its `LayoutMetrics`. Returning from portrait can restore the exact same landscape backing dimensions that existed before portrait. In that case an optimization that skips `game.scale.resize()` also skips the `RESIZE` signal, even though a presentation relayout/reconciliation is still desirable after the gated lifecycle transition.

## Fix contract

### One viewport snapshot

Add a pure game-CSS-size resolver to `src/app/viewport.ts`:

- game height follows the resolved viewport height;
- game width is `min(viewport.width, viewport.height * 2)` to preserve the existing Yandex 2:1 cap;
- backing-store sizing receives this size from the *same* `ViewportState` already used for the CSS variables and orientation gate;
- do not re-read DOM geometry to choose the Phaser backing size.

### Portrait startup

If Phaser is first constructed while the rotate gate owns presentation, do not author the initial scene against a portrait backing store. Derive a bounded landscape bootstrap size from the portrait snapshot by swapping its axes and applying the same 2:1 cap. The first real coherent landscape snapshot still replaces this provisional size.

This keeps boot work running behind the gate without teaching Opening/FirstRun a transient portrait layout that is never meant to be shown.

### Landscape relayout reconciliation

Keep the existing scene resize handlers as the single presentation rebuild path.

When a coherent landscape viewport arrives:

- if the target backing dimensions changed, `game.scale.resize()` updates the backing store and emits the normal Phaser `RESIZE` event;
- if the viewport transitioned but the target backing dimensions are already identical, call the official `game.scale.refresh()` path so Phaser still emits `RESIZE` and active scenes can rebuild/reconcile their presentation;
- do not add scene-specific polling or another private relayout API.

This preserves the existing reveal/banking resize semantics and avoids touching durable reward state.

### Startup timeout

Move the non-fatal diagnostic timeout from 30 s to 90 s. The real-phone evidence proves 30 s can be a legitimate slow startup on the Pages/mobile path. A thrown boot error still fails immediately. Late semantic readiness must still recover a timeout state.

## Non-goals

Do not change gameplay, economy, RNG, save semantics, onboarding rewards, pouch geometry, Signal/Overcharge, ads, or the orientation blocker / render-loop suspension semantics from #162.

Do not use `screen.orientation` as geometry truth and do not add another chain of arbitrary rotate timers.

## Tests

At minimum:

- game CSS size honors the 2:1 cap from a landscape snapshot;
- initial portrait bootstrap resolves to bounded landscape geometry;
- current viewport tests remain green;
- startup timeout unit test proves 30-60 s can remain a valid loading state and the diagnostic bound is now 90 s;
- full project gate passes.

## Hands-on acceptance

On a cache-busted Pages build:

1. load in landscape;
2. load in portrait, wait, then rotate to landscape;
3. landscape -> portrait -> landscape 3-5 times;
4. confirm Opening chrome/pouch is rebuilt to the current short-landscape layout every time;
5. confirm no blank canvas;
6. confirm `SIGNAL LOST` does not appear during a 30-60 s but eventually successful load;
7. confirm DEBUG remains usable.
