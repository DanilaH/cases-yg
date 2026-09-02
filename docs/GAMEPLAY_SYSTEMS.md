# Gameplay systems

This document describes the **locked first behavioral probe mechanics**. Anything marked parked is not probe scope.

---

# 1. Core opener — LOCKED

Primary loop:

1. show Mystery Pouch;
2. player performs one short left-to-right tear-tab drag;
3. resolve/persist reward transaction;
4. play short reveal;
5. show gadget + rarity + `NEW`/duplicate;
6. update Signal / Collection state;
7. optionally trigger Hidden Pocket;
8. hold the final result briefly, then let the player advance to the next free pouch.

Target feel:

- fast;
- deterministic input;
- juicy output;
- no physics;
- no multi-step manipulation;
- no currency/energy gate between openings.

Reveal behavior:

- target ~1.0–1.4 s after completed tear;
- tap/click does not skip/accelerate in first probe;
- pouch remains visible for first ~0.3–0.4 s so item visibly emerges from it;
- pouch then slides/scales/fades away;
- gadget overshoots slightly and settles as sole hero;
- runtime FX scale by rarity.

## Result hold / next pouch

After the final standard result — or Secret result when Hidden Pocket triggers — settles:

- keep the result readable for at least **~0.6 s**;
- do **not** auto-advance on a timer;
- after the minimum hold, tap/click anywhere outside Collection navigation advances to a fresh pouch;
- a small localized `Next pouch` / `Следующий пакет` cue may appear;
- this input dismisses a completed result and is **not** reveal skipping.

If the player opens Collection from the resolved result state, returning from Collection starts with a fresh pouch.

Reveal choreography stays inside `OpeningScene`; do not switch to a separate scene merely for the animation.

---

# 2. Standard drop roll — LOCKED FOR PROBE

Standard ladder:

> **Common → Rare → Epic → Legendary**

Baseline rarity table:

| Rarity | Chance |
|---|---:|
| Common | 60% |
| Rare | 28% |
| Epic | 10% |
| Legendary | 2% |

Normal roll order:

1. choose `Camera` or `Flip Phone` at **50/50**;
2. choose standard rarity from the table;
3. resolve the corresponding variant.

Each specific raw Legendary family result is therefore approximately **1% per ordinary standard roll**.

## First-three onboarding protection

First **3 standard openings** are protected:

- each yields an undiscovered standard variant;
- opening #2 uses the opposite family from opening #1;
- both Camera and Flip Phone therefore appear immediately;
- the protection ends after opening #3.

After opening #3, ordinary RNG is allowed to produce duplicates. There is no permanent hidden anti-duplicate reroll.

---

# 3. Signal — LOCKED FOR PROBE

Signal is the one visible standard-duplicate mitigation system.

It is global and progressively disclosed only after the first duplicate.

## Gain

Only ordinary standard duplicates add Signal:

| Duplicate rarity | Signal |
|---|---:|
| Common | +25 |
| Rare | +20 |
| Epic | +15 |
| Legendary | +10 |

New discoveries add `0`.

Signal caps at **100** and stays armed until consumed.

## SIGNAL LOCK: collection-building phase

If any of the six Common/Rare/Epic standard variants are still missing when Signal reaches 100:

> **the next standard reveal is forced to one undiscovered non-Legendary variant.**

This removes ordinary duplicate frustration while preserving Legendary as a chase.

## SIGNAL LOCK: late chase phase

Once all six non-Legendary standard variants are discovered, a guaranteed Rare/Epic duplicate would have no meaningful utility because Tech Parts are not in the probe.

Therefore SIGNAL LOCK switches behavior:

> **the next standard rarity roll becomes Rare 60% / Epic 30% / Legendary 10%; Common 0%.**

Family selection remains Camera/Flip Phone at 50/50 and there is no missing-family guarantee.

This gives a meaningful late-game pity beat without guaranteeing either Legendary.

## Reset / completion

- consuming SIGNAL LOCK sets Signal to **0** after the armed standard result commits;
- the armed result itself does **not** add Signal even if that boosted late-game result is still a duplicate;
- the following ordinary duplicate starts building Signal again from 0;
- Hidden Pocket remains independent;
- once all **8/8** standard variants are discovered, stop adding Signal and show standard collection completion instead of continuing a meaningless pity loop.

## Presentation

Cheap UI direction:

- compact old-LCD / antenna meter;
- explicit `+25 SIGNAL`, etc. on ordinary duplicates;
- duplicate result copy combines the state rather than adding another reward system, e.g. `DUPLICATE · +25 SIGNAL`;
- short glitch/pulse at 100;
- clear `SIGNAL LOCK` state;
- restrained scan/lock treatment on the next pouch.

No separate Signal screen/tutorial.

