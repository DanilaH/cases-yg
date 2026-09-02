# Decision ledger

This file separates **what is actually accepted** from ideas that are still being evaluated. Do not silently promote provisional ideas into scope.

Status meanings:

- **LOCKED** — treat as source of truth unless new evidence directly invalidates it.
- **ACCEPTED FOR PROBE** — include in the first behavioral version unless implementation cost proves materially larger than expected.
- **PROVISIONAL** — promising, but must be explicitly confirmed before becoming a launch blocker.
- **PARKED** — useful later; do not block the probe.
- **OPEN** — unresolved.

---

## Product

| Decision | Status | Current answer |
|---|---|---|
| Platform | LOCKED | Yandex Games |
| Game choice | LOCKED | Mystery collectible opener; broad ideation is over |
| Theme | LOCKED | Y2K / retro pocket gadgets |
| Core fantasy | LOCKED | Open tiny mystery tech and build a visible nostalgic collection |
| Core loop | LOCKED | package → short open interaction → anticipation → reveal → rarity → collection/duplicate resolution → repeat |
| Package form | LOCKED | stylized silver/translucent-lavender anti-static / foil mystery pouch |
| Probe package model | LOCKED | exactly one Mystery Pouch type; it is always available and can be opened indefinitely without spending a package currency |
| Probe package economy | LOCKED OUT | no package tiers, package prices, energy, store gating or consumable package inventory in the first behavioral probe |
| Tear interaction | LOCKED | one short left-to-right drag using a large star-shaped tear-tab along a horizontal tear line; no physics or multi-stage unpacking |
| Reveal choreography after tear | LOCKED | tear strip detaches → pouch gives a tiny recoil/twitch → short rarity-tinted flash from inside → gadget rises/scales into center → pouch drops/fades backward → gadget overshoots slightly and settles → rarity + NEW/duplicate state appears; target ~1.0–1.4 s after drag |
| Package presence during reveal | LOCKED | pouch remains visible for the first ~0.3–0.4 s as the physical source of the item; gadget visibly emerges from it, then the pouch slides down / scales slightly down / fades so the collectible becomes the sole visual hero |
| Reveal FX | LOCKED | runtime-only, cheap Phaser effects: soft radial flash, small sparkle burst, one ring/outline pulse and rarity-tinted glow; Epic/Legendary may add a tiny camera bump and denser particles; no expensive shaders or baked effect-heavy item art |
| Reveal skip in first probe | LOCKED OUT | full reveal always plays; tap/click does not skip or accelerate it in the first probe |
| Primary screen architecture | LOCKED FOR PROBE | Opening is the clean primary scene and Collection is the only separate gameplay surface required by the first probe; Mod Bench is parked |
| Scene transition UX | LOCKED | transitions between Opening and Collection must feel effectively instant; no blocking asset load, network wait, or long transition animation on navigation |
| Opening HUD budget | LOCKED | maximum persistent gameplay HUD in the probe is Signal + Collection navigation; Tech Parts and Mod Bench are parked, and no streaks, extra currencies or leaderboard widgets should be added |
| Opening HUD progressive disclosure | LOCKED | first launch starts visually minimal. Collection navigation is introduced after the first successful reveal; Signal appears when it first gains progress |
| Reveal focus mode | LOCKED | during tear/reveal, nonessential HUD is dimmed/temporarily de-emphasized and cannot compete with or interrupt the reward presentation; it returns immediately after resolution |
| First-session tutorial | LOCKED | no modal tutorial flow. Teach the opener with a small animated/gesture cue on the star tear-tab, then teach Collection and Signal contextually when they first become relevant |
| Primary orientation | LOCKED | landscape only for the first probe |
| Responsive philosophy | LOCKED | true adaptive landscape layout, not a fixed 16:9 board scaled with FIT. Canvas follows the available viewport; meaningful UI uses anchors/constraints and decorative background absorbs excess space |
| Reference composition | LOCKED | 16:9 is the art/layout reference, but the same scene must remain functional and coherent across approximately 5:4 through 12:5 landscape aspect ratios |
| Responsive modes | LOCKED | `compact` 1.25–1.50, `standard` >1.50–1.95, `wide` >1.95–2.40. Breakpoints affect spacing/density and modest object scale, not the core interaction flow |
| Extreme aspect behavior | LOCKED | outside the target aspect range, clamp the meaningful composition to the supported core and use decorative background/fill rather than stretching, cropping critical UI or reflowing into a different game |
| Production philosophy | LOCKED | ultra-low production burden; avoid systems that turn this into a large game |
| Working title | OPEN | `Mystery Pocket Tech` is placeholder only |
| Audience | OPEN / HYPOTHESIS | Primary visual target roughly 14–27 with likely female skew; secondary nostalgia audience roughly 25–35 |

---

## Art

