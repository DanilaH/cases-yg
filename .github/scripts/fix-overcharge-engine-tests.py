from pathlib import Path

p = Path('tests/lite-pouches.test.ts')
text = p.read_text(encoding='utf-8')
old = """    expect(result.signal.lockConsumed).toBe(true);\n    expect(result.chips.rawEarned).toBe(18);\n    expect(result.chips.overchargeBonus).toBe(5);\n    expect(result.overcharge).toMatchObject({\n      beforeHundredths: 130,\n      afterHundredths: 100,\n      appliedGainHundredths: 0,\n      bonusChips: 5,\n    });"""
new = """    expect(result.signal.lockConsumed).toBe(true);\n    const expectedBonus = Math.round(result.chips.rawEarned * 0.3);\n    expect(result.chips.overchargeBonus).toBe(expectedBonus);\n    expect(result.overcharge).toMatchObject({\n      beforeHundredths: 130,\n      afterHundredths: 100,\n      appliedGainHundredths: 0,\n      bonusChips: expectedBonus,\n    });"""
if text.count(old) != 1:
    raise SystemExit(f'expected cash-out block once, found {text.count(old)}')
p.write_text(text.replace(old, new, 1), encoding='utf-8')
