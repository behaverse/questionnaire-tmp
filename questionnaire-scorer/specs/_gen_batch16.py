import json
from pathlib import Path
import importlib.util
b=importlib.util.spec_from_file_location("b2", Path(__file__).parent/"_gen_batch2.py"); b2=importlib.util.module_from_spec(b); b.loader.exec_module(b2)
case=b2.case; SPECS=Path(__file__).parent; QDIR=SPECS.parent.parent/"questionnaire-harvester"/"output"/"questionnaires"
def blk(a,b_): return [f"pr_cc_{i}" for i in range(a,b_+1)]
m=json.loads((QDIR/"qst_cc.json").read_text())["metadata"]
es={"item_range":[0,1],"scores":[
 {"key":"activity","items":blk(1,10)},{"key":"aggression_hostility","items":blk(11,20)},
 {"key":"impulsive_sensation_seeking","items":blk(21,30)},{"key":"neuroticism_anxiety","items":blk(31,40)},
 {"key":"sociability","items":blk(41,50)}]}
desc=(m.get('title')+". Zuckerman-Kuhlman Personality Questionnaire (50-item cross-cultural). Five 10-item "
 "factor sums (each item 0/1; reverse handled), range 0-10: Activity (1-10), Aggression-Hostility (11-20), "
 "Impulsive Sensation Seeking (21-30), Neuroticism-Anxiety (31-40), Sociability (41-50).")
spec={"id":"cc","scorer_id":"scr_cc","name":f"{m.get('short_title') or 'ZKPQ'} Scoring","status":"validated","description":desc,"engine_spec":es,"test_cases":[case(n,es,v) for n,v in [("floor",0),("ceiling",1)]]}
p=m.get("publication")
if p and p.get("citation") and p.get("year"): spec["publication"]={"citation":p["citation"],"year":p["year"]}
(SPECS/"cc.json").write_text(json.dumps(spec,indent=2)+"\n"); print(" cc 5 factors")
