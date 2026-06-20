# Scoring — Taylor Manifest Anxiety Scale (TMAS) (`qst_tmas`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_tmas",
  "title": "Taylor Manifest Anxiety Scale (TMAS)",
  "short_title": "TMAS",
  "source_url": "https://psychology-tools.com/test/taylor-manifest-anxiety-scale",
  "publication": {
    "citation": "Janet A. Taylor. A Personality Scale of Manifest Anxiety. 48 ( 2 ) J. Abnormal and Social Psych. 285-290. 1953.",
    "year": 1953
  },
  "status": "needs-research",
  "item_count": 38,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_tmas_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 2,
      "values": [
        0,
        1
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "True",
        "False"
      ]
    },
    {
      "ref": "opt_tmas_rating_2",
      "dimension": "rating",
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
        "True",
        "False"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_tmas_1",
      "prompt_snippet": "I do not tire quickly",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_tmas_2",
      "prompt_snippet": "I believe I am no more nervous than others",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_tmas_3",
      "prompt_snippet": "I have very few headaches",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_tmas_4",
      "prompt_snippet": "I work under a great deal of tension",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_tmas_5",
      "prompt_snippet": "I frequently notice my hand shakes when I try do something",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_tmas_6",
      "prompt_snippet": "I blush no more often than others",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_tmas_7",
      "prompt_snippet": "I have diarrhea one a month or more",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_tmas_8",
      "prompt_snippet": "I worry quite a bit over possible misfortunes",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_tmas_9",
      "prompt_snippet": "I practically never blush",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_tmas_10",
      "prompt_snippet": "I am often afraid that I am going to blush",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_tmas_11",
      "prompt_snippet": "My hands and feet are usually warm enough",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_tmas_12",
      "prompt_snippet": "I sweat very easily even on cool days",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_tmas_13",
      "prompt_snippet": "Sometimes when embarrassed, I break out in a sweat",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_tmas_14",
      "prompt_snippet": "I hardly ever notice my heart pounding, and I am seldom short of breath",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_tmas_15",
      "prompt_snippet": "I feel hungry almost all of the time",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_tmas_16",
      "prompt_snippet": "I am very seldom troubled by constipation",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_tmas_17",
      "prompt_snippet": "I have a great deal of stomach trouble",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_tmas_18",
      "prompt_snippet": "I have had periods in which I lost sleep over worry",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_tmas_19",
      "prompt_snippet": "I am easily embarrassed",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_tmas_20",
      "prompt_snippet": "I am more sensitive than most other people",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_tmas_21",
      "prompt_snippet": "I frequently find myself worrying about something",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_tmas_22",
      "prompt_snippet": "I wish I could be as happy as others seem to be",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_tmas_23",
      "prompt_snippet": "I am usually calm and not easily upset",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_tmas_24",
      "prompt_snippet": "I feel anxiety about something or someone almost all of the time",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_tmas_25",
      "prompt_snippet": "I am happy most of the time",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 26,
      "prompt_id": "pr_tmas_26",
      "prompt_snippet": "It makes me nervous to have to wait",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 27,
      "prompt_id": "pr_tmas_27",
      "prompt_snippet": "Sometimes I become so excited I find it hard to get to sleep",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 28,
      "prompt_id": "pr_tmas_28",
      "prompt_snippet": "I have sometimes felt that difficulties piling up so high I couldn’t get over th",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 29,
      "prompt_id": "pr_tmas_29",
      "prompt_snippet": "I admit I have felt worried beyond reason over small things",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 30,
      "prompt_id": "pr_tmas_30",
      "prompt_snippet": "I have very few fears compared to my friends",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 31,
      "prompt_id": "pr_tmas_31",
      "prompt_snippet": "I certainly feel useless at times",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 32,
      "prompt_id": "pr_tmas_32",
      "prompt_snippet": "I find it hard to keep my mind on a task or job",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 33,
      "prompt_id": "pr_tmas_33",
      "prompt_snippet": "I am usually self-conscious",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 34,
      "prompt_id": "pr_tmas_34",
      "prompt_snippet": "I am inclined to take things hard",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 35,
      "prompt_id": "pr_tmas_35",
      "prompt_snippet": "At times I think I am no good at all",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 36,
      "prompt_id": "pr_tmas_36",
      "prompt_snippet": "I am certainly lacking in self-confidence",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 37,
      "prompt_id": "pr_tmas_37",
      "prompt_snippet": "I sometimes feel that I am about to go to pieces",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 38,
      "prompt_id": "pr_tmas_38",
      "prompt_snippet": "I am entirely self-confident",
      "dimension": "rating",
      "values": [
        0,
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

- Items: 38
- Dimensions: rating
- Distinct scales: 2 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I do not tire quickly | rating | 0,1 | no |
| 2 | I believe I am no more nervous than others | rating | 0,1 | no |
| 3 | I have very few headaches | rating | 0,1 | no |
| 4 | I work under a great deal of tension | rating | 1,0 | no |
| 5 | I frequently notice my hand shakes when I try do something | rating | 1,0 | no |
| 6 | I blush no more often than others | rating | 0,1 | no |
| 7 | I have diarrhea one a month or more | rating | 1,0 | no |
| 8 | I worry quite a bit over possible misfortunes | rating | 1,0 | no |
| 9 | I practically never blush | rating | 0,1 | no |
| 10 | I am often afraid that I am going to blush | rating | 1,0 | no |
| 11 | My hands and feet are usually warm enough | rating | 0,1 | no |
| 12 | I sweat very easily even on cool days | rating | 1,0 | no |
| 13 | Sometimes when embarrassed, I break out in a sweat | rating | 1,0 | no |
| 14 | I hardly ever notice my heart pounding, and I am seldom short of breath | rating | 0,1 | no |
| 15 | I feel hungry almost all of the time | rating | 1,0 | no |
| 16 | I am very seldom troubled by constipation | rating | 0,1 | no |
| 17 | I have a great deal of stomach trouble | rating | 1,0 | no |
| 18 | I have had periods in which I lost sleep over worry | rating | 1,0 | no |
| 19 | I am easily embarrassed | rating | 1,0 | no |
| 20 | I am more sensitive than most other people | rating | 1,0 | no |
| 21 | I frequently find myself worrying about something | rating | 1,0 | no |
| 22 | I wish I could be as happy as others seem to be | rating | 1,0 | no |
| 23 | I am usually calm and not easily upset | rating | 0,1 | no |
| 24 | I feel anxiety about something or someone almost all of the time | rating | 1,0 | no |
| 25 | I am happy most of the time | rating | 0,1 | no |
| 26 | It makes me nervous to have to wait | rating | 1,0 | no |
| 27 | Sometimes I become so excited I find it hard to get to sleep | rating | 1,0 | no |
| 28 | I have sometimes felt that difficulties piling up so high I couldn’t get over th | rating | 1,0 | no |
| 29 | I admit I have felt worried beyond reason over small things | rating | 1,0 | no |
| 30 | I have very few fears compared to my friends | rating | 0,1 | no |
| 31 | I certainly feel useless at times | rating | 1,0 | no |
| 32 | I find it hard to keep my mind on a task or job | rating | 1,0 | no |
| 33 | I am usually self-conscious | rating | 1,0 | no |
| 34 | I am inclined to take things hard | rating | 1,0 | no |
| 35 | At times I think I am no good at all | rating | 1,0 | no |
| 36 | I am certainly lacking in self-confidence | rating | 1,0 | no |
| 37 | I sometimes feel that I am about to go to pieces | rating | 1,0 | no |
| 38 | I am entirely self-confident | rating | 0,1 | no |

## To research (fill from https://psychology-tools.com/test/taylor-manifest-anxiety-scale)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
