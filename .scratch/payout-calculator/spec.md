# Poker Tournament Payout Calculator

Status: ready-for-agent

## Problem Statement

Poker tournament organizers need to divide a total prize pool into a practical payout schedule without manually calculating a geometric distribution, checking the minimum payout, rounding every amount to usable denominations, and reconciling rounding differences. Manual calculations make it easy to distribute the wrong total, violate the intended payout ratio, or pay the last place less than the allowed minimum.

The organizer needs a fast, deterministic calculator designed for Safari on an iPhone. It must work without a backend and must visibly account for every NOK in the total prize pool.

## Solution

Provide a compact single-page calculator with four inputs: total prize pool, payout ratio, minimum payout, and rounding increment. It constructs an ideal payout schedule as a geometric sequence, finds the maximum qualifying number of paid places, and produces a final payout schedule whose rounded payouts sum exactly to the total prize pool.

The result updates immediately when the inputs are valid. It lists each paid place as `#1`, `#2`, and so on, formats payouts as NOK, and confirms that the entire total prize pool has been distributed. Invalid or infeasible input produces specific inline guidance instead of a stale or partial schedule.

## User Stories

1. As a poker tournament organizer, I want to enter the total prize pool in whole NOK, so that I can calculate how the available money should be distributed.
2. As a poker tournament organizer, I want the total prize pool to start blank, so that I do not mistake example data for my tournament's value.
3. As a poker tournament organizer, I want a default payout ratio of `1.87`, so that I can quickly use the standard distribution without entering every setting.
4. As a poker tournament organizer, I want to change the payout ratio, so that I can control how strongly payouts increase toward first place.
5. As a poker tournament organizer, I want to use a payout ratio of `1.00`, so that I can produce equal ideal payouts when needed.
6. As a Norwegian iPhone user, I want to enter the payout ratio with either a comma or a period, so that the calculator works naturally with my numeric keyboard.
7. As a poker tournament organizer, I want the payout ratio limited to two decimal places, so that its precision is predictable.
8. As a poker tournament organizer, I want a default minimum payout of NOK 200, so that the standard floor is ready immediately.
9. As a poker tournament organizer, I want to change the minimum payout, so that the schedule follows the rules of my tournament.
10. As a poker tournament organizer, I want a default rounding increment of NOK 25, so that payouts use practical cash denominations by default.
11. As a poker tournament organizer, I want to change the rounding increment, so that payouts match the denominations available to me.
12. As a poker tournament organizer, I want the largest valid number of paid places, so that as many finishing positions as possible receive money without weakening the agreed distribution rules.
13. As a poker tournament organizer, I want adjacent ideal payouts to follow the payout ratio exactly, so that the intended distribution has an unambiguous mathematical basis.
14. As a poker tournament organizer, I want the ideal payout schedule scaled to the total prize pool, so that its proportions describe the complete amount available.
15. As a poker tournament organizer, I want both the ideal and final last payouts to meet the minimum payout, so that rounding cannot create an impermissibly small award.
16. As a poker tournament organizer, I want the calculator to retry with one fewer paid place when rounding makes a candidate infeasible, so that I still receive a valid schedule.
17. As a poker tournament organizer, I want a one-place payout schedule to be valid, so that a small qualifying total can still be distributed.
18. As a poker tournament organizer, I want every final payout to be a multiple of the rounding increment, so that every displayed amount is actually payable in the chosen denomination.
19. As a poker tournament organizer, I want payouts to remain non-increasing by finishing place, so that a worse-finishing player never receives more than a better-finishing player.
20. As a poker tournament organizer, I want adjacent payouts to be allowed to tie after rounding, so that practical denominations do not unnecessarily reduce the number of paid places.
21. As a poker tournament organizer, I want rounding reconciliation to minimize total absolute NOK deviation from the ideal payout schedule, so that the final result remains as faithful as possible to the intended distribution.
22. As a poker tournament organizer, I want equal-error reconciliation choices to favor the better-finishing place, so that ambiguous cases resolve deterministically and consistently with tournament ranking.
23. As a poker tournament organizer, I want the final payouts to sum exactly to the total prize pool, so that no money is created, discarded, or left undistributed.
24. As a poker tournament organizer, I want a clear error when the total prize pool is not divisible by the rounding increment, so that I understand why an exact rounded schedule cannot be produced.
25. As a poker tournament organizer, I want a minimum payout that is not divisible by the rounding increment to remain valid, so that the final last payout can use the next qualifying increment.
26. As a poker tournament organizer, I want invalid, non-finite, unsafe, or out-of-range values rejected, so that the displayed schedule is trustworthy.
27. As a poker tournament organizer, I want the total prize pool to be at least the minimum payout, so that every successful schedule can pay at least one place legally.
28. As a poker tournament organizer, I want a clear error when a schedule would exceed 1,000 paid places, so that the app remains responsive instead of truncating or attempting an impractical result.
29. As a poker tournament organizer, I want an over-limit message to suggest raising the minimum payout or payout ratio, so that I know how to produce a smaller schedule.
30. As a poker tournament organizer, I want results to update immediately when all inputs are valid, so that I can compare scenarios quickly.
31. As a poker tournament organizer, I want validation to avoid interrupting a potentially valid partial edit, so that entering a value such as `1,87` feels natural.
32. As a poker tournament organizer, I want an invalid field explained after I leave it or once it becomes definitively invalid, so that errors are timely without being distracting.
33. As a poker tournament organizer, I want stale results hidden whenever current inputs are invalid, so that I cannot mistake an old schedule for the current calculation.
34. As a poker tournament organizer, I want validation next to the relevant input, so that I can quickly identify what needs correction.
35. As a poker tournament organizer, I want a note when rounding forces one fewer paid place, so that the result does not appear arbitrary.
36. As a poker tournament organizer, I want the final payout schedule shown as a simple ordered table, so that I can read each place and payout quickly.
37. As a poker tournament organizer, I want place labels shown as `#1`, `#2`, and so on, so that the ranking is compact and unambiguous.
38. As a Norwegian user, I want payout amounts formatted in NOK using Norwegian grouping conventions, so that the values are easy to read.
39. As a poker tournament organizer, I want to see the paid-place count, so that I know how many players receive a payout.
40. As a poker tournament organizer, I want confirmation of the distributed amount against the total prize pool, so that I can verify at a glance that the schedule accounts for every NOK.
41. As a poker tournament organizer, I want only actionable final payouts shown, so that unrounded mathematical details do not clutter the workflow.
42. As a poker tournament organizer, I want to reset the calculator, so that I can clear the total prize pool and restore the default ratio, minimum, and rounding increment.
43. As an iPhone user, I want controls that invoke suitable on-screen numeric keyboards, so that entering values is efficient.
44. As an iPhone user, I want a compact portrait-oriented single-column layout, so that the entire calculator is comfortable to use on my phone.
45. As an iPhone user, I want the layout to work across current iPhone widths up to 430 CSS pixels, so that it remains usable on different current devices.
46. As an iPhone user, I want the same single-column interface to remain usable in landscape, so that rotating the phone does not break the calculator.
47. As a tournament organizer, I want a focused poker-inspired visual design, so that the calculator feels appropriate without decorative casino imagery obscuring its purpose.
48. As a tournament organizer, I want the calculator delivered as a static client-side app, so that it can be hosted without operating a backend.

