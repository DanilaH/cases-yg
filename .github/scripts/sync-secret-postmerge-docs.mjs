import fs from 'node:fs';

const replaceOne = (text, pattern, replacement, label) => {
  const next = text.replace(pattern, replacement);
  if (next === text) throw new Error(`Patch target not found: ${label}`);
  return next;
};

const patch = (file, mutate) => {
  const before = fs.readFileSync(file, 'utf8');
  const after = mutate(before);
  if (after === before) throw new Error(`No changes produced for ${file}`);
  fs.writeFileSync(file, after);
};

patch('docs/TECHNICAL_DIRECTION.md', text => {
  text = replaceOne(
    text,
    /Gameplay Loop Lite V2, the bounded \*\*Opening Feel Correction\*\*, and Phase 2\.6 Signal Overcharge are implemented in current `main`\.[\s\S]*?Real Yandex DRAFT is now the immediate gate — not broad architecture work\./,
    'Gameplay Loop Lite V2, the bounded **Opening Feel Correction**, Phase 2.6 Signal Overcharge, and the bounded Secret reward/reward-tray correction are implemented in current `main`. The earlier final repeated-use gate caught and fixed the stale Overcharge reward-tag tween race; the later Secret correction then changed save/economy/presentation again and was merged through PRs #55–#57. Its exact product tree passed a 34/34 browser acceptance with manual screenshot/video review. One fresh merged-main repeated-use regression is therefore the current internal gate; real Yandex DRAFT follows only if that regression stays clean.',
    'technical current state',
  );
  text = replaceOne(
    text,
    '- versioned save migration;\n- recoverable atomic cost/reward transaction;',
    '- versioned save migration through Save V4;\n- persisted Secret new/duplicate outcome + exact per-transaction jackpot bonus;\n- recoverable atomic cost/reward transaction;',
    'technical architecture bullets',
  );
  text = replaceOne(
    text,
    '- balance numbers stayed unchanged through the feel correction and remain provisional pending later evidence.\n- Phase 2.6 may add only Overcharge-specific pouch gain/cap tuning; legacy pouch cost/base/cache/rarity/recycle numbers do not move by intuition.',
    '- legacy pouch cost/base/cache/rarity/recycle numbers stayed unchanged through the feel/Overcharge/Secret corrections and remain provisional pending later evidence;\n- Phase 2.6 added only Overcharge-specific pouch gain/cap tuning;\n- the later bounded Secret correction added the approved fixed `+40 CHIPS` Secret jackpot without changing legacy pouch economics.',
    'technical balance boundary',
  );
  text = replaceOne(text, 'Current save is versioned (`SAVE_VERSION = 3`) behind `StorageAdapter`.', 'Current save is versioned (`SAVE_VERSION = 4`) behind `StorageAdapter`.', 'save version');
  text = replaceOne(
    text,
    'recycle CHIPS\nSignal transition\nHidden Pocket result\nfinal deterministic snapshot',
    'recycle CHIPS\nOvercharge multiplier-before / bonus / retained gain or reset\nSignal transition\nHidden Pocket result + persisted new/duplicate flag + exact Secret jackpot bonus\nfinal deterministic snapshot',
    'pending reveal fields',
  );
  text = replaceOne(
    text,
    /Phase 2\.6 must extend this same boundary rather than bypass it:[\s\S]*?- reward count-up, gain flight, MAX pulse and discharge are presentation-only views of the stored transition\./,
    'The current V4 transaction extends this same boundary rather than bypassing it:\n\n- Overcharge multiplier-before, bonus CHIPS, actual clamped gain/reset and multiplier-after are persisted in the prepared reveal;\n- `hiddenPocket.isNew`, `hiddenPocket.bonusChips` and `chips.secretBonus` persist the exact Secret outcome;\n- new Secret transactions carry the fixed `+40 CHIPS` jackpot, while migrated pre-correction staged V3 Hidden Pockets retain bonus `0`;\n- recovery never recalculates a different multiplier or Secret payout;\n- reward count-up, Secret carousel selection, premium ambience, gain flight, MAX pulse and discharge are presentation-only views of stored truth.',
    'save extension contract',
  );
  text = replaceOne(text, '- on acceptance bank base → cache → recycle;', '- on acceptance bank base → cache → recycle → persisted Secret jackpot when present;', 'bank order');
  text = replaceOne(text, 'Current suite baseline is 114 tests plus typecheck/assets/build.', 'Current suite baseline is **130 tests** plus typecheck/assets/build.', 'technical suite baseline');
  text = replaceOne(
    text,
    'The browser/video regressions cover the matrix in `PROBE_VALIDATION.md`, including grab/tear motion, staged CHIPS, bank/count-up, selector states, Charged differentiation, neon/digital treatment, fast-forward and compact RU layouts. The final direct repeated-use gate additionally reproduced and fixed the Overcharge reward-tag teardown race, then passed **86/86** assertions on the exact fixed tree with manual artifact review.',
    'The browser/video regressions cover the matrix in `PROBE_VALIDATION.md`, including grab/tear motion, staged CHIPS, bank/count-up, selector states, Charged differentiation, neon/digital treatment, fast-forward and compact RU layouts. The earlier final direct repeated-use gate reproduced and fixed the Overcharge reward-tag teardown race, then passed **86/86** assertions on the exact fixed tree. The later Secret correction exact tree additionally passed **34/34** assertions across NEW/duplicate Secret, EN 1280, RU 900, carousel reward switching, ~4-second persistent premium state, recovery and aggressive fast-forward with zero runtime/request/HTTP diagnostics and manual artifact review. A fresh merged-main repeated-use regression remains required because this later correction changed runtime behavior.',
    'technical browser coverage',
  );
  text = replaceOne(
    text,
    'Real hosted Yandex DRAFT is now the **current next gate** after Phase 2.6 implementation + exact audit + direct regression approval.',
    'Real hosted Yandex DRAFT is the **next external gate**, but it remains blocked on one fresh merged-main repeated-use regression after the Secret correction.',
    'technical Yandex boundary',
  );
  text = replaceOne(
    text,
    'Phase 2.6 should stay narrow: preserve existing boundaries, add only the smallest pure-state/save fields needed for deterministic Overcharge, and keep presentation helpers local.',
    'Keep the completed Overcharge + Secret corrections narrow: preserve the current pure-state/save boundaries, keep presentation helpers local, and do not add unrelated meta/content work before hosted DRAFT evidence.',
    'technical guardrail tail',
  );
  return text;
});

