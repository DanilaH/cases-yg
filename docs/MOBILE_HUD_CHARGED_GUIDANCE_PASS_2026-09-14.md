# Signal 2000 — Mobile HUD + Charged Guidance Pass

**Date:** 2026-09-14  
**Status:** IMPLEMENTED — AUTOMATED GATE GREEN, AWAITING PHONE ACCEPTANCE  
**Trigger:** second real-phone acceptance pass after mobile layout cleanup and orientation hotfix

## Scope

This pass is intentionally narrow. It addresses two remaining real-phone presentation defects without changing gameplay, economy, RNG, save semantics, reward transactions, pouch odds, Signal/Overcharge rules, or Yandex runtime behavior.

## A. Top-left HUD is still visually cramped

Observed on a real landscape phone: CHIPS and SIGNAL/OVERCHARGE are now readable, but their compact cards still feel vertically compressed. Labels, values, progress segments, and card edges have insufficient breathing room.

Code recheck confirms the cause:

- compact CHIPS card is `84` logical px high while using a `20px` label and `30px` value;
- the CHIPS value baseline sits at `y=61`, leaving little bottom room;
- compact SIGNAL card is `88` logical px high while its rows sit at `y=7` and `y=38`, with Signal segments centered at `y=76`;
- the selector starts from a fixed compact top offset, so simply increasing card heights without moving the selector would create another overlap regression;
- several Signal/reward motion targets still use desktop presentation constants instead of the active compact HUD geometry.

Required result:

- compact CHIPS and SIGNAL cards gain visibly more vertical breathing room;
- internal top/bottom padding becomes intentional rather than incidental;
- `OVERCHARGE x1.00` does not press against either the Signal title row or progress segments;
- the POUCH selector moves down only as much as required to preserve a clean gap below the enlarged HUD;
- desktop geometry remains unchanged;
- all HUD-targeted presentation effects use current chrome sizing, not stale desktop constants.

## B. First Charged tutorial pointer appears before the Charged control is visually ready

Observed: when the wallet crosses 60 CHIPS after collecting a result, the Charged tutorial pointer may appear before the idle pouch selector has finished rebuilding/appearing.

Code recheck confirms the race:

- economic eligibility is determined correctly by `shouldShowChargedOnboardingPointer()`;
- `GuidanceScene` clears `openingTransactionActive` on `result_collected` and asynchronously refreshes save state immediately;
- `OpeningScene` rebuilds the idle shell separately;
- the pointer gate currently knows only economic state and scene activity, not whether the Charged card is actually rendered and visually settled.

Required sequencing:

```text
result collected
→ updated wallet becomes durable
→ OpeningScene returns to idle
→ pouch selector exists
→ Charged card is visible/settled
→ then the first Charged pointer may appear
```

The pointer must not be delayed until some unrelated later interaction. Once both economic eligibility and visual readiness are true, it should appear on the next presentation frame.

## Implementation plan

1. Expand compact HUD sizing in the shared `openingChromeLayout` source of truth.
2. Re-space CHIPS/SIGNAL internals for the new compact card heights.
3. Move compact selector top offset enough to preserve breathing room below the HUD.
4. Replace stale Signal animation targets that still use desktop HUD dimensions with active chrome sizing.
5. Expose a narrow `OpeningScene` readiness predicate for Charged guidance (`idle` + Charged card rendered/visible/settled).
6. Gate `shouldShowChargedOnboardingPointer()` on that visual-ready fact in addition to existing economic conditions.
7. Let `GuidanceScene` re-evaluate the pointer while Opening is active so it appears immediately after the card becomes ready, without adding a magic timeout.
8. Add focused unit coverage for compact HUD geometry and visual-readiness gating.
9. Run the full project gate.
10. Independently review the final diff for economy/state regressions, stale coordinates, and accidental desktop changes before merge.
11. Merge, wait for `main` CI and GitHub Pages deploy, then do another real-phone acceptance pass.

## Automated gate

- `npm ci`
- `npm run typecheck`
- `npm test`
- `npm run assets:selftest`
- `npm run assets:validate`
- `npm run build`

## Phone acceptance

- CHIPS card has clear top/bottom padding around both title and value;
- SIGNAL title/value row, OVERCHARGE row, and progress segments no longer visually collide;
- POUCH starts with a deliberate gap below the Signal card;
- no compact HUD element clips or escapes its panel;
- first Charged pointer never appears before the Charged card itself;
- when the wallet first reaches the Charged threshold and idle chrome becomes ready, the pointer appears without requiring another tap/open/drop switch;
- returning from Charged to Basic still makes the pointer reappear while the first-Charged milestone is incomplete;
- pointer remains suppressed during active opening/reveal/result transaction states;
- desktop layout remains unchanged.

## Implementation result

Implemented on `mobile-hud-charged-guidance-pass`.

Compact HUD geometry now uses one shared profile:

- CHIPS height: `96` logical px (was `84`);
- SIGNAL height: `112` logical px (was `88`);
- HUD card gap: `14` logical px;
- POUCH selector top offset: `256` logical px (was `214`), leaving a deliberate gap below the enlarged HUD;
- desktop sizes remain the existing `64/64` CHIPS/SIGNAL heights with the existing selector geometry.

CHIPS internals were re-spaced around the taller card. SIGNAL title/value, OVERCHARGE row, and progress segments now use separate vertical bands. Signal arrival/reward presentation targets no longer use desktop `OPENING_FEEL_PRESENTATION` HUD sizes; they resolve from the active chrome profile.

Charged onboarding now has two independent gates:

1. economic eligibility (`chips >= Charged cost`, no first Legendary committed, Basic selected, no pending reveal);
2. visual readiness reported by `OpeningScene`: idle phase, no Drop/art transition, Charged card exists, is visible, and has reached at least 90% of its intended idle alpha.

`GuidanceScene` re-evaluates that lightweight readiness while Opening is active. This removes the race without an arbitrary delay: the pointer cannot lead the control, but appears on the next presentation frame once the card is actually settled enough to guide toward.

## Independent review

Independent post-implementation review checked the full branch against the two reported phone failures and the project guardrails.

Findings:

- no gameplay/economy/RNG/save/reward/Yandex semantics changed;
- desktop HUD dimensions and existing desktop coordinates remain unchanged;
- the compact HUD has explicit room between title/value/Overcharge/progress bands and between the HUD stack and POUCH selector;
- stale direct uses of `OPENING_FEEL_PRESENTATION.signalHudWidth`, `chipsHudHeight`, and `signalHudHeight` for Signal motion targets are gone from `OpeningScene`;
- Charged guidance cannot appear during reveal/result/banking because the visual-readiness predicate requires `OpeningScene` phase `idle`;
- it also cannot appear during Drop switching or pouch-art loading;
- returning to Basic after selecting Charged remains eligible because the existing `pouch_selected` event updates Guidance selection state and the same readiness/economy gates are re-evaluated;
- frame-level re-evaluation performs no storage reads and creates no new object while a pointer already exists.

Focused tests cover the larger compact HUD geometry, preserved desktop sizes, the intentional HUD-to-selector gap, and the new `chargedControlReady=false` suppression case.

The full implementation gate passed: `npm ci`, typecheck, unit tests, asset self-test, asset validation, and production build.
