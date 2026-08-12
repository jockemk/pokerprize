# 04 — Handle localized entry and invalid states

**What to build:** Let an organizer edit all calculator inputs naturally on an iPhone while receiving precise, timely feedback for malformed or infeasible values. Invalid edits must never leave a stale payout schedule visible, and impractically large schedules must be rejected with useful guidance.

**Blocked by:** 02 — Generate ideal multi-place payout schedules.

**Status:** ready-for-agent

- [ ] The payout ratio accepts comma or period as its decimal separator and supports at most two decimal places.
- [ ] The payout ratio must be finite and at least `1.00`.
- [ ] Money and rounding inputs accept positive whole NOK values that are JavaScript safe integers.
- [ ] Zero, negative, malformed, non-finite, unsafe, and out-of-range inputs produce relevant validation errors.
- [ ] The total prize pool must be at least the minimum payout and divisible by the rounding increment.
- [ ] A potentially valid partial edit does not show a premature error; an invalid value is shown after blur or as soon as it is definitively invalid.
- [ ] Validation appears next to the relevant input and the previous payout schedule is hidden whenever current inputs are invalid.
- [ ] The app never silently coerces an invalid value or displays a partial schedule.
- [ ] A schedule requiring more than 1,000 paid places is rejected without being generated or truncated.
- [ ] The over-limit error suggests increasing the minimum payout or payout ratio.
- [ ] Pure-boundary tests cover invalid domain inputs and the 1,000-place limit.
- [ ] Browser tests cover comma and period entry, validation timing, field-level messages, stale-result removal, and the over-limit guidance.
