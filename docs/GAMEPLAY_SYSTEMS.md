# Gameplay systems

This document describes the **current accepted mechanical direction**. It is intentionally small. Anything not listed here is not automatically part of the probe.

---

# 1. Core opener

Primary loop:

1. show mystery package;
2. one short deterministic open interaction;
3. short anticipation;
4. reveal gadget;
5. show rarity;
6. resolve new vs duplicate;
7. update collection/progression;
8. allow immediate next open.

Target feel:

- fast;
- deterministic input;
- juicy output;
- no physics requirement;
- no multi-step manipulation.

Current reveal behavior for the first probe:

- the full reveal always plays;
- target duration after tear is ~1.0–1.4 s;
- tap/click does not skip or accelerate it;
- the pouch remains visible for the first ~0.3–0.4 s so the gadget visibly emerges from a physical source;
- once the gadget has emerged far enough, the pouch slides down / scales slightly down / fades away;
- the gadget becomes the sole visual hero for the final rarity + NEW/duplicate state;
- cheap runtime FX scale with rarity rather than using separate expensive animations.

---

# 2. Standard rarity

Locked ladder:

> **Common → Rare → Epic → Legendary**

The rarity system is primarily visual/material, not just text color.

Exact drop odds are still open.

---

# 3. Secret / Chase items

Secrets are outside the standard ladder.

Launch direction:

- 2–3 total Secrets for a fuller launch target;
- first behavioral probe may use only 1–2 Secrets;
- special editions rather than another material tier;
- not required for main collection completion;
- stronger bespoke design changes than standard rarity variants;
- special reveal presentation is allowed.

Preferred acquisition framing:

> **Secrets are discovered through the Hidden Pocket surprise layer rather than presented as an ordinary fifth-rarity result.**

Exact probability and whether every Secret is strictly Hidden-Pocket-only remain open until drop odds are balanced.

---

# 4. Signal meter — ACCEPTED FOR PROBE

Competitor `luck/pity` systems solve a real problem: a bad random roll must still create progress.

Our transformation is themed as **SIGNAL** rather than generic luck.

Possible presentation:

- antenna bars;
- old LCD signal meter;
- scanning/lock-on language;
- `SIGNAL LOCK` when full.

Functional goal:

> **a disappointing or duplicate roll still moves the player toward a guaranteed useful result**

Preferred product behavior:

- duplicate/common disappointment increases Signal;
- reaching full Signal guarantees a useful future drop;
- ideally protect against duplicate frustration, not only low rarity.

Example concept only — not final balance:

```text
Duplicate Common  → +Signal
Duplicate Rare    → +Signal
Duplicate Epic    → smaller +Signal
New item          → little/no Signal
100%              → SIGNAL LOCK
next eligible reveal prioritizes a NEW item, preferably Rare+
```

Open questions:

- exact meter increments;
- whether a Legendary resets Signal;
- whether full Signal guarantees `NEW`, `Rare+`, or both;
- whether Signal is per package tier or global.

---

# 5. Duplicate handling — ACCEPTED FOR PROBE

Duplicates must not be dead rolls.

Current direction:

> **Duplicate → Tech Parts → deterministic progress**

Do not simply convert every duplicate into meaningless soft currency unless the economy proves that simpler approach is better.

Thematic framing:

- spare parts;
- components;
- upgrade pieces;
- old-tech modding.

---

# 6. Mod Bench — ACCEPTED FOR PROBE

Tech Parts feed a simple deterministic reward/upgrade surface.

Working fantasy:

> **MOD BENCH / WORKBENCH**

Potential low-cost implementations:

### Option A — upgrade owned gadget

Example:

`Common Flip Phone + Parts → Rare Flip Phone`

### Option B — choice of 3 blueprints/rewards

Spend Parts and choose one of three offered outcomes.

This adds agency without allowing the player to directly buy any missing Legendary.

No crafting minigame is required. The UI can be a simple static workbench scene/modal.

Open questions:

- recipe/cost curve;
- whether upgrade consumes lower-rarity copy;
- whether result is deterministic or a 3-choice offer;
- whether Mod Bench should be available immediately or after a few openings.

---

# 7. Hidden Pocket — ACCEPTED FOR PROBE

Hidden Pocket is a **rare automatic second reveal beat**, not a second unpacking mechanic.

After an apparently finished normal reveal, a small random chance triggers:

