"""Generate batch-4 scorer specs. Run from questionnaire-scorer/:  python specs/_gen_batch4.py"""
import json
from pathlib import Path
import importlib.util

spec_b2 = importlib.util.spec_from_file_location("b2", Path(__file__).parent / "_gen_batch2.py")
b2 = importlib.util.module_from_spec(spec_b2)
spec_b2.loader.exec_module(b2)
case, items = b2.case, b2.items

SPECS = Path(__file__).parent
def pr(prefix, nums): return [f"pr_{prefix}_{n}" for n in nums]

CAGE_BANDS = [
    {"min": 0, "max": 1, "severity": "negative", "label": "Negative screen"},
    {"min": 2, "max": 4, "severity": "positive", "label": "Positive screen — assess for alcohol problem"},
]
HAMA_BANDS = [
    {"min": 0, "max": 17, "severity": "mild", "label": "Mild anxiety"},
    {"min": 18, "max": 24, "severity": "mild_moderate", "label": "Mild to moderate"},
    {"min": 25, "max": 30, "severity": "moderate_severe", "label": "Moderate to severe"},
    {"min": 31, "max": 56, "severity": "severe", "label": "Severe"},
]
ICG_BANDS = [
    {"min": 0, "max": 25, "severity": "below_threshold", "label": "Below threshold"},
    {"min": 26, "max": 76, "severity": "elevated", "label": "Complicated grief likely"},
]

BATCH = {
    "cage": dict(
        name="CAGE Standard Scoring",
        description="CAGE alcohol screening questionnaire (Ewing, 1984). Total = number of 'yes' answers "
                    "across the 4 items (range 0-4); a total of 2 or more is a positive screen suggesting "
                    "the need for further assessment of alcohol problems.",
        citation="Ewing JA (1984). Detecting alcoholism: the CAGE questionnaire. JAMA, 252(14), 1905-1907.",
        year=1984,
        engine_spec={"item_range": [0, 1], "scores": [
            {"key": "total", "items": items("cage", 4), "bands": CAGE_BANDS}]},
        fills=[("negative", 0), ("positive", 1)],
    ),
    "hama": dict(
        name="HAM-A Standard Scoring",
        description="Hamilton Anxiety Rating Scale (Hamilton, 1959). Total = sum of the 14 clinician-rated "
                    "items (each 0-4), range 0-56. Common severity bands: <18 mild, 18-24 mild-to-moderate, "
                    "25-30 moderate-to-severe, 31+ severe anxiety.",
        citation="Hamilton M (1959). The assessment of anxiety states by rating. Br J Med Psychol, 32(1), 50-55.",
        year=1959,
        engine_spec={"item_range": [0, 4], "scores": [
            {"key": "total", "items": items("hama", 14), "bands": HAMA_BANDS}]},
        fills=[("mild-floor", 0), ("moderate-severe", 2), ("severe-ceiling", 4)],
    ),
    "icg": dict(
        name="ICG Standard Scoring",
        description="Inventory of Complicated Grief (Prigerson et al., 1995). Total = sum of the 19 items "
                    "(each 0-4), range 0-76; a total above 25 indicates clinically significant complicated grief.",
        citation="Prigerson HG, Maciejewski PK, Reynolds CF 3rd, et al. (1995). Inventory of Complicated "
                 "Grief: a scale to measure maladaptive symptoms of loss. Psychiatry Res, 59(1-2), 65-79.",
        year=1995,
        engine_spec={"item_range": [0, 4], "scores": [
            {"key": "total", "items": items("icg", 19), "bands": ICG_BANDS}]},
        fills=[("below-floor", 0), ("elevated-mid", 2), ("ceiling", 4)],
    ),
    "gse": dict(
        name="GSE Standard Scoring",
        description="Generalized Self-Efficacy Scale (Schwarzer & Jerusalem, 1995). Total = sum of the 10 "
                    "items (each 1-4), range 10-40; higher = stronger perceived self-efficacy. No standard "
                    "severity cut-offs.",
        citation="Schwarzer R, Jerusalem M (1995). Generalized Self-Efficacy Scale. In Weinman J, Wright S, "
                 "Johnston M (Eds.), Measures in Health Psychology (pp. 35-37). NFER-NELSON.",
        year=1995,
        engine_spec={"item_range": [1, 4], "scores": [{"key": "total", "items": items("gse", 10)}]},
        fills=[("floor", 1), ("mid", 2), ("ceiling", 4)],
    ),
    "erq": dict(
        name="ERQ Standard Scoring",
        description="Emotion Regulation Questionnaire (Gross & John, 2003). Two subscale MEAN scores (each "
                    "item 1-7): Cognitive Reappraisal (items 1,3,5,7,8,10) and Expressive Suppression "
                    "(items 2,4,6,9). Higher = greater habitual use of that strategy; no severity cut-offs.",
        citation="Gross JJ, John OP (2003). Individual differences in two emotion regulation processes: "
                 "implications for affect, relationships, and well-being. J Pers Soc Psychol, 85(2), 348-362.",
        year=2003,
        engine_spec={"item_range": [1, 7], "scores": [
            {"key": "reappraisal", "aggregate": "mean", "items": pr("erq", [1, 3, 5, 7, 8, 10])},
            {"key": "suppression", "aggregate": "mean", "items": pr("erq", [2, 4, 6, 9])},
        ]},
        fills=[("low", 1), ("mid", 4), ("high", 7)],
    ),
    "spane": dict(
        name="SPANE Standard Scoring",
        description="Scale of Positive and Negative Experience (Diener et al., 2010). Two 6-item subscale "
                    "sums (each item 1-5, range 6-30): SPANE-P (positive feelings: items 1,3,5,7,10,12) and "
                    "SPANE-N (negative feelings: items 2,4,6,8,9,11). An affect-balance score is SPANE-P minus "
                    "SPANE-N (range -24 to +24).",
        citation="Diener E, Wirtz D, Tov W, Kim-Prieto C, Choi D, Oishi S, Biswas-Diener R (2010). New "
                 "well-being measures: short scales to assess flourishing and positive and negative "
                 "feelings. Soc Indic Res, 97, 143-156.",
        year=2010,
        engine_spec={"item_range": [1, 5], "scores": [
            {"key": "positive", "items": pr("spane", [1, 3, 5, 7, 10, 12])},
            {"key": "negative", "items": pr("spane", [2, 4, 6, 8, 9, 11])},
        ]},
        fills=[("low", 1), ("mid", 3), ("high", 5)],
    ),
}

for sid, b in BATCH.items():
    es = b["engine_spec"]
    spec = {"id": sid, "scorer_id": f"scr_{sid}", "name": b["name"], "status": "validated",
            "description": b["description"], "publication": {"citation": b["citation"], "year": b["year"]},
            "engine_spec": es, "test_cases": [case(n, es, v) for (n, v) in b["fills"]]}
    (SPECS / f"{sid}.json").write_text(json.dumps(spec, indent=2) + "\n")
    print(f"wrote specs/{sid}.json ({len(spec['test_cases'])} cases)")
