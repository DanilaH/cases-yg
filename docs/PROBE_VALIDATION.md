# Gameplay Loop Lite V2 validation

This is the current **direct/local acceptance gate** for the implemented Lite V2 loop. Hosted platform validation remains separate in `YANDEX_SLICE_VALIDATION.md`.

Current status:

- implementation: **COMPLETE**;
- technical tests/build/assets: **PASS**;
- exact-revision browser audit: **PASS**;
- manual screenshot/video artifact review: **PASS**;
- final Charged-ready presentation correction: **MERGED + RE-AUDITED**;
- post-merge CI: **PASS**;
- direct 20–50 opening hands-on: **OPEN — CURRENT GATE**;
- real Yandex DRAFT: **BLOCKED until hands-on acceptance**.

The remaining question is:

> **Does Basic → CHIPS → Charged make repeated opening more rewarding without making the game slower, confusing or system-heavy?**

---

# 1. Already proven by automated/local validation

The current merged implementation has already established:

- Basic/Charged reward profiles resolve deterministically;
- Basic never standard-rolls Legendary, including under armed Signal;
- Charged has non-zero Legendary access;
- collectible rarity and CHIPS-cache rolls are independent;
- duplicate recycle uses rarity-dependent CHIPS values;
- Signal uses `+1` per duplicate and caps at `4/4`;
- Signal Lock respects active loot pool + selected-pouch eligibility;
- if only Legendary remains, Basic resolves normally and retains `4/4`;
- following eligible Charged opening can consume that lock on NEW Legendary;
- fully complete active Drop does not waste an armed lock;
- legacy Signal migration uses exact `min(4, floor(oldSignal / 25))` mapping;
- save migration preserves existing collection/stat state;
- Charged cost + base/cache/recycle/Signal/collectible/Hidden outcome are one recoverable transaction;
- refresh cannot reroll collectible/cache/Hidden Pocket;
- recovery cannot double-grant base/cache/recycle rewards;
- recovered transaction preserves pouch type + loot pool + Signal retain/consume outcome;
- Basic/Charged selection continuity and insufficient-wallet Basic fallback work;
- compact 900/1024 layouts and RU copy are valid in browser captures;
- technical/browser errors are empty in the accepted exact-revision audit.

Current suite at the accepted revision: **87 unit tests**, plus typecheck, asset self-test/validation and production build.

These items should not be re-litigated during hands-on unless direct play exposes contradictory evidence.

---

# 2. Feel / pacing — HANDS-ON

Run enough consecutive openings to get past first-impression novelty: target **20–50 openings**.

Evaluate:

- tear remains immediate and pleasant;
- ordinary CHIPS presentation enriches rather than delays the reveal;
- token flight reads clearly as wallet progress;
- Cache/Big/Mega outcomes create a satisfying spike;
- large cache presentation is short enough for repeated play;
- duplicate recycle feels like compensation rather than extra ceremony;
- Charged visibly/subjectively feels more valuable than Basic;
- result/CTA timing stays obvious;
- Hidden Pocket remains the strongest surprise beat;
- `CHARGED POUCH READY` feels useful and satisfying rather than interruptive;
- the whole sequence is still pleasant after repetition.

If ordinary openings become tedious, first reduce presentation duration. Do not jump directly to Quick Reveal/x5/auto-open.

---

# 3. Player comprehension — HANDS-ON

Without reading design docs, the loop should communicate:

- Basic always gives a gadget and CHIPS;
- CHIPS accumulate toward Charged;
- some openings can hit a much larger CHIPS cache;
- Charged costs CHIPS and is the standard route to Legendary;
- Basic still has Common/Rare/Epic and very rare Hidden Pocket Secret access;
- duplicate is automatically recycled, not simply lost;
- duplicate gives extra CHIPS + one Signal segment;
- four Signal segments arm a guaranteed NEW **when the selected pouch has an eligible missing standard item**;
- if only Legendary remains, `SIGNAL LOCK · CHARGED` explains why Basic does not consume the lock;
- Signal is pity/protection, not spendable currency.

Desired mental model:

> **“Basic always moves me forward; CHIPS get me to Charged; caches can spike progress; four dupes protect me; if the lock needs Charged, the game tells me.”**

