# Scoring — The State Self Esteem Scale (SSES) (`qst_sses`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_sses",
  "title": "The State Self Esteem Scale (SSES)",
  "short_title": "SSES",
  "source_url": "https://us.psytoolkit.org/survey-library/self-esteem-sses.html",
  "publication": null,
  "status": "needs-research",
  "item_count": 20,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_sses_agree_5",
      "dimension": "agree",
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
        "not at all",
        "a little bit",
        "somewhat",
        "very much",
        "extremely"
      ]
    }
  ],
  "reversed_items": [
    "pr_sses_2",
    "pr_sses_4",
    "pr_sses_5",
    "pr_sses_7",
    "pr_sses_8",
    "pr_sses_10",
    "pr_sses_13",
    "pr_sses_15",
    "pr_sses_16",
    "pr_sses_17",
    "pr_sses_18",
    "pr_sses_19",
    "pr_sses_20"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_sses_1",
      "prompt_snippet": "I feel confident about my abilities.",
      "dimension": "agree",
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
      "prompt_id": "pr_sses_2",
      "prompt_snippet": "I am worried about whether I am regarded as a success or failure.",
      "dimension": "agree",
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
      "prompt_id": "pr_sses_3",
      "prompt_snippet": "I feel satisfied with the way my body looks right now.",
      "dimension": "agree",
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
      "prompt_id": "pr_sses_4",
      "prompt_snippet": "I feel frustrated or rattled about my performance.",
      "dimension": "agree",
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
      "prompt_id": "pr_sses_5",
      "prompt_snippet": "I feel that I am having trouble understanding things that I read.",
      "dimension": "agree",
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
      "index": 6,
      "prompt_id": "pr_sses_6",
      "prompt_snippet": "I feel that others respect and admire me.",
      "dimension": "agree",
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
      "prompt_id": "pr_sses_7",
      "prompt_snippet": "I am dissatisfied with my weight.",
      "dimension": "agree",
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
      "prompt_id": "pr_sses_8",
      "prompt_snippet": "I feel self-conscious.",
      "dimension": "agree",
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
      "prompt_id": "pr_sses_9",
      "prompt_snippet": "I feel as smart as others.",
      "dimension": "agree",
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
      "prompt_id": "pr_sses_10",
      "prompt_snippet": "I feel displeased with myself.",
      "dimension": "agree",
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
      "index": 11,
      "prompt_id": "pr_sses_11",
      "prompt_snippet": "I feel good about myself.",
      "dimension": "agree",
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
      "prompt_id": "pr_sses_12",
      "prompt_snippet": "I am pleased with my appearance right now.",
      "dimension": "agree",
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
      "prompt_id": "pr_sses_13",
      "prompt_snippet": "I am worried about what other people think of me.",
      "dimension": "agree",
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
      "prompt_id": "pr_sses_14",
      "prompt_snippet": "I feel confident that I understand things.",
      "dimension": "agree",
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
      "index": 15,
      "prompt_id": "pr_sses_15",
      "prompt_snippet": "I feel inferior to others at this moment.",
      "dimension": "agree",
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
      "prompt_id": "pr_sses_16",
      "prompt_snippet": "I feel unattractive.",
      "dimension": "agree",
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
      "index": 17,
      "prompt_id": "pr_sses_17",
      "prompt_snippet": "I feel concerned about the impression I am making.",
      "dimension": "agree",
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
      "index": 18,
      "prompt_id": "pr_sses_18",
      "prompt_snippet": "I feel that I have less scholastic ability right now than others.",
      "dimension": "agree",
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
      "prompt_id": "pr_sses_19",
      "prompt_snippet": "I feel like I'm not doing well.",
      "dimension": "agree",
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
      "index": 20,
      "prompt_id": "pr_sses_20",
      "prompt_snippet": "I am worried about looking foolish.",
      "dimension": "agree",
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
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_sses_2, pr_sses_4, pr_sses_5, pr_sses_7, pr_sses_8, pr_sses_10, pr_sses_13, pr_sses_15, pr_sses_16, pr_sses_17, pr_sses_18, pr_sses_19, pr_sses_20
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I feel confident about my abilities. | agree | 1,2,3,4,5 | no |
| 2 | I am worried about whether I am regarded as a success or failure. | agree | 1,2,3,4,5 | yes |
| 3 | I feel satisfied with the way my body looks right now. | agree | 1,2,3,4,5 | no |
| 4 | I feel frustrated or rattled about my performance. | agree | 1,2,3,4,5 | yes |
| 5 | I feel that I am having trouble understanding things that I read. | agree | 1,2,3,4,5 | yes |
| 6 | I feel that others respect and admire me. | agree | 1,2,3,4,5 | no |
| 7 | I am dissatisfied with my weight. | agree | 1,2,3,4,5 | yes |
| 8 | I feel self-conscious. | agree | 1,2,3,4,5 | yes |
| 9 | I feel as smart as others. | agree | 1,2,3,4,5 | no |
| 10 | I feel displeased with myself. | agree | 1,2,3,4,5 | yes |
| 11 | I feel good about myself. | agree | 1,2,3,4,5 | no |
| 12 | I am pleased with my appearance right now. | agree | 1,2,3,4,5 | no |
| 13 | I am worried about what other people think of me. | agree | 1,2,3,4,5 | yes |
| 14 | I feel confident that I understand things. | agree | 1,2,3,4,5 | no |
| 15 | I feel inferior to others at this moment. | agree | 1,2,3,4,5 | yes |
| 16 | I feel unattractive. | agree | 1,2,3,4,5 | yes |
| 17 | I feel concerned about the impression I am making. | agree | 1,2,3,4,5 | yes |
| 18 | I feel that I have less scholastic ability right now than others. | agree | 1,2,3,4,5 | yes |
| 19 | I feel like I'm not doing well. | agree | 1,2,3,4,5 | yes |
| 20 | I am worried about looking foolish. | agree | 1,2,3,4,5 | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/self-esteem-sses.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
