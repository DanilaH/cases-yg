from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'missing expected text in {path}: {old[:120]!r}')
    if text.count(old) != 1:
        raise SystemExit(f'expected one match in {path}, found {text.count(old)}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')


spec = r'''# Final hands-on correction + Signal Overcharge

Status: **APPROVED NEXT / NOT CURRENT RUNTIME**.

This document captures the evidence-backed findings from the latest direct hands-on plus the approved Signal Overcharge extension. It supersedes older statements that Overcharge is globally parked. Existing Lite V2 balance remains the runtime baseline until this pass is implemented and independently revalidated.

The pass must remain bounded: fix the observed UI/input issues, make Signal and Secret self-explanatory, add one small Signal-to-economy extension, simulate its tuning, and stop. It is not permission to add a shop, multiple currencies, crafting, auto-open, new families or a large meta layer.

---

# 1. Direct hands-on findings

The latest hands-on found eight concrete issues/opportunities:

1. the opaque black rarity backing looks visually foreign to the rest of the result UI;
2. long reward rows can overflow, especially Legendary recycle copy;
3. Signal lacks a clear player-facing purpose/cause→effect story;
4. repeated unaffordable-Charged clicks can accumulate denial-tween displacement;
5. affordable paid pouches that are not selected need a restrained availability affordance;
6. Secret discovery is visually special but its reward meaning is not explicit;
7. Secret reveal needs a stronger premium feel peak/settle;
8. at full eligible-standard completion, an armed `4/4` Signal can remain useful only if it gains a secondary role.

These findings justify one bounded pre-DRAFT correction/extension pass.

---

# 2. Pass A — UI/input defects

## 2.1 Rarity badge

Keep rarity prominent, but remove the opaque black rectangular backing.

Target treatment:

- integrated tinted/outlined capsule or equivalent lightweight rarity treatment;
- rarity color remains obvious;
- item name remains the primary title;
- no large solid black block;
- verify Common/Rare/Epic/Legendary/Secret in EN/RU at 800/900/1280 widths.

## 2.2 Reward tray overflow

Reward rows must fit the supported compact layout without clipping.

Requirements:

- long recycle + rarity copy must not overflow;
- prefer a compact semantic ordering or a small rarity sub-tag rather than shrinking all reward typography;
- layout must be validated with Legendary + recycle + cache + Signal in the same tray;
- keep semantic reward colors, but do not turn the tray into a rainbow.

## 2.3 Charged denial re-entry

Rapid unaffordable-Charged input must never accumulate transform drift.

Requirements:

- kill/replace the active denial tween before starting another;
- reset the control to its canonical base transform before every denial response;
- repeated clicks remain acknowledged but bounded;
- no economy/selection mutation.

## 2.4 Available paid-pouch affordance

An affordable paid pouch that is not currently selected may use a rare, subtle nudge/pulse to communicate availability.

Constraints:

- no permanent shake;
- Basic/free does not need this attention pattern;
- selected pouch does not nudge;
- cadence must stay calm enough for future multi-pouch/multi-Drop UI.

---

# 3. Pass B — Signal clarity

The UI must teach the loop without a modal:

> duplicate → `+1 SIGNAL` → `4/4 LOCK READY` → lock is retained or consumed → visible consequence.

## 3.1 Signal reward copy

When Signal is gained, the reward tray should communicate progress, not only `+1 SIGNAL`.

Direction:

```text
SIGNAL +1 · 3/4
```

At threshold:

```text
SIGNAL +1 · LOCK READY
```

The exact localized copy may change for fit, but the progress/result meaning must remain explicit.

## 3.2 Lock ready

At `4/4`:

- Signal HUD gives a short electronic readiness pulse;
- the relevant eligible paid pouch may receive a linked visual response;
- UI clearly reads `LOCK READY` rather than leaving four anonymous filled segments.

## 3.3 Lock retained

If the selected pouch has no eligible missing standard item:

- the roll proceeds normally;
- Signal stays armed;
- UI explicitly communicates that the lock was retained rather than silently doing nothing;
- Overcharge rules in section 5 apply when Signal was already armed before the opening.

## 3.4 Lock consumed

When an eligible NEW is guaranteed:

- current reward resolves normally;
- UI shows `LOCK CONSUMED` / equivalent;
- energy/discharge should visually connect Signal to the guaranteed result;
- Signal resets to `0/4` only after the current reward/Overcharge cash-out semantics have been presented.

---

# 4. Pass B — Secret semantics and feel

## 4.1 Reward meaning

Current runtime only rolls an undiscovered Secret; the current slice does **not** roll Secret duplicates. Therefore a Secret currently represents a collection discovery, not recycle income.

The result/reward presentation must say this explicitly, for example:

```text
SECRET DISCOVERED
ADDED TO COLLECTION
```

or an equivalent compact reward-tray row.

Do not invent a Secret CHIPS payout merely to fill the tray. If Secret duplicates are introduced later, their recycle/economy rule becomes a separate design decision.

## 4.2 Secret celebration

Hidden Pocket remains the strongest surprise beat.

Add a bounded premium effect:

- moving diffuse aura/cloud behind the Secret;
- restrained drifting particles/sparkles;
- stronger reveal burst;
- stronger but short object shake/overshoot;
- energetic peak followed by a calm premium settle.

Avoid a permanent fireworks loop or full-screen visual noise.

---

# 5. Signal Overcharge — approved mechanic

## 5.1 Purpose

Overcharge gives an armed Signal value when its collection lock cannot currently be consumed. It also makes the Signal system legible and creates a small economic decision between continuing to farm and spending CHIPS on a more eligible pouch.

It is a secondary state of the existing Signal system, not a new currency.

## 5.2 State model

Signal still uses the existing `0/4 → 4/4` pity model.

Overcharge is inactive at `x1.00`.

The key ordering rule:

> the multiplier used for an opening is the multiplier that existed **before that opening's reward was calculated**. Any gain or reset caused by that opening happens only after the reward is shown.

Consequences:

- an opening that first moves Signal `3/4 → 4/4` does **not** also gain Overcharge;
- if Signal was already `4/4` and the lock is retained, the current multiplier applies to this opening, then the selected pouch adds Overcharge for the **next** opening;
- if Signal was already `4/4` and the lock is consumed, the current multiplier still applies to this opening, then resets to `x1.00`;
- if Overcharge is already at cap and the lock is retained, the multiplier still applies but no fake `+gain` mutation/flight is shown.

## 5.3 CHIPS calculation

Multiply all CHIPS earned by the pouch opening, not pouch cost and not external grants.

```text
rawEarned = baseChips + cacheBonus + recycleChips
overchargeBonus = round(rawEarned * (multiplier - 1))
finalEarned = rawEarned + overchargeBonus
walletDelta = finalEarned - pouchCost
```

Round once at the bonus/final-earned boundary; do not round each component independently.

Hidden Pocket/Secret collection value itself is not multiplied because it is not CHIPS.

## 5.4 Pouch-specific gain

Each pouch profile owns an `overchargeGain` tuning value.

Initial simulation candidates, **not release-locked values**:

```text
Basic   +0.10
Charged +0.50
```

Future pouch types may use different gains. The gain is a balance lever and must be simulated before implementation is considered tuned.

## 5.5 Cap

Overcharge must have a finite cap. The exact cap is **OPEN FOR TUNING**.

At cap:

- multiplier continues to apply to every eligible CHIPS reward;
- no `OVERCHARGE +X` line is shown because no value changed;
- no fake energy token flies to the HUD;
- reward/HUD may show `OVERCHARGE MAX` / `MAX OVERCHARGE ACTIVE`;
- max state uses a visibly saturated treatment rather than looking disabled.

Candidate caps to compare in simulation include `x1.30`, `x1.50` and, only if economy permits, a higher ceiling.

## 5.6 Completion behavior

If the active Drop/selected-pouch eligibility leaves the lock with nothing to guarantee, Signal does not become dead UI.

It remains `4/4` and Overcharge can continue to provide/cap an economic multiplier until an eligible future lock target exists.

When later content or another eligible pouch makes a guaranteed NEW possible, the existing lock may consume normally and discharge Overcharge after the cash-out opening.

---

# 6. Overcharge presentation

## 6.1 Signal HUD states

### Inactive

```text
SIGNAL 2/4
OVERCHARGE x1.00
```

`OVERCHARGE` and `x1.00` are deliberately low-contrast / nearly dormant.

### Active

```text
SIGNAL 4/4 · LOCK
OVERCHARGE x1.20
```

Active Overcharge uses the established electric/cyan language.

### Maximum

```text
SIGNAL 4/4 · LOCK
OVERCHARGE x1.50 · MAX
```

Maximum uses a hot-pink/coral-red overloaded state, distinct from both dormant and normal cyan active states. It should read as saturated power, not an error.

A tiny segmented Overcharge progression indicator is allowed only if it improves comprehension without overcrowding the existing Signal card.

## 6.2 Current-opening bonus in reward tray

When multiplier > `x1.00`, explicitly show the contribution.

Example:

```text
+37 CHIPS
OVERCHARGE x1.20   +0 → +7
TOTAL +44 CHIPS
```

The exact composition can be compacted, but the player must be able to see:

- raw earned CHIPS;
- active multiplier;
- additional CHIPS caused by Overcharge;
- final total.

The Overcharge bonus value should count from zero to its final value. The main CHIPS total may simultaneously count from raw to final if the motion remains readable.

When multiplier is `x1.00`, do not add an unnecessary Overcharge bonus row to ordinary rewards.

## 6.3 Gain after reward

If lock is retained and multiplier is below cap, the final reward-tray beat shows the pouch contribution, for example:

```text
OVERCHARGE +0.10
```

or:

```text
OVERCHARGE +0.50
```

Then a small energy fragment travels from the reward tray to the Signal HUD and the HUD counts/punches:

```text
x1.20 → x1.30
```

This happens **after** the current reward calculation/presentation.

## 6.4 Cap after reward

If already at cap:

```text
OVERCHARGE MAX
```

No fake gain amount and no gain flight.

## 6.5 Discharge

When lock consumes:

1. current multiplier still contributes to the current CHIPS reward;
2. guaranteed NEW/lock consumption is communicated;
3. energy visibly discharges from Signal toward the result;
4. multiplier resets after the cash-out:

```text
OVERCHARGE x1.50 → x1.00
```

Discharge/reset should be a stronger beat than an ordinary `+0.10` gain.

---

# 7. Economy simulation before tuning lock

The mechanic contract above is approved; tuning is not.

Before locking numbers, simulate at minimum:

- Basic/Charged gain combinations such as `+0.05/+0.15`, `+0.10/+0.25`, `+0.10/+0.50`;
- caps `x1.30`, `x1.50`, and only if viable a higher cap;
- expected duration of retained-lock streaks;
- extra CHIPS EV per Basic/Charged opening;
- time-to-60 Charged affordability;
- cache/Big/Mega jackpot interaction with multiplier;
- all-duplicate Charged net-return invariant;
- complete-Drop long-run CHIPS inflation;
- future expensive-pouch price bands.

The existing economy remains the baseline comparator.

---

# 8. Future expensive pouch — hypothesis, not this pass

Overcharge creates a useful foundation for a later high-cost sink, but this pass does not implement one.

Candidate direction:

- several hundred CHIPS rather than ~60;
- high-tier rarity profile and/or materially higher Secret access;
- possibly a future Secret-guarantee rule only if collection scale supports it;
- intended to become reachable more comfortably through sustained Overcharge without making Basic/Charged obsolete.

Price, contents, eligibility and Secret guarantees require economy/content-scale simulation. Do not commit them now.

---

# 9. Implementation order

1. **UI/input bug pass** — rarity treatment, reward overflow, Charged denial drift, available paid-pouch affordance.
2. **Signal/Secret clarity pass** — Signal gain/ready/retain/consume communication; explicit Secret collection reward meaning.
3. **Secret feel pass** — aura/cloud, burst, particles, stronger bounded shake/settle.
4. **Signal Overcharge engine + transaction/save model** — deterministic and recovery-safe before presentation polish.
5. **Overcharge reward/HUD presentation** — bonus count-up, post-reward gain, cap, discharge.
6. **Economy simulation/tuning** — choose pouch gains/cap only from results.
7. **Exact browser/video audit + direct hands-on regression**.
8. If accepted, proceed to real Yandex DRAFT.

Do not implement the future expensive pouch in this sequence.

---

# 10. Validation requirements

Technical:

- strict typecheck;
- full unit suite;
- asset self-test/validation;
- production build;
- deterministic transaction/recovery tests for Overcharge gain/cap/consume/reset;
- no double bonus or reroll after refresh;
- pouch cost excluded from multiplier;
- exact final wallet equals committed transaction.

Browser/visual:

- EN/RU 800/900/1280;
- Common/Rare/Epic/Legendary/Secret result treatment;
- maximum-density reward tray;
- 20+ rapid unaffordable Charged clicks without drift;
- Signal `3/4 → 4/4`;
- retained lock + first Overcharge gain;
- active multiplier reward count-up;
- different Basic vs Charged Overcharge gains;
- cap entry + repeated MAX opening;
- lock consume + cash-out + reset;
- complete-Drop Overcharge behavior;
- Hidden Pocket collection reward + stronger Secret celebration;
- recovery/reload during each new durable state transition.

Generated artifacts do not self-approve; manual review and direct hands-on remain required.
'''

