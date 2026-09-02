# Decision ledger

This file separates **what is actually accepted** from ideas that are still being evaluated. Do not silently promote parked ideas into probe scope.

Status meanings:

- **LOCKED** — source of truth unless new evidence directly invalidates it.
- **LOCKED FOR PROBE** — required behavior for the first behavioral/public probe.
- **LOCKED CANDIDATE** — chosen submission/marketing answer unless an external constraint such as catalog uniqueness forces a rename.
- **PARKED** — useful later; do not block the probe.
- **LOCKED OUT** — deliberately excluded.
- **HYPOTHESIS** — assumption to validate, not a product requirement.

---

## Product

| Decision | Status | Current answer |
|---|---|---|
| Platform | LOCKED | Yandex Games |
| Supported platforms | LOCKED FOR PROBE | Desktop + Mobile in landscape; no TV-specific UX/support in the first probe |
| Game choice | LOCKED | Mystery collectible opener; broad ideation is over |
| Theme | LOCKED | Y2K / retro pocket gadgets |
| Core fantasy | LOCKED | Open tiny mystery tech and build a visible nostalgic collection |
| Core loop | LOCKED | package → short open interaction → anticipation → reveal → rarity → collection/duplicate resolution → repeat |
| Package form | LOCKED | stylized silver/translucent-lavender anti-static / foil mystery pouch |
| Probe package model | LOCKED FOR PROBE | exactly one Mystery Pouch type; always available; unlimited free openings |
| Probe package economy | LOCKED OUT | no package tiers, package prices, energy, store gating or consumable package inventory |
| Tear interaction | LOCKED | one short left-to-right drag using a large star-shaped tear-tab along a horizontal tear line; no physics or multi-stage unpacking |
| Reveal choreography | LOCKED | tear strip detaches → pouch recoil/twitch → rarity-tinted flash → gadget visibly rises/scales from pouch → pouch drops/fades → gadget overshoots/settles → rarity + NEW/duplicate; target ~1.0–1.4 s after drag |
| Package presence during reveal | LOCKED | pouch remains the physical source for the first ~0.3–0.4 s before exiting behind the collectible |
| Reveal FX | LOCKED | cheap runtime-only Phaser effects: soft radial flash, small sparkle burst, ring/outline pulse, rarity glow; Epic/Legendary may add tiny camera bump and denser particles |
| Reveal skip | LOCKED OUT FOR PROBE | no tap-to-skip, acceleration or x5 opening in the first probe; Quick Reveal is a required post-data revisit |
| Result hold / next pouch | LOCKED | after the final standard/Secret result settles, keep it readable for at least ~0.6 s; then tap/click outside Collection navigation advances to the next pouch. No automatic timer advance; a small localized `Next pouch` cue may appear. This dismissal is not reveal skipping |
| Primary screen architecture | LOCKED FOR PROBE | Opening is primary; Collection is the only separate persistent gameplay surface; reveal choreography stays inside Opening rather than switching to a separate Reveal scene |
| Scene transition UX | LOCKED | Opening ↔ Collection must feel effectively instant with no user-visible loading |
| Opening HUD budget | LOCKED FOR PROBE | Signal + Collection navigation only; a tiny system-level sound toggle is exempt from gameplay-HUD budget |
| Opening HUD progressive disclosure | LOCKED | Collection navigation appears after first reveal; Signal appears on first Signal gain |
| Reveal focus mode | LOCKED | during tear/reveal, nonessential HUD dims and cannot interrupt the reward presentation |
| First-session tutorial | LOCKED | no modal tutorial; teach tear gesture, Collection and Signal contextually |
| Audio | LOCKED FOR PROBE | SFX-only: tear, pop, rarity chime, Secret sting and light UI feedback; no background music; small persistent mute/speaker toggle; all audio pauses with platform/tab pause |
| Localization | LOCKED FOR PROBE | ship RU + EN UI strings; choose automatically from `ysdk.environment.i18n.lang`; unsupported languages fall back to EN; no manual language selector in probe |
| Primary orientation | LOCKED | landscape-only for first probe |
| Responsive philosophy | LOCKED | true adaptive landscape layout; canvas follows viewport; semantic anchors/constraints; no fixed 16:9 board simply scaled with FIT |
| Reference composition | LOCKED | 16:9 reference, coherent target range approximately 5:4 through 12:5 |
| Responsive modes | LOCKED | `compact` 1.25–1.50, `standard` >1.50–1.95, `wide` >1.95–2.40 |
| Extreme aspect behavior | LOCKED | clamp meaningful composition; use decorative fill/atmosphere instead of stretching or cropping critical UI |
| Production philosophy | LOCKED | ultra-low production burden; do not turn the probe into a large game |
| Primary RU store title | LOCKED CANDIDATE | `Мистери Гаджеты: Ретро Распаковка`; change only if catalog uniqueness/moderation forces it |
| EN title | LOCKED CANDIDATE | `Mystery Pocket Tech` |
| Audience | HYPOTHESIS | primary visual target roughly 14–27, likely female-skewed but not exclusive; secondary nostalgia target roughly 25–35 |

