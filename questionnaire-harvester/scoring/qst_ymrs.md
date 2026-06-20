# Scoring — Young Mania Rating Scale (YMRS) (`qst_ymrs`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_ymrs",
  "title": "Young Mania Rating Scale (YMRS)",
  "short_title": "YMRS",
  "source_url": "https://psychology-tools.com/test/young-mania-rating-scale",
  "publication": {
    "citation": "R Young, et al. A Rating Scale for Mania: Reliability, Validity and Sensitivity. 133: Br J Psychiatry 429-435. 1978.",
    "year": 1978
  },
  "status": "needs-research",
  "item_count": 11,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_ymrs_rating_1",
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
        "Absent",
        "Mildly or possibly increased",
        "Definite subjective elevation; optimistic, self-confident; cheerful; appropriate to content",
        "Elevated, inappropriate to content; humorous",
        "Euphoric, inappropriate laughter, singing"
      ]
    },
    {
      "ref": "opt_ymrs_rating_2",
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
        "Absent",
        "Subjectively increased",
        "Animated; gestures increased",
        "Excessive energy; hyperactive at times; restless (can be calmed)",
        "Motor excitement; continuous hyperactivity (cannot be calmed)"
      ]
    },
    {
      "ref": "opt_ymrs_rating_3",
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
        "Normal; not increased",
        "Mildly or possibly increased",
        "Definite subjective increase",
        "Spontaneous sexual content; elaborates on sexual matters; hypersexual",
        "Overt sexual acts"
      ]
    },
    {
      "ref": "opt_ymrs_rating_4",
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
        "No decrease in sleep",
        "Sleeping less than normal amount by up to one hour",
        "Sleeping less than normal by more than one hour",
        "Decreased need for sleep",
        "No need for sleep at all"
      ]
    },
    {
      "ref": "opt_ymrs_rating_5",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        0,
        2,
        4,
        6,
        8
      ],
      "value_range": [
        0,
        8
      ],
      "anchors": [
        "Absent",
        "Subjectively increased",
        "Irritable at times; recent episodes of anger or annoyance",
        "Frequently irritable; short, curt",
        "Hostile, uncooperative"
      ]
    },
    {
      "ref": "opt_ymrs_rating_6",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        0,
        2,
        4,
        6,
        8
      ],
      "value_range": [
        0,
        8
      ],
      "anchors": [
        "No increase",
        "Feel talkative",
        "Increased rate or amount at times, verbose at times",
        "Push; consistently increased rate and amount;",
        "Pressured; uninterruptedly, continuous speech"
      ]
    },
    {
      "ref": "opt_ymrs_rating_7",
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
        "Absent",
        "Circumstantial; mild distractibility; quick thoughts",
        "Distractible; loses goal of thought; change topics frequently; racing thoughts",
        "Flight of ideas; tangentially; difficult to follow; rhyming, echolalia",
        "Incoherent; communication impossible"
      ]
    },
    {
      "ref": "opt_ymrs_rating_8",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        0,
        2,
        4,
        6,
        8
      ],
      "value_range": [
        0,
        8
      ],
      "anchors": [
        "Normal",
        "Questionable plans, new interests",
        "Special project(s); hyper religious",
        "Grandiose or paranoid ideas; ideas of reference",
        "Delusions; hallucinations"
      ]
    },
    {
      "ref": "opt_ymrs_rating_9",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        0,
        2,
        4,
        6,
        8
      ],
      "value_range": [
        0,
        8
      ],
      "anchors": [
        "Absent",
        "Sarcastic; loud at times, guarded",
        "Demanding; threats",
        "Threats, shouting",
        "Assaultive; destructive"
      ]
    },
    {
      "ref": "opt_ymrs_rating_10",
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
        "Appropriate dress and grooming",
        "Minimally unkempt",
        "Poorly groomed; moderately disheveled; overdressed",
        "Disheveled; partly clothed; garish make-up",
        "Completely unkempt; decorated; bizarre garb"
      ]
    },
    {
      "ref": "opt_ymrs_rating_11",
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
        "Present; admits illness; agrees with need for treatment",
        "Possibly ill",
        "Admits behavior change, but denies illness",
        "Admits possible change in behavior, but denies illness",
        "Denies any behavior change"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_ymrs_1",
      "prompt_snippet": "Elevated Mood",
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
      "prompt_id": "pr_ymrs_2",
      "prompt_snippet": "Increased Motor Activity or Energy",
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
      "prompt_id": "pr_ymrs_3",
      "prompt_snippet": "Sexual Interest",
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
      "prompt_id": "pr_ymrs_4",
      "prompt_snippet": "Sleep",
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
      "prompt_id": "pr_ymrs_5",
      "prompt_snippet": "Irritability",
      "dimension": "rating",
      "values": [
        0,
        2,
        4,
        6,
        8
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_ymrs_6",
      "prompt_snippet": "Speech: Rate & Amount",
      "dimension": "rating",
      "values": [
        0,
        2,
        4,
        6,
        8
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_ymrs_7",
      "prompt_snippet": "Language: Thought Disorder",
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
      "index": 8,
      "prompt_id": "pr_ymrs_8",
      "prompt_snippet": "Content",
      "dimension": "rating",
      "values": [
        0,
        2,
        4,
        6,
        8
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_ymrs_9",
      "prompt_snippet": "Disruptive or Aggressive Behavior",
      "dimension": "rating",
      "values": [
        0,
        2,
        4,
        6,
        8
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_ymrs_10",
      "prompt_snippet": "Appearance",
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
      "index": 11,
      "prompt_id": "pr_ymrs_11",
      "prompt_snippet": "Insight",
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

- Items: 11
- Dimensions: rating
- Distinct scales: 11 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Elevated Mood | rating | 0,1,2,3,4 | no |
| 2 | Increased Motor Activity or Energy | rating | 0,1,2,3,4 | no |
| 3 | Sexual Interest | rating | 0,1,2,3,4 | no |
| 4 | Sleep | rating | 0,1,2,3,4 | no |
| 5 | Irritability | rating | 0,2,4,6,8 | no |
| 6 | Speech: Rate & Amount | rating | 0,2,4,6,8 | no |
| 7 | Language: Thought Disorder | rating | 0,1,2,3,4 | no |
| 8 | Content | rating | 0,2,4,6,8 | no |
| 9 | Disruptive or Aggressive Behavior | rating | 0,2,4,6,8 | no |
| 10 | Appearance | rating | 0,1,2,3,4 | no |
| 11 | Insight | rating | 0,1,2,3,4 | no |

## To research (fill from https://psychology-tools.com/test/young-mania-rating-scale)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
