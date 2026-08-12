# Copy Payout Schedule as an Image

Status: ready-for-agent

## Problem Statement

Poker tournament organizers can calculate and view a payout schedule, but they cannot move that result into a message, document, or other tool without manually transcribing it or taking and cropping a screenshot. A screenshot can accidentally include calculator inputs or controls and may omit part of a long payout schedule.

The organizer needs a quick way to copy the complete result as a clear PNG image directly from the calculator while keeping inputs and copy controls out of the image.

## Solution

Add a **Copy image** control at the end of a valid result. Activating it renders the complete results card as one solid-background PNG, including its heading, paid-place count, every payout row, distributed-total confirmation, and optional paid-place-reduction note. It excludes the calculator inputs and the copy control itself.

The app writes the PNG to the system clipboard when image clipboard access is available. If the PNG was created but clipboard access is unavailable or denied, it downloads the same PNG and explains the fallback. Rendering uses high-density output when safe, reduces density for moderately long schedules, and refuses schedules that cannot be represented reliably as one readable image on a supported iPhone.

## User Stories

1. As a poker tournament organizer, I want to copy a payout schedule as an image, so that I can share the result without manually transcribing it.
2. As a poker tournament organizer, I want the copy control available whenever a valid payout schedule is displayed, so that I can act on the current result immediately.
3. As a poker tournament organizer, I want the copy control hidden when there is no valid payout schedule, so that I cannot attempt to copy an absent or stale result.
4. As a poker tournament organizer, I want the image to include the **Payout schedule** heading, so that recipients understand what the image represents.
5. As a poker tournament organizer, I want the image to include the paid-place count, so that recipients can see how many finishing positions receive a payout.
6. As a poker tournament organizer, I want the image to include every paid place and payout, so that the copied result is complete.
7. As a poker tournament organizer, I want the image to include each payout's displayed percentage share, so that it preserves all information shown in the table.
8. As a poker tournament organizer, I want the image to include the distributed-total confirmation, so that recipients can see that every NOK was allocated.
9. As a poker tournament organizer, I want the image to include the paid-place-reduction note when present, so that the result does not lose an important explanation.
10. As a poker tournament organizer, I want calculator inputs excluded from the image, so that the shared result is focused and does not expose unnecessary working details.
11. As a poker tournament organizer, I want the copy control excluded from the image, so that the image looks like a finished result rather than a screenshot of an interactive interface.
12. As a poker tournament organizer, I want the complete results card copied even when some of it is outside the visible viewport, so that scrolling does not cause rows to be omitted.
13. As a poker tournament organizer, I want the PNG to use a solid background, so that it remains readable when pasted into destinations with different backgrounds.
14. As a poker tournament organizer, I want the PNG to retain the results card's green visual treatment, so that it faithfully represents the calculator result.
15. As a poker tournament organizer, I want normal payout schedules rendered at high density, so that text and row separators remain crisp when pasted elsewhere.
16. As a poker tournament organizer, I want moderately long schedules rendered at a safe lower density, so that the app can still create one complete image without unnecessary failure.
17. As an iPhone user, I want the app to reject an image that exceeds safe browser rendering limits before attempting it, so that copying does not freeze or reload the calculator.
18. As a poker tournament organizer, I want an over-limit explanation when a schedule is too long for one reliable image, so that I understand why it cannot be copied.
19. As a poker tournament organizer, I want an over-limit schedule left intact on screen, so that a failed copy attempt does not alter the calculated result.
20. As a poker tournament organizer, I want the app never to truncate payout rows in the image, so that a copied schedule cannot silently misrepresent the payouts.
21. As a poker tournament organizer, I want the app never to split the result into several images without asking, so that the copy action retains its one-image contract.
22. As a poker tournament organizer, I want the control disabled while the image is being rendered and copied, so that repeated taps cannot start competing operations.
23. As a poker tournament organizer, I want visible progress feedback while copying is underway, so that I know my tap was recognized.
24. As a poker tournament organizer, I want the label to change temporarily to **Copied!** after success, so that I know the PNG reached the clipboard.
25. As a poker tournament organizer, I want the control to return to **Copy image** after success feedback, so that I can copy the result again later.
26. As a poker tournament organizer, I want a concise inline error when image rendering fails, so that the failure is understandable without losing my schedule.
27. As a poker tournament organizer, I want a concise inline error when clipboard writing fails unexpectedly, so that I am not given a false success indication.
28. As a poker tournament organizer, I want the PNG downloaded when clipboard image writing is unavailable or denied, so that I still receive the completed image.
29. As a poker tournament organizer, I want the fallback message to say that a PNG was downloaded instead, so that I know where the result went.
30. As a poker tournament organizer, I want download fallback used only after successful image creation, so that a rendering failure is not mislabeled as a clipboard limitation.
31. As a poker tournament organizer, I want the downloaded PNG to contain exactly the same result as the clipboard PNG, so that fallback does not change the artifact.
32. As a poker tournament organizer, I want changing any calculator input to replace or hide the previous result and its copy state, so that feedback never refers to a stale payout schedule.
33. As a poker tournament organizer, I want copying to leave every calculator value and payout unchanged, so that sharing has no effect on calculation.
34. As an iPhone user, I want the feature to work on the current and previous major iOS Safari releases, so that it matches the calculator's supported browser range.
35. As an iPhone user, I want the new control and feedback to fit the existing portrait and landscape layouts, so that sharing does not introduce horizontal overflow.
36. As a keyboard or assistive-technology user, I want the copy operation and its status exposed through semantic controls and text, so that feedback is not conveyed only by color.