---

## Art

| Decision | Status | Current answer |
|---|---|---|
| Rendering | LOCKED | stylized 2D / painted 2.5D |
| Real-device references | LOCKED | recognizable archetypes are desirable |
| Exact branded models/logos | LOCKED OUT | avoid logos/model names and unnecessary 1:1 copies |
| Perspective | LOCKED | front-facing or very soft 3/4 depending on readability; no dramatic/deep perspective |
| Shape language | LOCKED | compact, chunky, softened, slightly toyified |
| Material language | LOCKED | candy plastic, translucent/frosted shells, pearlescent/iridescent treatments, controlled chrome/metal accents |
| Decoration | LOCKED | charms/decals sparingly; gadget identity first |
| Package visual grammar | LOCKED | circular `?` badge, three small gadget silhouettes, restrained circuit traces, large star tear-tab, minimal/no baked product text |
| Package reference asset | LOCKED | `docs/assets/package-mystery-pouch-v1.webp` |
| Collection environment | LOCKED | cozy illustrated Y2K shelf/desk/display with fixed presentation positions |
| Gadget art exploration | LOCKED | each base gadget: ~6–10 exploratory candidates → one canonical master → four derived standard rarity variants |
| Rarity consistency | LOCKED | preserve geometry, camera angle, major controls and identity across Common/Rare/Epic/Legendary |
| Runtime collectible export | LOCKED FOR PROBE | transparent 1024×1024 WebP; source master target 1536×1536 where tool quality permits, never below 1024×1024 |
| Art pipeline | LOCKED | operational workflow lives in `ART_PRODUCTION.md` |

---

## Rarity / content

| Decision | Status | Current answer |
|---|---|---|
| Standard rarity count | LOCKED | 4 |
| Ladder | LOCKED | Common → Rare → Epic → Legendary |
| Probe standard odds | LOCKED FOR PROBE | Common **60%**, Rare **28%**, Epic **10%**, Legendary **2%** |
| Probe family split | LOCKED FOR PROBE | Camera vs Flip Phone at **50/50**, independent of rarity |
| Common | LOCKED | solid/mostly solid candy plastic; simple but desirable |
| Rare | LOCKED | translucent/frosted material + restrained premium accent |
| Epic | LOCKED | pearlescent/iridescent treatment + richer trim/accessory |
| Legendary | LOCKED | clear shell + stylized visible internals + premium metallic treatment |
| First-three protection | LOCKED FOR PROBE | first 3 standard openings are undiscovered standard variants; opening #2 must use the opposite family from opening #1 |
| Ongoing hidden anti-duplicate | LOCKED OUT | after opening #3 ordinary standard rolls use normal RNG; Signal is the visible mitigation system |
| Probe base gadgets | LOCKED FOR PROBE | exactly **Digital Camera** and **Flip Phone** |
| Standard variants per gadget | LOCKED | 4 each |
| Probe standard content | LOCKED | **8 standard collectible variants** total |
| Probe Secrets | LOCKED FOR PROBE | exactly **2**: one Secret Camera and one Secret Flip Phone |
| Secret Camera | LOCKED | cold cyan/cosmic translucent special edition with distinctive Saturn/planet charm and altered lens/face details |
| Secret Flip Phone | LOCKED | purple/music-edition special with altered faceplate/controls/accessory language |
| Secret design rule | LOCKED | outside normal rarity ladder; may change roughly 15–25% geometry/details; must feel like special edition, not fifth rarity color |
| Secret completion | LOCKED OUT | Secrets do not count toward standard 8/8 completion |
| Reveal FX baked into item art | LOCKED OUT | reward glow/particles/bursts belong to runtime presentation |
| Additional gadget families | PARKED | add only after behavioral validation |

