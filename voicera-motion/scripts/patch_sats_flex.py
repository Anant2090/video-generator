"""Patch the updated SATS mp4 (Clipchamp) at the human-transfer beat.

Overlays Flex + conversation history on the canvas, replaces the 2s counter
greeting with a ~5.6s line, and holds the shot so talk finishes before Scenario 3.
Adds ~0.6s only. Does not touch PJFM outputs.
"""
from __future__ import annotations

import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "out"
SRC = OUT / "final video 2 (1).mp4"
BACKUP = OUT / "final video 2 (1).backup.mp4"
DST = OUT / "final video 2 (1).mp4"
TMP = OUT / "sats-qa"
FLEX_SRC = OUT / "flex.png"
B3 = Path(r"c:\Anant\Company\Video Editor\voicera-video\SATS\sats-motion\public\audio\call\B3.wav")
OVERLAY = TMP / "flex-overlay.png"
BUBBLE = TMP / "counter-bubble.png"

# Transferring starts ~174.8; counter line ~176.8; Scenario 3 fade ~182.
FLEX_IN = 174.8
HOLD_END = 181.8
RESUME = 183.0
TALK_IN = 176.8
TALK_DUR = 5.6
WIN = (698, 86, 1156, 900)  # x, y, w, h of canvas card


def ffmpeg(*args: str) -> None:
    import imageio_ffmpeg
    cmd = [imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-y", *args]
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit((r.stderr or r.stdout)[-4000:])


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "segoeuib.ttf" if bold else "segoeui.ttf"
    return ImageFont.truetype(fr"C:\Windows\Fonts\{name}", size)


def rounded(draw: ImageDraw.ImageDraw, box, fill, radius=12, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def build_flex_card() -> Image.Image:
    w, h = WIN[2], WIN[3]
    card = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    shot = Image.open(FLEX_SRC).convert("RGBA").resize((w, h), Image.Resampling.LANCZOS)
    card.alpha_composite(shot)
    d = ImageDraw.Draw(card)
    ink, sub, blue = (29, 29, 31, 255), (110, 119, 129, 255), (34, 108, 242, 255)

    # Cover empty columns
    d.rectangle((int(w * 0.062), 52, int(w * 0.26), h - 42), fill=(255, 255, 255, 255))
    d.rectangle((int(w * 0.262), 52, int(w * 0.71), h - 42), fill=(255, 255, 255, 255))
    d.rectangle((int(w * 0.712), 52, w - 8, h - 42), fill=(255, 255, 255, 255))

    d.text((int(w * 0.10), 78), "Tasks", font=font(18, True), fill=ink)
    rounded(d, (int(w * 0.075), 118, int(w * 0.248), 210), (239, 246, 255, 255), 12, (34, 108, 242, 90), 1)
    d.text((int(w * 0.09), 128), "LIVE TASK", font=font(11, True), fill=blue)
    d.text((int(w * 0.09), 148), "Inbound transfer · AWB 4518", font=font(13, True), fill=ink)
    d.text((int(w * 0.09), 170), "Tan Freight · Daniel", font=font(12), fill=sub)

    d.text((int(w * 0.28), 64), "CONVERSATION HISTORY", font=font(13, True), fill=blue)
    bubbles = [
        (False, "Notice of arrival · AWB 4518 · Frankfurt 14:32", (232, 248, 252, 255)),
        (False, "Status: ready for collection · 12 pcs · 486 kg", (232, 248, 252, 255)),
        (True, "Can I speak to someone at the counter?", (238, 242, 247, 255)),
        (False, "Transferred with AWB and conversation context", (239, 246, 255, 255)),
    ]
    y = 92
    left, right = int(w * 0.275), int(w * 0.695)
    for mine, text, fill in bubbles:
        tw = min(int((right - left) * 0.92), 420)
        box_w = min(tw, 390)
        x0 = right - box_w if mine else left
        rounded(d, (x0, y, x0 + box_w, y + 48), fill, 13, (226, 232, 240, 255), 1)
        d.text((x0 + 12, y + 14), text, font=font(13), fill=(29, 78, 216, 255) if "Transferred" in text else ink)
        y += 58
    rounded(d, (left, y + 4, left + 210, y + 36), (236, 253, 245, 255), 18, (167, 243, 208, 255), 1)
    d.text((left + 16, y + 10), "Live with import counter", font=font(13, True), fill=(4, 120, 87, 255))

    d.text((int(w * 0.76), 70), "Customer 360", font=font(18, True), fill=ink)
    rows = [("CONSIGNEE", "Daniel · Tan Freight"), ("AWB", "4518"), ("STATUS", "Ready for collection"), ("PIECES / WEIGHT", "12 pcs · 486 kg")]
    ry = 108
    for lab, val in rows:
        rounded(d, (int(w * 0.73), ry, w - 22, ry + 58), (248, 250, 252, 255), 10, (226, 232, 240, 255), 1)
        d.text((int(w * 0.745), ry + 8), lab, font=font(11, True), fill=sub)
        d.text((int(w * 0.745), ry + 26), val, font=font(14, True), fill=ink)
        ry += 66

    # Rounded mask so it sits on the existing card
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), 16, fill=255)
    card.putalpha(mask)
    return card


