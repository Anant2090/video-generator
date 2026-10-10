"""Blender (headless): AI-generated VEE mesh -> front-true, rigged GLB for Remotion.

blender -b --python vee3d/rig_vee.py -- vee3d/candidates/<name>.glb   (run from video/)
-> voicera-motion/public/legion/vee3d/vee.glb   +  vee3d/front_check.png (ortho front render)

Units: SOURCE px of 'Screenshot 2026-04-27 175954 1.png' (329 x 633), Blender X = x_src, Z = 633 - y_src,
the model faces -Y (Blender front view). Joints come from the grid measurements used for the 2D rig.
"""
import math
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

VIDEO = Path.cwd().resolve()  # run from video/
SRC_GLB = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
ART = VIDEO / 'vee3d' / 'vee_up.png'  # 4x upscaled official art, RGBA (1316 x 2532)
OUT = VIDEO / 'voicera-motion' / 'public' / 'legion' / 'vee3d' / 'vee.glb'
W, H = 329, 633  # source px
UP = 4  # vee_up.png scale

# joints (x_src, y_src) measured on the source grid
J = {
    'hips': (186, 400), 'chest': (186, 262), 'neck': (186, 196), 'head': (186, 188), 'head_top': (186, 12),
    'upperarm_l': (122, 232), 'forearm_l': (72, 318), 'hand_l': (80, 252), 'hand_l_end': (78, 200),
    'upperarm_r': (262, 232), 'forearm_r': (292, 332), 'hand_r': (302, 425), 'hand_r_end': (300, 458),
    'thigh_l': (160, 420), 'shin_l': (150, 520), 'foot_l': (145, 615),
    'thigh_r': (212, 420), 'shin_r': (222, 520), 'foot_r': (228, 615),
}
HEAD_Z = H - 190  # head region: above the neck line
ARM_L = [(34, 194), (96, 194), (118, 212), (121, 262), (113, 300), (101, 332), (70, 342), (36, 332), (30, 268)]


def src_mask():
    img = bpy.data.images.load(str(ART))
    w, h = img.size
    a = np.array(img.pixels[:]).reshape(h, w, 4)[::-1, :, 3] > 0.5  # top row first
    return a[::UP, ::UP][:H, :W]


def front_silhouette(obj, step=1):
    """Boolean front (-Y) silhouette of obj on the source grid (every `step` px), by ray casting."""
    # world-space tree (BVHTree.FromObject would ignore an unapplied object scale)
    mw = obj.matrix_world
    bvh = BVHTree.FromPolygons([mw @ v.co for v in obj.data.vertices], [p.vertices[:] for p in obj.data.polygons])
    ys, xs = range(0, H, step), range(0, W, step)
    sil = np.zeros((len(ys), len(xs)), bool)
    for i, yi in enumerate(ys):
        for j, xi in enumerate(xs):
            sil[i, j] = bvh.ray_cast(Vector((xi + 0.5, -1e4, H - yi - 0.5)), Vector((0, 1, 0)))[0] is not None
    return sil, bvh


def inside(poly, x, y):
    """Point-in-polygon (even-odd ray test)."""
    c = False
    for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
        if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
            c = not c
    return c


def fit(obj):
    """Scale + move the mesh so its front bbox matches the art's silhouette bbox."""
    m = src_mask()
    ys, xs = np.nonzero(m)
    verts = np.array([obj.matrix_world @ v.co for v in obj.data.vertices])
    (x0, _, z0), (x1, _, z1) = verts.min(0), verts.max(0)
    s = ((ys.max() - ys.min()) + 1) / (z1 - z0)
    obj.scale = [c * s for c in obj.scale]
    bpy.ops.object.transform_apply(scale=True)
    verts = np.array([obj.matrix_world @ v.co for v in obj.data.vertices])
    (x0, y0, z0), (x1, y1, z1) = verts.min(0), verts.max(0)
    obj.location += Vector(((xs.min() + xs.max() + 1) / 2 - (x0 + x1) / 2, -(y0 + y1) / 2, (H - ys.max() - 1) - z0))
    bpy.ops.object.transform_apply(location=True)
    return m


def import_mesh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(SRC_GLB))
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    for o in [o for o in bpy.context.scene.objects if o.type != 'MESH']:
        bpy.data.objects.remove(o)
    obj.parent = None
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return obj


def turn(obj, k):
    obj.rotation_mode = 'XYZ'  # glTF imports in quaternion mode, where rotation_euler is ignored
    obj.rotation_euler = (0, 0, k * math.pi / 2)
    bpy.ops.object.transform_apply(rotation=True)


