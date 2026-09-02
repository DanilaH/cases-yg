# Open questions / release-expansion queue

The internal Camera + Flip Phone vertical slice is implementation-ready. It does **not** need these release questions answered before coding because the slice exists specifically to inform them.

After hands-on sign-off, resolve the queue below before public release.

---

# 1. Public content size — OPEN

We are definitely expanding beyond Camera + Flip Phone.

Need to lock:

- target number of base gadget families for first public launch;
- whether launch is one large catalog or several themed mini-collections;
- how many Secrets belong to the launch roster;
- which archetypes make the first expansion batch.

Candidate families already identified:

- MP3 player;
- pager;
- mini camcorder;
- handheld console;
- PDA;
- portable disc / MiniDisc-like player;
- pocket radio;
- virtual-pet-like electronic;
- more Y2K gadget archetypes as research/production finds them.

The old ~24-family planning target is back on the table as a **reference scale**, not a cap or commitment. Use actual art throughput/quality from the slice to decide.

---

# 2. Release balance — OPEN

Current numbers are slice-only.

Once launch roster is known, decide/re-simulate:

- family weights / grouping;
- standard rarity odds;
- onboarding protection;
- duplicate rate;
- Signal gain curve and SIGNAL LOCK behavior;
- Hidden Pocket probability;
- Secret pool / duplicate rules;
- expected standard completion and chase horizon.

Do not preserve 60/28/10/2 or 3% just because they were convenient in the two-family slice.

---

# 3. Collection at scale — OPEN

The core roles are retained:

- Shelf = desirable best finds;
- Library = exhaustive completion view.

Need release design for many families:

- pages vs scrolling vs themed shelves;
- family groups / mini-collections;
- Library filtering/navigation;
- what the headline completion counter means;
- Secret grouping;
- whether environments/shelves change between collections;
- how many hero items are visible without making the room look like a spreadsheet.

Architecture must remain data-driven now so this becomes UI/content work rather than a rewrite.

---

# 4. Final monetization UX — OPEN, INFRASTRUCTURE NOT OPEN

SDK/ad infrastructure is implemented in the internal slice.

Before public release choose:

- rewarded placement;
- exact rewarded benefit;
- interstitial logical pause points;
- whether sticky banner is used;
- any ad-related analytics experiments.

Constraints already locked:

- rewarded is optional and clearly states the exact reward;
- reward grants exactly once from the rewarded callback;
- interstitial never interrupts active tear/reveal;
- ads pause gameplay/audio correctly;
- ad failure never blocks progression;
- do not invent energy/package scarcity solely to force ad views.

---

# 5. Quick Reveal — REVIEW DURING INTERNAL SLICE

Do not wait for public analytics.

During 20–50+ repeated openings, decide whether the full ~1.0–1.4 s reveal becomes friction.

Candidate:

- configurable ~0.4–0.6 s Quick Reveal;
- same reward semantics;
- no default x5/mass-open requirement.

---

# 6. Tech Parts / Mod Bench — RE-EVALUATE WITH LARGE ROSTER

They were removed from the two-family slice because Signal was enough there.

With a materially larger catalog, ask again:

- do duplicates need a second long-horizon sink?
- does direct/choice-based upgrading improve agency without trivializing collection?
- does this system justify its currency/UI complexity?

Do not scaffold the scene/economy before this decision.

---

# 7. Package tiers / Daily Spotlight / shelf evolution — OPEN LATER

These become more meaningful only with many families.

Potential jobs:

- package tiers: meaningful pool/odds choice;
- Daily Spotlight: rotate attention toward a family/group;
- shelf evolution: cheap visible long-term progression.

Evaluate after launch roster is real.

---

# 8. Public store/submission choices — DEFER UNTIL RELEASE BUILD

Need only after expanded content/key visual stabilizes:

- final RU/EN title uniqueness;
- categories/tags/keywords;
- icon/cover/hero;
- localized screenshots;
- final platform selection/iOS Team ID;
- final monetization configuration;
- moderation QA.

Do **not** spend final-store-art effort on the two-family internal slice.

---

# What does NOT need clarification before coding

Already clear enough:

- Phaser/Vite/strict TS;
- Yandex SDK from day one;
- ads adapter from day one;
- storage/analytics adapters;
- adaptive landscape layout;
- Camera + Flip Phone slice assets;
- current slice RNG/Signal/Hidden Pocket configuration;
- canonical-master art pipeline;
- reveal/Collection interaction model.

So the next build can start without waiting on the release-scale decisions above.
