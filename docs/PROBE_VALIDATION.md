# Internal slice validation

The Camera + Flip Phone build is a **private vertical slice for direct user/developer review**. It is not a public behavioral experiment and is not submitted to Yandex moderation as the final game.

Its job is to answer:

> **Is the core opener good enough, technically correct enough and production-ready enough to justify mass-producing content on top of it?**

---

# 1. Acceptance dimensions

## Feel

- tear gesture is obvious and pleasant on mouse/touch;
- reveal feels satisfying and visually coherent;
- repeated opening remains tolerable over at least 50+ manual/forced cycles;
- rarity escalation is readable and desirable;
- result state is readable without slowing the loop excessively.

## Progression

- NEW/duplicate state is immediately understandable;
- Signal feedback is legible;
- SIGNAL LOCK behavior feels useful rather than arbitrary;
- Hidden Pocket lands as a genuine surprise;
- Shelf/Library makes acquisition feel persistent.

## Technical correctness

- no reward rerolls on refresh;
- no double commits;
- pending reveal recovers deterministically;
- responsive layout survives desktop/mobile landscape and resize;
- no browser gesture/context-menu interference;
- save survives refresh;
- RU/EN and mute work;
- no visible asset loading between primary surfaces.

## Platform / ads

- SDK initializes correctly in Yandex draft/debug mode;
- Game Ready timing is correct;
- `game_api_pause/resume` behavior is correct;
- interstitial opens/closes/errors safely;
- rewarded opens/closes/errors safely;
- dev-only reward is granted exactly once only on rewarded completion;
- sticky banner boundary can show/hide safely if tested;
- audio/gameplay stays paused during full-screen/rewarded ads;
- ad failure never blocks the opener.

---

# 2. Internal analytics

Keep Yandex Metrica instrumentation because it is part of production architecture, but do **not** use public KPI gates before content expansion.

Core gameplay events:

```text
first_package_interaction
reveal_complete
collection_open
collection_return
signal_lock_reached
signal_lock_consumed
hidden_pocket_triggered
secret_discovered
standard_collection_complete
```

Ad/debug integration events may include:

```text
ad_interstitial_requested
ad_interstitial_closed
ad_rewarded_requested
ad_rewarded_earned
ad_error
```

The slice only needs to prove these events fire once with correct parameters and never interfere with save/gameplay.

---

# 3. Slice balance sanity check

Current two-family model remains a useful **engineering/feel test configuration**:

- Common 60 / Rare 28 / Epic 10 / Legendary 2;
- first-three protection;
- Signal +25/+20/+15/+10;
- late lock Rare 60 / Epic 30 / Legendary 10;
- Hidden Pocket 3% from opening #4;
- two Secrets without duplicates.

Previous Monte Carlo sanity results were approximately:

```text
first ordinary duplicate    ~4
first SIGNAL LOCK           ~9
first Hidden Pocket         ~26
both Secrets                ~59–60
standard 8/8                ~80
8/8 + Secrets 2/2           ~100
```

These figures only demonstrate that the slice configuration is internally coherent. They are **not targets for the expanded public release**.

After launch roster/content grouping is locked, rerun the model from scratch.

---

# 4. Hands-on review checklist

The slice is ready for user review when:

- final-ish Camera and Flip Phone sets are integrated;
- pouch tear/reveal is polished enough to judge rather than placeholder animation;
- Collection has Shelf + Library;
- all slice RNG/Signal/Hidden Pocket paths can be forced from dev controls;
- ad types/callback paths can be deliberately exercised;
- desktop + real mobile landscape have been smoke-tested.

During review deliberately answer:

1. Is the tear gesture fun enough to repeat?
2. Is ~1.0–1.4 s reveal too slow after 20–50 opens?
3. Does Common still feel desirable?
4. Is Legendary visually strong enough?
5. Is Signal understandable without explanation?
6. Does Hidden Pocket feel exciting rather than random noise?
7. Is Shelf worth opening?
8. Does Library communicate missing variants cleanly?
9. Do ads technically pause/resume cleanly without corrupting the state machine?
10. What visual/UX rules must be fixed **before** multiplying the art across many families?

---

# 5. Slice GO / FIX / STOP

There is no statistical 500-player threshold.

### GO to content expansion

User signs off that the opener/reveal/Collection fantasy works and no architectural bug would make mass content expensive to integrate.

### FIX before content expansion

Typical blockers:

- tear feels clumsy;
- reveal timing becomes annoying quickly;
- rarity variants read inconsistently;
- Collection layout feels fundamentally wrong;
- asset pipeline cannot maintain family consistency;
- SDK/ad pause/reward callbacks are fragile;
- core content system is hard-coded to two families.

### STOP / re-theme

Only if direct review shows the central object/reveal fantasy itself is not compelling enough to justify producing many assets.

Do not try to rescue a bad core by mass-producing content first.

---

# 6. Quick Reveal checkpoint

Quick Reveal should be decided from this direct review, not postponed until public traffic.

If repeated full reveals become friction, introduce a configurable shorter ~0.4–0.6 s mode before content expansion/public release while preserving reward readability.

---

# 7. After slice approval

Immediately move to:

1. lock first public content batch/roster target;
2. mass-produce families through the canonical-master pipeline;
3. design scaled Collection grouping;
4. rebalance drop/Signal/Hidden Pocket from the larger matrix;
5. finalize real ad UX/rewards;
6. re-evaluate Tech Parts / Mod Bench and other parked systems only against actual release needs;
7. then prepare store/moderation assets.