BUST_ROWS = 400  # only the top 400 src px are ever on screen (the bust), so register on those


def register(obj, m):
    """Silhouette registration: scale (about the feet) + x/z shift maximising bust-region IoU with the art."""
    best = (-1.0, 1.0, 0, 0)
    rows = BUST_ROWS // 2
    for s in (0.94, 0.96, 0.98, 1.0, 1.02, 1.04, 1.06):
        obj.scale = (s, s, s)
        bpy.context.view_layer.update()
        sil, _ = front_silhouette(obj, step=2)
        mm = m[::2, ::2][: sil.shape[0], : sil.shape[1]][:rows]
        for dx in range(-24, 25):
            for dz in range(-20, 21):
                sh = np.roll(np.roll(sil, dx, axis=1), -dz, axis=0)[:rows]
                iou = (sh & mm).sum() / max(1, (sh | mm).sum())
                if iou > best[0]:
                    best = (iou, s, dx * 2, dz * 2)
    iou, s, dx, dz = best
    obj.scale = (s, s, s)
    bpy.ops.object.transform_apply(scale=True)
    obj.location += Vector((dx, 0, dz))
    bpy.ops.object.transform_apply(location=True)
    print(f'registered: scale {s} shift ({dx}, {dz}) IoU~{iou:.3f}')


def orient(obj):
    """Try the 4 turns about Z; keep the one whose front silhouette best matches the art (IoU)."""
    best = (-1, 0)
    for k in range(4):
        m = fit(obj)[::3, ::3]
        sil, _ = front_silhouette(obj, step=3)
        iou = (sil & m).sum() / max(1, (sil | m).sum())
        print(f'turn {k * 90}: IoU {iou:.3f}')
        if iou > best[0]:
            best = (iou, k)
        turn(obj, 1)
    turn(obj, best[1])  # 4 quarter turns = back to start, then the best
    m = fit(obj)
    register(obj, m)
    sil, bvh = front_silhouette(obj)
    iou = (sil & m).sum() / max(1, (sil | m).sum())
    print(f'chosen turn {best[1] * 90}: IoU {iou:.3f}')
    np.save(VIDEO / 'vee3d' / 'dbg_sil.npy', sil)
    np.save(VIDEO / 'vee3d' / 'dbg_mask.npy', m)
    return iou, bvh


