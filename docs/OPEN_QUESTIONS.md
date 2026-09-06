# Open questions / decision queue

This file contains only questions that are **actually unresolved now**. Lite V2 mechanics and first-pass tuning are already implemented; do not treat implemented decisions as TODOs.

---

# 1. Repeated-use feel — CURRENT GATE

Run 20–50 direct openings and answer:

- does Basic → CHIPS → Charged create a genuine “one more pouch” pull?
- does Charged feel materially better and worth saving `60 CHIPS` for?
- does the player understand that Basic cannot standard-roll Legendary?
- is CHIPS accumulation legible without explanatory text?
- do Cache/Big/Mega outcomes feel exciting rather than arbitrary/noisy?
- does duplicate recycle feel compensating rather than adding friction?
- is `4 duplicates → next eligible NEW` understandable?
- is `SIGNAL LOCK · CHARGED` clear when only Legendary remains?
- does `CHARGED POUCH READY` help the loop or feel interruptive?
- does the full reveal become tedious after repetition?

This is the next decision gate. Automation cannot answer it.

If a problem is found, fix the smallest observed issue and rerun the relevant exact-revision audit. Do not pre-emptively add systems.

---

# 2. Lite V2 balance — OPEN FOR TUNING, NOT OPEN FOR REDESIGN

Current implemented starting values:

```text
Basic
  cost: 0
  base CHIPS: 6–10
  cache weights none/cache/big/mega: 90/7/2.5/0.5
  rarity C/R/E/L: 72/25/3/0
  Hidden Pocket: 1.5%

Charged
  cost: 60
  base CHIPS: 18–24
  cache weights none/cache/big/mega: 78/15/5.5/1.5
  rarity C/R/E/L: 35/40/20/5
  Hidden Pocket: 6%

Cache payouts
  0 / 20–35 / 45–75 / 120–180

Duplicate recycle C/R/E/L
  2/4/8/15
```

Current deterministic analysis satisfies the Charged net-sink invariant.

Open questions are now evidence questions:

- is 60 CHIPS reached at a satisfying cadence in real repetition?
- are Basic `6–10` payouts meaningful without feeling grindy?
- are cache spikes frequent/large enough to be memorable but not dominant?
- is Charged's 35/40/20/5 rarity profile visibly better in practice?
- are recycle rebates useful but not so high that duplicates become preferable?
- do 1.5% vs 6% Hidden Pocket chances create the intended Basic jackpot / Charged advantage relationship?
- does Signal threshold `4` feel relevant without triggering constantly?

Tune config from hands-on/simulation evidence only. The structural loop is not open for re-litigation without new evidence.

---

# 3. Lite V2 audio — OPTIONAL AFTER HANDS-ON

Current runtime reuses the established SFX set and does not have dedicated `chips-collect` or `charged-ready` cues.

Question:

> Does hands-on reveal a concrete sound-feedback gap for CHIPS transfer or Charged readiness?

If no, add nothing.

If yes, prefer one concise reusable CHIPS cue and/or one readiness cue. Do not create one sound per cache tier.

---

# 4. Quick Reveal — PARKED UNTIL REPEATED-USE EVIDENCE

Only revisit if 20–50 openings show that full presentation is materially too slow.

Before adding a new mode, first ask whether a small duration reduction in ordinary CHIPS/cache/recycle beats solves the problem.

No x5/mass opening is implied.

---

# 5. Real Yandex DRAFT findings — NEXT EXTERNAL QUESTION SET

After hands-on acceptance, hosted validation may reveal issues local CI cannot:

- SDK boot / loading timing;
- safe storage behavior;
- pause/resume/audio lifecycle;
- ad no-fill/throttle/close behavior;
- interrupted Basic/Charged recovery in hosted runtime;
- rewarded exactly-once CHIPS persistence;
- Metrica visibility.

Do not invent fixes before the draft exposes a problem.

---

# 6. First expanded content roster / Drop grouping — OPEN AFTER DRAFT

Only after Lite V2 hands-on + real Yandex DRAFT validation, lock:

- first additional gadget families;
- first real Drop name/theme;
- when Drop #2 exists;
- exact grouping and Secret count.

Candidate families remain:

- MP3 player;
- pager;
- mini camcorder;
- handheld console;
- PDA;
- portable disc / MiniDisc-like player;
- pocket radio;
- virtual-pet-like electronic;
- other suitable Y2K archetypes.

Rough 3–5 families per Drop remains a heuristic, not a commitment.

---

# 7. Collection at multi-Drop scale — OPEN LATER

Current Shelf/Library stays.

When Drop #2 actually exists, decide from real density:

- where compact Drop selection belongs;
- whether Shelf is global or Drop-scoped;
- Library grouping/filtering;
- completion headline semantics;
- Secret grouping.

Do not redesign Collection before the content exists.

---

# 8. Family-targeted acquisition — PARKED

Revisit only if real completion data shows Drop-level Signal protection still leaves players frustratingly stuck near completion.

---

# 9. Additional idle/incremental systems — PARKED

Not backlog commitments:

- timed Basic charges;
- offline income;
- passive Collection CHIPS/min;
- Overcharge;
- Archive levels;
- upgrade/set-bonus trees;
- prestige;
- auto-open;
- crafting/merge.

Re-open exactly one only if the proven current loop has a specific retention/progression problem that it solves cheaply.

---

# 10. Advertising / public measurement — OPEN FOR RELEASE TUNING

Implementation/compliance boundaries already exist.

After hosted validation + expanded content, decide:

- actual public rewarded benefit/placement;
- interstitial logical pause points;
- whether sticky banner is worth layout cost;
- continuation/retention/playtime/monetization metrics for public release.

The current dev rewarded CHIPS grant is a plumbing probe, not a public economy decision.

---

# 11. Store/submission choices — DEFER UNTIL RELEASE BUILD

Only after expanded content/key visual stabilizes:

- final RU/EN title;
- categories/tags/keywords;
- icon/cover/hero;
- localized screenshots;
- final monetization configuration;
- moderation QA.

---

# What is NOT open anymore

Do not re-litigate without new evidence:

- one global CHIPS currency;
- Basic free/unlimited in Lite V2;
- Basic always gives one standard collectible;
- independent base CHIPS + cache luck;
- Basic C/R/E only, no standard Legendary;
- Charged has non-zero Legendary and stronger top-end profile;
- duplicates auto-recycle into CHIPS + one Signal segment;
- Signal threshold `4`;
- legacy migration `min(4, floor(oldSignal / 25))`;
- Signal respects active loot pool + selected-pouch eligibility;
- Basic retains lock when only Legendary remains;
- Charged cost/reward is one atomic recoverable transaction;
- CHIPS/Signal global across Drops;
- no shop scene;
- no multi-standard drop in Lite;
- Phaser-rendered CHIPS identity is sufficient unless hands-on disproves it;
- Charged runtime aura can reuse current pouch art;
- idle/offline/Overcharge/Archive systems are parked.
