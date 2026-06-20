# Scoring — Diagnostic Screen for Gambling Disorders (NODS-CLiP) (`qst_nodscl`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_nodscl",
  "title": "Diagnostic Screen for Gambling Disorders (NODS-CLiP)",
  "short_title": "NODS-CLiP",
  "source_url": "https://psychology-tools.com/test/nods-clip",
  "publication": {
    "citation": "H Xian, K R Shah, S M Phillips, J F Scherrer, R Volberg, A Eisen. Association of cognitive distortions with problem and pathological gambling in adult male twins. 160(3): Psychiatry Res 300-307. 2008.",
    "year": 2008
  },
  "status": "needs-research",
  "item_count": 17,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_nodscl_rating_1",
      "dimension": "rating",
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
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_nodscl_1",
      "prompt_snippet": "Have there ever been periods lasting 2 weeks or longer when you spent a lot of t",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_nodscl_2",
      "prompt_snippet": "Have there ever been periods lasting two weeks or longer when you spend a lot of",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_nodscl_3",
      "prompt_snippet": "Have you ever lied to family members, friends, or others about how much you gamb",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_nodscl_4",
      "prompt_snippet": "If so, had this happened three or more times?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_nodscl_5",
      "prompt_snippet": "Have you ever tried to stop, cut down, or control your gambling?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_nodscl_6",
      "prompt_snippet": "On one or more of the times when you tried to stop, cut down, or control your ga",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_nodscl_7",
      "prompt_snippet": "Have you ever tried but not succeeded in stopping, cutting down, or controlling ",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_nodscl_8",
      "prompt_snippet": "Has this happened three or more times?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_nodscl_9",
      "prompt_snippet": "Have there ever been periods when you needed to gamble with increasing amounts o",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_nodscl_10",
      "prompt_snippet": "Have you ever gambled to relieve uncomfortable feelings such as guilt, anxiety, ",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_nodscl_11",
      "prompt_snippet": "Have you ever gambled as a way to escape from personal problems?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_nodscl_12",
      "prompt_snippet": "Has there ever been a period when, if you lost money gambling one day, you would",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_nodscl_13",
      "prompt_snippet": "Have you ever written a bad check or taken money that didn’t belong to you from ",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_nodscl_14",
      "prompt_snippet": "Has your gambling ever caused serious or repeated problems in your relationships",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_nodscl_15",
      "prompt_snippet": "Has your gambling caused you any problems in school, such as missing classes or ",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_nodscl_16",
      "prompt_snippet": "Has your gambling ever caused you to lose a job, have trouble with your job, or ",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_nodscl_17",
      "prompt_snippet": "Have you ever needed to ask family members or anyone else to loan you money or o",
      "dimension": "rating",
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

- Items: 17
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Have there ever been periods lasting 2 weeks or longer when you spent a lot of t | rating | 1,0 | no |
| 2 | Have there ever been periods lasting two weeks or longer when you spend a lot of | rating | 1,0 | no |
| 3 | Have you ever lied to family members, friends, or others about how much you gamb | rating | 1,0 | no |
| 4 | If so, had this happened three or more times? | rating | 1,0 | no |
| 5 | Have you ever tried to stop, cut down, or control your gambling? | rating | 1,0 | no |
| 6 | On one or more of the times when you tried to stop, cut down, or control your ga | rating | 1,0 | no |
| 7 | Have you ever tried but not succeeded in stopping, cutting down, or controlling  | rating | 1,0 | no |
| 8 | Has this happened three or more times? | rating | 1,0 | no |
| 9 | Have there ever been periods when you needed to gamble with increasing amounts o | rating | 1,0 | no |
| 10 | Have you ever gambled to relieve uncomfortable feelings such as guilt, anxiety,  | rating | 1,0 | no |
| 11 | Have you ever gambled as a way to escape from personal problems? | rating | 1,0 | no |
| 12 | Has there ever been a period when, if you lost money gambling one day, you would | rating | 1,0 | no |
| 13 | Have you ever written a bad check or taken money that didn’t belong to you from  | rating | 1,0 | no |
| 14 | Has your gambling ever caused serious or repeated problems in your relationships | rating | 1,0 | no |
| 15 | Has your gambling caused you any problems in school, such as missing classes or  | rating | 1,0 | no |
| 16 | Has your gambling ever caused you to lose a job, have trouble with your job, or  | rating | 1,0 | no |
| 17 | Have you ever needed to ask family members or anyone else to loan you money or o | rating | 1,0 | no |

## To research (fill from https://psychology-tools.com/test/nods-clip)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
