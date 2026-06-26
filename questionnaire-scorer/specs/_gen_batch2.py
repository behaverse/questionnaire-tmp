"""Generate batch-2 scorer specs with auto-computed test vectors (so expected == engine output).
Run from questionnaire-scorer/:  python specs/_gen_batch2.py"""
import json
from pathlib import Path

SPECS = Path(__file__).parent


def band_of(value, bands):
    for b in bands:
        if b["min"] <= value <= b["max"]:
            return b
    return None


def expected(engine_spec, responses):
    scores = {}
    for sd in engine_spec["scores"]:
        present = [responses[i] for i in sd["items"] if i in responses]
        agg = sum(present)
        if sd.get("aggregate") == "mean":
            agg = (agg / len(present)) if present else 0
        t = sd.get("transform") or {}
        val = agg * t.get("mul", 1) + t.get("add", 0)
        val = int(val) if float(val).is_integer() else val
        obj = {"value": val}
        b = band_of(val, sd.get("bands", []))
        if b:
            obj["severity"] = b["severity"]
            obj["band"] = {"min": b["min"], "max": b["max"], "label": b["label"]}
        scores[sd["key"]] = obj
    union = []
    for sd in engine_spec["scores"]:
        for i in sd["items"]:
            if i not in union:
                union.append(i)
    missing = sum(1 for i in union if i not in responses)
    return {"scores": scores, "missing_count": missing}


def case(name, engine_spec, fill):
    union = []
    for sd in engine_spec["scores"]:
        for i in sd["items"]:
            if i not in union:
                union.append(i)
    resp = {i: fill for i in union}
    return {"name": name, "input": {"scored_responses": resp}, "expected": expected(engine_spec, resp)}


def items(prefix, n):
    return [f"pr_{prefix}_{i}" for i in range(1, n + 1)]


SPIN_BANDS = [
    {"min": 0, "max": 20, "severity": "none_minimal", "label": "None to minimal"},
    {"min": 21, "max": 30, "severity": "mild", "label": "Mild"},
    {"min": 31, "max": 40, "severity": "moderate", "label": "Moderate"},
    {"min": 41, "max": 50, "severity": "severe", "label": "Severe"},
    {"min": 51, "max": 68, "severity": "very_severe", "label": "Very severe"},
]
OCIR_BANDS = [
    {"min": 0, "max": 20, "severity": "below_cutoff", "label": "Below clinical cut-off"},
    {"min": 21, "max": 72, "severity": "at_or_above_cutoff", "label": "At or above clinical cut-off (probable OCD)"},
]

