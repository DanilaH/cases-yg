import fs from 'node:fs/promises';

const replacements = {
  'README.md': [
    [
      '**Gameplay Loop Lite V2, the feel-correction passes, and Phase 2.6 Signal Overcharge are implemented and exact-audited. The remaining internal gate is one final direct hands-on regression; real Yandex DRAFT follows only if that subjective pass is accepted.**',
      '**Gameplay Loop Lite V2, the feel-correction passes, and Phase 2.6 Signal Overcharge are implemented, exact-audited, and accepted by the final direct repeated-use regression. Real Yandex DRAFT is now the next gate.**',
    ],
    [
      '- post-merge CI #274 — **PASS**.\n\nCurrent order:\n\n1. run the final direct repeated-use hands-on regression on the exact Phase 2.6 candidate;\n2. if accepted, run real hosted Yandex DRAFT validation;\n3. fix only hosted-platform defects that the draft actually exposes;\n4. decide deferred Drop/odds/progress work from evidence;\n5. content expansion only after hosted validation.',
      '- post-merge CI #274 — **PASS**;\n- final direct repeated-use regression exposed one stale Overcharge reward-tag tween lifecycle crash after fast-forward/result teardown;\n- bounded lifecycle fix merged through PR #50 as `main` `2d57c3430ede6e2cd328e47362632b992a03037c`;\n- exact fixed-tree lifecycle regression — **86/86 PASS**, including 10 retained-lock Overcharge stress openings and a fresh 24-opening normal loop with Charged/Signal/Collection round-trips; runtime/request/HTTP failures **0/0/0**; artifacts manually reviewed.\n\nCurrent order:\n\n1. run real hosted Yandex DRAFT validation;\n2. fix only hosted-platform defects that the draft actually exposes;\n3. decide deferred Drop/odds/progress work from evidence;\n4. content expansion only after hosted validation.',
    ],
  ],
  'docs/PROBE_VALIDATION.md': [
    [
      '- final direct repeated-use Phase 2.6 regression: **PENDING**;\n- real Yandex DRAFT: **BLOCKED only on that final direct acceptance**.',
      '- final direct repeated-use Phase 2.6 regression: **COMPLETE / ACCEPTED**;\n- post-fix exact lifecycle regression: **86/86 PASS** with 10 targeted retained-lock Overcharge openings + a fresh 24-opening normal loop, zero runtime/request/HTTP failures and manual artifact review;\n- real Yandex DRAFT: **UNBLOCKED / NEXT EXTERNAL GATE**.',
    ],
    [
      'The Lite baseline is proven. Current validation must preserve it while proving the bounded Phase 2.6 fixes and Signal Overcharge extension are understandable, deterministic/recoverable and pleasant in repetition.',
      'The Lite baseline and Phase 2.6 direct regression are proven. The final repeated-use pass found one presentation-lifecycle race in the Overcharge bonus counter; PR #50 added a bounded destroyed-tag guard without changing economy or transaction semantics, and the exact fixed tree then passed targeted stress plus the full repeated-use loop. Hosted Yandex behavior remains unproven until the DRAFT gate.',
    ],
  ],
  'docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md': [
    [
      'Status: **IMPLEMENTED / EXACT-AUDITED / FINAL DIRECT HANDS-ON PENDING**.',
      'Status: **IMPLEMENTED / EXACT-AUDITED / FINAL DIRECT REGRESSION ACCEPTED**.',
    ],
    [
      'This document is the canonical contract for the implemented Phase 2.6 correction and Signal Overcharge extension. The legacy Lite V2 pouch/cache/rarity/recycle values remain unchanged; the new Overcharge state/economy/presentation has passed exact technical/browser validation and now awaits final direct repeated-use hands-on before hosted Yandex DRAFT.',
      'This document is the canonical contract for the implemented Phase 2.6 correction and Signal Overcharge extension. The legacy Lite V2 pouch/cache/rarity/recycle values remain unchanged; the new Overcharge state/economy/presentation passed exact technical/browser validation and the final direct repeated-use regression. Hosted Yandex DRAFT is now the next gate.',
    ],
    [
      'Generated artifacts do not self-approve; manual review and direct hands-on remain required.',
      'Generated artifacts do not self-approve; manual review and direct hands-on remain required.\n\nFinal direct regression outcome (2026-09-08): **ACCEPTED** after one bounded lifecycle correction. The repeated-use pass exposed a stale Overcharge bonus-counter tween calling `setText()` after its reward tag had been destroyed during accelerated result teardown. PR #50 guarded those callbacks without changing economy/save semantics. The exact fixed tree then passed **86/86** browser assertions: 10 targeted retained-lock Overcharge stress openings through `x1.50/MAX`, plus a fresh 24-opening normal loop with 6 Charged openings, duplicates, Signal retain/consume behavior and Collection round-trips; runtime/request/HTTP failures were zero and screenshots/video were manually reviewed.',
    ],
  ],
  'docs/IMPLEMENTATION_ROADMAP.md': [
    [
      '7. **Final direct repeated-use regression — REQUIRED INTERNAL GATE**\n8. **Real Yandex DRAFT validation — NEXT EXTERNAL GATE IF DIRECT REGRESSION PASSES**',
      '7. **Final direct repeated-use regression — COMPLETE / ACCEPTED AFTER BOUNDED LIFECYCLE FIX**\n8. **Real Yandex DRAFT validation — CURRENT NEXT EXTERNAL GATE**',
    ],
    [
      'The latest direct play exposed concrete UI/input/clarity issues plus one legitimate dead-Signal edge after collection completion. The approved response is still bounded: fix those findings and add only the explicitly specified Signal Overcharge extension.',
      'The latest direct play exposed concrete UI/input/clarity issues plus one legitimate dead-Signal edge after collection completion. The approved response stayed bounded: those findings and Signal Overcharge were implemented, exact-audited and accepted. The final repeated-use regression then found one stale Overcharge reward-tag tween lifecycle crash; PR #50 fixed only that callback-after-teardown defect, and the exact fixed tree passed targeted stress plus a fresh 24-opening normal loop. Hosted Yandex DRAFT is now the current gate.',
    ],
  ],
  'docs/DECISIONS.md': [
    [
      '| Current stage | LOCKED | Phase 2.6 final-hands-on correction + Signal Overcharge is **implemented and exact-audited**. One final direct repeated-use regression remains; real Yandex DRAFT follows only if that subjective gate is accepted |',
      '| Current stage | LOCKED | Phase 2.6 final-hands-on correction + Signal Overcharge is **implemented, exact-audited and accepted by the final direct repeated-use regression** after the bounded PR #50 lifecycle fix. Real Yandex DRAFT is the current next gate |',
    ],
    [
      '| Final hands-on correction + Signal Overcharge | COMPLETE | implemented and exact-audited; current suite is 114 tests plus typecheck/assets/build; final direct repeated-use regression still pending |\n| Real Yandex DRAFT | OPEN | next external gate immediately after final direct repeated-use regression accepts the exact Phase 2.6 candidate |',
      '| Final hands-on correction + Signal Overcharge | COMPLETE | implemented and exact-audited; current suite is 114 tests plus typecheck/assets/build |\n| Final direct repeated-use regression | COMPLETE | accepted after PR #50 fixed the stale Overcharge reward-tag tween lifecycle race; exact fixed-tree regression passed 86/86 browser assertions with zero runtime/request/HTTP failures and manual artifact review |\n| Real Yandex DRAFT | OPEN | current next external gate; local/direct prerequisites are accepted, but actual Yandex SDK/storage/ad lifecycle remains unproven until hosted validation |',
    ],
  ],
  'docs/TECHNICAL_DIRECTION.md': [
    [
      'Gameplay Loop Lite V2, the bounded **Opening Feel Correction**, and Phase 2.6 Signal Overcharge are implemented in current `main` after PR #48. The Phase 2.6 runtime passed exact technical/browser validation and post-merge CI #274; the immediate gate is one final direct repeated-use regression, then real Yandex DRAFT if accepted — not broad architecture work.',
      'Gameplay Loop Lite V2, the bounded **Opening Feel Correction**, and Phase 2.6 Signal Overcharge are implemented in current `main`. The Phase 2.6 runtime passed exact technical/browser validation; the final direct repeated-use regression found one stale Overcharge reward-tag tween lifecycle race, fixed narrowly in PR #50 and accepted by an exact fixed-tree targeted + 24-opening regression. Real Yandex DRAFT is now the immediate gate — not broad architecture work.',
    ],
    [
      'Current save is versioned (`SAVE_VERSION = 2`) behind `StorageAdapter`.',
      'Current save is versioned (`SAVE_VERSION = 3`) behind `StorageAdapter`.',
    ],
    [
      'Current suite baseline is 108 tests plus typecheck/assets/build. Focused coverage and the r3 exact-revision audit cover:',
      'Current suite baseline is 114 tests plus typecheck/assets/build. Focused coverage and the exact-revision audits cover:',
    ],
    [
      'The r3 browser/video regression covered the matrix in `PROBE_VALIDATION.md`, including grab/tear motion, staged CHIPS, bank/count-up, selector states, Charged differentiation, neon/digital treatment, fast-forward and compact RU layouts; manual artifact review passed.',
      'The browser/video regressions cover the matrix in `PROBE_VALIDATION.md`, including grab/tear motion, staged CHIPS, bank/count-up, selector states, Charged differentiation, neon/digital treatment, fast-forward and compact RU layouts. The final direct repeated-use gate additionally reproduced and fixed the Overcharge reward-tag teardown race, then passed **86/86** assertions on the exact fixed tree with manual artifact review.',
    ],
    [
      'Real hosted Yandex DRAFT remains required **after Phase 2.6 implementation + exact audit + direct regression approval**.\n\nHosted gate still covers SDK boot/loading, storage, lifecycle/audio, ad behavior, interrupted Basic/Charged recovery and Metrica.',
      'Real hosted Yandex DRAFT is now the **current next gate** after Phase 2.6 implementation + exact audit + direct regression approval.\n\nHosted gate still covers SDK boot/loading, storage, lifecycle/audio, ad behavior, interrupted Basic/Charged recovery and Metrica.',
    ],
  ],
  'docs/INFRASTRUCTURE_STATUS.md': [
    [
      'This file states what is **actually present in current `main`** after the merged Opening Feel Correction and Phase 2.6 Signal Overcharge pass (PR #48).',
      'This file states what is **actually present in current `main`** after the merged Opening Feel Correction, Phase 2.6 Signal Overcharge pass, and the bounded final repeated-use lifecycle correction (PR #50).',
    ],
    [
      '1. Phase 2.6 implementation + exact browser/video validation — complete;\n2. run one final direct repeated-use regression;\n3. if accepted, real Yandex DRAFT;\n4. fix only hosted-platform defects;\n5. content expansion.',
      '1. Phase 2.6 implementation + exact browser/video validation — complete;\n2. final direct repeated-use regression — complete/accepted after PR #50 lifecycle fix and exact fixed-tree revalidation;\n3. real Yandex DRAFT — current next gate;\n4. fix only hosted-platform defects;\n5. content expansion.',
    ],
    [
      '> **Final direct Phase 2.6 regression → real Yandex DRAFT → content expansion.**\n\nRuntime architecture remains intentionally small; the current gates are the bounded Overcharge/save extension, direct product acceptance and real hosted-platform validation.',
      '> **Real Yandex DRAFT → hosted-only fixes → content expansion.**\n\nRuntime architecture remains intentionally small. The bounded Overcharge/save extension and direct product acceptance are complete; real hosted-platform validation is the current critical gate.',
    ],
  ],
};

for (const [file, pairs] of Object.entries(replacements)) {
  let source = await fs.readFile(file, 'utf8');
  for (const [before, after] of pairs) {
    if (!source.includes(before)) {
      throw new Error(`${file}: expected text not found:\n${before}`);
    }
    source = source.replace(before, after);
  }
  await fs.writeFile(file, source);
  console.log(`updated ${file}`);
}
