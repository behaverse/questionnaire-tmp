# Scoring — Nurturant Fathering Scale (NFS) (`qst_nfs`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_nfs",
  "title": "Nurturant Fathering Scale (NFS)",
  "short_title": "NFS",
  "source_url": "https://us.psytoolkit.org/survey-library/nurturant-fathering.html",
  "publication": {
    "citation": "Finley, G.E. & Schwartz, S.J. (2004). The father involvement and nurturant fathering scales: retrospective measures for adolescent and adult children. Educational and Psychological Measurement, 64(1) , 143-164. DOI: 10.1177/0013164403258453.",
    "year": 2004
  },
  "status": "needs-research",
  "item_count": 9,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_nfs_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "value_range": [
        1,
        5
      ],
      "anchors": [
        "A great deal",
        "Very much",
        "Somewhat",
        "A little",
        "Not at all"
      ]
    },
    {
      "ref": "opt_nfs_rating_2",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "value_range": [
        1,
        5
      ],
      "anchors": [
        "Always there for me",
        "Often there for me",
        "Sometimes there for me",
        "Rarely there for me",
        "Never there for me"
      ]
    },
    {
      "ref": "opt_nfs_rating_3",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "value_range": [
        1,
        5
      ],
      "anchors": [
        "Always",
        "Often",
        "Sometimes",
        "Rarely",
        "Never"
      ]
    },
    {
      "ref": "opt_nfs_rating_4",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "value_range": [
        1,
        5
      ],
      "anchors": [
        "Extremely close",
        "Very close",
        "Somewhat close",
        "A little close",
        "Not at all close"
      ]
    },
    {
      "ref": "opt_nfs_rating_5",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "value_range": [
        1,
        5
      ],
      "anchors": [
        "Very well",
        "Well",
        "Ok",
        "Poorly",
        "Very poorly"
      ]
    },
    {
      "ref": "opt_nfs_rating_6",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "value_range": [
        1,
        5
      ],
      "anchors": [
        "Outstanding",
        "Very good",
        "Good",
        "Fair",
        "Poor"
      ]
    },
    {
      "ref": "opt_nfs_rating_7",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "value_range": [
        1,
        5
      ],
      "anchors": [
        "Always there",
        "Often there",
        "Sometimes there",
        "Rarely there",
        "Never there"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_nfs_1",
      "prompt_snippet": "How much do you think your father <i>enjoyed</i> being a father?",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_nfs_2",
      "prompt_snippet": "When you needed your father’s <i>support</i>, was he there for you?",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_nfs_3",
      "prompt_snippet": "Did your father have enough <i>energy</i> to meet your needs?",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_nfs_4",
      "prompt_snippet": "Did you feel that you could <i>confide in</i> (talk about important personal thi",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_nfs_5",
      "prompt_snippet": "Was your father available to spend <i>time</i> with you in activities?",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_nfs_6",
      "prompt_snippet": "How emotionally <i>close</i> were you to your father?",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_nfs_7",
      "prompt_snippet": "When you were an <i>adolescent</i> (teenager), how well did you get along with y",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_nfs_8",
      "prompt_snippet": "Overall, how would you <i>rate</i> your father?",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_nfs_9",
      "prompt_snippet": "As you go through your day, how much of a <i>psychological presence</i> does you",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1
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

- Items: 9
- Dimensions: rating
- Distinct scales: 7 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | How much do you think your father <i>enjoyed</i> being a father? | rating | 5,4,3,2,1 | no |
| 2 | When you needed your father’s <i>support</i>, was he there for you? | rating | 5,4,3,2,1 | no |
| 3 | Did your father have enough <i>energy</i> to meet your needs? | rating | 5,4,3,2,1 | no |
| 4 | Did you feel that you could <i>confide in</i> (talk about important personal thi | rating | 5,4,3,2,1 | no |
| 5 | Was your father available to spend <i>time</i> with you in activities? | rating | 5,4,3,2,1 | no |
| 6 | How emotionally <i>close</i> were you to your father? | rating | 5,4,3,2,1 | no |
| 7 | When you were an <i>adolescent</i> (teenager), how well did you get along with y | rating | 5,4,3,2,1 | no |
| 8 | Overall, how would you <i>rate</i> your father? | rating | 5,4,3,2,1 | no |
| 9 | As you go through your day, how much of a <i>psychological presence</i> does you | rating | 5,4,3,2,1 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/nurturant-fathering.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
