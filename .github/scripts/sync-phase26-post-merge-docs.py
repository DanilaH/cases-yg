from pathlib import Path


def replace_one(path, old, new, label):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 occurrence, found {count}')
    p.write_text(text.replace(old, new), encoding='utf-8')

replace_one(
    'README.md',
    '- latest audited product tree verified identical to merged `main`;\n- post-merge CI #248 — PASS.',
    '- Phase 2.6 comprehensive exact browser/state audit — **43/43 PASS**;\n- focused post-fix cash-out audit on exact product head `40db07a3c8069ef8ca01c5c35de0c355337d410e` — **15/15 PASS**, with reviewed RU 900 + EN 1280 result/discharge frames;\n- Phase 2.6 squash-merged through PR #48 as `main` `f070cbeb0adf8329d8a514d78a1cad0bb1f8d020`;\n- post-merge CI #274 — **PASS**.',
    'README evidence',
)

replace_one(
    'docs/PROBE_VALIDATION.md',
    '- latest audited product head: `afeb2ac50cba02cec68dcabd60a18e16ced97094`;\n- latest audited product tree: `8a8375b27c2f4001ab4160922d447d7b56d5f36f`;\n- R3 normal-flow audit artifact digest: `sha256:86f19d7a564b10d5fdf6228b096084b6b8f7c82a823553647c0b4da0dec3bd83`;\n- squash-merged `main`: `2837872d6ff9ffb3f6e492725fb034bfc82f5f4a`, identical audited tree;\n- post-merge main CI #248: **PASS**;',
    '- latest exact-audited Phase 2.6 runtime product head: `40db07a3c8069ef8ca01c5c35de0c355337d410e`;\n- comprehensive Phase 2.6 exact browser/state audit: **43/43 PASS** with zero runtime/request/HTTP failures;\n- focused post-fix cash-out audit: **15/15 PASS** in RU 900 + EN 1280; artifact digest `sha256:0d55df870f9b4c90c1d8c566c8c6cb7a4af4b6e6486ab991077670271de6a1cd`;\n- squash-merged `main`: `f070cbeb0adf8329d8a514d78a1cad0bb1f8d020` via PR #48; subsequent differences from the exact audit head are canonical-doc synchronization/merge history, not runtime behavior;\n- post-merge main CI #274: **PASS**;',
    'probe evidence',
)

replace_one(
    'docs/INFRASTRUCTURE_STATUS.md',
    'This file states what is **actually present in current `main`** after the merged evidence-backed Opening Feel Correction.',
    'This file states what is **actually present in current `main`** after the merged Opening Feel Correction and Phase 2.6 Signal Overcharge pass (PR #48).',
    'infra header',
)

replace_one(
    'docs/TECHNICAL_DIRECTION.md',
    'Gameplay Loop Lite V2, the bounded **Opening Feel Correction**, and Phase 2.6 Signal Overcharge are implemented on the current merge candidate. The Phase 2.6 candidate has passed exact technical/browser validation; the immediate gate is one final direct repeated-use regression, then real Yandex DRAFT if accepted — not broad architecture work.',
    'Gameplay Loop Lite V2, the bounded **Opening Feel Correction**, and Phase 2.6 Signal Overcharge are implemented in current `main` after PR #48. The Phase 2.6 runtime passed exact technical/browser validation and post-merge CI #274; the immediate gate is one final direct repeated-use regression, then real Yandex DRAFT if accepted — not broad architecture work.',
    'technical header',
)

print('Post-merge Phase 2.6 evidence docs synchronized')
