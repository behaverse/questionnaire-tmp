import json
from pathlib import Path
import importlib.util
b=importlib.util.spec_from_file_location("b2", Path(__file__).parent/"_gen_batch2.py"); b2=importlib.util.module_from_spec(b); b.loader.exec_module(b2)
case=b2.case; QDIR=Path(__file__).parent.parent.parent/"questionnaire-harvester"/"output"/"questionnaires"
# id: (item_range, n, aggregate, construct)
CFG={
 "fsq": ([1,7],18,"sum","fear of spiders"),
 "secs":([0,100],12,"mean","political conservatism (0-100 thermometer ratings)"),
 "rps": ([1,9],7,"mean","risk-taking propensity"),
 "shs": ([1,7],4,"mean","subjective happiness"),
}
for sid,(rng,n,agg,phrase) in CFG.items():
    m=json.loads((QDIR/f"qst_{sid}.json").read_text())["metadata"]
    es={"item_range":rng,"scores":[{"key":"total","aggregate":agg,"items":[f"pr_{sid}_{i}" for i in range(1,n+1)]}]}
    word="Mean" if agg=="mean" else "Total"
    desc=f"{m.get('title')}. {word} of the {n} items (each {rng[0]}-{rng[1]}; reverse-keyed items reversed by the runtime); higher = greater {phrase}. No standard cut-offs."
    lo,hi=rng
    spec={"id":sid,"scorer_id":f"scr_{sid}","name":f"{m.get('short_title') or sid.upper()} Scoring","status":"validated","description":desc,"engine_spec":es,
          "test_cases":[case(nm,es,v) for nm,v in [("floor",lo),("mid",(lo+hi)//2),("ceiling",hi)]]}
    p=m.get("publication")
    if p and p.get("citation") and p.get("year"): spec["publication"]={"citation":p["citation"],"year":p["year"]}
    Path(__file__).parent.joinpath(f"{sid}.json").write_text(json.dumps(spec,indent=2)+"\n"); print(" ",sid)
