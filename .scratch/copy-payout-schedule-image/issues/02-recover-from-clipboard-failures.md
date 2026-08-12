# 02 — Recover from unavailable or failed clipboard access

**What to build:** Ensure an organizer still receives a successfully rendered payout-schedule PNG when image clipboard access is unavailable or denied, while every failure path reports what actually happened and remains retryable.

**Blocked by:** 01 — Copy a normal payout schedule to the clipboard.

**Status:** resolved

- [x] When image clipboard writing is unavailable, the app downloads the already-rendered PNG and explains that it was downloaded instead.
- [x] When clipboard permission is denied after image creation, the app downloads that same PNG and explains the fallback.
- [x] The downloaded artifact is identical in content and format to the PNG intended for the clipboard.
- [x] Download fallback is never attempted when image generation did not complete successfully.
- [x] An image-generation failure produces concise inline feedback, preserves the displayed payout schedule, and does not claim copy or download success.
- [x] An unexpected clipboard failure that cannot use the agreed fallback produces concise inline feedback and does not claim success.
- [x] After fallback or failure, the control returns to a usable state so the organizer can retry.
- [x] Changing or hiding the payout schedule clears fallback and error feedback associated with the previous result.
- [x] Mobile Safari browser tests control clipboard and download behavior deterministically and verify unavailable, denied, rendering-failure, unexpected-failure, and retry outcomes through visible behavior.
