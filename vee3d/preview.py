"""Blender (headless): quick shaded previews of a GLB (front, 3/4, side) -> <glb>_preview.png

blender -b --python vee3d/preview.py -- path/to/model.glb
"""
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

glb = Path(sys.argv[sys.argv.index('--') + 1]).resolve()  # Blender resolves relative output paths oddly
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(glb))
objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
lo = Vector([min(p[i] for p in pts) for i in range(3)])
hi = Vector([max(p[i] for p in pts) for i in range(3)])
center, size = (lo + hi) / 2, max(hi - lo)
print('bounds', tuple(round(v, 3) for v in lo), tuple(round(v, 3) for v in hi), 'verts', sum(len(o.data.vertices) for o in objs))

sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'
sc.display.shading.color_type = 'TEXTURE' if any(o.active_material for o in objs) else 'SINGLE'
sc.render.resolution_x, sc.render.resolution_y = 600, 800
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
sc.collection.objects.link(cam)
sc.camera = cam
cam.data.type = 'ORTHO'
cam.data.ortho_scale = size * 1.1
out = []
for name, ang in (('front', 0), ('threeq', 35), ('side', 90)):
    a = math.radians(ang)
    cam.location = center + Vector((math.sin(a), -math.cos(a), 0)) * size * 3
    cam.rotation_euler = (math.pi / 2, 0, a)
    p = glb.with_name(f'{glb.stem}_{name}.png')
    sc.render.filepath = str(p)
    bpy.ops.render.render(write_still=True)
    out.append(p)
print('wrote', *out)
