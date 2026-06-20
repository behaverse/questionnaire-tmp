# Scoring — Patient Health Questionnaire-9 (PHQ-9) (`qst_phq9`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_phq9",
  "title": "Patient Health Questionnaire-9 (PHQ-9)",
  "short_title": "PHQ-9",
  "source_url": "https://www.phqscreeners.com/",
  "publication": {
    "citation": "Kroenke K, Spitzer RL, Williams JBW (2001). The PHQ-9. J Gen Intern Med, 16(9), 606-613.",
    "year": 2001
  },
  "status": "needs-research",
  "item_count": 9,
  "dimensions": [
    "frequency"
  ],
  "option_scales": [
    {
      "ref": "opt_phq_frequency_4",
      "dimension": "frequency",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        0,
        1,
        2,
        3
      ],
      "value_range": [
        0,
        3
      ],
      "anchors": [
        "Not at all",
        "Several days",
        "More than half the days",
        "Nearly every day"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_phq9_1",
      "prompt_snippet": "Little interest or pleasure in doing things",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_phq9_2",
      "prompt_snippet": "Feeling down, depressed, or hopeless",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_phq9_3",
      "prompt_snippet": "Trouble falling or staying asleep, or sleeping too much",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_phq9_4",
      "prompt_snippet": "Feeling tired or having little energy",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_phq9_5",
      "prompt_snippet": "Poor appetite or overeating",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_phq9_6",
      "prompt_snippet": "Feeling bad about yourself — or that you are a failure or have let yourself or y",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_phq9_7",
      "prompt_snippet": "Trouble concentrating on things, such as reading the newspaper or watching telev",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_phq9_8",
      "prompt_snippet": "Moving or speaking so slowly that other people could have noticed? Or the opposi",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_phq9_9",
      "prompt_snippet": "Thoughts that you would be better off dead, or of hurting yourself in some way",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
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
- Dimensions: frequency
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Little interest or pleasure in doing things | frequency | 0,1,2,3 | no |
| 2 | Feeling down, depressed, or hopeless | frequency | 0,1,2,3 | no |
| 3 | Trouble falling or staying asleep, or sleeping too much | frequency | 0,1,2,3 | no |
| 4 | Feeling tired or having little energy | frequency | 0,1,2,3 | no |
| 5 | Poor appetite or overeating | frequency | 0,1,2,3 | no |
| 6 | Feeling bad about yourself — or that you are a failure or have let yourself or y | frequency | 0,1,2,3 | no |
| 7 | Trouble concentrating on things, such as reading the newspaper or watching telev | frequency | 0,1,2,3 | no |
| 8 | Moving or speaking so slowly that other people could have noticed? Or the opposi | frequency | 0,1,2,3 | no |
| 9 | Thoughts that you would be better off dead, or of hurting yourself in some way | frequency | 0,1,2,3 | no |

## To research (fill from https://www.phqscreeners.com/)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