Path('docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md').write_text(spec, encoding='utf-8')

# DECISIONS.md
replace_once(
    'docs/DECISIONS.md',
    '| Current stage | LOCKED | Second repeated-use hands-on completed with narrow findings; bounded follow-up polish through PR #45 is merged and exact-revision/manual-review approved. Current gate is **final hands-on acceptance** of the latest build, then real Yandex DRAFT if accepted |',
    '| Current stage | LOCKED | Final direct hands-on produced a bounded new finding set. Current gate is **final hands-on correction + approved Signal Overcharge extension**, followed by exact audit/direct regression; real Yandex DRAFT follows only after that pass is accepted |',
)
replace_once(
    'docs/DECISIONS.md',
    '| Signal rule | CURRENT RUNTIME | duplicate `+1`; `4/4` arms lock; next selected-pouch-eligible NEW is guaranteed; consume → `0/4` |\n| Basic-only zero-eligible edge | CURRENT RUNTIME | if only Legendary remains, Basic resolves normally and Signal stays `4/4`; UI communicates `SIGNAL LOCK · CHARGED` |',
    '| Signal rule | CURRENT RUNTIME | duplicate `+1`; `4/4` arms lock; next selected-pouch-eligible NEW is guaranteed; consume → `0/4` |\n| Signal clarity extension | LOCKED NEXT | make gain → `4/4 LOCK READY` → retain/consume cause→effect explicit in reward tray + Signal HUD; no tutorial modal required |\n| Signal Overcharge | LOCKED NEXT | if Signal was already `4/4` and the selected pouch cannot consume the lock, current Overcharge multiplies `base + cache + recycle`, then that pouch increases the multiplier for the next opening; consuming the lock cashes out the current multiplier then resets to `x1.00`; cap is finite and remains useful at MAX |\n| Overcharge tuning | OPEN FOR TUNING | initial simulation candidates include Basic `+0.10`, Charged `+0.50`; exact pouch gains and cap are not release-locked until simulation |\n| Basic-only zero-eligible edge | CURRENT RUNTIME | if only Legendary remains, Basic resolves normally and Signal stays `4/4`; UI communicates `SIGNAL LOCK · CHARGED` |',
)
replace_once(
    'docs/DECISIONS.md',
    '| Result rarity hierarchy | CURRENT RUNTIME | larger rarity capsule + rarity-tinted result border; rarity remains secondary to item name but no longer reads as incidental metadata |',
    '| Result rarity hierarchy | CURRENT RUNTIME | rarity remains secondary to item name but must read clearly |\n| Rarity badge follow-up | LOCKED NEXT | remove the opaque black backing from the current rarity badge; retain prominence with a lighter integrated tinted/outlined treatment |\n| Reward tray density | LOCKED NEXT | prevent long recycle/rarity rows from overflowing at compact widths while preserving semantic colors and readability |',
)
replace_once(
    'docs/DECISIONS.md',
    '| Unaffordable Charged attempt | CURRENT RUNTIME | acknowledge input with wiggle/cost flash/HUD response; no modal and no mutation |',
    '| Unaffordable Charged attempt | CURRENT RUNTIME | acknowledge input with wiggle/cost flash/HUD response; no modal and no mutation |\n| Charged denial re-entry | LOCKED NEXT | rapid repeated denial input must kill/reset the previous denial tween to canonical transform; no cumulative x/y drift |\n| Available paid-pouch affordance | LOCKED NEXT | affordable non-selected paid pouches may use a rare subtle nudge/pulse; no permanent shake, no Basic/free attention loop |',
)
replace_once(
    'docs/DECISIONS.md',
    '| Rarity shimmer | CURRENT RUNTIME | restrained Common → stronger Rare/Epic/Legendary electronic/iridescent hierarchy; Secret remains strongest/distinct |',
    '| Rarity shimmer | CURRENT RUNTIME | restrained Common → stronger Rare/Epic/Legendary electronic/iridescent hierarchy; Secret remains strongest/distinct |\n| Secret reward meaning | LOCKED NEXT | current undiscovered-only Secret roll is a collection discovery, not recycle income; reward/result UI must explicitly communicate `SECRET DISCOVERED` / added-to-collection meaning |\n| Secret celebration | LOCKED NEXT | add bounded moving aura/cloud, particles, stronger burst and short object shake/overshoot, then settle; no permanent fireworks loop |',
)
replace_once('docs/DECISIONS.md', '- Overcharge;\n', '')
replace_once(
    'docs/DECISIONS.md',
    '| Final hands-on acceptance | OPEN | **current product gate**: play the latest merged build and judge the corrected tactile/audio/result feel in normal repetition |\n| Real Yandex DRAFT | OPEN | next external gate after final hands-on acceptance |',
    '| Final hands-on acceptance | COMPLETE WITH FINDINGS | direct play exposed rarity-badge styling, reward overflow, Charged denial drift, Signal/Secret clarity and completed-collection Signal-value issues |\n| Final hands-on correction + Signal Overcharge | LOCKED NEXT | current product gate; detailed contract in `FINAL_HANDS_ON_OVERCHARGE_PLAN.md` |\n| Real Yandex DRAFT | OPEN | next external gate only after the new bounded pass + exact/direct regression are accepted |',
)
replace_once(
    'docs/DECISIONS.md',
    '> **GO: run final hands-on acceptance on the latest merged/audited build. If accepted, proceed to real Yandex DRAFT. Do not add mechanics/content or tune balance before that evidence.**',
    '> **GO: implement the bounded final-hands-on correction plus the approved Signal Overcharge contract in `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`; simulate its tuning, exact-audit the result and run direct regression. Do not add the future expensive pouch or unrelated meta/content before that evidence.**',
)

