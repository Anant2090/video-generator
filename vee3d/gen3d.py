"""Image-to-3D candidates for VEE from free Hugging Face Spaces (ZeroGPU), via gradio_client.

python vee3d/gen3d.py inspect SPACE          # print the Space's live API (endpoints + params)
python vee3d/gen3d.py run hunyuan21|hunyuan2|trellis   -> vee3d/candidates/<name>.glb

Input: vee3d/vee_up_square.png (upscale.py). An optional HF_TOKEN in video/.env raises the ZeroGPU quota.
"""
import shutil
import sys
from pathlib import Path

from gradio_client import Client, handle_file

HERE = Path(__file__).parent
IMG = HERE / 'vee_up_square.png'
OUT = HERE / 'candidates'
SPACES = {'hunyuan21': 'tencent/Hunyuan3D-2.1', 'hunyuan2': 'tencent/Hunyuan3D-2', 'trellis': 'trellis-community/TRELLIS'}


def token():
    env = HERE.parent / '.env'
    for line in env.read_text(encoding='utf-8').splitlines() if env.exists() else []:
        k, _, v = line.partition('=')
        if k.strip() == 'HF_TOKEN' and v.strip():
            return v.strip()
    return None


def client(space):
    return Client(space, token=token(), verbose=False)


def first_file(result):
    """Pull the first .glb path out of whatever nested result a Space returns."""
    stack = [result]
    while stack:
        r = stack.pop(0)
        if isinstance(r, str) and r.lower().endswith('.glb'):
            return r
        if isinstance(r, dict):
            stack += list(r.values())
        elif isinstance(r, (list, tuple)):
            stack += list(r)
    raise SystemExit(f'no .glb in result: {result!r}'[:600])


def save(name, path):
    OUT.mkdir(exist_ok=True)
    dest = OUT / f'{name}.glb'
    shutil.copy(path, dest)
    print('wrote', dest, dest.stat().st_size // 1024, 'KB')


def run(name):
    c = client(SPACES[name.split('-')[0]])
    img = handle_file(str(IMG))
    if name.startswith(('hunyuan21-shape', 'hunyuan2-shape')):
        # shape only: fits the free ZeroGPU limit; rig_vee.py bakes the official art onto the front anyway.
        # name may carry a seed: hunyuan21-shape-42
        seed = int(name.split('-')[2]) if name.count('-') == 2 else 1234
        res = c.predict(image=img, steps=30, guidance_scale=5.0, seed=seed, octree_resolution=256,
                        check_box_rembg=False, num_chunks=8000, randomize_seed=False, api_name='/shape_generation')
        save(name, first_file(res))
    elif name in ('hunyuan21', 'hunyuan2'):
        # shape + texture in one call; background already removed (transparent PNG)
        res = c.predict(image=img, steps=50, guidance_scale=5.0, seed=1234, octree_resolution=256,
                        check_box_rembg=True, num_chunks=8000, randomize_seed=False, api_name='/generation_all')
        # returns (shape-only file, textured file, html, stats, seed): prefer the textured mesh
        files = [r for r in (res if isinstance(res, (list, tuple)) else [res]) if isinstance(r, (str, dict))]
        save(name, first_file(files[1:] + files[:1]))
    elif name == 'trellis':
        c.predict(api_name='/start_session')
        pre = c.predict(image=img, api_name='/preprocess_image')
        c.predict(image=handle_file(pre), multiimages=[], seed=0, ss_guidance_strength=7.5, ss_sampling_steps=12,
                  slat_guidance_strength=3.0, slat_sampling_steps=12, multiimage_algo='stochastic', api_name='/image_to_3d')
        save(name, first_file(c.predict(mesh_simplify=0.95, texture_size=1024, api_name='/extract_glb')))


if __name__ == '__main__':
    cmd, arg = sys.argv[1], sys.argv[2]
    if cmd == 'inspect':
        client(SPACES.get(arg, arg)).view_api(print_info=True)
    else:
        run(arg)
