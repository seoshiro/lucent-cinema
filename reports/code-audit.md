# Independent code, security, lifecycle and performance audit

Status: PASS for the scoped local prepublication audit. No unresolved P1, P2 or material P3 code/security/lifecycle finding remains. Exact-SHA CI and live deployment verification remain the integrator's separate gates.

## Scope and method

LUCENT is a fictional projector study: static page -> scroll-controlled procedural visuals -> reversible finish/world choices -> local concept download. There is no backend, account, checkout or form submission.

Reviewed App, CinemaWorld, ProductScene, product-renderer worker, scene-model, story logic, CSS/public assets, dependencies, Vite/manifest scripts, configuration, tests and Pages workflow. This auditor did not modify application source.

Applied Windows AGENTS, ECC-derived engineering/security/release guidance, React Best Practices and Verification. ECC runtime/hooks were not used. Tools actually used: PowerShell, Node/npm, ESLint, TypeScript, Node tests, Playwright/Chromium, Chrome DevTools Protocol, npm audit, Node crypto/zlib. No software, account, key, OAuth access or security setting was added.

Reference analysis is attributed to parent/analyst in reports/reference-brief.md. This auditor did not view original MP4 pixels.

## Fixed findings

| Priority | Problem | Resolution and independent recheck |
| --- | --- | --- |
| P2 | Main-thread WebGL startup produced >1-second tasks; a later main-thread capability probe still blocked for ~0.5 second. | Renderer moved to an OffscreenCanvas Worker; redundant main probe removed. Final main long tasks are only 95/96 ms React startup. |
| P2 | Shared model/fallback opacity could hide the hero after context loss at portal alpha 0. | Independent React SVG opacity. Actual worker context loss -> hero SVG visible -> restoration passed. |
| P2 release | Runtime MIT notices were initially missing. | React/React DOM/scheduler/Three notices included in final dist and manifest; project LICENSE exists. |
| P2 verification | Manifest initially omitted HTML/public assets. | Final manifest covers all ten static assets except itself; independent hash/byte checks found zero mismatches. |
| P3 build | Auxiliary browser globals initially broke lint. | Globals corrected/centralized; final independent whole-project lint passes. |

## Source, dependencies and workflow

No application HTML insertion, eval/dynamic function, cookie/storage use, runtime API request or user-data collection was found. React renders fixed local copy/options. The intended GitHub link uses noreferrer; final URL must match the published repository.

Concept status is explicit. No fabricated sales, certification, brightness measurement or backend success state was found. Geometry, textures, environments, fallback, grain and icon are created in code; fonts are system stacks. Source videos are not runtime assets.

Main imports of model/protocol are type-only. One same-origin module worker owns the Three renderer and receives fixed state/size/visibility messages. Failure/unmount terminates its worker and removes its canvas; guards prevent stale updates. Observers/events disconnect on cleanup. Rendering is demand-driven, stops hidden/offscreen and caps DPR at 1.5. Context restoration rebuilds the environment with guarded async completion. Unsupported capabilities/errors preserve a functional SVG.

Runtime React 19.3.1, React DOM 19.3.1, scheduler 0.28.0 and Three.js 0.186.1 are exact locked MIT dependencies with npm registry origins and integrity hashes. All lockfile packages have a license field. Development/build licenses include Apache-2.0, ISC, BSD, MPL-2.0, BlueOak-1.0.0 and CC-BY-4.0; these are not all shipped to browsers. Only optional fsevents declares an install script; integrator used ignore-scripts.

Independent npm audit --json returned zero known vulnerabilities across all severities for 197 dependency records. The permitted query sent dependency-tree metadata to npm registry; this is not an exhaustive supply-chain guarantee.

Workflow review: contents read globally; pages write/OIDC only deployment; checkout does not persist credentials; action commit SHAs pinned; locked npm ci ignore-scripts; verify/E2E precede artifact deployment. No credential reads or untrusted shell interpolation found. Integrator resolved action tag SHAs; this auditor did not repeat that lookup.

## Completed checks

| Check | Result | Evidence and limits |
| --- | --- | --- |
| Independent lint/typecheck | PASS | Final worker source and audit scripts, exit 0 |
| Independent unit tests | PASS | Three: scroll normalization, reversible portal, short landscape timing |
| Independent npm audit | PASS, scoped | Zero reported vulnerabilities |
| Final dist integrity | PASS | Ten assets, zero hash/byte mismatches; worker/HTML/notices included |
| Actual worker initialization | PASS | One dedicated worker and one queried WebGL2 context, ready true |
| Actual context loss/recovery | PASS | Portal loss -> ready false -> hero SVG opacity 1 -> restore ready true |
| Intentional worker exception | PASS | Handled failure -> worker count 0, canvas count 0, SVG opacity 1 |
| Unsupported worker/mobile | PASS | 390 x 844, Ember -> copper, SVG visible, no canvas/error |
| Independent browser health | PASS | No page/console errors, failed requests or HTTP >=400 |
| Final production startup | PASS for measured improvement | Two isolated samples below |
| Full integration E2E/axe | Integrator-reported PASS | 16 tests, four modes, all axe rules; suite not independently executed here |
| Exact-SHA CI/live identity | NOT TESTED by this auditor | Integrator must complete after publication |

Fault injection used the browser debugging protocol; no production debug API/global was added. Screenshots represent actual test states, not a fabricated unfixed/fixed comparison.

Evidence: scripts/audit-runtime.mjs, audit-production-11.json, audit-production-12.json, audit-worker.mjs, audit-worker-result.json and audit-worker-*.png. File names after the first share the scripts/ directory.

## Final lab measurements

Installed Chromium 1248 / HeadlessChrome 156 on Windows, headless, 1440 x 1000, DPR 1, new browser/context, unthrottled CPU/network, local production preview. Other browser loads stayed idle for the two final samples. OS/GPU caches were not controlled. Earlier same-host GPU inspection identified AMD Radeon hardware through ANGLE/D3D11.

| Sample | Text LCP | CLS | Largest main long task | Ready observed by |
| --- | ---: | ---: | ---: | ---: |
| 11 | 884 ms | 0 | 95 ms | 2199 ms |
| 12 | 828 ms | 0 | 96 ms | 2194 ms |

Both had one worker, ready 3D and no browser/network errors. The SVG remains visible during worker initialization. Ready observation is not an exact first-GPU-pixel timestamp.

These are local lab results, not field Core Web Vitals, Lighthouse scores, mobile performance measurements or a universal no-jank guarantee. Historical profiled runs were diagnostics, not a controlled statistical A/B benchmark.

Final raw / local gzip bytes:
- Initial JS: 238303 / 73709.
- Lazy scene coordinator: 2728 / 1230.
- Renderer worker: 552597 / 137306.
- Main CSS: 15885 / 4421; scene CSS: 1108 / 404.

Gzip uses Node zlib, not measured network transfer. The renderer remains a substantial enhancement; unsupported browsers retain SVG/DOM functionality. Local manifest revision is local-development, not a release SHA. Worker asset SHA-256: ca34b0ab071186a3a5c3eb0222d44dab933ac35d77f858ab7cf63a37275408d5.

## Remaining integrator gates and limits

Review public Git inventory, run CI for the exact published commit, confirm Pages deployment, compare live manifest revision/every asset hash and complete live browser flows. Native Safari/Firefox and field performance were not tested here. No denial or execution blocker remains in this auditor's scoped local work.