# GAMEPLAY_SYSTEMS.md
replace_once(
    'docs/GAMEPLAY_SYSTEMS.md',
    'At lock, use a brief electronic pulse/flicker/glitch. No long blocking animation.\n\n---\n\n# 6. Hidden Pocket — CURRENT RUNTIME',
    '''At lock, use a brief electronic pulse/flicker/glitch. No long blocking animation.\n\n## 5.1 Approved next extension — Signal Overcharge (NOT CURRENT RUNTIME)\n\nCanonical next-pass detail: `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`.\n\nWhen Signal was already `4/4` before an opening and the selected pouch has no eligible missing standard item, the lock is retained and Overcharge gives Signal a secondary economic role.\n\nLocked semantics:\n\n```text\nrawEarned = base + cache + recycle\nbonus = round(rawEarned * (multiplier - 1))\nfinalEarned = rawEarned + bonus\n```\n\n- pouch cost is not multiplied;\n- first `3/4 → 4/4` does not gain Overcharge on the same opening;\n- retained lock: current multiplier applies, then pouch-specific gain affects the next opening;\n- consumed lock: current multiplier applies to the cash-out opening, then resets to `x1.00`;\n- finite cap remains an active max multiplier; cap state shows MAX rather than fake `+gain`;\n- exact Basic/Charged gains and cap remain open for simulation/tuning.\n\nPresentation must make inactive/active/MAX states, bonus CHIPS, post-reward gain and discharge/reset visible.\n\n---\n\n# 6. Hidden Pocket — CURRENT RUNTIME''',
)
replace_once(
    'docs/GAMEPLAY_SYSTEMS.md',
    '- current slice does not roll Secret duplicates;\n- at most one Secret per opening.\n\nHidden Pocket remains the strongest surprise beat. New neon/rarity treatment must not flatten it.',
    '- current slice does not roll Secret duplicates;\n- at most one Secret per opening.\n\nCurrent Secret value is collection discovery, not recycle income. The next bounded pass must explicitly communicate that reward meaning and strengthen the reveal with a bounded aura/cloud + particle/burst/shake treatment.\n\nHidden Pocket remains the strongest surprise beat. New neon/rarity treatment must not flatten it.',
)
replace_once(
    'docs/GAMEPLAY_SYSTEMS.md',
    '> **second 20–30 opening hands-on on merged `main`**.\n\nOnly after acceptance: real Yandex DRAFT.',
    '> **bounded final-hands-on correction + approved Signal Overcharge extension, followed by exact audit and direct regression**.\n\nOnly after acceptance: real Yandex DRAFT.',
)
replace_once('docs/GAMEPLAY_SYSTEMS.md', '- Overcharge / Archive;\n', '- Archive;\n')
replace_once(
    'docs/GAMEPLAY_SYSTEMS.md',
    'The pass should make the same mechanics feel substantially more expensive and responsive.',
    'The approved exception is the small Signal Overcharge extension specified in `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`; do not treat it as permission for unrelated meta-system expansion.',
)

