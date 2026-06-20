# Scoring — Perceived Stress Scale (PSS) (`qst_pss`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_pss",
  "title": "Perceived Stress Scale (PSS)",
  "short_title": "PSS",
  "source_url": "https://us.psytoolkit.org/survey-library/stress-pss.html",
  "publication": {
    "citation": "Cohen, S., Kamarck, T., Mermelstein, R. (1983). A global measure of perceived stress. Journal of Health and Social Behavior, 24 , 385-396.",
    "year": 1983
  },
  "status": "needs-research",
  "item_count": 14,
  "dimensions": [
    "frequency"
  ],
  "option_scales": [
    {
      "ref": "opt_pss_frequency_5",
      "dimension": "frequency",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "value_range": [
        0,
        4
      ],
      "anchors": [
        "never",
        "almost never",
        "sometimes",
        "fairly often",
        "very often"
      ]
    }
  ],
  "reversed_items": [
    "pr_pss_4",
    "pr_pss_5",
    "pr_pss_6",
    "pr_pss_7",
    "pr_pss_9",
    "pr_pss_10",
    "pr_pss_13"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_pss_1",
      "prompt_snippet": "In the last month, how often have you been upset because of something that happe",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_pss_2",
      "prompt_snippet": "In the last month, how often have you felt that you were unable to control the i",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_pss_3",
      "prompt_snippet": "In the last month, how often have you felt nervous and \"stressed\"?",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_pss_4",
      "prompt_snippet": "In the last month, how often have you dealt successfully with irritating life ha",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 5,
      "prompt_id": "pr_pss_5",
      "prompt_snippet": "In the last month, how often have you felt that you were effectively coping with",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 6,
      "prompt_id": "pr_pss_6",
      "prompt_snippet": "In the last month, how often have you felt confident about your ability to handl",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 7,
      "prompt_id": "pr_pss_7",
      "prompt_snippet": "In the last month, how often have you felt that things were going your way?",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 8,
      "prompt_id": "pr_pss_8",
      "prompt_snippet": "In the last month, how often have you found that you could not cope with all the",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_pss_9",
      "prompt_snippet": "In the last month, how often have you been able to control irritations in your l",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 10,
      "prompt_id": "pr_pss_10",
      "prompt_snippet": "In the last month, how often have you felt that you were on top of things?",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 11,
      "prompt_id": "pr_pss_11",
      "prompt_snippet": "In the last month, how often have you been angered because of things that happen",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_pss_12",
      "prompt_snippet": "In the last month, how often have you found yourself thinking about things that ",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_pss_13",
      "prompt_snippet": "In the last month, how often have you been able to control the way you spend you",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 14,
      "prompt_id": "pr_pss_14",
      "prompt_snippet": "In the last month, how often have you felt difficulties were piling up so high t",
      "dimension": "frequency",
      "values": [
        0,
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

- Items: 14
- Dimensions: frequency
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_pss_4, pr_pss_5, pr_pss_6, pr_pss_7, pr_pss_9, pr_pss_10, pr_pss_13
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | In the last month, how often have you been upset because of something that happe | frequency | 0,1,2,3,4 | no |
| 2 | In the last month, how often have you felt that you were unable to control the i | frequency | 0,1,2,3,4 | no |
| 3 | In the last month, how often have you felt nervous and "stressed"? | frequency | 0,1,2,3,4 | no |
| 4 | In the last month, how often have you dealt successfully with irritating life ha | frequency | 0,1,2,3,4 | yes |
| 5 | In the last month, how often have you felt that you were effectively coping with | frequency | 0,1,2,3,4 | yes |
| 6 | In the last month, how often have you felt confident about your ability to handl | frequency | 0,1,2,3,4 | yes |
| 7 | In the last month, how often have you felt that things were going your way? | frequency | 0,1,2,3,4 | yes |
| 8 | In the last month, how often have you found that you could not cope with all the | frequency | 0,1,2,3,4 | no |
| 9 | In the last month, how often have you been able to control irritations in your l | frequency | 0,1,2,3,4 | yes |
| 10 | In the last month, how often have you felt that you were on top of things? | frequency | 0,1,2,3,4 | yes |
| 11 | In the last month, how often have you been angered because of things that happen | frequency | 0,1,2,3,4 | no |
| 12 | In the last month, how often have you found yourself thinking about things that  | frequency | 0,1,2,3,4 | no |
| 13 | In the last month, how often have you been able to control the way you spend you | frequency | 0,1,2,3,4 | yes |
| 14 | In the last month, how often have you felt difficulties were piling up so high t | frequency | 0,1,2,3,4 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/stress-pss.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
