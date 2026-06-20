# Scoring — Short Grit Scale (Grit-S) (`qst_grits`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_grits",
  "title": "Short Grit Scale (Grit-S)",
  "short_title": "Grit-S",
  "source_url": "https://us.psytoolkit.org/survey-library/grit-short.html",
  "publication": {
    "citation": "Duckworth, A.L., Peterson, C., Matthews, M.D., & Kelly, D.R. (2007). Grit: Perseverance and\npassion for long-term goals. Journal of Personality and Social Psychology, 9 , 1087-1101. Free download via Research Gate",
    "year": 2007
  },
  "status": "needs-research",
  "item_count": 8,
  "dimensions": [
    "grit"
  ],
  "option_scales": [
    {
      "ref": "opt_grits_grit_5",
      "dimension": "grit",
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
        "Very much like me",
        "Mostly like me",
        "Somewhat like me",
        "Not much like me",
        "Not like me at all"
      ]
    }
  ],
  "reversed_items": [
    "pr_grits_2",
    "pr_grits_4",
    "pr_grits_7",
    "pr_grits_8"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_grits_1",
      "prompt_snippet": "New ideas and projects sometimes distract me from previous ones.",
      "dimension": "grit",
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
      "prompt_id": "pr_grits_2",
      "prompt_snippet": "Setbacks don’t discourage me.",
      "dimension": "grit",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": true
    },
    {
      "index": 3,
      "prompt_id": "pr_grits_3",
      "prompt_snippet": "I have been obsessed with a certain idea or project for a short time but later l",
      "dimension": "grit",
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
      "prompt_id": "pr_grits_4",
      "prompt_snippet": "I am a hard worker.",
      "dimension": "grit",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": true
    },
    {
      "index": 5,
      "prompt_id": "pr_grits_5",
      "prompt_snippet": "I often set a goal but later choose to pursue a different one.",
      "dimension": "grit",
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
      "prompt_id": "pr_grits_6",
      "prompt_snippet": "I have difficulty maintaining my focus on projects that take more than a few mon",
      "dimension": "grit",
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
      "index": 7,
      "prompt_id": "pr_grits_7",
      "prompt_snippet": "I finish whatever I begin.",
      "dimension": "grit",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": true
    },
    {
      "index": 8,
      "prompt_id": "pr_grits_8",
      "prompt_snippet": "I am diligent.",
      "dimension": "grit",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": true
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

- Items: 8
- Dimensions: grit
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_grits_2, pr_grits_4, pr_grits_7, pr_grits_8
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | New ideas and projects sometimes distract me from previous ones. | grit | 1,2,3,4,5 | no |
| 2 | Setbacks don’t discourage me. | grit | 1,2,3,4,5 | yes |
| 3 | I have been obsessed with a certain idea or project for a short time but later l | grit | 1,2,3,4,5 | no |
| 4 | I am a hard worker. | grit | 1,2,3,4,5 | yes |
| 5 | I often set a goal but later choose to pursue a different one. | grit | 1,2,3,4,5 | no |
| 6 | I have difficulty maintaining my focus on projects that take more than a few mon | grit | 1,2,3,4,5 | no |
| 7 | I finish whatever I begin. | grit | 1,2,3,4,5 | yes |
| 8 | I am diligent. | grit | 1,2,3,4,5 | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/grit-short.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
