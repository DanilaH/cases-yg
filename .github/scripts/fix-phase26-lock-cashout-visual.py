from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text(encoding='utf-8')
old = "    const visualSignal = pending.signal.gain > 0 ? pending.signal.before : pending.signal.after;\n"
new = """    const visualSignal = pending.signal.lockConsumed\n      ? pending.signal.before\n      : pending.signal.gain > 0\n        ? pending.signal.before\n        : pending.signal.after;\n"""
if old not in text:
    raise SystemExit('expected visualSignal line not found')
if text.count(old) != 1:
    raise SystemExit(f'expected exactly one visualSignal line, found {text.count(old)}')
path.write_text(text.replace(old, new), encoding='utf-8')
print('Phase 2.6 LOCK cash-out presentation seam fixed')
