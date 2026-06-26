import json
from pathlib import Path
import importlib.util
b=importlib.util.spec_from_file_location("b2", Path(__file__).parent/"_gen_batch2.py"); b2=importlib.util.module_from_spec(b); b.loader.exec_module(b2)
case=b2.case; SPECS=Path(__file__).parent; QDIR=SPECS.parent.parent/"questionnaire-harvester"/"output"/"questionnaires"
def band(lo,hi,s,l): return {"min":lo,"max":hi,"severity":s,"label":l}
def items(sid,a,b): return [f"pr_{sid}_{i}" for i in range(a,b+1)]
CFG={
 "ehi": dict(es={"item_range":[-100,100],"scores":[{"key":"laterality","aggregate":"mean","items":items("ehi",1,4),
        "bands":[band(-100,-41,"left","Left-handed"),band(-40,40,"mixed","Mixed / ambidextrous"),band(41,100,"right","Right-handed")]}]},
        desc="Edinburgh Handedness Inventory (short form). Laterality quotient = MEAN of the 4 items (each -100 left to +100 right), range -100 to +100; >+40 right-handed, <-40 left-handed, between = mixed.",
        fills=[("left",-100),("mixed",0),("right",100)]),
 "rotter": dict(es={"item_range":[0,1],"scores":[{"key":"external","items":items("rotter",1,15)}]},
        desc="Rotter Internal-External Locus of Control (short form). External score = number of external-control choices across the 15 forced-choice items, range 0-15; higher = a more external locus of control.",
        fills=[("internal",0),("external",1)]),
 "lsas": dict(es={"item_range":[0,3],"scores":[{"key":"total","items":items("lsas",1,48),
        "bands":[band(0,29,"below","Below threshold"),band(30,49,"moderate","Moderate social anxiety"),
                 band(50,64,"marked","Marked social anxiety"),band(65,94,"severe","Severe social anxiety"),
                 band(95,144,"very_severe","Very severe social anxiety")]}]},
        desc="Liebowitz Social Anxiety Scale. Total = sum of all 48 ratings (24 situations x fear + avoidance, each 0-3), range 0-144; 30+ suggests social anxiety disorder, with higher bands indicating greater severity.",
        fills=[("floor",0),("mid",1),("ceiling",3)]),
 "eat26": dict(es={"item_range":[0,3],"scores":[{"key":"total","items":items("eat26",1,26),
        "bands":[band(0,19,"below","Below clinical cut-off"),band(20,78,"at_or_above","At or above cut-off — refer for eating-disorder assessment")]}]},
        desc="Eating Attitudes Test-26 (Garner et al., 1982). Total = sum of the 26 attitude items (each scored 0-3; the 6 behavioural items are not part of this score), range 0-78; a total of 20 or more is a positive screen.",
        fills=[("floor",0),("mid",1),("ceiling",3)]),
 "sqs": dict(es={"item_range":[1,11],"scores":[{"key":"quality","items":["pr_sqs_1"]}]},
        desc="Single-Item Sleep Quality Scale. Score = the single 0-10 (here 1-11) rating of overall sleep quality; higher = better sleep quality.",
        fills=[("floor",1),("mid",6),("ceiling",11)]),
}
for sid,c in CFG.items():
    m=json.loads((QDIR/f"qst_{sid}.json").read_text())["metadata"]
    spec={"id":sid,"scorer_id":f"scr_{sid}","name":f"{m.get('short_title') or sid.upper()} Scoring","status":"validated","description":f"{m.get('title')}. {c['desc']}","engine_spec":c["es"],"test_cases":[case(n,c["es"],v) for n,v in c["fills"]]}
    p=m.get("publication")
    if p and p.get("citation") and p.get("year"): spec["publication"]={"citation":p["citation"],"year":p["year"]}
    (SPECS/f"{sid}.json").write_text(json.dumps(spec,indent=2)+"\n"); print(" ",sid)
