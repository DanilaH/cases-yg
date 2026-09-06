# Open questions / decision queue

The core Lite V2 direction is now decided. This file contains only questions that are **actually unresolved** and should not be silently invented during implementation.

---

# 1. Lite V2 economy numbers — OPEN FOR TUNING

Concept is locked; exact values are not.

Need to choose/test:

- Charged Pouch CHIPS cost;
- Basic CHIPS payout range/amount;
- Charged CHIPS payout range/amount;
- duplicate recycle CHIPS by rarity;
- Charged rarity weights;
- Basic Hidden Pocket chance;
- Charged Hidden Pocket chance.

Constraints already decided:

- Basic is free/unlimited in Lite V2;
- Basic always grants CHIPS + one standard collectible;
- Charged costs CHIPS and must feel meaningfully better;
- Charged still has only one standard collectible roll;
- duplicate recycle CHIPS are compensation, not a reason to prefer duplicates;
- CHIPS income should make Charged a visible near-term goal, not a long grind.

Start with simulation + hands-on and keep values in typed balance config.

---

# 2. Legacy Signal save migration — NEEDS EXPLICIT IMPLEMENTATION DECISION

Current saves may contain old Signal values from `0..100`.

Lite V2 changes Signal to `0..4` segments.

We must deliberately choose a deterministic migration rule. Examples of possible policies (not yet selected):

- floor proportional mapping (`0–24→0`, `25–49→1`, etc.);
- ceil/progress-preserving mapping;
- only preserve fully armed `100` and reset partial progress;
- another explicit rule.

Requirements:

- do not silently wipe a fully armed lock;
- do not accidentally grant more than one lock from a single legacy value;
- migration must be unit-tested and versioned.

This is the most important unresolved technical/product detail before the Signal rewrite lands.

---

# 3. SIGNAL LOCK × Charged Pouch — IMPORTANT RULE TO LOCK

We have agreed that SIGNAL LOCK applies to the **next standard collectible roll**, but one detail still matters when the player chooses Charged while the lock is armed.

Need to decide how the guaranteed NEW candidate is weighted:

- **profile-preserving option:** choose only from undiscovered candidates, but preserve the selected pouch's rarity weighting, so Charged still has better odds among missing items;
- **neutral guarantee option:** SIGNAL LOCK simply picks a missing item independently of Basic/Charged rarity profile.

The first option is likely cleaner because Charged should not become less valuable exactly when Signal is armed, but this should be explicit rather than accidentally emerging from implementation.

Already locked either way:

- the lock may be consumed by either Basic or Charged because both contain one standard roll;
- it only targets the active Drop;
- it is not consumed if that Drop has no missing standard item.

---

# 4. Charged selection UX — SMALL UI QUESTION

The product direction is fixed: Charged is chosen from the Opening screen with no store.

Need to settle the smallest interaction that reads best:

- separate `OPEN BASIC` / `OPEN CHARGED` actions;
- one pouch selector/toggle with a single Open action;
- another equally compact control.

Requirements:

- Basic remains instantly obvious/available;
- current CHIPS balance and Charged cost are visible;
- `CHARGED READY` is clear when affordability crosses threshold;
- no modal/store flow;
- 900 logical width remains clean.

Resolve from a quick visual pass, not architecture discussion.

---

# 5. CHIPS asset implementation — SMALL ART QUESTION

One CHIPS visual identity is required.

Preferred direction is a tiny Y2K electronic chip/token rather than a gold coin.

Need only decide whether final implementation is:

- one reviewed `public/assets/ui/chip-token.webp`, or
- an equally good vector/Phaser-rendered icon.

Do not create an entire UI asset pack.

---

# 6. Lite V2 audio additions — OPTIONAL

Potential new cues:

- `chips-collect`;
- `charged-ready`.

First test whether current sounds/re-pitched variants are good enough. New audio is not automatically required.

---

# 7. Quick Reveal — REVIEW AFTER LITE V2

The new reward sequence is longer than the current single-reward presentation, so repeated-use pacing must be rechecked.

During 20–50+ openings ask:

- does CHIPS/recycle presentation become repetitive?
- is the full reveal now too slow?

Only then consider a configurable faster reveal. No x5/mass opening is implied.

---

# 8. First expanded content roster / Drop grouping — OPEN AFTER DRAFT

After Lite V2 hands-on + real Yandex DRAFT validation, lock:

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

Rough 3–5 families per Drop is a heuristic, not a commitment.

---

# 9. Collection at multi-Drop scale — OPEN LATER

Current Shelf/Library stays.

When Drop #2 actually exists, decide:

- where the Drop selector belongs;
- whether Shelf switches per Drop or shows global best finds;
- Library grouping/filtering;
- completion headline semantics;
- Secret grouping.

Do not redesign Collection before the content exists.

---

# 10. Family-targeted acquisition — PARKED

Do not add family-specific pouches now.

Revisit only if real completion data shows that Drop-level Signal protection still leaves players stuck/frustrated near completion.

---

# 11. Idle/incremental expansion systems — PARKED

Explicitly not part of Lite V2:

- timed Basic charges;
- offline income;
- Collection passive CHIPS/min;
- Overcharge;
- Archive levels;
- upgrade/set-bonus trees;
- prestige;
- auto-open;
- crafting/merge.

They are ideas, not backlog commitments. Re-open one only if Lite V2 has a specific proven retention/progression problem that it solves cheaply.

---

# 12. Advertising / public measurement — OPEN FOR RELEASE TUNING

Implementation/compliance is already resolved through the Yandex adapter.

After Lite V2 + expanded content, decide:

- actual rewarded reward and placement;
- interstitial logical pause points worth requesting;
- whether sticky banner is worth layout cost;
- continuation/retention/playtime/monetization metrics for public release.

The old dev-only `+25 Signal` rewarded test is deprecated by the new Signal model; use a dev-only CHIPS grant for technical exactly-once validation after migration.

---

# 13. Store/submission choices — DEFER UNTIL RELEASE BUILD

Only after expanded content/key visual stabilizes:

- final RU/EN title;
- categories/tags/keywords;
- icon/cover/hero;
- localized screenshots;
- final monetization configuration;
- moderation QA.

---

# What is NOT open anymore

Do not re-litigate during Lite V2 implementation without new evidence:

- one global CHIPS currency;
- Basic remains free/unlimited for Lite;
- duplicates auto-recycle;
- duplicate gives CHIPS + one Signal segment;
- target Signal threshold is 4;
- Signal Lock guarantees NEW in active Drop and is not spent on a complete Drop;
- Charged costs CHIPS, has one standard roll, gives more CHIPS, better rarity and higher Hidden Pocket chance;
- no multi-standard drops in Lite;
- no shop scene;
- Drop/loot-pool architecture is required before content expansion;
- CHIPS/Signal remain global across Drops;
- idle/offline/Overcharge/Archive systems are parked.
