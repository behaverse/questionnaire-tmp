# Scoring — Appearance Anxiety Inventory (AAI) (`qst_aai`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_aai",
  "title": "Appearance Anxiety Inventory (AAI)",
  "short_title": "AAI",
  "source_url": "https://us.psytoolkit.org/survey-library/appearance-aai.html",
  "publication": {
    "citation": "Veale, D., Eshkevaria, E., Kanakama, N., Ellisona, N., Costa, A., and\nWerner, T. (2014). The Appearance Anxiety Inventory: Validation of a\nProcess Measure in the Treatment of Body Dysmorphic\nDisorder. Behavioural and Cognitive Psychotherapy, 42 , 605-616. Link to publisher",
    "year": 2014
  },
  "status": "needs-research",
  "item_count": 10,
  "dimensions": [
    "frequency"
  ],
  "option_scales": [
    {
      "ref": "opt_aai_frequency_5",
      "dimension": "frequency",
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
        "Not at all",
        "Rarely",
        "Sometimes",
        "Often",
        "All the time"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_aai_1",
      "prompt_snippet": "I check my appearance (e.g. in mirrors, by touching with my fingers or by taking",
      "dimension": "frequency",
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
      "prompt_id": "pr_aai_2",
      "prompt_snippet": "I compare aspects of my appearance to others",
      "dimension": "frequency",
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
      "prompt_id": "pr_aai_3",
      "prompt_snippet": "I avoid situations or people because of my appearance",
      "dimension": "frequency",
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
      "prompt_id": "pr_aai_4",
      "prompt_snippet": "I think about how to camouflage or alter my appearance",
      "dimension": "frequency",
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
      "prompt_id": "pr_aai_5",
      "prompt_snippet": "I avoid reflective surfaces, photos or videos of myself",
      "dimension": "frequency",
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
      "prompt_id": "pr_aai_6",
      "prompt_snippet": "I try to camouflage or alter aspects of my appearance",
      "dimension": "frequency",
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
      "prompt_id": "pr_aai_7",
      "prompt_snippet": "I brood about past events or reasons to explain why I look the way I do",
      "dimension": "frequency",
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
      "prompt_id": "pr_aai_8",
      "prompt_snippet": "I am focused on how I feel I look rather than on my surroundings",
      "dimension": "frequency",
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
      "prompt_id": "pr_aai_9",
      "prompt_snippet": "I discuss my appearance with others or question them about it",
      "dimension": "frequency",
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
      "prompt_id": "pr_aai_10",
      "prompt_snippet": "I try to prevent people from seeing aspects of my appearance within particular s",
      "dimension": "frequency",
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

- Items: 10
- Dimensions: frequency
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I check my appearance (e.g. in mirrors, by touching with my fingers or by taking | frequency | 0,1,2,3,4 | no |
| 2 | I compare aspects of my appearance to others | frequency | 0,1,2,3,4 | no |
| 3 | I avoid situations or people because of my appearance | frequency | 0,1,2,3,4 | no |
| 4 | I think about how to camouflage or alter my appearance | frequency | 0,1,2,3,4 | no |
| 5 | I avoid reflective surfaces, photos or videos of myself | frequency | 0,1,2,3,4 | no |
| 6 | I try to camouflage or alter aspects of my appearance | frequency | 0,1,2,3,4 | no |
| 7 | I brood about past events or reasons to explain why I look the way I do | frequency | 0,1,2,3,4 | no |
| 8 | I am focused on how I feel I look rather than on my surroundings | frequency | 0,1,2,3,4 | no |
| 9 | I discuss my appearance with others or question them about it | frequency | 0,1,2,3,4 | no |
| 10 | I try to prevent people from seeing aspects of my appearance within particular s | frequency | 0,1,2,3,4 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/appearance-aai.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
