# Signal 2000 — Mobile Acceptance Hardening

**Date:** 2026-09-14  
**Status:** SECOND REAL-PHONE CORRECTION PASS — IMPLEMENTING  
**Trigger:** first real-phone GitHub Pages acceptance pass

This pass addresses four concrete hands-on failures observed on a real phone. It is deliberately scoped to presentation, responsive layout, and onboarding timing. It must not change reward/economy truth, save semantics, pouch odds, Signal rules, or Yandex integration behavior.

## 1. Acceptance failures

### A. First-run gesture pointer is visually weak

Observed: the first-run pointer is small, white-only, and ambiguous against the bright Y2K background. It can be mistaken for decoration instead of an instruction.

Current implementation confirms the cause: `createGuidancePointer()` is a white halo/core/triangle with no branded accent, no directional trail, and no contrast plate/glow strategy.

Required result:

- clearly reads as a drag/pull gesture rather than a generic cursor;
- uses the established cyan/lavender/pink accent family rather than white-only geometry;
- remains visible over both bright and dark background regions;
- is larger on short-height/mobile landscape viewports;
- stays presentation-only and never intercepts input.

### B. First reveal exposes the wrong chrome phase

Observed: immediately after the first pouch tear, the normal idle interface briefly appears as a whole and only resolves into the correct result UI at the end of reveal.

Current control flow confirms the cause: `OpeningScene.initialize()` calls `renderIdle()` before it detects/plays the staged pending reveal. `renderIdle()` creates idle-only chrome (Drop selector, pouch selector/odds, tear hint, etc.), after which `playReveal()` merely disables/fades pieces of that already-rendered tree.

Required phase contract:

```text
FirstRun tear
→ Opening reveal shell (environment + resource HUD + mute + actual pouch)
→ reveal choreography
→ committed result shell
→ collect
→ ordinary idle shell
```

The first live handoff must not flash idle-only selectors or odds during reveal. True reload recovery may use the same reveal shell before the abbreviated recovery choreography.

### C. Mobile landscape text is below practical readability

Observed: on a real phone, the HUD and especially the pouch odds panel are too small to read comfortably. The screenshot is technically sharp, but typography is physically tiny.

Current layout explains why: the game is authored against a fixed logical height of `720`, then scaled to the available landscape height. A phone browser often leaves only roughly 300–450 CSS px of usable game height after browser chrome. Existing digital-font sizes such as `5px`, `6px`, `7px`, `8px`, and `9px` therefore become only a few CSS pixels high.

This is not a render-density problem. HiDPI backing-store density improves sharpness but does not improve physical text size.

Required result:

- landscape phone/short-height viewports receive a dedicated **readable chrome profile**;
- do not fork gameplay into a second mobile scene;
- preserve the same world/object coordinates and interaction geometry;
- enlarge/reflow only informational chrome and tap targets;
- the pouch odds panel is the primary acceptance target: headers, row labels and percentages must be readable without zooming;
- CHIPS / SIGNAL / OVERCHARGE, reward breakdown, pouch selector copy, mute/collection actions, and result status/CTA must also remain readable;
- tiny Press Start 2P text should not be preserved merely for style if it fails legibility; detailed secondary copy may use the system font on the mobile profile.

### D. Rotation/viewport changes do not reliably relayout

Observed: rotating the phone into landscape can leave the game at the previous geometry instead of rebuilding to the new viewport.

Current bootstrap is only partially robust:

- it listens to `window.resize` and a `ResizeObserver` on `#game`;
- it does not listen to `orientationchange` or `visualViewport.resize`;
- sizing is based on fixed `100%` layout and `window.innerWidth/innerHeight`, which can lag mobile browser UI/rotation transitions;
- mobile browsers can settle viewport dimensions across more than one frame during rotation.

Required result:

- keep the product landscape-only; portrait continues to show the orientation gate;
- source live viewport dimensions from `visualViewport` when available;
- listen to `resize`, `orientationchange`, and `visualViewport.resize`;
- update CSS viewport dimensions before measuring `#game`;
- run an immediate relayout and one short delayed settle pass after rotation;
- Phaser backing store and active scene layout must end on the final viewport size;
- no duplicated reward transactions or stale onboarding pointers during resize/restart.

## 2. Responsive strategy

### Do not introduce a second mobile scene

