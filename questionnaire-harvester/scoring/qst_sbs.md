# Scoring — Supernatural Belief Scale (`qst_sbs`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_sbs",
  "title": "Supernatural Belief Scale",
  "short_title": "Supernatural Belief Scale",
  "source_url": "https://us.psytoolkit.org/survey-library/supernatural-sbs.html",
  "publication": {
    "citation": "Jong, J., Bluemke, M., & Halberstadt, J. (2013). Fear of death and supernatural beliefs: Developing a new supernatural belief scale to test the relationship. European Journal of Personality, 27 , 495-506.",
    "year": 2013
  },
  "status": "needs-research",
  "item_count": 10,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_sbs_agree_9",
      "dimension": "agree",
      "measurement_type": "ordinal",
      "levels": 9,
      "values": [
        -4,
        -3,
        -2,
        -1,
        0,
        1,
        2,
        3,
        4
      ],
      "value_range": [
        -4,
        4
      ],
      "anchors": [
        "strongly disagree",
        ".",
        ".",
        ".",
        "neither agree nor disagree",
        ".",
        ".",
        ".",
        "strongly agree"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_sbs_1",
      "prompt_snippet": "There exists an all-powerful, all-knowing, loving God.",
      "dimension": "agree",
      "values": [
        -4,
        -3,
        -2,
        -1,
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
      "prompt_id": "pr_sbs_2",
      "prompt_snippet": "There exists an evil personal spiritual being, whom we might call the Devil.",
      "dimension": "agree",
      "values": [
        -4,
        -3,
        -2,
        -1,
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
      "prompt_id": "pr_sbs_3",
      "prompt_snippet": "There exist good personal spiritual beings, whom we might call angels.",
      "dimension": "agree",
      "values": [
        -4,
        -3,
        -2,
        -1,
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
      "prompt_id": "pr_sbs_4",
      "prompt_snippet": "There exist evil, personal spiritual beings, whom we might call demons.",
      "dimension": "agree",
      "values": [
        -4,
        -3,
        -2,
        -1,
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
      "prompt_id": "pr_sbs_5",
      "prompt_snippet": "Human beings have immaterial, immortal souls.",
      "dimension": "agree",
      "values": [
        -4,
        -3,
        -2,
        -1,
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
      "prompt_id": "pr_sbs_6",
      "prompt_snippet": "There is a spiritual realm besides the physical one.",
      "dimension": "agree",
      "values": [
        -4,
        -3,
        -2,
        -1,
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
      "prompt_id": "pr_sbs_7",
      "prompt_snippet": "Some people will be rewarded in an afterlife when they die.",
      "dimension": "agree",
      "values": [
        -4,
        -3,
        -2,
        -1,
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
      "prompt_id": "pr_sbs_8",
      "prompt_snippet": "Some people will be punished in an afterlife when they die.",
      "dimension": "agree",
      "values": [
        -4,
        -3,
        -2,
        -1,
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
      "prompt_id": "pr_sbs_9",
      "prompt_snippet": "Miracles—divinely-caused events that have no natural explanation—can and do happ",
      "dimension": "agree",
      "values": [
        -4,
        -3,
        -2,
        -1,
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
      "prompt_id": "pr_sbs_10",
      "prompt_snippet": "There are individuals who are messengers of God and/or can foresee the future.",
      "dimension": "agree",
      "values": [
        -4,
        -3,
        -2,
        -1,
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

- Items: 10
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | There exists an all-powerful, all-knowing, loving God. | agree | -4,-3,-2,-1,0,1,2,3,4 | no |
| 2 | There exists an evil personal spiritual being, whom we might call the Devil. | agree | -4,-3,-2,-1,0,1,2,3,4 | no |
| 3 | There exist good personal spiritual beings, whom we might call angels. | agree | -4,-3,-2,-1,0,1,2,3,4 | no |
| 4 | There exist evil, personal spiritual beings, whom we might call demons. | agree | -4,-3,-2,-1,0,1,2,3,4 | no |
| 5 | Human beings have immaterial, immortal souls. | agree | -4,-3,-2,-1,0,1,2,3,4 | no |
| 6 | There is a spiritual realm besides the physical one. | agree | -4,-3,-2,-1,0,1,2,3,4 | no |
| 7 | Some people will be rewarded in an afterlife when they die. | agree | -4,-3,-2,-1,0,1,2,3,4 | no |
| 8 | Some people will be punished in an afterlife when they die. | agree | -4,-3,-2,-1,0,1,2,3,4 | no |
| 9 | Miracles—divinely-caused events that have no natural explanation—can and do happ | agree | -4,-3,-2,-1,0,1,2,3,4 | no |
| 10 | There are individuals who are messengers of God and/or can foresee the future. | agree | -4,-3,-2,-1,0,1,2,3,4 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/supernatural-sbs.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
