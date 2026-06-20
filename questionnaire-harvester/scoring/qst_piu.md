# Scoring — Pathological Internet Use (PIU) (`qst_piu`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_piu",
  "title": "Pathological Internet Use (PIU)",
  "short_title": "PIU",
  "source_url": "https://us.psytoolkit.org/survey-library/addiction-internet-piu.html",
  "publication": {
    "citation": "Morahan-Martin, J. and Schumacher, P. (2000). Incidence and\ncorrelates of pathological Internet use among college\nstudents. Computers in Human Behavior, 16 , 13-29.",
    "year": 2000
  },
  "status": "needs-research",
  "item_count": 13,
  "dimensions": [
    "piu_yes_no"
  ],
  "option_scales": [
    {
      "ref": "opt_piu_piu_yes_no_2",
      "dimension": "piu_yes_no",
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
        "yes",
        "no"
      ]
    }
  ],
  "reversed_items": [
    "pr_piu_1",
    "pr_piu_4"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_piu_1",
      "prompt_snippet": "I have <u><b>never</b></u> gotten into arguments with a signicant other over bei",
      "dimension": "piu_yes_no",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 2,
      "prompt_id": "pr_piu_2",
      "prompt_snippet": "I have been told I spend too much time online",
      "dimension": "piu_yes_no",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_piu_3",
      "prompt_snippet": "If it has been a while since I last logged on, I find it hard to stop thinking a",
      "dimension": "piu_yes_no",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_piu_4",
      "prompt_snippet": "My work and/or school performance has <u><b>not</b></u> deteriorated since I sta",
      "dimension": "piu_yes_no",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 5,
      "prompt_id": "pr_piu_5",
      "prompt_snippet": "I feel guilty about the amount of time I spend online",
      "dimension": "piu_yes_no",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_piu_6",
      "prompt_snippet": "I have gone online to make myself feel better when I was down or anxious",
      "dimension": "piu_yes_no",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_piu_7",
      "prompt_snippet": "I have attempted to spend less time online but have not been able to",
      "dimension": "piu_yes_no",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_piu_8",
      "prompt_snippet": "I have routinely cut short on sleep to spend more time online",
      "dimension": "piu_yes_no",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_piu_9",
      "prompt_snippet": "I have used online to talk to others at times when I was feeling isolated",
      "dimension": "piu_yes_no",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_piu_10",
      "prompt_snippet": "I have missed classes or work because of online activities",
      "dimension": "piu_yes_no",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_piu_11",
      "prompt_snippet": "I have gotten into trouble with my employer or school because of being online",
      "dimension": "piu_yes_no",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_piu_12",
      "prompt_snippet": "I have missed social engagements because of online activities",
      "dimension": "piu_yes_no",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_piu_13",
      "prompt_snippet": "I have tried to hide from others how much time I am actually online",
      "dimension": "piu_yes_no",
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

- Items: 13
- Dimensions: piu_yes_no
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_piu_1, pr_piu_4
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I have <u><b>never</b></u> gotten into arguments with a signicant other over bei | piu_yes_no | 1,0 | yes |
| 2 | I have been told I spend too much time online | piu_yes_no | 1,0 | no |
| 3 | If it has been a while since I last logged on, I find it hard to stop thinking a | piu_yes_no | 1,0 | no |
| 4 | My work and/or school performance has <u><b>not</b></u> deteriorated since I sta | piu_yes_no | 1,0 | yes |
| 5 | I feel guilty about the amount of time I spend online | piu_yes_no | 1,0 | no |
| 6 | I have gone online to make myself feel better when I was down or anxious | piu_yes_no | 1,0 | no |
| 7 | I have attempted to spend less time online but have not been able to | piu_yes_no | 1,0 | no |
| 8 | I have routinely cut short on sleep to spend more time online | piu_yes_no | 1,0 | no |
| 9 | I have used online to talk to others at times when I was feeling isolated | piu_yes_no | 1,0 | no |
| 10 | I have missed classes or work because of online activities | piu_yes_no | 1,0 | no |
| 11 | I have gotten into trouble with my employer or school because of being online | piu_yes_no | 1,0 | no |
| 12 | I have missed social engagements because of online activities | piu_yes_no | 1,0 | no |
| 13 | I have tried to hide from others how much time I am actually online | piu_yes_no | 1,0 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/addiction-internet-piu.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
