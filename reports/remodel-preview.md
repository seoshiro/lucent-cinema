# LUCENT remodel: local review

This is the prepublication review record for implementation `1bc887e` and project instructions `82f0cce`. The user approved the shown version for publication on 2026-10-24, superseding the preview hold. The approved application, model and artwork remain unchanged. The current deployed revision is identified by the public [build manifest](https://seoshiro.github.io/lucent-cinema/build-manifest.json); earlier audit statements below retain their actual scope.

## Concrete corrections

The previous product was assembled from Three.js primitives and its camera-like silhouette was rejected. The replacement is authored in the existing Blender 5.2.2 LTS: machined low-wide housing, a separate recessed polymer fascia, layered optical cavity, ventilation, rear ports, seams, dial, feet and mesh lettering. `assets/blender/lucent-projector.blend` is editable; `public/models/lucent-projector.glb` is the optimized runtime data. Three.js renders it, without reconstructing the final product out of primitives.

The original reference videos and the user's three new screenshots were not materialized on this Windows host because the current supported Library helper requires unavailable `os.setxattr`. It was not patched or retried unchanged. The parent viewed the reference evidence and supplied the brief. The desktop team reproduced the actual live layout and inspected its own real browser and Blender pixels.

Two parent-researched CC0 projectors were actually downloaded as model data, imported with Blender automatic script execution disabled, and rendered under comparable lighting. Both had toy-like proportions or opaque projecting optics, so neither asset is used in this original export. License and source links are recorded in the Blender README; comparison renders and SHA-256 provenance are retained locally.

## Background quality

The rejected desktop source was 1672 x 941, while its rendered image box reached approximately 1526 x 1060 CSS pixels. The mobile selection was only 1280 x 720 even at DPR 2, with an approximately 413 x 954 CSS-pixel image box. Two CSS turbulence layers added grain. A valid same-state browser comparison confirmed that removing them clears high-frequency noise but does not recover source detail.

The replacement `public/cinema/lucent-clear-horizon.svg` is original code-native artwork: four smooth asymmetric blue ridge layers, restrained gradients, dark open sky and a small thin crescent. It has no raster texture or noise filter. It preserves the existing story opacity/parallax, low-priority loading on approach, responsive crop, world controls and reduced-motion behavior. A smooth vector scene remains available on image failure. Previous generated PNG/WebP sources remain provenance/history, not the new visual source.

## Section ownership

The sticky stage's old `margin-bottom: -100svh` collapsed its layout contribution and allowed it to remain one viewport past its chapter owner. Opaque details then masked the center while a model fragment reappeared below the panel. The story now uses overlapping grid cells with real height and clipping at its own boundary. A reversible exit fade completes before the next section enters view. The finale has reading space below the object; the giant background word belongs only to the initial hero.

Independent continuous forward/reverse probes of the layout fix measured zero stage overflow in six viewport/motion/fallback modes. The GLB revision receives its own follow-up lifecycle and visual review; an anchor-only test is not treated as proof of the continuous transition.

## Review gates

Actual Cycles front, three-quarter, rear, macro and warm renders are preserved locally. The independent art director inspected actual desktop/phone browser pixels, closed the flat-cap/black-hole optical-depth P1, and then closed the hard-reflection P2 after feathered studio softboxes. These are scoped local-preview assessments, not publication or universal aesthetic approval.

The final GLB is 1,044,836 bytes, SHA-256 `915b50699e81734415d378b99ddac8f1a90e28d12b97aa04c0a9696f83626295`; one mesh, 12 material primitives, 30,245 exported vertices and 51,332 triangles, with no embedded images or external model buffers. The editable master is 650,522 bytes, SHA-256 `59c1c68ef127aa85bfa09951a80b9c8aef8e16366544921a9801b37ebe6eb772`. The asset manifest records source and runtime hashes without absolute machine paths.

Final local `npm run verify` passed ESLint, TypeScript, six unit tests and production build. The subsequent complete Playwright/axe suite passed 40/40 tests across desktop, mobile/touch, short landscape and reduced motion in 1.6 minutes. Actual model fetch failure and corrupt successful responses retain decoded finish-specific fallback images and a real download. The independent code review separately exercised actual OffscreenCanvas context loss/restoration, worker exceptions, pending model state changes, resize and the GitHub Pages base prefix. Its final-model continuous sweeps measured zero visible owner overflow in all six modes. See [code review](remodel-code-audit.md).

A contact-sheet inspection then caught a different intermediate phone defect: finale text could scroll over the fixed product before the owner exit. The portrait stage now fades according to the actual copy position, from fully visible at 55vh to fully absent at 40vh. This clearance is reversible and independent of the following panel's boundary. The independent visual reviewer checked 624 recorded states across normal, reduced and Worker-disabled 320/390 DPR2 views, inspected the resulting pixels, and closed the collision. No overflow, request failure or page error occurred. The six-unit verification and full 40-case suite above were repeated after this correction. See [the final clearance review](remodel-finale-clearance-review.md).

The independent background reviewer accepted actual desktop and DPR2 320/360/390/landscape crops, world changes and reverse entry. A newly found portal-copy/motion-button overlap was fixed and closed with 20 additional captures; measured text-line/control intersections and right overflow were zero. See [background review](remodel-background-review.md). Existing local browser/lab checks do not constitute native Safari/Firefox testing or field Core Web Vitals.

Confirmed Library review outputs, all version 0:

| Output | Library file ID |
| --- | --- |
| Integrated desktop/phone hero and clean background | `libfile_0f3c36b6111c8191a35d3bcd8a5c12ab` |
| Four actual Blender views, including optical macro | `libfile_03c53d0f74a88191b6d2c9a0daf6dfd3` |
| Editable Blender master | `libfile_f713da6e9d008191bfe803c3d081abd5` |
| Full-size browser optical close-up | `libfile_669db9cd76548191bcfbef22c08a2ea5` |
| Desktop info boundary | `libfile_33af3ef1fb8081919907b3c3bbad4436` |
| Phone final product section | `libfile_a925b3e368f88191831c3589ae0c2d9f` |
| Final desktop/phone product-to-info sequence, including corrected intermediate phone fade | `libfile_57f684cd912c8191b4bb4e35d4dd1920` |
| Latest controlled-fill desktop hero | `libfile_97940ef024188191a484f074655dc404` |
| Latest controlled-fill phone hero | `libfile_677f4d9bc0c48191abe84e51aa577105` |
| Full-size corrected desktop landscape | `libfile_7205374aea9881918659d102a0921b41` |
| Full-size corrected phone landscape | `libfile_7983e1576bec8191886be9790d1dee15` |

The prepublication desktop preview was `http://127.0.0.1:4173/`, a local URL. After the user's approval, publication uses the existing GitHub Pages workflow; new live verification is required and previous local results are not treated as live-deployment evidence.

The code auditor separately reviewed the final portrait-clearance delta, confirmed the three stage unit cases and targeted ESLint, and found no P1/P2/P3 issue in that delta. Reduced/manual pause and fallback use the same outer stage visibility; taking the minimum with owner visibility cannot revive a stage after its section has ended. Browser evidence for that last delta belongs to the integrator's full suite and the independent visual reviewer, not a claimed second code-auditor browser run.

## Targeted browser-lighting refinement after parent review

The parent found the composed browser product darker than the neutral Blender render. One controlled refinement adds a neutral front fill and raises environment, hemisphere and rim contributions, preserving the black brand background, exported materials, geometry and feathered optical reflections. The independent art director inspected ten fresh actual default-model browser PNGs covering hero, optics and all three finishes at desktop and phone sizes. Form and vents remain readable, graphite is neutral, and Lunar/Ember retain material separation without broad clipped highlights or chrome. No further geometry or aesthetic iteration is proposed.

A fixed-region before/after screenshot analysis supports that visual comparison: Obsidian front-panel mean sRGB luma rises from 21.48 to 39.56 in the same 270 x 80 region. None of the three finish product regions contains near-white pixels with all channels at least 250; this is bounded screenshot analysis, not physical luminance or field performance. The latest four individual hero/landscape Library outputs above are the parent-review artifacts for this refinement; the earlier contact sheets remain historical transition/model evidence. The independent lifecycle report records its actual earlier worker identity and is not retroactively presented as a later lighting-build attestation.

## Initial live verification and cold-fragment correction

The first release `cddb31c` passed its exact-SHA CI/deploy, all 13 served-file integrity checks and the existing 40 live Playwright cases. Additional independent fresh-browser checks exposed a separate real defect: first entry directly at `/#cinema` remained at the top because the browser resolved the fragment before React mounted its section. A warmed in-page transition and settled reload worked, which is why the earlier checks did not establish cold-entry correctness.

The small correction restores an existing fragment target inside `main` only for a new navigation still at scroll zero. Reload recovery uses one tab-session URL/scroll record saved on `pagehide`, because native restoration can run before React has mounted enough document height. Exact URL and finite nonnegative position are validated; blocked storage or malformed records fall back safely. Native Back/history and nonzero new-navigation scrolling are not rewritten. Finish/world choices remain in-tab state and reset on reload. A new browser regression checks cold cinema entry and reading-position preservation across reload in all four existing viewport profiles. The approved visuals, GLB, SVG and materials are unchanged; final release identity remains the live manifest's exact SHA. Browser-only fault simulations are labelled separately from real server responses, including cancellation of superseded fallback-image requests.
