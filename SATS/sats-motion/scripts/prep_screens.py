"""Screenshots -> public/screens/*.png at 2x, with redactions and text patches baked in.

Coordinates are in source (1x) pixels. Font sizes are calibrated so the original string
would have had its measured width, so replacements match the surrounding text.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT.parent
OUT = ROOT / 'public' / 'screens'
FONT = str(ROOT / 'assets' / 'Inter.ttf')
S = 2  # upscale factor


def font(size: float, weight: int) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(FONT, round(size * S))
    f.set_variation_by_axes([weight if b'Weight' in a['name'] else min(max(size, a['minimum']), a['maximum'])
                             for a in f.get_variation_axes()])
    return f


def calibrate(text: str, width: float, weight: int) -> float:
    lo, hi = 6.0, 60.0
    for _ in range(30):
        mid = (lo + hi) / 2
        if font(mid, weight).getlength(text) / S < width:
            lo = mid
        else:
            hi = mid
    return lo


def load(name: str) -> Image.Image:
    im = Image.open(SRC / name).convert('RGB')
    im = im.resize((im.width * S, im.height * S), Image.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(radius=2, percent=45, threshold=2))


def patch(im, rect, fill=(254, 254, 254), lines=(), x=0, y0=0, lh=0, size=13, weight=400, color=(55, 66, 92), soften=0.55):
    x0, y0r, x1, y1 = (v * S for v in rect)
    d = ImageDraw.Draw(im)
    d.rectangle([x0, y0r, x1, y1], fill=fill)
    f = font(size, weight)
    for i, line in enumerate(lines):
        d.text((x * S, (y0 + i * lh) * S), line, font=f, fill=color, anchor='lm')
    if soften:
        box = (x0, y0r, x1, y1)
        im.paste(im.crop(box).filter(ImageFilter.GaussianBlur(soften)), box)


def canvas():
    im = load('Generated image 1.png')
    desc = calibrate('Shipment status from COSYS.', 139, 400)
    for y, x1, text in [(170, 1176, 'Shipment status lookup.'), (268, 1180, 'Consignee and pieces lookup.'),
                        (370, 1180, 'Flight details lookup.'), (470, 1186, 'Arrival time and warehouse.')]:
        patch(im, (997, y - 10, x1, y + 9), lines=[text], x=1000, y0=y, size=desc)
    patch(im, (553, 730, 668, 749), lines=['Flight details lookup.'], x=555, y0=739, size=desc)
    agent = calibrate('Answers only from the COSYS', 162, 400)
    patch(im, (781, 236, 948, 272), lines=['Answers only from the', 'shipment tools below.'], x=785, y0=246, lh=15.5, size=agent)
    patch(im, (332, 400, 482, 450), lines=['Reads the ATA context and', 'speaks the personalized', 'Notice of Arrival.'],
          x=335, y0=410, lh=16, size=calibrate('Reads the ATA context and', 140, 400))
    # Supervisor: drops the localhost URL and a stray "A"
    patch(im, (553, 402, 728, 492), lines=['Supervisor / Orchestrator.', 'Routes to Shipment Agent,', 'FAQ Agent, or Human', 'Escalation.'],
          x=557, y0=412.5, lh=16.5, size=calibrate('Supervisor / Orchestrator.', 143, 400))
    rna = calibrate('Demo retry. Stores retry count, call', 187, 400)
    patch(im, (294, 728, 492, 764), fill=(252, 252, 252), lines=['Retry handling. Stores retry count,', 'call status, and the second attempt.'],
          x=299, y0=739, lh=15.5, size=rna)
    esc = calibrate('Existing transfer with AWB and', 164, 400)
    patch(im, (785, 716, 963, 767), fill=(252, 252, 253), lines=['Hands off with the AWB and', 'what has already been done.'],
          x=789, y0=726, lh=15.5, size=esc)
    patch(im, (1009, 716, 1192, 767), lines=['Passes the handoff and connects', 'the consignee to a team member.'],
          x=1012, y0=726, lh=15.5, size=calibrate('existing transfer_to, agent, voice', 158, 400))
    patch(im, (1002, 578, 1188, 614), fill=(254, 253, 253), lines=['Documents, collection, and', 'general SATS procedure.'],
          x=1006, y0=588.5, lh=15.5, size=calibrate('Documents, collection, and ge', 160, 400))
    im.save(OUT / 'canvas.png', optimize=True)


def home():
    im = load('image.png')
    emoji = im.crop((1184 * S, 64 * S, 1220 * S, 100 * S))
    size = calibrate('Welcome , Anant', 210, 700)
    f = font(size, 700)
    text = 'Welcome back'
    w = f.getlength(text) / S
    total = w + 8 + 36
    x = 1092 - total / 2
    patch(im, (955, 60, 1224, 104), fill=(255, 255, 255), lines=[text], x=x, y0=81, size=size, weight=700, color=(51, 65, 85), soften=0.4)
    im.paste(emoji, (round((x + w + 8) * S), 64 * S))
    # sidebar user: "Anant [Pro]" -> "SATS Demo", avatar letter A -> S
    patch(im, (70, 812, 196, 850), fill=(255, 255, 255), lines=['SATS Demo'], x=78, y0=831.5,
          size=calibrate('Anant', 50, 700), weight=700, color=(17, 24, 39), soften=0.4)
    d = ImageDraw.Draw(im)
    c1, c2 = im.getpixel((16 * S, 831 * S)), im.getpixel((48 * S, 831 * S))
    cx, cy, r = 32.3 * S, 831.7 * S, 21.5 * S
    for i in range(round(2 * r)):
        k = i / (2 * r)
        col = tuple(round(a + (b - a) * k) for a, b in zip(c1, c2))
        xx = cx - r + i
        h = (r * r - (xx - cx) ** 2) ** 0.5
        d.line([(xx, cy - h), (xx, cy + h)], fill=col)
    d.text((cx, cy), 'S', font=font(17, 800), fill=(255, 255, 255), anchor='mm')
    im.save(OUT / 'home.png', optimize=True)


def workflows():
    im = load('image (2).png')
    patch(im, (186, 702, 262, 728), fill=(255, 255, 255), lines=['SATS Demo'], x=190, y0=715,
          size=calibrate('Anant', 40, 500), weight=500, color=(91, 107, 124), soften=0.4)
    im.save(OUT / 'workflows.png', optimize=True)


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    canvas()
    home()
    workflows()
    print('wrote', *(p.name for p in OUT.glob('*.png')))
