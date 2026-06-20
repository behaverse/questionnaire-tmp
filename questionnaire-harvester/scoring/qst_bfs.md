# Scoring — Bullshitting Frequency Scale (BFS) (`qst_bfs`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_bfs",
  "title": "Bullshitting Frequency Scale (BFS)",
  "short_title": "BFS",
  "source_url": "https://us.psytoolkit.org/survey-library/bfs.html",
  "publication": {
    "citation": "Littrell, S., Risko, E.F. and Fugelsang, J.A. (2021), The\nBullshitting Frequency Scale: Development and psychometric\nproperties. Br. J. Soc. Psychol., 60: 248-270\ne12379. https://doi.org/10.1111/bjso.12379",
    "year": 2021
  },
  "status": "needs-research",
  "item_count": 12,
  "dimensions": [
    "bfsscale"
  ],
  "option_scales": [
    {
      "ref": "opt_bfs_bfsscale_5",
      "dimension": "bfsscale",
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
        "Never",
        "Rarely",
        "Occasionally / Sometimes",
        "Frequently",
        "A lot / All the time"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_bfs_1",
      "prompt_snippet": "When I want to impress the person or people I'm talking to.",
      "dimension": "bfsscale",
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
      "prompt_id": "pr_bfs_2",
      "prompt_snippet": "When I want others to see me as more intelligent or knowledgeable.",
      "dimension": "bfsscale",
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
      "index": 3,
      "prompt_id": "pr_bfs_3",
      "prompt_snippet": "When I want to contribute to a conversation or discussion even though I’m not we",
      "dimension": "bfsscale",
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
      "prompt_id": "pr_bfs_4",
      "prompt_snippet": "By pretending to know more about a topic than I actually do.",
      "dimension": "bfsscale",
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
      "index": 5,
      "prompt_id": "pr_bfs_5",
      "prompt_snippet": "When I'm trying to fit in better or be more accepted by the person or people I'm",
      "dimension": "bfsscale",
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
      "prompt_id": "pr_bfs_6",
      "prompt_snippet": "When I know it will be easy to get away with it.",
      "dimension": "bfsscale",
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
      "prompt_id": "pr_bfs_7",
      "prompt_snippet": "When I want the thing(s) I'm talking about to sound more interesting or exciting",
      "dimension": "bfsscale",
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
      "index": 8,
      "prompt_id": "pr_bfs_8",
      "prompt_snippet": "When I’m trying to persuade someone to change their mind or agree with what I’m ",
      "dimension": "bfsscale",
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
      "index": 9,
      "prompt_id": "pr_bfs_9",
      "prompt_snippet": "When being fully honest would be harmful or embarrassing to me or someone else.",
      "dimension": "bfsscale",
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
      "index": 10,
      "prompt_id": "pr_bfs_10",
      "prompt_snippet": "When a direct answer might get me in trouble.",
      "dimension": "bfsscale",
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
      "index": 11,
      "prompt_id": "pr_bfs_11",
      "prompt_snippet": "When I don't want to tell someone what I really think.",
      "dimension": "bfsscale",
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
      "index": 12,
      "prompt_id": "pr_bfs_12",
      "prompt_snippet": "When a direct answer would hurt another person's feelings",
      "dimension": "bfsscale",
      "values": [
        1,
        2,
        3,
        4,
        5
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

- Items: 12
- Dimensions: bfsscale
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | When I want to impress the person or people I'm talking to. | bfsscale | 1,2,3,4,5 | no |
| 2 | When I want others to see me as more intelligent or knowledgeable. | bfsscale | 1,2,3,4,5 | no |
| 3 | When I want to contribute to a conversation or discussion even though I’m not we | bfsscale | 1,2,3,4,5 | no |
| 4 | By pretending to know more about a topic than I actually do. | bfsscale | 1,2,3,4,5 | no |
| 5 | When I'm trying to fit in better or be more accepted by the person or people I'm | bfsscale | 1,2,3,4,5 | no |
| 6 | When I know it will be easy to get away with it. | bfsscale | 1,2,3,4,5 | no |
| 7 | When I want the thing(s) I'm talking about to sound more interesting or exciting | bfsscale | 1,2,3,4,5 | no |
| 8 | When I’m trying to persuade someone to change their mind or agree with what I’m  | bfsscale | 1,2,3,4,5 | no |
| 9 | When being fully honest would be harmful or embarrassing to me or someone else. | bfsscale | 1,2,3,4,5 | no |
| 10 | When a direct answer might get me in trouble. | bfsscale | 1,2,3,4,5 | no |
| 11 | When I don't want to tell someone what I really think. | bfsscale | 1,2,3,4,5 | no |
| 12 | When a direct answer would hurt another person's feelings | bfsscale | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/bfs.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