# IMPLEMENTATION_ROADMAP.md
old_order = '''## Current execution order\n\n1. **Opening Feel Correction — COMPLETE**\n2. **Exact-revision combined visual/video audit + manual review — COMPLETE**\n3. **Second repeated-use hands-on — COMPLETE WITH FOLLOW-UP FINDINGS**\n4. **Bounded post-hands-on UI/feel polish — COMPLETE / AUDITED / MERGED**\n5. **Final hands-on acceptance on latest merged build — CURRENT REQUIRED GATE**\n6. **Real Yandex DRAFT validation — NEXT EXTERNAL GATE**\n7. **Content/release expansion — BLOCKED until draft passes**\n8. **Public release hardening**\n\nThe repeated-use passes have already produced and closed specific presentation/input findings. The correct response remains bounded correction of evidence-backed defects, not another gameplay-system pass.\n\nDo not change balance numbers, expand content or add new meta systems before final hands-on acceptance + hosted DRAFT provide evidence.'''
new_order = '''## Current execution order\n\n1. **Opening Feel Correction — COMPLETE**\n2. **Exact-revision combined visual/video audit + manual review — COMPLETE**\n3. **Second repeated-use hands-on — COMPLETE WITH FOLLOW-UP FINDINGS**\n4. **Bounded post-hands-on UI/feel polish — COMPLETE / AUDITED / MERGED**\n5. **Final direct hands-on — COMPLETE WITH NEW BOUNDED FINDINGS**\n6. **Final-hands-on correction + Signal Overcharge — CURRENT APPROVED PASS**\n7. **Exact audit + direct regression of that pass — REQUIRED**\n8. **Real Yandex DRAFT validation — NEXT EXTERNAL GATE**\n9. **Content/release expansion — BLOCKED until draft passes**\n10. **Public release hardening**\n\nThe latest direct play exposed concrete UI/input/clarity issues plus one legitimate dead-Signal edge after collection completion. The approved response is still bounded: fix those findings and add only the explicitly specified Signal Overcharge extension.\n\nDo not tune legacy economy numbers by intuition. Overcharge gain/cap are allowed only as simulation-driven tuning inside the approved pass. Do not expand content or add unrelated meta systems before hosted DRAFT.'''
replace_once('docs/IMPLEMENTATION_ROADMAP.md', old_order, new_order)

