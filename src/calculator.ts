export type PayoutInputs = {
  totalPrizePool: number;
  payoutRatio: number;
  minimumPayout: number;
  roundingIncrement: number;
};

export type PayoutSchedule = {
  ok: true;
  payouts: number[];
  paidPlaceCount: number;
  distributedTotal: number;
  paidPlaceCountReducedByRounding: boolean;
};

export type CalculationError = {
  ok: false;
  code: string;
  message: string;
  field?: keyof PayoutInputs;
};

export type PayoutCalculation = PayoutSchedule | CalculationError;

const calculationError = (
  code: string,
  message: string,
  field?: keyof PayoutInputs,
): CalculationError => ({ ok: false, code, message, field });

const isPositiveSafeInteger = (value: number) =>
  Number.isSafeInteger(value) && value > 0;

const hasAtMostTwoDecimalPlaces = (value: number) => {
  if (Number.isInteger(value)) return true;
  const hundredths = value * 100;
  return (
    Number.isFinite(hundredths) &&
    Math.abs(hundredths - Math.round(hundredths)) < 1e-9
  );
};

const validateInputs = (inputs: PayoutInputs): CalculationError | null => {
  if (!isPositiveSafeInteger(inputs.totalPrizePool)) {
    return calculationError(
      "invalid-total-prize-pool",
      "Enter a positive whole NOK amount.",
      "totalPrizePool",
    );
  }
  if (
    !Number.isFinite(inputs.payoutRatio) ||
    inputs.payoutRatio < 1 ||
    !hasAtMostTwoDecimalPlaces(inputs.payoutRatio)
  ) {
    return calculationError(
      "invalid-payout-ratio",
      "Enter a payout ratio of 1.00 or more with up to two decimals.",
      "payoutRatio",
    );
  }
  if (!isPositiveSafeInteger(inputs.minimumPayout)) {
    return calculationError(
      "invalid-minimum-payout",
      "Enter a positive whole NOK amount.",
      "minimumPayout",
    );
  }
  if (!isPositiveSafeInteger(inputs.roundingIncrement)) {
    return calculationError(
      "invalid-rounding-increment",
      "Enter a positive whole NOK amount.",
      "roundingIncrement",
    );
  }
  if (inputs.totalPrizePool < inputs.minimumPayout) {
    return calculationError(
      "total-below-minimum",
      "The total prize pool must be at least the minimum payout.",
      "totalPrizePool",
    );
  }
  if (inputs.totalPrizePool % inputs.roundingIncrement !== 0) {
    return calculationError(
      "total-not-divisible",
      "The total prize pool must be divisible by the rounding increment.",
      "totalPrizePool",
    );
  }
  return null;
};

const maximumIdealPaidPlaceCount = ({
  totalPrizePool,
  payoutRatio,
  minimumPayout,
}: PayoutInputs) => {
  if (payoutRatio === 1) {
    return Math.floor(totalPrizePool / minimumPayout);
  }

  let paidPlaceCount = 1;
  let geometricSum = 1;
  let nextPower = 1;

  while (paidPlaceCount < 1_001) {
    nextPower *= payoutRatio;
    const nextSum = geometricSum + nextPower;
    if (totalPrizePool / nextSum < minimumPayout) break;
    geometricSum = nextSum;
    paidPlaceCount += 1;
  }

  return paidPlaceCount;
};

const idealPayouts = (
  inputs: PayoutInputs,
  paidPlaceCount: number,
): number[] => {
  if (inputs.payoutRatio === 1) {
    return Array.from(
      { length: paidPlaceCount },
      () => inputs.totalPrizePool / paidPlaceCount,
    );
  }

  const weights = Array.from(
    { length: paidPlaceCount },
    (_, index) => inputs.payoutRatio ** (paidPlaceCount - index - 1),
  );
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => (inputs.totalPrizePool * weight) / weightSum);
};

const reconcilePayouts = (
  inputs: PayoutInputs,
  paidPlaceCount: number,
) => {
  const targets = idealPayouts(inputs, paidPlaceCount).map(
    (payout) => payout / inputs.roundingIncrement,
  );
  const minimumUnits = Math.ceil(
    inputs.minimumPayout / inputs.roundingIncrement,
  );
  const totalUnits = inputs.totalPrizePool / inputs.roundingIncrement;
  const units = targets.map((target) =>
    Math.max(Math.floor(target + Number.EPSILON * target), minimumUnits),
  );
  let unitDifference = totalUnits - units.reduce((sum, value) => sum + value, 0);

  if (!Number.isInteger(unitDifference)) return null;

  while (unitDifference > 0) {
    let bestIndex = -1;
    let bestMarginalError = Number.POSITIVE_INFINITY;

    for (let index = 0; index < units.length; index += 1) {
      const canIncrease = index === 0 || units[index] < units[index - 1];
      if (!canIncrease) continue;

      const currentError = Math.abs(units[index] - targets[index]);
      const increasedError = Math.abs(units[index] + 1 - targets[index]);
      const marginalError = increasedError - currentError;

      if (marginalError < bestMarginalError - Number.EPSILON) {
        bestMarginalError = marginalError;
        bestIndex = index;
      }
    }

    units[bestIndex] += 1;
    unitDifference -= 1;
  }

  while (unitDifference < 0) {
    let bestIndex = -1;
    let bestMarginalError = Number.POSITIVE_INFINITY;

    for (let index = units.length - 1; index >= 0; index -= 1) {
      const canDecrease =
        units[index] > minimumUnits &&
        (index === units.length - 1 || units[index] > units[index + 1]);
      if (!canDecrease) continue;

      const currentError = Math.abs(units[index] - targets[index]);
      const decreasedError = Math.abs(units[index] - 1 - targets[index]);
      const marginalError = decreasedError - currentError;

      if (marginalError < bestMarginalError - Number.EPSILON) {
        bestMarginalError = marginalError;
        bestIndex = index;
      }
    }

    if (bestIndex === -1) return null;
    units[bestIndex] -= 1;
    unitDifference += 1;
  }

  return units.map((value) => value * inputs.roundingIncrement);
};

const isValidSchedule = (inputs: PayoutInputs, payouts: number[]) =>
  payouts.reduce((sum, payout) => sum + payout, 0) ===
    inputs.totalPrizePool &&
  payouts.every((payout) => payout % inputs.roundingIncrement === 0) &&
  payouts.every((payout, index) => index === 0 || payouts[index - 1] >= payout) &&
  payouts[payouts.length - 1] >= inputs.minimumPayout;

export function calculatePayoutSchedule(
  inputs: PayoutInputs,
): PayoutCalculation {
  const inputError = validateInputs(inputs);
  if (inputError) return inputError;

  const maximumPaidPlaceCount = maximumIdealPaidPlaceCount(inputs);
  if (maximumPaidPlaceCount > 1_000) {
    return calculationError(
      "schedule-limit",
      "This schedule exceeds the 1,000-place limit. Increase the minimum payout or payout ratio.",
    );
  }

  for (
    let paidPlaceCount = maximumPaidPlaceCount;
    paidPlaceCount >= 1;
    paidPlaceCount -= 1
  ) {
    const payouts = reconcilePayouts(inputs, paidPlaceCount);
    if (payouts && isValidSchedule(inputs, payouts)) {
      return {
        ok: true,
        payouts,
        paidPlaceCount: payouts.length,
        distributedTotal: inputs.totalPrizePool,
        paidPlaceCountReducedByRounding:
          paidPlaceCount < maximumPaidPlaceCount,
      };
    }
  }

  return calculationError(
    "no-valid-schedule",
    "No payout schedule can satisfy these settings.",
  );
}
