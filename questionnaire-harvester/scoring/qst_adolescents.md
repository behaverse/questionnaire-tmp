# Scoring — Aggressive behavior scale (for adolescents) (`qst_adolescents`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_adolescents",
  "title": "Aggressive behavior scale (for adolescents)",
  "short_title": "for adolescents",
  "source_url": "https://us.psytoolkit.org/survey-library/aggression-adolescents.html",
  "publication": {
    "citation": "Orpinas, P., and Frankowski, R. (2001). The Aggression Scale: A\nSelf-Report Measure of Aggressive Behavior for Young\nAdolescents. Journal of Early Adolescence, 21 , 50-67.",
    "year": 2001
  },
  "status": "needs-research",
  "item_count": 11,
  "dimensions": [
    "times"
  ],
  "option_scales": [
    {
      "ref": "opt_adolescents_times_7",
      "dimension": "times",
      "measurement_type": "ordinal",
      "levels": 7,
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "value_range": [
        0,
        6
      ],
      "anchors": [
        "never",
        "1 time",
        "2 times",
        "3 times",
        "4 times",
        "5 times",
        "6 times or more"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_adolescents_1",
      "prompt_snippet": "I teased students to make them angry.",
      "dimension": "times",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_adolescents_2",
      "prompt_snippet": "I got angry very easily with someone.",
      "dimension": "times",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_adolescents_3",
      "prompt_snippet": "I fought back when someone hit me first.",
      "dimension": "times",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_adolescents_4",
      "prompt_snippet": "I said things about other kids to make other students laugh.",
      "dimension": "times",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_adolescents_5",
      "prompt_snippet": "I encouraged other students to fight.",
      "dimension": "times",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_adolescents_6",
      "prompt_snippet": "I pushed or shoved other students.",
      "dimension": "times",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_adolescents_7",
      "prompt_snippet": "I was angry most of the day.",
      "dimension": "times",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_adolescents_8",
      "prompt_snippet": "I got into a physical fight because I was angry.",
      "dimension": "times",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_adolescents_9",
      "prompt_snippet": "I slapped or kicked someone.",
      "dimension": "times",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_adolescents_10",
      "prompt_snippet": "I called other students bad names.",
      "dimension": "times",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_adolescents_11",
      "prompt_snippet": "I threatened to hurt or to hit someone.",
      "dimension": "times",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
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
- Dimensions: times
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I teased students to make them angry. | times | 0,1,2,3,4,5,6 | no |
| 2 | I got angry very easily with someone. | times | 0,1,2,3,4,5,6 | no |
| 3 | I fought back when someone hit me first. | times | 0,1,2,3,4,5,6 | no |
| 4 | I said things about other kids to make other students laugh. | times | 0,1,2,3,4,5,6 | no |
| 5 | I encouraged other students to fight. | times | 0,1,2,3,4,5,6 | no |
| 6 | I pushed or shoved other students. | times | 0,1,2,3,4,5,6 | no |
| 7 | I was angry most of the day. | times | 0,1,2,3,4,5,6 | no |
| 8 | I got into a physical fight because I was angry. | times | 0,1,2,3,4,5,6 | no |
| 9 | I slapped or kicked someone. | times | 0,1,2,3,4,5,6 | no |
| 10 | I called other students bad names. | times | 0,1,2,3,4,5,6 | no |
| 11 | I threatened to hurt or to hit someone. | times | 0,1,2,3,4,5,6 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/aggression-adolescents.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
