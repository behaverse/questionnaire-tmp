# Scoring — Type D Personality (DS14) (`qst_ds14`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_ds14",
  "title": "Type D Personality (DS14)",
  "short_title": "DS14",
  "source_url": "https://us.psytoolkit.org/survey-library/personality-d.html",
  "publication": {
    "citation": "Denollet, J., Sys, S.U., Stroobant, N., Rombouts, H., Gillebert,\nT.C., & Brutsaert, D.L. (1996). Personality as independent predictor\nof long-term mortality in patients with coronary heart disease. The\nLancet, 347, 417-421. Free link to full text",
    "year": 1996
  },
  "status": "needs-research",
  "item_count": 14,
  "dimensions": [
    "falsetrue"
  ],
  "option_scales": [
    {
      "ref": "opt_ds14_falsetrue_5",
      "dimension": "falsetrue",
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
        "FALSE",
        "RATHER FALSE",
        "NEUTRAL",
        "RATHER TRUE",
        "TRUE"
      ]
    }
  ],
  "reversed_items": [
    "pr_ds14_1",
    "pr_ds14_3"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_ds14_1",
      "prompt_snippet": "I make contact easily when I meet people",
      "dimension": "falsetrue",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 2,
      "prompt_id": "pr_ds14_2",
      "prompt_snippet": "I often make a fuss about unimportant things",
      "dimension": "falsetrue",
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
      "prompt_id": "pr_ds14_3",
      "prompt_snippet": "I often talk to strangers",
      "dimension": "falsetrue",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 4,
      "prompt_id": "pr_ds14_4",
      "prompt_snippet": "I often feel unhappy",
      "dimension": "falsetrue",
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
      "prompt_id": "pr_ds14_5",
      "prompt_snippet": "I am often irritated",
      "dimension": "falsetrue",
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
      "prompt_id": "pr_ds14_6",
      "prompt_snippet": "I often feel inhibited in social interactions",
      "dimension": "falsetrue",
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
      "prompt_id": "pr_ds14_7",
      "prompt_snippet": "I take a gloomy view of things",
      "dimension": "falsetrue",
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
      "prompt_id": "pr_ds14_8",
      "prompt_snippet": "I find it hard to start a conversation",
      "dimension": "falsetrue",
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
      "prompt_id": "pr_ds14_9",
      "prompt_snippet": "I am often in a bad mood",
      "dimension": "falsetrue",
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
      "prompt_id": "pr_ds14_10",
      "prompt_snippet": "I am closed kind of person",
      "dimension": "falsetrue",
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
      "prompt_id": "pr_ds14_11",
      "prompt_snippet": "I would rather keep other people at a distance",
      "dimension": "falsetrue",
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
      "prompt_id": "pr_ds14_12",
      "prompt_snippet": "I often find myself worrying about something",
      "dimension": "falsetrue",
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
      "prompt_id": "pr_ds14_13",
      "prompt_snippet": "I am often down in the dumps",
      "dimension": "falsetrue",
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
      "prompt_id": "pr_ds14_14",
      "prompt_snippet": "When socializing, I don't find the right things to talk about",
      "dimension": "falsetrue",
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

- Items: 14
- Dimensions: falsetrue
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_ds14_1, pr_ds14_3
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I make contact easily when I meet people | falsetrue | 0,1,2,3,4 | yes |
| 2 | I often make a fuss about unimportant things | falsetrue | 0,1,2,3,4 | no |
| 3 | I often talk to strangers | falsetrue | 0,1,2,3,4 | yes |
| 4 | I often feel unhappy | falsetrue | 0,1,2,3,4 | no |
| 5 | I am often irritated | falsetrue | 0,1,2,3,4 | no |
| 6 | I often feel inhibited in social interactions | falsetrue | 0,1,2,3,4 | no |
| 7 | I take a gloomy view of things | falsetrue | 0,1,2,3,4 | no |
| 8 | I find it hard to start a conversation | falsetrue | 0,1,2,3,4 | no |
| 9 | I am often in a bad mood | falsetrue | 0,1,2,3,4 | no |
| 10 | I am closed kind of person | falsetrue | 0,1,2,3,4 | no |
| 11 | I would rather keep other people at a distance | falsetrue | 0,1,2,3,4 | no |
| 12 | I often find myself worrying about something | falsetrue | 0,1,2,3,4 | no |
| 13 | I am often down in the dumps | falsetrue | 0,1,2,3,4 | no |
| 14 | When socializing, I don't find the right things to talk about | falsetrue | 0,1,2,3,4 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/personality-d.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
