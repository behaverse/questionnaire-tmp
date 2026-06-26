"""Batch 9 — value-only TOTAL scorers for the summable symptom/frequency long-tail.
Auto-detects item_range (omits it when item weights are mixed). Run from questionnaire-scorer/."""
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
 "adolescents": "aggressive behaviour", "brcs": "adaptive (resilient) coping",
 "cas": "clinical anger", "cudq": "caffeine use disorder symptoms",
 "gas": "addictive gaming behaviour", "gsqs": "poor sleep quality",
 "mhcsf": "positive mental health (emotional, social and psychological well-being)",
 "nfs": "nurturant fathering", "piu": "pathological internet use",
 "pmi": "positive mental well-being", "pnsmd": "relationship satisfaction",
 "shutd": "shutdown dissociation", "smd": "disordered social-media use",
 "trsi24": "trauma-related shame", "binge": "binge-eating severity",
 "hai18": "health anxiety", "sbs": "belief in the supernatural",
 "raads14": "autistic traits",
}

for sid, phrase in BATCH.items():
    d = json.loads((QDIR / f"qst_{sid}.json").read_text()); m = d["metadata"]
    els = d["pages"][0]["elements"]; n = len(els)
    ranges = set()
    for e in els:
        oref = (e.get("option") or {}).get("ref", "").split("@")[0]
        vs = [x.get("value") for x in json.loads((ODIR / f"{oref}.json").read_text()).get("options", [])]
        if vs:
            ranges.add((int(min(vs)), int(max(vs))))
    items = [f"pr_{sid}_{i}" for i in range(1, n + 1)]
    es = {"scores": [{"key": "total", "items": items}]}
    if len(ranges) == 1:
        lo, hi = next(iter(ranges)); es["item_range"] = [lo, hi]
        rngtxt = f"each {lo}-{hi}, range {lo*n}-{hi*n}"
        fills = [("floor", lo), ("mid", (lo+hi)//2 or lo), ("ceiling", hi)]
    else:
        lo = min(r[0] for r in ranges); hi = max(r[1] for r in ranges)
        rngtxt = "items carry per-item weights"
        fills = [("floor", lo), ("mid", 1), ("ceiling", min(hi, 2))]
    desc = (f"{m.get('title')}. Total = sum of the {n} items ({rngtxt}); higher = greater {phrase} "
            f"(reverse-keyed items reversed by the runtime). No standard cut-offs.")
    spec = {"id": sid, "scorer_id": f"scr_{sid}", "name": f"{m.get('short_title') or sid.upper()} Total Scoring",
            "status": "validated", "description": desc, "engine_spec": es,
            "test_cases": [case(nm, es, v) for (nm, v) in fills]}
    pub = m.get("publication")
    if pub and pub.get("citation") and pub.get("year"):
        spec["publication"] = {"citation": pub["citation"], "year": pub["year"]}
    (SPECS / f"{sid}.json").write_text(json.dumps(spec, indent=2) + "\n")
    print(f"  {sid}: n={n} ranges={sorted(ranges)}")
