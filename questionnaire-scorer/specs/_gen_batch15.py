import json
from pathlib import Path
import importlib.util
b=importlib.util.spec_from_file_location("b2", Path(__file__).parent/"_gen_batch2.py"); b2=importlib.util.module_from_spec(b); b.loader.exec_module(b2)
case=b2.case; SPECS=Path(__file__).parent; QDIR=SPECS.parent.parent/"questionnaire-harvester"/"output"/"questionnaires"
def pr(p,nums): return [f"pr_{p}_{n}" for n in nums]
CFG={
 "bsas": dict(rng=[1,5], desc=("Brief Sexual Attitudes Scale (Hendrick et al., 2006). Four subscale MEAN scores (1-5): Permissiveness (items 1-10), Birth Control (11-13), Communion (14-18), Instrumentality (19-23). Higher = stronger endorsement; no cut-offs."),
   scores=[{"key":"permissiveness","items":[f"pr_bsas_{i}" for i in range(1,11)]},{"key":"birth_control","items":pr("bsas",[11,12,13])},{"key":"communion","items":pr("bsas",[14,15,16,17,18])},{"key":"instrumentality","items":pr("bsas",[19,20,21,22,23])}]),
 "dmqr": dict(rng=[1,5], desc=("Drinking Motives Questionnaire-Revised (Cooper, 1994). Four 5-item subscale MEAN scores (1-5): Social (items 3,5,11,14,16), Coping (1,4,6,15,17), Enhancement (7,9,10,13,18), Conformity (2,8,12,19,20)."),
   scores=[{"key":"social","items":pr("dmqr",[3,5,11,14,16])},{"key":"coping","items":pr("dmqr",[1,4,6,15,17])},{"key":"enhancement","items":pr("dmqr",[7,9,10,13,18])},{"key":"conformity","items":pr("dmqr",[2,8,12,19,20])}]),
 "sf": dict(rng=[1,5], desc=("Love Attitudes Scale-Short Form (Hendrick et al., 1998). Six 4-item love-style MEAN scores (1-5): Eros (1,2,3,19), Ludus (4,5,6,20), Storge (7,8,9,21), Pragma (10,11,12,22), Mania (13,14,15,23), Agape (16,17,18,24)."),
   scores=[{"key":"eros","items":pr("sf",[1,2,3,19])},{"key":"ludus","items":pr("sf",[4,5,6,20])},{"key":"storge","items":pr("sf",[7,8,9,21])},{"key":"pragma","items":pr("sf",[10,11,12,22])},{"key":"mania","items":pr("sf",[13,14,15,23])},{"key":"agape","items":pr("sf",[16,17,18,24])}]),
}
for sid,c in CFG.items():
    m=json.loads((QDIR/f"qst_{sid}.json").read_text())["metadata"]
    for s in c["scores"]: s["aggregate"]="mean"
    es={"item_range":c["rng"],"scores":c["scores"]}
    spec={"id":sid,"scorer_id":f"scr_{sid}","name":f"{m.get('short_title') or sid.upper()} Scoring","status":"validated","description":f"{m.get('title')}. {c['desc']}","engine_spec":es,"test_cases":[case(n,es,v) for n,v in zip(('floor','mid','ceiling'),[1,3,5])]}
    p=m.get("publication")
    if p and p.get("citation") and p.get("year"): spec["publication"]={"citation":p["citation"],"year":p["year"]}
    (SPECS/f"{sid}.json").write_text(json.dumps(spec,indent=2)+"\n"); print(" ",sid,len(c["scores"]))
