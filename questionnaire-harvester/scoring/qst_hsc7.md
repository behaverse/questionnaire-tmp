# Scoring — Hypoglycemia Symptoms Checklist (HSC-7) (`qst_hsc7`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_hsc7",
  "title": "Hypoglycemia Symptoms Checklist (HSC-7)",
  "short_title": "HSC-7",
  "source_url": "https://us.psytoolkit.org/survey-library/hypoglycemia-hsc7.html",
  "publication": {
    "citation": "Barry, J.A., Bouloux, P. & Hardiman, P.J. (2011). The impact of\neating behavior on psychological symptoms typical of reactive\nhypoglycemia. A pilot study comparing women with polycystic ovary\nsyndrome to controls. Appetite, 57, 73-76.",
    "year": 2011
  },
  "status": "needs-research",
  "item_count": 7,
  "dimensions": [
    "hscscale"
  ],
  "option_scales": [
    {
      "ref": "opt_hsc7_hscscale_4",
      "dimension": "hscscale",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        1,
        2,
        3,
        4
      ],
      "value_range": [
        1,
        4
      ],
      "anchors": [
        "Not at all",
        "A little",
        "Fairly",
        "Very"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_hsc7_1",
      "prompt_snippet": "Clumsy",
      "dimension": "hscscale",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_hsc7_2",
      "prompt_snippet": "Confused",
      "dimension": "hscscale",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_hsc7_3",
      "prompt_snippet": "Difficulty in speaking",
      "dimension": "hscscale",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_hsc7_4",
      "prompt_snippet": "Weak",
      "dimension": "hscscale",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_hsc7_5",
      "prompt_snippet": "Heart beating",
      "dimension": "hscscale",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_hsc7_6",
      "prompt_snippet": "Shivering",
      "dimension": "hscscale",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_hsc7_7",
      "prompt_snippet": "Sweating",
      "dimension": "hscscale",
      "values": [
        1,
        2,
        3,
        4
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
- Dimensions: hscscale
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Clumsy | hscscale | 1,2,3,4 | no |
| 2 | Confused | hscscale | 1,2,3,4 | no |
| 3 | Difficulty in speaking | hscscale | 1,2,3,4 | no |
| 4 | Weak | hscscale | 1,2,3,4 | no |
| 5 | Heart beating | hscscale | 1,2,3,4 | no |
| 6 | Shivering | hscscale | 1,2,3,4 | no |
| 7 | Sweating | hscscale | 1,2,3,4 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/hypoglycemia-hsc7.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
