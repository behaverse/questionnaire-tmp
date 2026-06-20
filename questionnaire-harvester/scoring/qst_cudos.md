# Scoring — A clinically useful depression outcome scale (CUDOS) (`qst_cudos`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_cudos",
  "title": "A clinically useful depression outcome scale (CUDOS)",
  "short_title": "CUDOS",
  "source_url": "https://us.psytoolkit.org/survey-library/depression-cudos.html",
  "publication": null,
  "status": "needs-research",
  "item_count": 16,
  "dimensions": [
    "howtrue"
  ],
  "option_scales": [
    {
      "ref": "opt_cudos_howtrue_5",
      "dimension": "howtrue",
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
        "not at all true (0 days)",
        "rarely true (1-2 days)",
        "sometimes true (3-4 days)",
        "often true (5-6 days)",
        "almost always true (every day)"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_cudos_1",
      "prompt_snippet": "I felt sad or depressed",
      "dimension": "howtrue",
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
      "prompt_id": "pr_cudos_2",
      "prompt_snippet": "I was not as interested in my usual activities",
      "dimension": "howtrue",
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
      "prompt_id": "pr_cudos_3",
      "prompt_snippet": "My appetite was poor and I didn't feel like eating",
      "dimension": "howtrue",
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
      "prompt_id": "pr_cudos_4",
      "prompt_snippet": "My appetite was much greater than usual",
      "dimension": "howtrue",
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
      "prompt_id": "pr_cudos_5",
      "prompt_snippet": "I had difficulty sleeping",
      "dimension": "howtrue",
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
      "index": 6,
      "prompt_id": "pr_cudos_6",
      "prompt_snippet": "I was sleeping too much",
      "dimension": "howtrue",
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
      "index": 7,
      "prompt_id": "pr_cudos_7",
      "prompt_snippet": "I felt very fidgety, making it difficult to sit still",
      "dimension": "howtrue",
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
      "prompt_id": "pr_cudos_8",
      "prompt_snippet": "I felt physically slowed down, like my body was stuck in mud",
      "dimension": "howtrue",
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
      "index": 9,
      "prompt_id": "pr_cudos_9",
      "prompt_snippet": "My energy level was low",
      "dimension": "howtrue",
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
      "index": 10,
      "prompt_id": "pr_cudos_10",
      "prompt_snippet": "I felt guilty",
      "dimension": "howtrue",
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
      "prompt_id": "pr_cudos_11",
      "prompt_snippet": "I thought I was a failure",
      "dimension": "howtrue",
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
      "index": 12,
      "prompt_id": "pr_cudos_12",
      "prompt_snippet": "I had problems concentrating",
      "dimension": "howtrue",
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
      "index": 13,
      "prompt_id": "pr_cudos_13",
      "prompt_snippet": "I had more difficulties making decisions than usual",
      "dimension": "howtrue",
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
      "index": 14,
      "prompt_id": "pr_cudos_14",
      "prompt_snippet": "I wished I was dead",
      "dimension": "howtrue",
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
      "index": 15,
      "prompt_id": "pr_cudos_15",
      "prompt_snippet": "I thought about killing myself",
      "dimension": "howtrue",
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
      "index": 16,
      "prompt_id": "pr_cudos_16",
      "prompt_snippet": "I thought that the future looked hopeless",
      "dimension": "howtrue",
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

- Items: 16
- Dimensions: howtrue
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I felt sad or depressed | howtrue | 0,1,2,3,4 | no |
| 2 | I was not as interested in my usual activities | howtrue | 0,1,2,3,4 | no |
| 3 | My appetite was poor and I didn't feel like eating | howtrue | 0,1,2,3,4 | no |
| 4 | My appetite was much greater than usual | howtrue | 0,1,2,3,4 | no |
| 5 | I had difficulty sleeping | howtrue | 0,1,2,3,4 | no |
| 6 | I was sleeping too much | howtrue | 0,1,2,3,4 | no |
| 7 | I felt very fidgety, making it difficult to sit still | howtrue | 0,1,2,3,4 | no |
| 8 | I felt physically slowed down, like my body was stuck in mud | howtrue | 0,1,2,3,4 | no |
| 9 | My energy level was low | howtrue | 0,1,2,3,4 | no |
| 10 | I felt guilty | howtrue | 0,1,2,3,4 | no |
| 11 | I thought I was a failure | howtrue | 0,1,2,3,4 | no |
| 12 | I had problems concentrating | howtrue | 0,1,2,3,4 | no |
| 13 | I had more difficulties making decisions than usual | howtrue | 0,1,2,3,4 | no |
| 14 | I wished I was dead | howtrue | 0,1,2,3,4 | no |
| 15 | I thought about killing myself | howtrue | 0,1,2,3,4 | no |
| 16 | I thought that the future looked hopeless | howtrue | 0,1,2,3,4 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/depression-cudos.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
