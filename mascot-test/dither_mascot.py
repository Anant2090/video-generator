"""Pocketsflow-style 1-bit Bayer dither of the VEE mascot + a 1080p test frame.

python mascot-test/dither_mascot.py                      (run from video/) official mascot + test frame
python mascot-test/dither_mascot.py SRC BUST OUT.png [CELLS]   other pose; BUST 0 = no crop;
    CELLS = dots tall (default 300 -> 900px). Small on-screen sizes need their own dither:
    shrinking a 3px-dot image turns the dots to mush/moire.

The steps are importable (rig_mascot.py reuses them so every rig layer shares one tone map + grid).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = Path(__file__).parent
SCALE = 3         # px per dot in the output (Pocketsflow ≈ 3-4px at 1080p)
INK, PAPER = (10, 10, 10), (255, 255, 255)
BG = '#3ECDF0'    # Voicera cyan (brand.ts)


def load(src_path):
    """Cut out: use alpha if the source has it, else flood the off-white background in from the border."""
    src = Image.open(src_path)
    w, h = src.size
    if 'A' in src.getbands() and src.getchannel('A').getextrema()[0] < 255:  # real transparency only
        mask = src.getchannel('A').point(lambda v: 255 * (v > 128))
        im = Image.alpha_composite(Image.new('RGBA', src.size, 'white'), src.convert('RGBA')).convert('RGB')
        return im, mask
    im = src.convert('RGB')
    key = (255, 0, 255)
    cut = im.copy()
    border = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
    for p in border:
        if min(cut.getpixel(p)) > 200:  # only seed on background; the feet touch the bottom edge
            ImageDraw.floodfill(cut, p, key, thresh=40)
    return im, Image.fromarray(((np.array(cut) != key).any(2) * 255).astype(np.uint8))


def prep(im, mask, bust, cells):
    """Crop, down to dither resolution; returns (gray L image, figure mask bool array)."""
    w, h = im.size
    if bust:
        im, mask = im.crop((0, 0, w, bust)), mask.crop((0, 0, w, bust))
        w, h = im.size
    cw = round(w * cells / h)
    gray = im.convert('L').filter(ImageFilter.UnsharpMask(2, 150, 2)).resize((cw, cells), Image.LANCZOS)
    m = mask.resize((cw, cells), Image.LANCZOS).point(lambda v: 255 * (v > 128))
    m = np.array(m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))) > 0  # drop specks
    return gray, m


def eq_lut(gray, m):
    """Histogram-equalization LUT over the figure (same maths as PIL ImageOps.equalize), reusable across variants."""
    hist = gray.histogram(Image.fromarray(m.astype(np.uint8) * 255))
    nz = [v for v in hist if v]
    step = (sum(nz) - nz[-1]) // 255
    if len(nz) <= 1 or not step:
        return list(range(256))
    lut, n = [], step // 2
    for i in range(256):
        lut.append(n // step)
        n += hist[i]
    return lut


def ink_map(gray, lut):
    """Ordered dither with an 8x8 Bayer matrix (stable dots, no frame-to-frame shimmer)."""
    g = np.array(gray.point(lut), float)
    b = np.array([[0]])
    for _ in range(3):
        b = np.block([[4 * b, 4 * b + 2], [4 * b + 3, 4 * b + 1]])
    thresh = (b + 0.5) / 64 * 255
    h, w = g.shape
    return g < np.tile(thresh, (h // 8 + 1, w // 8 + 1))[:h, :w]


def compose(m, ink):
    """RGBA at dot resolution: white/black dots inside, 1-dot black outline, transparent outside."""
    grown = np.array(Image.fromarray(m.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(3))) > 0
    rgba = np.zeros((*m.shape, 4), np.uint8)
    rgba[m] = (*PAPER, 255)
    rgba[m & ink] = (*INK, 255)
    rgba[grown & ~m] = (*INK, 255)
    return rgba


def upscale(rgba, scale=SCALE):
    h, w = rgba.shape[:2]
    return Image.fromarray(rgba).resize((w * scale, h * scale), Image.NEAREST)


if __name__ == '__main__':
    ARGS = sys.argv[1:]
    src = Path(ARGS[0] if ARGS else 'Screenshot 2026-04-27 175954 1.png')
    bust = int(ARGS[1]) if ARGS else 400  # crop source to head+torso (px); Pocketsflow uses a big bust shot
    name = ARGS[2] if ARGS else 'vee_dither.png'
    cells = int(ARGS[3]) if len(ARGS) > 3 else 300  # dither grain: bust height in dots

    im, mask = load(src)
    gray, m = prep(im, mask, bust, cells)
    mascot = upscale(compose(m, ink_map(gray, eq_lut(gray, m))))
    mascot.save(OUT / name)
    if ARGS:
        sys.exit(print('wrote', OUT / name, mascot.size))

    # Test frame in the Pocketsflow layout: flat color, mono labels, boxed headline.
    frame = Image.new('RGB', (1920, 1080), BG)
    d = ImageDraw.Draw(frame)
    mono = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 22)
    head = ImageFont.truetype('C:/Windows/Fonts/bahnschrift.ttf', 150)
    head.set_variation_by_name('Bold')
    d.text((72, 56), '// 01 · meet your agent', font=mono, fill=INK)
    d.text((1848, 56), 'VOICERA  00:00:01:12', font=mono, fill=INK, anchor='ra')
    frame.paste(mascot, (190, 1080 - mascot.height), mascot)
    d.text((980, 330), 'Meet', font=head, fill=INK)
    x0, y0, x1, y1 = d.textbbox((980, 500), 'VEE.', font=head)
    d.rectangle((x0 - 18, y0 - 14, x1 + 18, y1 + 14), fill=PAPER)
    d.text((980, 500), 'VEE.', font=head, fill=INK)
    d.text((984, 720), '// your AI voice agent', font=mono, fill=INK)
    frame.save(OUT / 'test_frame.png')
    print('wrote', OUT / 'vee_dither.png', mascot.size, 'and', OUT / 'test_frame.png')
