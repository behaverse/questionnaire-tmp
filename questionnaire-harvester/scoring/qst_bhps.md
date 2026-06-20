# Scoring — Brief Histrionic Personality Scale (BHPS) (`qst_bhps`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_bhps",
  "title": "Brief Histrionic Personality Scale (BHPS)",
  "short_title": "BHPS",
  "source_url": "https://us.psytoolkit.org/survey-library/histrionic-bhps.html",
  "publication": {
    "citation": "Ferguson & Negy (2014). Development of a brief screening questionnaire for histrionic personality symptoms. Personality & Individual Differences, 66 , 124-127.",
    "year": 2014
  },
  "status": "needs-research",
  "item_count": 11,
  "dimensions": [
    "frequency"
  ],
  "option_scales": [
    {
      "ref": "opt_bhps_frequency_4",
      "dimension": "frequency",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        1,
        2,
        3,
        4
      ],
      "value_range": [
        1,
        4
      ],
      "anchors": [
        "never true",
        "seldom true",
        "very often true",
        "always true"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_bhps_1",
      "prompt_snippet": "I find it exciting to flirt with others",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_bhps_2",
      "prompt_snippet": "I like to be the center of attention",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_bhps_3",
      "prompt_snippet": "I always seem to have new friends",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_bhps_4",
      "prompt_snippet": "I’d prefer not to commit to just one romantic partner",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_bhps_5",
      "prompt_snippet": "I flirt even with people who I’m not attracted to",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_bhps_6",
      "prompt_snippet": "I tend to be the \"life of the party\"",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_bhps_7",
      "prompt_snippet": "A lot of people find me sexually appealing",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_bhps_8",
      "prompt_snippet": "I know how to make people like me right away",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_bhps_9",
      "prompt_snippet": "I get frustrated when people don’t notice me",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_bhps_10",
      "prompt_snippet": "I’m very interested in material things like cars, shoes, etc.",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_bhps_11",
      "prompt_snippet": "I like it when I know someone desires me sexually",
      "dimension": "frequency",
      "values": [
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

- Items: 11
- Dimensions: frequency
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I find it exciting to flirt with others | frequency | 1,2,3,4 | no |
| 2 | I like to be the center of attention | frequency | 1,2,3,4 | no |
| 3 | I always seem to have new friends | frequency | 1,2,3,4 | no |
| 4 | I’d prefer not to commit to just one romantic partner | frequency | 1,2,3,4 | no |
| 5 | I flirt even with people who I’m not attracted to | frequency | 1,2,3,4 | no |
| 6 | I tend to be the "life of the party" | frequency | 1,2,3,4 | no |
| 7 | A lot of people find me sexually appealing | frequency | 1,2,3,4 | no |
| 8 | I know how to make people like me right away | frequency | 1,2,3,4 | no |
| 9 | I get frustrated when people don’t notice me | frequency | 1,2,3,4 | no |
| 10 | I’m very interested in material things like cars, shoes, etc. | frequency | 1,2,3,4 | no |
| 11 | I like it when I know someone desires me sexually | frequency | 1,2,3,4 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/histrionic-bhps.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
