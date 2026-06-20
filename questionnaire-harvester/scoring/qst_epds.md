# Scoring — Edinburgh Postnatal Depression Scale (EPDS) (`qst_epds`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_epds",
  "title": "Edinburgh Postnatal Depression Scale (EPDS)",
  "short_title": "EPDS",
  "source_url": "https://us.psytoolkit.org/survey-library/depression-epds.html",
  "publication": {
    "citation": "Cox, J.L., Holden, J.M., and Sagovsky, R. (1987). Detection of\npostnatal depression: Development of the 10-item Edinburgh Postnatal\nDepression Scale. British Journal of Psychiatry , 150, 782-786.",
    "year": 1987
  },
  "status": "needs-research",
  "item_count": 10,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_epds_rating_1",
      "dimension": "rating",
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
        "As much as I always could",
        "Not quite so much now",
        "Definitely not so much now",
        "Not at all"
      ]
    },
    {
      "ref": "opt_epds_rating_2",
      "dimension": "rating",
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
        "As much as I ever did",
        "Rather less than I used to",
        "Definitely less than I used to",
        "Hardly at all"
      ]
    },
    {
      "ref": "opt_epds_rating_3",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        3,
        2,
        1,
        0
      ],
      "value_range": [
        0,
        3
      ],
      "anchors": [
        "Yes, most of the time",
        "Yes, some of the time",
        "Not very often",
        "No, never"
      ]
    },
    {
      "ref": "opt_epds_rating_4",
      "dimension": "rating",
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
        "No, not at all",
        "Hardly ever",
        "Yes, sometimes",
        "Yes, very often"
      ]
    },
    {
      "ref": "opt_epds_rating_5",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        3,
        2,
        1,
        0
      ],
      "value_range": [
        0,
        3
      ],
      "anchors": [
        "Yes, quite a lot",
        "Yes, sometimes",
        "No, not much",
        "No, not at all"
      ]
    },
    {
      "ref": "opt_epds_rating_6",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        3,
        2,
        1,
        0
      ],
      "value_range": [
        0,
        3
      ],
      "anchors": [
        "Yes, most of the time I haven’t been able to cope at all",
        "Yes, sometimes I haven’t been coping as well as usual",
        "No, most of the time I have coped quite well",
        "No, I have been coping as well as ever"
      ]
    },
    {
      "ref": "opt_epds_rating_7",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        3,
        2,
        1,
        0
      ],
      "value_range": [
        0,
        3
      ],
      "anchors": [
        "Yes, most of the time",
        "Yes, sometimes",
        "Not very often",
        "No, not at all"
      ]
    },
    {
      "ref": "opt_epds_rating_8",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        3,
        2,
        1,
        0
      ],
      "value_range": [
        0,
        3
      ],
      "anchors": [
        "Yes, most of the time",
        "Yes, quite often",
        "Not very often",
        "No, not at all"
      ]
    },
    {
      "ref": "opt_epds_rating_9",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        3,
        2,
        1,
        0
      ],
      "value_range": [
        0,
        3
      ],
      "anchors": [
        "Yes, most of the time",
        "Yes, quite often",
        "Only occasionally",
        "No, never"
      ]
    },
    {
      "ref": "opt_epds_rating_10",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        3,
        2,
        1,
        0
      ],
      "value_range": [
        0,
        3
      ],
      "anchors": [
        "Yes, quite often",
        "Sometimes",
        "Hardly ever",
        "Never"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_epds_1",
      "prompt_snippet": "Note, all questions in this questionnaire are about how you felt <b>in the past ",
      "dimension": "rating",
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
      "prompt_id": "pr_epds_2",
      "prompt_snippet": "I have looked forward with enjoyment to things",
      "dimension": "rating",
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
      "prompt_id": "pr_epds_3",
      "prompt_snippet": "I have blamed myself unnecessarily when things went wrong",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_epds_4",
      "prompt_snippet": "I have been anxious or worried for no good reason",
      "dimension": "rating",
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
      "prompt_id": "pr_epds_5",
      "prompt_snippet": "I have felt scared or panicky for no very good reason",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_epds_6",
      "prompt_snippet": "Things have been getting on top of me",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_epds_7",
      "prompt_snippet": "I have been so unhappy that I have had difficulty sleeping",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_epds_8",
      "prompt_snippet": "I have felt sad or miserable",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_epds_9",
      "prompt_snippet": "I have been so unhappy that I have been crying",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_epds_10",
      "prompt_snippet": "The thought of harming myself has occurred to me",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0
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

- Items: 10
- Dimensions: rating
- Distinct scales: 10 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Note, all questions in this questionnaire are about how you felt <b>in the past  | rating | 0,1,2,3 | no |
| 2 | I have looked forward with enjoyment to things | rating | 0,1,2,3 | no |
| 3 | I have blamed myself unnecessarily when things went wrong | rating | 3,2,1,0 | no |
| 4 | I have been anxious or worried for no good reason | rating | 0,1,2,3 | no |
| 5 | I have felt scared or panicky for no very good reason | rating | 3,2,1,0 | no |
| 6 | Things have been getting on top of me | rating | 3,2,1,0 | no |
| 7 | I have been so unhappy that I have had difficulty sleeping | rating | 3,2,1,0 | no |
| 8 | I have felt sad or miserable | rating | 3,2,1,0 | no |
| 9 | I have been so unhappy that I have been crying | rating | 3,2,1,0 | no |
| 10 | The thought of harming myself has occurred to me | rating | 3,2,1,0 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/depression-epds.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
