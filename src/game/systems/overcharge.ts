import { OVERCHARGE_BASE_HUNDREDTHS } from '../data/balance';

export interface ResolveOverchargeInput {
  beforeHundredths: number;
  rawEarnedChips: number;
  lockArmedBefore: boolean;
  lockConsumed: boolean;
  lockRetained: boolean;
  pouchGainHundredths: number;
  capHundredths: number;
}

export interface OverchargeTransition {
  beforeHundredths: number;
  afterHundredths: number;
  appliedGainHundredths: number;
  bonusChips: number;
}

const assertWhole = (value: number, label: string): void => {
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
};

export const calculateOverchargeBonus = (rawEarnedChips: number, multiplierHundredths: number): number => {
  assertWhole(rawEarnedChips, 'raw Overcharge CHIPS');
  assertWhole(multiplierHundredths, 'Overcharge multiplier');
  if (rawEarnedChips < 0 || multiplierHundredths < OVERCHARGE_BASE_HUNDREDTHS) {
    throw new Error('Invalid Overcharge bonus input');
  }
  return Math.round((rawEarnedChips * (multiplierHundredths - OVERCHARGE_BASE_HUNDREDTHS)) / 100);
};

export const resolveOverchargeTransition = (input: ResolveOverchargeInput): OverchargeTransition => {
  const {
    beforeHundredths,
    rawEarnedChips,
    lockArmedBefore,
    lockConsumed,
    lockRetained,
    pouchGainHundredths,
    capHundredths,
  } = input;

  for (const [value, label] of [
    [beforeHundredths, 'Overcharge multiplier'],
    [pouchGainHundredths, 'Overcharge pouch gain'],
    [capHundredths, 'Overcharge cap'],
  ] as const) {
    assertWhole(value, label);
  }
  if (
    beforeHundredths < OVERCHARGE_BASE_HUNDREDTHS ||
    pouchGainHundredths < 0 ||
    capHundredths < OVERCHARGE_BASE_HUNDREDTHS ||
    beforeHundredths > capHundredths
  ) {
    throw new Error('Invalid Overcharge state');
  }
  if (!lockArmedBefore && beforeHundredths !== OVERCHARGE_BASE_HUNDREDTHS) {
    throw new Error('Overcharge cannot remain active without an armed Signal lock');
  }
  if (lockConsumed && lockRetained) {
    throw new Error('Signal lock cannot be consumed and retained together');
  }

  const bonusChips = calculateOverchargeBonus(rawEarnedChips, beforeHundredths);
  if (lockConsumed) {
    return {
      beforeHundredths,
      afterHundredths: OVERCHARGE_BASE_HUNDREDTHS,
      appliedGainHundredths: 0,
      bonusChips,
    };
  }
  if (lockRetained) {
    const afterHundredths = Math.min(capHundredths, beforeHundredths + pouchGainHundredths);
    return {
      beforeHundredths,
      afterHundredths,
      appliedGainHundredths: afterHundredths - beforeHundredths,
      bonusChips,
    };
  }
  return {
    beforeHundredths,
    afterHundredths: beforeHundredths,
    appliedGainHundredths: 0,
    bonusChips,
  };
};

export const formatOverchargeMultiplier = (hundredths: number): string => {
  assertWhole(hundredths, 'Overcharge multiplier');
  return `x${(hundredths / 100).toFixed(2)}`;
};
