"""Speaker turns from whisper — keep every spoken line; only glue spelling."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
caps = json.loads((ROOT / "public/pjfm/outbound-captions.json").read_text(encoding="utf-8"))

raw = []
for c in caps:
    t = c["text"].strip()
    if not t or t in {"[", "BL", "ANK", "_", "AUD", "IO", "]"}:
        continue
    if t.lower() == "hall" and c["startMs"] < 1500:
        continue
    if c["startMs"] == c["endMs"] == 52500:
        continue
    if t in {".", ",", "?", "!"} and raw:
        raw[-1]["text"] += t
        raw[-1]["endMs"] = c["endMs"]
        continue
    raw.append({"text": t.lstrip(), "startMs": c["startMs"], "endMs": c["endMs"]})
raw = raw[1:]  # leading stray period

SEQ = [
    (("Min", "istries."), "Ministries."),
    (("forensic", "night"), "Forensic Night"),
    (("Thurs", "days"), "Thursdays"),
    (("tim", "ings"), "timings"),
    (("Kat", "una", "ya", "ke"), "Katunayake"),
    (("V", "y", "ango", "de"), "Veyangoda"),
    (("Sing", "h", "ala"), "Sinhala"),
    (("Sing", "h", "ala."), "Sinhala."),
    (("Po", "ya"), "Poya"),
    (("p.", "m", ".,"), "p.m."),
    (("a.", "m."), "a.m."),
    (("a.", "m", ".,"), "a.m."),
    (("7.", "30"), "7:30"),
    (("11.", "30"), "11:30"),
    (("prayer", "-", "related"), "prayer-related"),
    (("follow", "-", "up."), "follow-up."),
    (("info", "@", "profit", "ger", "ome.", "com."), "info@prophetjerome.com."),
    (("+", "94", "11", "777", "48", "77."), "+94 11 777 48 77."),
    (("+", "9", "49", "-", "8", "76", "-", "5", "43", "-", "2", "10."), "+94 987 654 3210."),
]


def glue(words):
    out = []
    i = 0
    n = len(words)
    while i < n:
        hit = None
        for seq, repl in SEQ:
            k = len(seq)
            if i + k <= n and tuple(w["text"] for w in words[i : i + k]) == seq:
                hit = (k, repl)
                break
        if hit:
            k, repl = hit
            out.append({"text": repl, "startMs": words[i]["startMs"], "endMs": words[i + k - 1]["endMs"]})
            i += k
            continue
        w = dict(words[i])
        if w["text"] == "'m" and out:
            out[-1]["text"] += "'m"
            out[-1]["endMs"] = w["endMs"]
        elif w["text"] == "'s" and out:
            out[-1]["text"] += "'s"
            out[-1]["endMs"] = w["endMs"]
        else:
            out.append(w)
        i += 1
    return out


words = glue(raw)
for w in words:
    if w["text"] == "V" and abs(w["startMs"] - 13280) < 80:
        w["text"] = "Vee"

CUTS = [
    (1680, "agent"),
    (8750, "visitor"),
    (11640, "agent"),
    (20000, "visitor"),
    (22540, "agent"),
    (63500, "visitor"),
    (68500, "agent"),
    (76500, "visitor"),
    (79050, "agent"),
    (98500, "visitor"),
    (105570, "agent"),
    (127490, "visitor"),
    (130620, "agent"),
    (136500, "visitor"),
    (145500, "agent"),
    (157500, "visitor"),
]

# New bubble on these sentence starts (same speaker).
SPLIT_MS = (29500, 38500, 43500, 48500, 57110)


def who_of(ms: int) -> str:
    who = "agent"
    for t0, s in CUTS:
        if ms + 1 >= t0:
            who = s
        else:
            break
    return who


turns = []
cur = None


def flush():
    global cur
    if cur:
        turns.append(cur)
        cur = None


for w in words:
    who = who_of(w["startMs"])
    new_bubble = False
    if cur and who == cur["who"] and w["text"] in ("The", "Would"):
        for mark in SPLIT_MS:
            if abs(w["startMs"] - mark) < 120:
                new_bubble = True
                break
    if cur is None or who != cur["who"] or new_bubble:
        flush()
        cur = {
            "id": f"T{len(turns) + 1}",
            "who": who,
            "at": w["startMs"] / 1000,
            "end": w["endMs"] / 1000,
            "words": [],
        }
    cur["words"].append({"w": w["text"], "t": round(w["startMs"] / 1000, 3)})
    cur["end"] = w["endMs"] / 1000
    cur["text"] = " ".join(x["w"] for x in cur["words"])
flush()

out = {
    "durationSec": 162.7,
    "pickup": 1.0,
    "hangup": 157.5,
    "turns": turns,
}
dest = ROOT / "src/pjfm/outbound-turns.json"
dest.write_text(json.dumps(out, indent=2), encoding="utf-8")
print(len(turns), "turns ->", dest)
for t in turns:
    print(f"{t['id']:4} {t['who']:7} {t['at']:6.1f}-{t['end']:6.1f}  {t['text'][:140]}")
