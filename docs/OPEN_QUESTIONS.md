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

# 2. Public package / economy model — OPEN

The internal slice intentionally keeps one unlimited free pouch so interaction can be judged without economy friction.

That does **not** automatically lock the public release to unlimited free opening.

Before release decide:

- unlimited free openings vs soft-currency acquisition vs another light access model;
- whether multiple package types/tiered pools create meaningful choice once many families exist;
- where currency, if any, comes from;
- how the package model interacts with ads without creating artificial frustration;
- whether the core opener remains immediately available for a new player.

This is one of the highest-impact release decisions because it affects balance and session pacing. Do not sneak an economy into the slice merely to answer it early.

---

# 3. Release balance — OPEN

Current numbers are slice-only.

Once launch roster/package model is known, decide/re-simulate:

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

# 4. Collection at scale — OPEN

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

# 5. Advertising — IMPLEMENTATION RULES RESOLVED, RELEASE TUNING LATER

Advertising itself is **not an open implementation question**.

From the internal slice onward, follow the current Yandex Games SDK and moderation rules:

- SDK-only ad calls;
- logical-pause interstitials, never active tear/reveal;
- optional rewarded ad with the exact reward stated up front;
- reward granted exactly once on rewarded completion;
- gameplay/audio paused for fullscreen/rewarded;
- error/close/unavailable paths safe;
- sticky banner configured and placed according to Yandex rules if used.

The later release pass only tunes product choices that cannot be chosen intelligently yet:

- where a compliant rewarded opportunity is actually useful;
- exact reward value/type;
- which logical pauses are worth requesting interstitial at;
- whether sticky banner earns enough to justify its layout cost.

These are optimization decisions after the expanded economy/content exists, not blockers and not a need for further user clarification now.

---

# 6. Quick Reveal — REVIEW DURING INTERNAL SLICE

Do not wait for public analytics.

During 20–50+ repeated openings, decide whether the full ~1.0–1.4 s reveal becomes friction.

Candidate:

- configurable ~0.4–0.6 s Quick Reveal;
- same reward semantics;
- no default x5/mass-open requirement.

---

# 7. Tech Parts / Mod Bench — RE-EVALUATE WITH LARGE ROSTER

They were removed from the two-family slice because Signal was enough there.

With a materially larger catalog, ask again:

- do duplicates need a second long-horizon sink?
- does direct/choice-based upgrading improve agency without trivializing collection?
- does this system justify its currency/UI complexity?

Do not scaffold the scene/economy before this decision.

---

# 8. Daily Spotlight / shelf evolution / other retention — OPEN LATER

These become more meaningful only with many families.

Potential jobs:

- Daily Spotlight: rotate attention toward a family/group;
- shelf evolution: cheap visible long-term progression;
- package variation: different pools only if it creates real choice;
- other light retention hooks: only where the expanded loop needs them.

Evaluate after launch roster and package model are real.

---

# 9. Public measurement plan — REQUIRED BEFORE RELEASE

The private slice has no public KPI gate.

Before public launch, define the release measurement plan using Yandex built-in metrics + Metrica gameplay/ad events. Choose the actual continuation, retention, playtime and monetization checkpoints only after the release loop/content/economy is known.

Do not block the internal slice on invented KPI thresholds, but do not publish the final game without a measurement plan.

---

# 10. Public store/submission choices — DEFER UNTIL RELEASE BUILD

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
- Yandex-compliant ads adapter from day one;
- storage/analytics adapters;
- adaptive landscape layout;
- Camera + Flip Phone slice assets;
- current slice RNG/Signal/Hidden Pocket configuration;
- canonical-master art pipeline;
- reveal/Collection interaction model.

So the next build can start without waiting on the release-scale decisions above.
