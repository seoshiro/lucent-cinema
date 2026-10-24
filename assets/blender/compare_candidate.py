"""Import the parent-verified CC0 Innerscene GLB as data into an isolated scene.

Use Blender --disable-autoexec --background --factory-startup --python this.py.
This comparison does not change or export the original LUCENT master/GLB.
"""
from argparse import Namespace
import hashlib
import json
from pathlib import Path
import sys

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
IS_GRAB3D = '--grab3d' in sys.argv
CANDIDATE = 'grab3d' if IS_GRAB3D else 'innerscene'
SOURCE = ROOT / ('evidence/review/' + CANDIDATE + '-projector.glb')
OUTPUT = ROOT / ('evidence/remodel/candidate-' + CANDIDATE + '-three-quarter.png')
EXPECTED = 'e35c1277fc0c51c102ed26b2c237a364398de5a6b4a01866d2bddb92514e2aa8' if IS_GRAB3D else '358d617478c170cbc7db0aa75855fa0fb946885e97346303944f28a1c1f79681'

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_projector as product


def main():
    actual = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    if actual != EXPECTED:
        raise RuntimeError('Candidate bytes differ from the parent-verified checkpoint')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(SOURCE))
    imported = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    product.PRODUCT[:] = imported
    lower, upper = product.bounds()
    center = (Vector(lower) + Vector(upper)) / 2
    dimensions = Vector(upper) - Vector(lower)
    factor = 3.7 / dimensions.x
    imported_roots = [obj for obj in bpy.context.scene.objects if obj.parent is None]
    normalizer = bpy.data.objects.new('CC0 comparison normalization only', None)
    bpy.context.scene.collection.objects.link(normalizer)
    for obj in imported_roots:
        obj.parent = normalizer
    normalizer.scale = (factor, factor, factor)
    normalizer.location = -center * factor
    bpy.context.view_layer.update()
    lens_centers = [(obj.name, list(obj.matrix_world.translation)) for obj in imported if any(word in obj.name.lower() for word in ['lens', 'optic', 'glass'])]
    print('CANDIDATE_OPTICAL_OBJECTS ' + json.dumps(lens_centers), flush=True)
    scene, camera, ground, lights = product.studio(Namespace(samples=64, width=1600))
    camera.location = (5.6, -8.4, 4.8)
    camera.rotation_euler = (Vector((0, 0, -0.035)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.type = 'PERSP'
    camera.data.lens = 68
    scene.render.filepath = str(OUTPUT)
    bpy.ops.render.render(write_still=True)
    result = {
        'source': str(SOURCE), 'sha256': actual,
        'source_page': 'https://grab3d.com/models/electronics/projector/' if IS_GRAB3D else 'https://www.innerscene.com/tools/library/3d-parts/project-box-projector-6d147ec3',
        'license_page': 'https://grab3d.com/license/' if IS_GRAB3D else 'https://www.innerscene.com/tools/library/terms',
        'license_declared': 'CC0 1.0; source page and terms verified by parent and motion role',
        'comparison_only': True,
        'raw_blender_dimensions_xyz': list(dimensions),
        'uniform_scale_for_comparison': factor,
        'normalized_dimensions_xyz': [value * factor for value in dimensions],
        'mesh_objects': len(imported),
        'materials': sorted({slot.material.name for obj in imported for slot in obj.material_slots if slot.material}),
        'optical_object_centers': lens_centers,
        'render': str(OUTPUT), 'engine': scene.render.engine,
        'samples': scene.cycles.samples, 'device': scene.cycles.device,
        'render_resolution': [scene.render.resolution_x, scene.render.resolution_y],
        'safety': 'Only GLB data imported with Blender autoexec disabled. No third-party scripts or BLEND files executed.',
    }
    (OUTPUT.parent / ('candidate-' + CANDIDATE + '-metadata.json')).write_text(json.dumps(result, indent=2), encoding='utf-8')
    print('CANDIDATE_COMPARISON ' + json.dumps(result), flush=True)


if __name__ == '__main__':
    main()