A scene fork would duplicate reward/recovery state handling and create a long-term maintenance hazard. The existing scene/state architecture is sound; the failure is presentation scaling.

Use one deterministic layout profile exposed by `LayoutMetrics`:

```ts
interface LayoutMetrics {
  // existing fields...
  cssViewportWidth: number;
  cssViewportHeight: number;
  compactChrome: boolean;
}
```

`compactChrome` is based on **physical CSS viewport height**, not only aspect ratio. Aspect ratio cannot distinguish a desktop 16:9 window from a phone 16:9 viewport.

Initial threshold for this pass: short landscape height around `<= 520 CSS px`. Treating an unusually short desktop window as compact chrome is acceptable and improves accessibility.

## 3. Mobile chrome rules

The exact visual constants may be tuned during implementation, but these constraints are binding:

- no informational font below the practical mobile floor used by the acceptance screenshots;
- odds typography gets the strongest increase (roughly 1.5–2x current logical sizes depending on row);
- detailed odds copy may switch from Press Start 2P to system UI on compact chrome;
- rail/HUD surfaces may widen and grow vertically, but must not overlap the centered pouch/result hero;
- result CTA stays visually dominant over metadata;
- reward breakdown may wrap/reflow; it must not rely on a single tiny line;
- touch targets remain at least as large as the current ones and should grow with compact chrome;
- background/collectible art is not globally zoomed just to make text readable.

## 4. Reveal-shell contract

Add a reveal-specific render path rather than painting idle UI and hiding it after the fact.

Reveal shell contains:

- environment;
- CHIPS / SIGNAL HUD;
- mute control;
- selected real pouch visual required by the reveal choreography.

Reveal shell excludes:

- Drop selector;
- pouch selector cards;
- pouch odds panel;
- idle tear hint;
- collection navigation unless explicitly needed by the committed result state.

At `phase = result`, `renderResolvedResult()` remains authoritative and may replace the reveal tree in one deterministic rebuild.

## 5. Guidance pointer contract

Replace the white-only pointer with a higher-salience gesture primitive:

- cyan outer glow / lavender body / pink or white hot core;
- visible directional tail or repeated chevrons;
- stronger halo with dark shadow/outline so it survives the bright desk background;
- pulse + translation should communicate the intended drag direction;
- compact chrome gets a larger scale and slightly longer travel;
- pointer destruction/recreation semantics remain unchanged.

Do not add blocking tutorial copy unless hands-on review still finds the gesture ambiguous after the visual upgrade.

## 6. Implementation order

1. viewport/orientation relayout plumbing;
2. `LayoutMetrics` compact-chrome signal + unit coverage;
3. mobile typography/panel sizing pass, starting with odds/HUD/reward/result copy;
4. reveal-specific shell so first reveal never flashes idle chrome;
5. guidance pointer redesign;
6. full automated gate;
7. independent diff review against this document;
8. merge and GitHub Pages deploy;
9. real-phone acceptance pass.

## 7. Automated gate

Must remain green:

- `npm ci`;
- `npm run typecheck`;
- `npm test`;
- `npm run assets:selftest`;
- `npm run assets:validate`;
- `npm run build`.

Add focused tests for layout profile classification and viewport sizing helpers where practical. Do not add screenshot tests that would create brittle pixel baselines for this pass.

## 8. Hands-on acceptance checklist

- first-run gesture cue is immediately visible and reads as a rightward pull;
- first live tear enters reveal without flashing pouch/drop/odds idle chrome;
- result UI appears only as the result becomes the active phase;
- CHIPS, SIGNAL, OVERCHARGE and reward totals are readable on a real landscape phone at normal viewing distance;
- pouch odds panel can be read without browser zoom;
- Basic/Charged selector title/cost text remains readable;
- result title/status/collect CTA remains readable;
- portrait still blocks gameplay with the rotation gate;
- rotating portrait → landscape causes the game to fit the final visible viewport without reload;
- rotating landscape → portrait → landscape does not leave stale dimensions;
- browser toolbar expansion/collapse does not leave a stretched/cropped canvas;
- onboarding reload/recovery invariants from `docs/ONBOARDING.md` remain intact;
- debug panel remains available on GitHub Pages and stays out of Yandex production.

## 9. Independent recheck before implementation

