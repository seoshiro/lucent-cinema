# LUCENT P / 01 Blender remodel

Local preview asset. No push, publication or deployment is performed by these scripts.

The editable master is `lucent-projector.blend`; the runtime export is
`../../public/models/lucent-projector.glb`. Geometry, materials and converted
lettering are original Blender work. The two CC0 candidates were imported into
separate comparison scenes and are not part of the LUCENT export.

## Rebuild with the existing Blender

From the project root in PowerShell:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --disable-autoexec --background --factory-startup --python .\assets\blender\build_projector.py -- --samples 160 --width 1600
```

Blender 5.2.2 LTS, Cycles and the existing RTX 4050 through OptiX were actually
used. No software, models, textures or fonts were downloaded for the original
asset. The Blender built-in lettering is converted to geometry.

## Asset contract

- Blender front is `-Y`; exported glTF front is `+Z`, with Y up.
- The centered glTF bounding box is approximately `3.700 × 1.338 × 2.433`
  units, ordered width, height, depth. Nominal industrial scale is 320 × 115 ×
  210 mm. The outer lens diameter is 0.746 units, approximately 65 mm.
- Keep the `body_finish` material name. Only this material's base color changes
  for finishes; optical, polymer, vent and lettering materials stay static.
- Finish RGB values in `model-metadata.json` are **linear**, not CSS sRGB.
  Preserve the material's exported roughness and metallic values.
- The export joins copies into one mesh with material primitives to avoid one
  draw object per manufacturing detail. The master retains editable parts.
- GLB is material-only PBR, with no embedded images or external textures.
  Blender's microscopic procedural bead bump is studio-only and is not exported.
- The optical assembly contains a real deep tapered absorptive cavity, three
  matte baffles, two spaced transparent curved elements, and a clear outer lens.
  There is no reflective gray back disc or emissive optic.

## Studio and evidence

`../../evidence/remodel/model-metadata.json` records actual export counts,
bounds, materials and hashes. The same directory contains neutral front,
front three-quarter, rear/side, optical detail, warm hero, and three 1600 px
transparent finish renders. Transparent output now uses 256 fixed samples,
unchanged Blackman-Harris 1.5 filter and denoising. `render_fallbacks.py` can
refresh just those PNGs without saving the master or touching the GLB. The
studio renders use the requested higher sample count.

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --disable-autoexec --background .\assets\blender\lucent-projector.blend --python .\assets\blender\render_fallbacks.py
```

The studio contains neutral rectangular softboxes, floor, and a black optical
negative-fill reflection card. The card keeps a bright floor reflection from
washing over the dark pupil. Studio geometry and lights are excluded from GLB.
The viewport/environment in the application must be checked separately because
runtime lighting can change how clear glass reads.

The locally adopted material revision separates `optical_baffle` (linear
neutral reflectance 0.006, roughness 0.8, restrained specular) on the tapered
throat/rings from pure-black `optical_absorber` on the deep pupil/back. It
changes no geometry or camera. The preceding master, GLB, source and renders
are preserved under `checkpoints/pre-baffle-iteration05/`; the reviewed
candidate is archived under `checkpoints/adopted-baffle/`. These are private
working evidence, not additional public model assets.

`diagnose_optics.py` produces a clearly named diagnostic with the glass hidden
to verify the actual cavity. It never saves or exports over the master. This
diagnostic is not a final product render.

## Licensed comparison assets, not used in the export

`compare_candidate.py` only imports parent-verified GLB data, checks its SHA256,
normalizes width for photography and renders an isolated scene with autoexec
disabled. `-- --grab3d` selects the second candidate.

- [Innerscene projector](https://www.innerscene.com/tools/library/3d-parts/project-box-projector-6d147ec3):
  CC0 declared on the asset page and [library terms](https://www.innerscene.com/tools/library/terms).
- [Grab3D projector](https://grab3d.com/models/electronics/projector/):
  CC0 declared on the asset page and [license](https://grab3d.com/license/).

Both actual neutral renders were inspected. Their protruding lens barrels,
soft toy proportions and decorative focus controls did not match the restrained
low-wide LUCENT brief. Their pixels and provenance remain comparison evidence.
