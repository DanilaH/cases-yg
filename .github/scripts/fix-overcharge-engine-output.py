from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected 1 match, got {count}: {old[:120]!r}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')

# Type-safe validation: raw record fields stay unknown until shape validation passes.
replace_once(
    'src/game/systems/save.ts',
    'chips.overchargeBonus === Math.round((chips.rawEarned * (value.overcharge.beforeHundredths - DEFAULT_OVERCHARGE_HUNDREDTHS)) / 100)',
    'chips.overchargeBonus === Math.round((chips.rawEarned * (Number(value.overcharge.beforeHundredths) - DEFAULT_OVERCHARGE_HUNDREDTHS)) / 100)',
)
replace_once(
    'src/game/systems/save.ts',
    '    isNonNegativeInteger(overcharge.appliedGainHundredths);',
    '    isNonNegativeInteger(overcharge.appliedGainHundredths) &&\n    isNonNegativeInteger(overcharge.bonusChips);',
)
replace_once(
    'src/game/systems/save.ts',
    "  const typedSignal = signal as unknown as PendingReveal['signal'];\n  if (!isSignalTransitionConsistent(typedSignal, standard.isNew)) return false;\n  if (typedSignal.lockArmedBefore === false && overcharge.beforeHundredths !== DEFAULT_OVERCHARGE_HUNDREDTHS) return false;\n  if (typedSignal.lockConsumed) {\n    if (overcharge.afterHundredths !== DEFAULT_OVERCHARGE_HUNDREDTHS || overcharge.appliedGainHundredths !== 0) return false;\n  } else if (typedSignal.lockRetained) {\n    if (overcharge.afterHundredths < overcharge.beforeHundredths || overcharge.appliedGainHundredths !== overcharge.afterHundredths - overcharge.beforeHundredths) return false;\n  } else if (overcharge.afterHundredths !== overcharge.beforeHundredths || overcharge.appliedGainHundredths !== 0) {\n    return false;\n  }",
    "  const typedSignal = signal as unknown as PendingReveal['signal'];\n  const typedOvercharge = overcharge as unknown as PendingReveal['overcharge'];\n  if (!isSignalTransitionConsistent(typedSignal, standard.isNew)) return false;\n  if (typedOvercharge.bonusChips !== chips.overchargeBonus) return false;\n  if (typedSignal.lockArmedBefore === false && typedOvercharge.beforeHundredths !== DEFAULT_OVERCHARGE_HUNDREDTHS) return false;\n  if (typedSignal.lockConsumed) {\n    if (typedOvercharge.afterHundredths !== DEFAULT_OVERCHARGE_HUNDREDTHS || typedOvercharge.appliedGainHundredths !== 0) return false;\n  } else if (typedSignal.lockRetained) {\n    if (typedOvercharge.afterHundredths < typedOvercharge.beforeHundredths || typedOvercharge.appliedGainHundredths !== typedOvercharge.afterHundredths - typedOvercharge.beforeHundredths) return false;\n  } else if (typedOvercharge.afterHundredths !== typedOvercharge.beforeHundredths || typedOvercharge.appliedGainHundredths !== 0) {\n    return false;\n  }",
)

# Persist bonusChips too; it is deliberate redundant transaction evidence cross-checked against chips.overchargeBonus.
replace_once(
    'src/game/systems/save.ts',
    '      appliedGainHundredths: 0,\n    },\n    hiddenPocket:',
    '      appliedGainHundredths: 0,\n      bonusChips: 0,\n    },\n    hiddenPocket:',
)
replace_once(
    'src/game/systems/save.ts',
    '        appliedGainHundredths: 0,\n      },\n      commit:',
    '        appliedGainHundredths: 0,\n        bonusChips: 0,\n      },\n      commit:',
)
replace_once(
    'tests/save-migration.test.ts',
    '      appliedGainHundredths: 0,\n    });\n    expect(pending.signal)',
    '      appliedGainHundredths: 0,\n      bonusChips: 0,\n    });\n    expect(pending.signal)',
)
replace_once(
    'tests/save-migration.test.ts',
    '      appliedGainHundredths: 0,\n    });\n  });\n\n  it(\'rejects a current pending transaction',
    '      appliedGainHundredths: 0,\n      bonusChips: 0,\n    });\n  });\n\n  it(\'rejects a current pending transaction',
)
