import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { calculatePayoutSchedule } from "./calculator";

const geometricSum = (ratio: number, count: number) =>
  Array.from({ length: count }, (_, index) => ratio ** index).reduce(
    (sum, weight) => sum + weight,
    0,
  );

const enumerateSchedules = (
  totalUnits: number,
  count: number,
  minimumUnits: number,
): number[][] => {
  const schedules: number[][] = [];

  const visit = (prefix: number[], remaining: number) => {
    if (prefix.length === count) {
      if (remaining === 0) schedules.push(prefix);
      return;
    }

    const placesLeft = count - prefix.length - 1;
    const maximum = Math.min(
      prefix.at(-1) ?? remaining,
      remaining - placesLeft * minimumUnits,
    );
    for (let value = maximum; value >= minimumUnits; value -= 1) {
      visit([...prefix, value], remaining - value);
    }
  };

  visit([], totalUnits);
  return schedules;
};

describe("calculatePayoutSchedule", () => {
  it("distributes a valid one-place total exactly", () => {
    expect(
      calculatePayoutSchedule({
        totalPrizePool: 200,
        payoutRatio: 1.87,
        minimumPayout: 200,
        roundingIncrement: 25,
      }),
    ).toEqual({
      ok: true,
      payouts: [200],
      paidPlaceCount: 1,
      distributedTotal: 200,
      paidPlaceCountReducedByRounding: false,
    });
  });

  it("uses the maximum ideal-qualified number of paid places", () => {
    expect(
      calculatePayoutSchedule({
        totalPrizePool: 700,
        payoutRatio: 2,
        minimumPayout: 100,
        roundingIncrement: 100,
      }),
    ).toMatchObject({
      ok: true,
      payouts: [400, 200, 100],
      paidPlaceCount: 3,
      distributedTotal: 700,
    });
  });

  it("supports equal ideal payouts at a ratio of 1.00", () => {
    expect(
      calculatePayoutSchedule({
        totalPrizePool: 600,
        payoutRatio: 1,
        minimumPayout: 200,
        roundingIncrement: 100,
      }),
    ).toMatchObject({ ok: true, payouts: [200, 200, 200] });
  });

  it("allows the final last payout to exceed a non-divisible minimum", () => {
    expect(
      calculatePayoutSchedule({
        totalPrizePool: 675,
        payoutRatio: 2,
        minimumPayout: 210,
        roundingIncrement: 25,
      }),
    ).toMatchObject({ ok: true, payouts: [450, 225] });
  });

  it("reconciles nearest rounding to preserve the exact total", () => {
    expect(
      calculatePayoutSchedule({
        totalPrizePool: 500,
        payoutRatio: 1.5,
        minimumPayout: 100,
        roundingIncrement: 25,
      }),
    ).toMatchObject({ ok: true, payouts: [250, 150, 100] });
  });

  it("favors the better-finishing place when error is equal", () => {
    expect(
      calculatePayoutSchedule({
        totalPrizePool: 125,
        payoutRatio: 1,
        minimumPayout: 50,
        roundingIncrement: 25,
      }),
    ).toMatchObject({ ok: true, payouts: [75, 50] });
  });

  it("reduces the paid-place count when rounding makes the maximum infeasible", () => {
    expect(
      calculatePayoutSchedule({
        totalPrizePool: 500,
        payoutRatio: 1,
        minimumPayout: 151,
        roundingIncrement: 25,
      }),
    ).toMatchObject({
      ok: true,
      payouts: [250, 250],
      paidPlaceCount: 2,
      paidPlaceCountReducedByRounding: true,
    });
  });

  it("preserves every final payout invariant across valid inputs", () => {
    fc.assert(
      fc.property(
        fc.record({
          roundingIncrement: fc.integer({ min: 1, max: 100 }),
          totalUnits: fc.integer({ min: 1, max: 200 }),
          minimumSeed: fc.integer({ min: 1, max: 200 }),
          payoutRatioHundredths: fc.integer({ min: 100, max: 300 }),
        }),
        ({
          roundingIncrement,
          totalUnits,
          minimumSeed,
          payoutRatioHundredths,
        }) => {
          const minimumUnits = 1 + ((minimumSeed - 1) % totalUnits);
          const inputs = {
            totalPrizePool: totalUnits * roundingIncrement,
            payoutRatio: payoutRatioHundredths / 100,
            minimumPayout: minimumUnits * roundingIncrement,
            roundingIncrement,
          };
          const result = calculatePayoutSchedule(inputs);

          expect(result.ok).toBe(true);
          if (!result.ok) return;
          expect(result.payouts.reduce((sum, payout) => sum + payout, 0)).toBe(
            inputs.totalPrizePool,
          );
          expect(
            result.payouts.every(
              (payout) => payout % inputs.roundingIncrement === 0,
            ),
          ).toBe(true);
          expect(
            result.payouts.every(
              (payout, index) =>
                index === 0 || result.payouts[index - 1] >= payout,
            ),
          ).toBe(true);
          expect(result.payouts.at(-1)).toBeGreaterThanOrEqual(
            inputs.minimumPayout,
          );
        },
      ),
    );
  });

  it("selects the maximum feasible place count and minimum-error schedule", () => {
    fc.assert(
      fc.property(
        fc.record({
          totalUnits: fc.integer({ min: 1, max: 12 }),
          minimumSeed: fc.integer({ min: 1, max: 300 }),
          payoutRatioHundredths: fc.integer({ min: 100, max: 200 }),
        }),
        ({ totalUnits, minimumSeed, payoutRatioHundredths }) => {
          const roundingIncrement = 25;
          const totalPrizePool = totalUnits * roundingIncrement;
          const minimumPayout = 1 + ((minimumSeed - 1) % totalPrizePool);
          const payoutRatio = payoutRatioHundredths / 100;
          const minimumUnits = Math.ceil(minimumPayout / roundingIncrement);
          let expectedCount = 1;

          for (let count = 1; count <= totalUnits; count += 1) {
            const idealLastPayout =
              totalPrizePool / geometricSum(payoutRatio, count);
            if (
              idealLastPayout + 1e-9 >= minimumPayout &&
              count * minimumUnits <= totalUnits
            ) {
              expectedCount = count;
            }
          }

          const weights = Array.from(
            { length: expectedCount },
            (_, index) => payoutRatio ** (expectedCount - index - 1),
          );
          const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
          const targets = weights.map(
            (weight) => (totalUnits * weight) / weightSum,
          );
          const candidates = enumerateSchedules(
            totalUnits,
            expectedCount,
            minimumUnits,
          ).map((units) => ({
            units,
            error: units.reduce(
              (sum, value, index) => sum + Math.abs(value - targets[index]),
              0,
            ),
          }));
          candidates.sort((left, right) => {
            const errorDifference = left.error - right.error;
            if (Math.abs(errorDifference) > 1e-9) return errorDifference;
            for (let index = 0; index < left.units.length; index += 1) {
              if (left.units[index] !== right.units[index]) {
                return right.units[index] - left.units[index];
              }
            }
            return 0;
          });

          const result = calculatePayoutSchedule({
            totalPrizePool,
            payoutRatio,
            minimumPayout,
            roundingIncrement,
          });
          expect(result.ok).toBe(true);
          if (!result.ok) return;
          expect(result.paidPlaceCount).toBe(expectedCount);
          expect(result.payouts.map((payout) => payout / roundingIncrement)).toEqual(
            candidates[0].units,
          );
        },
      ),
      { numRuns: 200 },
    );
  });

  it.each([
    [
      "an invalid total prize pool",
      { totalPrizePool: 0, payoutRatio: 1.87, minimumPayout: 200, roundingIncrement: 25 },
      "invalid-total-prize-pool",
    ],
    [
      "an invalid payout ratio",
      { totalPrizePool: 1_000, payoutRatio: 0.99, minimumPayout: 200, roundingIncrement: 25 },
      "invalid-payout-ratio",
    ],
    [
      "an over-precise payout ratio",
      { totalPrizePool: 1_000, payoutRatio: 1.875, minimumPayout: 200, roundingIncrement: 25 },
      "invalid-payout-ratio",
    ],
    [
      "an invalid minimum payout",
      { totalPrizePool: 1_000, payoutRatio: 1.87, minimumPayout: -1, roundingIncrement: 25 },
      "invalid-minimum-payout",
    ],
    [
      "an invalid rounding increment",
      { totalPrizePool: 1_000, payoutRatio: 1.87, minimumPayout: 200, roundingIncrement: 0 },
      "invalid-rounding-increment",
    ],
    [
      "a total below the minimum payout",
      { totalPrizePool: 100, payoutRatio: 1.87, minimumPayout: 200, roundingIncrement: 25 },
      "total-below-minimum",
    ],
    [
      "a total not divisible by the rounding increment",
      { totalPrizePool: 1_010, payoutRatio: 1.87, minimumPayout: 200, roundingIncrement: 25 },
      "total-not-divisible",
    ],
    [
      "a schedule over the operational limit",
      { totalPrizePool: 1_001, payoutRatio: 1, minimumPayout: 1, roundingIncrement: 1 },
      "schedule-limit",
    ],
  ])("rejects %s", (_description, inputs, expectedCode) => {
    expect(calculatePayoutSchedule(inputs)).toMatchObject({
      ok: false,
      code: expectedCode,
    });
  });

  it("rejects non-finite and unsafe numeric inputs", () => {
    expect(
      calculatePayoutSchedule({
        totalPrizePool: Number.MAX_SAFE_INTEGER + 1,
        payoutRatio: Number.POSITIVE_INFINITY,
        minimumPayout: 200,
        roundingIncrement: 25,
      }),
    ).toMatchObject({ ok: false, code: "invalid-total-prize-pool" });
  });
});