def build_overlay() -> None:
    TMP.mkdir(parents=True, exist_ok=True)
    canvas = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)
    d.text((WIN[0] + 8, WIN[1] - 40), "AGENT DESKTOP · CONTEXT HANDED OVER", font=font(18, True), fill=(110, 119, 129, 255))
    canvas.alpha_composite(build_flex_card(), (WIN[0], WIN[1]))
    canvas.save(OVERLAY)
    print("wrote", OVERLAY)


def splice() -> None:
    if not SRC.exists() and not BACKUP.exists():
        raise SystemExit(f"missing {SRC}")
    if not BACKUP.exists():
        BACKUP.write_bytes(SRC.read_bytes())
        print("backup", BACKUP)
    source = BACKUP if BACKUP.exists() else SRC
    hold = TALK_IN + TALK_DUR - HOLD_END  # extra freeze so 5.6s line finishes
    mid = HOLD_END - FLEX_IN
    overlay_len = mid + hold
    print(f"flex {FLEX_IN}->{HOLD_END}+{hold:.2f}s freeze ({overlay_len:.2f}s), talk {TALK_IN}+{TALK_DUR}s")

    work = TMP / "sats-flex-work.mp4"
    fc = (
        f"[0:v]trim=0:{FLEX_IN},setpts=PTS-STARTPTS[pre];"
        f"[0:v]trim={FLEX_IN}:{HOLD_END},setpts=PTS-STARTPTS[mid];"
        f"[0:v]trim={RESUME},setpts=PTS-STARTPTS[post];"
        f"[1:v]format=rgba,fade=t=in:st=0:d=0.28:alpha=1,fade=t=out:st={overlay_len-0.32:.3f}:d=0.3:alpha=1[ov];"
        f"[mid]split[ms][me];"
        f"[me]trim=start={mid-0.05:.3f},setpts=PTS-STARTPTS,loop=loop={int(round(hold*30))}:size=1:start=0,setpts=N/30/TB[holdv];"
        f"[ms][holdv]concat=n=2:v=1:a=0[midh];"
        f"[midh][ov]overlay=0:0[mido];"
        f"[pre][mido][post]concat=n=3:v=1:a=0[vout];"
        f"[0:a]atrim=0:{TALK_IN},asetpts=PTS-STARTPTS[a0];"
        f"[2:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,"
        f"atrim=0:{TALK_DUR},asetpts=PTS-STARTPTS,apad=pad_dur=0[b3];"
        f"[0:a]atrim={RESUME},asetpts=PTS-STARTPTS[a2];"
        f"[a0][b3][a2]concat=n=3:v=0:a=1[aout]"
    )
    ffmpeg(
        "-i", str(source),
        "-framerate", "30", "-loop", "1", "-t", f"{overlay_len:.3f}", "-i", str(OVERLAY),
        "-i", str(B3),
        "-filter_complex", fc,
        "-map", "[vout]", "-map", "[aout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
        str(work),
    )
    work.replace(DST)
    print("wrote", DST)


if __name__ == "__main__":
    build_overlay()
    splice()
