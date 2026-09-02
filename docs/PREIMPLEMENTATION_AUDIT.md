# Pre-implementation audit — 2026-09-02

Purpose: independently re-check the locked probe before implementation, looking specifically for contradictions, unnecessary scope, moderation risks and missing production dependencies.

This audit used:

- the repository source-of-truth documents;
- current Yandex Games documentation checked on 2026-09-02;
- current Phaser release information;
- a fresh Monte Carlo sanity pass over the locked drop / Signal / Hidden Pocket model.

Conclusion:

> **The probe remains implementation-worthy and does not need feature expansion before coding.**

A few operational gaps were found and are listed below. None requires reopening the core game concept.

---

# 1. Product/scope audit — PASS

Current first-probe scope is coherent:

- 2 gadget families: Camera + Flip Phone;
- 8 standard variants;
- 2 Secrets;
- one free unlimited pouch;
- one tear gesture;
- one duplicate-mitigation system: Signal;
- one surprise system: Hidden Pocket;
- one Collection scene with Shelf + Library;
- no ads/economy/crafting in first behavioral probe.

The earlier plan with 12+ base gadgets, Tech Parts and Mod Bench would have over-tested content/meta rather than the opener. Keeping those systems parked is still the correct decision.

No reason was found to restore:

- Tech Parts;
- Mod Bench;
- package tiers;
- Daily Spotlight;
- leaderboard;
- room evolution;
- additional gadget families;
- rewarded ads.

---

# 2. Core loop audit — PASS WITH ONE DOCUMENTATION FIX

The accepted reveal depends on the pouch remaining the physical source of the collectible for ~0.3–0.4 s.

Therefore keeping reveal choreography inside `OpeningScene` is correct. A separate `RevealScene` would create unnecessary state/transition complexity and risks visual discontinuity.

One missing detail was identified: the documents did not explicitly define how a settled reward leaves the screen.

Implementation rule added to the roadmap:

- keep result readable for at least ~0.6 s;
- then enable tap/click to advance;
- do not auto-dismiss on a timer;
- Collection remains a distinct navigation target;
- next pouch resets in ~150–250 ms.

This preserves reward readability without slowing repeated opening unnecessarily.

---

# 3. Package asset audit — FIX REQUIRED, LOW COST

The approved package reference is currently a single visual reference file.

A single flat sprite is insufficient for the locked interaction because:

- the star tear-tab must move independently;
- the top strip must visibly detach;
- Hidden Pocket must reuse the pouch cleanly.

Required production decomposition:

```text
pouch-body.webp
pouch-tear-strip.webp
pouch-star-tab.webp
```

This is not new game scope; it is the minimum asset structure required to implement the already-approved animation honestly.

See `ASSET_MANIFEST.md`.

---

# 4. Drop/balance audit — PASS

Locked normal table:

```text
Common      60%
Rare        28%
Epic        10%
Legendary    2%
```

Camera / Flip Phone remains 50 / 50.

Fresh Monte Carlo sanity pass using the locked first-three protection, Signal and 3% Hidden Pocket rules produced approximate medians:

```text
first ordinary duplicate      opening ~4
first SIGNAL LOCK             opening ~9
first Hidden Pocket           opening ~26
both Secrets                  opening ~59
standard 8/8                  opening ~80
8/8 + Secrets 2/2             opening ~100
```

Approximate 90th percentile:

```text
standard 8/8                  ~183 opens
both Secrets                  ~130 opens
8/8 + Secrets 2/2             ~195 opens
```

Interpretation:

- duplicate/Signal teaching happens early;
- Hidden Pocket is rare but not invisible;
- Signal does not trivially hand out Legendary;
- the collection has a meaningful long tail despite only ten final collectible assets.

No balance contradiction requiring a redesign was found.

---

# 5. Yandex 10-minute content rule — REVIEWED, NOT A BLOCKER

Current Yandex Games requirement 2.9 says the game needs sufficient content duration. Crucially, the official moderation guidance explicitly says that **little primary content can still pass when replayability/variability gives a real reason to keep playing**.

The probe has replayability through:

- random family/rarity outcomes;
- duplicate/Signal progression;
- late Legendary chase;
- Hidden Pocket;
- two Secret chase outcomes;
- persistent Collection completion.

Therefore the correct response is **not** to add ten more gadget families merely to inflate raw duration.

Moderation risk still exists if the build visually feels like an unfinished demo. Mitigation:

- no `beta/probe/coming soon` language in public UI;
- no empty future-system buttons;
- polished reveal and Collection;
- clear persistent progress;
- endless repeat loop remains functional after 8/8;
- store description presents the game as a complete collectible opener, not a preview.

If moderation specifically rejects content duration, react to that evidence. Do not pre-emptively expand scope.

