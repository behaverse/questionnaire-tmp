# Scoring — General Procrastination Scale (`qst_gp`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_gp",
  "title": "General Procrastination Scale",
  "short_title": "General Procrastination Scale",
  "source_url": "https://us.psytoolkit.org/survey-library/procrastination-gp.html",
  "publication": {
    "citation": "Lay, C.H. (1986). At Last, My Research Article on\nProcrastination. Journal of Research in Personality, 20 , 474-495.",
    "year": 1986
  },
  "status": "needs-research",
  "item_count": 20,
  "dimensions": [
    "characteristic"
  ],
  "option_scales": [
    {
      "ref": "opt_gp_characteristic_5",
      "dimension": "characteristic",
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
        "extremely uncharacteristic",
        "moderately uncharacteristic",
        "neutral",
        "moderately characteristic",
        "extremely characteristic"
      ]
    }
  ],
  "reversed_items": [
    "pr_gp_3",
    "pr_gp_4",
    "pr_gp_6",
    "pr_gp_8",
    "pr_gp_11",
    "pr_gp_13",
    "pr_gp_14",
    "pr_gp_15",
    "pr_gp_18",
    "pr_gp_20"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_gp_1",
      "prompt_snippet": "I often find myself performing tasks that I had intended to do days before.",
      "dimension": "characteristic",
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
      "prompt_id": "pr_gp_2",
      "prompt_snippet": "I do not do assignments until just before they are to be handed in.",
      "dimension": "characteristic",
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
      "prompt_id": "pr_gp_3",
      "prompt_snippet": "When I am finished with a library book, I return it right away regardless of the",
      "dimension": "characteristic",
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
      "index": 4,
      "prompt_id": "pr_gp_4",
      "prompt_snippet": "When it is time to get up in the morning, I most often get right out of bed.",
      "dimension": "characteristic",
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
      "prompt_id": "pr_gp_5",
      "prompt_snippet": "A letter may sit for days after I write it before mailing it.",
      "dimension": "characteristic",
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
      "prompt_id": "pr_gp_6",
      "prompt_snippet": "I generally return phone calls promptly.",
      "dimension": "characteristic",
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
      "index": 7,
      "prompt_id": "pr_gp_7",
      "prompt_snippet": "Even with jobs that require little else except sitting down and doing them, I fi",
      "dimension": "characteristic",
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
      "prompt_id": "pr_gp_8",
      "prompt_snippet": "I usually make decisions as soon as possible.",
      "dimension": "characteristic",
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
      "index": 9,
      "prompt_id": "pr_gp_9",
      "prompt_snippet": "I generally delay before starting on work I have to do.",
      "dimension": "characteristic",
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
      "prompt_id": "pr_gp_10",
      "prompt_snippet": "I usually have to rush to complete a task on time.",
      "dimension": "characteristic",
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
      "prompt_id": "pr_gp_11",
      "prompt_snippet": "When preparing to go out, I am seldom caught having to do something at the last ",
      "dimension": "characteristic",
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
      "index": 12,
      "prompt_id": "pr_gp_12",
      "prompt_snippet": "In preparing for some deadline, I often waste time by doing other things.",
      "dimension": "characteristic",
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
      "index": 13,
      "prompt_id": "pr_gp_13",
      "prompt_snippet": "I prefer to leave early for an appointment.",
      "dimension": "characteristic",
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
      "index": 14,
      "prompt_id": "pr_gp_14",
      "prompt_snippet": "I usually start an assignment shortly after it is assigned.",
      "dimension": "characteristic",
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
      "index": 15,
      "prompt_id": "pr_gp_15",
      "prompt_snippet": "I often have a task finished sooner than necessary.",
      "dimension": "characteristic",
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
      "index": 16,
      "prompt_id": "pr_gp_16",
      "prompt_snippet": "I always seem to end up shopping for birthday or Christmas gifts at the last min",
      "dimension": "characteristic",
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
      "index": 17,
      "prompt_id": "pr_gp_17",
      "prompt_snippet": "I usually buy even an essential item at the last minute.",
      "dimension": "characteristic",
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
      "index": 18,
      "prompt_id": "pr_gp_18",
      "prompt_snippet": "I usually accomplish all the things I plan to do in a day.",
      "dimension": "characteristic",
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
      "index": 19,
      "prompt_id": "pr_gp_19",
      "prompt_snippet": "I am continually saying \"I'll do it tomorrow\".",
      "dimension": "characteristic",
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
      "index": 20,
      "prompt_id": "pr_gp_20",
      "prompt_snippet": "I usually take care of all the tasks I have to do before I settle down and relax",
      "dimension": "characteristic",
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

- Items: 20
- Dimensions: characteristic
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_gp_3, pr_gp_4, pr_gp_6, pr_gp_8, pr_gp_11, pr_gp_13, pr_gp_14, pr_gp_15, pr_gp_18, pr_gp_20
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I often find myself performing tasks that I had intended to do days before. | characteristic | 1,2,3,4,5 | no |
| 2 | I do not do assignments until just before they are to be handed in. | characteristic | 1,2,3,4,5 | no |
| 3 | When I am finished with a library book, I return it right away regardless of the | characteristic | 1,2,3,4,5 | yes |
| 4 | When it is time to get up in the morning, I most often get right out of bed. | characteristic | 1,2,3,4,5 | yes |
| 5 | A letter may sit for days after I write it before mailing it. | characteristic | 1,2,3,4,5 | no |
| 6 | I generally return phone calls promptly. | characteristic | 1,2,3,4,5 | yes |
| 7 | Even with jobs that require little else except sitting down and doing them, I fi | characteristic | 1,2,3,4,5 | no |
| 8 | I usually make decisions as soon as possible. | characteristic | 1,2,3,4,5 | yes |
| 9 | I generally delay before starting on work I have to do. | characteristic | 1,2,3,4,5 | no |
| 10 | I usually have to rush to complete a task on time. | characteristic | 1,2,3,4,5 | no |
| 11 | When preparing to go out, I am seldom caught having to do something at the last  | characteristic | 1,2,3,4,5 | yes |
| 12 | In preparing for some deadline, I often waste time by doing other things. | characteristic | 1,2,3,4,5 | no |
| 13 | I prefer to leave early for an appointment. | characteristic | 1,2,3,4,5 | yes |
| 14 | I usually start an assignment shortly after it is assigned. | characteristic | 1,2,3,4,5 | yes |
| 15 | I often have a task finished sooner than necessary. | characteristic | 1,2,3,4,5 | yes |
| 16 | I always seem to end up shopping for birthday or Christmas gifts at the last min | characteristic | 1,2,3,4,5 | no |
| 17 | I usually buy even an essential item at the last minute. | characteristic | 1,2,3,4,5 | no |
| 18 | I usually accomplish all the things I plan to do in a day. | characteristic | 1,2,3,4,5 | yes |
| 19 | I am continually saying "I'll do it tomorrow". | characteristic | 1,2,3,4,5 | no |
| 20 | I usually take care of all the tasks I have to do before I settle down and relax | characteristic | 1,2,3,4,5 | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/procrastination-gp.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