old_phase25 = '''# Phase 2.5 — final hands-on acceptance — CURRENT REQUIRED GATE\n\nPlay the latest merged build normally before moving to hosted validation. This is not another open-ended polish pass. The goal is to confirm that the fixes feel right in real repetition.\n\nJudge especially:\n\n- whether the new star-grab `pouch-grab` cue sounds satisfying rather than cheap or irritating;\n- whether reward tray → result panel staging now reads as one continuous composition;\n- whether rarity is easier to read without overpowering the collectible name;\n- whether cache/recycle/Signal colors improve scanning without turning the tray into a rainbow;\n- whether tap-to-speed-up → separate tap-to-collect remains natural;\n- whether CHIPS banking and `chip-clack` stay pleasant across repeated openings;\n- whether any remaining delay or animation becomes irritating over a normal session.\n\nIf this passes, stop polishing the same loop and go to hosted DRAFT. If one narrow issue remains, make the smallest correction and re-audit only the affected behavior plus regression essentials.\n\n---\n\n# Deferred information pass — NOT PART OF 2.1'''
new_phase25 = '''# Phase 2.5 — final direct hands-on — COMPLETE WITH FINDINGS\n\nDirect play confirmed the opener is broadly enjoyable but exposed a bounded set of remaining issues:\n\n- opaque black rarity backing feels visually foreign;\n- maximum-density reward copy can overflow;\n- Signal's purpose/retain/consume behavior is not self-explanatory enough;\n- unaffordable Charged denial tween can accumulate displacement under rapid clicking;\n- affordable non-selected paid pouches need a restrained availability affordance;\n- Secret discovery lacks explicit reward/collection meaning;\n- Secret reveal can support a stronger premium aura/burst/shake settle;\n- completed/zero-eligible states leave armed Signal without enough continuing value.\n\nThese findings justify one final bounded pass before DRAFT.\n\n---\n\n# Phase 2.6 — final-hands-on correction + Signal Overcharge — CURRENT APPROVED PASS\n\nCanonical contract: `docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md`.\n\nExecution order:\n\n1. fix rarity badge treatment, reward overflow and Charged denial drift;\n2. add subtle affordance for affordable non-selected paid pouches;\n3. make Signal gain → ready → retain/consume semantics explicit;\n4. make current Secret collection reward explicit and strengthen the Secret celebration;\n5. implement deterministic/recoverable Signal Overcharge state/economy;\n6. add HUD/reward presentation for multiplier bonus, post-reward gain, MAX and discharge;\n7. simulate pouch gains/cap and lock only evidence-backed tuning;\n8. run exact browser/video audit + direct repeated-use regression.\n\nInitial tuning candidates include Basic `+0.10` and Charged `+0.50`, but those numbers and the multiplier cap are explicitly **OPEN FOR TUNING** until simulation.\n\nThe future several-hundred-CHIPS high-tier/Secret-oriented pouch is a later hypothesis only; do not implement it in Phase 2.6.\n\n---\n\n# Deferred information pass — NOT PART OF 2.1'''
replace_once('docs/IMPLEMENTATION_ROADMAP.md', old_phase25, new_phase25)
replace_once(
    'docs/IMPLEMENTATION_ROADMAP.md',
    'Run `docs/YANDEX_SLICE_VALIDATION.md` only after Phase 2.5 acceptance.',
    'Run `docs/YANDEX_SLICE_VALIDATION.md` only after Phase 2.6 implementation, exact audit and direct regression are accepted.',
)
replace_once('docs/IMPLEMENTATION_ROADMAP.md', '- Overcharge / Archive levels;\n', '- Archive levels;\n')
replace_once(
    'docs/IMPLEMENTATION_ROADMAP.md',
    '> **Current next action: run final hands-on acceptance on the latest merged/audited build; if accepted, go to Yandex DRAFT.**',
    '> **Current next action: implement `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`, simulate Overcharge tuning, exact-audit/directly regress the result, then go to Yandex DRAFT only if accepted.**',
)

