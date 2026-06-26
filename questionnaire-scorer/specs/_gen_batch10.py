"""Batch 10 — verified summable: value totals (tmas/teq/masi), gated subset (pcptsd5),
Zung index x1.25 + bands (sds/sas, reverse pre-baked in option values). Run from questionnaire-scorer/."""
import json
from pathlib import Path
import importlib.util

b2spec = importlib.util.spec_from_file_location("b2", Path(__file__).parent / "_gen_batch2.py")
b2 = importlib.util.module_from_spec(b2spec); b2spec.loader.exec_module(b2)
case = b2.case
SPECS = Path(__file__).parent
QDIR = SPECS.parent.parent / "questionnaire-harvester" / "output" / "questionnaires"
def band(lo, hi, s, l): return {"min": lo, "max": hi, "severity": s, "label": l}

def n_items(sid):
    return len(json.loads((QDIR / f"qst_{sid}.json").read_text())["pages"][0]["elements"])

def pub_of(sid):
    p = json.loads((QDIR / f"qst_{sid}.json").read_text())["metadata"].get("publication")
    return {"citation": p["citation"], "year": p["year"]} if p and p.get("citation") and p.get("year") else None

SDS_BANDS = [band(25,49,"normal","Normal range"), band(50,59,"mild","Mild depression"),
             band(60,69,"moderate","Moderate to marked depression"), band(70,100,"severe","Severe to extreme depression")]
SAS_BANDS = [band(25,44,"normal","Normal range"), band(45,59,"mild_moderate","Mild to moderate anxiety"),
             band(60,74,"marked_severe","Marked to severe anxiety"), band(75,100,"extreme","Extreme anxiety")]

SPECS_DEF = {
 "tmas": dict(es={"item_range": [0,1], "scores": [{"key": "total", "items": [f"pr_tmas_{i}" for i in range(1, n_items('tmas')+1)]}]},
              desc=f"Taylor Manifest Anxiety Scale. Total = sum of the {n_items('tmas')} true/false items (reverse-keyed items handled), range 0-{n_items('tmas')}; higher = more manifest anxiety. No standard cut-offs.",
              fills=[("floor",0),("mid",1),("ceiling",1)]),
 "teq": dict(es={"item_range": [0,4], "scores": [{"key": "total", "items": [f"pr_teq_{i}" for i in range(1, n_items('teq')+1)]}]},
             desc=f"Toronto Empathy Questionnaire. Total = sum of the {n_items('teq')} items (each 0-4; reverse handled), range 0-{n_items('teq')*4}; higher = greater empathy. No standard cut-offs.",
             fills=[("floor",0),("mid",2),("ceiling",4)]),
 "masi": dict(es={"item_range": [1,5], "scores": [{"key": "total", "items": [f"pr_masi_{i}" for i in range(1, n_items('masi')+1)]}]},
              desc=f"Measure of Anxiety in Selection Interviews. Total = sum of the {n_items('masi')} items (each 1-5; reverse handled), range {n_items('masi')}-{n_items('masi')*5}; higher = greater interview anxiety. No standard cut-offs.",
              fills=[("floor",1),("mid",3),("ceiling",5)]),
 "pcptsd5": dict(es={"item_range": [0,1], "scores": [{"key": "total", "items": [f"pr_pcptsd5_{i}" for i in range(2, 7)],
                  "bands": [band(0,2,"negative","Negative screen"), band(3,5,"positive","Positive screen — probable PTSD")]}]},
                 desc="Primary Care PTSD Screen for DSM-5 (PC-PTSD-5). Score = number of 'yes' answers across the 5 symptom items (item 1 is the trauma-exposure gate and is not scored), range 0-5; a score of 3 or more is a positive screen.",
                 fills=[("floor",0),("ceiling",1)]),
 "sds": dict(es={"item_range": [1,4], "scores": [{"key": "index", "items": [f"pr_sds_{i}" for i in range(1, 21)],
                  "transform": {"mul": 1.25}, "bands": SDS_BANDS}]},
             desc="Zung Self-Rating Depression Scale. Raw = sum of the 20 items (each 1-4; reverse items pre-scored), range 20-80; the SDS index = raw x 1.25 (range 25-100). Bands: <50 normal, 50-59 mild, 60-69 moderate, 70+ severe.",
             fills=[("floor",1),("mid",2),("ceiling",4)]),
 "sas": dict(es={"item_range": [1,4], "scores": [{"key": "index", "items": [f"pr_sas_{i}" for i in range(1, 21)],
                  "transform": {"mul": 1.25}, "bands": SAS_BANDS}]},
             desc="Zung Self-Rating Anxiety Scale. Raw = sum of the 20 items (each 1-4; reverse items pre-scored), range 20-80; the SAS index = raw x 1.25 (range 25-100). Bands: <45 normal, 45-59 mild-moderate, 60-74 marked-severe, 75+ extreme.",
             fills=[("floor",1),("mid",2),("ceiling",4)]),
}

for sid, c in SPECS_DEF.items():
    spec = {"id": sid, "scorer_id": f"scr_{sid}",
            "name": f"{json.loads((QDIR / f'qst_{sid}.json').read_text())['metadata'].get('short_title') or sid.upper()} Scoring",
            "status": "validated", "description": c["desc"], "engine_spec": c["es"],
            "test_cases": [case(nm, c["es"], v) for (nm, v) in c["fills"]]}
    pub = pub_of(sid)
    if pub:
        spec["publication"] = pub
    (SPECS / f"{sid}.json").write_text(json.dumps(spec, indent=2) + "\n")
    print(f"  {sid}")
