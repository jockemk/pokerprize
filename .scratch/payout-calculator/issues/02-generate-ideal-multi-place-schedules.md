# 02 — Generate ideal multi-place payout schedules

**What to build:** Extend the working calculator so an organizer receives the maximum qualifying multi-place payout schedule when the geometric ideal already maps cleanly to the chosen rounding increment. The result must honor the payout ratio, minimum payout, ordering, and exact total from input through the displayed schedule.

**Blocked by:** 01 — Bootstrap a one-place payout flow.

**Status:** ready-for-agent

- [ ] For each candidate paid-place count, the ideal payout schedule is a geometric sequence scaled to the total prize pool.
- [ ] Adjacent ideal payouts use the exact payout ratio, and ratio `1.00` produces equal ideal payouts.
- [ ] The calculator selects the greatest candidate count whose last ideal payout meets the minimum payout.
- [ ] Cleanly representable multi-place schedules display every paid place as `#1`, `#2`, and so on.
- [ ] Successful displayed payouts are multiples of the rounding increment, are non-increasing, meet the minimum payout, and sum to the exact total prize pool.
- [ ] A minimum payout that is not divisible by the rounding increment remains valid when the final last payout is the next qualifying increment.
- [ ] Focused and property-based tests verify geometric distribution, ratio `1.00`, ordering, minimum qualification, exact totals, and maximum paid-place selection through the pure calculator boundary.
- [ ] A browser test verifies a cleanly representable multi-place result through the rendered app.
