"""Talking-VEE rig: a layered, dithered puppet built from the single official image.

python mascot-test/rig_mascot.py   (run from video/)
-> voicera-motion/public/legion/rig/{hero,presenter}/  body/head/arm.png, mouth0-5.png, blink1-2.png, rig.json

Every layer and sprite is dithered with the rest pose's tone LUT on the same Bayer grid, so the
rest pose recomposes pixel-identical to the official vee_dither.png (asserted below).
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from dither_mascot import OUT, SCALE, compose, eq_lut, ink_map, load, prep, upscale

SRC = 'Screenshot 2026-04-27 175954 1.png'
BUST = 400
DEST = OUT.parent / 'voicera-motion' / 'public' / 'legion' / 'rig'
SIZES = {'hero': 300, 'presenter': 160}  # dots tall -> 900px / 480px at 3px per dot

# Rig geometry in SOURCE px (329x400 bust crop), measured on a 3x grid of the source.
NECK, SHOULDER, ELBOW, EAR = (186, 190), (120, 245), (72, 318), (284, 118)
HEAD_Y = 188  # head layer = everything above this line (+ the mic tip)
ARM = [(34, 194), (96, 194), (118, 212), (121, 262), (113, 300), (101, 332), (70, 342), (36, 332), (30, 268)]
SYM_X2 = 370  # torso symmetry: x' = 370 - x
MOUTH_PAINT, MOUTH_BOX = (163, 148, 213, 173), (152, 138, 224, 184)  # painted area / sprite crop (with bleed)
EYES = [(131, 103, 167, 133), (199, 103, 239, 133)]
EYES_BOX = (120, 92, 250, 144)
# Tongue must stay a mid-dark tone: after the tone LUT a light tongue turns white and reads as fangs.
DARK, TONGUE, TEETH = (15, 25, 50), (120, 50, 70), (235, 240, 245)
UP = 4  # shapes are drawn 4x then downsampled -> anti-aliased before dithering


def skin_fill(im, box, keep=None):
    """Paint box with a per-row gradient between the colours just outside it (keep = mask of pixels to leave)."""
    a = np.array(im).astype(float)
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        l, r = a[y, x0 - 2], a[y, x1 + 1]
        t = np.linspace(0, 1, x1 - x0)[:, None]
        row = l * (1 - t) + r * t
        if keep is not None:
            row = np.where(keep[y - y0, :, None], a[y, x0:x1], row)
        a[y, x0:x1] = row
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


def paint(im, box, draw_fn, keep=None):
    """Skin-fill box, then draw shapes at UPx over it; only the box is touched."""
    x0, y0, x1, y1 = box
    base = skin_fill(im, box, keep).crop(box).resize(((x1 - x0) * UP, (y1 - y0) * UP), Image.BICUBIC)
    draw_fn(ImageDraw.Draw(base), lambda x, y: ((x - x0) * UP, (y - y0) * UP))
    out = im.copy()
    out.paste(base.resize((x1 - x0, y1 - y0), Image.LANCZOS), (x0, y0))
    return out


# The art's smile line, measured on the source pixels: y ~162, x 164..203 (centre x ~184).
# Every talking shape is centred on it (opening around the line, not hanging toward the chin).
def mouth(kind):
    def fn(d, p):
        def ell(b, c):
            d.ellipse([*p(b[0], b[1]), *p(b[2], b[3])], fill=c)
        if kind == 1:  # closed, mid-word: the smile line itself, slightly flatter
            d.arc([*p(168, 148), *p(200, 163)], 25, 155, fill=DARK, width=3 * UP)
        elif kind == 2:  # small open
            ell((173, 157, 195, 167), DARK)
        elif kind == 3:  # mid: smile-shaped opening, teeth line on the smile
            d.pieslice([*p(171, 145), *p(197, 169)], 0, 180, fill=DARK)
            d.rectangle([*p(174, 157), *p(194, 159)], fill=TEETH)
        elif kind == 4:  # wide smile: flat top with teeth, round bottom, tongue
            d.pieslice([*p(168, 140), *p(200, 172)], 0, 180, fill=DARK)
            d.rectangle([*p(171, 156), *p(197, 158)], fill=TEETH)
            ell((177, 164, 191, 172), TONGUE)
        elif kind == 5:  # "O"
            ell((177, 152, 191, 170), DARK)
    return fn


def blinked(im, level):
    """Eyes half (1) or fully (2) closed. Each eye is skin-filled from its own cheek edges —
    a fill across both eyes would sample the dark headset cups."""
    for ex0, ey0, ex1, ey1 in EYES:
        box = (ex0 - 3, ey0 - 3, ex1 + 3, ey1 + 3)
        cx, cy, rx, ry = (ex0 + ex1) / 2, (ey0 + ey1) / 2, (ex1 - ex0) / 2 + 2, (ey1 - ey0) / 2 + 2
        yy, xx = np.mgrid[box[1]:box[3], box[0]:box[2]]
        inside = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1
        keep = ~(inside & ((yy < cy) if level == 1 else True))

        def lid(d, p, x0=ex0, x1=ex1, cy=cy):
            if level == 2:  # closed: soft downward lash curve
                d.arc([*p(x0 + 1, cy - 12), *p(x1 - 1, cy + 5)], 15, 165, fill=DARK, width=3 * UP)
            else:  # half: lid edge across the middle
                d.line([*p(x0 + 1, cy), *p(x1 - 1, cy)], fill=DARK, width=3 * UP)
        im = paint(im, box, lid, keep)
    return im


def labels(cells, cw):
    """Per-dot layer id sampled at dot centres: 0 body, 1 head, 2 arm."""
    s = BUST / cells
    xs, ys = (np.arange(cw) + 0.5) * s, (np.arange(cells) + 0.5) * s
    X, Y = np.meshgrid(xs, ys)
    lab = np.zeros((cells, cw), np.uint8)
    lab[(Y < HEAD_Y) | ((X > 125) & (X < 160) & (Y < 194))] = 1
    poly = Image.new('L', (int(329 / s * UP), int(BUST / s * UP)))
    ImageDraw.Draw(poly).polygon([(x / s * UP, y / s * UP) for x, y in ARM], fill=255)
    lab[np.array(poly.resize((cw, cells), Image.NEAREST)) > 0] = 2
    return lab


def box_cells(box, cells):
    s = cells / BUST
    return int(np.floor(box[0] * s)), int(np.floor(box[1] * s)), int(np.ceil(box[2] * s)), int(np.ceil(box[3] * s))


def build(name, cells, im, mask):
    gray, m = prep(im, mask, BUST, cells)
    lut = eq_lut(gray, m)
    rest = compose(m, ink_map(gray, lut))
    variant = lambda img, msk=mask: compose(*(lambda g, mm: (mm, ink_map(g, lut)))(*prep(img, msk, BUST, cells)))

    # layers: official dots split by part; outline dots go to the neighbouring part (arm > head > body)
    lab = labels(cells, m.shape[1])
    opaque = rest[..., 3] > 0
    grow = lambda b: np.array(Image.fromarray(b.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(3))) > 0
    arm_m = grow((lab == 2) & m) & opaque
    head_m = grow((lab == 1) & m) & opaque & ~arm_m
    body_m = opaque & ~arm_m & ~head_m

    # body under the arm: mirror the right shoulder/torso across the symmetry axis (only where the arm is opaque)
    a, mk = np.array(im), np.array(mask) > 0
    poly = Image.new('L', im.size)
    ImageDraw.Draw(poly).polygon(ARM, fill=255)
    fill_px = (np.array(poly) > 0) & (np.arange(im.size[0])[None, :] >= 94)
    ys, xs = np.nonzero(fill_px)
    mirrored = SYM_X2 - xs
    ok = (mirrored < im.size[0]) & mk[ys, np.clip(mirrored, 0, im.size[0] - 1)]
    a2, mk2 = a.copy(), mk.copy()
    a2[ys[ok], xs[ok]] = a[ys[ok], mirrored[ok]]
    mk2[ys[ok], xs[ok]] = True
    filled = variant(Image.fromarray(a2), Image.fromarray(mk2.astype(np.uint8) * 255))

    layers = {k: np.where(v[..., None], rest, 0) for k, v in (('body', body_m), ('head', head_m), ('arm', arm_m))}
    layers['body'] = np.where((arm_m & (filled[..., 3] > 0))[..., None], filled, layers['body'])

    comp = layers['body'].copy()
    for k in ('arm', 'head'):
        comp = np.where((layers[k][..., 3] > 0)[..., None], layers[k], comp)
    if cells == 300:
        official = np.array(Image.open(OUT / 'vee_dither.png').convert('RGBA'))[::SCALE, ::SCALE]
        assert np.array_equal(comp, official), 'rest pose must equal the official mascot'

    out = DEST / name
    out.mkdir(parents=True, exist_ok=True)
    for k, v in layers.items():
        upscale(v).save(out / f'{k}.png')
    mx0, my0, mx1, my1 = box_cells(MOUTH_BOX, cells)
    for i in range(6):
        sprite = rest if i == 0 else variant(paint(im, MOUTH_PAINT, mouth(i)))
        upscale(sprite[my0:my1, mx0:mx1]).save(out / f'mouth{i}.png')
    ex0, ey0, ex1, ey1 = box_cells(EYES_BOX, cells)
    for lvl in (1, 2):
        sprite = variant(blinked(im, lvl))
        upscale(sprite[ey0:ey1, ex0:ex1]).save(out / f'blink{lvl}.png')

    px = lambda v: round(v * cells / BUST * SCALE, 1)
    rig = {
        'w': m.shape[1] * SCALE, 'h': cells * SCALE,
        'neck': [px(NECK[0]), px(NECK[1])], 'shoulder': [px(SHOULDER[0]), px(SHOULDER[1])],
        'elbow': [px(ELBOW[0]), px(ELBOW[1])], 'ear': [px(EAR[0]), px(EAR[1])],
        'mouth': [mx0 * SCALE, my0 * SCALE, (mx1 - mx0) * SCALE, (my1 - my0) * SCALE],
        'eyes': [ex0 * SCALE, ey0 * SCALE, (ex1 - ex0) * SCALE, (ey1 - ey0) * SCALE],
    }
    (out / 'rig.json').write_text(json.dumps(rig, indent=1))
    print(name, rig)


if __name__ == '__main__':
    im, mask = load(SRC)
    for name, cells in SIZES.items():
        build(name, cells, im, mask)
