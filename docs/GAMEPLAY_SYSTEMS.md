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
- duplicates are intentionally allowed because Signal is the visible system that makes bad rolls useful.

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

# 4. Signal meter — LOCKED FOR PROBE

Signal is the visible pity system for ordinary duplicate frustration.

It is global because the probe has only one package type.

## Gain rules

Signal increases **only when the standard result is a duplicate**:

| Duplicate rarity | Signal gain |
|---|---:|
| Common | +25 |
| Rare | +20 |
| Epic | +15 |
| Legendary | +10 |

New discoveries add no Signal.

Signal caps at **100**. Once full, it stays locked at 100 until consumed.

## SIGNAL LOCK

When Signal reaches 100:

> **the next standard reveal is forced to be useful.**

Resolution rules:

1. if any undiscovered Common/Rare/Epic standard variants remain, choose an undiscovered non-Legendary variant and reveal it;
2. if all six non-Legendary standard variants are already discovered, force a Rare/Epic standard result instead so the meter still creates a better-than-common outcome;
3. Signal never forces Legendary;
4. Secret/Hidden Pocket remains a completely separate post-standard roll and is not modified by Signal.

After the forced standard result is transactionally committed, Signal resets to **0**.

This deliberately leaves both Legendary variants as real chase outcomes while still ensuring that four-to-seven disappointing duplicate rolls create visible forward progress.

## Presentation

Signal is progressively disclosed only after it first gains progress.

Cheap presentation direction:

- compact old-LCD / antenna meter;
- explicit `+25 SIGNAL`, `+20 SIGNAL`, etc. feedback on duplicate resolution;
- short glitch/pulse when the meter reaches 100;
- show `SIGNAL LOCK` clearly;
- the next pouch may receive a restrained scan/lock visual treatment so the player understands that the guarantee is armed.

Do not add a separate Signal scene or tutorial modal.

---

# 5. Tech Parts / Mod Bench — PARKED

Tech Parts and Mod Bench are **not part of the first behavioral probe**.

Reason:

- the probe has only eight standard variants;
- Signal already turns duplicates into visible forward progress;
- adding a second currency, prices, upgrade rules, another scene and more HUD would test a meta-economy rather than the opener itself.

The first probe duplicate loop is therefore simply:

> **duplicate → Signal progress → repeat**

Revisit Tech Parts / Mod Bench only after repeated-opening data shows a distinct unmet need that Signal does not solve.

---

# 6. Hidden Pocket — ACCEPTED FOR PROBE

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
- use the event especially as the thematic route to Secret/Chase items.

Why it is included:

- adds a second anticipation beat;
- makes a finished reveal occasionally become surprising again;
- uses existing package/item assets;
- low engineering/content burden;
- makes Secrets feel like discoveries rather than a fifth rarity color.

Still open:

- trigger chance;
- exact Secret reward rule;
- whether the probe uses one or two Secrets;
- final animation budget;
- analytics event names.

Do not tie rewarded ads to Hidden Pocket in the first probe.

---

# 7. Collection — LOCKED STRUCTURE

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

# 8. Quick Reveal — PARKED, REQUIRED REVISIT

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

# 9. Daily Spotlight — PARKED

Potential return mechanic that reuses existing content instead of adding new content.

Do not implement until the basic loop is validated and there are enough gadget families for a rotating family boost to make sense.

---

# 10. Rewarded ads

Accepted monetization direction:

- keep optional and limited in the probe;
- grant reward only after the actual rewarded callback;
- do not make ad watching mandatory to continue the base loop.

Because ordinary packages are already unlimited/free, do **not** use rewarded ads merely to grant another standard package.

Current candidate:

- Signal boost or another similarly simple progression benefit compatible with the tiny content pool.

Avoid tying rewarded ads to a deceptive near-win or casino-like loop.

---

# 11. Explicitly rejected scope

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
- expanding beyond Camera + Flip Phone before the core loop is validated;
- Tech Parts / Mod Bench economy before validation.

The goal is to steal **retention primitives**, not the production burden.