## Implementation Decisions

- Add one copy-image interaction to the successful-result area. It is present only while a valid current payout schedule is rendered.
- Place the control last in the results card, after the distributed-total confirmation and optional paid-place-reduction note.
- Label the idle control **Copy image**. Disable it and present an in-progress state while rendering or writing. Temporarily label it **Copied!** only after a successful clipboard write.
- Treat the complete results card as the export boundary: heading, paid-place count, all rendered payout rows and percentage shares, distributed-total confirmation, and optional reduction note.
- Exclude the calculator inputs and copy interaction, including its status or error messaging, from the rendered artifact.
- Render content outside the visible viewport. The artifact must represent the complete export boundary rather than the currently visible screen region.
- Produce one `image/png` artifact with an opaque version of the results card's current green background. Do not rely on transparency.
- Keep the exported content visually faithful to the displayed result. Do not introduce a separate report layout, table headers, branding, metadata, or additional explanatory copy.
- Determine raster dimensions before allocating the final image buffer. Use a 2x scale when the complete output remains within the safe rendering envelope.
- Retry dimension planning at 1x for a result that is unsafe at 2x. Do not use a scale below 1x because that would make a long schedule unreadable.
- Treat an output dimension above 8,192 pixels or a total image area above WebKit's supported canvas-area ceiling as unsafe. Apply the stricter condition before rendering; the narrow mobile card means the height limit will normally govern.
- If the result is unsafe even at 1x, do not render, copy, download, truncate, resize below 1x, or split it. Preserve the result and show a concise inline explanation that the schedule is too long to copy as one image.
- Create the PNG entirely in the client. Do not add a backend, upload, remote rendering service, or persistent storage.
- Attempt to write the completed PNG through the browser's image clipboard capability while preserving the initiating user gesture required by WebKit.
- Use capability detection that works on both supported iOS Safari generations. Do not depend exclusively on newer convenience APIs that are absent from the previous major release.
- If image clipboard writing is unavailable or permission is denied after the PNG exists, download that same PNG and show a concise inline message explaining the fallback.
- Distinguish image-generation failure, unsafe-size refusal, clipboard failure, clipboard-to-download fallback, and success. Do not report success until the clipboard write completes.
- Do not use download fallback for an artifact that was never generated successfully.
- Prevent concurrent copy attempts while one operation is active. Restore the idle state after completion or failure so the organizer can retry.
- Reset transient copy success, fallback, and error feedback when the displayed payout schedule changes or disappears.
- Keep the calculation boundary and payout-schedule rules unchanged. This feature consumes the rendered result and does not participate in calculation or reconciliation.
- Keep the interaction within the existing compact single-column visual system and supported widths. Use the existing button treatment unless a state requires a minimal variation for clear feedback.
- Use visible inline status text and semantic button state. Do not make color the sole indication of progress, success, fallback, or failure.
- Introduce only the client-side rendering dependency or focused adapter needed for faithful DOM-to-PNG conversion. Avoid expanding the application into a generalized export framework.

## Testing Decisions