BATCH = {
    "spin": dict(
        name="SPIN Standard Scoring",
        description="Social Phobia Inventory (Connor et al., 2000). Total = sum of the 17 items "
                    "(each 0-4), range 0-68. Severity: 0-20 none/minimal, 21-30 mild, 31-40 moderate, "
                    "41-50 severe, 51-68 very severe (a total of 19 or more suggests social anxiety disorder).",
        citation="Connor KM, Davidson JRT, Churchill LE, Sherwood A, Foa E, Weisler RH (2000). "
                 "Psychometric properties of the Social Phobia Inventory (SPIN). Br J Psychiatry, 176, 379-386.",
        year=2000,
        engine_spec={"item_range": [0, 4], "scores": [
            {"key": "total", "items": items("spin", 17), "bands": SPIN_BANDS}]},
        fills=[("none-minimal-floor", 0), ("moderate-mid", 2), ("very-severe-ceiling", 4)],
    ),
    "ocir": dict(
        name="OCI-R Standard Scoring",
        description="Obsessive-Compulsive Inventory-Revised (Foa et al., 2002). Total = sum of the 18 "
                    "items (each 0-4), range 0-72. A total of 21 or more is the recommended clinical "
                    "cut-off indicating probable obsessive-compulsive disorder.",
        citation="Foa EB, Huppert JD, Leiberg S, Langner R, Kichic R, Hajcak G, Salkovskis PM (2002). "
                 "The Obsessive-Compulsive Inventory: development and validation of a short version. "
                 "Psychol Assess, 14(4), 485-496.",
        year=2002,
        engine_spec={"item_range": [0, 4], "scores": [
            {"key": "total", "items": items("ocir", 18), "bands": OCIR_BANDS}]},
        fills=[("below-cutoff", 1), ("at-or-above-cutoff", 2), ("ceiling", 4)],
    ),
    "panas": dict(
        name="PANAS Standard Scoring",
        description="Positive and Negative Affect Schedule (Watson et al., 1988). Two 10-item subscales "
                    "(each item 1-5, subscale range 10-50): Positive Affect (items 1,3,5,9,10,12,14,16,17,19) "
                    "and Negative Affect (items 2,4,6,7,8,11,13,15,18,20). Higher = stronger affect; "
                    "the scale has no standard severity cut-offs.",
        citation="Watson D, Clark LA, Tellegen A (1988). Development and validation of brief measures of "
                 "positive and negative affect: the PANAS scales. J Pers Soc Psychol, 54(6), 1063-1070.",
        year=1988,
        engine_spec={"item_range": [1, 5], "scores": [
            {"key": "positive_affect", "items": [f"pr_panas_{i}" for i in [1, 3, 5, 9, 10, 12, 14, 16, 17, 19]]},
            {"key": "negative_affect", "items": [f"pr_panas_{i}" for i in [2, 4, 6, 7, 8, 11, 13, 15, 18, 20]]},
        ]},
        fills=[("all-low", 1), ("all-mid", 3), ("all-high", 5)],
    ),
    "fs": dict(
        name="Flourishing Scale Scoring",
        description="Flourishing Scale (Diener et al., 2010). Total = sum of the 8 items (each 1-7), "
                    "range 8-56; higher scores indicate greater psychological flourishing. The scale "
                    "yields a single continuous score with no standard severity cut-offs.",
        citation="Diener E, Wirtz D, Tov W, Kim-Prieto C, Choi D, Oishi S, Biswas-Diener R (2010). New "
                 "well-being measures: short scales to assess flourishing and positive and negative "
                 "feelings. Soc Indic Res, 97, 143-156.",
        year=2010,
        engine_spec={"item_range": [1, 7], "scores": [{"key": "total", "items": items("fs", 8)}]},
        fills=[("floor", 1), ("mid", 4), ("ceiling", 7)],
    ),
    "rrs": dict(
        name="RRS Total Scoring",
        description="Ruminative Response Scale (Nolen-Hoeksema & Morrow, 1991). Total = sum of the 22 "
                    "items (each 1-4), range 22-88; higher scores indicate a greater tendency to ruminate. "
                    "This scorer reports the overall total (no standard severity cut-offs).",
        citation="Nolen-Hoeksema S, Morrow J (1991). A prospective study of depression and posttraumatic "
                 "stress symptoms after a natural disaster. J Pers Soc Psychol, 61(1), 115-121.",
        year=1991,
        engine_spec={"item_range": [1, 4], "scores": [{"key": "total", "items": items("rrs", 22)}]},
        fills=[("floor", 1), ("mid", 2), ("ceiling", 4)],
    ),
}

for sid, b in BATCH.items():
    es = b["engine_spec"]
    spec = {
        "id": sid, "scorer_id": f"scr_{sid}", "name": b["name"], "status": "validated",
        "description": b["description"],
        "publication": {"citation": b["citation"], "year": b["year"]},
        "engine_spec": es,
        "test_cases": [case(n, es, v) for (n, v) in b["fills"]],
    }
    (SPECS / f"{sid}.json").write_text(json.dumps(spec, indent=2) + "\n")
    print(f"wrote specs/{sid}.json ({len(spec['test_cases'])} cases)")
