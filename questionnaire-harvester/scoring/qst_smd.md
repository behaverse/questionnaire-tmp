# Scoring — Social Media Disorder Scale (SMD) (`qst_smd`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_smd",
  "title": "Social Media Disorder Scale (SMD)",
  "short_title": "SMD",
  "source_url": "https://us.psytoolkit.org/survey-library/social-media-disorder-scale.html",
  "publication": {
    "citation": "van der Eijnden, R.J.J.M, Lemmens, J.S., & Valkenburg, P.M. (2016). The Social Media Disorder Scale. Computers in Human Behavior, 61, 478-487.",
    "year": 2016
  },
  "status": "needs-research",
  "item_count": 9,
  "dimensions": [
    "yesno"
  ],
  "option_scales": [
    {
      "ref": "opt_smd_yesno_2",
      "dimension": "yesno",
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
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_smd_1",
      "prompt_snippet": "regularly found that you can't think of anything else but the moment that you wi",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_smd_2",
      "prompt_snippet": "regularly felt dissatisfied because you wanted to spend more time on social medi",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_smd_3",
      "prompt_snippet": "often felt bad when you could not use social media?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_smd_4",
      "prompt_snippet": "tried to spend less time on social media, but failed?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_smd_5",
      "prompt_snippet": "regularly neglected other activities (e.g. hobbies, sport) because you wanted to",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_smd_6",
      "prompt_snippet": "regularly had arguments with others because of your social media use?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_smd_7",
      "prompt_snippet": "regularly lied to your parents or friends about the amount of time you spend on ",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_smd_8",
      "prompt_snippet": "often used social media to escape from negative feelings?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_smd_9",
      "prompt_snippet": "had serious conflict with your parents, brother(s) or sister(s) because of your ",
      "dimension": "yesno",
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

- Items: 9
- Dimensions: yesno
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | regularly found that you can't think of anything else but the moment that you wi | yesno | 1,0 | no |
| 2 | regularly felt dissatisfied because you wanted to spend more time on social medi | yesno | 1,0 | no |
| 3 | often felt bad when you could not use social media? | yesno | 1,0 | no |
| 4 | tried to spend less time on social media, but failed? | yesno | 1,0 | no |
| 5 | regularly neglected other activities (e.g. hobbies, sport) because you wanted to | yesno | 1,0 | no |
| 6 | regularly had arguments with others because of your social media use? | yesno | 1,0 | no |
| 7 | regularly lied to your parents or friends about the amount of time you spend on  | yesno | 1,0 | no |
| 8 | often used social media to escape from negative feelings? | yesno | 1,0 | no |
| 9 | had serious conflict with your parents, brother(s) or sister(s) because of your  | yesno | 1,0 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/social-media-disorder-scale.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
