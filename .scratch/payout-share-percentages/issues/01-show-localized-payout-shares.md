# 01 — Show localized payout shares in the payout schedule

**What to build:** Show each payout's share of the distributed total beside its NOK amount so a poker tournament organizer can understand the payout schedule's proportions at a glance. The shares must remain truthful at the limits of the display precision and preserve the existing compact, semantic iPhone experience.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Every paid-place row shows a payout share after its NOK payout.
- [ ] Each payout share is derived from that row's payout and the successful payout schedule's distributed total without changing the calculator result contract.
- [ ] Payout shares use Norwegian percentage formatting with at most one decimal place.
- [ ] A one-place payout schedule shows `100 %`.
- [ ] Every positive payout share below `0.1%` shows `<0,1 %` instead of `0 %`.
- [ ] The place label remains the semantic row header, and no column-header row is added.
- [ ] Payout shares update and disappear with the payout schedule under the existing valid-input, invalid-input, and reset behavior.
- [ ] The place label and NOK payout remain prominent while the payout share is presented as readable supporting information.
- [ ] The payout schedule remains contained without horizontal scrolling at the supported iPhone portrait and landscape viewports.
- [ ] Browser tests verify representative multi-place shares, a one-place `100 %` share, the `<0,1 %` threshold, semantic row association, and responsive containment through the rendered SPA.
- [ ] Existing calculation, validation, reset, NOK formatting, paid-place ordering, and distributed-total behavior remain unchanged.
