import fs from 'node:fs';

const patch = (file, replacements) => {
  let text = fs.readFileSync(file, 'utf8');
  for (const [from, to, label] of replacements) {
    if (!text.includes(from)) throw new Error(`Missing ${label} in ${file}`);
    text = text.replace(from, to);
  }
  fs.writeFileSync(file, text);
};

patch('docs/TECHNICAL_DIRECTION.md', [[
  'One fresh merged-main repeated-use regression is therefore the current internal gate; real Yandex DRAFT follows only if that regression stays clean.',
  'The fresh merged-main repeated-use regression is now complete and accepted: exact runtime `341c4a265a39c1d8f9d7e1cd1030b7d4e8c62cba` passed 82/82 assertions across 24 normal openings plus a forced Hidden Pocket lifecycle/teardown path, with zero runtime/request/HTTP diagnostics and manual artifact review. Real Yandex DRAFT is now the current next external gate.',
  'technical current gate',
], [
  'A fresh merged-main repeated-use regression remains required because this later correction changed runtime behavior.',
  'That fresh merged-main repeated-use regression is complete and accepted; no additional local runtime gate remains before hosted DRAFT.',
  'technical regression note',
], [
  'Real hosted Yandex DRAFT is the **next external gate**, but it remains blocked on one fresh merged-main repeated-use regression after the Secret correction.',
  'Real hosted Yandex DRAFT is now the **current next external gate** after the accepted post-Secret merged-main repeated-use regression.',
  'technical yandex gate',
]]);

patch('docs/SECRET_REWARD_CORRECTION.md', [[
  'Status: **IMPLEMENTED / EXACT-BROWSER-AUDITED / MERGED — final merged-main repeated-use regression pending**.',
  'Status: **COMPLETE / MERGED / FINAL MERGED-MAIN REPEATED-USE ACCEPTED — Yandex DRAFT next**.',
  'secret status',
], [
  'Because the correction changed runtime after the earlier repeated-use acceptance, one fresh merged-main repeated-use regression remains the final internal gate before hosted Yandex DRAFT.',
  'The required fresh merged-main repeated-use regression is complete: audit run `34205515234` on exact runtime `341c4a265a39c1d8f9d7e1cd1030b7d4e8c62cba` passed **82/82** assertions. It covered 24 real Basic/Charged openings with Collection round-trips plus a forced new-Secret lifecycle held for ~4 seconds, collect → Collection → return → another real opening teardown check. Runtime/page/request/HTTP diagnostics were empty, wallet endpoints matched persisted transaction truth, and screenshots/video were manually reviewed. Hosted Yandex DRAFT is now unblocked.',
  'secret final gate paragraph',
], [
  'The exact correction browser/video evidence has been reviewed and accepted. The remaining gate is one fresh repeated-use regression on the merged runtime, including Secret effect teardown/collect/navigation safety. If that passes, rebuild the exact Yandex DRAFT candidate and continue hosted validation. Do not add unrelated polish while this gate is open.',
  'The exact correction browser/video evidence and the fresh merged-main repeated-use regression have both been reviewed and accepted. Rebuild the exact Yandex DRAFT candidate and continue hosted validation. Do not add unrelated polish before hosted evidence.',
  'secret validation tail',
]]);

patch('docs/PROBE_VALIDATION.md', [[
  '- final merged-main repeated-use regression after Secret correction: **PENDING — CURRENT INTERNAL GATE**;\n- real Yandex DRAFT: **BLOCKED ON THAT FINAL INTERNAL REGRESSION / NEXT EXTERNAL GATE AFTER PASS**.',
  '- final merged-main repeated-use regression after Secret correction: **COMPLETE / ACCEPTED — 82/82 PASS** on exact runtime `341c4a265a39c1d8f9d7e1cd1030b7d4e8c62cba`, 24 normal openings + forced Secret lifecycle teardown path, zero runtime/request/HTTP diagnostics, manual artifact review complete;\n- real Yandex DRAFT: **UNBLOCKED / CURRENT NEXT EXTERNAL GATE**.',
  'probe status gates',
], [
  'Therefore one fresh merged-main repeated-use regression is required before DRAFT. Hosted Yandex behavior remains unproven until the external DRAFT gate.',
  'That fresh merged-main repeated-use regression has now passed and been manually reviewed, so no local internal gate remains before DRAFT. Hosted Yandex behavior remains unproven until the external DRAFT gate itself.',
  'probe status paragraph',
]]);

patch('docs/IMPLEMENTATION_ROADMAP.md', [[
  '9. **Final merged-main repeated-use regression after Secret correction — CURRENT INTERNAL GATE**\n10. **Real Yandex DRAFT validation — NEXT EXTERNAL GATE AFTER #9 PASSES**',
  '9. **Final merged-main repeated-use regression after Secret correction — COMPLETE / ACCEPTED (82/82)**\n10. **Real Yandex DRAFT validation — CURRENT NEXT EXTERNAL GATE**',
  'roadmap order',
], [
  'Because that correction changed runtime after the earlier repeated-use approval, a fresh merged-main repeated-use regression is now the final internal gate before hosted Yandex DRAFT.',
  'Because that correction changed runtime after the earlier repeated-use approval, a fresh merged-main repeated-use regression was required and has now passed 82/82 on the exact merged runtime with manual artifact review. Hosted Yandex DRAFT is now the current gate.',
  'roadmap summary',
], [
  'One fresh merged-main repeated-use regression remains required before Phase 3 because this correction added long-lived Secret presentation tweens and changed the save/economy path after the earlier repeated-use gate.',
  'The required fresh merged-main repeated-use regression is complete and accepted: 24 normal openings plus forced Secret lifecycle/teardown coverage passed 82/82 with zero runtime/request/HTTP diagnostics.',
  'roadmap phase27 gate',
], [
  '# Phase 3 — real Yandex DRAFT validation — NEXT EXTERNAL GATE AFTER CURRENT INTERNAL REGRESSION\n\nRun `docs/YANDEX_SLICE_VALIDATION.md` only after the merged Phase 2.6 + Secret correction runtime passes the fresh final repeated-use regression.',
  '# Phase 3 — real Yandex DRAFT validation — CURRENT NEXT EXTERNAL GATE\n\nThe merged Phase 2.6 + Secret correction runtime has passed the fresh final repeated-use regression. Run `docs/YANDEX_SLICE_VALIDATION.md` on the rebuilt exact candidate.',
  'roadmap phase3 heading',
]]);

patch('docs/OPEN_QUESTIONS.md', [[
  'Because that correction changed runtime after the earlier repeated-use gate, one fresh merged-main repeated-use regression is the only remaining internal gate before Yandex DRAFT.',
  'The required fresh merged-main repeated-use regression has passed 82/82 on the exact merged runtime with manual artifact review. Yandex DRAFT is now the current next external gate.',
  'open questions intro',
], [
  'Remaining items here are evidence/tuning questions for the current final merged-main regression and later hosted/content-scale work.',
  'Remaining items here are evidence/tuning questions for hosted DRAFT and later content-scale work.',
  'open questions evidence scope',
], [
  'Re-open Overcharge tuning only if the fresh merged-main regression, hosted DRAFT, or later content-scale economy evidence shows a concrete problem.',
  'Re-open Overcharge tuning only if hosted DRAFT or later content-scale economy evidence shows a concrete problem.',
  'open questions overcharge note',
]]);
