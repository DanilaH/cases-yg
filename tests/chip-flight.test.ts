import { describe, expect, it } from 'vitest';

import { chipEmissionDelay, createChipFlightPlan, shouldPlayChipClack } from '../src/game/systems/chipFlight';

describe('chip flight planning', () => {
  it.each([1, 7, 33, 150])('emits exactly %i visual chips with bounded timing', (amount) => {
    const plan = createChipFlightPlan(amount, 320, 900);
    const delays = Array.from({ length: plan.amount }, (_, index) => chipEmissionDelay(plan, index));

    expect(plan.amount).toBe(amount);
    expect(plan.duration).toBeGreaterThanOrEqual(320);
    expect(plan.duration).toBeLessThanOrEqual(900);
    expect(delays).toHaveLength(amount);
    expect(delays[0]).toBe(0);
    expect(delays.at(-1) ?? 0).toBeCloseTo(amount === 1 ? 0 : plan.emissionWindow);
  });

  it('bounds audio density while preserving every small reward clack', () => {
    const small = createChipFlightPlan(7, 320, 900);
    const large = createChipFlightPlan(150, 320, 900);
    const smallClacks = Array.from({ length: small.amount }, (_, index) => shouldPlayChipClack(small, index)).filter(Boolean).length;
    const largeClacks = Array.from({ length: large.amount }, (_, index) => shouldPlayChipClack(large, index)).filter(Boolean).length;

    expect(smallClacks).toBe(7);
    expect(largeClacks).toBeLessThanOrEqual(37);
    expect(shouldPlayChipClack(large, large.amount - 1)).toBe(true);
  });
});
