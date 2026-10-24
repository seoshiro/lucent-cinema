"""Refresh photos from the adopted master without exporting or saving 3D data."""
from argparse import Namespace
import hashlib
import json
from pathlib import Path
import sys

import bpy

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_projector as builder

source_master = Path(bpy.data.filepath)
master_before = hashlib.sha256(source_master.read_bytes()).hexdigest()
glb_before = hashlib.sha256(builder.GLB.read_bytes()).hexdigest()
scene = bpy.context.scene
preferences = bpy.context.preferences.addons['cycles'].preferences
preferences.compute_device_type = 'OPTIX'
preferences.get_devices()
for device in preferences.devices:
    device.use = device.type == 'OPTIX'
scene.cycles.device = 'GPU'
scene.cycles.samples = 160
scene.cycles.use_adaptive_sampling = True
scene.cycles.use_denoising = True
scene.cycles.denoiser = 'OPTIX'
scene['lucent_fallback_samples'] = 256
scene.render.resolution_x = 1600
scene.render.resolution_y = 1200
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.color_depth = '8'
product_root = bpy.data.objects['LUCENT_P01_Blender_Master']
builder.PRODUCT[:] = [obj for obj in scene.objects if obj.type == 'MESH' and obj.parent == product_root]
camera = scene.camera
ground = bpy.data.objects['Studio floor - excluded from GLB']
lights = [bpy.data.objects[name] for name in [
    'Key large neutral softbox', 'Fill broad neutral softbox',
    'Rear edge neutral strip', 'Front optical reflection strip',
]]
for view in ['front', 'three-quarter', 'rear', 'detail', 'warm', 'fallback', 'fallback-silver', 'fallback-copper']:
    builder.photograph(scene, camera, ground, lights, view)
builder.metadata(scene, Namespace(samples=160, fallback_samples=256))
metadata_path = builder.EVIDENCE / 'model-metadata.json'
receipt = json.loads(metadata_path.read_text(encoding='utf-8'))
receipt['master_blend_bytes'] = source_master.stat().st_size
receipt['master_blend_sha256'] = hashlib.sha256(source_master.read_bytes()).hexdigest()
receipt['build_script_sha256'] = hashlib.sha256((ROOT / 'assets/blender/build_projector.py').read_bytes()).hexdigest()
receipt['render_refresh_master_sha256_before'] = master_before
receipt['render_refresh_glb_sha256_before'] = glb_before
receipt['render_refresh_glb_sha256_after'] = hashlib.sha256(builder.GLB.read_bytes()).hexdigest()
receipt['product_renders'] = [str(builder.EVIDENCE / name) for name in [
    'neutral-front.png', 'neutral-three-quarter.png', 'neutral-rear-side.png',
    'neutral-optical-detail.png', 'warm-hero.png', 'product-fallback.png',
    'product-fallback-silver.png', 'product-fallback-copper.png',
]]
metadata_path.write_text(json.dumps(receipt, indent=2), encoding='utf-8')
print('ADOPTED_RENDER_RECEIPT ' + json.dumps(receipt), flush=True)
