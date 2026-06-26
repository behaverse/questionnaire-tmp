"""Generate batch-3 scorer specs (incl. reverse-scored + mean) with auto-computed test vectors.
Reverse is applied UPSTREAM by the host (verified: harvested prompt.reversed flags match the
published reverse-item sets), so these scorers just sum/mean the scored_responses.
Run from questionnaire-scorer/:  python specs/_gen_batch3.py"""
import json
from pathlib import Path
import importlib.util

# reuse the helpers from batch 2
spec_b2 = importlib.util.spec_from_file_location("b2", Path(__file__).parent / "_gen_batch2.py")
b2 = importlib.util.module_from_spec(spec_b2)
spec_b2.loader.exec_module(b2)
case, items, expected = b2.case, b2.items, b2.expected

SPECS = Path(__file__).parent

RSES_BANDS = [
    {"min": 0, "max": 14, "severity": "low", "label": "Low self-esteem"},
    {"min": 15, "max": 25, "severity": "normal", "label": "Normal range"},
    {"min": 26, "max": 30, "severity": "high", "label": "High self-esteem"},
]
BRS_BANDS = [
    {"min": 1.0, "max": 2.99, "severity": "low", "label": "Low resilience"},
    {"min": 3.0, "max": 4.30, "severity": "normal", "label": "Normal resilience"},
    {"min": 4.31, "max": 5.0, "severity": "high", "label": "High resilience"},
]
TILS_BANDS = [
    {"min": 3, "max": 5, "severity": "not_lonely", "label": "Not lonely"},
    {"min": 6, "max": 9, "severity": "lonely", "label": "Lonely"},
]

BATCH = {
    "rses": dict(
        name="RSES Standard Scoring",
        description="Rosenberg Self-Esteem Scale (Rosenberg, 1965). Total = sum of the 10 items (each "
                    "0-3, negatively-worded items reverse-scored by the runtime), range 0-30; higher = "
                    "higher self-esteem. Common interpretation: 0-14 low self-esteem, 15-25 normal range, "
                    "26-30 high self-esteem.",
        citation="Rosenberg M (1965). Society and the Adolescent Self-Image. Princeton University Press.",
        year=1965,
        engine_spec={"item_range": [0, 3], "scores": [
            {"key": "total", "items": items("rses", 10), "bands": RSES_BANDS}]},
        fills=[("low-floor", 0), ("normal-mid", 2), ("high-ceiling", 3)],
    ),
    "brs": dict(
        name="BRS Standard Scoring",
        description="Brief Resilience Scale (Smith et al., 2008). Score = MEAN of the 6 items (each 1-5; "
                    "items 2,4,6 reverse-scored by the runtime), range 1.00-5.00. Interpretation: 1.00-2.99 "
                    "low resilience, 3.00-4.30 normal resilience, 4.31-5.00 high resilience.",
        citation="Smith BW, Dalen J, Wiggins K, Tooley E, Christopher P, Bernard J (2008). The brief "
                 "resilience scale: assessing the ability to bounce back. Int J Behav Med, 15(3), 194-200.",
        year=2008,
        engine_spec={"item_range": [1, 5], "scores": [
            {"key": "resilience", "aggregate": "mean", "items": items("brs", 6), "bands": BRS_BANDS}]},
        fills=[("low", 2), ("normal", 3), ("high", 5)],
    ),
    "gq6": dict(
        name="GQ-6 Standard Scoring",
        description="Gratitude Questionnaire-6 (McCullough et al., 2002). Total = sum of the 6 items (each "
                    "1-7; items 3 and 6 reverse-scored by the runtime), range 6-42; higher = greater "
                    "dispositional gratitude. No standard severity cut-offs.",
        citation="McCullough ME, Emmons RA, Tsang JA (2002). The grateful disposition: a conceptual and "
                 "empirical topography. J Pers Soc Psychol, 82(1), 112-127.",
        year=2002,
        engine_spec={"item_range": [1, 7], "scores": [{"key": "total", "items": items("gq6", 6)}]},
        fills=[("floor", 1), ("mid", 4), ("ceiling", 7)],
    ),
    "tils": dict(
        name="Three-Item Loneliness Scale Scoring",
        description="Three-Item Loneliness Scale (Hughes et al., 2004). Total = sum of the 3 items (each "
                    "1-3), range 3-9; higher = lonelier. Common split: 3-5 not lonely, 6-9 lonely.",
        citation="Hughes ME, Waite LJ, Hawkley LC, Cacioppo JT (2004). A short scale for measuring "
                 "loneliness in large surveys. Res Aging, 26(6), 655-672.",
        year=2004,
        engine_spec={"item_range": [1, 3], "scores": [
            {"key": "total", "items": items("tils", 3), "bands": TILS_BANDS}]},
        fills=[("not-lonely-floor", 1), ("lonely-mid", 2), ("lonely-ceiling", 3)],
    ),
    "pss": dict(
        name="PSS-14 Standard Scoring",
        description="Perceived Stress Scale-14 (Cohen et al., 1983). Total = sum of the 14 items (each "
                    "0-4; the 7 positively-worded items reverse-scored by the runtime), range 0-56; higher "
                    "= greater perceived stress. (The 14-item version has no single standard cut-off.)",
        citation="Cohen S, Kamarck T, Mermelstein R (1983). A global measure of perceived stress. "
                 "J Health Soc Behav, 24(4), 385-396.",
        year=1983,
        engine_spec={"item_range": [0, 4], "scores": [{"key": "total", "items": items("pss", 14)}]},
        fills=[("floor", 0), ("mid", 2), ("ceiling", 4)],
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
