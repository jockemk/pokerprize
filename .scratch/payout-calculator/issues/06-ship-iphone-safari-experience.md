# 06 — Ship the iPhone Safari experience

**What to build:** Deliver the finished calculator as a focused, poker-inspired static experience for current iPhone Safari. The complete workflow should be comfortable in portrait, remain usable in landscape, invoke appropriate on-screen keyboards, and pass the final production and WebKit verification.

**Blocked by:** 05 — Complete the calculator workflow.

**Status:** ready-for-agent

- [ ] The interface uses a compact single-column layout with one input card followed by one results card.
- [ ] The layout is optimized around a 390 CSS-pixel portrait viewport, remains fluid through current iPhone widths, and is capped and centered at 430 CSS pixels on larger viewports.
- [ ] The same single-column interface remains usable in iPhone landscape without a dedicated landscape layout.
- [ ] Inputs use suitable iPhone numeric or decimal input modes.
- [ ] Visible labels, semantic form controls, readable validation, and visible focus states provide baseline usability without claiming formal accessibility conformance.
- [ ] The visual design uses dark green, restrained gold accents, and strong contrast without decorative casino imagery.
- [ ] The app supports the current and previous major iOS Safari releases without adding legacy, desktop, iPad, Android, or physical-keyboard-specific behavior.
- [ ] The complete WebKit suite passes at an iPhone-sized viewport, covering defaults, valid entry, immediate recalculation, localized ratio entry, invalid states, reconciliation, result summaries, paid-place reduction, the technical limit, and reset.
- [ ] Calculator tests and property-based invariants pass in the final integrated app.
- [ ] The production build succeeds as static client-side assets with no backend, provider-specific hosting configuration, service worker, or PWA behavior.
