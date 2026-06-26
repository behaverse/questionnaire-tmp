"""Batch 7 — multidimensional scales with verified subscales (item order checked against texts).
Reverse handled upstream. Run from questionnaire-scorer/:  python specs/_gen_batch7.py"""
import json
from pathlib import Path
import importlib.util

b2spec = importlib.util.spec_from_file_location("b2", Path(__file__).parent / "_gen_batch2.py")
b2 = importlib.util.module_from_spec(b2spec); b2spec.loader.exec_module(b2)
case = b2.case
SPECS = Path(__file__).parent
QDIR = SPECS.parent.parent / "questionnaire-harvester" / "output" / "questionnaires"
def pr(p, nums): return [f"pr_{p}_{n}" for n in nums]
def band(lo, hi, s, l): return {"min": lo, "max": hi, "severity": s, "label": l}

DEP = [band(0,9,"normal","Normal"), band(10,13,"mild","Mild"), band(14,20,"moderate","Moderate"),
       band(21,27,"severe","Severe"), band(28,42,"extremely_severe","Extremely severe")]
ANX = [band(0,7,"normal","Normal"), band(8,9,"mild","Mild"), band(10,14,"moderate","Moderate"),
       band(15,19,"severe","Severe"), band(20,42,"extremely_severe","Extremely severe")]
STR = [band(0,14,"normal","Normal"), band(15,18,"mild","Mild"), band(19,25,"moderate","Moderate"),
       band(26,33,"severe","Severe"), band(34,42,"extremely_severe","Extremely severe")]

CFG = {
 "tipi": dict(rng=[1, 7], fills=[1, 4, 7], desc=(
    "Ten-Item Personality Inventory (Gosling et al., 2003). Five Big-Five domain scores, each the "
    "MEAN of 2 items (1-7; the reverse-keyed item of each pair reversed by the runtime): "
    "Extraversion (1,6), Agreeableness (2,7), Conscientiousness (3,8), Emotional Stability (4,9), "
    "Openness (5,10). No severity cut-offs."),
    scores=[{"key": "extraversion", "aggregate": "mean", "items": pr("tipi", [1, 6])},
            {"key": "agreeableness", "aggregate": "mean", "items": pr("tipi", [2, 7])},
            {"key": "conscientiousness", "aggregate": "mean", "items": pr("tipi", [3, 8])},
            {"key": "emotional_stability", "aggregate": "mean", "items": pr("tipi", [4, 9])},
            {"key": "openness", "aggregate": "mean", "items": pr("tipi", [5, 10])}]),
 "dass": dict(rng=[0, 3], fills=[0, 2, 3], desc=(
    "Depression Anxiety Stress Scales-42 (Lovibond & Lovibond, 1995). Three 14-item subscale sums "
    "(each item 0-3, range 0-42): Depression, Anxiety, Stress. Severity bands follow the DASS manual."),
    scores=[{"key": "depression", "items": pr("dass", [3,5,10,13,16,17,21,24,26,31,34,37,38,42]), "bands": DEP},
            {"key": "anxiety", "items": pr("dass", [2,4,7,9,15,19,20,23,25,28,30,36,40,41]), "bands": ANX},
            {"key": "stress", "items": pr("dass", [1,6,8,11,12,14,18,22,27,29,32,33,35,39]), "bands": STR}]),
 "sd3": dict(rng=[1, 5], fills=[1, 3, 5], desc=(
    "Short Dark Triad (Jones & Paulhus, 2014). Three subscale MEAN scores (each 9 items, 1-5; "
    "reverse-keyed items reversed by the runtime): Machiavellianism (items 1-9), Narcissism (10-18), "
    "Psychopathy (19-27). Higher = stronger trait; no severity cut-offs."),
    scores=[{"key": "machiavellianism", "aggregate": "mean", "items": pr("sd3", range(1, 10))},
            {"key": "narcissism", "aggregate": "mean", "items": pr("sd3", range(10, 19))},
            {"key": "psychopathy", "aggregate": "mean", "items": pr("sd3", range(19, 28))}]),
}

for sid, c in CFG.items():
    m = json.loads((QDIR / f"qst_{sid}.json").read_text())["metadata"]
    es = {"item_range": c["rng"], "scores": c["scores"]}
    spec = {"id": sid, "scorer_id": f"scr_{sid}", "name": f"{m.get('short_title') or sid.upper()} Scoring",
            "status": "validated", "description": f"{m.get('title')}. {c['desc']}", "engine_spec": es,
            "test_cases": [case(n, es, v) for (n, v) in zip(("floor", "mid", "ceiling"), c["fills"])]}
    pub = m.get("publication")
    if pub and pub.get("citation") and pub.get("year"):
        spec["publication"] = {"citation": pub["citation"], "year": pub["year"]}
    (SPECS / f"{sid}.json").write_text(json.dumps(spec, indent=2) + "\n")
    print(f"  {sid}: {len(c['scores'])} subscales")
