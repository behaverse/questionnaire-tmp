# Scoring — Groningen Sleep Quality Questionnaire (`qst_gsqs`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_gsqs",
  "title": "Groningen Sleep Quality Questionnaire",
  "short_title": "Groningen Sleep Quality Questionnaire",
  "source_url": "https://us.psytoolkit.org/survey-library/gsqs.html",
  "publication": {
    "citation": "Meijman, T. F., de Vries-Griever, A. H., de Vries, G. (1988): The\nevaluation of the Groningen Sleep Quality Scale. Groningen: Heymans\nBulletin (HB 88—13—EX).",
    "year": 1988
  },
  "status": "needs-research",
  "item_count": 15,
  "dimensions": [
    "tf"
  ],
  "option_scales": [
    {
      "ref": "opt_gsqs_tf_2",
      "dimension": "tf",
      "measurement_type": "ordinal",
      "levels": 2,
      "values": [
        1,
        0
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "True",
        "False"
      ]
    }
  ],
  "reversed_items": [
    "pr_gsqs_8",
    "pr_gsqs_10",
    "pr_gsqs_12"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_gsqs_1",
      "prompt_snippet": "I had a deep sleep last night",
      "dimension": "tf",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_gsqs_2",
      "prompt_snippet": "I feel like I slept poorly last night",
      "dimension": "tf",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_gsqs_3",
      "prompt_snippet": "It took me more than half an hour to fall asleep last night",
      "dimension": "tf",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_gsqs_4",
      "prompt_snippet": "I felt tired after waking up this morning",
      "dimension": "tf",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_gsqs_5",
      "prompt_snippet": "I woke up several times last night",
      "dimension": "tf",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_gsqs_6",
      "prompt_snippet": "I feel like I didn’t get enough sleep last night",
      "dimension": "tf",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_gsqs_7",
      "prompt_snippet": "I got up in the middle of the night",
      "dimension": "tf",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_gsqs_8",
      "prompt_snippet": "I felt rested after waking up this morning",
      "dimension": "tf",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 9,
      "prompt_id": "pr_gsqs_9",
      "prompt_snippet": "I feel like I only had a couple hours of sleep last night",
      "dimension": "tf",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_gsqs_10",
      "prompt_snippet": "I feel I slept well last night",
      "dimension": "tf",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 11,
      "prompt_id": "pr_gsqs_11",
      "prompt_snippet": "I didn’t sleep a wink last night",
      "dimension": "tf",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_gsqs_12",
      "prompt_snippet": "I didn’t have any trouble falling asleep last night",
      "dimension": "tf",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 13,
      "prompt_id": "pr_gsqs_13",
      "prompt_snippet": "After I woke up last night, I had trouble falling asleep again",
      "dimension": "tf",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_gsqs_14",
      "prompt_snippet": "I tossed and turned all night last night",
      "dimension": "tf",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_gsqs_15",
      "prompt_snippet": "I didn’t get more than 5 hours sleep last night",
      "dimension": "tf",
      "values": [
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

- Items: 15
- Dimensions: tf
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_gsqs_8, pr_gsqs_10, pr_gsqs_12
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I had a deep sleep last night | tf | 1,0 | no |
| 2 | I feel like I slept poorly last night | tf | 1,0 | no |
| 3 | It took me more than half an hour to fall asleep last night | tf | 1,0 | no |
| 4 | I felt tired after waking up this morning | tf | 1,0 | no |
| 5 | I woke up several times last night | tf | 1,0 | no |
| 6 | I feel like I didn’t get enough sleep last night | tf | 1,0 | no |
| 7 | I got up in the middle of the night | tf | 1,0 | no |
| 8 | I felt rested after waking up this morning | tf | 1,0 | yes |
| 9 | I feel like I only had a couple hours of sleep last night | tf | 1,0 | no |
| 10 | I feel I slept well last night | tf | 1,0 | yes |
| 11 | I didn’t sleep a wink last night | tf | 1,0 | no |
| 12 | I didn’t have any trouble falling asleep last night | tf | 1,0 | yes |
| 13 | After I woke up last night, I had trouble falling asleep again | tf | 1,0 | no |
| 14 | I tossed and turned all night last night | tf | 1,0 | no |
| 15 | I didn’t get more than 5 hours sleep last night | tf | 1,0 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/gsqs.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