| Decision | Status | Current answer |
|---|---|---|
| Rendering | LOCKED | stylized 2D / painted 2.5D |
| Real-device references | LOCKED | yes; recognizable archetypes are desirable |
| Exact branded models/logos | LOCKED | avoid exact logos/model names and unnecessary 1:1 copying |
| Perspective | LOCKED | front-facing or very soft 3/4 depending on which angle best expresses the device; no dramatic/deep perspective |
| Shape language | LOCKED | compact, chunky, softened, slightly toyified |
| Material language | LOCKED | candy plastic, translucent/frosted shells, pearlescent/iridescent treatments, controlled chrome/metal accents |
| Decoration | LOCKED | charms/decals allowed sparingly; gadget identity first, kawaii garnish second |
| Package visual grammar | LOCKED | circular mystery `?` badge, three small gadget silhouettes, restrained circuit traces, large functional star tear-tab; minimal/no baked product text |
| Package reference asset | LOCKED | `docs/assets/package-mystery-pouch-v1.webp` |
| Collection environment | LOCKED | cozy Y2K shelf/desk/display with fixed slots rather than free placement |
| Gadget art exploration | LOCKED | for each base gadget, generate roughly 6–10 exploratory candidates, choose one canonical master, then derive the four standard rarity variants from that same selected design |
| Rarity variant consistency | LOCKED | Common/Rare/Epic/Legendary are four rarity executions of one base gadget, not four independently redesigned devices; preserve core geometry, camera angle and recognizable identity |
| Rarity sheet workflow | ALLOWED | a 2×2 rarity sprite/reference sheet is a valid production format when it preserves consistency; it is a production convenience, not a runtime architecture requirement |

---

## Rarity

| Decision | Status | Current answer |
|---|---|---|
| Standard rarity count | LOCKED | 4 |
| Ladder | LOCKED | Common → Rare → Epic → Legendary |
| Probe standard odds | LOCKED BASELINE | Common **60%**, Rare **28%**, Epic **10%**, Legendary **2%** |
| Probe family split | LOCKED | choose Camera vs Flip Phone at **50/50**, independently from the standard rarity roll |
| Common | LOCKED | solid or mostly solid candy plastic; simple but already desirable |
| Rare | LOCKED | translucent/frosted material + restrained premium accent |
| Epic | LOCKED | pearlescent/iridescent/premium surface + richer trim/accessory |
| Legendary | LOCKED | clear shell + stylized visible internals + premium metallic treatment |
| First-three onboarding protection | LOCKED | first 3 standard openings are guaranteed to produce undiscovered standard variants; the second opening must use the opposite gadget family from the first so both Camera and Flip Phone are introduced immediately |
| Ongoing hidden duplicate protection | LOCKED OUT | after the first 3 protected openings, ordinary standard rolls use normal RNG; duplicate frustration is handled by Signal rather than a permanent hidden reroll system |
| Reveal FX baked into item art | LOCKED | no; glow/particles/burst belong primarily to reveal presentation |
| Secret/Chase tier | LOCKED | exists outside normal rarity ladder |
| Secret quantity at launch | LOCKED RANGE | 2–3 total, not one per base gadget |
| Secret design rule | LOCKED | special edition, not a fifth rarity color; can change ~15–25% of design details/geometry |
| Secret collection completion | LOCKED | not required for main collection completion |
| Secret exact drop chance | OPEN | Secret/Hidden Pocket is a separate post-standard roll and does not consume or dilute the 100% standard rarity table; exact chance remains to be tuned |

---

## Progression / retention

| Decision | Status | Current answer |
|---|---|---|
| Signal meter / pity system | LOCKED FOR PROBE | Signal is global and increases only on standard duplicates. Common duplicate +25, Rare +20, Epic +15, Legendary +10; cap at 100 until consumed |
| SIGNAL LOCK reward | LOCKED | when Signal reaches 100, the next standard reveal is forced to an undiscovered non-Legendary variant if any remain. If all six Common/Rare/Epic variants are already discovered, it instead forces a Rare/Epic standard result; it never forces Legendary |
| Signal reset | LOCKED | consuming SIGNAL LOCK resets Signal to 0 after the forced standard result is transactionally resolved |
| Signal ↔ Secret | LOCKED OUT | Signal never affects Secret/Hidden Pocket probability or outcome; the post-standard Hidden Pocket roll remains independent |
| Signal UI | LOCKED DIRECTION | reveal Signal only when it first gains progress; show compact LCD/antenna-style meter, explicit `+Signal` feedback on duplicate and a short `SIGNAL LOCK` pulse/scan treatment when full |
| Tech Parts | PARKED | remove from the first behavioral probe. Signal already gives duplicates visible progression; do not add a second currency before the core opener validates |
| Mod Bench / deterministic upgrade | PARKED | remove the scene, navigation and upgrade economy from the first behavioral probe; reconsider only if repeated-opening data shows Signal alone is insufficient |
| Hidden Pocket / rare second reveal | ACCEPTED FOR PROBE | after an apparently complete normal reveal, a rare automatic second beat can make the pouch twitch/return and reveal a bonus or Secret; no second player input. Treat it as surprise presentation, not a new unpacking mechanic |
| Hidden Pocket ↔ Secrets | ACCEPTED DIRECTION | Hidden Pocket is the preferred thematic channel for Secret/Chase acquisition rather than presenting Secrets as a plain fifth-rarity roll; exact chance/reward table remains open |
| Quick Reveal | PARKED | not in first probe, but **must be revisited deliberately after repeated-opening testing / early behavioral data**; likely shorter ~0.4–0.6 s reveal if the full animation becomes friction. Do not silently forget this decision point. |
| Room/shelf evolution milestones | PARKED | use one evolving collection scene instead of multiple biomes/worlds |
| Daily Spotlight / rotating family boost | PARKED | possible return hook; do not block first probe |
| Daily reward streak | PARKED | conventional retention system; only after core loop validates |
| Leaderboard | PARKED | low priority for the collectible fantasy |
| Market/trading | LOCKED OUT | do not build |
| Gambling-like crash/jackpot/double | LOCKED OUT | do not build |
| Minigame currency faucets | LOCKED OUT | do not build for probe |
| Multiple biomes/worlds | LOCKED OUT FOR PROBE | too much content burden |

