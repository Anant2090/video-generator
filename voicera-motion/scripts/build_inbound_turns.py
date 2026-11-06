"""Inbound speaker turns from whisper — keep spoken lines; glue spelling."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
caps = json.loads((ROOT / "public/pjfm/inbound-captions.json").read_text(encoding="utf-8"))

raw = []
for c in caps:
    t = c["text"].strip()
    if not t or t in {"[", "BL", "ANK", "_", "AUD", "IO", "]"}:
        continue
    if t == "22" and c["startMs"] < 1500:
        continue
    if t in {".", ",", "?", "!"} and raw:
        raw[-1]["text"] += t
        raw[-1]["endMs"] = c["endMs"]
        continue
    raw.append({"text": t.lstrip(), "startMs": c["startMs"], "endMs": c["endMs"]})
if raw and raw[0]["text"] in {".", "22"}:
    raw = raw[1:]

SEQ = [
    (("Min", "istries"), "Ministries"),
    (("Min", "istries."), "Ministries."),
    (("Gl", "orious"), "Glorious"),
    (("Sin", "hal", "a"), "Sinhala"),
    (("Kat", "una", "ya", "ke"), "Katunayake"),
    (("forensic", "night"), "Forensic Night"),
    (("7.", "30"), "7:30"),
    (("11.", "30"), "11:30"),
    (("5,", "000."), "5,000."),
    (("auditor", "ium"), "auditorium"),
    (("Est", "ablished"), "Established"),
    (("Mand", "ate"), "Mandate"),
    (("Plus", "9", "498", "7", "654", "3", "200", "10."), "+94 987 654 3210."),
    (("plus", "9", "49", "8", "765", "4", "32", "10"), "+94 987 654 3210"),
    (("follow", "up"), "follow up"),
    (("Your", "most", "welcome,"), "You're most welcome,"),
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
        if w["text"] == "'s" and out:
            out[-1]["text"] += "'s"
            out[-1]["endMs"] = w["endMs"]
        else:
            out.append(w)
        i += 1
    return out


words = glue(raw)

CUTS = [
    (1360, "agent"),
    (10240, "visitor"),
    (13680, "agent"),
    (32960, "visitor"),
    (35660, "agent"),
    (55900, "visitor"),
    (59520, "agent"),
    (68290, "visitor"),
    (69830, "agent"),
    (75500, "visitor"),
    (80370, "agent"),
    (84530, "visitor"),
    (89200, "agent"),
    (108450, "visitor"),
    (109890, "agent"),
]


def who_of(ms: int) -> str:
    who = "agent"
    for t0, s in CUTS:
        if ms + 1 >= t0:
            who = s
        else:
            break
    return who


SPLIT_MS = (18700, 26080, 42250, 49160, 95290, 97340, 114350)

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
    if cur and who == cur["who"] and w["text"] in ("Our", "We", "Established", "It", "Your", "A", "Please", "Thank"):
        for mark in SPLIT_MS:
            if abs(w["startMs"] - mark) < 150:
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
    "durationSec": 135.5,
    "pickup": 1.36,
    "hangup": 135.0,
    "turns": turns,
}
dest = ROOT / "src/pjfm/inbound-turns.json"
dest.write_text(json.dumps(out, indent=2), encoding="utf-8")
print(len(turns), "turns ->", dest)
for t in turns:
    print(f"{t['id']:4} {t['who']:7} {t['at']:6.1f}-{t['end']:6.1f}  {t['text'][:140]}")