---

## Signal / duplicate handling

| Decision | Status | Current answer |
|---|---|---|
| Signal | LOCKED FOR PROBE | global visible pity system; only standard duplicates add Signal |
| Signal gains | LOCKED | Common dup +25, Rare +20, Epic +15, Legendary +10; cap at 100 |
| New item Signal | LOCKED OUT | new discoveries add no Signal |
| SIGNAL LOCK early/mid collection | LOCKED | if any Common/Rare/Epic standard variant is missing, the next standard reveal is forced to an undiscovered non-Legendary variant |
| SIGNAL LOCK late collection | LOCKED | once all six non-Legendary variants are discovered, the armed next standard roll uses **Rare 60% / Epic 30% / Legendary 10%**, with family still 50/50; no Common; Legendary is boosted but never guaranteed |
| Signal reset | LOCKED | reset to 0 only after the armed standard result commits |
| Signal after 8/8 standard completion | LOCKED | stop gaining Signal and mark the standard collection complete; do not run a meaningless pity loop after all standard variants are owned |
| Signal ↔ Hidden Pocket | LOCKED OUT | Signal never changes Hidden Pocket/Secret probability or result |
| Signal UI | LOCKED | compact LCD/antenna meter; explicit `+Signal`; short `SIGNAL LOCK` glitch/pulse; restrained scan treatment on armed pouch |
| Tech Parts | PARKED | not in probe |
| Mod Bench | PARKED | not in probe |

---

## Hidden Pocket / chase

| Decision | Status | Current answer |
|---|---|---|
| Hidden Pocket | LOCKED FOR PROBE | rare automatic second reveal after the normal result; no second player input |
| Activation | LOCKED | disabled for the first 3 onboarding openings; beginning with opening #4, make an independent **3% post-standard roll** while an undiscovered Secret remains |
| Reward | LOCKED | Hidden Pocket always awards an undiscovered Secret in the probe; no generic bonus reward table |
| Secret duplicate protection | LOCKED | Secret results are always undiscovered; no Secret duplicates |
| After both Secrets | LOCKED | Hidden Pocket stops triggering for the probe |
| Animation budget | LOCKED | ~0.9–1.1 s additional beat: brief pause → pouch twitch/return → distinct sound/inner flash → Secret reveal |
| Signal interaction | LOCKED OUT | independent from Signal and standard rarity |

---

## Collection