```text
normal reveal completes
    ↓
brief ~0.3 s pause
    ↓
pouch twitches / returns slightly
    ↓
short distinct sound + inner flash
    ↓
BONUS / SECRET second reveal
```

Rules:

- **no additional player input**;
- no searching for a compartment;
- no extra swipe/tap requirement;
- reuse the existing pouch and reveal language;
- keep the extra animation very cheap;
- use the event for an occasional bonus drop and especially as the preferred thematic route to Secret/Chase items.

Why it is included:

- adds a second anticipation beat;
- makes a finished reveal occasionally become surprising again;
- uses existing package/item assets;
- low engineering/content burden;
- makes Secrets feel like discoveries rather than a fifth rarity color.

Still open:

- trigger chance;
- allowed normal bonus rewards;
- exact Secret probability / whether every Secret is Hidden-Pocket-only;
- analytics event names.

Do not tie rewarded ads to Hidden Pocket in the first probe.

---

# 8. Collection — LOCKED STRUCTURE

Collection is split into two complementary views.

## Main Shelf

The Shelf is the attractive display surface.

Rules:

- one fixed shelf slot per **base gadget**;
- a slot displays the **best/highest-rarity version currently owned** for that gadget;
- missing gadgets use a locked silhouette / empty presentation;
- the shelf is not a 48- or 96-cell rarity spreadsheet;
- high-rarity finds should visibly improve the shelf over time.

For the first probe there are **12 base gadget slots**, grouped into **two mini-collections of six gadgets**.

## Library / Catalog

The Library is the exhaustive completionist view adjacent to the Shelf inside the broader Collection experience.

It shows:

- all base gadgets;
- each gadget's Common / Rare / Epic / Legendary entries;
- discovered vs missing rarity variants;
- separate Secret/Chase tracking.

Therefore the roles are deliberately different:

> **Shelf = best finds and visual ownership fantasy. Library = complete checklist and variant mastery.**

The first behavioral probe contains:

- 12 base gadgets;
- 4 standard rarity variants per gadget;
- 48 standard collectible variants total;
- 1–2 Secrets;
- 2 mini-collections of 6 gadgets each.

A fuller post-validation target may expand toward ~24 base gadgets, but the probe must not wait for that content volume.

Potential later layer:

- environment gains decor at collection milestones;
- this replaces the need for multiple biomes/worlds.

Milestone evolution is **parked**, not part of the required first probe.

---

# 9. Quick Reveal — PARKED, REQUIRED REVISIT

Case/opening games commonly add fast-open or multi-open because repeated long animations eventually become friction.

For the first probe:

- use the full juicy reveal every time;
- do not allow tap-to-skip;
- do not ship x5/mass opening.

However, **Quick Reveal must be revisited deliberately after repeated-opening playtests or early behavioral data**. It is not a forgotten nice-to-have; it is a scheduled product question once we know how many openings a normal session contains and whether the ~1.0–1.4 s full reveal starts to irritate players.

Likely direction if friction appears:

- unlock a shorter ~0.4–0.6 s reveal after repeated lifetime opens;
- preserve rarity readability and reward feel;
- keep the same state machine and configurable timings so this can be added without reworking the opener.

Architecture should therefore keep reveal timings configurable even though Quick Reveal is not part of the first probe.

---

# 10. Daily Spotlight — PARKED

Potential return mechanic that reuses existing content instead of adding new content:

Examples:

- `DIGICAM DAY` — boosted camera-family odds;
- `FLIP PHONE DAY`;
- `MUSIC TECH DAY`.

Possible rule:

- first Spotlight package of the day is free;
- family weighting changes daily.

Do not implement until the basic loop is validated.

---

# 11. Rewarded ads

Accepted monetization direction:

- keep optional and limited in the probe;
- grant reward only after the actual rewarded callback;
- do not make ad watching mandatory to continue the base loop.

Exact use is open. Candidates:

- bonus Tech Parts;
- bonus package;
- temporary family boost.

Avoid tying rewarded ads to a deceptive near-win or casino-like loop.

---

# 12. Explicitly rejected scope

Do not copy mature case simulators wholesale.

Rejected for the probe:

- market/trading;
- crash/double/jackpot;
- large contract systems;
- 3D inspection;
- 7–14 worlds/biomes;
- large minigame suite;
- betting economy;
- deep clicker/farm mode;
- hundreds of unrelated hero assets.

The goal is to steal **retention primitives**, not the production burden.
