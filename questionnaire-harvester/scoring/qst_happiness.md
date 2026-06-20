# Scoring — The Children’s Happiness Scale (`qst_happiness`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_happiness",
  "title": "The Children’s Happiness Scale",
  "short_title": "The Children’s Happiness Scale",
  "source_url": "https://us.psytoolkit.org/survey-library/children-happiness.html",
  "publication": {
    "citation": "Morgan, R. (2014). The children’s happiness scale. Children’s\nRights. Documentation,\nincluding questions and scoring retrieved from this link .",
    "year": 2014
  },
  "status": "needs-research",
  "item_count": 1,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_happiness_rating_1",
      "dimension": "rating",
      "measurement_type": "nominal",
      "levels": 20,
      "values": [
        3.64,
        3.13,
        3.15,
        2.55,
        3.65,
        2.57,
        3.22,
        4.01,
        2.43,
        1.74,
        2.32,
        1.68,
        1.77,
        3.18,
        2.63,
        1.68,
        3.7,
        3.38,
        4.25,
        1.75
      ],
      "value_range": [
        1.68,
        4.25
      ],
      "anchors": [
        "Life is good for me at the moment",
        "I am treated fairly",
        "I know what is happening next in my life",
        "I have big problems but am dealing with them",
        "I am quite proud of myself",
        "I am trying to change some things about myself",
        "I don't have any big problems at the moment",
        "I have lots of friends",
        "I get confused about what is going on",
        "I never feel safe",
        "I often get anxious",
        "I get lonely",
        "People are prejudiced against me",
        "I learn from my mistakes",
        "I am a shy person",
        "I get bullied",
        "I am good at learning new things",
        "I am getting all the help I need",
        "I have lots of fun",
        "I am easily depressed"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_happiness_1",
      "prompt_snippet": "Here are 20 things children or young people might say about themselves.<br> Just",
      "dimension": "rating",
      "values": [
        3.64,
        3.13,
        3.15,
        2.55,
        3.65,
        2.57,
        3.22,
        4.01,
        2.43,
        1.74,
        2.32,
        1.68,
        1.77,
        3.18,
        2.63,
        1.68,
        3.7,
        3.38,
        4.25,
        1.75
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

- Items: 1
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Here are 20 things children or young people might say about themselves.<br> Just | rating | 3.64,3.13,3.15,2.55,3.65,2.57,3.22,4.01,2.43,1.74,2.32,1.68,1.77,3.18,2.63,1.68,3.7,3.38,4.25,1.75 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/children-happiness.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
