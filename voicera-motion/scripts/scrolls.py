# Finds the jumpy wheel-scrolls in the screen recording and prepares smooth replacements.
#
#   python scripts/scrolls.py [from_s to_s]
#
# For each scroll gesture: the scrolling container rect, per-jump offsets, and a clean
# "content strip" (all frames of the gesture aligned and median-merged, which also
# removes the cursor). SmoothScroll.tsx slides the strip with easing + motion blur.
# Output: src/scrolls.json, public/scroll/g_NNNNN.png, and review sheets
# analysis/scrolls/check_N.png (each gesture's start frame with its area outlined).
# False detections (e.g. a modal opening) go in scrollDeny in src/video.json, by start frame.
import json, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw
from common import FF, ROOT, SRC, VIDEO

FPS = VIDEO["fps"]
SRC_FRAMES = VIDEO["frames"]
Q = 4                      # analysis downscale
W, H = VIDEO["width"] // Q, VIDEO["height"] // Q
T = 16                     # tile size at analysis res (64 source px)
MAXDY = 120                # max jump per frame, analysis px (480 source px)
GAP = 12                   # frames of stillness that still count as one gesture
MAX_ERR = 2.0              # mean abs error per jump above which a gesture is left as recorded
CHUNK = 900                # frames per parallel job
DENY = set(VIDEO.get("scrollDeny", []))

# Framed (screen-recording) ranges from timeline.ts; the recording box from video.json.
ts = (ROOT / "src/timeline.ts").read_text(encoding="utf-8")
ranges = [(int(a), SRC_FRAMES if b == "SRC_FRAMES" else int(b))
          for a, b, m in re.findall(r"from: (\d+), to: (\w+), mode: '(\w+)'", ts) if m == "framed"]