- Test external user-visible behavior rather than DOM-to-image library calls, canvas helper internals, CSS class names, or private state transitions.
- Use the existing rendered-SPA Playwright suite under Mobile Safari/WebKit as the sole test seam. Do not add a unit-test seam for this presentation and browser-integration feature.
- Follow the existing browser tests' prior art: drive the calculator through accessible labels and roles, observe rendered output and interaction feedback, and exercise the iPhone-sized WebKit configuration.
- Control the clipboard and download browser boundaries in tests so success, unsupported capability, denial, and unexpected rejection are deterministic.
- Inspect the PNG produced by the running application as user-visible output. Verify its MIME type, dimensions, opaque background, and rendered contents rather than merely asserting that a rendering helper was called.
- Verify that a valid payout schedule exposes **Copy image**, that the interaction is absent without a valid current result, and that the control follows all result details.
- Verify that the PNG contains the heading, paid-place count, every table row, distributed-total confirmation, and optional reduction note while excluding calculator inputs, the copy control, and copy-status messaging.
- Verify that rows outside the viewport are present in the PNG.
- Verify the in-progress disabled state, successful clipboard write, temporary **Copied!** state, and return to the idle label.
- Verify that clipboard unavailability or denial after successful rendering downloads the same PNG and presents the fallback explanation.
- Verify that image-generation failure and clipboard failure produce truthful, concise feedback without changing or hiding the payout schedule.
- Verify that a normal schedule produces a 2x PNG and a moderately long schedule produces a 1x PNG.
- Verify that a schedule unsafe at 1x is refused before image allocation, remains complete on screen, produces neither clipboard data nor a download, and explains that it is too long to copy as one image.
- Verify that copy success, fallback, and error state is cleared when input changes produce a new payout schedule or hide the current result.
- Verify that copying does not alter calculator inputs, paid places, payouts, percentages, totals, or reduction messaging.
- Retain the existing portrait and landscape containment checks with the new control and feedback visible.
- Do not assert a particular DOM-to-image package, canvas construction technique, component split, filename implementation, or temporary internal representation.

## Out of Scope

- Copying calculator inputs or the entire application viewport.
- Exporting only the literal table rows without the surrounding result context.
- A separate share-card, print, report, or alternate export design.
- Adding table column headers or content that is not already displayed in the results card.
- Transparent-background output or selectable background themes.
- User-selectable image resolution, dimensions, scale, quality, or file format.
- JPEG, WebP, SVG, PDF, CSV, text, or rich-table clipboard formats.
- Copying several images, paginating the schedule, or silently truncating rows.
- Scaling below 1x to force an exceptionally long schedule into one unreadable image.
- Downloading by default when clipboard image writing is available and succeeds.
- Native share-sheet integration, Web Share API support, shareable URLs, or saved calculator state.
- Image history, server storage, uploads, accounts, or a backend rendering service.
- Changes to payout calculation, reconciliation, validation, currency formatting, or domain limits.
- Expanding browser support beyond the calculator's current and previous major iOS Safari target.
- Formal accessibility-conformance claims or a new accessibility-testing program.

## Further Notes

- Use the repository's canonical terms **payout schedule**, **paid place**, **payout**, and **total prize pool**. The rendered schedule remains a table, but “prize payout table” is not a new domain term.
- The original calculator spec excluded import, export, downloadable reports, and other sharing features. This feature deliberately and narrowly supersedes that exclusion for copying or downloading one PNG of the current payout schedule; the rest of that exclusion remains in force.
- A measured 1,000-row table is approximately 45,656 CSS pixels tall. A 2x capture of the surrounding mobile results card would require roughly 275 MiB for one raw pixel buffer before intermediate rendering, PNG encoding, and WebKit clipboard sanitization.
- WebKit on iOS enforces a canvas-area ceiling of 8,192 × 8,192 device pixels and also clamps accelerated surfaces to 8K per dimension. Tiled rendering does not solve the one-image clipboard requirement because WebKit decodes and re-encodes the completed PNG before placing it on the pasteboard.
- The clipboard write must originate from the user's interaction and requires a secure context in production. The application is deployed over HTTPS; local automated tests should control the browser boundary rather than relying on host clipboard state.
- No ADR is required. This is a focused and reversible presentation capability, not a hard-to-reverse architectural choice.
- The user confirmed the feature behavior and the single rendered-SPA test seam through a design interview before this spec was published.
