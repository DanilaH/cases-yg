from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    file.write_text(text.replace(old, new, 1))


replace_once(
    'README.md',
    """## Current phase

**Gameplay Loop Lite V2, Phase 2.6 Signal Overcharge, Phase 2.7 Secret reward correction, and the final merged-main repeated-use regression are accepted. Real hosted Yandex DRAFT validation is the next gate.**

Current private content:

- Digital Camera;
- Flip Phone;
- Common / Rare / Epic / Legendary for each;
- 2 Secrets.

This two-family build is a development base, not the public release.
""",
    """## Current phase

**Expanded six-Drop release candidate is implemented and content-scale economy-audited. Local Yandex DRAFT preconditions are accepted; real hosted Yandex DRAFT validation is the next gate.**

Current production content:

- 6 themed Drops;
- 12 gadget families;
- 48 Common / Rare / Epic / Legendary standard collectibles;
- 12 Secrets;
- 60 authored collectible assets total.

The original Camera + Flip Phone two-family slice is historical validation context, not the current runtime catalog.
""",
)

replace_once(
    'README.md',
    """These are provisional development values, not final public-release tuning.
""",
    """These values passed the six-Drop content-scale audit and remain the current release-candidate tuning. Reopen them only from hosted/player evidence or a material economy/content change.
""",
)

replace_once(
    'README.md',
    """- current automated suite: **131 tests** after the pre-DRAFT platform lifecycle regression was added, plus typecheck/assets/build gates;
- Yandex production archive shape verified from the exact accepted tree.

Current order:

1. run real hosted Yandex DRAFT validation;
2. fix only hosted-platform defects that the draft actually exposes;
3. decide deferred Drop/odds/progress work from evidence;
4. content expansion only after hosted validation.

Do not add unrelated meta systems/content before the hosted gate.
""",
    """- six-Drop content expansion: 12 families / 60 authored collectibles with on-demand Drop loading;
- full-game economy audit: current balance accepted unchanged across 3,000-seed strategy simulation + focused Overcharge stress;
- current automated suite: **172 tests**, plus typecheck/assets/build gates;
- Yandex candidate archive audited at ~11.72 MB uncompressed / ~10.52 MB ZIP with `index.html` at archive root;
- local Yandex DRAFT readiness review found and corrected early `GameplayAPI.start()` timing.

Current order:

1. upload the exact expanded candidate to real hosted Yandex DRAFT;
2. run SDK/Game Ready/gameplay-marker, pause/audio, storage/recovery, six-Drop loading, ads-debug and RU/EN checks;
3. fix only hosted-platform defects that the draft actually exposes;
4. finalize public monetization placements, Metrica/CSP choice, store metadata and release media;
5. run the final moderation self-check and submit.

Do not add unrelated meta systems/content before hosted evidence.
""",
)

replace_once(
    'README.md',
    """- integrated Camera/Flip Phone art;
""",
    """- 60 authored collectible assets across six Drops with active-Drop lazy loading;
""",
)

replace_once(
    'README.md',
    """- [`docs/YANDEX_SLICE_VALIDATION.md`](docs/YANDEX_SLICE_VALIDATION.md) — hosted checks local CI cannot replace.
""",
    """- [`docs/FULL_GAME_ECONOMY_AUDIT_2026-09-10.md`](docs/FULL_GAME_ECONOMY_AUDIT_2026-09-10.md) — six-Drop economy evidence and keep-balance decision;
- [`docs/YANDEX_DRAFT_READINESS_2026-09-10.md`](docs/YANDEX_DRAFT_READINESS_2026-09-10.md) — current expanded-candidate local readiness + exact hosted run order;
- [`docs/YANDEX_SLICE_VALIDATION.md`](docs/YANDEX_SLICE_VALIDATION.md) — detailed hosted checks local CI cannot replace.
""",
)

replace_once(
    'docs/GAMEPLAY_SYSTEMS.md',
    """# 7. Drops / loot pools — CURRENT RUNTIME

Current content resolves through one active loot pool; selector is hidden because there is one production Drop.

Rules remain:

- every family/collectible belongs to a pool;
- Basic/Charged resolve only inside active pool;
- Signal searches that pool + selected-pouch eligibility;
- CHIPS/Signal are global;
- Drop #2 should primarily be data/config work;
- family-targeted pouches remain parked.
""",
    """# 7. Drops / loot pools — CURRENT RUNTIME

Current production content is **6 themed Drops / 12 families / 60 collectibles**. Each Drop contains two families, eight standards and two Secrets.

Current navigation/loading contract:

- Collection exposes all six Drops through its pager;
- browsing a non-active Drop lazy-loads that Drop's authored collectible art before rendering it;
- Collection browsing itself is non-durable;
- returning to Opening passes the browsed Drop, and `OpeningSession` owns the durable active-Drop switch;
- a staged `pendingReveal` keeps its persisted Drop and cannot be silently retargeted by navigation;
- Boot preloads only the default Drop plus required static assets; alternate Drops are loaded on demand;
- Basic/Charged standard and Hidden Pocket resolution stay inside the active Drop;
- Signal guarantee eligibility is active-Drop + selected-pouch scoped;
- CHIPS, Signal and Overcharge remain global across Drops;
- family-targeted pouches remain parked.

Content-scale economy behavior is audited in `FULL_GAME_ECONOMY_AUDIT_2026-09-10.md`.
""",
)

