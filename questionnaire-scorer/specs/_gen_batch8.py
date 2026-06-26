"""Batch 8 — value-only composite TOTAL scorers for scales with a standard overall total (item
count/range/citation pulled from the harvested questionnaire). Reverse handled upstream.
Run from questionnaire-scorer/:  python specs/_gen_batch8.py"""
import json
from pathlib import Path
import importlib.util

b2spec = importlib.util.spec_from_file_location("b2", Path(__file__).parent / "_gen_batch2.py")
b2 = importlib.util.module_from_spec(b2spec); b2spec.loader.exec_module(b2)
case = b2.case
SPECS = Path(__file__).parent
QDIR = SPECS.parent.parent / "questionnaire-harvester" / "output" / "questionnaires"
ODIR = SPECS.parent.parent / "questionnaire-harvester" / "output" / "options"

BATCH = {
 "besc": "belonging, engagement and self-confidence in higher education",
 "shvq": "endorsement of hypermasculine values",
 "piuq": "problematic internet use",
 "pios": "religious scrupulosity",
 "aiss": "sensation seeking",
 "nmpq": "nomophobia (anxiety about being without one's smartphone)",
 "sses": "current (state) self-esteem",
 "scsr": "dispositional self-consciousness",
 "tsis": "social intelligence",
 "hvq": "endorsement of hypermasculine values",
 "lsrp": "self-reported psychopathic traits",
 "ccms": "conscientiousness",
 "bpaq": "trait aggression",
 "bis": "impulsiveness",
 "gpts": "paranoid ideation",
 "intelligence": "trait emotional intelligence",
 "bes": "body esteem",
 "cabs": "involvement in bullying",
 "olife": "schizotypal traits",
}

for sid, phrase in BATCH.items():
    d = json.loads((QDIR / f"qst_{sid}.json").read_text()); m = d["metadata"]
    els = d["pages"][0]["elements"]; n = len(els)
    oref = (els[0].get("option") or {}).get("ref", "").split("@")[0]
    vals = [x.get("value") for x in json.loads((ODIR / f"{oref}.json").read_text()).get("options", [])]
    lo, hi = int(min(vals)), int(max(vals))
    items = [f"pr_{sid}_{i}" for i in range(1, n + 1)]
    es = {"item_range": [lo, hi], "scores": [{"key": "total", "items": items}]}
    desc = (f"{m.get('title')}. Total = sum of the {n} items (each {lo}-{hi}), range {lo*n}-{hi*n}; "
            f"higher = greater {phrase} (reverse-keyed items reversed by the runtime). No standard cut-offs.")
    spec = {"id": sid, "scorer_id": f"scr_{sid}", "name": f"{m.get('short_title') or sid.upper()} Total Scoring",
            "status": "validated", "description": desc, "engine_spec": es,
            "test_cases": [case(nm, es, v) for (nm, v) in [("floor", lo), ("mid", (lo + hi)//2 or lo), ("ceiling", hi)]]}
    pub = m.get("publication")
    if pub and pub.get("citation") and pub.get("year"):
        spec["publication"] = {"citation": pub["citation"], "year": pub["year"]}
    (SPECS / f"{sid}.json").write_text(json.dumps(spec, indent=2) + "\n")
    print(f"  {sid}: n={n} range={lo}-{hi}")