Official reference checked:

- https://yandex.com/dev/games/doc/en/requirements/2/9

---

# 6. Yandex save requirement — PASS, IMPLEMENTATION IMPROVEMENT

Official requirement 1.9 allows browser storage for simple games without in-app purchases and requires progress to survive refresh.

Current local-first direction is valid.

However, Yandex exposes `ysdk.getStorage()` to provide safe browser-like storage. The implementation should inject that returned storage into a `StorageAdapter` in platform runtime and use normal `localStorage` only as local-development fallback.

Benefits:

- keeps the no-login/no-cloud decision;
- remains compliant with immediate local saving;
- avoids coupling save logic directly to browser globals;
- is safer in Yandex hosting contexts.

Official references checked:

- https://yandex.com/dev/games/doc/en/requirements/1/9
- https://yandex.com/dev/games/doc/en/sdk/sdk-player

---

# 7. Yandex SDK/lifecycle audit — PASS

Current architecture matches official requirements:

- SDK integration is required;
- `LoadingAPI.ready()` must fire only when game resources are loaded and player interaction can actually begin;
- `GameplayAPI.start()/stop()` are optional, but if used they must correspond to actual active/paused gameplay;
- `game_api_pause/resume` handling must pause/resume the game consistently;
- sound must stop on minimize/tab change.

Recommended mapping:

```text
Opening playable      -> GameplayAPI.start()
Collection/menu       -> GameplayAPI.stop()
return to Opening     -> GameplayAPI.start()
platform/tab pause    -> pause game/audio
platform/tab resume   -> resume only if game state is actually playable
```

Official references checked:

- https://yandex.com/dev/games/doc/en/sdk/sdk-game-events
- https://yandex.com/dev/games/doc/en/sdk/sdk-events
- https://yandex.com/dev/games/doc/en/requirements/1/19
- https://yandex.com/dev/games/doc/en/requirements/1/3

---

# 8. Responsive audit — PASS WITH EXTRA QA CASES

The adaptive layout decision remains stronger than a fixed 1280×720 FIT board.

Official Yandex moderation explicitly checks:

- correct display while resizing;
- no critical cropping;
- no overlaps;
- no system scrolling;
- no swipe-to-refresh.

Additional QA details that must be added to final moderation testing:

- browser zoom 80–125%;
- right-click context menu disabled in game area;
- long-press does not invoke browser UI that blocks interaction;
- mobile swipe-to-refresh is disabled;
- orientation change preserves save/progress.

Official references checked:

- https://yandex.com/dev/games/doc/en/requirements/1/10
- https://yandex.com/dev/games/doc/en/console/add-new-game

---

# 9. Localization audit — PASS

RU + EN is still the correct minimum target.

Official Yandex guidance:

- automatic language detection via `ysdk.environment.i18n.lang` is mandatory;
- English and Russian are recommended;
- moderation checks every language declared in the draft.

Current decision is valid:

```text
ru -> RU strings
en -> EN strings
anything else -> EN fallback
```

No manual language selector is needed in the first probe.

Official references checked:

- https://yandex.com/dev/games/doc/en/sdk/sdk-environment
- https://yandex.com/dev/games/doc/en/requirements/2/14
- https://yandex.com/dev/games/doc/en/console/add-new-game/draft

---

# 10. Store-media audit — PASS WITH LOCALIZATION CORRECTION

Current official requirements re-checked:

```text
Icon       512x512 PNG
Cover      800x470 PNG
Hero       1560x520 PNG/JPG (optional)
Landscape screenshots 16:9
Screenshot long side 1280–2560 px
At least 2 screenshots per selected platform
```

Official draft also contains an optional maskable icon.

Important correction:

- the game declares RU + EN;
- screenshots contain localized in-game UI;
- promotional words/images must match the selected localization.

Therefore asset planning should prepare separate RU and EN screenshot captures.

Planned minimum:

```text
RU: 2 desktop + 2 mobile landscape
EN: 2 desktop + 2 mobile landscape
= 8 screenshots
```

To minimize duplicated creative work, do **not** bake localized title text into icon/cover/hero. Use object-only promo compositions that can be reused across RU and EN.

Official reference checked:

- https://yandex.com/dev/games/doc/en/console/add-new-game/draft
- https://yandex.com/dev/games/doc/en/console/add-new-game

---

# 11. No-ads probe audit — PASS WITH CONSOLE NOTE

Yandex requirement 1.12 says YAN monetization is enabled by default. If a game intentionally does not monetize, the developer should explicitly state this in the Draft `Developer's comment` field.

Therefore the first probe may remain ad-free, but submission checklist must include the comment.

Suggested moderation note:

