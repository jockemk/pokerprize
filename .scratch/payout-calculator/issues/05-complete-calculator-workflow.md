# 05 — Complete the calculator workflow

**What to build:** Complete the organizer's end-to-end calculation workflow with useful initial guidance, transparent result feedback, and a reliable reset. Successful and unsuccessful scenarios should use consistent domain language and concise iPhone-friendly presentation.

**Blocked by:** 03 — Reconcile rounded payouts to the exact total; 04 — Handle localized entry and invalid states.

**Status:** ready-for-agent

- [ ] Before a total prize pool is entered, the app shows concise guidance instead of an empty payout table.
- [ ] Successful results show final actionable payouts only; ideal payouts and rounding-error measurements remain hidden.
- [ ] Place labels use `#1`, `#2`, and so on throughout the payout schedule.
- [ ] The result shows the number of paid places and a confirmation such as `Distributed: 10 000 kr of 10 000 kr`.
- [ ] When rounding forces a lower paid-place count, the app explains that the reduction preserves the minimum payout and exact total.
- [ ] Reset clears the total prize pool and restores payout ratio `1.87`, minimum payout `200`, and rounding increment `25`.
- [ ] Reset removes any prior errors and payout schedule and returns the app to its initial guidance state.
- [ ] Browser tests verify initial guidance, a reconciled result, exact-distribution confirmation, the paid-place reduction note, and reset behavior.
- [ ] The full calculator and browser test suites remain green when the two parallel prerequisite slices are integrated.
