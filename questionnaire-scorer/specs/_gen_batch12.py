"""Batch 12 — pre-encoded binary/subset scorers. AQ/AQ-10/SQ are stored as their scored 0/1(/2)
values (not raw Likert), so summing is correct; LOT-R sums only its 6 scored items (fillers 2,5,6,8
excluded); MEQ-30 has a standard total. Run from questionnaire-scorer/."""
import json
from pathlib import Path
import importlib.util

b2spec = importlib.util.spec_from_file_location("b2", Path(__file__).parent / "_gen_batch2.py")
b2 = importlib.util.module_from_spec(b2spec); b2spec.loader.exec_module(b2)
case = b2.case
SPECS = Path(__file__).parent
QDIR = SPECS.parent.parent / "questionnaire-harvester" / "output" / "questionnaires"
def band(lo, hi, s, l): return {"min": lo, "max": hi, "severity": s, "label": l}
def allitems(sid): return [f"pr_{sid}_{i}" for i in range(1, len(json.loads((QDIR / f'qst_{sid}.json').read_text())['pages'][0]['elements'])+1)]

CFG = {
 "aq": dict(es={"item_range":[0,1], "scores":[{"key":"total","items":allitems("aq"),
              "bands":[band(0,31,"below_threshold","Below clinical threshold"),
                       band(32,50,"at_or_above_threshold","At or above clinical threshold")]}]},
           desc="Autism-Spectrum Quotient (Baron-Cohen et al., 2001). Total = number of autism-consistent "
                "answers across the 50 items (scored 0/1), range 0-50; a score of 32 or more is the clinical threshold.",
           fills=[("floor",0),("ceiling",1)]),
 "quotient": dict(es={"item_range":[0,1], "scores":[{"key":"total","items":allitems("quotient"),
              "bands":[band(0,5,"below","Below referral threshold"), band(6,10,"refer","Consider referral for assessment")]}]},
           desc="Autism-Spectrum Quotient - 10 items (AQ-10; Allison et al., 2012). Total = number of "
                "autism-consistent answers (scored 0/1), range 0-10; a score of 6 or more warrants referral for full assessment.",
           fills=[("floor",0),("ceiling",1)]),
 "arc": dict(es={"item_range":[0,2], "scores":[{"key":"total","items":allitems("arc")}]},
           desc="Systemizing Quotient (Baron-Cohen et al., 2003). Total = sum of the 75 items (scored 0/1/2), "
                "range 0-150; higher = stronger drive to analyse and construct rule-based systems. No standard cut-off.",
           fills=[("floor",0),("mid",1),("ceiling",2)]),
 "lotr": dict(es={"item_range":[0,4], "scores":[{"key":"optimism","items":[f"pr_lotr_{i}" for i in [1,3,4,7,9,10]]}]},
           desc="Life Orientation Test-Revised (Scheier et al., 1994). Optimism = sum of the 6 scored items "
                "(1,3,4,7,9,10; items 4 fillers 2,5,6,8 excluded; reverse handled), range 0-24; higher = more dispositional optimism.",
           fills=[("floor",0),("mid",2),("ceiling",4)]),
 "meq30": dict(es={"item_range":[0,5], "scores":[{"key":"total","items":allitems("meq30")}]},
           desc="Revised Mystical Experience Questionnaire (MEQ-30; Barrett et al., 2015). Total = sum of the "
                "30 items (each 0-5), range 0-150; higher = more complete mystical experience. No severity cut-offs.",
           fills=[("floor",0),("mid",2),("ceiling",5)]),
}

for sid, c in CFG.items():
    m = json.loads((QDIR / f"qst_{sid}.json").read_text())["metadata"]
    spec = {"id": sid, "scorer_id": f"scr_{sid}", "name": f"{m.get('short_title') or sid.upper()} Scoring",
            "status": "validated", "description": f"{m.get('title')}. {c['desc']}", "engine_spec": c["es"],
            "test_cases": [case(n, c["es"], v) for (n, v) in c["fills"]]}
    pub = m.get("publication")
    if pub and pub.get("citation") and pub.get("year"):
        spec["publication"] = {"citation": pub["citation"], "year": pub["year"]}
    (SPECS / f"{sid}.json").write_text(json.dumps(spec, indent=2) + "\n")
    print(f"  {sid}")
