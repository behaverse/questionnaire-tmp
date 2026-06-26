"""Batch 6 — clinical sum scales. Bands where the cut-off is well established; value-only where it
varies. Item counts + citations pulled from the harvested questionnaire. Reverse/per-item anchors
handled upstream. Run from questionnaire-scorer/:  python specs/_gen_batch6.py"""
import json
from pathlib import Path
import importlib.util

b2spec = importlib.util.spec_from_file_location("b2", Path(__file__).parent / "_gen_batch2.py")
b2 = importlib.util.module_from_spec(b2spec); b2spec.loader.exec_module(b2)
case = b2.case
SPECS = Path(__file__).parent
QDIR = SPECS.parent.parent / "questionnaire-harvester" / "output" / "questionnaires"

def band(lo, hi, sev, label): return {"min": lo, "max": hi, "severity": sev, "label": label}

# id -> dict(range=[lo,hi] or None, bands=[...]|None, scoring="sentence")
CFG = {
 "epds": dict(rng=[0, 3], bands=[band(0,9,"low","Low likelihood of depression"),
        band(10,12,"possible","Possible depression"), band(13,30,"probable","Probable depression")],
        scoring="Total = sum of the 10 items (each 0-3), range 0-30; 10-12 possible and 13+ probable depression."),
 "madrs": dict(rng=[0, 6], bands=[band(0,6,"normal","Symptom absent / normal"),
        band(7,19,"mild","Mild depression"), band(20,34,"moderate","Moderate depression"),
        band(35,60,"severe","Severe depression")],
        scoring="Total = sum of the 10 clinician-rated items (each 0-6), range 0-60."),
 "asrm": dict(rng=[0, 4], bands=[band(0,5,"low","Not indicative of mania"),
        band(6,20,"elevated","Possible hypomania or mania")],
        scoring="Total = sum of the 5 items (each 0-4), range 0-20; a total of 6 or more suggests hypomania/mania."),
 "gds": dict(rng=[0, 1], bands=[band(0,9,"normal","Normal"), band(10,19,"mild","Mild depression"),
        band(20,30,"severe","Severe depression")],
        scoring="Total = number of depression-consistent answers across the 30 items, range 0-30; 10+ suggests depression."),
 "kads11": dict(rng=[0, 3], bands=[band(0,5,"unlikely","Depression unlikely"),
        band(6,33,"possible","Possible depression — further assessment indicated")],
        scoring="Total = sum of the 11 items (each 0-3), range 0-33; a total of 6 or more is a positive screen."),
 "cia": dict(rng=[0, 3], bands=[band(0,15,"below","Below clinical threshold"),
        band(16,48,"clinical","Clinically significant impairment")],
        scoring="Total = sum of the 16 items (each 0-3), range 0-48; a total of 16 or more indicates clinically significant impairment."),
 "shortversionocir": dict(rng=[0, 4], bands=[band(0,20,"below_cutoff","Below clinical cut-off"),
        band(21,72,"at_or_above_cutoff","At or above clinical cut-off (probable OCD)")],
        scoring="Total = sum of the 18 items (each 0-4), range 0-72; a total of 21 or more is the recommended clinical cut-off."),
 # value-only (cut-offs vary / non-standard)
 "ymrs": dict(rng=None, bands=None,
        scoring="Total = sum of the 11 clinician-rated items (4 items weighted 0-8, the rest 0-4), range 0-60; higher = more severe manic symptoms."),
 "assq": dict(rng=[0, 2], bands=None,
        scoring="Total = sum of the 27 items (each 0-2), range 0-54; higher = more autism-spectrum traits."),
 "sast": dict(rng=[0, 1], bands=None,
        scoring="Total = number of 'yes' answers across the 45 items, range 0-45; higher = more indicators of sexual addiction."),
 "spq": dict(rng=[0, 1], bands=None,
        scoring="Total = sum of the 31 true/false items (reverse-keyed items reversed by the runtime), range 0-31; higher = greater spider fear."),
 "cudos": dict(rng=[0, 4], bands=None,
        scoring="Total = sum of the 16 items (each 0-4), range 0-64; higher = more severe depressive symptoms."),
 "pcl22": dict(rng=[0, 2], bands=None,
        scoring="Total = sum of the 22 clinician-rated items (each 0-2), range 0-44; higher = more psychopathic traits."),
}

for sid, c in CFG.items():
    d = json.loads((QDIR / f"qst_{sid}.json").read_text()); m = d["metadata"]
    n = len(d["pages"][0]["elements"])
    items = [f"pr_{sid}_{i}" for i in range(1, n + 1)]
    sd = {"key": "total", "items": items}
    if c["bands"]:
        sd["bands"] = c["bands"]
    es = {"scores": [sd]}
    if c["rng"]:
        es["item_range"] = c["rng"]
    desc = f"{m.get('title')}. {c['scoring']}"
    # test fills: floor / mid / ceiling within the option range (or 0/2/4 fallback when rng omitted)
    lo, hi = (c["rng"] if c["rng"] else [0, 4])
    spec = {"id": sid, "scorer_id": f"scr_{sid}", "name": f"{m.get('short_title') or sid.upper()} Scoring",
            "status": "validated", "description": desc, "engine_spec": es,
            "test_cases": [case(nm, es, v) for (nm, v) in [("floor", lo), ("mid", (lo + hi) // 2 or lo), ("ceiling", hi)]]}
    pub = m.get("publication")
    if pub and pub.get("citation") and pub.get("year"):
        spec["publication"] = {"citation": pub["citation"], "year": pub["year"]}
    (SPECS / f"{sid}.json").write_text(json.dumps(spec, indent=2) + "\n")
    print(f"  {sid}: n={n} rng={c['rng']} bands={'y' if c['bands'] else 'n'}")