def bake_front(obj, bvh):
    """Project the official art onto faces that face the camera and are visible from the front."""
    me = obj.data
    if not me.uv_layers:
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.uv.smart_project()
        bpy.ops.object.mode_set(mode='OBJECT')
    base_uv = me.uv_layers[0].name
    proj = me.uv_layers.new(name='front')
    mirr = me.uv_layers.new(name='mirror')  # art mirrored across the torso axis (x' = 370 - x)
    vis = me.color_attributes.new('front_w', 'FLOAT_COLOR', 'CORNER')
    occ = me.color_attributes.new('mirror_w', 'FLOAT_COLOR', 'CORNER')
    for poly in me.polygons:
        n = poly.normal
        facing = min(1.0, max(0.0, (-n.y - 0.1) / 0.4))  # toward -Y (camera)
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co
            proj.data[li].uv = (v.x / W, v.z / H)
            mirr.data[li].uv = ((370 - v.x) / W, v.z / H)
            hit = bvh.ray_cast(Vector((v.x, -1e4, v.z)), Vector((0, 1, 0)))
            seen = hit[0] is not None and abs(hit[0].y - v.y) < 3.0
            w = facing if seen else 0.0
            o = facing if not seen else 0.0  # hidden from the art (e.g. chest behind the fist): mirror fill
            vis.data[li].color = (w, w, w, 1)
            occ.data[li].color = (o, o, o, 1)
    mat = obj.active_material or bpy.data.materials.new('vee')
    obj.active_material = mat
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    base_tex = None
    if bsdf and bsdf.inputs['Base Color'].is_linked:
        base_tex = bsdf.inputs['Base Color'].links[0].from_node
    size = 2048
    target = bpy.data.images.new('vee_baked', size, size)
    # emission graph: mix(original texture, projected art, front weight)
    art = nt.nodes.new('ShaderNodeTexImage')
    art.image = bpy.data.images.load(str(ART))
    uvp = nt.nodes.new('ShaderNodeUVMap')
    uvp.uv_map = 'front'
    nt.links.new(uvp.outputs['UV'], art.inputs['Vector'])
    wgt = nt.nodes.new('ShaderNodeVertexColor')
    wgt.layer_name = 'front_w'
    # hidden-from-art fill: mirrored art, else the generator texture / a neutral robot blue
    art_m = nt.nodes.new('ShaderNodeTexImage')
    art_m.image = art.image
    uvm = nt.nodes.new('ShaderNodeUVMap')
    uvm.uv_map = 'mirror'
    nt.links.new(uvm.outputs['UV'], art_m.inputs['Vector'])
    ow = nt.nodes.new('ShaderNodeVertexColor')
    ow.layer_name = 'mirror_w'
    fill = nt.nodes.new('ShaderNodeMix')
    fill.data_type = 'RGBA'
    nt.links.new(ow.outputs['Color'], fill.inputs['Factor'])
    if base_tex:
        nt.links.new(base_tex.outputs['Color'], fill.inputs[6])
    else:
        fill.inputs[6].default_value = (0.35, 0.45, 0.62, 1)
    nt.links.new(art_m.outputs['Color'], fill.inputs[7])
    mix = nt.nodes.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    nt.links.new(wgt.outputs['Color'], mix.inputs['Factor'])
    nt.links.new(fill.outputs[2], mix.inputs[6])
    nt.links.new(art.outputs['Color'], mix.inputs[7])
    emit = nt.nodes.new('ShaderNodeEmission')
    nt.links.new(mix.outputs[2], emit.inputs['Color'])
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    tgt = nt.nodes.new('ShaderNodeTexImage')
    tgt.image = target
    nt.nodes.active = tgt
    me.uv_layers.active = me.uv_layers[base_uv]
    bpy.context.scene.render.engine = 'CYCLES'
    bpy.context.scene.cycles.device = 'CPU'
    bpy.context.scene.cycles.samples = 1
    bpy.ops.object.bake(type='EMIT', margin=4, use_clear=True)
    target.filepath_raw = str(VIDEO / 'vee3d' / 'vee_baked.png')
    target.file_format = 'PNG'
    target.save()
    # final material: unlit-ready base colour = baked texture (Remotion's dither shader does the lighting)
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = target
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    o = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(tex.outputs['Color'], b.inputs['Base Color'])
    nt.links.new(b.outputs['BSDF'], o.inputs['Surface'])
    me.uv_layers.remove(proj)
    me.uv_layers.remove(mirr)
    me.color_attributes.remove(vis)
    me.color_attributes.remove(occ)


def depth_at(bvh, x, z):
    """Mid-depth of the body at a front point (between front and back hits)."""
    f = bvh.ray_cast(Vector((x, -1e4, z)), Vector((0, 1, 0)))
    b = bvh.ray_cast(Vector((x, 1e4, z)), Vector((0, -1, 0)))
    if f[0] is None or b[0] is None:
        return 0.0
    return (f[0].y + b[0].y) / 2


CHAINS = {
    'arm_l': ['upperarm_l', 'forearm_l', 'hand_l'],
    'arm_r': ['upperarm_r', 'forearm_r', 'hand_r'],
    'leg_l': ['thigh_l', 'shin_l'],
    'leg_r': ['thigh_r', 'shin_r'],
}
BLEND = 5.0  # src px of soft blend at each joint; everything else moves rigidly (robot plates)


def rigidify(obj, segs):
    """Bone-heat bends limbs like rubber. Re-weight every limb vertex rigidly to its nearest segment
    in its chain, with a short linear blend only near the joints (incl. the root joint to the spine)."""
    names = {g.index: g.name for g in obj.vertex_groups}
    vg = obj.vertex_groups

    def seg_param(p, a, b):
        ab = b - a
        t = max(0.0, min(1.0, (p - a).dot(ab) / max(1e-6, ab.dot(ab))))
        return t, (a + ab * t - p).length

    moved = 0
    for v in obj.data.vertices:
        w = {names[g.group]: g.weight for g in v.groups}
        chain = max(CHAINS, key=lambda c: sum(w.get(n, 0) for n in CHAINS[c]))
        if sum(w.get(n, 0) for n in CHAINS[chain]) < 0.5:
            continue  # torso / neck / head: keep bone-heat
        bones = CHAINS[chain]
        best = min(bones, key=lambda n: seg_param(v.co, *segs[n])[1])
        i = bones.index(best)
        a, b = segs[best]
        t, _ = seg_param(v.co, a, b)
        along = t * (b - a).length
        new = {best: 1.0}
        parent = bones[i - 1] if i > 0 else 'spine'
        if along < BLEND:  # near the joint with the previous segment (or the spine at the root)
            f = 0.5 + 0.5 * along / BLEND
            new = {best: f, parent: 1 - f}
        for g in list(v.groups):
            vg[g.group].remove([v.index])
        for n, x in new.items():
            vg[n].add([v.index], x, 'REPLACE')
        moved += 1
    print(f'rigid limbs: {moved} vertices re-weighted')


