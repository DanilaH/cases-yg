from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text(encoding='utf-8')

old = """        color: overchargeColor,\n        stroke: overchargeActive || overchargeMax ? '#160f20' : undefined,\n        strokeThickness: overchargeActive || overchargeMax ? 2 : 0,"""
new = """        color: overchargeColor,\n        stroke: '#160f20',\n        strokeThickness: overchargeActive || overchargeMax ? 2 : 0,"""
if text.count(old) != 1:
    raise SystemExit(f'expected overcharge style match once, got {text.count(old)}')
text = text.replace(old, new, 1)

old = """          tag: pending.overcharge.afterHundredths >= LITE_V2_BALANCE.overchargeCapHundredths ? 'MAX' : undefined,\n          tagColor: '#ff7aa8',"""
new = """          tag: pending.overcharge.afterHundredths >= LITE_V2_BALANCE.overchargeCapHundredths ? 'MAX' : '',\n          tagColor: '#ff7aa8',"""
if text.count(old) != 1:
    raise SystemExit(f'expected optional tag match once, got {text.count(old)}')
text = text.replace(old, new, 1)

path.write_text(text, encoding='utf-8')
print('Phase 2.6 strict typing fixes applied')
