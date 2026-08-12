# Show Payout Shares as Percentages

Status: ready-for-agent

## Problem Statement

Poker tournament organizers can see the NOK payout assigned to each paid place, but they cannot quickly see how much of the total prize pool each payout represents. Comparing payout schedules therefore requires mental arithmetic, especially when evaluating how strongly a payout schedule favors the better-finishing paid places.

The organizer needs a compact, truthful percentage beside every payout without losing the place ordering, NOK amount, or iPhone-friendly layout that makes the existing payout schedule easy to scan.

## Solution

Show each payout's share of the distributed total beside its NOK amount in the payout schedule. Format the share as a Norwegian-localized percentage with no more than one decimal place. Show a one-place payout as `100 %`, and represent every positive share below the display precision as `<0,1 %` rather than rounding it to the misleading value `0 %`.

Keep the percentage as supporting information within each existing paid-place row. Preserve the current row-only table structure and compact layout across supported iPhone portrait and landscape viewports.

## User Stories

1. As a poker tournament organizer, I want to see each payout as a share of the total prize pool, so that I can understand the shape of the payout schedule at a glance.
2. As a poker tournament organizer, I want the percentage shown beside the NOK payout, so that I can compare the relative and absolute values without switching views.
3. As a poker tournament organizer, I want every paid place to show a payout share, so that the payout schedule is complete and internally consistent.
4. As a poker tournament organizer, I want payout shares calculated from the distributed total, so that the displayed proportions describe the payout schedule that will actually be paid.
5. As a poker tournament organizer, I want a one-place payout schedule to show `100 %`, so that the percentage remains intuitive in the smallest valid schedule.
6. As a poker tournament organizer, I want percentages displayed with at most one decimal place, so that the schedule remains compact and easy to scan.
7. As a Norwegian user, I want payout shares formatted with Norwegian percentage conventions, so that decimal separators and spacing look natural.
8. As a poker tournament organizer, I want a positive share below one tenth of one percent shown as `<0,1 %`, so that a real payout is never presented as `0 %`.
9. As a poker tournament organizer, I want ordinary payout shares rounded consistently, so that equivalent schedules are presented predictably.
10. As a poker tournament organizer, I want the existing place label and NOK payout to remain prominent, so that percentages add context without replacing actionable payout information.
11. As a poker tournament organizer, I want payout shares to update with the payout schedule whenever settings change, so that no percentage describes stale inputs.
12. As a poker tournament organizer, I want payout shares hidden whenever the current inputs do not produce a valid payout schedule, so that I cannot mistake stale proportions for a current result.
13. As an iPhone user, I want the additional percentage to fit inside each payout row in portrait, so that the page does not require horizontal scrolling.
14. As an iPhone user, I want the additional percentage to remain usable in landscape, so that rotating the phone does not break the payout schedule.
15. As a user of assistive technology, I want each paid place to remain one semantic table row with its place label, NOK payout, and payout share, so that the new information retains its relationship to the correct paid place.
16. As a poker tournament organizer, I want the payout schedule to remain free of an unnecessary header row, so that the compact interface does not grow merely to explain familiar values.
17. As a poker tournament organizer, I want reset and validation behavior to remain unchanged, so that adding payout shares does not alter the established calculation workflow.
18. As a poker tournament organizer, I want the distributed-total confirmation to remain visible, so that payout shares supplement rather than replace exact-total verification.

## Implementation Decisions

- Derive each payout share in the presentation layer from the payout and the successful calculation's distributed total. Do not change the calculator boundary or add percentage values to its result contract.
- Use the distributed total as the denominator. A successful payout schedule already guarantees that this value equals the total prize pool, and using the successful result keeps the presentation tied to the schedule being rendered.
- Format percentages with the `nb-NO` locale, percentage style, and at most one fractional digit.
- Display any positive share below `0.1%` as `<0,1 %`. Do not display such a payout as `0 %`.
- Render the payout share as a third cell in every existing paid-place row, after the place label and NOK payout.
- Keep the place label as the row header. Do not add column headers solely for this feature.
- Style the payout share as secondary information while preserving enough contrast and space to read it on supported iPhone viewports.
- Preserve the existing behavior in which the entire payout schedule disappears when the current inputs are invalid.
- Preserve current calculation, rounding reconciliation, reset, validation, and distributed-total behavior.

## Testing Decisions

- Test externally visible behavior rather than the formatter implementation, locale API calls, CSS classes, or arithmetic helpers.
- Use one high-level seam: the rendered SPA in the existing WebKit browser suite. This is the highest seam that observes localized formatting, row association, responsive containment, and interaction-driven updates together.
- Extend the existing clean multi-place payout-schedule workflow to assert representative shares for the first, middle, and last paid places.
- Cover a one-place payout schedule and assert that its only row shows `100 %`.
- Cover a valid schedule whose last paid place has a positive share below `0.1%` and assert that the row shows `<0,1 %`, not `0 %`.
- Verify the payout schedule remains contained within the existing iPhone portrait and landscape layout after the additional cells are rendered.
- Preserve the table's existing semantic structure by verifying that no column-header row is introduced and that each payout share is contained in its corresponding paid-place row.
- Rely on the existing browser tests for invalid-input stale-result removal, immediate recalculation, reset, NOK formatting, paid-place ordering, and distributed-total confirmation; do not duplicate those workflows solely for payout shares.
- Do not add tests at the pure calculator boundary because payout shares do not change payout-schedule calculation or its public result contract.
- Prior art is the repository's existing WebKit coverage for localized payout rendering, full organizer workflows, and iPhone portrait and landscape containment.

## Out of Scope

- Changing how the payout schedule, paid-place count, payout ratio, minimum payout, or rounding increment is calculated.
- Adding percentages to the pure calculator result contract.
- Showing shares of the ideal payout schedule or exposing other calculation internals.
- Adding charts, progress bars, pie charts, or other visualizations of the payout distribution.
- Allowing the user to configure percentage precision or locale.
- Showing cumulative payout shares or differences between adjacent paid places.
- Replacing NOK payouts or the distributed-total confirmation with percentages.
- Adding sorting, filtering, export, print, or sharing behavior.
- Redesigning the payout table, adding a dedicated header row, or changing the established iPhone layout.
- Claiming formal accessibility conformance beyond preserving the existing semantic row relationships.

## Further Notes

- Use the domain terms **total prize pool**, **payout schedule**, **paid place**, and **payout** consistently. “Payout share” is presentation language for a payout divided by the distributed total; it is not currently a defined domain concept.
- The display threshold is strictly for positive values below `0.1%`. A successful payout schedule cannot contain a zero payout.
- The single rendered-SPA test seam is inferred from the feature's presentation-only scope and the repository's existing tests. No conversation context was available to confirm it separately without violating the skill's no-interview instruction.
- No ADR governs or is needed for this localized presentation change.