def export_joints(P):
    """Joint positions in model units (x = src x, y = 633 - src y) for the TS choreography / planar IK."""
    import json

    keys = ['upperarm_l', 'forearm_l', 'hand_l', 'hand_l_end', 'upperarm_r', 'forearm_r', 'hand_r', 'hand_r_end',
            'thigh_l', 'shin_l', 'foot_l', 'thigh_r', 'shin_r', 'foot_r', 'neck', 'head', 'head_top', 'hips', 'chest']
    out = {k: [round(P[k].x, 2), round(P[k].z, 2)] for k in keys}
    path = OUT.parent / 'joints.json'
    path.write_text(json.dumps(out, indent=1))
    print('wrote', path)


def rig(obj, bvh):
    P = {k: Vector((x, depth_at(bvh, x, H - y), H - y)) for k, (x, y) in J.items()}
    export_joints(P)
    arm = bpy.data.armatures.new('vee_rig')
    rig_obj = bpy.data.objects.new('vee_rig', arm)
    bpy.context.scene.collection.objects.link(rig_obj)
    bpy.context.view_layer.objects.active = rig_obj
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.edit_bones

    def bone(name, head, tail, parent=None):
        b = eb.new(name)
        b.head, b.tail = P[head], P[tail]
        if parent:
            b.parent = eb[parent]
        return b

    bone('spine', 'hips', 'chest')
    bone('neck', 'chest', 'neck', 'spine')
    bone('head', 'head', 'head_top', 'neck')
    bone('upperarm_l', 'upperarm_l', 'forearm_l', 'spine')
    bone('forearm_l', 'forearm_l', 'hand_l', 'upperarm_l')
    bone('hand_l', 'hand_l', 'hand_l_end', 'forearm_l')
    bone('upperarm_r', 'upperarm_r', 'forearm_r', 'spine')
    bone('forearm_r', 'forearm_r', 'hand_r', 'upperarm_r')
    bone('hand_r', 'hand_r', 'hand_r_end', 'forearm_r')
    bone('thigh_l', 'thigh_l', 'shin_l', 'spine')
    bone('shin_l', 'shin_l', 'foot_l', 'thigh_l')
    bone('thigh_r', 'thigh_r', 'shin_r', 'spine')
    bone('shin_r', 'shin_r', 'foot_r', 'thigh_r')
    segs = {b.name: (b.head.copy(), b.tail.copy()) for b in eb}
    bpy.ops.object.mode_set(mode='OBJECT')

    # 1st choice: Blender's bone-heat automatic weights (follow the mesh volume, no tearing at joints)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    rig_obj.select_set(True)
    bpy.context.view_layer.objects.active = rig_obj
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    unweighted = sum(1 for v in obj.data.vertices if not any(g.weight > 1e-3 for g in v.groups))
    print(f'auto weights: {unweighted} / {len(obj.data.vertices)} vertices unweighted')
    if unweighted < 0.01 * len(obj.data.vertices):
        rigidify(obj, segs)
        # keep the head rigid on the head bone (mouth/eye decals ride on it)
        head = obj.vertex_groups['head']
        for v in obj.data.vertices:
            if v.co.z > HEAD_Z + 6:
                for g in list(v.groups):
                    obj.vertex_groups[g.group].remove([v.index])
                head.add([v.index], 1.0, 'REPLACE')
        bpy.ops.object.select_all(action='DESELECT')  # the bake acts on the active mesh
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        return rig_obj
    # fallback: distance weights (head rigid, nearest two bones elsewhere)
    obj.modifiers.clear()
    obj.vertex_groups.clear()
    obj.parent = None
    arm_poly = [(x, H - y) for x, y in ARM_L]
    groups = {n: obj.vertex_groups.new(name=n) for n in segs}

    def dist(p, a, b):
        ab, ap = b - a, p - a
        t = max(0.0, min(1.0, ap.dot(ab) / max(1e-6, ab.dot(ab))))
        return (a + ab * t - p).length

    for v in obj.data.vertices:
        p = v.co
        if p.z > HEAD_Z + 6:
            cands = ['head']
        elif p.z > HEAD_Z - 6:
            cands = ['head', 'neck']
        elif inside(arm_poly, p.x, p.z) and p.y < P['chest'].y - 10:
            cands = ['upperarm_l', 'forearm_l', 'hand_l']
        else:
            cands = [n for n in segs if n not in ('head',)]
        d = {n: dist(p, *segs[n]) for n in cands}
        near = sorted(d.items(), key=lambda kv: kv[1])[:2]
        ws = [1 / (1e-3 + dd) ** 4 for _, dd in near]
        tot = sum(ws)
        for (n, _), w in zip(near, ws):
            groups[n].add([v.index], w / tot, 'REPLACE')

    obj.parent = rig_obj
    mod = obj.modifiers.new('rig', 'ARMATURE')
    mod.object = rig_obj
    return rig_obj


