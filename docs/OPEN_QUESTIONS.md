# Open questions / decision queue

The core Lite V2 direction is decided. This file contains only questions that are **actually unresolved** and should not be silently invented during implementation.

---

# 1. Lite V2 economy numbers — OPEN FOR TUNING

Concept is locked; exact values are not.

Need to choose/test:

- Charged Pouch CHIPS cost;
- Basic guaranteed base CHIPS range/amount;
- Charged guaranteed base CHIPS range/amount;
- CHIPS cache tier probabilities;
- CHIPS cache payout ranges by pouch profile;
- duplicate recycle CHIPS by rarity;
- Basic Common/Rare/Epic weights;
- Charged Common/Rare/Epic/Legendary weights;
- Basic Hidden Pocket chance;
- Charged Hidden Pocket chance.

Constraints already decided:

- Basic is free/unlimited in Lite V2;
- Basic always grants one collectible + guaranteed base CHIPS;
- Basic can roll Common/Rare/Epic but **not Legendary** from the normal standard table;
- Charged can roll all standard rarities and is the main source of Epic/Legendary;
- both pouch types use a separate independent CHIPS-cache roll on top of base payout;
- collectible rarity luck and CHIPS-cache luck are independent;
- a very rare top cache may fund multiple Charged openings;
- Charged must remain a **net CHIPS sink in expectation** over repeated play;
- Charged still has only one standard collectible roll;
- duplicate recycle CHIPS are compensation, not a reason to prefer duplicates;
- CHIPS income should make Charged a visible near-term goal, not a long grind;
- Basic may still very rarely trigger Hidden Pocket/Secret; Charged has a materially higher chance.

Start with deterministic simulation + hands-on and keep all values in typed balance config.

---

# 2. SIGNAL LOCK when Basic has no eligible NEW — IMPORTANT EDGE

The selected pouch rarity profile is otherwise locked to remain meaningful under SIGNAL LOCK. This creates one real edge case:

```text
SIGNAL = 4/4
active Drop still has undiscovered Legendary item(s)
all Basic-eligible Common/Rare/Epic items are already discovered
player opens Basic
```

Basic normally has `Legendary = 0`, so there is no undiscovered candidate with non-zero Basic weight.

Two coherent policies exist:

- **strict Charged gate (recommended):** Basic does not consume the lock; it may still open for CHIPS/duplicate recycle while SIGNAL stays armed. The UI must make clear that the lock is waiting for an eligible/Charged opening.
- **pity override:** SIGNAL LOCK may bypass Basic's Legendary restriction and award a missing Legendary, preserving the simple “4 duplicates → next NEW” promise but weakening Charged's exclusive standard-rarity role.

Do not let the resolver accidentally choose a policy through fallback behavior. This needs one explicit product decision before implementation.

---

# 3. Charged selection UX — SMALL UI QUESTION

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

# 4. CHIPS asset implementation — SMALL ART QUESTION

One CHIPS visual identity is required.

Preferred direction is a tiny Y2K electronic chip/token rather than a gold coin.

Need only decide whether final implementation is:

- one reviewed `public/assets/ui/chip-token.webp`, or
- an equally good vector/Phaser-rendered icon.

The same identity must work for:

- HUD wallet;
- normal payout burst;
- duplicate recycle payout;
- larger Cache/Big/Mega-style bursts.

Do not create separate raster art for each cache tier and do not create an entire UI asset pack.

---

# 5. Lite V2 audio additions — OPTIONAL

Potential new cues:

- `chips-collect`;
- `charged-ready`.

A larger cache result may reuse/stack/pitch the same CHIPS cue plus runtime emphasis. Do not create one SFX per cache tier unless hands-on proves it is necessary.

First test whether current sounds/re-pitched variants are good enough. New audio is not automatically required.

---

# 6. Quick Reveal — REVIEW AFTER LITE V2

The new reward sequence is longer than the current single-reward presentation, so repeated-use pacing must be rechecked.

During 20–50+ openings ask:

- does CHIPS/cache/recycle presentation become repetitive?
- do rare cache beats still feel special rather than slowing every opening?
- is the full reveal now too slow?

Only then consider a configurable faster reveal. No x5/mass opening is implied.

---

# 7. First expanded content roster / Drop grouping — OPEN AFTER DRAFT

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

# 8. Collection at multi-Drop scale — OPEN LATER

Current Shelf/Library stays.

When Drop #2 actually exists, decide:

- where the Drop selector belongs;
- whether Shelf switches per Drop or shows global best finds;
- Library grouping/filtering;
- completion headline semantics;
- Secret grouping.

Do not redesign Collection before the content exists.

---

# 9. Family-targeted acquisition — PARKED

Do not add family-specific pouches now.

Revisit only if real completion data shows that Drop-level Signal protection still leaves players stuck/frustrated near completion.

---

# 10. Idle/incremental expansion systems — PARKED

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

# 11. Advertising / public measurement — OPEN FOR RELEASE TUNING

Implementation/compliance is already resolved through the Yandex adapter.

After Lite V2 + expanded content, decide:

- actual rewarded reward and placement;
- interstitial logical pause points worth requesting;
- whether sticky banner is worth layout cost;
- continuation/retention/playtime/monetization metrics for public release.

The old dev-only `+25 Signal` rewarded test is deprecated by the new Signal model; use a dev-only CHIPS grant for technical exactly-once validation after migration.

---

# 12. Store/submission choices — DEFER UNTIL RELEASE BUILD

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
- Basic always gives one standard collectible;
- Basic normal standard rarity access is Common/Rare/Epic only; no Legendary;
- Charged is the normal standard route to Legendary and has materially stronger Rare/Epic weighting;
- both pouch types always give base CHIPS and may independently roll a larger cache bonus;
- collectible rarity and CHIPS-cache luck are independent;
- a very rare top cache may finance several Charged openings;
- Charged remains a net CHIPS sink in expectation;
- duplicates auto-recycle;
- duplicate gives CHIPS + one Signal segment;
- target Signal threshold is 4;
- legacy Signal migration is `min(4, floor(oldSignal / 25))`;
- Signal Lock targets NEW in active Drop and is not spent on a fully complete Drop;
- where eligible missing candidates exist, Signal Lock preserves the selected pouch rarity profile;
- Charged costs CHIPS, has one standard roll and a higher Hidden Pocket chance;
- Basic may still very rarely hit Hidden Pocket/Secret;
- no multi-standard drops in Lite;
- no shop scene;
- Drop/loot-pool architecture is required before content expansion;
- CHIPS/Signal remain global across Drops;
- idle/offline/Overcharge/Archive systems are parked.