# OPEN_QUESTIONS.md
insert_after_balance = '''- does Signal threshold `4` feel relevant without becoming constant?\n\n---\n\n# 3. Odds / Drop contents / collection-progress surface — DEFERRED NEXT CANDIDATE'''
new_balance = '''- does Signal threshold `4` feel relevant without becoming constant?\n\n## 2.1 Signal Overcharge tuning — APPROVED MECHANIC, NUMBERS OPEN\n\nThe mechanic contract is approved in `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`; only its tuning remains unresolved.\n\nLocked semantics:\n\n- multiply `base + cache + recycle` CHIPS earned by the opening; never multiply pouch cost;\n- current multiplier applies before any gain/reset caused by the same opening;\n- retained lock gains Overcharge only after reward;\n- consumed lock cashes out current multiplier then resets to `x1.00`;\n- first `3/4 → 4/4` opening does not gain Overcharge;\n- cap remains an active multiplier and shows MAX rather than fake gain.\n\nSimulation questions:\n\n- Basic/Charged gain: compare at least `+0.05/+0.15`, `+0.10/+0.25`, `+0.10/+0.50`;\n- cap: compare at least `x1.30` and `x1.50`;\n- long-run CHIPS inflation after Drop completion;\n- cache/Big/Mega jackpot amplification;\n- effect on time-to-Charged and all-duplicate Charged net return;\n- viable future several-hundred-CHIPS sink price.\n\nInitial product-feel candidate is Basic `+0.10`, Charged `+0.50`; this is not release-locked until simulation.\n\n---\n\n# 3. Odds / Drop contents / collection-progress surface — DEFERRED NEXT CANDIDATE'''
replace_once('docs/OPEN_QUESTIONS.md', insert_after_balance, new_balance)
replace_once('docs/OPEN_QUESTIONS.md', '- Overcharge;\n', '')
replace_once(
    'docs/OPEN_QUESTIONS.md',
    'Re-open exactly one only if the proven loop has a specific retention/progression problem that it solves cheaply.\n\n---\n\n# What is NOT open anymore',
    '''Re-open exactly one only if the proven loop has a specific retention/progression problem that it solves cheaply.\n\n## 9.1 Future expensive pouch — HYPOTHESIS AFTER OVERCHARGE VALIDATION\n\nA several-hundred-CHIPS pouch may later provide a high-tier collection sink, stronger Secret access or another premium pool. Overcharge may make that target more reachable, but price/content/guarantee rules are deliberately unresolved until Overcharge simulation + hosted/content-scale evidence.\n\nDo not implement it in the current bounded pass.\n\n---\n\n# What is NOT open anymore''',
)

print('Applied final hands-on + Overcharge documentation plan.')
