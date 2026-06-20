# Scoring — The WHO-5 Well-Being Index (`qst_who5`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_who5",
  "title": "The WHO-5 Well-Being Index",
  "short_title": "The WHO-5 Well-Being Index",
  "source_url": "https://us.psytoolkit.org/survey-library/who5.html",
  "publication": {
    "citation": "Topp, C.W., Østergaard, S.D., Søndergaard, S., & Bech, P. (2015). The WHO-5 Well-Being Index: A Systematic Review of the Literature. Psychotherapy and Psychosomatics, 84 , 167-176. Open access link",
    "year": 2015
  },
  "status": "needs-research",
  "item_count": 5,
  "dimensions": [
    "whofreq"
  ],
  "option_scales": [
    {
      "ref": "opt_who5_whofreq_6",
      "dimension": "whofreq",
      "measurement_type": "ordinal",
      "levels": 6,
      "values": [
        5,
        4,
        3,
        2,
        1,
        0
      ],
      "value_range": [
        0,
        5
      ],
      "anchors": [
        "All of the time",
        "Most of the time",
        "More than half the time",
        "Less than half the time",
        "Some of the time",
        "At no time"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_who5_1",
      "prompt_snippet": "... I have felt cheerful in good spirits.",
      "dimension": "whofreq",
      "values": [
        5,
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_who5_2",
      "prompt_snippet": "... I have felt calm and relaxed.",
      "dimension": "whofreq",
      "values": [
        5,
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_who5_3",
      "prompt_snippet": "... I have felt active and vigorous.",
      "dimension": "whofreq",
      "values": [
        5,
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_who5_4",
      "prompt_snippet": "... I woke up feeling fresh and rested.",
      "dimension": "whofreq",
      "values": [
        5,
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_who5_5",
      "prompt_snippet": "... My daily life has been filled with things that interest me.",
      "dimension": "whofreq",
      "values": [
        5,
        4,
        3,
        2,
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

- Items: 5
- Dimensions: whofreq
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | ... I have felt cheerful in good spirits. | whofreq | 5,4,3,2,1,0 | no |
| 2 | ... I have felt calm and relaxed. | whofreq | 5,4,3,2,1,0 | no |
| 3 | ... I have felt active and vigorous. | whofreq | 5,4,3,2,1,0 | no |
| 4 | ... I woke up feeling fresh and rested. | whofreq | 5,4,3,2,1,0 | no |
| 5 | ... My daily life has been filled with things that interest me. | whofreq | 5,4,3,2,1,0 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/who5.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
