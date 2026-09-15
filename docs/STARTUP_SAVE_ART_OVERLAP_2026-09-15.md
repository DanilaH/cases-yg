# Startup save/art overlap

Date: 2026-09-15

## Problem

After adopting the zero-runtime-loader contract, Boot preloads the complete reviewed session image set before gameplay. The save reconciliation was still started only from `BootScene.create()`, so Yandex/local save work formed a serial wall after image download/decode.

Previous critical path:

`platform/settings/audio -> all session art -> save reconciliation -> opening`

## Change

Start `SaveRepository.load()` at the beginning of `BootScene.preload()` and let it run in parallel with Phaser image loading.

New critical path:

`platform/settings/audio -> [all session art || save reconciliation] -> opening`

The save promise captures both success and failure immediately so a rejection cannot become unhandled while a long image preload is still in progress. Routing waits for the exact same result and preserves the existing fallback to Opening on a failed onboarding route check.

## Telemetry

`bootSaveSettled` is marked when the save promise actually settles, even if Phaser is still loading art. `bootArtSettled` is marked when Phaser enters Boot `create()` after preload completion. Startup telemetry now also reports `platformToArtMs`, allowing real Yandex runs to show which parallel wall owns the critical path.

## Invariants

- one startup loader only; no post-Ready image loading;
- same SaveRepository validation/recovery semantics;
- no gameplay/economy/RNG changes;
- no earlier Game Ready signal;
- no change to session-critical image residency.
