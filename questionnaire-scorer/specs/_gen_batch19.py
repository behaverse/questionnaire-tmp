import json
from pathlib import Path
import importlib.util
b=importlib.util.spec_from_file_location("b2", Path(__file__).parent/"_gen_batch2.py"); b2=importlib.util.module_from_spec(b); b.loader.exec_module(b2)
case=b2.case; QDIR=Path(__file__).parent.parent.parent/"questionnaire-harvester"/"output"/"questionnaires"
def band(lo,hi,s,l): return {"min":lo,"max":hi,"severity":s,"label":l}
def n(sid): return len(json.loads((QDIR/f"qst_{sid}.json").read_text())["pages"][0]["elements"])
CFG={
 "qchat": dict(es={"item_range":[0,4],"scores":[{"key":"total","items":[f"pr_qchat_{i}" for i in range(1,n('qchat')+1)]}]},
   desc=f"Quantitative Checklist for Autism in Toddlers (Q-CHAT-25). Total = sum of the 25 items (each pre-scored 0-4; reverse-keyed responses encoded in the options), range 0-100; higher = more autism-spectrum traits.",
   fills=[("floor",0),("mid",2),("ceiling",4)]),
 "cast": dict(es={"item_range":[0,1],"scores":[{"key":"total","items":[f"pr_cast_{i}" for i in range(1,n('cast')+1)],
     "bands":[band(0,14,"below","Below cut-off"),band(15,39,"at_or_above","At or above cut-off — refer for autism assessment")]}]},
   desc=f"Childhood Autism Spectrum Test (CAST). Total = number of autism-consistent answers across the key items (each scored 0/1, with scoring direction encoded per item; non-key control items score 0), range 0-31; a score of 15 or more warrants referral.",
   fills=[("floor",0),("ceiling",1)]),
 "itc": dict(es={"scores":[{"key":"total","items":[f"pr_itc_{i}" for i in range(1,n('itc')+1)]}]},
   desc=f"Infant-Toddler Checklist (ITC). Total Concern = sum of the 24 items (per-item scales 0-2 to 0-4), higher = greater concern about early social-communication development; interpret against age norms.",
   fills=[("floor",0),("mid",1),("ceiling",2)]),
}
for sid,c in CFG.items():
    m=json.loads((QDIR/f"qst_{sid}.json").read_text())["metadata"]
    spec={"id":sid,"scorer_id":f"scr_{sid}","name":f"{m.get('short_title') or sid.upper()} Scoring","status":"validated","description":f"{m.get('title')}. {c['desc']}","engine_spec":c["es"],"test_cases":[case(nm,c["es"],v) for nm,v in c["fills"]]}
    p=m.get("publication")
    if p and p.get("citation") and p.get("year"): spec["publication"]={"citation":p["citation"],"year":p["year"]}
    Path(__file__).parent.joinpath(f"{sid}.json").write_text(json.dumps(spec,indent=2)+"\n"); print(" ",sid)
