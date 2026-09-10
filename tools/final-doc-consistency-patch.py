from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:140]!r}')
    file.write_text(text.replace(old, new, 1))


replace_once(
    'docs/YANDEX_SUBMISSION_CHECKLIST.md',
    'This checklist is for the **expanded public release**, not the current two-family development build.',
    'This checklist is for the current **expanded six-Drop public-release candidate**.',
)
replace_once(
    'docs/YANDEX_SUBMISSION_CHECKLIST.md',
    'Do not blindly preload every 1024 texture merely because the current small catalog can.',
    'Do not blindly preload every 1024 texture; keep active-Drop/on-demand loading unless hosted profiling demonstrates a better strategy.',
)
replace_once(
    'docs/YANDEX_SUBMISSION_CHECKLIST.md',
    'Produce these from the **expanded release key visual/content**, not automatically from the current two-family catalog unless Camera/Flip Phone still happen to be the strongest marketing heroes.',
    'Produce these from the **actual expanded six-Drop release build/key visual**. Camera/Flip Phone may still appear only if they are genuinely the strongest marketing heroes.',
)

replace_once(
    'docs/PRODUCT.md',
    'The project is deliberately **not** a full idle/incremental economy. Final direct hands-on exposed a bounded remaining finding set; current work is Phase 2.6: those fixes plus the explicitly approved Signal Overcharge extension, then exact/direct regression before Yandex DRAFT.',
    'The project is deliberately **not** a full idle/incremental economy. Phase 2.6 Signal Overcharge, the bounded feel corrections, final repeated-use regression, six-Drop content expansion and content-scale economy audit are complete. The next evidence gate is the real hosted Yandex DRAFT.',
)
replace_once(
    'docs/PRODUCT.md',
    'Canonical contract: `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`. The rarity/reward/Charged-denial fixes, Signal/Secret clarity work and deterministic recoverable Overcharge extension are implemented and exact-audited. Current validation tuning is Basic `+0.10`, Charged `+0.50`, cap `x1.50`. One final direct repeated-use regression remains before Yandex DRAFT. The future expensive pouch remains a hypothesis only.',
    'Canonical contract: `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`. The rarity/reward/Charged-denial fixes, Signal/Secret clarity work and deterministic recoverable Overcharge extension are implemented and exact-audited. Final direct repeated-use regression is accepted. Current tuning is Basic `+0.10`, Charged `+0.50`, cap `x1.50`; the later six-Drop economy audit also accepted these values unchanged. The future expensive pouch remains a hypothesis only.',
)
replace_once(
    'docs/PRODUCT.md',
    '## 6. Current provisional tuning — UNCHANGED THROUGH CORRECTION',
    '## 6. Current release-candidate tuning — ECONOMY-AUDITED',
)
replace_once(
    'docs/PRODUCT.md',
    'Cache remains independent; Mega pays `120–180 CHIPS` at current provisional tuning.',
    'Cache remains independent; Mega pays `120–180 CHIPS` at current release-candidate tuning.',
)
replace_once(
    'docs/PRODUCT.md',
    'No legacy balance tuning was mixed into Phase 2.6. Existing pouch costs/base/cache/rarity/recycle values remain unchanged. The current candidate locks only the new Overcharge parameters at Basic `+0.10`, Charged `+0.50`, cap `x1.50`; later content-scale evidence may reopen them.',
    'No legacy balance tuning was mixed into Phase 2.6. Existing pouch costs/base/cache/rarity/recycle values remain unchanged. The six-Drop content-scale audit accepted the complete current balance, including Overcharge at Basic `+0.10`, Charged `+0.50`, cap `x1.50`. Reopen balance only from hosted/player evidence or a material mechanic/content change.',
)
replace_once(
    'docs/PRODUCT.md',
    'After Phase 2.6 + hosted DRAFT evidence, consider one on-demand Drop info drawer sourced from typed balance/content config. Avoid a permanent giant sidebar or permanently visible probability table.\n\nPlayer-facing Drop selector waits for Drop #2.',
    'After hosted DRAFT evidence, consider one on-demand Drop info drawer sourced from typed balance/content config. Avoid a permanent giant sidebar or permanently visible probability table.\n\nPlayer-facing six-Drop navigation already exists; richer odds/content-detail surfaces remain deferred until hosted/player evidence justifies them.',
)
replace_once(
    'docs/PRODUCT.md',
    'Explicitly excluded from the current correction:\n\n- balance changes;\n- new family/Drop content;\n- Drop selector;\n- permanent odds/collection sidebar;',
    'Still excluded from the current pre-DRAFT scope:\n\n- speculative balance changes without new evidence;\n- more family/Drop content beyond the current six-Drop candidate;\n- permanent odds/collection sidebar;',
)