---

# 4. Tech Parts / Mod Bench — PARKED

Not part of the first behavioral probe.

Reason:

- only eight standard variants exist;
- Signal already gives duplicates visible progress;
- a second currency, prices, upgrades, another scene and more HUD would muddy the core behavior test.

Probe duplicate loop:

> **duplicate → Signal progress → repeat**

Revisit Tech Parts / Mod Bench only if post-launch data reveals a distinct problem Signal cannot solve.

---

# 5. Hidden Pocket + Secrets — LOCKED FOR PROBE

Hidden Pocket is a rare **automatic second reveal beat** after the normal standard result.

It never requires a second tap/swipe/search interaction.

## Trigger

- disabled during protected openings #1–3;
- from opening #4 onward, after the normal standard reveal, roll Hidden Pocket at **3%**;
- only roll while at least one probe Secret is still undiscovered;
- Signal has no effect on this probability.

## Probe Secret pool

Exactly two Secrets:

1. **Secret Camera** — cold cyan/cosmic translucent special edition with Saturn/planet charm and altered lens/face details;
2. **Secret Flip Phone** — purple/music-edition special with altered faceplate/controls/accessory language.

Secrets are outside Common/Rare/Epic/Legendary and do not count toward standard 8/8 completion.

## Reward rule

If Hidden Pocket triggers:

- always reveal an **undiscovered Secret**;
- no Secret duplicates;
- no generic bonus reward table;
- if only one Secret remains, it is the result;
- after both Secrets are owned, Hidden Pocket stops triggering for the probe.

This makes the mechanic cheap, legible and worth remembering.

## Animation

Additional beat target: **~0.9–1.1 s**.

```text
normal reveal resolves
    ↓
brief pause
    ↓
pouch twitches / returns slightly
    ↓
distinct sound + unusual inner flash
    ↓
Secret emerges
```

Reuse existing pouch/reveal language. No new unpacking mechanic.

The normal result cannot be dismissed while a predetermined Hidden Pocket beat is pending.

---

# 6. Collection — LOCKED FOR PROBE

Collection is one `CollectionScene` with two internal views.

## Shelf — default view

A cozy illustrated Y2K shelf/desk with two hero positions:

- Camera;
- Flip Phone.

Each family position shows the best owned visual using this display priority:

> **Secret → Legendary → Epic → Rare → Common**

If the family is still undiscovered, show a tasteful locked silhouette/empty stand.

Also show compact standard mastery per family (`x/4`).

The Shelf is a reward display, not an exhaustive grid.

## Library — completion view

Library is a nearby subview inside the same Collection scene, not another Phaser scene.

Show:

- Camera: Common / Rare / Epic / Legendary + Secret;
- Flip Phone: Common / Rare / Epic / Legendary + Secret.

Rules:

- discovered standard variant → thumbnail + rarity;
- missing standard variant → silhouette/locked state;
- undiscovered Secret → `???`, no revealing silhouette;
- standard/wide layout can show a full family row;
- compact landscape may wrap cards while preserving the same information hierarchy;
- no separate item-detail page/modal in the probe.

## Completion semantics

Headline progress is:

> **STANDARD COLLECTION x/8**

`2/2` base families is informational only because onboarding makes it trivial.

Secrets use a separate counter:

> **SECRETS x/2**

Secrets are never required for standard completion.

When standard progress first reaches **8/8**, play one short non-blocking completion celebration. The player may immediately return to Opening and continue chasing Secrets if any remain.

Use an obvious `Back` / `Open More` affordance for immediate return to Opening.

---

# 7. Quick Reveal — PARKED, REQUIRED REVISIT

Initial probe:

- full reveal every time;
- no tap-to-skip;
- no x5/mass-open.

Quick Reveal must be deliberately reviewed after real repeated-opening data.

Likely implementation if needed:

- optional/unlocked ~0.4–0.6 s reveal;
- same drop/state semantics;
- preserve rarity readability;
- configurable timings from the start so adding it does not require rewriting the opener.

See `PROBE_VALIDATION.md` for the revisit trigger.

---

# 8. Ads — LOCKED OUT FOR FIRST PROBE

No rewarded or interstitial ads in the first behavioral probe.

Do not introduce energy/package scarcity to create an ad reward.

Monetization becomes a separate post-validation pass after the free loop demonstrates strong continuation.

---

# 9. Parked post-validation systems

Do not implement in first probe:

- Tech Parts / Mod Bench;
- additional package tiers;
- Daily Spotlight;
- streaks;
- leaderboard;
- shelf-room evolution;
- market/trading;
- minigames;
- crash/double/jackpot/betting systems;
- 3D inspection;
- additional gadget families.

The probe should prove the opener fantasy before adding a metagame around it.
