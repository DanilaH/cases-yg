export interface ChipFlightPlan {
  amount: number;
  duration: number;
  flightDuration: number;
  emissionWindow: number;
  audioStride: number;
}

export const createChipFlightPlan = (
  amount: number,
  minDuration: number,
  maxDuration: number,
): ChipFlightPlan => {
  const normalizedAmount = Math.max(0, Math.floor(amount));
  const duration = Math.min(
    maxDuration,
    Math.max(minDuration, minDuration + Math.min(150, normalizedAmount) * 4),
  );
  const flightDuration = Math.min(225, 175 + normalizedAmount * 0.34);
  const emissionWindow = Math.max(0, duration - flightDuration);
  const audioStride = Math.max(1, Math.ceil(normalizedAmount / 36));

  return {
    amount: normalizedAmount,
    duration,
    flightDuration,
    emissionWindow,
    audioStride,
  };
};

export const chipEmissionDelay = (plan: ChipFlightPlan, index: number): number => {
  if (plan.amount <= 1) return 0;
  const clampedIndex = Math.min(Math.max(0, Math.floor(index)), plan.amount - 1);
  return (plan.emissionWindow * clampedIndex) / (plan.amount - 1);
};

export const shouldPlayChipClack = (plan: ChipFlightPlan, index: number): boolean =>
  plan.amount > 0 && (index % plan.audioStride === 0 || index === plan.amount - 1);