## Implementation Decisions

- Build the app with Vite, React, and TypeScript and produce a static production bundle.
- Keep calculation and reconciliation behind one framework-independent pure boundary. It accepts validated total prize pool, payout ratio, minimum payout, and rounding increment values and returns either a complete result or a typed domain error.
- Keep text-entry parsing and interaction validation outside the pure calculator. Comma and period decimal separators normalize to the same payout-ratio value.
- Treat whole-NOK inputs as positive JavaScript safe integers. Reject non-finite, unsafe, malformed, zero, and negative values. The payout ratio must be finite, at least `1.00`, and have at most two decimal places.
- Require the total prize pool to be at least the minimum payout and divisible by the rounding increment.
- Construct each candidate ideal payout schedule as a geometric sequence whose adjacent ratio is the payout ratio and whose sum is the total prize pool. A ratio of `1.00` produces equal values.
- Find the greatest candidate paid-place count whose last ideal payout meets the minimum payout and for which a valid final payout schedule exists.
- Reject a calculation if it would require more than 1,000 paid places. Do not truncate or partially render it.
- Produce the final payout schedule by selecting multiples of the rounding increment that minimize the sum of absolute NOK deviations from the ideal payout schedule.
- Allow reconciliation to move a payout more than one increment away from ordinary nearest rounding when required to satisfy all invariants.
- Resolve equal-error alternatives by favoring the better-finishing place.
- Guarantee that final payouts are non-increasing, may tie, meet the minimum at the last paid place, and sum exactly to the total prize pool.
- Retry with one fewer paid place when rounding makes the current ideal-qualified candidate infeasible. Report whether this reduction occurred so the interface can explain it.
- Permit a one-place payout schedule when all input constraints are satisfied.
- Recalculate during editing whenever all inputs are valid. Hide the previous result whenever they are not.
- Delay validation feedback for potentially valid partial edits until blur, while showing definitively invalid states immediately.
- Never silently coerce invalid values, truncate schedules, or display a partial payout schedule.
- Initialize the total prize pool as blank and the other inputs as payout ratio `1.87`, minimum payout `200`, and rounding increment `25`.
- Reset to that same initial state.
- Format final payouts with the `nb-NO` locale and NOK currency conventions. Label places as `#1`, `#2`, and so on.
- Show the number of paid places and an exact-distribution confirmation such as `Distributed: 10 000 kr of 10 000 kr`.
- Do not expose the ideal payout schedule or error measurements in the interface.
- Show a concise explanation when rounding forces a lower paid-place count.
- Show an actionable error for the 1,000-place technical limit that suggests increasing the minimum payout or payout ratio.
- Use a compact single-column interface with one input card followed by one results card. Make it fluid through 430 CSS pixels, optimize around 390 CSS pixels in portrait, and center it at a maximum width of 430 CSS pixels on larger viewports.
- Retain the same usable single-column layout in landscape without creating a dedicated landscape layout.
- Use a dark-green palette, restrained gold accents, and strong contrast without decorative casino imagery.
- Target the current and previous major iOS Safari releases.
- Use visible labels, semantic form controls, readable validation, and suitable iPhone input modes as baseline usability. Do not claim or test formal accessibility conformance.
- Do not add a backend or provider-specific hosting configuration.

