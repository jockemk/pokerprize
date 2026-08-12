# Poker Tournament Payout Calculator

## Summary

Build a backendless single-page calculator that converts a poker tournament's total prize pool into a rounded payout schedule. The calculator is intended exclusively for Safari on iPhone and produces the maximum qualifying number of paid places while preserving the chosen payout ratio, minimum payout, rounding increment, and exact total.

## Product boundary

The first version provides one calculator page with inputs, inline validation, an immediately calculated payout schedule, a result summary, and a reset action.

It does not include accounts, saved tournaments, browser persistence, import or export, URL sharing, provider-specific deployment, service workers, installation prompts, or other PWA behavior. It produces a static build that can be hosted without a backend.

## Inputs

### Total prize pool

- Positive whole NOK.
- Initially blank.
- Must be at least the minimum payout.
- Must be divisible by the rounding increment so every payout can be rounded while the schedule still distributes the exact total.
- Must be a JavaScript safe integer.

### Payout ratio

- Target ratio between adjacent payouts in the ideal payout schedule.
- Default: `1.87`.
- Minimum: `1.00`.
- At most two decimal places.
- Accept both comma and period as the decimal separator.
- Must be finite.

### Minimum payout

- Positive whole NOK.
- Default: `200`.
- Applies to the final payout for the last paid place as well as to the corresponding ideal payout.
- Does not need to be divisible by the rounding increment. The lowest possible final payout is therefore the smallest multiple of the rounding increment that meets the minimum.
- Must be a JavaScript safe integer.

### Rounding increment

- Positive whole NOK.
- Default: `25`.
- Must be a JavaScript safe integer.

Money inputs use plain whole-number entry without currency symbols or grouping separators. The payout-ratio input uses an iPhone-appropriate decimal keypad.

## Calculation model

For a candidate count of `n` paid places, construct an ideal payout schedule as a geometric sequence:

- Each better-finishing place receives exactly `payout ratio ×` the next place's ideal payout.
- Scale the sequence so that all ideal payouts sum to the total prize pool.
- A ratio of `1.00` produces equal ideal payouts.

The qualifying paid-place count is the greatest `n` for which:

1. The last ideal payout meets the minimum payout.
2. A final rounded payout schedule exists that meets every final-schedule invariant.

If rounding makes the largest ideal-qualified count infeasible, retry with one fewer paid place until a valid schedule is found. A single paid place receiving the entire total prize pool is valid when the total meets all input constraints.

The calculator must reject rather than generate or display a schedule of more than 1,000 paid places. The message must identify this as the app's schedule limit and suggest increasing the minimum payout or payout ratio.

## Rounding and reconciliation

Create the final payout schedule from the ideal payout schedule by selecting rounded payouts that minimize the sum of absolute NOK differences from their corresponding ideal payouts.

The optimizer may move a payout more than one increment away from ordinary nearest rounding when required to satisfy the invariants. When multiple valid adjustments have equal error, favor the better-finishing place.

Every successful final payout schedule must:

- Contain only whole-NOK payouts that are multiples of the rounding increment.
- Be non-increasing by finishing place; adjacent places may tie because of rounding.
- Give the last paid place at least the minimum payout.
- Sum exactly to the total prize pool.
- Use the maximum qualifying paid-place count.

Money must never be created, discarded, or left undistributed.

## Interaction and validation

- Recalculate immediately whenever all inputs are valid.
- Hide a previous result whenever the current inputs are invalid.
- Avoid flashing errors during a potentially valid partial edit, such as `1,` in the payout-ratio field.
- Show an error after an invalid field loses focus or as soon as its value is definitively invalid.
- Present errors next to the relevant input.
- Never silently coerce an invalid value or truncate a result.
- Reset clears the total prize pool and restores payout ratio `1.87`, minimum payout `200`, and rounding increment `25`.

If rounding causes the final schedule to use fewer paid places than the largest ideal-qualified candidate, show a short note explaining that the count was reduced to preserve the minimum payout and exact total.

## Results

Display the final payout schedule as an ordered table. Each row contains:

- A place label using `#1`, `#2`, and so on.
- A payout formatted in NOK using the `nb-NO` locale, for example `1 250 kr`.

Also display:

- The number of paid places.
- A confirmation in the form `Distributed: 10 000 kr of 10 000 kr`.

Do not expose ideal payouts, raw calculation details, or rounding-error measurements in the interface.

## Visual and device scope

- Compact, single-column design optimized for an iPhone portrait viewport around 390 CSS pixels wide.
- Fluid layout through current iPhone widths, capped at 430 CSS pixels and centered on wider screens.
- Keep the same single-column layout in landscape without dedicated landscape optimization.
- Dark-green palette, restrained gold accents, and strong contrast.
- Poker-inspired but utilitarian, with no decorative casino imagery.
- One compact input card followed by one results card.

Support the current and previous major iOS Safari releases. There is no dedicated design or testing requirement for iPad, desktop, legacy browsers, physical-keyboard navigation, screen readers, or WCAG conformance. Retain visible labels, ordinary semantic form controls, readable validation, and suitable iPhone on-screen keyboard modes as baseline usability.

## Technical direction

- Vite, React, and TypeScript.
- Keep calculation and reconciliation logic in framework-independent pure functions.
- Produce a static production build.
- Do not add a backend or provider-specific hosting configuration.

## Verification

### Calculation tests

Use Vitest for focused examples and property-based coverage. Verify, across valid generated inputs, that:

- The payouts sum to the exact total prize pool.
- Every payout is a multiple of the rounding increment.
- Payouts are non-increasing.
- The last payout meets the minimum.
- The selected paid-place count is maximal under the qualification rules.
- Equal-error reconciliation favors the better-finishing place.
- Ratio `1.00`, a single-place result, a non-divisible total, a non-divisible minimum, and rounding-induced place reduction behave as specified.
- Unsafe, non-finite, malformed, and out-of-range inputs are rejected.
- Results over 1,000 paid places are rejected without attempting to render them.

### Browser tests

Run a small WebKit suite at an iPhone-sized viewport covering:

- Initial default values and guidance before a total is entered.
- Valid entry and immediate recalculation.
- Comma and period ratio input.
- Validation timing and stale-result removal.
- Exact-distribution confirmation.
- A rounding-reconciliation scenario.
- The rounding-induced place-count note.
- Reset behavior.

## Acceptance criteria

The feature is complete when a user can enter valid values in iPhone Safari and receive a deterministic payout schedule satisfying every calculation invariant, with the exact total visibly confirmed, invalid inputs handled as specified, and the automated calculation and browser suites passing.
