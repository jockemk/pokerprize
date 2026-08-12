# 01 — Bootstrap a one-place payout flow

**What to build:** Create the first usable vertical slice of the iPhone calculator. An organizer can open the static app, see all four inputs with their agreed defaults, enter a valid total prize pool that supports one paid place, and receive a complete one-row payout schedule with an exact-distribution confirmation. Establish the pure calculator boundary and the rendered-app browser seam that later tickets will extend.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The project uses Vite, React, and TypeScript and produces a static production build without a backend.
- [ ] The page shows inputs for total prize pool, payout ratio, minimum payout, and rounding increment.
- [ ] The total prize pool starts blank; payout ratio, minimum payout, and rounding increment default to `1.87`, `200`, and `25` respectively.
- [ ] Entering a valid total that supports one paid place produces a payout schedule containing `#1` and the entire total prize pool.
- [ ] The result shows a paid-place count and confirms that the distributed amount equals the total prize pool.
- [ ] Payouts are formatted as NOK using Norwegian grouping conventions.
- [ ] Calculation is exposed through a framework-independent pure boundary that returns either a complete result or a domain error.
- [ ] Focused tests verify the successful one-place calculation through the pure boundary.
- [ ] A WebKit browser test at an iPhone-sized viewport verifies the one-place workflow through the rendered app.
