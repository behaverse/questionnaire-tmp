# Scoring — Positive Thinking Scale (`qst_pts`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_pts",
  "title": "Positive Thinking Scale",
  "short_title": "Positive Thinking Scale",
  "source_url": "https://us.psytoolkit.org/survey-library/pts.html",
  "publication": {
    "citation": "Diener, E., Wirtz, D., Tov, W., Kim-Prieto, C., Choi. D., Oishi, S.,\n& Biswas-Diener, R. (2009). New measures of well-being: Flourishing\nand positive and negative feelings. Social Indicators Research,\n39 ,\n247-266. Online\navailable here .",
    "year": 2009
  },
  "status": "needs-research",
  "item_count": 22,
  "dimensions": [
    "yesno"
  ],
  "option_scales": [
    {
      "ref": "opt_pts_yesno_2",
      "dimension": "yesno",
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
        "Yes",
        "No"
      ]
    }
  ],
  "reversed_items": [
    "pr_pts_1",
    "pr_pts_4",
    "pr_pts_7",
    "pr_pts_10",
    "pr_pts_11",
    "pr_pts_12",
    "pr_pts_15",
    "pr_pts_17",
    "pr_pts_19",
    "pr_pts_20",
    "pr_pts_21"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_pts_1",
      "prompt_snippet": "I see my community as a place full of problems.",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 2,
      "prompt_id": "pr_pts_2",
      "prompt_snippet": "I see much beauty around me.",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_pts_3",
      "prompt_snippet": "I see the good in most people.",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_pts_4",
      "prompt_snippet": "When I think of myself, I think of many shortcomings.",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 5,
      "prompt_id": "pr_pts_5",
      "prompt_snippet": "I think of myself as a person with many strengths.",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_pts_6",
      "prompt_snippet": "I am optimistic about my future.",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_pts_7",
      "prompt_snippet": "When somebody does something for me, I usually wonder if they have an ulterior m",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 8,
      "prompt_id": "pr_pts_8",
      "prompt_snippet": "When something bad happens, I often see a “silver lining,” something good in the",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_pts_9",
      "prompt_snippet": "I sometimes think about how fortunate I have been in life.",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_pts_10",
      "prompt_snippet": "When good things happen, I wonder if they might have been even better.",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 11,
      "prompt_id": "pr_pts_11",
      "prompt_snippet": "I frequently compare myself to others.",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 12,
      "prompt_id": "pr_pts_12",
      "prompt_snippet": "I think frequently about opportunities that I missed.",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 13,
      "prompt_id": "pr_pts_13",
      "prompt_snippet": "When I think of the past, the happy times are most salient to me.",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_pts_14",
      "prompt_snippet": "I savor memories of pleasant past times.",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_pts_15",
      "prompt_snippet": "I regret many things from my past.",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 16,
      "prompt_id": "pr_pts_16",
      "prompt_snippet": "When I see others prosper, even strangers, I am happy for them.",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_pts_17",
      "prompt_snippet": "When I think of the past, for some reason the bad things stand out.",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 18,
      "prompt_id": "pr_pts_18",
      "prompt_snippet": "I know the world has problems, but it seems like a wonderful place anyway.",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_pts_19",
      "prompt_snippet": "When something bad happens, I ruminate on it for a long time.",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 20,
      "prompt_id": "pr_pts_20",
      "prompt_snippet": "When good things happen, I wonder if they will soon turn sour.",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 21,
      "prompt_id": "pr_pts_21",
      "prompt_snippet": "When I see others prosper, it makes me feel bad about myself.",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 22,
      "prompt_id": "pr_pts_22",
      "prompt_snippet": "I believe in the good qualities of other people.",
      "dimension": "yesno",
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

- Items: 22
- Dimensions: yesno
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_pts_1, pr_pts_4, pr_pts_7, pr_pts_10, pr_pts_11, pr_pts_12, pr_pts_15, pr_pts_17, pr_pts_19, pr_pts_20, pr_pts_21
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I see my community as a place full of problems. | yesno | 1,0 | yes |
| 2 | I see much beauty around me. | yesno | 1,0 | no |
| 3 | I see the good in most people. | yesno | 1,0 | no |
| 4 | When I think of myself, I think of many shortcomings. | yesno | 1,0 | yes |
| 5 | I think of myself as a person with many strengths. | yesno | 1,0 | no |
| 6 | I am optimistic about my future. | yesno | 1,0 | no |
| 7 | When somebody does something for me, I usually wonder if they have an ulterior m | yesno | 1,0 | yes |
| 8 | When something bad happens, I often see a “silver lining,” something good in the | yesno | 1,0 | no |
| 9 | I sometimes think about how fortunate I have been in life. | yesno | 1,0 | no |
| 10 | When good things happen, I wonder if they might have been even better. | yesno | 1,0 | yes |
| 11 | I frequently compare myself to others. | yesno | 1,0 | yes |
| 12 | I think frequently about opportunities that I missed. | yesno | 1,0 | yes |
| 13 | When I think of the past, the happy times are most salient to me. | yesno | 1,0 | no |
| 14 | I savor memories of pleasant past times. | yesno | 1,0 | no |
| 15 | I regret many things from my past. | yesno | 1,0 | yes |
| 16 | When I see others prosper, even strangers, I am happy for them. | yesno | 1,0 | no |
| 17 | When I think of the past, for some reason the bad things stand out. | yesno | 1,0 | yes |
| 18 | I know the world has problems, but it seems like a wonderful place anyway. | yesno | 1,0 | no |
| 19 | When something bad happens, I ruminate on it for a long time. | yesno | 1,0 | yes |
| 20 | When good things happen, I wonder if they will soon turn sour. | yesno | 1,0 | yes |
| 21 | When I see others prosper, it makes me feel bad about myself. | yesno | 1,0 | yes |
| 22 | I believe in the good qualities of other people. | yesno | 1,0 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/pts.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
