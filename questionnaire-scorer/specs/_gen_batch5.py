"""Batch 5 — value-only TOTAL scorers for confidently unidimensional scales.
Pulls item_count, option value-range, and citation from the harvested questionnaire (faithful;
no fabricated cut-offs). Reverse handled upstream by the host. Aggregate sum unless 'mean'.
Run from questionnaire-scorer/:  python specs/_gen_batch5.py"""
import json
from pathlib import Path
import importlib.util

b2spec = importlib.util.spec_from_file_location("b2", Path(__file__).parent / "_gen_batch2.py")
b2 = importlib.util.module_from_spec(b2spec); b2spec.loader.exec_module(b2)
case = b2.case

SPECS = Path(__file__).parent
ROOT = SPECS.parent.parent  # repo root
QDIR = ROOT / "questionnaire-harvester" / "output" / "questionnaires"
ODIR = ROOT / "questionnaire-harvester" / "output" / "options"

# id -> (aggregate, construct-phrase for the description). All single-construct totals.
BATCH = {
    "bite": ("sum", "irritability"),
    "swlls": ("sum", "satisfaction with one's love life"),
    "tai5": ("sum", "test anxiety"),
    "webexec": ("sum", "everyday executive-control problems"),
    "csjas": ("sum", "endorsement of critical social justice attitudes"),
    "hsc7": ("sum", "frequency of hypoglycemia symptoms"),
    "isc": ("sum", "impulsivity"),
    "amas": ("sum", "math anxiety"),
    "skep": ("sum", "skepticism toward advertising"),
    "aai": ("sum", "appearance anxiety"),
    "hs": ("sum", "healthy (adaptive) selfishness"),
    "hsns": ("sum", "hypersensitive (vulnerable) narcissism"),
    "bhps": ("sum", "histrionic personality traits"),
    "bfs": ("sum", "frequency of bullshitting"),
    "cfs": ("sum", "cognitive flexibility"),
    "sos": ("sum", "service to others in sobriety"),
    "gaene": ("sum", "acceptance of evolution"),
    "lying": ("sum", "frequency of everyday lying"),
    "mcss": ("sum", "shyness"),
    "ard": ("sum", "interpersonal dominance"),
    "uplas": ("sum", "loneliness"),
    "burnout": ("sum", "teacher burnout"),
    "gp": ("sum", "trait procrastination"),
    "egst": ("sum", "excessive / problematic gaming"),
    "iaa": ("sum", "problematic internet use"),
    "pci": ("sum", "procrastinatory cognitions"),
    "trust": ("sum", "trust in a close relationship"),
    "mate": ("sum", "acceptance of the theory of evolution"),
    "pts": ("sum", "positive thinking"),
    "ncs6": ("sum", "need for cognition"),
    "grits": ("mean", "grit (perseverance and consistency of interest)"),
    "cns": ("mean", "felt connectedness to nature"),
    "ohq": ("mean", "subjective happiness"),
}


def meta(qid):
    d = json.loads((QDIR / f"qst_{qid}.json").read_text())
    m = d["metadata"]
    els = d["pages"][0]["elements"]
    n = len(els)
    oref = (els[0].get("option") or {}).get("ref", "").split("@")[0]
    ov = json.loads((ODIR / f"{oref}.json").read_text())
    vals = [x.get("value") for x in ov.get("options", [])]
    lo, hi = int(min(vals)), int(max(vals))
    return m, n, lo, hi


for sid, (agg, phrase) in BATCH.items():
    m, n, lo, hi = meta(sid)
    items = [f"pr_{sid}_{i}" for i in range(1, n + 1)]
    if agg == "mean":
        scoring = f"Score = MEAN of the {n} items (each {lo}-{hi}), range {lo}-{hi}."
    else:
        scoring = f"Total = sum of the {n} items (each {lo}-{hi}), range {lo * n}-{hi * n}."
    desc = (f"{m.get('title')}. {scoring} Higher scores indicate greater {phrase} "
            f"(reverse-keyed items are reversed by the runtime). No standard severity cut-offs.")
    es = {"item_range": [lo, hi], "scores": [{"key": "total", "aggregate": agg, "items": items}]}
    spec = {"id": sid, "scorer_id": f"scr_{sid}", "name": f"{m.get('short_title') or sid.upper()} Total Scoring",
            "status": "validated", "description": desc, "engine_spec": es,
            "test_cases": [case(nm, es, v) for (nm, v) in [("floor", lo), ("mid", (lo + hi) // 2 or lo), ("ceiling", hi)]]}
    pub = m.get("publication")
    if pub and pub.get("citation") and pub.get("year"):
        spec["publication"] = {"citation": pub["citation"], "year": pub["year"]}
    (SPECS / f"{sid}.json").write_text(json.dumps(spec, indent=2) + "\n")
    print(f"  specs/{sid}.json  n={n} range={lo}-{hi} agg={agg} pub={'y' if pub else 'n'}")
