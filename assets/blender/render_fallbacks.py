"""Refine only three transparent PNGs from the saved Blender master.

No geometry, GLB, material defaults in the master, or BLEND file is saved.
"""
import hashlib
import json
from pathlib import Path
import shutil

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'evidence/remodel'
ANALYSIS = OUT / 'alpha-analysis'
ANALYSIS.mkdir(parents=True, exist_ok=True)
SOURCE = Path(bpy.data.filepath)
source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
scene = bpy.context.scene
old_settings = {
    'cycles_samples_saved_in_master': scene.cycles.samples,
    'adaptive_sampling': scene.cycles.use_adaptive_sampling,
    'denoising': scene.cycles.use_denoising,
    'filter_size': scene.render.filter_size,
    'pixel_filter_type': scene.cycles.pixel_filter_type,
}
preferences = bpy.context.preferences.addons['cycles'].preferences
preferences.compute_device_type = 'OPTIX'
preferences.get_devices()
for device in preferences.devices:
    device.use = device.type == 'OPTIX'
scene.cycles.device = 'GPU'
scene.cycles.samples = 256
scene.cycles.use_adaptive_sampling = False
scene.cycles.use_denoising = True
scene.cycles.denoiser = 'OPTIX'
scene.render.film_transparent = True
scene.render.resolution_x = 1600
scene.render.resolution_y = 1200
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.color_depth = '8'
bpy.data.objects['Studio floor - excluded from GLB'].hide_render = True
for obj in scene.objects:
    if obj.type == 'LIGHT':
        obj.data.color = (1, 1, 1)
camera = scene.camera
camera.location = (5.6, -8.4, 4.8)
camera.rotation_euler = (Vector((0, 0, -0.035)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'PERSP'
camera.data.lens = 68
body = bpy.data.materials['body_finish']
outputs = []
for name, color in [
    ('product-fallback.png', (0.045, 0.052, 0.060)),
    ('product-fallback-silver.png', (0.380, 0.400, 0.430)),
    ('product-fallback-copper.png', (0.280, 0.120, 0.055)),
]:
    path = OUT / name
    backup = ANALYSIS / ('baseline-' + name)
    if path.exists() and not backup.exists():
        shutil.copyfile(path, backup)
    body.diffuse_color = (*color, 1)
    body.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*color, 1)
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    outputs.append({'path': str(path), 'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
receipt = {
    'source_master': str(SOURCE),
    'master_sha256_before': source_hash,
    'master_sha256_after': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'old_render_settings_in_master': old_settings,
    'transparent_source_samples_before_refinement': 32,
    'refined_samples': 256,
    'adaptive_sampling': False,
    'denoising': True,
    'filter_size_unchanged': scene.render.filter_size,
    'pixel_filter_type_unchanged': scene.cycles.pixel_filter_type,
    'geometry_or_glb_changes': False,
    'outputs': outputs,
}
(ANALYSIS / 'fallback-render-receipt.json').write_text(json.dumps(receipt, indent=2), encoding='utf-8')
print('FALLBACK_REFINEMENT ' + json.dumps(receipt), flush=True)
