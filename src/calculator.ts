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

export const PAYOUT_ERROR_MESSAGES = {
  positiveWholeNok: "Enter a positive whole NOK amount.",
  payoutRatio:
    "Enter a payout ratio of 1.00 or more with up to two decimals.",
} as const;

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
      PAYOUT_ERROR_MESSAGES.positiveWholeNok,
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
      PAYOUT_ERROR_MESSAGES.payoutRatio,
      "payoutRatio",
    );
  }
  if (!isPositiveSafeInteger(inputs.minimumPayout)) {
    return calculationError(
      "invalid-minimum-payout",
      PAYOUT_ERROR_MESSAGES.positiveWholeNok,
      "minimumPayout",
    );
  }
  if (!isPositiveSafeInteger(inputs.roundingIncrement)) {
    return calculationError(
      "invalid-rounding-increment",
      PAYOUT_ERROR_MESSAGES.positiveWholeNok,
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

  while (true) {
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

  while (unitDifference !== 0) {
    const direction = unitDifference > 0 ? 1 : -1;
    let bestIndex = -1;
    let bestMarginalError = Number.POSITIVE_INFINITY;

    for (let offset = 0; offset < units.length; offset += 1) {
      const index = direction === 1 ? offset : units.length - offset - 1;
      const canAdjust =
        direction === 1
          ? index === 0 || units[index] < units[index - 1]
          : units[index] > minimumUnits &&
            (index === units.length - 1 || units[index] > units[index + 1]);
      if (!canAdjust) continue;

      const currentError = Math.abs(units[index] - targets[index]);
      const adjustedError = Math.abs(
        units[index] + direction - targets[index],
      );
      const marginalError = adjustedError - currentError;

      if (marginalError < bestMarginalError - Number.EPSILON) {
        bestMarginalError = marginalError;
        bestIndex = index;
      }
    }

    if (bestIndex === -1) return null;
    units[bestIndex] += direction;
    unitDifference -= direction;
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
  const minimumUnits = Math.ceil(
    inputs.minimumPayout / inputs.roundingIncrement,
  );
  const totalUnits = inputs.totalPrizePool / inputs.roundingIncrement;
  const maximumRoundedPaidPlaceCount = Math.min(
    maximumPaidPlaceCount,
    Math.floor(totalUnits / minimumUnits),
  );

  if (maximumRoundedPaidPlaceCount > 1_000) {
    return calculationError(
      "schedule-limit",
      "This schedule exceeds the 1,000-place limit. Increase the minimum payout or payout ratio.",
    );
  }

  const payouts = reconcilePayouts(inputs, maximumRoundedPaidPlaceCount);
  if (payouts && isValidSchedule(inputs, payouts)) {
    return {
      ok: true,
      payouts,
      paidPlaceCount: payouts.length,
      distributedTotal: inputs.totalPrizePool,
      paidPlaceCountReducedByRounding:
        maximumRoundedPaidPlaceCount < maximumPaidPlaceCount,
    };
  }

  return calculationError(
    "no-valid-schedule",
    "No payout schedule can satisfy these settings.",
  );
}