patch('docs/SECRET_REWARD_CORRECTION.md', text => {
  text = replaceOne(
    text,
    'Status: **LOCKED NEXT — bounded pre-DRAFT correction**.',
    'Status: **IMPLEMENTED / EXACT-BROWSER-AUDITED / MERGED — final merged-main repeated-use regression pending**.',
    'secret status',
  );
  text = replaceOne(
    text,
    'The pass is deliberately bounded. It fixes presentation/readability, debug scenario validity, and completes the existing Hidden Pocket/Secret reward contract. It does not add new pouch types, currencies, shops, crafting, auto-open, families, Drops, or other meta systems.\n\n---',
    'The pass is deliberately bounded. It fixes presentation/readability, debug scenario validity, and completes the existing Hidden Pocket/Secret reward contract. It does not add new pouch types, currencies, shops, crafting, auto-open, families, Drops, or other meta systems.\n\nImplementation/evidence now merged:\n\n- PR #55: reward-tray readability/right-preferred placement + self-contained debug seeds;\n- PR #56: Save V4, persisted `+40 CHIPS` Secret jackpot, missing-first then duplicate Secret policy, exact V3 staged-reveal compatibility;\n- PR #57: ruby/gold Secret identity, stronger arrival, persistent premium ambience, page-aware reward tray, duplicate presentation and separate Secret banking;\n- exact Secret presentation product head `629d5beb666aa9365ce7197082938ea1a50d9d15`: **34/34 PASS**, zero runtime/request/HTTP diagnostics, with manual screenshot/video review;\n- current merged runtime after PR #57: `341c4a265a39c1d8f9d7e1cd1030b7d4e8c62cba`; post-merge CI passed.\n\nBecause the correction changed runtime after the earlier repeated-use acceptance, one fresh merged-main repeated-use regression remains the final internal gate before hosted Yandex DRAFT.\n\n---',
    'secret evidence summary',
  );
  text = replaceOne(
    text,
    'After exact browser/video evidence is reviewed, run one short direct local hands-on pass. If accepted, rebuild the exact Yandex DRAFT candidate and continue hosted validation. Do not add unrelated polish while this gate is open.',
    'The exact correction browser/video evidence has been reviewed and accepted. The remaining gate is one fresh repeated-use regression on the merged runtime, including Secret effect teardown/collect/navigation safety. If that passes, rebuild the exact Yandex DRAFT candidate and continue hosted validation. Do not add unrelated polish while this gate is open.',
    'secret validation tail',
  );
  return text;
});

