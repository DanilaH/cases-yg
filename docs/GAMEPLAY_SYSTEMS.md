# Gameplay systems

This document separates **core mechanics** from the current **internal-slice balance**. The two-family slice is for hands-on validation only and will not be published as the final game.

---

# 1. Core opener — LOCKED

Primary loop:

1. show Mystery Pouch;
2. one short left-to-right tear-tab drag;
3. predetermine and persist reward transaction;
4. reveal collectible from pouch;
5. show rarity + NEW/duplicate;
6. apply progression;
7. optionally run Hidden Pocket;
8. hold result briefly;
9. player advances or opens Collection.

Reveal:

- ~1.0–1.4 s after tear;
- pouch remains visible as physical source for ~0.3–0.4 s;
- cheap runtime flash/glow/ring/sparkles;
- no physics;
- no auto-dismiss;
- minimum result readability hold ~0.6 s.

No separate Reveal scene.

---

# 2. Standard rarity — LOCKED

> **Common → Rare → Epic → Legendary**

The ladder and visual grammar survive content expansion. Exact probabilities may change.

---

# 3. Internal-slice drop configuration — LOCKED FOR SLICE

Only for Camera + Flip Phone:

| Rarity | Chance |
|---|---:|
| Common | 60% |
| Rare | 28% |
| Epic | 10% |
| Legendary | 2% |

Family: Camera / Flip Phone 50/50.

First three standard openings:

- guaranteed undiscovered standard variants;
- opening #2 uses opposite family from #1.

These values exist so the slice is pleasant and testable. **Do not assume they are launch balance after the roster expands.**

---

# 4. Signal — CORE MECHANIC ACCEPTED, SLICE NUMBERS TEMPORARY

Signal is the visible pity/progress system for duplicates.

Slice gains:

| Duplicate rarity | Signal |
|---|---:|
| Common | +25 |
| Rare | +20 |
| Epic | +15 |
| Legendary | +10 |

At 100 in the slice:

- while any Camera/Flip Phone Common/Rare/Epic variant is missing: force one missing non-Legendary variant;
- otherwise: next standard rarity is Rare 60 / Epic 30 / Legendary 10;
- consuming the lock resets Signal to 0;
- the armed result itself does not immediately add Signal again;
- slice Signal stops after standard 8/8.

Release expansion requirement:

> re-design Signal against the final family count, drop grouping and duplicate rate. Preserve the fantasy and purpose, not necessarily these increments/threshold semantics.

---

# 5. Hidden Pocket — CORE MECHANIC ACCEPTED, SLICE NUMBERS TEMPORARY

Hidden Pocket is a rare automatic second reveal beat. No second input.

Slice configuration:

- disabled on openings #1–3;
- from #4: independent 3% post-standard roll while at least one slice Secret remains;
- always awards an undiscovered Secret;
- no Secret duplicates;
- exactly two slice Secrets: Cosmic Camera + Music Flip Phone;
- stops after 2/2.

Animation target: ~0.9–1.1 s additional beat using the existing pouch.

For public release, re-evaluate:

- trigger probability;
- number/distribution of Secrets;
- whether every Hidden Pocket must be a Secret or may include other rare bonuses;
- duplicate protection at a much larger Secret pool.

---

# 6. Collection — CORE MODEL LOCKED, SCALE OPEN

Roles remain:

> **Shelf = attractive best finds. Library = exhaustive ownership/completion view.**

Internal slice:

- two family positions: Camera + Flip Phone;
- display priority Secret > Legendary > Epic > Rare > Common;
- Library shows 4 standard rarities + Secret per family;
- standard completion 8/8;
- Secrets 0/2 separately.

Public release:

- family count will be materially larger;
- Shelf/Library must render from content registry;
- exact grouping, pages, themed shelves, progress counters and completion headline are redesigned once launch roster is known;
- do not hard-code 2-family semantics into game state or UI primitives.

---

# 7. Advertising — PLATFORM RULES LOCKED, RELEASE TUNING LATER

Advertising is implemented from the internal slice and follows current Yandex Games SDK/moderation rules by default.

Locked behavior:

- all ads go through the Yandex Games SDK adapter;
- interstitial is requested only at logical pauses and never during active tear/reveal;
- rewarded is optional and its CTA explicitly names the exact reward;
- reward is granted exactly once only after rewarded completion;
- close/error/unavailable ad never grants a reward and never blocks gameplay;
- fullscreen/rewarded ads pause gameplay and all audio;
- sticky banner, if used, must be configured so it does not cover or interfere with gameplay/UI;
- platform/ad/visibility pause reasons must not fight each other on resume.

Internal slice proves the plumbing with deliberate dev/debug actions. A dev-only `+25 Signal` rewarded test is acceptable only to verify exactly-once reward behavior.

After the larger content/economy exists, we **tune** which compliant ad opportunities are useful, the rewarded value, and whether sticky is worth showing. Those are later optimization decisions, not questions that block implementation now.

Do not create artificial energy scarcity solely to force ad views.

---

# 8. Quick Reveal — PARKED FOR SLICE, REQUIRED REVIEW

The internal slice initially uses full reveal every time. During hands-on review, deliberately test whether repeated openings become irritating.

If so, add a configurable ~0.4–0.6 s Quick Reveal before public release. No mass/x5 opening is implied.

---

# 9. Systems parked from the slice

These can be reconsidered during release expansion when the content pool is large enough to justify them:

- Tech Parts / Mod Bench;
- package tiers;
- Daily Spotlight;
- shelf/environment milestones;
- streak/leaderboard if evidence supports them.

Still avoid by default:

- market/trading;
- crash/double/jackpot/betting;
- large minigame suite;
- 3D inspection/world complexity.

The expansion strategy is **more desirable collectible content first**, not a pile of meta systems.
