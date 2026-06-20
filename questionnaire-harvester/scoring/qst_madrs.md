# Scoring — Montgomery-Asberg Depression Rating Scale (MADRS) (`qst_madrs`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_madrs",
  "title": "Montgomery-Asberg Depression Rating Scale (MADRS)",
  "short_title": "MADRS",
  "source_url": "https://psychology-tools.com/test/montgomery-asberg-depression-rating-scale",
  "publication": null,
  "status": "needs-research",
  "item_count": 10,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_madrs_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 7,
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "value_range": [
        0,
        6
      ],
      "anchors": [
        "(0) No sadness.",
        "(1)",
        "(2) Looks dispirited but does brighten up without difficulty.",
        "(3)",
        "(4) Appears sad and unhappy most of the time.",
        "(5)",
        "(6) Looks miserable all the time. Extremely despondent."
      ]
    },
    {
      "ref": "opt_madrs_rating_2",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 7,
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "value_range": [
        0,
        6
      ],
      "anchors": [
        "(0) Occasional sadness in keeping with the circumstances.",
        "(1)",
        "(2) Sad or low but brightens up without difficulty.",
        "(3)",
        "(4) Pervasive feelings of sadness or gloominess. The mood is still influenced by external circumstances.",
        "(5)",
        "(6) Continuous or unvarying sadness, misery or despondency."
      ]
    },
    {
      "ref": "opt_madrs_rating_3",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 7,
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "value_range": [
        0,
        6
      ],
      "anchors": [
        "(0) Placid. Only fleeting inner tension.",
        "(1)",
        "(2) Occasional feelings of edginess and ill-defined discomfort.",
        "(3)",
        "(4) Continuous feelings of inner tension or intermittent panic which the patient can only master with some difficulty.",
        "(5)",
        "(6) Unrelenting dread or anguish. Overwhelming panic."
      ]
    },
    {
      "ref": "opt_madrs_rating_4",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 7,
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "value_range": [
        0,
        6
      ],
      "anchors": [
        "(0) Sleeps as usual.",
        "(1)",
        "(2) Slight difficulty dropping off to sleep or slightly reduced, light or fitful sleep.",
        "(3)",
        "(4) Sleep reduced or broken by at least two hours.",
        "(5)",
        "(6) Less than two or three hours sleep."
      ]
    },
    {
      "ref": "opt_madrs_rating_5",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 7,
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "value_range": [
        0,
        6
      ],
      "anchors": [
        "(0) Normal or increased appetite.",
        "(1)",
        "(2) Slightly reduced appetite.",
        "(3)",
        "(4) No appetite. Food is tasteless.",
        "(5)",
        "(6) Needs persuasion to eat at all."
      ]
    },
    {
      "ref": "opt_madrs_rating_6",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 7,
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "value_range": [
        0,
        6
      ],
      "anchors": [
        "(0) No difficulties in concentrating.",
        "(1)",
        "(2) Occasional difficulties in collecting one’s thoughts.",
        "(3)",
        "(4) Difficulties in concentrating and sustaining thought which reduces ability to read or hold a conversation.",
        "(5)",
        "(6) Unable to read or converse without great difficulty."
      ]
    },
    {
      "ref": "opt_madrs_rating_7",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 7,
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "value_range": [
        0,
        6
      ],
      "anchors": [
        "(0) Hardly any difficulties in getting started. No sluggishness.",
        "(1)",
        "(2) Difficulties in starting activities.",
        "(3)",
        "(4) Difficulties in starting simple routine activities, which are carried out with effort.",
        "(5)",
        "(6) Complete lassitude. Unable to do anything without help."
      ]
    },
    {
      "ref": "opt_madrs_rating_8",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 7,
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "value_range": [
        0,
        6
      ],
      "anchors": [
        "(0) Normal interest in the surroundings and in other people.",
        "(1)",
        "(2) Reduced ability to enjoy usual interests.",
        "(3)",
        "(4) Loss of interest in the surroundings. Loss of feelings for friends and acquaintances.",
        "(5)",
        "(6) The experience of being emotionally paralyzed, inability to feel anger, grief or pleasure and a complete or even painful failure to feel for close relatives and friends."
      ]
    },
    {
      "ref": "opt_madrs_rating_9",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 7,
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "value_range": [
        0,
        6
      ],
      "anchors": [
        "(0) No pessimistic thoughts.",
        "(1)",
        "(2) Fluctuating ideas of failure, self-reproach or self-depreciation.",
        "(3)",
        "(4) Persistent self-accusations, or definite but still rational ideas of guilt or sin. Increasingly pessimistic about the future.",
        "(5)",
        "(6) Delusions of ruin, remorse and irredeemable sin. Self-accusations which are absurd and unshakable."
      ]
    },
    {
      "ref": "opt_madrs_rating_10",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 7,
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "value_range": [
        0,
        6
      ],
      "anchors": [
        "(0) Enjoys life or takes it as it comes.",
        "(1)",
        "(2) Weary of life. Only fleeting suicidal thoughts.",
        "(3)",
        "(4) Probably better off dead. Suicidal thoughts are common, and suicide is considered as a possible solution, but without specific plans or intention.",
        "(5)",
        "(6) Explicit plans for suicide when there is an opportunity. Active preparations for suicide."
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_madrs_1",
      "prompt_snippet": "Apparent Sadness Representing despondency, gloom and despair, (more than just or",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_madrs_2",
      "prompt_snippet": "Reported Sadness Representing reports of depressed mood, regardless of whether i",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_madrs_3",
      "prompt_snippet": "Inner Tension Representing feelings of ill-defined discomfort, edginess, inner t",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_madrs_4",
      "prompt_snippet": "Reduced Sleep Representing the experience of reduced duration or depth of sleep ",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_madrs_5",
      "prompt_snippet": "Reduced Appetite Representing the feeling of a loss of appetite compared with wh",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_madrs_6",
      "prompt_snippet": "Concentration Difficulties Representing difficulties in collecting one’s thought",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_madrs_7",
      "prompt_snippet": "Lassitude Representing a difficulty getting started or slowness initiating and p",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_madrs_8",
      "prompt_snippet": "Inability to Feel Representing the subjective experience of reduced interest in ",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_madrs_9",
      "prompt_snippet": "Pessimistic Thoughts Representing thoughts of guilt, inferiority, self-reproach,",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_madrs_10",
      "prompt_snippet": "Suicidal Thoughts Representing the feeling that life is not worth living, that a",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
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
| 1 | Apparent Sadness Representing despondency, gloom and despair, (more than just or | rating | 0,1,2,3,4,5,6 | no |
| 2 | Reported Sadness Representing reports of depressed mood, regardless of whether i | rating | 0,1,2,3,4,5,6 | no |
| 3 | Inner Tension Representing feelings of ill-defined discomfort, edginess, inner t | rating | 0,1,2,3,4,5,6 | no |
| 4 | Reduced Sleep Representing the experience of reduced duration or depth of sleep  | rating | 0,1,2,3,4,5,6 | no |
| 5 | Reduced Appetite Representing the feeling of a loss of appetite compared with wh | rating | 0,1,2,3,4,5,6 | no |
| 6 | Concentration Difficulties Representing difficulties in collecting one’s thought | rating | 0,1,2,3,4,5,6 | no |
| 7 | Lassitude Representing a difficulty getting started or slowness initiating and p | rating | 0,1,2,3,4,5,6 | no |
| 8 | Inability to Feel Representing the subjective experience of reduced interest in  | rating | 0,1,2,3,4,5,6 | no |
| 9 | Pessimistic Thoughts Representing thoughts of guilt, inferiority, self-reproach, | rating | 0,1,2,3,4,5,6 | no |
| 10 | Suicidal Thoughts Representing the feeling that life is not worth living, that a | rating | 0,1,2,3,4,5,6 | no |

## To research (fill from https://psychology-tools.com/test/montgomery-asberg-depression-rating-scale)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
