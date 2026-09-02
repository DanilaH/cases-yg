# Behavioral probe validation

This file defines what the first public behavioral build is trying to prove and how to judge it without adding scope to rescue weak engagement.

The numbers below are **internal decision gates**, not claimed industry benchmarks.

---

# 1. Probe question — LOCKED

The first build exists to answer:

> **Does the core `tear → reveal → collect → repeat` loop create enough immediate desire to keep opening when the package itself is free and frictionless?**

Secondary questions:

- does the Collection create a meaningful payoff outside the reveal screen?
- does visible Signal progression make duplicates tolerable?
- does Hidden Pocket create a memorable surprise/chase beat?

The first probe is **not** intended to validate a package economy, crafting system, ad economy, daily retention program, or large content library.

---

# 2. Analytics implementation — LOCKED

Use two layers:

1. **Yandex Games built-in metrics** for platform-level traffic, playtime, return and technical/product metrics;
2. **Yandex Metrica** for the small custom gameplay funnel below.

No analytics backend is required.

Route custom events through one typed `analytics` adapter. Game scenes/systems should not call a provider-specific global directly.

Do not send personal data or arbitrary user-entered text.

---

# 3. Custom event set — LOCKED

Keep the event set intentionally small.

## Funnel / loop

- `first_package_interaction`
- `reveal_complete`
- `collection_open`
- `collection_return`

`reveal_complete` should carry compact parameters such as:

- session open index;
- lifetime open index;
- family;
- rarity;
- new vs duplicate;
- Signal before/after;
- whether SIGNAL LOCK was consumed;
- whether Hidden Pocket triggered after this standard reveal.

## Progression / chase

- `signal_lock_reached`
- `signal_lock_consumed`
- `hidden_pocket_triggered`
- `secret_discovered`
- `standard_collection_complete`

Do not create a separate custom event for every rarity/family combination; use event parameters instead.

---

# 4. Derived funnel checkpoints — LOCKED

From `reveal_complete`, derive continuation at:

- open #2;
- open #5;
- open #10;
- open #25;
- open #50.

Also track:

- first reveal completion rate after first package interaction;
- Collection visit rate among players who reached at least 5 opens;
- return-to-opener rate after entering Collection;
- median and distribution of session opens;
- duplicate rate over session depth;
- Signal locks reached/consumed;
- Hidden Pocket exposure and Secret discovery.

---

# 5. Decision sample — LOCKED

Do not make a product kill decision from a few dozen sessions.

First serious decision point:

> **at least 500 first-package interactions and at least 7 calendar days of public traffic**, provided there is no known instrumentation or technical failure.

If traffic composition changes materially during the sample, segment by device/country before interpreting a blended number.

---

# 6. Continue / tune / kill gates — LOCKED

## Strong enough to continue

Treat the core as validated enough for the next iteration when approximately all of these hold:

- first reveal completion: **≥ 92%** of first-package interactions;
- second-open continuation: **≥ 75%** of first-reveal completers;
- reach open #5: **≥ 55%**;
- reach open #10: **≥ 35%**;
- reach open #25: **≥ 15%**;
- Collection opened by **≥ 25%** of players who reach 5 opens;
- return to opener after Collection: **≥ 70%**.

These thresholds deliberately demand strong immediate repetition because the probe removes currency/energy friction.

## Tune before expanding

Tune presentation/balance when the game is between the strong and kill bands, especially when:

- first reveal is healthy but second/open-5 continuation falls off;
- Collection is rarely opened or players do not return from it;
- duplicate-heavy sessions correlate with sharp abandonment before Signal can help;
- reveal duration visibly becomes friction in repeated-opening tests.

Tuning order:

1. reveal feel/timing;
2. package interaction clarity;
3. rarity desirability/readability;
4. Collection payoff/navigation;
5. Signal pacing;
6. only then consider new content/systems.

## Kill or re-theme

Do not rescue the concept with more systems when, after the minimum sample and after technical issues are ruled out, either of these is true:

- second-open continuation is **< 55%**;
- open-10 continuation is **< 15%**.

Also strongly consider re-theme/kill if the first reveal works mechanically but players consistently ignore the Collection and higher-rarity/Secret outcomes produce no observable continuation lift.

---

# 7. Quick Reveal revisit — REQUIRED

Quick Reveal remains parked in the initial build, but must be reviewed once real repeated-opening data exists.

Revisit when either:

- median engaged sessions commonly exceed ~20 opens;
- playtests show the ~1.0–1.4 s full reveal becoming repetitive friction;
- continuation drops specifically after players have already learned the reveal pattern.

If needed, add a shorter ~0.4–0.6 s mode without changing reward semantics.

---

# 8. Monetization checkpoint — LOCKED

Do **not** include rewarded/interstitial advertising in the first behavioral probe.

Reason:

- ordinary openings are already free/unlimited;
- an ad-for-Signal shortcut would distort the duplicate/pity behavior being measured;
- ad integration adds another failure/pause/resume path before the core loop proves itself.

After the core clears the continuation gates, run a separate monetization pass. Do not artificially add energy/package scarcity just to create an ad reward.

---

# 9. Scope estimate — REBASED

Current first-probe target, excluding moderation waiting time:

- engineering/platform/responsive/save/analytics: ~1–1.5 focused days;
- opener/reveal/drop/Signal/Hidden Pocket: ~1.5–2 focused days;
- Collection Shelf + Library: ~0.5–1 focused day;
- final Camera/Flip Phone rarity + Secret art and scene polish: ~1.5–2.5 focused days;
- QA, store materials and moderation fixes: ~0.5–1 focused day.

Working total:

> **~5–8 focused days**, with art consistency as the largest uncertainty.

If the probe cannot be made submission-ready within roughly **8 focused days** without adding content/systems, perform a scope review instead of silently expanding the schedule.

---

# 10. Post-validation expansion order

If the probe works, expand in this order:

1. fix observed reveal/Collection friction;
2. decide Quick Reveal from data;
3. add a small number of new gadget families;
4. then evaluate monetization;
5. only then reconsider Tech Parts / Mod Bench, Daily Spotlight, additional package types or other retention systems.

New systems must solve observed problems, not merely make the feature list larger.
