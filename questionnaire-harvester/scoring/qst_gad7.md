# Scoring — Generalized Anxiety Disorder (GAD-7) (`qst_gad7`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_gad7",
  "title": "Generalized Anxiety Disorder (GAD-7)",
  "short_title": "GAD-7",
  "source_url": "https://us.psytoolkit.org/survey-library/anxiety-gad7.html",
  "publication": {
    "citation": "Spitzer, R. L., Kroenke, K., Williams, J. B. W., & Lowe, B. (2006). A brief measure for assessing generalized anxiety disorder - The GAD-7. Archives of Internal Medicine, 166 , 1092-1097.",
    "year": 2006
  },
  "status": "needs-research",
  "item_count": 7,
  "dimensions": [
    "frequency"
  ],
  "option_scales": [
    {
      "ref": "opt_phq_frequency_4",
      "dimension": "frequency",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        0,
        1,
        2,
        3
      ],
      "value_range": [
        0,
        3
      ],
      "anchors": [
        "Not at all",
        "Several days",
        "More than half the days",
        "Nearly every day"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_gad7_1",
      "prompt_snippet": "Feeling nervous, anxious or on edge",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_gad7_2",
      "prompt_snippet": "Not being able to stop or control worrying",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_gad7_3",
      "prompt_snippet": "Worrying too much about different things",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_gad7_4",
      "prompt_snippet": "Trouble relaxing",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_gad7_5",
      "prompt_snippet": "Being so restless that it is hard to sit still",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_gad7_6",
      "prompt_snippet": "Becoming easily annoyed or irritable",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_gad7_7",
      "prompt_snippet": "Feeling afraid as if something awful might happen",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    }
  ],
  "to_research": {
    "aggregation": null,
    "subscale_definitions": null,
    "cutoffs": null,
    "notes": null
  }
}
```

## Known structure

- Items: 7
- Dimensions: frequency
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Feeling nervous, anxious or on edge | frequency | 0,1,2,3 | no |
| 2 | Not being able to stop or control worrying | frequency | 0,1,2,3 | no |
| 3 | Worrying too much about different things | frequency | 0,1,2,3 | no |
| 4 | Trouble relaxing | frequency | 0,1,2,3 | no |
| 5 | Being so restless that it is hard to sit still | frequency | 0,1,2,3 | no |
| 6 | Becoming easily annoyed or irritable | frequency | 0,1,2,3 | no |
| 7 | Feeling afraid as if something awful might happen | frequency | 0,1,2,3 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/anxiety-gad7.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
