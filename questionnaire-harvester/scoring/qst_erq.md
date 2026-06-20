# Scoring — Emotional regulation questionnaire (ERQ) (`qst_erq`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_erq",
  "title": "Emotional regulation questionnaire (ERQ)",
  "short_title": "ERQ",
  "source_url": "https://us.psytoolkit.org/survey-library/emotional-regulation-erq.html",
  "publication": {
    "citation": "Gross, J.J., & John, O.P. (2003). Individual differences in two\nemotion regulation processes: Implications for affect, relationships,\nand well-being. Journal of Personality and Social Psychology, 85 ,\n348-362.",
    "year": 2003
  },
  "status": "needs-research",
  "item_count": 10,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_erq_agree_7",
      "dimension": "agree",
      "measurement_type": "ordinal",
      "levels": 7,
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "value_range": [
        1,
        7
      ],
      "anchors": [
        "strongly<br>disagree",
        ".",
        ".",
        "neutral",
        ".",
        ".",
        "strongly<br>agree"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_erq_1",
      "prompt_snippet": "When I want to feel more positive emotion (such as joy or amusement), I change w",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_erq_2",
      "prompt_snippet": "I keep my emotions to myself.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_erq_3",
      "prompt_snippet": "When I want to feel less negative emotion (such as sadness or anger), I change w",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_erq_4",
      "prompt_snippet": "When I am feeling positive emotions, I am careful not to express them.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_erq_5",
      "prompt_snippet": "When I’m faced with a stressful situation, I make myself think about it in a way",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_erq_6",
      "prompt_snippet": "I control my emotions by not expressing them.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_erq_7",
      "prompt_snippet": "When I want to feel more positive emotion, I change the way I’m thinking about t",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_erq_8",
      "prompt_snippet": "I control my emotions by changing the way I think about the situation I’m in.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_erq_9",
      "prompt_snippet": "When I am feeling negative emotions, I make sure not to express them.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_erq_10",
      "prompt_snippet": "When I want to feel less negative emotion, I change the way I’m thinking about t",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
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

- Items: 10
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | When I want to feel more positive emotion (such as joy or amusement), I change w | agree | 1,2,3,4,5,6,7 | no |
| 2 | I keep my emotions to myself. | agree | 1,2,3,4,5,6,7 | no |
| 3 | When I want to feel less negative emotion (such as sadness or anger), I change w | agree | 1,2,3,4,5,6,7 | no |
| 4 | When I am feeling positive emotions, I am careful not to express them. | agree | 1,2,3,4,5,6,7 | no |
| 5 | When I’m faced with a stressful situation, I make myself think about it in a way | agree | 1,2,3,4,5,6,7 | no |
| 6 | I control my emotions by not expressing them. | agree | 1,2,3,4,5,6,7 | no |
| 7 | When I want to feel more positive emotion, I change the way I’m thinking about t | agree | 1,2,3,4,5,6,7 | no |
| 8 | I control my emotions by changing the way I think about the situation I’m in. | agree | 1,2,3,4,5,6,7 | no |
| 9 | When I am feeling negative emotions, I make sure not to express them. | agree | 1,2,3,4,5,6,7 | no |
| 10 | When I want to feel less negative emotion, I change the way I’m thinking about t | agree | 1,2,3,4,5,6,7 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/emotional-regulation-erq.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
