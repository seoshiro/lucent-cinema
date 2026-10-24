"""Original LUCENT portable cinema projector, modeled and rendered in Blender.

Run the existing Blender 5.2 binary in background mode with this script.
No downloaded models, textures, fonts, templates or paid services are used.
The Blender master includes a microscopic procedural bead finish; the GLB is
material-only PBR, with the same geometry and converted lettering.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import struct
import sys

import bmesh
import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
MASTER = ROOT / 'assets/blender/lucent-projector.blend'
GLB = ROOT / 'public/models/lucent-projector.glb'
EVIDENCE = ROOT / 'evidence/remodel'
PRODUCT = []
FINISH_COLORS = {
    'graphite': (0.045, 0.052, 0.060),
    'silver': (0.380, 0.400, 0.430),
    'copper': (0.280, 0.120, 0.055),
}


def arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('--views', default='front,three-quarter,rear,detail,warm,fallback,fallback-silver,fallback-copper')
    parser.add_argument('--samples', type=int, default=80)
    parser.add_argument('--width', type=int, default=1600)
    parser.add_argument('--fallback-samples', type=int, default=256)
    return parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])


def material(name, color, metallic=0, roughness=0.4, transmission=0, ior=1.46):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = (*color, 1)
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['IOR'].default_value = ior
    shader.inputs['Transmission Weight'].default_value = transmission
    return mat


def apply_modifier(obj, modifier):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def finish(obj, mat, bevel=0, segments=4, smooth=True, weighted=True, product=True):
    if mat:
        obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new('Manufactured edge radius', 'BEVEL')
        modifier.width = bevel
        modifier.segments = segments
        modifier.limit_method = 'ANGLE'
        apply_modifier(obj, modifier)
    if obj.type == 'MESH':
        for polygon in obj.data.polygons:
            polygon.use_smooth = smooth
        if weighted:
            modifier = obj.modifiers.new('Weighted production normals', 'WEIGHTED_NORMAL')
            modifier.keep_sharp = True
            modifier.weight = 50
            apply_modifier(obj, modifier)
        # Large planar faces must stay planar after boolean triangulation.
        # Bevel patches remain smooth; no broad-face interpolated gradients.
        for polygon in obj.data.polygons:
            if polygon.area > 0.006 and max(abs(component) for component in polygon.normal) > 0.99999:
                polygon.use_smooth = False
    if product:
        PRODUCT.append(obj)
    return obj


def box(name, dimensions, location, mat=None, bevel=0.01, segments=4, product=True):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, mat, bevel, segments, product=product)


def cut(obj, cutter):
    modifier = obj.modifiers.new('Machined recess', 'BOOLEAN')
    modifier.operation = 'DIFFERENCE'
    modifier.solver = 'EXACT'
    modifier.object = cutter
    apply_modifier(obj, modifier)
    if cutter in PRODUCT:
        PRODUCT.remove(cutter)
    bpy.data.objects.remove(cutter, do_unlink=True)


def cylinder(name, radius, depth, location, mat, axis='Z', bevel=0.003, vertices=64):
    rotation = (math.pi / 2, 0, 0) if axis == 'Y' else (0, 0, 0)
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, end_fill_type='NGON', location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, mat, bevel, 3)


def torus(name, major, minor, location, mat, axis='Y'):
    rotation = (math.pi / 2, 0, 0) if axis == 'Y' else (0, 0, 0)
    bpy.ops.mesh.primitive_torus_add(major_segments=80, minor_segments=8, location=location, rotation=rotation, major_radius=major, minor_radius=minor)
    obj = bpy.context.object
    obj.name = name
    return finish(obj, mat, smooth=True, weighted=False)


def text(name, body, location, size, mat, rear=False, spacing=1.05):
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = body
    curve.align_x = 'CENTER'
    curve.align_y = 'CENTER'
    curve.size = size
    curve.space_character = spacing
    curve.extrude = 0.00025
    curve.resolution_u = 6
    obj = bpy.data.objects.new(name, curve)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (math.pi / 2, 0, math.pi) if rear else (math.pi / 2, 0, 0)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    obj = bpy.context.object
    obj.data.materials.append(mat)
    PRODUCT.append(obj)
    return obj


def rounded_loop(width, height, radius, segments=5):
    points = []
    for cx, cz, start in [
        (width / 2 - radius, height / 2 - radius, 0),
        (-width / 2 + radius, height / 2 - radius, 90),
        (-width / 2 + radius, -height / 2 + radius, 180),
        (width / 2 - radius, -height / 2 + radius, 270),
    ]:
        for step in range(segments + 1):
            angle = math.radians(start + step / segments * 90)
            points.append((cx + math.cos(angle) * radius, cz + math.sin(angle) * radius))
    return points


def profile_ring(name, outer, inner, location, depth, mat):
    count = len(outer)
    assert count == len(inner)
    x, y, z = location
    vertices = [(x + px, y + dy, z + pz) for dy in [-depth / 2, depth / 2] for loop in [outer, inner] for px, pz in loop]
    faces = []
    for index in range(count):
        nxt = (index + 1) % count
        faces += [
            (index, nxt, count + nxt, count + index),
            (2 * count + index, 3 * count + index, 3 * count + nxt, 2 * count + nxt),
            (index, 2 * count + index, 2 * count + nxt, nxt),
            (count + index, count + nxt, 3 * count + nxt, 3 * count + index),
        ]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return finish(obj, mat, bevel=0.0015, segments=2)


def planar_plate(name, width, height, corner_radius, depth, location, mat):
    loop = rounded_loop(width, height, corner_radius, segments=8)
    count = len(loop)
    x, y, z = location
    vertices = [(x + px, y + dy, z + pz) for dy in [-depth / 2, depth / 2] for px, pz in loop]
    faces = [tuple(range(count)), tuple(reversed(range(count, count * 2)))]
    faces += [(index, (index + 1) % count, (index + 1) % count + count, index + count) for index in range(count)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return finish(obj, mat, bevel=0.003, segments=3)


def optical_throat(mat):
    profile = [(-1.151, 0.388), (-1.08, 0.350), (-1.00, 0.308), (-0.90, 0.268), (-0.78, 0.226), (-0.60, 0.192), (-0.49, 0.175)]
    segments = 96
    vertices = [(-0.97 + radius * math.cos(index * math.tau / segments), y, 0.065 + radius * math.sin(index * math.tau / segments)) for y, radius in profile for index in range(segments)]
    faces = []
    for ring in range(len(profile) - 1):
        for index in range(segments):
            a = ring * segments + index
            n = ring * segments + (index + 1) % segments
            faces.append((a, n, n + segments, a + segments))
    mesh = bpy.data.meshes.new('Actual tapered optical throat')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new('Actual recessed optical throat', mesh)
    bpy.context.scene.collection.objects.link(obj)
    return finish(obj, mat, weighted=False)


def build():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for data in bpy.data.materials:
        bpy.data.materials.remove(data)

    body = material('body_finish', FINISH_COLORS['graphite'], 0.55, 0.47)
    body_shader = body.node_tree.nodes.get('Principled BSDF')
    body_shader.inputs['Specular IOR Level'].default_value = 0.32
    noise = body.node_tree.nodes.new('ShaderNodeTexNoise')
    noise.name = 'Microscopic bead finish - Blender studio only'
    noise.inputs['Scale'].default_value = 760
    noise.inputs['Detail'].default_value = 2
    bump = body.node_tree.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.075
    bump.inputs['Distance'].default_value = 0.0012
    body.node_tree.links.new(noise.outputs['Fac'], bump.inputs['Height'])
    normal_link = body.node_tree.links.new(bump.outputs['Normal'], body_shader.inputs['Normal'])
    bezel = material('front_bezel', (0.019, 0.022, 0.026), 0.22, 0.44)
    recess = material('vent_interior', (0.006, 0.007, 0.009), 0.05, 0.7)
    fins = material('vent_graphite', (0.036, 0.042, 0.047), 0.65, 0.42)
    rubber = material('rubber_feet', (0.012, 0.014, 0.016), 0, 0.78)
    port_metal = material('port_metal', (0.2, 0.22, 0.24), 0.84, 0.31)
    lettering = material('lettering', (0.43, 0.46, 0.48), 0.25, 0.48)
    glass = material('optical_glass', (0.94, 0.97, 1.0), 0, 0.008, 1.0, 1.51)
    glass_shader = glass.node_tree.nodes.get('Principled BSDF')
    glass_shader.inputs['Specular IOR Level'].default_value = 0.25
    glass_shader.inputs['Coat Weight'].default_value = 0
    inner_glass = material('inner_ar_glass', (0.97, 0.985, 1.0), 0, 0.006, 1.0, 1.42)
    inner_glass.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value = 0.16
    optical_absorber = material('optical_absorber', (0, 0, 0), 0, 1)
    optical_absorber.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value = 0
    optical_baffle = material('optical_baffle', (0.006, 0.006, 0.006), 0, 0.8)
    optical_baffle.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value = 0.08
    sensor_glass = material('sensor_glass', (0.015, 0.025, 0.031), 0.28, 0.17)

    shell = box('Machined aluminum upper housing', (3.7, 2.42, 1.15), (0, 0, 0.055), body, 0.060, 6)
    cut(shell, box('Front panel recess tool', (3.47, 0.18, 0.94), (0, -1.235, 0.055), bevel=0.064, segments=6, product=False))
    cut(shell, box('Deep optical cavity clearance tool', (1.10, 1.10, 0.87), (-0.97, -0.94, 0.065), bevel=0.075, segments=6, product=False))
    front = planar_plate('Inset planar continuous front fascia', 3.45, 0.92, 0.055, 0.038, (0, -1.184, 0.055), bezel)
    cut(front, box('Fascia optical opening tool', (1.09, 0.18, 0.86), (-0.97, -1.188, 0.065), bevel=0.07, segments=6, product=False))

    pocket = planar_plate('Matte planar recessed optical pocket', 1.075, 0.845, 0.067, 0.10, (-0.97, -1.135, 0.065), bezel)
    cutter = cylinder('Optical aperture tool', 0.397, 0.3, (-0.97, -1.12, 0.065), recess, axis='Y', bevel=0, vertices=96)
    cut(pocket, cutter)
    optical_throat(optical_baffle)
    cylinder('Deep absorptive pupil - no reflective gray back', 0.178, 0.018, (-0.97, -0.472, 0.065), optical_absorber, axis='Y', bevel=0.002, vertices=96)
    for radius, y in [(0.349, -1.078), (0.273, -0.917), (0.218, -0.748)]:
        torus('Matte internal optical baffle', radius, 0.006, (-0.97, y, 0.065), optical_baffle)
    for name, radius, y, thickness in [
        ('First spaced transparent curved optical element', 0.305, -0.990, 0.027),
        ('Second spaced transparent curved optical element', 0.224, -0.785, 0.021),
    ]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, location=(-0.97, y, 0.065))
        element = bpy.context.object
        element.name = name
        element.scale = (radius, thickness, radius)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        finish(element, inner_glass, weighted=False)
    torus('Single dark optical retaining edge', 0.383, 0.009, (-0.97, -1.182, 0.065), bezel)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=80, ring_count=40, location=(-0.97, -1.133, 0.065))
    lens = bpy.context.object
    lens.name = 'Recessed convex coated lens 65mm'
    lens.scale = (0.373, 0.055, 0.373)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish(lens, glass, weighted=False)

    box('Depth sensor optical window', (0.205, 0.009, 0.056), (1.29, -1.207, 0.145), sensor_glass, 0.022, 5)
    text('Front converted wordmark', 'L U C E N T', (0.63, -1.2075, -0.075), 0.101, lettering)
    text('Front converted product family', 'PORTABLE CINEMA', (0.63, -1.2075, -0.205), 0.031, lettering, spacing=1.10)

    for side in [-1, 1]:
        cut(shell, box('Side ventilation recess tool', (0.15, 1.53, 0.50), (side * 1.844, 0.23, -0.015), bevel=0.047, segments=5, product=False))
        box(f'{side} recessed vent shadow', (0.018, 1.49, 0.465), (side * 1.774, 0.23, -0.015), recess, 0.027, 4)
        for index in range(8):
            box(f'{side} cooling louver {index:02d}', (0.038, 1.405, 0.021), (side * 1.804, 0.23, -0.218 + index * 0.058), fins, 0.007, 3)

    cut(shell, box('Rear exhaust recess tool', (2.68, 0.15, 0.215), (-0.18, 1.207, 0.29), bevel=0.035, segments=5, product=False))
    box('Rear exhaust interior', (2.62, 0.025, 0.18), (-0.18, 1.15, 0.29), recess, 0.018, 4)
    for index in range(34):
        box(f'Rear exhaust fin {index:02d}', (0.025, 0.026, 0.16), (-1.43 + index * 0.0755, 1.18, 0.29), fins, 0.005, 3)

    cut(shell, box('Rear connector panel clearance tool', (2.15, 0.15, 0.37), (0.12, 1.22, -0.19), bevel=0.042, segments=5, product=False))
    box('Recessed rear connector plate', (2.10, 0.035, 0.33), (0.12, 1.176, -0.19), bezel, 0.035, 4)
    # Actual open shell profiles, backed by dark connector interiors.
    outer = [(-0.105, 0.044), (0.105, 0.044), (0.105, -0.005), (0.076, -0.044), (-0.076, -0.044), (-0.105, -0.005)]
    inner = [(x * 0.82, z * 0.72) for x, z in outer]
    profile_ring('HDMI port metal mouth', outer, inner, (-0.54, 1.208, -0.20), 0.024, port_metal)
    box('HDMI dark connector interior', (0.19, 0.012, 0.072), (-0.54, 1.19, -0.20), recess, 0.008)
    box('HDMI internal tongue', (0.137, 0.013, 0.011), (-0.54, 1.213, -0.197), fins, 0.003)
    profile_ring('USB-C port metal mouth', rounded_loop(0.142, 0.069, 0.033), rounded_loop(0.113, 0.041, 0.0195), (0.10, 1.208, -0.20), 0.022, port_metal)
    box('USB-C dark connector interior', (0.12, 0.012, 0.045), (0.10, 1.19, -0.20), recess, 0.018)
    box('USB-C central tongue', (0.083, 0.012, 0.010), (0.10, 1.213, -0.20), fins, 0.004)
    cylinder('DC inlet interior', 0.044, 0.015, (0.75, 1.202, -0.20), recess, axis='Y', bevel=0.001, vertices=48)
    torus('DC inlet dark metal lip', 0.043, 0.006, (0.75, 1.211, -0.20), port_metal)
    cylinder('DC center contact', 0.009, 0.014, (0.75, 1.214, -0.20), port_metal, axis='Y', bevel=0.002, vertices=24)
    for label, x in [('HDMI', -0.54), ('USB-C', 0.10), ('DC IN', 0.75)]:
        text('Rear converted ' + label, label, (x, 1.195, -0.096), 0.030, lettering, rear=True)
    for x in [-0.88, 1.12]:
        cylinder('Rear inset service fastener', 0.018, 0.008, (x, 1.198, -0.20), fins, axis='Y', bevel=0.001, vertices=24)

    box('Inset lower housing with quiet seam', (3.57, 2.29, 0.052), (0, 0, -0.557), body, 0.015, 4)
    box('Lower seam shadow', (3.55, 2.27, 0.008), (0, 0, -0.525), recess, 0.003, 3)
    for x in [-1.39, 1.39]:
        for y in [-0.82, 0.82]:
            cylinder('Soft-touch isolating foot', 0.124, 0.106, (x, y, -0.636), rubber, bevel=0.018, vertices=40)

    cylinder('Recessed tactile dial well', 0.167, 0.012, (1.15, 0.53, 0.630), recess, bevel=0.005, vertices=80)
    cylinder('Single tactile aluminum control', 0.145, 0.015, (1.15, 0.53, 0.639), bezel, bevel=0.006, vertices=80)
    # Understated tactile index, with no glowing indicator or chrome ornament.
    box('Dial tactile index', (0.013, 0.049, 0.0018), (1.15, 0.447, 0.648), lettering, 0.001, 2)

    # Recalculate weighted normals after booleans cut the manufactured shell.
    for obj in [shell, front, pocket]:
        modifier = obj.modifiers.new('Final machined surface normals', 'WEIGHTED_NORMAL')
        modifier.keep_sharp = True
        modifier.weight = 50
        apply_modifier(obj, modifier)
        for polygon in obj.data.polygons:
            if polygon.area > 0.006 and max(abs(component) for component in polygon.normal) > 0.99999:
                polygon.use_smooth = False

    points = [obj.matrix_world @ Vector(corner) for obj in PRODUCT for corner in obj.bound_box]
    lower = Vector(tuple(min(point[axis] for point in points) for axis in range(3)))
    upper = Vector(tuple(max(point[axis] for point in points) for axis in range(3)))
    center = (lower + upper) / 2
    product_root = bpy.data.objects.new('LUCENT_P01_Blender_Master', None)
    bpy.context.scene.collection.objects.link(product_root)
    product_root['design'] = 'Original low-wide portable cinema projector, 320 x 210 x 115 mm nominal design study'
    product_root['front_axis_blender'] = '-Y'
    for obj in PRODUCT:
        obj.location -= center
        obj.parent = product_root
    return body, body_shader, bump, normal_link, product_root


def bounds():
    bpy.context.view_layer.update()
    points = [obj.matrix_world @ Vector(corner) for obj in PRODUCT for corner in obj.bound_box]
    lower = [min(point[axis] for point in points) for axis in range(3)]
    upper = [max(point[axis] for point in points) for axis in range(3)]
    return lower, upper


def export_asset(body, body_shader, bump, normal_link, product_root):
    GLB.parent.mkdir(parents=True, exist_ok=True)
    body.node_tree.links.remove(normal_link)
    bpy.ops.object.select_all(action='DESELECT')
    copies = []
    copied_meshes = []
    for obj in PRODUCT:
        clone = obj.copy()
        clone.data = obj.data.copy()
        clone.parent = None
        clone.matrix_world = obj.matrix_world.copy()
        bpy.context.scene.collection.objects.link(clone)
        clone.select_set(True)
        copies.append(clone)
        copied_meshes.append(clone.data)
    bpy.context.view_layer.objects.active = copies[0]
    bpy.ops.object.join()
    export_mesh = bpy.context.object
    export_mesh.name = 'LUCENT_P01_Optimized_Blender_Geometry'
    export_mesh['design'] = product_root['design']
    export_mesh['front_axis_blender'] = '-Y'
    bpy.context.scene.cursor.location = (0, 0, 0)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    bpy.ops.export_scene.gltf(filepath=str(GLB), export_format='GLB', use_selection=True,
        export_apply=True, export_yup=True, export_materials='EXPORT', export_extras=True,
        export_cameras=False, export_lights=False, export_animations=False,
        export_texcoords=False, export_tangents=False,
        export_draco_mesh_compression_enable=False)
    bpy.data.objects.remove(export_mesh, do_unlink=True)
    for mesh in copied_meshes:
        if mesh.users == 0:
            bpy.data.meshes.remove(mesh)
    body.node_tree.links.new(bump.outputs['Normal'], body_shader.inputs['Normal'])


def studio(args):
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = args.samples
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.015
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 8
    scene.cycles.transmission_bounces = 8
    scene.cycles.sample_clamp_indirect = 3
    if hasattr(scene.cycles, 'caustics_refractive'):
        scene.cycles.caustics_refractive = False
    preferences = bpy.context.preferences.addons['cycles'].preferences
    try:
        preferences.compute_device_type = 'OPTIX'
        preferences.get_devices()
        for device in preferences.devices:
            device.use = device.type == 'OPTIX'
        scene.cycles.device = 'GPU'
        scene.cycles.denoiser = 'OPTIX'
    except (TypeError, ValueError, RuntimeError):
        scene.cycles.device = 'CPU'
    scene.render.resolution_x = args.width
    scene.render.resolution_y = round(args.width * 0.75)
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'
    scene.render.film_transparent = False
    scene.view_settings.view_transform = 'AgX'
    try:
        scene.view_settings.look = 'AgX - Medium High Contrast'
    except TypeError:
        pass
    scene.world = bpy.data.worlds.new('Neutral studio world')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.18, 0.19, 0.21, 1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.45
    lower, _ = bounds()
    ground_mat = material('Studio ground - excluded from GLB', (0.14, 0.15, 0.17), 0.05, 0.63)
    ground = box('Studio floor - excluded from GLB', (2000, 2000, 0.06), (0, 0, lower[2] - 0.035), ground_mat, bevel=0, product=False)
    flag_mat = material('Studio negative fill black', (0, 0, 0), 0, 1)
    flag_mat.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value = 0
    flag = box('Studio optical negative fill flag - excluded from GLB', (6, 4, 0.012), (-0.5, -3.5, -0.25), flag_mat, bevel=0, product=False)
    # A product-photography black flag prevents the bright floor from washing
    # over the optical pupil. It is a studio reflection card, never asset mesh.
    flag.visible_camera = False
    flag.visible_diffuse = False
    flag.visible_shadow = False
    lights = []
    for name, position, power, light_size, size_y in [
        ('Key large neutral softbox', (-3.5, -4.2, 5.8), 950, 4.5, 3.0),
        ('Fill broad neutral softbox', (4.3, -1.5, 3.5), 500, 3.5, 4.0),
        ('Rear edge neutral strip', (1.5, 4.0, 4.2), 950, 4.0, 1.6),
        ('Front optical reflection strip', (-1.9, -4.1, 2.4), 100, 1.5, 3.5),
    ]:
        data = bpy.data.lights.new(name, 'AREA')
        data.energy = power
        data.shape = 'RECTANGLE'
        data.size = light_size
        data.size_y = size_y
        obj = bpy.data.objects.new(name, data)
        scene.collection.objects.link(obj)
        obj.location = position
        obj.rotation_euler = (Vector((0, 0, 0)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
        lights.append(obj)
    camera_data = bpy.data.cameras.new('Studio product photography camera')
    camera_data.lens = 68
    camera_data.sensor_width = 36
    camera = bpy.data.objects.new('Studio product photography camera', camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    return scene, camera, ground, lights


def photograph(scene, camera, ground, lights, view):
    is_fallback = view.startswith('fallback')
    finish_name = view.split('-', 1)[1] if is_fallback and '-' in view else 'graphite'
    body = bpy.data.materials['body_finish']
    body.diffuse_color = (*FINISH_COLORS[finish_name], 1)
    body.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*FINISH_COLORS[finish_name], 1)
    positions = {
        'front': (0, -9, 1.75),
        'three-quarter': (5.6, -8.4, 4.8),
        'rear': (5.7, 8.1, 3.9),
        'detail': (-2.0, -5.0, 1.4),
        'warm': (5.6, -8.4, 4.8),
        'fallback': (5.6, -8.4, 4.8),
        'fallback-silver': (5.6, -8.4, 4.8),
        'fallback-copper': (5.6, -8.4, 4.8),
    }
    camera.location = positions[view]
    target = Vector((-0.74, -0.85, 0.03)) if view == 'detail' else Vector((0, 0, -0.035))
    camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.type = 'ORTHO' if view == 'front' else 'PERSP'
    camera.data.ortho_scale = 4.7
    camera.data.lens = 85 if view == 'detail' else 68
    scene.render.film_transparent = is_fallback
    ground.hide_render = is_fallback
    for obj in lights:
        obj.data.color = (1, 1, 1)
    if view == 'warm':
        lights[0].data.color = (1.0, 0.83, 0.66)
        lights[2].data.color = (0.66, 0.79, 1.0)
    names = {
        'front': 'neutral-front.png',
        'three-quarter': 'neutral-three-quarter.png',
        'rear': 'neutral-rear-side.png',
        'detail': 'neutral-optical-detail.png',
        'warm': 'warm-hero.png',
        'fallback': 'product-fallback.png',
        'fallback-silver': 'product-fallback-silver.png',
        'fallback-copper': 'product-fallback-copper.png',
    }
    scene.render.filepath = str(EVIDENCE / names[view])
    original_samples = scene.cycles.samples
    original_adaptive = scene.cycles.use_adaptive_sampling
    if is_fallback:
        scene.cycles.samples = int(scene.get('lucent_fallback_samples', 256))
        scene.cycles.use_adaptive_sampling = False
    bpy.ops.render.render(write_still=True)
    scene.cycles.samples = original_samples
    scene.cycles.use_adaptive_sampling = original_adaptive
    print('LUCENT_RENDER ' + json.dumps({'view': view, 'path': scene.render.filepath}), flush=True)


def metadata(scene, args):
    glb_bytes = GLB.read_bytes()
    json_size = struct.unpack_from('<I', glb_bytes, 12)[0]
    gltf = json.loads(glb_bytes[20:20 + json_size].decode('utf-8'))
    primitives = [primitive for mesh in gltf['meshes'] for primitive in mesh['primitives']]
    gltf_vertices = sum(gltf['accessors'][primitive['attributes']['POSITION']]['count'] for primitive in primitives)
    gltf_triangles = sum(gltf['accessors'][primitive['indices']]['count'] // 3 for primitive in primitives)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    vertices = 0
    triangles = 0
    for obj in PRODUCT:
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        mesh.calc_loop_triangles()
        vertices += len(mesh.vertices)
        triangles += len(mesh.loop_triangles)
        evaluated.to_mesh_clear()
    lower, upper = bounds()
    dimensions = [upper[index] - lower[index] for index in range(3)]
    lens_object = bpy.data.objects['Recessed convex coated lens 65mm']
    lens_origin = lens_object.matrix_world.translation
    lens_front_surface = -min((lens_object.matrix_world @ Vector(corner)).y for corner in lens_object.bound_box)
    data = {
        'name': 'LUCENT P / 01 - original Blender cinema projector remodel',
        'blender_version': bpy.app.version_string,
        'master_blend': str(MASTER), 'glb': str(GLB), 'glb_bytes': GLB.stat().st_size,
        'glb_sha256': hashlib.sha256(glb_bytes).hexdigest(),
        'mesh_objects': len(PRODUCT), 'blender_evaluated_vertices': vertices,
        'blender_evaluated_triangles': triangles,
        'glb_vertices_including_normal_splits': gltf_vertices,
        'glb_triangles': gltf_triangles,
        'glb_meshes': len(gltf['meshes']), 'glb_material_primitives': len(primitives),
        'glb_images': len(gltf.get('images', [])),
        'gltf_extensions_used': gltf.get('extensionsUsed', []),
        'materials': sorted({slot.material.name for obj in PRODUCT for slot in obj.material_slots if slot.material}),
        'blender_bounds_min_xyz': lower, 'blender_bounds_max_xyz': upper,
        'blender_dimensions_xyz': dimensions,
        'gltf_dimensions_xyz': [dimensions[0], dimensions[2], dimensions[1]],
        'front_axis_blender': '-Y', 'front_axis_gltf': '+Z',
        'nominal_physical_dimensions_mm': {'width': 320, 'depth': 210, 'height': 115},
        'optical_diameter_runtime_units': 0.746,
        'renderer': scene.render.engine, 'device': scene.cycles.device,
        'samples': args.samples, 'denoising': True,
        'transparent_fallback_samples': args.fallback_samples,
        'finish_colors_linear_rgb': FINISH_COLORS,
        'body_pbr': {'metallic': 0.55, 'roughness': 0.47, 'specular_ior_level_blender': 0.32},
        'optical_interior': 'Deep machined cavity, tapered matte optical_baffle and three rings at neutral linear reflectance 0.006/roughness 0.8; pure-zero reflective/specular deep pupil retained; two spaced transparent curved elements and clear outer lens. No opaque reflective gray back disc.',
        'optical_baffle_pbr': {'base_color_linear_rgb': [0.006, 0.006, 0.006], 'metallic': 0, 'roughness': 0.8, 'specular_ior_level_blender': 0.08},
        'optical_lens_center_gltf_xyz': [lens_origin.x, lens_origin.z, -lens_origin.y],
        'optical_lens_center_blender_xyz': list(lens_origin),
        'optical_front_surface_gltf_z': lens_front_surface,
        'render_resolution': [scene.render.resolution_x, scene.render.resolution_y],
        'public_asset_provenance': 'All geometry, materials, and converted lettering created in Blender by build_projector.py. No external assets.',
        'studio_note': 'Neutral softboxes, floor and optical negative-fill reflection card. Studio props/lights are excluded from GLB.',
        'glb_surface_note': 'Material-only PBR. Blender studio master adds microscopic procedural bead bump, omitted from GLB; no textures embedded.',
        'publication': 'Local preview only. No push or deployment performed by this script.',
    }
    (EVIDENCE / 'model-metadata.json').write_text(json.dumps(data, indent=2), encoding='utf-8')
    print('LUCENT_METADATA ' + json.dumps(data), flush=True)


def main():
    args = arguments()
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    MASTER.parent.mkdir(parents=True, exist_ok=True)
    body, shader, bump, normal_link, product_root = build()
    export_asset(body, shader, bump, normal_link, product_root)
    scene, camera, ground, lights = studio(args)
    scene['lucent_fallback_samples'] = args.fallback_samples
    bpy.context.preferences.filepaths.save_version = 0
    bpy.context.preferences.filepaths.file_preview_type = 'NONE'
    metadata(scene, args)
    # Keep a real editable master even when a later render is interrupted.
    bpy.ops.wm.save_as_mainfile(filepath=str(MASTER), compress=True)
    for view in [item.strip() for item in args.views.split(',') if item.strip()]:
        photograph(scene, camera, ground, lights, view)
    ground.hide_render = False
    scene.render.film_transparent = False
    for light in lights:
        light.data.color = (1, 1, 1)
    body.diffuse_color = (*FINISH_COLORS['graphite'], 1)
    shader.inputs['Base Color'].default_value = (*FINISH_COLORS['graphite'], 1)
    camera.location = (5.6, -8.4, 4.8)
    camera.rotation_euler = (Vector((0, 0, -0.035)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.type = 'PERSP'
    camera.data.lens = 68
    bpy.ops.wm.save_as_mainfile(filepath=str(MASTER), compress=True)
    metadata_path = EVIDENCE / 'model-metadata.json'
    receipt = json.loads(metadata_path.read_text(encoding='utf-8'))
    receipt['master_blend_bytes'] = MASTER.stat().st_size
    receipt['master_blend_sha256'] = hashlib.sha256(MASTER.read_bytes()).hexdigest()
    receipt['build_script_sha256'] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    receipt['product_renders'] = [str(EVIDENCE / name) for name in [
        'neutral-front.png', 'neutral-three-quarter.png', 'neutral-rear-side.png',
        'neutral-optical-detail.png', 'warm-hero.png', 'product-fallback.png',
        'product-fallback-silver.png', 'product-fallback-copper.png',
    ]]
    metadata_path.write_text(json.dumps(receipt, indent=2), encoding='utf-8')


if __name__ == '__main__':
    main()
