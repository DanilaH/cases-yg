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
| Tear interaction | LOCKED | one short left-to-right drag using a large star-shaped tear-tab along a horizontal tear line; no physics or multi-stage unpacking |
| Reveal choreography after tear | LOCKED | tear strip detaches → pouch gives a tiny recoil/twitch → short rarity-tinted flash from inside → gadget rises/scales into center → pouch drops/fades backward → gadget overshoots slightly and settles → rarity + NEW/duplicate state appears; target ~1.0–1.4 s after drag |
| Package presence during reveal | LOCKED | pouch remains visible for the first ~0.3–0.4 s as the physical source of the item; gadget visibly emerges from it, then the pouch slides down / scales slightly down / fades so the collectible becomes the sole visual hero |
| Reveal FX | LOCKED | runtime-only, cheap Phaser effects: soft radial flash, small sparkle burst, one ring/outline pulse and rarity-tinted glow; Epic/Legendary may add a tiny camera bump and denser particles; no expensive shaders or baked effect-heavy item art |
| Reveal skip in first probe | LOCKED OUT | full reveal always plays; tap/click does not skip or accelerate it in the first probe |
| Primary screen architecture | LOCKED | Opening is the clean primary scene; Collection and Mod Bench are separate scenes/surfaces rather than permanent opener UI |
| Scene transition UX | LOCKED | transitions between Opening, Collection and Mod Bench must feel effectively instant; no blocking asset load, network wait, or long transition animation on navigation |
| Opening HUD budget | LOCKED | maximum persistent gameplay HUD is Signal, Tech Parts, Collection navigation and Mod Bench navigation; no streaks, extra currencies, leaderboard widgets or other permanent clutter in the probe |
| Opening HUD progressive disclosure | LOCKED | first launch starts visually minimal. Collection navigation is introduced after the first successful reveal; Signal appears when it first gains progress; Tech Parts and Mod Bench are introduced on the first duplicate/Parts gain rather than occupying the screen before they have meaning |
| Reveal focus mode | LOCKED | during tear/reveal, nonessential HUD is dimmed/temporarily de-emphasized and cannot compete with or interrupt the reward presentation; it returns immediately after resolution |
| First-session tutorial | LOCKED | no modal tutorial flow. Teach the opener with a small animated/gesture cue on the star tear-tab, then teach Collection, Signal and Mod Bench contextually when those systems first become relevant |
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

---

## Rarity

| Decision | Status | Current answer |
|---|---|---|
| Standard rarity count | LOCKED | 4 |
| Ladder | LOCKED | Common → Rare → Epic → Legendary |
| Common | LOCKED | solid or mostly solid candy plastic; simple but already desirable |
| Rare | LOCKED | translucent/frosted material + restrained premium accent |
| Epic | LOCKED | pearlescent/iridescent/premium surface + richer trim/accessory |
| Legendary | LOCKED | clear shell + stylized visible internals + premium metallic treatment |
| Reveal FX baked into item art | LOCKED | no; glow/particles/burst belong primarily to reveal presentation |
| Secret/Chase tier | LOCKED | exists outside normal rarity ladder |
| Secret quantity at launch | LOCKED RANGE | 2–3 total, not one per base gadget |
| Secret design rule | LOCKED | special edition, not a fifth rarity color; can change ~15–25% of design details/geometry |
| Secret collection completion | LOCKED | not required for main collection completion |
| Secret exact drop chance | OPEN | tune after opening speed/economy is fixed; earlier rough thought was ~0.5–1%, not final |

---

## Progression / retention

| Decision | Status | Current answer |
|---|---|---|
| Signal meter / pity system | ACCEPTED FOR PROBE | bad/duplicate rolls still advance toward a guaranteed useful drop; theme it as Y2K signal/lock-on rather than generic luck |
| Duplicate conversion | ACCEPTED FOR PROBE | duplicates become Tech Parts rather than dead inventory |
| Mod Bench / deterministic upgrade | ACCEPTED FOR PROBE | Tech Parts feed a simple targeted upgrade/reward path; exact recipe/UI still open |
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
| Base gadget target | WORKING MODEL | around 24 base collectible gadget designs |
| Standard variants per gadget | WORKING MODEL | 4 rarity executions per base gadget |
| Resulting standard collection entries | WORKING MODEL | roughly 96 visual collectible versions if every base gadget has all four rarities |
| Secrets | LOCKED RANGE | +2–3 special chase items outside standard completion |
| Package tiers | OPEN | old research assumed ~3, but exact structure must be re-evaluated with Signal/Mod Bench |

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
| Scene loading policy | LOCKED | preload/shared-load assets needed by Opening, Collection and Mod Bench before normal navigation; scene changes must not trigger user-visible asset loading |
| Scene transition budget | LOCKED TARGET | target transition response ~100–200 ms plus only a very short cosmetic fade/slide if used; if navigation feels like a page load, implementation is wrong |

---

## Scope warning

The old handoff used a rough **4.5–6.5 focused day / ~7-day kill boundary** before Signal/Mod Bench/Secrets were fully incorporated. Treat that estimate as **NEEDS REBASE**, not as a current promise. The low-burden constraint is still locked; the exact day estimate must be recalculated after the documentation pass.