patch('docs/PROBE_VALIDATION.md', text => {
  text = replaceOne(text, '- current suite baseline: **114 unit tests** + typecheck + asset self-test/validation + production build;', '- current suite baseline: **130 unit tests** + typecheck + asset self-test/validation + production build;', 'probe suite top');
  text = replaceOne(
    text,
    '- real Yandex DRAFT: **UNBLOCKED / NEXT EXTERNAL GATE**.',
    '- Secret reward/reward-tray correction: **IMPLEMENTED / EXACT-BROWSER-AUDITED / MERGED** via PRs #55–#57;\n- Secret exact product acceptance: **34/34 PASS** on `629d5beb666aa9365ce7197082938ea1a50d9d15`, zero runtime/request/HTTP diagnostics, manual screenshot/video review complete;\n- current merged runtime after PR #57: `341c4a265a39c1d8f9d7e1cd1030b7d4e8c62cba`; post-merge CI **PASS**;\n- final merged-main repeated-use regression after Secret correction: **PENDING — CURRENT INTERNAL GATE**;\n- real Yandex DRAFT: **BLOCKED ON THAT FINAL INTERNAL REGRESSION / NEXT EXTERNAL GATE AFTER PASS**.',
    'probe current gates',
  );
  text = replaceOne(
    text,
    'The Lite baseline and Phase 2.6 direct regression are proven. The final repeated-use pass found one presentation-lifecycle race in the Overcharge bonus counter; PR #50 added a bounded destroyed-tag guard without changing economy or transaction semantics, and the exact fixed tree then passed targeted stress plus the full repeated-use loop. Hosted Yandex behavior remains unproven until the DRAFT gate.',
    'The Lite baseline and Phase 2.6 direct regression are proven. The earlier final repeated-use pass found one presentation-lifecycle race in the Overcharge bonus counter; PR #50 added a bounded destroyed-tag guard and the exact fixed tree passed targeted stress plus the full repeated-use loop. The later bounded Secret correction is also implemented and exact-browser-accepted, but it changed save/economy/presentation after that earlier repeated-use approval. Therefore one fresh merged-main repeated-use regression is required before DRAFT. Hosted Yandex behavior remains unproven until the external DRAFT gate.',
    'probe status paragraph',
  );
  text = replaceOne(text, 'Current suite baseline: **114 unit tests** plus typecheck, asset self-test/validation and production build.', 'Current suite baseline: **130 unit tests** plus typecheck, asset self-test/validation and production build.', 'probe suite body');
  text = replaceOne(
    text,
    '- compact 900/1024 and RU states are technically valid.',
    '- compact 900/1024 and RU states are technically valid;\n- Save V4 persists exact Secret new/duplicate state and per-transaction jackpot bonus;\n- successful Hidden Pocket selects undiscovered Secrets first, then continues as duplicates after completion;\n- the fixed `+40 CHIPS` Secret jackpot is excluded from Overcharge multiplication;\n- pre-correction staged V3 Hidden Pocket reveals migrate without retroactive jackpot payment;\n- Secret result/tray state follows carousel selection and recovery reconstructs the premium result.',
    'probe proven secret bullets',
  );
  return text;
});