def window_iou(obj, m, win, step=2):
    """IoU of the deformed mesh's front silhouette vs the art mask inside win=(x0, x1, y0, y1) src px."""
    deps = bpy.context.evaluated_depsgraph_get()
    deps.update()
    ev = obj.evaluated_get(deps)
    me = ev.to_mesh()
    mw = obj.matrix_world
    bvh = BVHTree.FromPolygons([mw @ v.co for v in me.vertices], [p.vertices[:] for p in me.polygons])
    ev.to_mesh_clear()
    x0, x1, y0, y1 = win
    inter = union = 0
    for yi in range(y0, y1, step):
        for xi in range(x0, x1, step):
            s = bvh.ray_cast(Vector((xi + 0.5, -1e4, H - yi - 0.5)), Vector((0, 1, 0)))[0] is not None
            a = bool(m[yi, xi])
            inter += s and a
            union += s or a
    return inter / max(1, union)


def pose_match(obj, rig_obj, m):
    """Swing each arm (coordinate descent over shoulder/elbow angles) until the silhouette matches the art."""
    windows = {'_l': (18, 160, 170, 370), '_r': (225, 329, 210, 480)}
    for side, win in windows.items():
        for bone, axes in ((f'upperarm{side}', 'ZX'), (f'forearm{side}', 'ZX')):
            pb = rig_obj.pose.bones[bone]
            pb.rotation_mode = 'XYZ'
            for ax in axes:
                i = 'XYZ'.index(ax)
                best = (window_iou(obj, m, win), pb.rotation_euler[i])
                for a in np.arange(-0.6, 0.61, 0.1):
                    pb.rotation_euler[i] = float(a)
                    iou = window_iou(obj, m, win)
                    if iou > best[0]:
                        best = (iou, float(a))
                pb.rotation_euler[i] = best[1]
                print(f'pose {bone}.{ax} = {best[1]:+.2f}  (window IoU {best[0]:.3f})')


def apply_pose(obj, rig_obj):
    """Bake the matched pose into the mesh and make it the armature's rest pose."""
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier='rig')
    bpy.context.view_layer.objects.active = rig_obj
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='SELECT')
    bpy.ops.pose.armature_apply()
    bpy.ops.object.mode_set(mode='OBJECT')
    mod = obj.modifiers.new('rig', 'ARMATURE')
    mod.object = rig_obj


def main():
    obj = import_mesh()
    # decimate very dense AI meshes (keeps export + WebGL render light)
    if len(obj.data.polygons) > 120_000:
        dec = obj.modifiers.new('dec', 'DECIMATE')
        dec.ratio = 120_000 / len(obj.data.polygons)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier='dec')
    iou, bvh = orient(obj)
    m = src_mask()
    if '--score' in sys.argv:  # rank candidates: overall + per-arm silhouette overlap
        l = window_iou(obj, m, (18, 160, 170, 370))
        r = window_iou(obj, m, (225, 329, 210, 480))
        print(f'SCORE {SRC_GLB.name}: front IoU {iou:.3f}  left arm {l:.3f}  right arm {r:.3f}')
        return
    rig_obj = rig(obj, bvh)
    if '--pose' in sys.argv:  # only for meshes whose arms miss the art; can twist geometry
        pose_match(obj, rig_obj, m)
        apply_pose(obj, rig_obj)
    sil, bvh = front_silhouette(obj)
    iou = (sil & m).sum() / max(1, (sil | m).sum())
    np.save(VIDEO / 'vee3d' / 'dbg_sil.npy', sil)
    print(f'after pose match: IoU {iou:.3f}')
    bake_front(obj, bvh)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(OUT), export_format='GLB', use_selection=True, export_skins=True, export_yup=True)
    print(f'exported {OUT} (front IoU {iou:.3f})')


main()
