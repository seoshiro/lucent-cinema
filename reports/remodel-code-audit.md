# Independent local audit: Blender GLB integration

Decision: PASS for the scoped model-loading, worker lifecycle, base-path and scene-ownership review of the audited local build. No unresolved P1, P2 or material P3 functional finding was identified in this scope. This is not a model/art-direction approval, an immutable commit attestation or publication approval.

The application is a dirty working-tree preview based on cc8198dfda42538f5baccf134497346aa86fe9ae. The manifest's base revision does not identify the uncommitted integration. No push, deployment or security setting change was performed by this auditor.

## Verified identity

| Item | Audited value |
| --- | --- |
| Active model | models/lucent-projector.glb |
| Model bytes | 1044836 |
| Model SHA-256 | 915b50699e81734415d378b99ddac8f1a90e28d12b97aa04c0a9696f83626295 |
| glTF structure | Version 2; declared length matches file; one mesh/node; 12 materials including body_finish and optical_baffle |
| External content | Zero image declarations and zero external buffer URIs; no remote texture or decoder dependency declared by the model |
| Material extensions | KHR_materials_transmission, KHR_materials_specular, KHR_materials_ior |
| Worker | assets/product-renderer-B7pS-mxX.js, 619807 bytes |
| Worker SHA-256 | 531dd1f13ea7728577306c14603fae29622810f200b81fa9d59dce41ab94b6e6 |
| Audited manifest | 13 assets; independent SHA-256/byte recomputation found zero mismatches |

The audited manifest contains the active GLB and three fallback WebPs. It excludes the unadopted preview GLB, old procedural fallback SVG and old landscape rasters. A later fallback-image-only refresh requires refreshed static hashes and visual verification; it does not make this earlier manifest an attestation of those future bytes.

## Source review and ownership

- src/lib/blender-projector.ts:8-22 fetches the optional model, rejects non-success HTTP responses and parses the received binary using the model URL's directory as base. It requires the authored body_finish material before returning a projector. The active asset has that material.
- The worker initializes asynchronously at src/workers/product-renderer.ts:144. Model fetch/parse completes before a GPU context is created. State and dimensions received during the await are retained; initialization reads current state rather than the original message snapshot.
- ProductScene computes an absolute model URL from BASE_URL and document.baseURI at line 87. Model and finish-specific fallback paths were exercised under a real local /lucent-cinema/ mount, not inferred from a root-only URL.
- Network/parse/init failures post the existing error protocol. ProductScene's failure path at line 53 removes the transferred canvas, clears the worker reference, terminates the worker and preserves the fallback. Fatal worker errors are handled with preventDefault.
- Context loss stops frames, invalidates pending compilation and reveals the current fallback. Restoration rebakes the environment and resumes with the existing GLB scene. The tested flow kept one worker and one WebGL2 context.
- The scoped softbox CanvasTexture is created from an OffscreenCanvas in the worker only. Its map, temporary panel geometry/materials and PMREM generator are disposed after the environment target is baked. The returned environment target is retained independently and disposed/replaced on restore/cleanup.
- Explicit worker disposal collects model geometries/materials/textures and the environment/renderer. Normal parent teardown and fatal failure terminate the worker directly. Browser target/canvas removal was verified for fatal failure; this is not a quantitative GPU-memory benchmark.
- Compilation generation/disposed/context guards prevent stale completions from drawing after teardown or context loss. The main effect removes event handlers/observers on cleanup and guards failed/disposed worker messages.
- No new account, credential, external service or browser security exception is used. The model URL is application-owned. The supplied immutable GLB has no external URI graph. The replacement background SVG contains local gradients/paths/mask only, with no script or external URL; no CSS grain layer remains in the reviewed styles.

The fetch helper accepts an AbortSignal but the parent relies on worker termination for teardown; it does not enforce a separate network deadline. The optional static product remains usable while a model request is pending, as demonstrated below. No claim of exhaustive fault or memory-leak coverage is made.

## Meaningful regression tests added

The only non-ignored repository file written by this auditor is the new tests/e2e/model-loading.spec.ts, awaiting the integrator's staging. It adds two failure boundaries in all four projects:

1. Abort the actual model request at browser-context routing level, including worker fetches.
2. Return HTTP 200 with an invalid model body, exercising parser failure separately from network failure.

Both cases require one intercepted GLB attempt, a visible heading, fallback renderer status, zero leftover canvases, a decoded copper fallback after selecting Ember, no page error and the actual concept-sheet download. These are observable user outcomes, not duplicate assertions of the loader implementation.

