# Scoring — Test Anxiety Inventory (TAI-5) (`qst_tai5`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_tai5",
  "title": "Test Anxiety Inventory (TAI-5)",
  "short_title": "TAI-5",
  "source_url": "https://us.psytoolkit.org/survey-library/tai5.html",
  "publication": {
    "citation": "Joanne Taylor & Frank P. Deane (2002) Development of a Short Form of the Test Anxiety Inventory (TAI), The Journal of General Psychology, 129:2, 127-136, DOI: 10.1080/00221300209603133",
    "year": 2002
  },
  "status": "needs-research",
  "item_count": 5,
  "dimensions": [
    "taiagree"
  ],
  "option_scales": [
    {
      "ref": "opt_tai5_taiagree_4",
      "dimension": "taiagree",
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
        "Rarely or never",
        "Sometimes",
        "Often",
        "Always"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_tai5_1",
      "prompt_snippet": "During tests I feel very tense.",
      "dimension": "taiagree",
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
      "prompt_id": "pr_tai5_2",
      "prompt_snippet": "I wish examinations did not bother me so much.",
      "dimension": "taiagree",
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
      "prompt_id": "pr_tai5_3",
      "prompt_snippet": "I seem to defeat myself while working on important tests.",
      "dimension": "taiagree",
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
      "prompt_id": "pr_tai5_4",
      "prompt_snippet": "I feel very panicky when I take an important test.",
      "dimension": "taiagree",
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
      "prompt_id": "pr_tai5_5",
      "prompt_snippet": "During examinations I get so nervous that I forget facts I really know.",
      "dimension": "taiagree",
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

- Items: 5
- Dimensions: taiagree
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | During tests I feel very tense. | taiagree | 1,2,3,4 | no |
| 2 | I wish examinations did not bother me so much. | taiagree | 1,2,3,4 | no |
| 3 | I seem to defeat myself while working on important tests. | taiagree | 1,2,3,4 | no |
| 4 | I feel very panicky when I take an important test. | taiagree | 1,2,3,4 | no |
| 5 | During examinations I get so nervous that I forget facts I really know. | taiagree | 1,2,3,4 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/tai5.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
