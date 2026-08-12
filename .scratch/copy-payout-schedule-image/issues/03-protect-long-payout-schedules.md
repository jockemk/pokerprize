# 03 — Protect long payout schedules from unsafe image rendering

**What to build:** Let organizers copy moderately long payout schedules at a safe readable density while refusing, before allocation, any schedule that cannot reliably become one PNG on a supported iPhone.

**Blocked by:** 01 — Copy a normal payout schedule to the clipboard.

**Status:** resolved

- [x] The app determines the complete results card's output dimensions before allocating the final image buffer.
- [x] A payout schedule whose complete PNG is safe at 2x continues to use 2x density.
- [x] A payout schedule unsafe at 2x but safe at 1x is rendered completely at 1x density.
- [x] An output dimension above 8,192 pixels or an image area above WebKit's supported canvas-area ceiling is treated as unsafe before rendering begins.
- [x] A payout schedule unsafe even at 1x remains complete on screen and receives a concise explanation that it is too long to copy as one image.
- [x] The unsafe-at-1x path creates no PNG, clipboard item, or download and does not risk a large final image allocation.
- [x] No long-schedule path truncates paid places, splits the result into multiple images, or scales below 1x.
- [x] A refused copy attempt leaves calculation inputs, payouts, percentages, distributed total, and any paid-place-reduction note unchanged and allows a later safe result to be copied.
- [x] Mobile Safari browser tests verify the 2x, 1x, and refusal boundaries through the rendered application without asserting a particular canvas or DOM-to-image implementation.
