"""Batch 11 — multidimensional subscales with verified item membership (checked against texts).
Reverse handled upstream. Run from questionnaire-scorer/."""
import json
from pathlib import Path
import importlib.util

b2spec = importlib.util.spec_from_file_location("b2", Path(__file__).parent / "_gen_batch2.py")
b2 = importlib.util.module_from_spec(b2spec); b2spec.loader.exec_module(b2)
case = b2.case
SPECS = Path(__file__).parent
QDIR = SPECS.parent.parent / "questionnaire-harvester" / "output" / "questionnaires"
def pr(p, nums): return [f"pr_{p}_{n}" for n in nums]
def every(p, start, step, count): return [f"pr_{p}_{start + step*i}" for i in range(count)]
def band(lo, hi, s, l): return {"min": lo, "max": hi, "severity": s, "label": l}

CFG = {
 "hsq": dict(rng=[1,7], agg="sum", fills=[1,4,7], desc=(
    "Humor Styles Questionnaire (Martin et al., 2003). Four 8-item subscale sums (each item 1-7, "
    "range 8-56; reverse handled): Affiliative, Self-enhancing, Aggressive, Self-defeating."),
    scores=[{"key":"affiliative","items":every("hsq",1,4,8)}, {"key":"self_enhancing","items":every("hsq",2,4,8)},
            {"key":"aggressive","items":every("hsq",3,4,8)}, {"key":"self_defeating","items":every("hsq",4,4,8)}]),
 "saps": dict(rng=[1,7], agg="sum", fills=[1,4,7], desc=(
    "Short Almost Perfect Scale (Rice et al., 2014). Two 4-item subscale sums (each item 1-7, range "
    "4-28): Standards (items 1,3,5,7) and Discrepancy (items 2,4,6,8; higher = more maladaptive perfectionism)."),
    scores=[{"key":"standards","items":pr("saps",[1,3,5,7])}, {"key":"discrepancy","items":pr("saps",[2,4,6,8])}]),
 "ffm": dict(rng=[1,5], agg="mean", fills=[1,3,5], desc=(
    "Big-Five Personality (IPIP-50). Five domain MEAN scores (each 10 items, 1-5; reverse handled): "
    "Extraversion, Agreeableness, Conscientiousness, Neuroticism, Openness (every fifth item)."),
    scores=[{"key":"extraversion","items":every("ffm",1,5,10)}, {"key":"agreeableness","items":every("ffm",2,5,10)},
            {"key":"conscientiousness","items":every("ffm",3,5,10)}, {"key":"neuroticism","items":every("ffm",4,5,10)},
            {"key":"openness","items":every("ffm",5,5,10)}]),
 "ds14": dict(rng=[0,4], agg="sum", fills=[0,2,4], desc=(
    "Type D Personality Scale (DS14; Denollet, 2005). Two 7-item subscale sums (each 0-4, range 0-28): "
    "Negative Affectivity (items 2,4,5,7,9,12,13) and Social Inhibition (1,3,6,8,10,11,14; items 1,3 reversed). "
    "A score of 10 or more on BOTH subscales indicates a Type D personality."),
    scores=[{"key":"negative_affectivity","items":pr("ds14",[2,4,5,7,9,12,13]),
             "bands":[band(0,9,"low","Below threshold"), band(10,28,"high","Elevated (>=10)")]},
            {"key":"social_inhibition","items":pr("ds14",[1,3,6,8,10,11,14]),
             "bands":[band(0,9,"low","Below threshold"), band(10,28,"high","Elevated (>=10)")]}]),
 "soc3": dict(rng=[1,7], agg="mean", fills=[1,4,7], desc=(
    "Spheres of Control Scale (SOC-3; Paulhus, 1983). Three 10-item subscale MEAN scores (each 1-7; "
    "reverse handled): Personal control (items 1-10), Interpersonal control (11-20), Sociopolitical control (21-30)."),
    scores=[{"key":"personal","items":[f"pr_soc3_{i}" for i in range(1,11)]},
            {"key":"interpersonal","items":[f"pr_soc3_{i}" for i in range(11,21)]},
            {"key":"sociopolitical","items":[f"pr_soc3_{i}" for i in range(21,31)]}]),
}

for sid, c in CFG.items():
    m = json.loads((QDIR / f"qst_{sid}.json").read_text())["metadata"]
    for s in c["scores"]:
        s.setdefault("aggregate", c["agg"])
    es = {"item_range": c["rng"], "scores": c["scores"]}
    spec = {"id": sid, "scorer_id": f"scr_{sid}", "name": f"{m.get('short_title') or sid.upper()} Scoring",
            "status": "validated", "description": f"{m.get('title')}. {c['desc']}", "engine_spec": es,
            "test_cases": [case(n, es, v) for (n, v) in zip(("floor","mid","ceiling"), c["fills"])]}
    pub = m.get("publication")
    if pub and pub.get("citation") and pub.get("year"):
        spec["publication"] = {"citation": pub["citation"], "year": pub["year"]}
    (SPECS / f"{sid}.json").write_text(json.dumps(spec, indent=2) + "\n")
    print(f"  {sid}: {len(c['scores'])} subscales")
