# 01 — Copy a normal payout schedule to the clipboard

**What to build:** Give an organizer a **Copy image** control on every valid payout schedule. A tap creates one crisp PNG of the complete results card and writes it to the image clipboard, with truthful progress and success feedback.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] **Copy image** appears last in the results card only when a valid current payout schedule is displayed.
- [x] Activating the control produces one `image/png` artifact at 2x density for a normal-sized payout schedule.
- [x] The PNG includes the **Payout schedule** heading, paid-place count, every rendered paid place, payout and percentage share, distributed-total confirmation, and optional paid-place-reduction note.
- [x] The PNG includes rows outside the visible viewport and uses an opaque version of the results card's green background.
- [x] Calculator inputs, the copy control, and copy-status messaging do not appear in the PNG.
- [x] The completed PNG is written to the browser's image clipboard from the initiating user interaction using capability detection compatible with the supported iOS Safari generations.
- [x] The control is disabled and presents visible progress while work is active, preventing concurrent copy attempts.
- [x] A successful clipboard write temporarily changes the control label to **Copied!**, then restores **Copy image**.
- [x] Changing or hiding the current payout schedule clears transient copy feedback without changing any calculation behavior.
- [x] The control and its visible states remain contained in the existing iPhone portrait and landscape layouts and do not communicate state through color alone.
- [x] Mobile Safari browser tests inspect the produced PNG as user-visible output and verify the success flow without asserting rendering-library internals or component structure.
