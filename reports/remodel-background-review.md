# Clear Horizon: independent integrated-browser review

Verdict: **background accepted within the tested scope; adjacent I01 collision now closed by targeted recheck**. The provisional projector/optics/lighting are not accepted by this report. See the safe-area addendum for the new layout evidence.

## Actual evidence and conditions

- Local production preview `http://127.0.0.1:4173/`, 2026-10-24. No application or model sources edited by this reviewer; no publication performed.
- Actual user Chrome, normal viewport 1536 × 730: clicked “The experience”, inspected rendered Blue hour pixels. SVG fully loaded at natural 2400 × 1400 from `/cinema/lucent-clear-horizon.svg`; cinema-layer opacity 1; noise-layer DOM count 0; captured browser warn/error log `[]`. No temporary viewport override introduced.
- Independently generated saved PNGs through installed isolated Chromium 1248: 320 × 700, 360 × 800, 390 × 844 and short landscape 844 × 390, all DPR 2/touch-enabled. A separate 390 × 844 reduced-motion context was tested. These are emulated viewports, not physical-device testing.
- 45 recorded state checks, 16 real PNGs: `background-integrated-*.png`. Helper `background-integrated-capture.mjs`; exact source hashes, requests and states in `background-integrated-runtime.json`. Screenshots were inspected as actual pixels after decode and settled scroll. No style or image-source substitution was used.
- Page errors 0; failed requests 0; HTTP status 400+ responses 0; old WebP requests 0. This is functional/visual evidence, not a performance benchmark or full accessibility audit.

## Background result

At 320/360/390 phones, the crescent remains safely separated from the chapter heading and “somewhere” letters. The hills have clean boundaries and distinct values; they extend through the frame without empty strips. The sky is a continuous smooth gradient, without the dirty texture from the previous composite. White copy and selected/unselected world controls remain readable. Short landscape preserves the small upper-right crescent, heading clearance, ridge depth and legible controls. Desktop Chrome confirms the same integrated illustration rather than the old raster or procedural fallback.

Relevant own captures:

- `background-integrated-320-cinema.png`
- `background-integrated-360-cinema.png`
- `background-integrated-390-cinema.png`
- `background-integrated-landscape-cinema.png`
- `background-integrated-reduced-390-cinema.png`

For all five contexts:

- Initial hero: no background image/picture and no artwork request.
- Forward portal: integrated SVG loaded, picture opacity 1 and scene opacity .444444.
- Cinema: same SVG at scene opacity 1; no document horizontal overflow.
- Afterglow → Far beyond → Blue hour: each tapped control becomes pressed; aurora picture is absent for other worlds and restores correctly for Blue hour. Captured the three 390-wide selected states.
- Reversed portal → craft: artwork removes below its approach threshold. Returning to cinema reloads/restores the correct SVG. No stale alternate-world background or blank image appeared in inspected frames.
- Reduced motion: picture transform `none`, transition duration `0s`, with stable crop and readable composition. Normal motion used its expected small parallax offset. This verifies the sampled states, not continuous frame pacing.

The repeated/return Blue hour PNGs at 390 are visually consistent. The background no longer depends on the previous 1280/1672 WebP rasters.

## Historical adjacent finding I01 — P2: portal helper text collides with motion control

At the portal anchor on 360 × 800 and 390 × 844, “Keep scrolling. There’s a whole world on the other side.” is laid out near the viewport bottom and extends into the fixed lower-right motion button's area. The button covers the last part of the line; at 360 the paragraph also reaches beyond its intended right gutter. At 320 the text wraps to two lines and avoids this particular collision. The reduced-motion 390 capture retains the same layout problem.

Evidence: `background-integrated-360-portal.png`, `background-integrated-390-portal.png`, `background-integrated-390-reverse-portal.png`, `background-integrated-reduced-390-portal.png`. Approximate collision region is x304–347/y744–757 CSS px at 360, and x334–378/y790–806 at 390. These are visual estimates from DPR 2 PNGs.

Suggested fix: constrain the portal paragraph to its actual phone content width and reserve space from the floating control (bottom clearance or a narrower copy line). Do not reduce text contrast to hide the collision. Recheck the paragraph at anchor and nearby scroll positions after correction.

This does not invalidate the SVG artwork, but it prevents a blanket chapter/page visual PASS. The visibly provisional large/dark projector in some portal frames is also excluded from background acceptance, as requested; its camera framing, optics and lighting need their own independent final review.

## Boundaries

No new 3D, footer/stage-exit, keyboard, axe, fault-fallback or performance audit was run. No screenshot supplied through Library or original MP4 is claimed viewed here. Browser Chrome pixels and isolated-browser saved PNGs are explicitly separate evidence. A later layout change must preserve the accepted background crop and close I01 with new pixels.

## Safe-area correction recheck: I01 CLOSED

The integrator constrained the portal copy to the actual section width and reserved 64 CSS px from the phone paragraph. Reviewed the served production layout at 320 × 700, 360 × 800, 390 × 844 and reduced-motion 390 × 844, all DPR 2/touch-enabled in installed Chromium1248. At each size, scrolled forward to portal −64 px, anchor, +64 px, then reversed to anchor and −64 px: 20 checks and 20 new real PNGs, without overwriting the original before evidence.

`portal-safearea-recheck.json` records complete paragraph text, line rectangles, the fixed button rectangle, source hashes and states. All 20 measured states have zero text-line/button rectangle intersections, zero text right overflow, zero document horizontal overflow, zero page errors and zero failed requests. At the anchor the actual text's right edge is approximately 220/257/288 px for 320/360/390 widths; the button's left edge is 263/303/333 px respectively. That leaves more than 40 CSS px of horizontal clearance even if the line passes the button vertically.

Inspected actual anchor pixels at all four configurations plus representative nearby/reversed 360/390 frames. The helper copy is complete, wraps naturally to two lines and is clear of the motion button. At the pre-anchor position part of the paragraph is naturally below the viewport and becomes visible by scrolling; this is not clipping inside a constrained box. The crescent/hill crop remains clean. No model approval is implied by any projector visible in these frames.

After evidence:

- `background-portal-fixed-320-forward-anchor.png`
- `background-portal-fixed-360-forward-anchor.png`
- `background-portal-fixed-390-forward-anchor.png`
- `background-portal-fixed-reduced-390-forward-anchor.png`
- `background-portal-fixed-360-forward-before.png`, `background-portal-fixed-360-forward-after.png`
- `background-portal-fixed-390-reverse-anchor.png`, `background-portal-fixed-390-reverse-before.png`

All other directions/positions are saved with the same `background-portal-fixed-*` prefix. Original `background-integrated-360-portal.png` and `background-integrated-390-portal.png` are retained as before evidence.

Layout source SHA-256 at recheck: `src/styles.css` `dd1d4f9aef5eec53a2fbb22d80d592b6a6466f6e5bcd3ffb57e6c7ef0ac42758`; `src/App.tsx` `3f0c857947f00296e87623ae070f5fa100e96f4a7fbc087afb73afcfc1798869`. The ignored helper was corrected to use `window.scrollTo`; targeted `npx eslint evidence/review/portal-safearea-recheck.mjs` exited 0.

Actual Chrome was also opened and set to 390 × 844, but its screenshot timed out, so that failed capture is not claimed as pixel proof. The viewport reset API was invoked; since the audit tab still reported 390 width, that newly created audit-only tab was closed, clearing its responsive session without altering user-owned tabs. Saved after proof above is explicitly the isolated installed browser evidence.
