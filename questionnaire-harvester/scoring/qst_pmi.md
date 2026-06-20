# Scoring — Positive Mindset Index (PMI) (`qst_pmi`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_pmi",
  "title": "Positive Mindset Index (PMI)",
  "short_title": "PMI",
  "source_url": "https://us.psytoolkit.org/survey-library/pmi.html",
  "publication": {
    "citation": "Barry, J. A., Folkard, A., & Ayliffe, W. (2014). Validation of a brief questionnaire measuring positive mindset in patients with uveitis. Psychology, Community & Health, 3(1) , 1-10. Open Access PDF",
    "year": 2014
  },
  "status": "needs-research",
  "item_count": 6,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_pmi_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "value_range": [
        1,
        5
      ],
      "anchors": [
        "Very unhappy",
        "Unhappy",
        "Moderately happy",
        "Happy",
        "Very happy"
      ]
    },
    {
      "ref": "opt_pmi_rating_2",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "value_range": [
        1,
        5
      ],
      "anchors": [
        "Very unconfident",
        "Unconfident",
        "Moderately confident",
        "Confident",
        "Very confident"
      ]
    },
    {
      "ref": "opt_pmi_rating_3",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "value_range": [
        1,
        5
      ],
      "anchors": [
        "Very out of control",
        "Out of control",
        "Moderately in control",
        "In control",
        "Very in control"
      ]
    },
    {
      "ref": "opt_pmi_rating_4",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "value_range": [
        1,
        5
      ],
      "anchors": [
        "Very unstable",
        "Unstable",
        "Moderately stable",
        "Stable",
        "Very stable"
      ]
    },
    {
      "ref": "opt_pmi_rating_5",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "value_range": [
        1,
        5
      ],
      "anchors": [
        "Very unmotivated",
        "Unmotivated",
        "Moderately motivated",
        "Motivated",
        "Very motivated"
      ]
    },
    {
      "ref": "opt_pmi_rating_6",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "value_range": [
        1,
        5
      ],
      "anchors": [
        "Very pessimistic",
        "Pessimistic",
        "Moderately optimistic",
        "Optimistic",
        "Very optimistic"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_pmi_shared",
      "prompt_snippet": "Please say how much you are feeling the following at this moment in time.<BR> Pl",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_pmi_shared",
      "prompt_snippet": "Please say how much you are feeling the following at this moment in time.<BR> Pl",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_pmi_shared",
      "prompt_snippet": "Please say how much you are feeling the following at this moment in time.<BR> Pl",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_pmi_shared",
      "prompt_snippet": "Please say how much you are feeling the following at this moment in time.<BR> Pl",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_pmi_shared",
      "prompt_snippet": "Please say how much you are feeling the following at this moment in time.<BR> Pl",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_pmi_shared",
      "prompt_snippet": "Please say how much you are feeling the following at this moment in time.<BR> Pl",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4,
        5
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

- Items: 6
- Dimensions: rating
- Distinct scales: 6 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Please say how much you are feeling the following at this moment in time.<BR> Pl | rating | 1,2,3,4,5 | no |
| 2 | Please say how much you are feeling the following at this moment in time.<BR> Pl | rating | 1,2,3,4,5 | no |
| 3 | Please say how much you are feeling the following at this moment in time.<BR> Pl | rating | 1,2,3,4,5 | no |
| 4 | Please say how much you are feeling the following at this moment in time.<BR> Pl | rating | 1,2,3,4,5 | no |
| 5 | Please say how much you are feeling the following at this moment in time.<BR> Pl | rating | 1,2,3,4,5 | no |
| 6 | Please say how much you are feeling the following at this moment in time.<BR> Pl | rating | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/pmi.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
