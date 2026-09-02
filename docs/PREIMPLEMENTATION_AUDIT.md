# Pre-implementation audit — amended 2026-09-02

This audit supersedes the earlier assumption that Camera + Flip Phone would be the first **public** behavioral release.

New product staging is explicit:

> **Camera + Flip Phone = private internal vertical slice → direct user review → substantial content expansion → public Yandex release.**

The slice is not submitted to moderation and is not expected to prove market KPIs.

---

# 1. Revised verdict

> **GO TO IMPLEMENTATION.**

The correction makes the plan stronger:

- a tiny slice is still the right way to validate feel/architecture cheaply;
- it no longer has to pretend that ten collectible assets are enough public content;
- SDK/ads are now integrated before the codebase grows;
- content and Collection systems must be data-driven from the start;
- release balance is deferred until the release roster exists.

---

# 2. What the internal slice must prove

The slice exists to validate:

- tear interaction;
- reveal choreography;
- rarity art grammar;
- duplicate/Signal feedback;
- Hidden Pocket presentation;
- Shelf/Library concept;
- responsive desktop/mobile layout;
- transactional save/recovery;
- art-production throughput/consistency;
- Yandex SDK lifecycle;
- analytics adapter;
- **interstitial/rewarded/sticky ad boundaries and pause/resume correctness**.

It does not need:

- store icon/cover/screenshots;
- moderation polish for a public catalog listing;
- 500-user traffic;
- final launch content count;
- final monetization reward/cadence.

---

# 3. Ads-first correction — PASS

Because the public product is intended to monetize with Yandex ads, integrating the SDK and ads only after content production would create avoidable architectural/recovery risk.

Correct approach now:

- `platform/yandex.ts` from PR-1;
- `platform/ads.ts` from PR-1;
- exercise interstitial/rewarded/sticky boundaries in Yandex draft/debug mode during the slice;
- full-screen/rewarded ads cooperate with game pause/audio;
- rewarded reward is exactly-once;
- close/error/no-ad path leaves game state intact;
- internal dev reward is test plumbing only.

Final public questions — reward value, placements, sticky-banner use — remain deferred because they depend on the larger release loop/economy.

---

# 4. Scale architecture correction — REQUIRED

The biggest new risk is not the slice itself; it is accidentally implementing the slice as a two-family special case and then paying for a rewrite.

Required from day one:

- generic gadget-family registry;
- rarity/Secret data in config;
- generic Collection rendering primitives;
- generic asset path/content metadata;
- balance config separate from systems;
- tests proving a mock third family can be added without branching core logic.

The slice may **look** like two hero slots, but the domain model must not be two slots.

---

# 5. Balance audit — PASS FOR SLICE ONLY

The previous Monte Carlo check remains useful for the internal configuration:

```text
first duplicate          ~4
first SIGNAL LOCK        ~9
first Hidden Pocket      ~26
both slice Secrets       ~59–60
slice standard 8/8       ~80
all slice chase          ~100
```

This proves the two-family configuration is not obviously broken for repeated testing.

It no longer makes any claim about public release pacing.

When the launch roster is selected, rebuild the simulation around:

- number of families;
- family/package weighting;
- number of Secrets;
- duplicate pressure;
- Signal rules;
- Hidden Pocket reward pool;
- any returned meta system.

---

# 6. Public content-size conclusion — OPEN, NOT A BLOCKER

The old concern “will two families look unfinished to moderation?” is now irrelevant because two families will never be submitted.

The release should be materially larger. Candidate pool already supports expansion across different silhouettes and nostalgia hooks.

Exact launch number should **not** be guessed before the slice tells us how expensive one quality family really is.

Decision method after slice:

1. measure actual time/iteration count for Camera and Flip Phone;
2. estimate family throughput;
3. shortlist highest-hook families;
4. choose a launch roster large enough to feel complete while preserving art consistency;
5. expand further if AI-assisted production stays cheap.

The old ~24-family scale is a valid reference point again, not a commitment/cap.

---

# 7. Package/reveal audit — PASS

Still correct:

- reveal remains inside `OpeningScene`;
- pouch remains physical source ~0.3–0.4 s;
- pouch must be split into body / tear strip / star tab;
- minimum result hold ~0.6 s;
- next pouch is player-advanced rather than timer-dismissed.

No correction needed.

---

# 8. Art pipeline audit — PASS AND NOW MORE IMPORTANT

Canonical-master workflow is the main scale mechanism:

```text
6–10 exploration candidates
→ one selected master
→ four controlled rarity variants
→ Secret where required
```

For public expansion, batch families and compare cross-family consistency regularly. Do not generate 20 families blindly and discover style drift at the end.

Largest production risk remains art consistency, not Phaser engineering.

---

# 9. Asset loading audit — NEW RELEASE RISK

The slice can preload ten 1024 textures cheaply.

A release with ~10–24+ families cannot automatically preload every full-resolution variant on mobile.

Before public release profile:

- encoded download size;
- decoded texture memory;
- Collection thumbnail needs;
- grouped/on-demand loading;
- 512/768 derivatives.

Do not solve this prematurely in the slice, but do keep asset loading abstract enough that release strategy can change.

---

# 10. Systems previously parked

Tech Parts / Mod Bench were correctly removed from a two-family slice, but **that does not prove they are wrong for a 10–24+ family release**.

Re-evaluate after roster/duplicate pressure is known.

Same logic applies to:

- package tiers;
- Daily Spotlight;
- shelf/environment progression.

Still avoid feature-heavy market/trading/betting/minigame/3D scope unless the entire product thesis changes.

---

# 11. Public moderation/store work

Defer final store assets and moderation-specific polish until after content expansion.

Yandex requirements still matter during engineering because SDK/lifecycle/ads/storage/responsive behavior should not be retrofitted later. But there is no reason to create final screenshots/icon/cover for the internal slice.

`YANDEX_SUBMISSION_CHECKLIST.md` now describes the eventual expanded public release.

---

# 12. Risk register

## R1 — art consistency at scale

**HIGH.** Mitigate with canonical masters, family batches, contact sheets and small-size review.

## R2 — hard-coded two-family architecture

**HIGH.** Mitigate immediately with registry/config-driven Collection and drop systems.

## R3 — final roster size not yet known

**MEDIUM, healthy uncertainty.** Decide from real family throughput after slice, not guesswork now.

## R4 — release balance changes substantially with roster size

**MEDIUM.** Treat every current percentage as slice config and rerun simulations later.

## R5 — ads disrupt state/audio

**MEDIUM.** Integrate/test from slice; isolate provider; exactly-once rewarded grants; honor pause/resume.

## R6 — repeated reveal friction

**MEDIUM.** Direct user review after 20–50+ opens; decide Quick Reveal before content mass-production.

## R7 — expanded asset memory on mobile

**MEDIUM later.** Profile before release and adopt grouped/loading derivatives as needed.

---

# 13. Final conclusion

No additional clarification is required to start Phase 1.

The genuinely unresolved release decisions are intentionally later:

1. exact public family count/collection grouping;
2. release-scale balance;
3. final ad reward/placement/cadence;
4. whether Tech Parts/Mod Bench or package tiers become useful with the expanded catalog.

Those decisions become better, not worse, after the user has the slice in hand.
