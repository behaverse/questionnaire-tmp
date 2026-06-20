# Scoring — Caffeine Use Disorder Questionnaire (CUDQ) (`qst_cudq`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_cudq",
  "title": "Caffeine Use Disorder Questionnaire (CUDQ)",
  "short_title": "CUDQ",
  "source_url": "https://us.psytoolkit.org/survey-library/caffeine-cudq.html",
  "publication": {
    "citation": "Addicott M. A. (2014). Caffeine Use Disorder: A Review of the\nEvidence and Future Implications. Current addiction reports, 1(3) ,\n186-192. https://doi.org/10.1007/s40429-014-0024-9",
    "year": 2014
  },
  "status": "needs-research",
  "item_count": 10,
  "dimensions": [
    "use"
  ],
  "option_scales": [
    {
      "ref": "opt_cudq_use_4",
      "dimension": "use",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
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
        "Never",
        "Sometimes",
        "Often",
        "Very often"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_cudq_1",
      "prompt_snippet": "Did you feel a strong desire or had unsuccessful attempts to reduce or control y",
      "dimension": "use",
      "values": [
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_cudq_2",
      "prompt_snippet": "Did you consume caffeine despite you knew that it can cause permanent or recurre",
      "dimension": "use",
      "values": [
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_cudq_3",
      "prompt_snippet": "Did you consume caffeine in order to avoid one or more caffeine withdrawal sympt",
      "dimension": "use",
      "values": [
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_cudq_4",
      "prompt_snippet": "Did you consume more caffeine or did you consume caffeine longer than you intend",
      "dimension": "use",
      "values": [
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_cudq_5",
      "prompt_snippet": "Because of caffeine use, did you fail to fulfill any major work, school or home ",
      "dimension": "use",
      "values": [
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_cudq_6",
      "prompt_snippet": "Did you consume caffeine despite you knew that it can cause permanent or recurre",
      "dimension": "use",
      "values": [
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_cudq_7",
      "prompt_snippet": "Did you have to consume more caffeine than earlier in order to reach the same ef",
      "dimension": "use",
      "values": [
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_cudq_8",
      "prompt_snippet": "Did you spend a significant amount of time with consuming or obtaining caffeine?",
      "dimension": "use",
      "values": [
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_cudq_9",
      "prompt_snippet": "Did you feel a strong desire or urge to consume caffeine?",
      "dimension": "use",
      "values": [
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_cudq_10",
      "prompt_snippet": "Did the before mentioned phenomena, which you experienced, cause you significant",
      "dimension": "use",
      "values": [
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

- Items: 10
- Dimensions: use
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Did you feel a strong desire or had unsuccessful attempts to reduce or control y | use | 0,1,1,1 | no |
| 2 | Did you consume caffeine despite you knew that it can cause permanent or recurre | use | 0,1,1,1 | no |
| 3 | Did you consume caffeine in order to avoid one or more caffeine withdrawal sympt | use | 0,1,1,1 | no |
| 4 | Did you consume more caffeine or did you consume caffeine longer than you intend | use | 0,1,1,1 | no |
| 5 | Because of caffeine use, did you fail to fulfill any major work, school or home  | use | 0,1,1,1 | no |
| 6 | Did you consume caffeine despite you knew that it can cause permanent or recurre | use | 0,1,1,1 | no |
| 7 | Did you have to consume more caffeine than earlier in order to reach the same ef | use | 0,1,1,1 | no |
| 8 | Did you spend a significant amount of time with consuming or obtaining caffeine? | use | 0,1,1,1 | no |
| 9 | Did you feel a strong desire or urge to consume caffeine? | use | 0,1,1,1 | no |
| 10 | Did the before mentioned phenomena, which you experienced, cause you significant | use | 0,1,1,1 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/caffeine-cudq.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