patch('docs/IMPLEMENTATION_ROADMAP.md', text => {
  text = replaceOne(
    text,
    '8. **Real Yandex DRAFT validation — CURRENT NEXT EXTERNAL GATE**\n9. **Content/release expansion — BLOCKED until draft passes**\n10. **Public release hardening**',
    '8. **Secret reward/reward-tray correction — IMPLEMENTED / EXACT-BROWSER-AUDITED / MERGED**\n9. **Final merged-main repeated-use regression after Secret correction — CURRENT INTERNAL GATE**\n10. **Real Yandex DRAFT validation — NEXT EXTERNAL GATE AFTER #9 PASSES**\n11. **Content/release expansion — BLOCKED until draft passes**\n12. **Public release hardening**',
    'roadmap execution order',
  );
  text = replaceOne(
    text,
    'The latest direct play exposed concrete UI/input/clarity issues plus one legitimate dead-Signal edge after collection completion. The approved response stayed bounded: those findings and Signal Overcharge were implemented, exact-audited and accepted. The final repeated-use regression then found one stale Overcharge reward-tag tween lifecycle crash; PR #50 fixed only that callback-after-teardown defect, and the exact fixed tree passed targeted stress plus a fresh 24-opening normal loop. Hosted Yandex DRAFT is now the current gate.',
    'The latest direct play exposed concrete UI/input/clarity issues plus one legitimate dead-Signal edge after collection completion. The approved response stayed bounded: those findings and Signal Overcharge were implemented, exact-audited and accepted. The earlier final repeated-use regression then found one stale Overcharge reward-tag tween lifecycle crash; PR #50 fixed only that callback-after-teardown defect, and the exact fixed tree passed targeted stress plus a fresh 24-opening normal loop. A later bounded Secret/reward correction was then implemented and merged through PRs #55–#57, including Save V4 and exact 34/34 browser acceptance. Because that correction changed runtime after the earlier repeated-use approval, a fresh merged-main repeated-use regression is now the final internal gate before hosted Yandex DRAFT.',
    'roadmap current paragraph',
  );
  text = replaceOne(
    text,
    'The full current baseline remains 108 unit tests + typecheck + asset self-test/validation + production build.',
    'At this historical phase the baseline was 108 unit tests; the current post-Secret baseline is **130 unit tests** + typecheck + asset self-test/validation + production build.',
    'roadmap historical baseline',
  );
  text = replaceOne(
    text,
    '# Deferred information pass — NOT PART OF 2.1',
    '# Phase 2.7 — Secret reward + reward-tray correction — IMPLEMENTED / EXACT-BROWSER-AUDITED / MERGED\n\nCanonical contract: `docs/SECRET_REWARD_CORRECTION.md`.\n\nMerged outcome:\n\n- wider/readable right-preferred reward tray + self-contained debug scenarios (PR #55);\n- Save V4 with persisted Secret new/duplicate outcome and fixed `+40 CHIPS` jackpot excluded from Overcharge (PR #56);\n- Hidden Pocket guarantees missing Secrets first, then remains alive as duplicate jackpots after 2/2;\n- ruby/coral + warm-gold Secret identity, stronger arrival and persistent premium state until collect;\n- one reward tray follows standard/Secret carousel selection;\n- recovery and aggressive fast-forward preserve exact transaction/result state;\n- exact product head `629d5beb666aa9365ce7197082938ea1a50d9d15` passed **34/34** browser assertions with zero runtime/request/HTTP diagnostics and manual artifact review;\n- merged runtime head after PR #57: `341c4a265a39c1d8f9d7e1cd1030b7d4e8c62cba`, post-merge CI PASS.\n\nOne fresh merged-main repeated-use regression remains required before Phase 3 because this correction added long-lived Secret presentation tweens and changed the save/economy path after the earlier repeated-use gate.\n\n---\n\n# Deferred information pass — NOT PART OF 2.1',
    'roadmap secret phase',
  );
  text = replaceOne(
    text,
    '# Phase 3 — real Yandex DRAFT validation — NEXT EXTERNAL GATE\n\nRun `docs/YANDEX_SLICE_VALIDATION.md` only after Phase 2.6 implementation, exact audit and direct regression are accepted.',
    '# Phase 3 — real Yandex DRAFT validation — NEXT EXTERNAL GATE AFTER CURRENT INTERNAL REGRESSION\n\nRun `docs/YANDEX_SLICE_VALIDATION.md` only after the merged Phase 2.6 + Secret correction runtime passes the fresh final repeated-use regression.',
    'roadmap phase3 gate',
  );
  return text;
});

