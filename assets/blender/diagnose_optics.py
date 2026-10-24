"""Diagnostic only: verify the actual absorptive cavity with glass hidden.
Never export or save this diagnostic scene over the working master.
"""
import bpy
from mathutils import Vector
from pathlib import Path
import json

root = Path(__file__).resolve().parents[2]
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH' and any(slot.material and slot.material.name in {'optical_glass', 'inner_ar_glass'} for slot in obj.material_slots):
        obj.hide_render = True
    if obj.type == 'MESH' and any(slot.material and slot.material.name == 'optical_absorber' for slot in obj.material_slots):
        print('ABSORBER_GEOMETRY', obj.name, tuple(obj.location), flush=True)
mat = bpy.data.materials['optical_absorber'].node_tree.nodes['Principled BSDF']
print('ABSORBER_INPUTS', json.dumps({key: list(mat.inputs[key].default_value) if key == 'Base Color' else mat.inputs[key].default_value for key in ['Base Color', 'Metallic', 'Roughness', 'Specular IOR Level']}), flush=True)
scene = bpy.context.scene
camera = scene.camera
camera.location = (-2.0, -5.0, 1.4)
camera.rotation_euler = (Vector((-0.74, -0.85, 0.03)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.lens = 85
scene.cycles.samples = 80
scene.render.filepath = str(root / 'evidence/remodel/diagnostic-cavity-without-glass.png')
bpy.ops.render.render(write_still=True)
