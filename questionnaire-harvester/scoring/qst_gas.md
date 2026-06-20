# Scoring — Gaming Addiction Scale (`qst_gas`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_gas",
  "title": "Gaming Addiction Scale",
  "short_title": "Gaming Addiction Scale",
  "source_url": "https://us.psytoolkit.org/survey-library/addiction-gaming-gas.html",
  "publication": {
    "citation": "Lemmens, J.S., Valkenburg, P.M. & Peter, J. (2009). Development and validation of a game addiction scale for adolescents. Media Psychology, 12(1) , 77-95.",
    "year": 2009
  },
  "status": "needs-research",
  "item_count": 7,
  "dimensions": [
    "howoften"
  ],
  "option_scales": [
    {
      "ref": "opt_gas_howoften_5",
      "dimension": "howoften",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        0,
        0,
        1,
        1,
        1
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "never",
        "rarely",
        "sometimes",
        "often",
        "very often"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_gas_1",
      "prompt_snippet": "did you think about playing a game all day long?",
      "dimension": "howoften",
      "values": [
        0,
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_gas_2",
      "prompt_snippet": "did you spend increasing amounts of time on games?",
      "dimension": "howoften",
      "values": [
        0,
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_gas_3",
      "prompt_snippet": "did you play games to forget about real life?",
      "dimension": "howoften",
      "values": [
        0,
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_gas_4",
      "prompt_snippet": "have others unsuccessfully tried to reduce your game use?",
      "dimension": "howoften",
      "values": [
        0,
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_gas_5",
      "prompt_snippet": "have you felt bad when you were unable to play?",
      "dimension": "howoften",
      "values": [
        0,
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_gas_6",
      "prompt_snippet": "did you have fights with others (e.g., family, friends) over your time spent on ",
      "dimension": "howoften",
      "values": [
        0,
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_gas_7",
      "prompt_snippet": "have you neglected other important activities (e.g., school, work, sports) to pl",
      "dimension": "howoften",
      "values": [
        0,
        0,
        1,
        1,
        1
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

- Items: 7
- Dimensions: howoften
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | did you think about playing a game all day long? | howoften | 0,0,1,1,1 | no |
| 2 | did you spend increasing amounts of time on games? | howoften | 0,0,1,1,1 | no |
| 3 | did you play games to forget about real life? | howoften | 0,0,1,1,1 | no |
| 4 | have others unsuccessfully tried to reduce your game use? | howoften | 0,0,1,1,1 | no |
| 5 | have you felt bad when you were unable to play? | howoften | 0,0,1,1,1 | no |
| 6 | did you have fights with others (e.g., family, friends) over your time spent on  | howoften | 0,0,1,1,1 | no |
| 7 | have you neglected other important activities (e.g., school, work, sports) to pl | howoften | 0,0,1,1,1 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/addiction-gaming-gas.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