## Testing Decisions

- Test external behavior and domain guarantees rather than internal helper functions or a particular reconciliation implementation.
- Use two high-level seams: the pure calculator boundary for exhaustive domain behavior and the rendered SPA for complete user workflows. Add no lower-level seams unless a defect cannot be reproduced clearly at either boundary.
- Use Vitest for focused calculator examples and property-based tests over valid generated inputs.
- At the calculator seam, assert that every successful result distributes the exact total, uses only rounding-increment multiples, is non-increasing, meets the minimum payout, and selects the maximum qualifying paid-place count.
- At the calculator seam, cover ratio `1.00`, a single-place schedule, a minimum not divisible by the rounding increment, a total not divisible by the increment, equal-error tie-breaking, and a candidate count reduced by rounding.
- At the calculator seam, cover malformed, non-finite, unsafe, zero, negative, and out-of-range inputs as well as schedules exceeding 1,000 paid places.
- At the browser seam, use WebKit with an iPhone-sized viewport to cover initial defaults and guidance, valid entry, immediate recalculation, comma and period ratio entry, validation timing, stale-result removal, result formatting, exact-distribution confirmation, rounding reconciliation, the paid-place reduction note, the technical-limit error, and reset.
- Do not assert component structure, CSS class names, private helper calls, intermediate ideal values, or a particular optimization algorithm when the same behavior can be verified through the two public seams.
- There is no existing application or test suite to use as prior art; this is a greenfield repository. Establish these seams as the initial testing convention.

## Out of Scope

- A backend, database, accounts, authentication, or server-side calculation.
- Saving tournaments or calculator state in browser storage.
- Import, export, printing, or downloadable reports.
- URL-encoded shareable state or other sharing features.
- Provider-specific deployment configuration or a deployment pipeline.
- Service workers, offline installation, installation prompts, or PWA behavior.
- Dedicated layouts or compatibility work for desktop, iPad, legacy browsers, or Android browsers.
- Dedicated landscape optimization.
- Physical-keyboard workflows or keyboard-only navigation testing.
- Screen-reader testing, WCAG conformance work, or an accessibility-conformance claim.
- Showing ideal payouts, calculation internals, or rounding-error measurements to users.
- Schedules containing more than 1,000 paid places.
- Arbitrary business maximums below JavaScript's numeric safety boundaries.

## Further Notes

- The canonical domain vocabulary is defined in the repository glossary. Use **total prize pool**, **ideal payout schedule**, **payout schedule**, **paid place**, **payout**, **payout ratio**, **minimum payout**, and **rounding increment** consistently.
- The 1,000-place ceiling is an operational safety limit, not a poker tournament business rule.
- The minimum payout is a floor rather than a denomination. For example, a NOK 210 minimum with a NOK 25 rounding increment permits a final last payout of NOK 225.
- The user explicitly confirmed the calculation, interaction, visual, device, implementation, and testing decisions through a design interview before this spec was published.
- No ADR is needed for the current decisions: the repository is greenfield, the backendless SPA boundary was an initial requirement, and no surprising hard-to-reverse trade-off has been selected.
