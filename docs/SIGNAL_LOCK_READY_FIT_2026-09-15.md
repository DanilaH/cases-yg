# Signal Lock Ready HUD fit

Date: 2026-09-15

## Problem

On compact/mobile Opening chrome, the `SIGNAL LOCK READY` label can overflow the signal HUD card.

## Scope

Only the compact lock-ready label size changes. Normal `SIGNAL`, non-compact presentation, economy, save, signal semantics, and layout geometry remain unchanged.

## Fix

Compact `SIGNAL LOCK READY` uses a smaller 13px digital font while the normal compact `SIGNAL` label remains 19px. This preserves the existing panel dimensions and avoids moving the HUD into the pouch/play area.

## Acceptance

- the lock-ready label remains inside the signal panel on compact/mobile chrome;
- the signal value remains readable at the right edge;
- no panel-width or gameplay-layout changes;
- full project gate passes before merge.
