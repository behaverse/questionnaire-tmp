import json
from pathlib import Path
import importlib.util
b=importlib.util.spec_from_file_location("b2", Path(__file__).parent/"_gen_batch2.py"); b2=importlib.util.module_from_spec(b); b.loader.exec_module(b2)
case=b2.case; SPECS=Path(__file__).parent; QDIR=SPECS.parent.parent/"questionnaire-harvester"/"output"/"questionnaires"
def pr(p,nums): return [f"pr_{p}_{n}" for n in nums]
CFG={
 "saam": dict(rng=[1,7], agg="mean", fills=[1,4,7], desc=("State Adult Attachment Measure (Gillath et al., 2009). Three 7-item subscale MEAN scores (each 1-7): Security (4,6,7,11,13,18,20), Avoidance (2,3,9,10,15,16,21), Anxiety (1,5,8,12,14,17,19). State measure; no cut-offs."),
   scores=[{"key":"security","items":pr("saam",[4,6,7,11,13,18,20])},{"key":"avoidance","items":pr("saam",[2,3,9,10,15,16,21])},{"key":"anxiety","items":pr("saam",[1,5,8,12,14,17,19])}]),
 "rei": dict(rng=[1,5], agg="mean", fills=[1,3,5], desc=("Rational-Experiential Inventory-40 (Pacini & Epstein, 1999). Two 20-item MEAN scores (each 1-5; reverse handled): Rationality (items 1-20) and Experientiality (items 21-40)."),
   scores=[{"key":"rationality","items":[f"pr_rei_{i}" for i in range(1,21)]},{"key":"experientiality","items":[f"pr_rei_{i}" for i in range(21,41)]}]),
}
for sid,c in CFG.items():
    m=json.loads((QDIR/f"qst_{sid}.json").read_text())["metadata"]
    for s in c["scores"]: s["aggregate"]=c["agg"]
    es={"item_range":c["rng"],"scores":c["scores"]}
    spec={"id":sid,"scorer_id":f"scr_{sid}","name":f"{m.get('short_title') or sid.upper()} Scoring","status":"validated","description":f"{m.get('title')}. {c['desc']}","engine_spec":es,"test_cases":[case(n,es,v) for n,v in zip(('floor','mid','ceiling'),c['fills'])]}
    p=m.get("publication")
    if p and p.get("citation") and p.get("year"): spec["publication"]={"citation":p["citation"],"year":p["year"]}
    (SPECS/f"{sid}.json").write_text(json.dumps(spec,indent=2)+"\n"); print(" ",sid,len(c["scores"]),"subscales")
