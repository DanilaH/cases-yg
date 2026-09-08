from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text(encoding='utf-8')
old = """    this.renderResolvedResult(pending);\n    // Signal is part of resolving the duplicate reward, not a late CHIPS-banking leg.\n    // Start the cosmetic transfer during the readable result phase; durable state is\n    // already committed above, so this remains presentation-only.\n    const signalTransfer = this.bankSignalGain(pending);\n\n    await this.waitPresentation(RESULT_HOLD_MS);\n    await signalTransfer;\n    if (this.phase !== 'result') return;\n"""
new = """    this.renderResolvedResult(pending);\n    // Signal is part of resolving the duplicate reward, not a late CHIPS-banking leg.\n    // Resolve its short cosmetic transfer first, then spend only the remaining read\n    // budget. This preserves the established total hold while keeping the single-beat\n    // fast-forward controller sequential and deterministic.\n    const signalStartedAt = this.time.now;\n    await this.bankSignalGain(pending);\n    if (this.phase !== 'result' || this.isSceneShutdown()) return;\n    const remainingResultHold = Math.max(0, RESULT_HOLD_MS - (this.time.now - signalStartedAt));\n    await this.waitPresentation(remainingResultHold);\n    if (this.phase !== 'result') return;\n"""
count = text.count(old)
if count != 1:
    raise SystemExit(f'expected one concurrent Signal/read-hold block, found {count}')
path.write_text(text.replace(old, new), encoding='utf-8')
print('serialized early Signal beat within existing result hold budget')