cx, cy, cw, ch = (VIDEO["crop"][k] for k in "xywh")
Y0, Y1 = -(-cy // Q), (cy + ch) // Q            # recording rows at analysis res


def decode(start, n, vf, shape):
    """Yields n frames starting exactly at source frame `start`."""
    cmd = [FF, "-loglevel", "error", "-ss", f"{(start - 0.25) / FPS:.4f}", "-i", SRC,
           "-frames:v", str(n), "-vf", vf, "-f", "rawvideo", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    size = int(np.prod(shape))
    for _ in range(n):
        buf = p.stdout.read(size)
        if len(buf) < size:
            break
        yield np.frombuffer(buf, np.uint8).reshape(shape)
    p.stdout.close(); p.wait()


def tile_shifts(prev, cur):
    """Best vertical shift per tile: cur[y] ~= prev[y + dy] (dy > 0: content moved up)."""
    h, w = cur.shape
    th, tw = h // T, w // T
    cur = cur[:th * T, :tw * T]; prev = prev[:th * T, :tw * T]
    h = th * T
    best = np.full((th, tw), np.inf, np.float32); bdy = np.zeros((th, tw), int)
    sad0 = None
    d = np.zeros(cur.shape, np.float32)
    rows = np.arange(h)
    for dy in range(-MAXDY, MAXDY + 1):
        d[:] = 0
        if dy >= 0:
            d[:h - dy] = np.abs(cur[:h - dy] - prev[dy:]); valid = rows < h - dy
        else:
            d[-dy:] = np.abs(cur[-dy:] - prev[:h + dy]); valid = rows >= -dy
        vrows = valid.reshape(th, T).sum(axis=1)[:, None]          # valid rows per tile row
        s = np.where(vrows > T // 2, d.reshape(th, T, tw, T).sum(axis=(1, 3)) / np.maximum(vrows * T, 1), np.inf)
        if dy == 0:
            sad0 = s
        m = s < best
        best[m] = s[m]; bdy[m] = dy
    texture = cur.reshape(th, T, tw, T).std(axis=(1, 3))
    return bdy, best, sad0, texture


def scroll_event(prev, cur):
    """(dy, bbox tiles) if this frame pair is a clean scroll of one region, else None."""
    bdy, best, sad0, tex = tile_shifts(prev, cur)
    textured = tex > 4
    moving = textured & (bdy != 0) & (best < 0.35 * sad0) & (sad0 > 2)
    if moving.sum() < 6:
        return None
    vals, counts = np.unique(bdy[moving], return_counts=True)
    dy = int(vals[counts.argmax()])
    agree = moving & (np.abs(bdy - dy) <= 1)
    if agree.sum() < 0.7 * moving.sum():
        return None
    # Grow the bbox across tiles that agree or are featureless; stop at static texture.
    ok = agree | ~textured
    ys, xs = np.nonzero(agree)
    r0, r1, c0, c1 = ys.min(), ys.max(), xs.min(), xs.max()
    grown = True
    while grown:
        grown = False
        if r0 > 0 and ok[r0 - 1, c0:c1 + 1].all(): r0 -= 1; grown = True
        if r1 < ok.shape[0] - 1 and ok[r1 + 1, c0:c1 + 1].all(): r1 += 1; grown = True
        if c0 > 0 and ok[r0:r1 + 1, c0 - 1].all(): c0 -= 1; grown = True
        if c1 < ok.shape[1] - 1 and ok[r0:r1 + 1, c1 + 1].all(): c1 += 1; grown = True
    return dy, (r0, r1, c0, c1)


def find_gestures(a, b):
    events = []                                  # (frame, dy_q, rect in source px)
    n = b - a
    prev = None
    for i, f in enumerate(decode(a, n, f"scale={W}:{H},format=gray", (H, W))):
        cur = f[Y0:Y1].astype(np.float32)
        if prev is not None and (np.abs(cur - prev) > 12).mean() > 0.03:
            ev = scroll_event(prev, cur)
            if ev:
                dy, (r0, r1, c0, c1) = ev
                rect = [int(c0 * T * Q), int((r0 * T + Y0) * Q), int((c1 - c0 + 1) * T * Q), int((r1 - r0 + 1) * T * Q)]
                events.append((a + i, int(dy), rect))
        prev = cur
    gestures = []
    for f, dy, rect in events:
        g = gestures[-1] if gestures else None
        if g and f - g["frames"][-1] <= GAP and np.sign(dy) == np.sign(g["dys"][-1]) and overlap(g["rect"], rect) > 0.3:
            g["frames"].append(f); g["dys"].append(dy); g["rect"] = union(g["rect"], rect)
        else:
            gestures.append({"frames": [f], "dys": [dy], "rect": rect})
    return gestures


def overlap(r, s):
    ix = max(0, min(r[0] + r[2], s[0] + s[2]) - max(r[0], s[0]))
    iy = max(0, min(r[1] + r[3], s[1] + s[3]) - max(r[1], s[1]))
    return ix * iy / min(r[2] * r[3], s[2] * s[3])


def union(r, s):
    x0, y0 = min(r[0], s[0]), min(r[1], s[1])
    return [x0, y0, max(r[0] + r[2], s[0] + s[2]) - x0, max(r[1] + r[3], s[1] + s[3]) - y0]


def refine(prev, cur, dy_src):
    """Exact shift at full res near the coarse estimate; returns (dy, mean abs error)."""
    g0, g1 = prev.mean(axis=2), cur.mean(axis=2)
    h = g1.shape[0]
    errs = {}
    for d in range(dy_src - Q - 1, dy_src + Q + 2):
        if d == 0 or abs(d) >= h // 2:
            continue
        a, b = (g1[:h - d], g0[d:]) if d > 0 else (g1[-d:], g0[:h + d])
        errs[d] = np.abs(a - b).mean()
    if not errs:
        return None, np.inf
    d = min(errs, key=errs.get)
    return d, errs[d]


def edges(prev, cur, d, rect):
    """Pixel-exact container rect: grow/shrink each side of the tile rect until the next
    column/row is static (matches unshifted) or conflicting (matches neither, e.g. a
    scrollbar thumb moving the other way). Clamped to the recording."""
    x0, y0 = max(rect[0], cx), max(rect[1], cy)
    x, y = x0, y0
    w, h = min(rect[0] + rect[2], cx + cw) - x0, min(rect[1] + rect[3], cy + ch) - y0
    g0, g1 = prev.mean(axis=2), cur.mean(axis=2)
    def line_state(vals_now, vals_shift, vals_still, conflict_stops):
        mv, st = np.abs(vals_now - vals_shift).mean(), np.abs(vals_now - vals_still).mean()
        if mv > 2 and st > 2:                   # neither shift explains it (scrollbar);
            return "stop" if conflict_stops else "?"   # rows near an edge lack a shifted twin
        return "stop" if st < 1 and mv > 2 else "moving" if mv < 1 and st > 2 else "?"
    ys = np.arange(max(y, cy), min(y + h, cy + ch) - abs(d))
    ys = ys if d > 0 else ys + abs(d)
    col = lambda c: line_state(g1[ys, c], g0[ys + d, c], g0[ys, c], True)
    xs = np.arange(x, x + w)
    row = lambda r: line_state(g1[r, xs], g0[r + d, xs], g0[r, xs], False) if cy <= r + d < cy + ch else "?"
    L, R, Tp, B = x, x + w - 1, y, y + h - 1
    while L < R and col(L) == "stop": L += 1
    while L > cx and col(L - 1) != "stop": L -= 1
    while R > L and col(R) == "stop": R -= 1
    while R < cx + cw - 1 and col(R + 1) != "stop": R += 1
    while Tp < B and row(Tp) == "stop": Tp += 1
    while Tp > cy and row(Tp - 1) != "stop": Tp -= 1
    while B > Tp and row(B) == "stop": B -= 1
    while B < cy + ch - 1 and row(B + 1) != "stop": B += 1
    return [int(L), int(Tp), int(R - L + 1), int(B - Tp + 1)]


def build(g, out_dir):
    s, e = g["frames"][0] - 1, g["frames"][-1]
    full = {s + i: fr for i, fr in enumerate(decode(s, e - s + 1, "format=rgb24", (VIDEO["height"], VIDEO["width"], 3)))}
    f1 = g["frames"][0]
    x, y, w, h = g["rect"]
    d1, _ = refine(full[f1 - 1][y:y + h, x:x + w].astype(np.float32), full[f1][y:y + h, x:x + w].astype(np.float32), g["dys"][0] * Q)
    if d1 is None:
        return None
    x, y, w, h = edges(full[f1 - 1].astype(np.float32), full[f1].astype(np.float32), d1, g["rect"])
    frames = {k: v[y:y + h, x:x + w].astype(np.float32) for k, v in full.items()}
    del full
    # layers: the still before the gesture, then the first frame after each jump
    layers, offs, errs = [frames[s]], [0], []
    for f, dyq in zip(g["frames"], g["dys"]):
        d, err = refine(frames[f - 1], frames[f], dyq * Q)
        if d is None or err > MAX_ERR:               # not a clean shift: leave it as recorded
            return {"skip": s, "err": round(float(err), 2)}
        layers.append(frames[f]); offs.append(offs[-1] + int(d)); errs.append(err)
    omin, omax = min(offs), max(offs)
    sh = h + omax - omin
    # median across aligned layers (removes the cursor, which stays put on screen
    # while the content moves); rows seen by one layer take that layer
    strip = np.zeros((sh, w, 3), np.float32)
    for r0 in range(0, sh, 128):
        r1 = min(sh, r0 + 128)
        stack = np.full((len(layers), r1 - r0, w, 3), np.nan, np.float32)
        for k, (L, o) in enumerate(zip(layers, offs)):
            top = o - omin                       # strip row where this layer starts
            a0, a1 = max(r0, top), min(r1, top + h)
            if a0 < a1:
                stack[k, a0 - r0:a1 - r0] = L[a0 - top:a1 - top]
        strip[r0:r1] = np.nanmedian(stack, axis=0)
    name = f"g_{s:05d}.png"
    Image.fromarray(np.clip(strip, 0, 255).astype(np.uint8)).save(out_dir / name, optimize=True)
    return {"from": s, "to": e, "rect": [x, y, w, h], "offsets": [[f, o] for f, o in zip([s] + g["frames"], offs)],
            "omin": int(omin), "strip": f"scroll/{name}", "err": round(float(max(errs)), 2)}


def check_sheets(result):
    out = ROOT / "analysis/scrolls"
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("check_*.png"):
        old.unlink()
    tiles = []
    for g in result:
        im = Image.fromarray(next(decode(g["from"], 1, "format=rgb24", (VIDEO["height"], VIDEO["width"], 3))))
        d = ImageDraw.Draw(im)
        x, y, w, h = g["rect"]
        d.rectangle([x, y, x + w, y + h], outline=(0, 200, 255), width=8)
        d.rectangle([0, 0, im.width, 70], fill=(0, 0, 0))
        d.text((14, 10), f"start frame {g['from']} ({g['from'] / FPS:.2f}s)  D={g['offsets'][-1][1]}px", fill=(255, 255, 255), font_size=44)
        tiles.append(im.resize((480, 270)))
    for i in range(0, len(tiles), 16):
        sheet = Image.new("RGB", (1920, 1080), "white")
        for j, t in enumerate(tiles[i:i + 16]):
            sheet.paste(t, ((j % 4) * 480, (j // 4) * 270))
        sheet.save(out / f"check_{i // 16 + 1}.png")
    print(f"review: analysis/scrolls/check_*.png ({len(tiles)} gestures)")


def job(span):
    a, b = span
    out_dir = ROOT / "public/scroll"
    items, log = [], []
    for g in find_gestures(a, b):
        if abs(sum(g["dys"]) * Q) < 24:
            continue
        if g["frames"][0] - 1 in DENY:
            continue
        item = build(g, out_dir)
        if item is None or "skip" in item:
            log.append(f"  skipped gesture at {(g['frames'][0] - 1) / FPS:.2f}s (err {item and item['err']})")
            continue
        items.append(item)
        log.append(f"{item['from'] / FPS:7.2f}-{item['to'] / FPS:7.2f}s  jumps={len(g['frames']):2d}  "
                   f"D={item['offsets'][-1][1]:5d}px  rect={item['rect']}  err={item['err']}")
    return items, log


if __name__ == "__main__":
    from multiprocessing import Pool
    lo, hi = (int(float(sys.argv[1]) * FPS), int(float(sys.argv[2]) * FPS)) if len(sys.argv) > 2 else (0, SRC_FRAMES)
    out_dir = ROOT / "public/scroll"; out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob("g_*.png"):
        old.unlink()
    # chunks overlap by one frame so a jump on a chunk's first frame still has its "previous" frame
    spans = [(max(a, lo, c - 1), min(b, hi, c + CHUNK)) for a, b in ranges for c in range(a, b, CHUNK)]
    spans = [sp for sp in spans if sp[0] < sp[1]]
    result = []
    with Pool(8) as pool:
        for items, log in pool.imap(job, spans):
            result += items
            for line in log:
                print(line, flush=True)
    result.sort(key=lambda g: g["from"])
    for a, b in zip(result, result[1:]):
        assert a["to"] <= b["from"], f"overlapping gestures at {a['from']} / {b['from']}"
    (ROOT / "src/scrolls.json").write_text(json.dumps(result, indent=1), encoding="utf-8")
    print(f"{len(result)} gestures -> src/scrolls.json")
    check_sheets(result)