> First release intentionally contains no ads or in-app purchases. Monetization is not provided in this version. The core experience is a free replayable collectible opener; progress is saved immediately after reward transactions.

This avoids reintroducing ads merely to satisfy a mistaken platform assumption.

Official references checked:

- https://yandex.com/dev/games/doc/en/requirements/1/12
- https://yandex.com/dev/games/doc/en/console/add-new-game/draft

---

# 12. iOS platform dependency — OPERATIONAL RISK, NOT CODE BLOCKER

Current Yandex draft documentation says that selecting iOS requires an Apple Team ID.

This is external/account scope, not game architecture.

Decision rule:

- if a valid Apple Team ID is readily available, submit Desktop + Android + iOS;
- if not, do **not** delay the behavioral probe: submit Desktop + Android first and add iOS later.

No alternate game UI is needed.

Official reference checked:

- https://yandex.com/dev/games/doc/en/console/add-new-game/draft

---

# 13. Phaser audit — PASS

Phaser 4 is no longer a release-candidate choice. Official Phaser release history shows current stable **4.2.1** (2026-07-09).

The project uses only conventional 2D capabilities:

- images/sprites;
- tweens;
- particles;
- pointer input;
- scenes;
- audio;
- resize handling.

That is a low-risk use of Phaser 4.

Recommendation:

> pin `phaser@4.2.1` for the probe instead of floating on `4.x`, then upgrade only deliberately.

Official reference checked:

- https://phaser.io/download/phaser4

---

# 14. Analytics audit — PASS

Current Yandex documentation supports the chosen split:

- built-in Developer Console metrics automatically;
- Yandex Metrica for custom gameplay goals/funnels.

The current event set is small and appropriate.

`reveal_complete` is correctly defined as one completed opening transaction, including the Secret second beat if Hidden Pocket fires.

No custom analytics backend is justified.

Official references checked:

- https://yandex.com/dev/games/doc/en/concepts/analytics
- https://yandex.com/dev/games/doc/en/concepts/yandex-metrica

---

# 15. Production-burden audit — PASS

Final first-probe bespoke runtime art commitment after package decomposition:

```text
10 collectible images
3 package layers
1 Opening background
2 Collection environment layers
= 16 bespoke runtime image files
```

Plus:

```text
12 short SFX
1 icon
1 cover
8 localized screenshots
```

Optional:

- maskable icon;
- hero image;
- promotional video.

This remains compatible with the low-production-burden thesis.

The largest production risk remains **visual consistency of Camera/Flip Phone rarity sets**, not engineering complexity.

---

# 16. Final risk register

## R1 — Art consistency

Severity: **HIGH**

Mitigation:

- 6–10 base explorations per family;
- one canonical master;
- derived rarity edits only;
- inspect at shelf/mobile size;
- reject photoreal/CGI drift immediately.

## R2 — Tiny content pool feels unfinished

Severity: **MEDIUM**

Mitigation:

- high polish;
- visible replayability/Signal/chase;
- intentional two-hero Collection environment;
- no placeholders/future feature shells;
- do not call public build a probe/beta.

Do not pre-emptively add content.

## R3 — Repeated reveal becomes friction

Severity: **MEDIUM, post-data**

Mitigation:

- keep timings configurable;
- Quick Reveal remains mandatory post-data review;
- no skip in first build so initial measurement is clean.

## R4 — Mobile rendering/input edge cases

Severity: **MEDIUM**

Mitigation:

- real mobile landscape QA;
- generous star-tab hit area;
- no scroll/refresh/browser context gestures;
- asset-memory budget;
- adaptive layout rather than fixed scale.

## R5 — iOS Team ID unavailable

Severity: **LOW/MEDIUM operational**

Mitigation:

- Desktop + Android first; iOS later.

## R6 — Title collision in Yandex catalog

Severity: **LOW**

A normal web search did not reveal an obvious collision for the current RU/EN candidates, but official uniqueness must be checked in the Developer Console immediately before final creatives/submission.

---

# 17. Final verdict

**GO TO IMPLEMENTATION.**

No independent review finding justifies increasing gameplay/content scope before the first behavioral release.

The important corrections are operational:

1. split the pouch into runtime animation layers;
2. make result-dismiss/next-open behavior explicit;
3. use Yandex-safe injected storage instead of hard-coupling save logic to browser globals;
4. pin Phaser 4.2.1;
5. test context menu/long-press/scroll/zoom edge cases;
6. prepare localized screenshot sets;
7. state intentional no-monetization in the Yandex developer comment;
8. treat iOS Team ID as a release-platform dependency, not a reason to block the build.

Roadmap: `IMPLEMENTATION_ROADMAP.md`.

Asset inventory: `ASSET_MANIFEST.md`.
