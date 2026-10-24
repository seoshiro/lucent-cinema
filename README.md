# LUCENT P / 01

An original portable cinema projector design concept. One Blender-authored object, a continuous scroll camera journey, three material finishes, and three cinematic worlds.

The Blender remodel was visually reviewed and approved by the user for publication. Its implementation is `1bc887e`, with the standing project instructions added in `82f0cce`. See the [remodel review record](reports/remodel-preview.md); the deployed revision and asset hashes are recorded in the public [build manifest](https://seoshiro.github.io/lucent-cinema/build-manifest.json).

**[Experience LUCENT](https://seoshiro.github.io/lucent-cinema/)** · **[Screenshots and evidence](https://github.com/seoshiro/lucent-cinema/releases/tag/v1.0.2)**

This is a fictional product design study, not a product for sale. It makes no claims about measured optical performance, certification, manufacturing, or availability.

## Run locally

Use Node.js 24.18.0 and npm. Dependencies are pinned in `package-lock.json`.

```sh
npm ci --ignore-scripts
npm run dev
```

```sh
npm run verify
npm run test:e2e
```

Playwright uses an existing Windows Chromium installation when available. In a clean environment, install its official Chromium with `npx playwright install chromium`. CI uses the Google Chrome already provided by the standard Ubuntu 24.04 runner and verifies its actual version before running the complete test suite.

## Design and implementation

- React 19, TypeScript 6, Vite 8, Three.js. No paid API integration, templates, external fonts, trackers, forms, or backend.
- Original Blender aluminum chassis, recessed layered glass, ventilation, ports and feet, exported as optimized GLB. Three static finish fallbacks are actual transparent Blender renders. Blue hour uses a clean original vector landscape after the raster version was rejected. The other cinematic environments use SVG/CSS. See [artwork history](reports/cinematic-artwork.md) and [Blender source](assets/blender/README.md).
- One shared product stage. Native scrolling controls camera poses; no wheel interception or scroll locking.
- On-demand rendering in an optional OffscreenCanvas worker, capped pixel density, reduced motion, keyboard controls, touch targets, context loss recovery, and Blender-rendered WebP fallbacks when worker/WebGL capabilities are unavailable.
- Finish and world controls update the actual scene. The concept-sheet download is a real bundled file.
- `.21st/` records the project's visual decisions. Free 21st metadata lookup was attempted but its catalog returned an error; no paid component retrieval or generation was used.

The desktop team comprised one integrator and four actual subagents: art direction, motion/3D implementation, independent visual/UX audit, and independent code/security/performance audit. Reference viewing was completed separately by the parent and its reference analyst, using materialized source videos and sampling at four frames per second. No real-time playback or desktop viewing of the original MP4s is claimed. See [reference provenance](reports/reference-brief.md).

ECC-derived, 21st UI Build/Review, React Review and Verification instructions informed the work. ECC runtime, hooks, and paid services were not used. The remodel's editable master, materials and geometry are saved in Blender; Three.js loads the GLB for rendering and camera movement.

## Verification and release integrity

See the independent [visual audit](reports/visual-audit.md) and [code audit](reports/code-audit.md). Browser evidence is captured from the actual site. Automated desktop/mobile testing is distinct from human testing; lab timings are not field Core Web Vitals.

The GitHub Pages workflow builds and tests the exact pushed commit before publishing its artifact. `build-manifest.json` records that revision and SHA-256 hashes for every deployed file except the manifest itself. Reference MP4s, signed transfer metadata, environment files, build outputs and raw screenshot images are excluded from Git.

## License and assets

Original code, Blender and vector assets: [MIT](LICENSE). Runtime dependency notices are shipped at [`third-party-licenses.txt`](public/third-party-licenses.txt). Test tooling is development-only. The user-supplied video product imagery, brands, overlays, and audio are not redistributed.

GitHub Pages for public repositories and standard GitHub Actions runners for public repositories are available without hosting or runner charges under [GitHub's documented plans](https://docs.github.com/en/actions/concepts/billing-and-usage). No paid hosting or larger runners are configured.