---

# 4. Current economy tuning — HANDS-ON + LATER SIMULATION

Implemented starting values:

```text
Basic
  cost: 0
  base CHIPS: 6–10
  rarity C/R/E/L: 72/25/3/0
  Hidden Pocket: 1.5%
  cache weights none/cache/big/mega: 90/7/2.5/0.5

Charged
  cost: 60
  base CHIPS: 18–24
  rarity C/R/E/L: 35/40/20/5
  Hidden Pocket: 6%
  cache weights none/cache/big/mega: 78/15/5.5/1.5

Cache rewards
  none: 0
  cache: 20–35
  big: 45–75
  mega: 120–180

Duplicate recycle C/R/E/L
  2/4/8/15
```

Deterministic current-config analysis already proves Charged remains a CHIPS sink in the all-duplicate case. Hands-on must now judge whether the *felt cadence* is right:

- Charged is reachable often enough to remain a near-term goal;
- it is not so cheap that Basic feels pointless;
- base CHIPS are predictable enough to understand progress;
- cache bonuses matter without making ordinary payouts irrelevant;
- Mega remains memorable rather than routine;
- duplicate recycle softens disappointment without making duplicates preferable;
- Basic Rare feels meaningful and Epic feels surprising;
- Charged's stronger Rare/Epic/Legendary profile is perceptible;
- Signal `4/4` occurs often enough to matter but not constantly;
- 1.5% vs 6% Hidden Pocket relationship feels coherent.

Tune numbers only from evidence. Do not redesign the loop because one provisional value is off.

---

# 5. Specific edge states to try manually

Automation already covers correctness; hands-on should additionally judge clarity/feel of these states when practical:

- wallet below Charged cost;
- wallet crossing `60 CHIPS` through ordinary payout;
- wallet crossing threshold through a large cache;
- Charged selected and affordable;
- Charged remains selected after an opening when still affordable;
- Charged falls back to Basic after wallet drops below cost;
- duplicate → recycle → Signal increment;
- `4/4` Signal Lock;
- `SIGNAL LOCK · CHARGED` with only Legendary missing;
- Charged Legendary reveal;
- Hidden Pocket carousel;
- recovered pending reveal if deliberately interrupted.

The point is not to retest deterministic math by hand; it is to judge whether the state reads naturally to a player.

---

# 6. GO / FIX decision

## GO to real Yandex DRAFT

Proceed when direct repeated play confirms:

- Basic remains pleasant despite no standard Legendary;
- CHIPS progress is understandable;
- caches create excitement without dominating the loop;
- duplicate recycle improves rather than clutters the experience;
- Charged creates a real “one more pouch” goal;
- Charged feels materially better, not cosmetically different;
- Signal is understandable enough without a tutorial screen;
- `SIGNAL LOCK · CHARGED` explains the exceptional waiting state;
- `CHARGED POUCH READY` is useful/satisfying;
- extra sequencing does not make 20–50 openings materially annoying.

## FIX before DRAFT

Evidence-backed blockers include:

- player cannot understand CHIPS/Signal roles;
- Charged does not feel worth saving for;
- cache looks like arbitrary text rather than a reward spike;
- ordinary CHIPS feel meaningless beside jackpots;
- recycle presentation makes duplicates feel slower/worse;
- waiting Signal state looks broken or misleading;
- `CHARGED POUCH READY` becomes an annoying interruption;
- compact UI is hard to read during real play;
- repeated opening cadence is materially worse than the pre-Lite opener.

For a blocker, prefer the smallest presentation/tuning correction that addresses the observed problem, then rerun the relevant technical/exact-revision gate.

Do **not** answer these problems by adding offline income, Overcharge, Archive levels, another currency, shop scene, mass opening or prestige.

---

# 7. After hands-on approval

The order is fixed:

1. run real `YANDEX_SLICE_VALIDATION.md` in a hosted DRAFT;
2. fix only hosted-platform defects found there;
3. lock first expanded content batch;
4. introduce first real Drop grouping when enough families exist;
5. re-simulate/tune economy at content scale;
6. scale Collection only as required;
7. finalize monetization/store/release work.

> **Current next action: play the merged Lite V2 build repeatedly.**