The four reports are mutually consistent and supported by current code. They are not four unrelated cosmetic requests:

- pointer salience is a local visual issue;
- reveal chrome is a scene-phase ownership issue;
- unreadable text is a physical-size/layout-profile issue, not an antialiasing issue;
- rotation is a browser viewport synchronization issue.

The tempting shortcut — globally zooming the entire canvas or globally increasing Phaser resolution — is rejected. It would either crop the scene or only sharpen the same physically tiny text. The correct low-complexity fix is one shared gameplay scene with a compact readable chrome profile plus robust mobile viewport synchronization.

## 10. Implementation result and independent diff review

Implemented in `mobile-acceptance-hardening` and reviewed against this document before merge.

Implementation result:

- `LayoutMetrics` now exposes physical CSS viewport dimensions and a short-height `compactChrome` profile using the clamped render pixel ratio;
- Opening/FirstRun/Guidance/Collection all consume the same DPR-aware metrics path, without introducing a second mobile scene;
- compact Opening chrome enlarges and reflows CHIPS, SIGNAL/OVERCHARGE, pouch cards, odds, reward breakdown, result metadata/CTA, milestones, mute/collection controls, and onboarding hints;
- the first pending reveal renders through a dedicated reveal shell containing environment, resource HUD, mute, and the real torn pouch while excluding idle Drop/pouch/odds chrome;
- the onboarding gesture cue is now a branded cyan/lavender/pink pointer with dark local contrast, directional geometry, pulse, and larger compact-mode travel/scale;
- viewport synchronization now uses `visualViewport` when available, listens to `resize`, `orientationchange`, and `visualViewport.resize`, updates CSS viewport variables before measuring the game host, and performs an animation-frame pass plus a delayed settle pass;
- focused layout tests cover the compact mobile classification and protect HiDPI desktop classification.

Independent diff review found no blocking state/economy/save/Yandex-runtime changes. One follow-up readability pass was made before merge to raise remaining transient reward/reveal copy and to make Charged-spend feedback use compact HUD geometry rather than desktop constants.

Validated after the final readability pass with:

- `npm run typecheck`;
- `npm test`;
- `npm run assets:selftest`;
- `npm run assets:validate`;
- `npm run build`.

PR CI is also green. Remaining acceptance is intentionally hands-on: deploy the merged build to GitHub Pages and rerun the checklist in section 8 on the real phone.

## 11. Second real-phone acceptance findings

The first deployed compact-chrome pass improved physical readability and rotation handling, but the next real-phone review exposed five follow-up failures. These are treated as one bounded layout-coherence correction, not a new feature pass.

1. **Odds chrome survives into live reveal.** The live tear path only dimmed selector cards and hid the Drop selector; the odds container was not owned/tracked by reveal-phase cleanup. The live path must transition to the same clean reveal shell used by staged/recovered presentation.
2. **The POUCH section label loses contrast.** It sits directly on bright authored background art. Compact mode needs a dark outline/shadow while preserving the existing typography identity.
3. **Compact chrome is readable but compositionally cramped.** The previous pass enlarged text without proportionally redesigning card heights, vertical rhythm and Drop navigation. This creates near-overflow, crowded surfaces and navigation controls that compete with Drop title/progress copy. The correction must reduce vertical pressure while preserving readable font sizes, and move compact Drop arrows outside the text surface.
4. **Charged onboarding target geometry drifted.** At least one Charged-ready outline still uses the desktop rail width/height while the compact card uses enlarged dimensions. Opening and Guidance must share a single pouch-selector geometry source so pointer/highlight/hit targets cannot drift from the rendered card.
5. **The branded gesture pointer is visible but optically off-center.** The arrowhead was intentionally placed toward the right edge of the halo, which reads as malformed rather than directional on phone. The arrow must be centered inside the circular target; direction comes from the translation loop and external trail.

### Correction constraints

- no economy, reward, RNG, save, tear-threshold or Yandex runtime changes;
- no second mobile scene;
- no broad OpeningScene rewrite;
- preserve the improved physical readability from the first pass;
- one shared compact geometry source must drive rendered pouch cards and guidance target coordinates;
- reveal chrome must be semantically owned by phase, not merely dimmed;
- compact Drop navigation must have independent space from title/progress content;
- after automated validation, real-phone review remains authoritative.