| Decision | Status | Current answer |
|---|---|---|
| Collection surface | LOCKED FOR PROBE | one `CollectionScene` with two internal views: Shelf (default) and Library |
| Shelf slots | LOCKED | two hero positions: Camera and Flip Phone |
| Shelf display priority | LOCKED | show best owned visual per family: Secret > Legendary > Epic > Rare > Common; missing family uses silhouette/empty stand |
| Shelf progress | LOCKED | show compact per-family mastery `x/4` for standard variants; Secret tracked separately |
| Library structure | LOCKED | Camera row + Flip Phone row; each shows Common/Rare/Epic/Legendary plus one Secret slot; missing standard = silhouette, missing Secret = `???` |
| Library responsive density | LOCKED | standard/wide may show a whole family row; compact may wrap cards but does not change semantics |
| Item detail | LOCKED OUT FOR PROBE | no separate item detail page/modal; Library card state is enough |
| Headline completion | LOCKED | **standard collection = 8/8**; this is the main completion state |
| Base-family `2/2` | LOCKED | informational only; not headline completion because onboarding makes it trivial |
| Secrets | LOCKED | separate `Secrets 0/2`; never required for 8/8 completion |
| Completion celebration | LOCKED | one short non-blocking celebration the first time 8/8 is reached; player can immediately continue opening/chasing Secrets |
| Return affordance | LOCKED | obvious Back/Open More action returns instantly to Opening |

---

## Monetization / validation

| Decision | Status | Current answer |
|---|---|---|
| Ads in first behavioral probe | LOCKED OUT | no rewarded or interstitial ads in first probe; keep behavior measurement clean |
| Artificial scarcity for ads | LOCKED OUT | never add energy/package scarcity merely to manufacture an ad reward |
| Monetization pass | PARKED | evaluate only after core continuation gates are met |
| Analytics | LOCKED | built-in Yandex Games metrics + Yandex Metrica custom gameplay events through a typed adapter; no analytics backend |
| Validation gates | LOCKED | defined in `PROBE_VALIDATION.md`; first serious decision after ≥500 first-package interactions and ≥7 days, absent instrumentation/technical failures |
| Quick Reveal | PARKED / REQUIRED REVISIT | explicitly reevaluate after repeated-opening data; likely ~0.4–0.6 s mode if full reveal becomes friction |

---

## Technology

| Decision | Status | Current answer |
|---|---|---|
| Engine | LOCKED | Phaser 4.x |
| Build/dev tooling | LOCKED | Vite |
| Language | LOCKED | strict TypeScript |
| React | LOCKED OUT | do not use React for game runtime |
| Physics | LOCKED OUT | not needed |
| Yandex SDK | LOCKED | thin platform adapter; call loading/gameplay lifecycle correctly |
| Save | LOCKED | local-first, versioned; no required login/backend/cloud for probe |
| Persistent discovery model | LOCKED | store discovered standard IDs + discovered Secret IDs; duplicates are not retained as an inventory stack |
| Anti-reroll transaction | LOCKED | determine full standard result + optional Hidden Pocket result + Signal consequences, persist `pendingReveal`, animate, commit once, clear pending |
| Scene loading | LOCKED | preload/cache Opening + Collection critical assets before normal navigation; no user-visible scene asset loading |
| Scene transition budget | LOCKED TARGET | ~100–200 ms perceived response plus at most a very short cosmetic transition |
| Responsive coordinate model | LOCKED | stable logical height 720; logical width = clamped viewport aspect × 720, roughly 900–1728 |
| Safe-area policy | LOCKED | browser/device safe insets + ~3–5% responsive internal margins with clamps |
| Touch target floor | LOCKED | ~44 CSS px effective hit size |
| Stretch/crop policy | LOCKED OUT | never non-uniformly stretch gameplay art/UI; only decorative backgrounds may crop/extend |

---

## Scope / delivery

| Decision | Status | Current answer |
|---|---|---|
| First-probe content | LOCKED | 8 standard assets + 2 Secrets; no additional families |
| First-probe systems | LOCKED | opener/reveal, Signal, Hidden Pocket, Shelf/Library, local save, Yandex lifecycle, RU/EN localization, SFX, analytics |
| Excluded probe systems | LOCKED OUT | package economy, Tech Parts, Mod Bench, ads, dailies, leaderboard, trading, minigames, 3D |
| Rebased effort | LOCKED TARGET | approximately **5–8 focused days** excluding moderation waiting; perform scope review rather than silent expansion if submission-ready build exceeds ~8 focused days |

The probe is now considered **implementation-ready**. Remaining questions are post-validation tuning or store-submission verification, not blockers for coding.
