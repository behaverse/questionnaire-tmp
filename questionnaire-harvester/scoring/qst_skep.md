# Scoring — Skepticism towards advertisements (SKEP) (`qst_skep`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_skep",
  "title": "Skepticism towards advertisements (SKEP)",
  "short_title": "SKEP",
  "source_url": "https://us.psytoolkit.org/survey-library/skepticism-skep.html",
  "publication": {
    "citation": "Obermiller, C. & Spangenberg, E.R. (1998). Development of a scale to\nmeasure consumer skepticism toward advertising. Journal of Consumer\nPsychology, 7 , 159-186.",
    "year": 1998
  },
  "status": "needs-research",
  "item_count": 9,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_skep_agree_5",
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
        "strongly agree",
        "agree",
        "neutral",
        "disagree",
        "strongly disagree"
      ]
    }
  ],
  "reversed_items": [
    "pr_skep_3",
    "pr_skep_5",
    "pr_skep_7",
    "pr_skep_9"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_skep_1",
      "prompt_snippet": "We can depend on getting the truth in most advertising.",
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
      "prompt_id": "pr_skep_2",
      "prompt_snippet": "Advertising's aim is to inform the consumer.",
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
      "index": 3,
      "prompt_id": "pr_skep_3",
      "prompt_snippet": "I believe advertising is <b>not</b> informative.",
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
      "index": 4,
      "prompt_id": "pr_skep_4",
      "prompt_snippet": "Advertising is generally truthful.",
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
      "index": 5,
      "prompt_id": "pr_skep_5",
      "prompt_snippet": "Advertising is <b>not</b> a reliable source of information about the quality and",
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
      "prompt_id": "pr_skep_6",
      "prompt_snippet": "Advertising is truth well told.",
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
      "prompt_id": "pr_skep_7",
      "prompt_snippet": "In general, advertising <b>does not</b> present a true picture of the product be",
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
      "prompt_id": "pr_skep_8",
      "prompt_snippet": "I feel I've been accurately informed after viewing most advertisements.",
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
      "index": 9,
      "prompt_id": "pr_skep_9",
      "prompt_snippet": "Most advertising <b>does not</b> provide consumers with essential information.",
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

- Items: 9
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_skep_3, pr_skep_5, pr_skep_7, pr_skep_9
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | We can depend on getting the truth in most advertising. | agree | 1,2,3,4,5 | no |
| 2 | Advertising's aim is to inform the consumer. | agree | 1,2,3,4,5 | no |
| 3 | I believe advertising is <b>not</b> informative. | agree | 1,2,3,4,5 | yes |
| 4 | Advertising is generally truthful. | agree | 1,2,3,4,5 | no |
| 5 | Advertising is <b>not</b> a reliable source of information about the quality and | agree | 1,2,3,4,5 | yes |
| 6 | Advertising is truth well told. | agree | 1,2,3,4,5 | no |
| 7 | In general, advertising <b>does not</b> present a true picture of the product be | agree | 1,2,3,4,5 | yes |
| 8 | I feel I've been accurately informed after viewing most advertisements. | agree | 1,2,3,4,5 | no |
| 9 | Most advertising <b>does not</b> provide consumers with essential information. | agree | 1,2,3,4,5 | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/skepticism-skep.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
