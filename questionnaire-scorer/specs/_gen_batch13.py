"""Batch 13 — pswq (two-option reverse pre-baked), bfis (Big-Five blocks of 3), desii (mean x10).
Run from questionnaire-scorer/."""
import json
from pathlib import Path
import importlib.util

b2spec = importlib.util.spec_from_file_location("b2", Path(__file__).parent / "_gen_batch2.py")
b2 = importlib.util.module_from_spec(b2spec); b2spec.loader.exec_module(b2)
case = b2.case
SPECS = Path(__file__).parent
QDIR = SPECS.parent.parent / "questionnaire-harvester" / "output" / "questionnaires"
def band(lo, hi, s, l): return {"min": lo, "max": hi, "severity": s, "label": l}

CFG = {
 "pswq": dict(es={"item_range":[1,5], "scores":[{"key":"total","items":[f"pr_pswq_{i}" for i in range(1,17)],
              "bands":[band(16,39,"low","Low worry"), band(40,59,"moderate","Moderate worry"),
                       band(60,80,"high","High worry")]}]},
           desc="Penn State Worry Questionnaire (Meyer et al., 1990). Total = sum of the 16 items (each 1-5; "
                "reverse items pre-scored), range 16-80; higher = more pathological worry (60+ is typical of GAD).",
           fills=[("floor",1),("mid",3),("ceiling",5)]),
 "bfis": dict(es={"item_range":[1,7], "scores":[
              {"key":"neuroticism","aggregate":"mean","items":[f"pr_bfis_{i}" for i in [1,2,3]]},
              {"key":"extraversion","aggregate":"mean","items":[f"pr_bfis_{i}" for i in [4,5,6]]},
              {"key":"openness","aggregate":"mean","items":[f"pr_bfis_{i}" for i in [7,8,9]]},
              {"key":"agreeableness","aggregate":"mean","items":[f"pr_bfis_{i}" for i in [10,11,12]]},
              {"key":"conscientiousness","aggregate":"mean","items":[f"pr_bfis_{i}" for i in [13,14,15]]}]},
           desc="Big Five Inventory-Short (BFI-S, 15 items). Five domain MEAN scores (each 3 items, 1-7; "
                "reverse handled): Neuroticism (1-3), Extraversion (4-6), Openness (7-9), Agreeableness (10-12), "
                "Conscientiousness (13-15).",
           fills=[("floor",1),("mid",4),("ceiling",7)]),
 "desii": dict(es={"item_range":[0,10], "scores":[{"key":"dissociation","aggregate":"mean",
              "items":[f"pr_desii_{i}" for i in range(1,29)], "transform":{"mul":10},
              "bands":[band(0,29,"below_taxon","Below the dissociative-taxon cut-off"),
                       band(30,100,"elevated","Elevated — screen for a dissociative disorder")]}]},
           desc="Dissociative Experiences Scale-II (Carlson & Putnam, 1993). Score = MEAN of the 28 items "
                "(each 0-10, i.e. 0-100% in 10s) x10, range 0-100; a mean of 30 or more warrants screening "
                "for a dissociative disorder.",
           fills=[("floor",0),("mid",3),("ceiling",10)]),
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
