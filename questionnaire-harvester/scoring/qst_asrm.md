# Scoring — Altman Self-Rating Mania Scale (ASRM) (`qst_asrm`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_asrm",
  "title": "Altman Self-Rating Mania Scale (ASRM)",
  "short_title": "ASRM",
  "source_url": "https://psychology-tools.com/test/altman-self-rating-mania-scale",
  "publication": {
    "citation": "E G Altman, D Hedeker, J L Peterson, J M Davis. The Altman Self-Rating Mania Scale. 42 ( 10 ): Biol Psychiatry 948-55 ( 1997 ).",
    "year": 1997
  },
  "status": "needs-research",
  "item_count": 5,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_asrm_rating_1",
      "dimension": "rating",
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
        "I do not feel happier or more cheerful than usual.",
        "I occasionally feel happier or more cheerful than usual.",
        "I often feel happier or more cheerful than usual.",
        "I feel happier or more cheerful than usual most of the time.",
        "I feel happier or more cheerful than usual all of the time."
      ]
    },
    {
      "ref": "opt_asrm_rating_2",
      "dimension": "rating",
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
        "I do not feel more self-confident than usual.",
        "I occasionally feel more self-confident than usual.",
        "I often feel more self-confident than usual.",
        "I feel more self-confident than usual.",
        "I feel extremely self-confident all of the time."
      ]
    },
    {
      "ref": "opt_asrm_rating_3",
      "dimension": "rating",
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
        "I do not need less sleep than usual.",
        "I occasionally need less sleep than usual.",
        "I often need less sleep than usual.",
        "I frequently need less sleep than usual.",
        "I can go all day and night without any sleep and still not feel tired."
      ]
    },
    {
      "ref": "opt_asrm_rating_4",
      "dimension": "rating",
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
        "I do not talk more than usual.",
        "I occasionally talk more than usual.",
        "I often talk more than usual.",
        "I frequently talk more than usual.",
        "I talk constantly and cannot be interrupted."
      ]
    },
    {
      "ref": "opt_asrm_rating_5",
      "dimension": "rating",
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
        "I have not been more active (either socially, sexually, at work, home or school) than usual.",
        "I have occasionally been more active than usual.",
        "I have often been more active than usual.",
        "I have frequently been more active than usual.",
        "I am constantly active or on the go all the time."
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_asrm_1",
      "prompt_snippet": "Positive Mood",
      "dimension": "rating",
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
      "prompt_id": "pr_asrm_2",
      "prompt_snippet": "Self-Confidence",
      "dimension": "rating",
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
      "prompt_id": "pr_asrm_3",
      "prompt_snippet": "Sleep Patterns",
      "dimension": "rating",
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
      "prompt_id": "pr_asrm_4",
      "prompt_snippet": "Speech",
      "dimension": "rating",
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
      "index": 5,
      "prompt_id": "pr_asrm_5",
      "prompt_snippet": "Activity Level",
      "dimension": "rating",
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

- Items: 5
- Dimensions: rating
- Distinct scales: 5 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Positive Mood | rating | 0,1,2,3,4 | no |
| 2 | Self-Confidence | rating | 0,1,2,3,4 | no |
| 3 | Sleep Patterns | rating | 0,1,2,3,4 | no |
| 4 | Speech | rating | 0,1,2,3,4 | no |
| 5 | Activity Level | rating | 0,1,2,3,4 | no |

## To research (fill from https://psychology-tools.com/test/altman-self-rating-mania-scale)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