---

## Content model

| Decision | Status | Current answer |
|---|---|---|
| Full content target | WORKING MODEL | expand to additional gadget families only after the behavioral probe validates; the old ~24-base-gadget target is no longer a probe commitment |
| Probe base gadgets | LOCKED | exactly 2 base gadget collections: **Digital Camera** and **Flip Phone** |
| Standard variants per gadget | LOCKED | each probe gadget has 4 standard rarity variants: Common, Rare, Epic, Legendary |
| Probe standard variant count | LOCKED | 2 × 4 = **8 standard collectible variants** |
| Probe Secrets | LOCKED RANGE | **1–2 special chase items** outside standard completion; exact Camera/Flip Phone assignment remains open |
| Main Shelf representation | LOCKED | one shelf slot per base gadget; therefore the probe shelf has 2 primary slots, each displaying the best/highest-rarity version currently owned for Camera or Flip Phone |
| Library / Catalog | LOCKED | separate collection sub-surface shows all 8 standard Camera/Flip Phone rarity variants plus Secret discovery state; this is the exhaustive completionist/checklist view |
| Shelf vs Library purpose | LOCKED | Shelf is the attractive display of the player's best Camera and Flip Phone finds; Library is the exhaustive record of all rarity variants and Secrets |
| Probe grouping | LOCKED | `Camera` and `Flip Phone` are the two entire probe collections; do not reinterpret this as two six-item collections |
| Package tiers | LOCKED OUT FOR PROBE | exactly one unlimited free Mystery Pouch; multiple package tiers may only be reconsidered after the core loop validates and a larger content/economy model gives them a real purpose |

---

## Technology

| Decision | Status | Current answer |
|---|---|---|
| Engine | LOCKED | Phaser 4.x |
| Build/dev tooling | LOCKED | Vite |
| Language | LOCKED | strict TypeScript |
| React | LOCKED OUT | do not use React for game runtime |
| Physics | LOCKED OUT BY DEFAULT | not required for current deterministic opener |
| Yandex SDK | LOCKED | integrate through a platform adapter |
| Save | LOCKED | local-first save is enough for probe |
| Backend/login | LOCKED OUT FOR PROBE | no backend and no required login |
| Anti-reroll | LOCKED | persist `pendingReveal` before reveal animation, then commit inventory and clear it |
| Scene loading policy | LOCKED | preload/shared-load assets needed by Opening and Collection before normal navigation; scene changes must not trigger user-visible asset loading |
| Scene transition budget | LOCKED TARGET | target transition response ~100–200 ms plus only a very short cosmetic fade/slide if used; if navigation feels like a page load, implementation is wrong |
| Responsive coordinate model | LOCKED | use a stable logical height of 720 units and derive logical width from viewport aspect, clamped roughly to 900–1728 units; scenes recompute layout on resize instead of scaling one immutable 1280×720 composition |
| Safe-area policy | LOCKED | anchors must honor browser/device safe insets plus internal margins. Critical controls never touch the viewport edge; use roughly 3–5% responsive margins with practical min/max clamps |
| Touch target floor | LOCKED | interactive controls must remain at least ~44 CSS px in effective hit size on mobile landscape, even when visual art is smaller |
| Stretch/crop policy | LOCKED OUT | never non-uniformly stretch gameplay art/UI; decorative backgrounds may crop or extend, critical UI/package/reward content may not |

---

## Scope warning

The probe is intentionally much smaller than the old 12- or 24-gadget planning models: **2 base gadgets / 8 standard rarity assets + 1–2 Secrets**. Tech Parts and Mod Bench are explicitly parked. Re-estimate implementation after the remaining probe systems are locked, but do not inflate content or meta-economy before the core opening loop proves itself.
