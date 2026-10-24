"""Material-only Blender preview; existing master/runtime GLB stay unchanged."""
import hashlib
import json
from pathlib import Path
import struct
import sys

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/blender/lucent-projector.blend'
SOURCE_GLB = ROOT / 'public/models/lucent-projector.glb'
OUT = ROOT / 'evidence/remodel'
PREVIEW_BLEND = ROOT / 'assets/blender/lucent-projector-baffle-preview.blend'
PREVIEW_GLB = ROOT / 'public/models/lucent-projector-baffle-preview.glb'
source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
source_glb_hash = hashlib.sha256(SOURCE_GLB.read_bytes()).hexdigest()

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_projector as builder

scene = bpy.context.scene
root = bpy.data.objects['LUCENT_P01_Blender_Master']
builder.PRODUCT[:] = [obj for obj in scene.objects if obj.type == 'MESH' and obj.parent == root]
baffle = builder.material('optical_baffle', (0.006, 0.006, 0.006), 0, 0.8)
baffle.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value = 0.08
changed = []
for obj in builder.PRODUCT:
    if obj.name == 'Actual recessed optical throat' or obj.name.startswith('Matte internal optical baffle'):
        for slot in obj.material_slots:
            if slot.material and slot.material.name == 'optical_absorber':
                slot.material = baffle
                changed.append(obj.name)
body = bpy.data.materials['body_finish']
body_shader = body.node_tree.nodes['Principled BSDF']
normal_link = body_shader.inputs['Normal'].links[0]
bump = normal_link.from_node
builder.GLB = PREVIEW_GLB
builder.export_asset(body, body_shader, bump, normal_link, root)

preferences = bpy.context.preferences.addons['cycles'].preferences
preferences.compute_device_type = 'OPTIX'
preferences.get_devices()
for device in preferences.devices:
    device.use = device.type == 'OPTIX'
scene.cycles.device = 'GPU'
scene.cycles.samples = 192
scene.cycles.use_adaptive_sampling = True
scene.cycles.use_denoising = True
scene.cycles.denoiser = 'OPTIX'
scene.render.film_transparent = False
bpy.data.objects['Studio floor - excluded from GLB'].hide_render = False
for obj in scene.objects:
    if obj.type == 'LIGHT':
        obj.data.color = (1, 1, 1)
camera = scene.camera
camera.data.type = 'PERSP'
for name, position, target, lens in [
    ('baffle-preview-optical-detail.png', (-2.0, -5.0, 1.4), (-0.74, -0.85, 0.03), 85),
    ('baffle-preview-three-quarter.png', (5.6, -8.4, 4.8), (0, 0, -0.035), 68),
]:
    camera.location = position
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.lens = lens
    scene.render.filepath = str(OUT / name)
    bpy.ops.render.render(write_still=True)
bpy.context.preferences.filepaths.save_version = 0
bpy.context.preferences.filepaths.file_preview_type = 'NONE'
bpy.ops.wm.save_as_mainfile(filepath=str(PREVIEW_BLEND), compress=True)
data = PREVIEW_GLB.read_bytes()
json_length = struct.unpack_from('<I', data, 12)[0]
gltf = json.loads(data[20:20 + json_length])
primitives = [primitive for mesh in gltf['meshes'] for primitive in mesh['primitives']]
report = {
    'material_only_change': True,
    'changed_objects': changed,
    'baffle_base_color_linear': [0.006, 0.006, 0.006],
    'baffle_roughness': 0.8,
    'baffle_specular_ior_level_blender': 0.08,
    'pure_black_pupil_material': 'optical_absorber',
    'preview_blend': str(PREVIEW_BLEND),
    'preview_glb': str(PREVIEW_GLB),
    'preview_glb_bytes': len(data),
    'preview_glb_sha256': hashlib.sha256(data).hexdigest(),
    'glb_triangles': sum(gltf['accessors'][p['indices']]['count'] // 3 for p in primitives),
    'glb_vertices': sum(gltf['accessors'][p['attributes']['POSITION']]['count'] for p in primitives),
    'glb_material_primitives': len(primitives),
    'master_sha256_before': source_hash,
    'master_sha256_after': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'runtime_glb_sha256_before': source_glb_hash,
    'runtime_glb_sha256_after': hashlib.sha256(SOURCE_GLB.read_bytes()).hexdigest(),
    'note': 'Only the tapered throat and three matte internal rings receive a tiny neutral reflectance. Deep back/pupil remains pure zero reflectance/specular. No emission, geometry or camera choreography changes.',
}
(OUT / 'baffle-preview-metadata.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print('BAFFLE_PREVIEW ' + json.dumps(report), flush=True)
