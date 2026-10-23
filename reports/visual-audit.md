# Independent visual and UX audit

**Result: PASS for tested local production experience.** Six proven visual/accessibility findings were fixed by the integrator and independently rechecked. No outstanding P1, P2 or material P3 findings remain in tested flows. Deployment, exact-SHA CI and live verification are separate release checks.

## Role and scope

Five actual roles worked on the project: integrator, art director/reference analyst, motion/3D developer, independent visual/UX auditor, independent code/security/performance auditor. This auditor modified no application source.

Story: visitors explore a fictional LUCENT projector, switch three cinema worlds and three finishes, and download a real concept text file. No backend or checkout is represented.

Instructions used: Windows engineering defaults, ECC-derived frontend guidance, 21st UI Review, Verification. ECC runtime/hooks were not used. The 21st deterministic CLI review was unavailable and is not claimed.

## Reference coverage

This auditor used the parent-authorized grounded brief in reports/reference-brief.md. The parent inspected contact sheets, and a separate parent analyst inspected substantive phases at 4 fps. Reference durations were 21.93 s and 12.93 s. This is sampled frame analysis, not full real-time playback. This auditor does not claim independent viewing of original MP4 pixels; actual implemented pixels were reviewed.

## Conditions

Actual user's Chrome via CUA: 1536x730 desktop and 390x844 mobile override, real hero/world review. Viewport overrides were reset.

Independent isolated installed Chromium1248 on Windows: 1536x730 desktop,390x844 touch-like mobile,844x390 landscape. Reduced-motion and unavailable-WebGL checks used 1280x800. Final targeted audit used stable local production preview, unthrottled.

screenshots/visual-final.json retains final source hashes, all-rule axe and runtime results. Earlier results: screenshots/visual-journey.json and screenshots/visual-after.json. Early dev passes were hot-updated; before screenshots are individual defect evidence, not a frozen release-SHA report.

## Findings and resolution

| ID | Priority | Proven defect | Independent recheck |
| --- | --- | --- | --- |
| V01 | P2 | Bright desktop backdrop word and product intruded into white headline. | Darker backdrop/product shift: final desktop hero readable and separated. |
| V02 | P2 | Mobile motion chip covered scroll link. | 44px icon plus reserved link space: no overlap. |
| V03 | P2 | Desktop motion chip covered Far beyond control. | Chapter/control layout reserves space; overlap false. |
| V04 | P2 | Axe serious label-content-name-mismatch on brand/motion control. | Visible labels and decorative SVG: all-rule axe 0 at all three sizes. |
| V05 | P2 | Landscape finishes showed cinema art with no model; Ember had no visible effect. | Choreography maps actual chapter positions. Model opacity 1/world0; Ember visibly colors body. |
| V06 | P3 | Short landscape hero captions overlapped introduction. | Redundant captions hidden below 500px height; clear final hero. |

Before evidence in screenshots/: visual-hero-desktop-before.png, visual-hero-mobile-before.png, visual-world-orbit-before.png, visual-after.json, visual-ember-landscape-after.png, visual-hero-landscape-after.png.

Final evidence in screenshots/: visual-final-hero-desktop.png, visual-final-hero-mobile.png, visual-final-hero-landscape.png, visual-final-cinema-desktop.png, visual-final-finishes-landscape.png, visual-final-ember-landscape.png, visual-final-ember-mobile.png, visual-final.json.

## Verified journeys

| Check | Result |
| --- | --- |
| Rendered model | WebGL ready; lens, bevels, ventilation and light reviewed as real pixels. |
| Worlds | All 3 visibly change art, pressed state and description. |
| Finishes | All 3 update; Ember visibly changes body on desktop/mobile/landscape. |
| Repeated actions | Repeated changes and reversed/interrupted anchor navigation reach consistent states. |
| Navigation/CTA | Object, cinema, finishes, details reach actual sections. |
| Download | Actual lucent-concept.txt download completed without reported failure. |
| Keyboard | First Tab reveals visible skip focus; Space selects worlds; motion command changes state/name. |
| Touch-like | Mobile Ember selection succeeds; no 390px horizontal overflow. |
| Reduced motion | Preference gives reduced scene mode; pause/enable works. |
| WebGL unavailable | Forced WebGL2 failure leaves loaded visible SVG fallback; canvas count 0. |
| Axe | Final all-rule 0 violations on hero/finishes at 1536x730,390x844,844x390. |
| Runtime | Final page errors 0, failed requests 0. One Three.js floating-precision shader warning on desktop driver; no rendering failure observed. |

## Worker renderer targeted recheck

The renderer was subsequently moved to an OffscreenCanvas Worker. A targeted production recheck passed after the independent performance auditor finished isolated measurements. This role makes no new performance claims from concurrent functional checks.

App and global style hashes remained unchanged. Updated rendering-source SHA256 hashes:

| Source | SHA256 |
| --- | --- |
| src/components/ProductScene.tsx | b3d13c8a695ad2d5a102c42f05a7ec9b82b80212170287b4b7a6db6975d51590 |
| src/workers/product-renderer.ts | 5231172ea14e1ddf9c700e4626f62e85871e864deeaa75f4accf1420c8206fd2 |
| src/components/product-scene.css | dd2d10de681769f77fe100a0f3a09401abacada37c8d835d6f582b69e037b344 |

Evidence: screenshots/visual-worker.json and 19 visual-worker-*.png captures. Desktop 1536x730 and mobile 390x844 hero, craft, optics, portal, cinema and all three finishes were captured and visually inspected. Both hero PNGs are byte-identical to previously accepted final hero PNGs. Real user's Chrome desktop Worker hero was also observed.

Injected cases: unavailable Worker, constructor failure, and native Worker error after ready. Each leaves renderer status fallback, canvas count 0, a loaded SVG with opacity 1, and no page errors. Normal Worker journeys recorded page errors 0 and failed requests 0; the disclosed desktop shader warning remains. Full axe was not repeated because App/DOM/styles were unchanged; prior version-scoped evidence remains above.

The user's Chrome mobile screenshot call timed out; saved mobile pixels were verified through isolated Chromium on the same Windows computer. The temporary viewport override was reset through the supported API.

## Limits

Automated scans do not establish complete accessibility conformance. No physical touch-device, iOS Safari, Firefox or human usability testing by this role. Networking was local/unthrottled. No field-CWV or performance-improvement claim. Shader warning disclosed, not suppressed. Public deployment and release artifact URLs require integrator verification after publication.
