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

# 2. Standard rarity and drop roll — LOCKED FOR PROBE

Locked ladder:

> **Common → Rare → Epic → Legendary**

The rarity system is primarily visual/material, not just text color.

Baseline standard rarity odds:

| Rarity | Chance |
|---|---:|
| Common | 60% |
| Rare | 28% |
| Epic | 10% |
| Legendary | 2% |

Standard roll order:

1. choose gadget family: `Camera` or `Flip Phone` at **50/50**;
2. choose standard rarity from the table above;
3. resolve the corresponding standard variant.

Therefore each specific Legendary Camera / Legendary Flip Phone is approximately a **1% raw standard-roll outcome** before onboarding/Signal modifiers.

## First-three onboarding protection

The first **3 standard openings** are protected:

- each must produce an undiscovered standard variant;
- opening #2 must use the opposite gadget family from opening #1, ensuring that both Camera and Flip Phone appear immediately;
- rarity presentation remains meaningful, but the result resolver may select/reroll within the undiscovered standard pool to satisfy these onboarding guarantees.

After opening #3:

- normal standard RNG applies;
- there is **no permanent hidden anti-duplicate reroll**;
- duplicates are intentionally allowed because Signal and Tech Parts are the visible systems that make bad rolls useful.

Secret/Hidden Pocket is a **separate post-standard roll**. It does not reduce the 100% standard rarity table.

---

# 3. Secret / Chase items

Secrets are outside the standard ladder.

Launch direction:

- 2–3 total Secrets for a fuller launch target;
- first behavioral probe uses only 1–2 Secrets;
- special editions rather than another material tier;
- not required for main collection completion;
- stronger bespoke design changes than standard rarity variants;
- special reveal presentation is allowed.

Preferred acquisition framing:

> **Secrets are discovered through the Hidden Pocket surprise layer rather than presented as an ordinary fifth-rarity result.**

Exact probability and whether every Secret is strictly Hidden-Pocket-only remain open until Hidden Pocket tuning is locked.

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

Now that standard odds and the first-three onboarding protection are locked, Signal is the next balance system to specify.

Open questions:

- which duplicate rarities add how much Signal;
- whether any non-duplicate result adds Signal;
- exact full-meter reward;
- reset rules;
- whether Signal can ever force a Legendary;
- interaction with Secret/Hidden Pocket;
- how to remain useful without trivializing an eight-variant collection.

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

- one fixed shelf slot per **base gadget collection**;
- a slot displays the **best/highest-rarity version currently owned** for that gadget;
- missing gadgets use a locked silhouette / empty presentation;
- the shelf is not a rarity spreadsheet;
- high-rarity finds should visibly improve the shelf over time.

For the first behavioral probe there are exactly **two shelf slots**:

1. Digital Camera;
2. Flip Phone.

## Library / Catalog

The Library is the exhaustive completionist view adjacent to the Shelf inside the broader Collection experience.

It shows:

- Camera: Common / Rare / Epic / Legendary;
- Flip Phone: Common / Rare / Epic / Legendary;
- discovered vs missing rarity variants;
- separate Secret/Chase tracking.

Therefore the roles are deliberately different:

> **Shelf = best finds and visual ownership fantasy. Library = complete checklist and variant mastery.**

The first behavioral probe contains:

- 2 base gadget collections: Camera + Flip Phone;
- 4 standard rarity variants per gadget;
- 8 standard collectible variants total;
- 1–2 Secrets.

The probe deliberately stops here. Additional gadget families are post-validation content, not a prerequisite for testing whether the opener/reward loop is enjoyable.

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

Potential return mechanic that reuses existing content instead of adding new content.

Do not implement until the basic loop is validated and there are enough gadget families for a rotating family boost to make sense.

---

# 11. Rewarded ads

Accepted monetization direction:

- keep optional and limited in the probe;
- grant reward only after the actual rewarded callback;
- do not make ad watching mandatory to continue the base loop.

Because ordinary packages are already unlimited/free, do **not** use rewarded ads merely to grant another standard package.

Current candidates:

- bonus Tech Parts;
- Signal boost;
- another simple progression benefit compatible with the tiny content pool.

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
- hundreds of unrelated hero assets;
- expanding beyond Camera + Flip Phone before the core loop is validated.

The goal is to steal **retention primitives**, not the production burden.