replace_once(
    'docs/PRODUCT.md',
    """### Stage C — real Yandex DRAFT validation — NEXT AFTER STAGE B3 ACCEPTANCE

Validate hosted SDK boot/loading, lifecycle/audio, safe storage, interrupted Basic/Charged recovery, ads, rewarded exactly-once CHIPS probe and analytics/Metrica where configured.

CI/local browser automation cannot replace this gate.

### Stage D — content/release build — BLOCKED ON STAGE C

Only after corrected feel and hosted platform behavior are proven:

- materially expand gadget families;
- group content into themed Drops;
- expose Drop selection only when Drop #2 exists;
- scale Collection from real density;
- re-simulate/tune economy at content scale;
- finalize monetization/store creative.

### Stage E — public Yandex release

Final moderation/store/release hardening happens on the expanded content build.
""",
    """### Stage C — expanded content + economy scale — COMPLETE / AUDITED

The runtime now contains six themed Drops / twelve families / sixty authored collectibles with Drop-aware Collection navigation and on-demand art loading. The full-game economy audit accepted the existing balance unchanged after multi-strategy simulation and focused cross-Drop Signal/Overcharge stress.

### Stage D — real Yandex DRAFT validation — NEXT

Upload the exact expanded candidate and validate hosted SDK boot/Game Ready/gameplay markup, lifecycle/audio, safe storage, interrupted Basic/Charged recovery, six-Drop loading/navigation, ads debug probes and analytics/Metrica where configured.

CI/local browser automation cannot replace this gate.

### Stage E — public-release hardening

After hosted platform behavior is proven:

- fix only demonstrated hosted defects;
- finalize rewarded/interstitial/sticky monetization decisions;
- finalize Metrica/CSP choice;
- finalize store metadata and six-Drop release creative;
- run declared-device/browser/moderation self-check;
- submit the expanded candidate for public moderation.
""",
)

replace_once(
    'docs/PRODUCT.md',
    """Camera and Flip Phone remain the private validation catalog. Future content belongs to themed Drops rather than a global mega-pool.

Shelf = attractive best finds. Library = exhaustive ownership/completion view. Scale only from real roster density.
""",
    """Camera and Flip Phone remain the historical validation catalog. Current production content is organized as six themed Drops with two families per Drop rather than a global mega-pool.

Shelf = attractive best finds. Library = exhaustive ownership/completion view. Both now operate against the real six-Drop roster and active Drop context.
""",
)

replace_once(
    'docs/YANDEX_SUBMISSION_CHECKLIST.md',
    """Platform requirements were checked against Yandex Games documentation on 2026-09-02. Re-check immediately before submission.

The project has a separate earlier hosted gate in `YANDEX_SLICE_VALIDATION.md`: **Lite V2 hands-on → real Yandex DRAFT validation → content expansion → final public-release hardening**.
""",
    """Platform requirements were re-checked against current Yandex Games documentation on **2026-09-10**. Re-check again immediately before public moderation if requirements change.

The current expanded candidate uses `YANDEX_DRAFT_READINESS_2026-09-10.md` as the authoritative pre-upload handoff. `YANDEX_SLICE_VALIDATION.md` retains the detailed hosted scenario matrix; historical assumptions that content expansion happens after the first hosted gate are superseded.
""",
)

replace_once(
    'docs/YANDEX_SUBMISSION_CHECKLIST.md',
    """These paths should already have been exercised in the real hosted Lite V2 DRAFT before content expansion. If the final release build materially changes startup/loading/platform behavior, repeat the relevant hosted checks.
""",
    """These paths must be exercised in the real hosted DRAFT using the current expanded candidate. The six-Drop/content-loading build has not yet earned hosted-platform acceptance from local CI alone.
""",
)

replace_once(
    'docs/YANDEX_SUBMISSION_CHECKLIST.md',
    """The public release will contain substantially more than the current 10 collectible assets.

Content should be organized into themed Drops/loot pools rather than one global mega-pool.
""",
    """The current expanded candidate contains **60 authored collectible assets** organized into six themed Drops / loot pools rather than one global mega-pool.
""",
)
