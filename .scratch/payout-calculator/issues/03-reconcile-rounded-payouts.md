# 03 — Reconcile rounded payouts to the exact total

**What to build:** Make the calculator produce a valid, deterministic payout schedule when ordinary per-place rounding does not preserve the total prize pool. The organizer should receive the closest possible rounded distribution, or a schedule with fewer paid places when the larger candidate cannot satisfy every rule.

**Blocked by:** 02 — Generate ideal multi-place payout schedules.

**Status:** ready-for-agent

- [ ] Final payouts are selected from multiples of the rounding increment and sum exactly to the total prize pool.
- [ ] The selected schedule minimizes the sum of absolute NOK deviations from the ideal payout schedule among all valid schedules.
- [ ] Reconciliation may move a payout more than one increment from ordinary nearest rounding when required by the invariants.
- [ ] Final payouts remain non-increasing and adjacent places may tie.
- [ ] The final last payout meets the minimum payout.
- [ ] Equal-error alternatives deterministically favor the better-finishing place.
- [ ] If the largest ideal-qualified candidate is infeasible after rounding, the calculator retries with one fewer paid place until it finds a valid schedule.
- [ ] The calculation result reports whether rounding reduced the paid-place count so a later interface slice can explain it.
- [ ] Focused tests cover reconciliation, tied payouts, better-place tie-breaking, and rounding-induced paid-place reduction through the pure boundary.
- [ ] Property-based tests verify exact total, increment membership, non-increasing order, minimum payout, and maximum feasible paid-place count across generated valid inputs.