patch('docs/OPEN_QUESTIONS.md', text => {
  text = replaceOne(
    text,
    'Phase 2.6 correction/Overcharge is implemented and exact-audited under `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`; only final direct repeated-use acceptance remains before Yandex DRAFT. `OPENING_FEEL_CORRECTION_SCOPE.md` remains the historical feel-correction contract.',
    'Phase 2.6 correction/Overcharge is implemented, exact-audited and repeated-use accepted under `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`. The later Secret reward/reward-tray correction is also implemented and merged under `SECRET_REWARD_CORRECTION.md`; its exact browser acceptance passed 34/34. Because that correction changed runtime after the earlier repeated-use gate, one fresh merged-main repeated-use regression is the only remaining internal gate before Yandex DRAFT. `OPENING_FEEL_CORRECTION_SCOPE.md` remains the historical feel-correction contract.',
    'open questions top status',
  );
  text = replaceOne(
    text,
    'No balance numbers changed in the feel-correction or bounded follow-up passes. Keep these legacy values unchanged during Phase 2.6 except for the explicitly new Overcharge parameters; after hosted/content-scale simulation, evidence questions remain:',
    'Legacy pouch/cache/rarity/recycle numbers did not change in the feel-correction, Phase 2.6, or Secret correction. Phase 2.6 added only its explicit Overcharge parameters, and the later approved Secret correction added one separate fixed `+40 CHIPS` jackpot. Current economy analysis includes the Hidden Pocket expected value and still keeps Charged a net CHIPS sink. After hosted/content-scale simulation, evidence questions remain:',
    'open questions balance wording',
  );
  text = replaceOne(
    text,
    '## 2.1 Signal Overcharge tuning — RESOLVED FOR CURRENT VALIDATION BUILD',
    '## 2.1 Signal Overcharge tuning — RESOLVED FOR CURRENT VALIDATION BUILD',
    'open questions marker',
  );
  text = replaceOne(
    text,
    'The mechanic and these values are implemented, transaction-tested and exact-browser-audited. Legacy Lite V2 pouch/cache/rarity/recycle values were not changed. Re-open Overcharge tuning only if final direct hands-on, hosted DRAFT, or later content-scale economy evidence shows a concrete problem.\n\n---',
    'The mechanic and these values are implemented, transaction-tested and exact-browser-audited. Legacy Lite V2 pouch/cache/rarity/recycle values were not changed. Re-open Overcharge tuning only if the fresh merged-main regression, hosted DRAFT, or later content-scale economy evidence shows a concrete problem.\n\n## 2.2 Secret jackpot tuning — RESOLVED FOR CURRENT VALIDATION BUILD\n\nCurrent approved Secret payout is a fixed `+40 CHIPS` per successful Hidden Pocket, for both NEW and duplicate Secret outcomes after collection completion. It is persisted as its own transaction component and is never multiplied by Overcharge. Save V4 compatibility preserves pre-correction staged V3 Hidden Pockets at their original `+0` Secret bonus. Re-open `+40` only from hosted/content-scale economy evidence, not intuition.\n\n---',
    'open questions secret tuning',
  );
  text = replaceOne(
    text,
    'After corrected hands-on acceptance, hosted validation may reveal issues local CI cannot:',
    'After the current fresh merged-main repeated-use regression passes, hosted validation may reveal issues local CI cannot:',
    'open questions Yandex lead',
  );
  text = replaceOne(
    text,
    'Only after corrected hands-on + real Yandex DRAFT validation, lock:',
    'Only after the final merged-main regression + real Yandex DRAFT validation, lock:',
    'open questions content gate',
  );
  return text;
});

console.log('Post-Secret docs sync applied.');
