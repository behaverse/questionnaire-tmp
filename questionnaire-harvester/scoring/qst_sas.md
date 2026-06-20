# Scoring — Zung Self-Rating Anxiety Scale (SAS) (`qst_sas`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_sas",
  "title": "Zung Self-Rating Anxiety Scale (SAS)",
  "short_title": "SAS",
  "source_url": "https://psychology-tools.com/test/zung-anxiety-scale",
  "publication": {
    "citation": "William W K Zung. A Rating Instrument for Anxiety Disorders. 12 ( 6 ): Psychosomatics 371-379. 1971.",
    "year": 1971
  },
  "status": "needs-research",
  "item_count": 20,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_sas_rating_1",
      "dimension": "rating",
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
        "A Little Of The Time",
        "Some Of The Time",
        "Good Part Of The Time",
        "Most Of The Time"
      ]
    },
    {
      "ref": "opt_sas_rating_2",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        4,
        3,
        2,
        1
      ],
      "value_range": [
        1,
        4
      ],
      "anchors": [
        "A Little Of The Time",
        "Some Of The Time",
        "Good Part Of The Time",
        "Most Of The Time"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_sas_1",
      "prompt_snippet": "I feel more nervous and anxious than usual.",
      "dimension": "rating",
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
      "prompt_id": "pr_sas_2",
      "prompt_snippet": "I feel afraid for no reason at all.",
      "dimension": "rating",
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
      "prompt_id": "pr_sas_3",
      "prompt_snippet": "I get upset easily or feel panicky.",
      "dimension": "rating",
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
      "prompt_id": "pr_sas_4",
      "prompt_snippet": "I feel like I’m falling apart and going to pieces.",
      "dimension": "rating",
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
      "prompt_id": "pr_sas_5",
      "prompt_snippet": "I feel that everything is all right and nothing bad will happen.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_sas_6",
      "prompt_snippet": "My arms and legs shake and tremble.",
      "dimension": "rating",
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
      "prompt_id": "pr_sas_7",
      "prompt_snippet": "I am bothered by headaches neck and back pain.",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_sas_8",
      "prompt_snippet": "I feel weak and get tired easily.",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_sas_9",
      "prompt_snippet": "I feel calm and can sit still easily.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_sas_10",
      "prompt_snippet": "I can feel my heart beating fast.",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_sas_11",
      "prompt_snippet": "I am bothered by dizzy spells.",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_sas_12",
      "prompt_snippet": "I have fainting spells or feel like it.",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_sas_13",
      "prompt_snippet": "I can breathe in and out easily.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_sas_14",
      "prompt_snippet": "I get numbness and tingling in my fingers and toes.",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_sas_15",
      "prompt_snippet": "I am bothered by stomach aches or indigestion.",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_sas_16",
      "prompt_snippet": "I have to empty my bladder often.",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_sas_17",
      "prompt_snippet": "My hands are usually dry and warm.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_sas_18",
      "prompt_snippet": "My face gets hot and blushes.",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_sas_19",
      "prompt_snippet": "I fall asleep easily and get a good night’s rest.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_sas_20",
      "prompt_snippet": "I have nightmares.",
      "dimension": "rating",
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

- Items: 20
- Dimensions: rating
- Distinct scales: 2 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I feel more nervous and anxious than usual. | rating | 1,2,3,4 | no |
| 2 | I feel afraid for no reason at all. | rating | 1,2,3,4 | no |
| 3 | I get upset easily or feel panicky. | rating | 1,2,3,4 | no |
| 4 | I feel like I’m falling apart and going to pieces. | rating | 1,2,3,4 | no |
| 5 | I feel that everything is all right and nothing bad will happen. | rating | 4,3,2,1 | no |
| 6 | My arms and legs shake and tremble. | rating | 1,2,3,4 | no |
| 7 | I am bothered by headaches neck and back pain. | rating | 1,2,3,4 | no |
| 8 | I feel weak and get tired easily. | rating | 1,2,3,4 | no |
| 9 | I feel calm and can sit still easily. | rating | 4,3,2,1 | no |
| 10 | I can feel my heart beating fast. | rating | 1,2,3,4 | no |
| 11 | I am bothered by dizzy spells. | rating | 1,2,3,4 | no |
| 12 | I have fainting spells or feel like it. | rating | 1,2,3,4 | no |
| 13 | I can breathe in and out easily. | rating | 4,3,2,1 | no |
| 14 | I get numbness and tingling in my fingers and toes. | rating | 1,2,3,4 | no |
| 15 | I am bothered by stomach aches or indigestion. | rating | 1,2,3,4 | no |
| 16 | I have to empty my bladder often. | rating | 1,2,3,4 | no |
| 17 | My hands are usually dry and warm. | rating | 4,3,2,1 | no |
| 18 | My face gets hot and blushes. | rating | 1,2,3,4 | no |
| 19 | I fall asleep easily and get a good night’s rest. | rating | 4,3,2,1 | no |
| 20 | I have nightmares. | rating | 1,2,3,4 | no |

## To research (fill from https://psychology-tools.com/test/zung-anxiety-scale)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