Independent result: 8/8 PASS in 15.9 seconds. This run covered the provisional integration's failure paths; subsequent changes were the successful model binary/materials and downstream studio lighting. The integrator's final full suite must include this new file after its final asset refresh. ESLint passed for the new file and the audit harnesses.

## Final base-path and pending-load probe

glb-prefix-pending.mjs mounted the production build under /lucent-cinema/ with no-store responses. The actual model request was held while the UI remained usable. During that hold, the audit selected copper, paused motion and resized from 1440 x 1000 to 390 x 844.

- Pending status was loading; copper/motion=reduced and the decoded /lucent-cinema/models/lucent-fallback-copper.webp were present.
- Releasing the exact final GLB produced ready status with the latest copper/motion/viewport state preserved, one canvas and one worker.
- The actual model URL was /lucent-cinema/models/lucent-projector.glb, requested once. The fulfilled body was 1044836 bytes with the final 915b...26295 hash.
- No page errors occurred. The actual ready screenshot, glb-pending-copper-ready.png, was inspected and shows the rendered copper product, not just the selected data attribute.

A separate direct parse of the final binary confirmed that silver/copper change the actual body_finish color and graphite restores its original RGB exactly. Evidence: model-material-final-check.json. This checks the real loader/material object, not only a DOM selection label.

## Actual OffscreenCanvas lifecycle probe

glb-worker-lifecycle.mjs used the browser debugging protocol to query the real worker's WebGL2 context. No production debug API/global was added.

- One active renderer worker and one WebGL2 context were found; initial ready state was true.
- Actual context loss in the cinema/portal range set ready false. Returning to the hero revealed fallback opacity 1. Actual restoration returned ready true and hid the fallback, with one canvas retained.
- An intentional asynchronous worker exception was handled: remaining worker count 0, canvas count 0, fallback opacity 1, no uncaught page/console errors.
- A mobile-sized page without Worker capability retained copper finish selection and visible fallback, with no canvas or page error.

These observations are recorded in glb-worker-result.json and corresponding glb-worker-*.png files. Injected failures are deliberate test conditions; they are not represented as ordinary clean-network operation.

## Final-model continuous scene ownership

The final 915b...26295 model and B7pS worker were exercised in a new, separately preserved sweep after the earlier 2483-model probe. Each mode had approximately 289 rAF samples forward and reverse through finale/details/footer.

| Mode | Viewport | Model requests | Maximum effectively visible owner overflow |
| --- | --- | ---: | ---: |
| Desktop ready | 1440 x 1000 | 1 | 0 px |
| Desktop ready | 1280 x 900 | 1 | 0 px |
| Mobile-sized ready | 390 x 844 | 1 | 0 px |
| Short desktop ready | 1024 x 500 | 1 | 0 px |
| Reduced motion ready | 1280 x 800 | 1 | 0 px |
| Worker-disabled fallback | 1280 x 900 | 0 | 0 px |

The stage's opacity/visibility were considered separately from model alpha. Reverse scrolling restored the stage; details/footer states had the stage hidden. No page errors occurred. Actual final-model mobile/finale and desktop/footer PNGs were inspected: the body is present before exit and no fragment paints below the details panel. Baseline and previous fixed/GLB evidence were not overwritten.

Evidence: ownership-glb-final.json, ownership-glb-final-probe.mjs and glb-final-*.png. Dynamic resize at the fade boundary was separately validated in ownership-fixed-resize.json; the final pending-load probe also exercised a warm resize before GLB readiness.

## Conditions, limits and remaining integration work

Existing Chromium 1248 / Chrome 156, headless Windows, DPR 1 unless explicitly noted, local production assets, no artificial network/CPU throttling. Root's separate screenshot browser could be active concurrently during lifecycle/prefix checks. No clean ready-time benchmark, idle-frame measurement, Lighthouse score or field Core Web Vitals claim is made; the pending-load probe deliberately delayed the response.

On-demand scheduling was source-reviewed, not newly benchmarked: frames are invalidated by state/size/visibility and stop after pose convergence. One model request per normal sweep was observed; no repeated model fetch was caused by finish controls in the prefix probe.

The integrator still owns the final fallback-image/concept-document copy, refreshed manifest/static-image validation and full local 40-test run. The final image bytes can differ from the audited earlier fallback renders while keeping the same file names. Model/art approval and native Safari/Firefox are outside this code audit. This local-only revision was not pushed or deployed by this auditor. No action denial or unresolved local code-audit blocker remains.
