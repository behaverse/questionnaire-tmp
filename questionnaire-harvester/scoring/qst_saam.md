# Scoring — State Adult Attachment Measure (SAAM) (`qst_saam`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_saam",
  "title": "State Adult Attachment Measure (SAAM)",
  "short_title": "SAAM",
  "source_url": "https://us.psytoolkit.org/survey-library/attachment-saam.html",
  "publication": {
    "citation": "Gillath, O., Hart, J., Noftle, E. E., & Stockdale, G. D. (2009). Development and validation of a state adult attachment measure (SAAM). Journal of Research in Personality, 43 , 362-373. See also this link to Gillath’s web page .",
    "year": 2009
  },
  "status": "needs-research",
  "item_count": 21,
  "dimensions": [
    "agreesaam"
  ],
  "option_scales": [
    {
      "ref": "opt_saam_agreesaam_7",
      "dimension": "agreesaam",
      "measurement_type": "ordinal",
      "levels": 7,
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "value_range": [
        1,
        7
      ],
      "anchors": [
        "disagree strongly",
        "...",
        "...",
        "neutral / mixed",
        "...",
        "...",
        "agree strongly"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_saam_1",
      "prompt_snippet": "I wish someone would tell me they really love me",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_saam_2",
      "prompt_snippet": "I would be uncomfortable having a good friend or a relationship partner close to",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_saam_3",
      "prompt_snippet": "I feel alone and yet don't feel like getting close to others",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_saam_4",
      "prompt_snippet": "I feel loved",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_saam_5",
      "prompt_snippet": "I wish someone close could see me now",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_saam_6",
      "prompt_snippet": "If something went wrong right now I feel like I could depend on someone",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_saam_7",
      "prompt_snippet": "I feel like others care about me",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_saam_8",
      "prompt_snippet": "I feel a strong need to be unconditionally loved right now",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_saam_9",
      "prompt_snippet": "I am afraid someone will want to get too close to me",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_saam_10",
      "prompt_snippet": "If someone tried to get close to me, I would try to keep my distance",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_saam_11",
      "prompt_snippet": "I feel relaxed knowing that close others are there for me right now",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_saam_12",
      "prompt_snippet": "I really need to feel loved right now",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_saam_13",
      "prompt_snippet": "I feel like I have someone to rely on",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_saam_14",
      "prompt_snippet": "I want to share my feelings with someone",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_saam_15",
      "prompt_snippet": "I feel like I am loved by others but I really don't care",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_saam_16",
      "prompt_snippet": "The idea of being emotionally close to someone makes me nervous",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_saam_17",
      "prompt_snippet": "I want to talk with someone who cares for me about things that are worrying me",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_saam_18",
      "prompt_snippet": "I feel secure and close to other people",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_saam_19",
      "prompt_snippet": "I really need someone's emotional support",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_saam_20",
      "prompt_snippet": "I feel I can trust the people who are close to me",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_saam_21",
      "prompt_snippet": "I have mixed feelings about being close to other people",
      "dimension": "agreesaam",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
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

- Items: 21
- Dimensions: agreesaam
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I wish someone would tell me they really love me | agreesaam | 1,2,3,4,5,6,7 | no |
| 2 | I would be uncomfortable having a good friend or a relationship partner close to | agreesaam | 1,2,3,4,5,6,7 | no |
| 3 | I feel alone and yet don't feel like getting close to others | agreesaam | 1,2,3,4,5,6,7 | no |
| 4 | I feel loved | agreesaam | 1,2,3,4,5,6,7 | no |
| 5 | I wish someone close could see me now | agreesaam | 1,2,3,4,5,6,7 | no |
| 6 | If something went wrong right now I feel like I could depend on someone | agreesaam | 1,2,3,4,5,6,7 | no |
| 7 | I feel like others care about me | agreesaam | 1,2,3,4,5,6,7 | no |
| 8 | I feel a strong need to be unconditionally loved right now | agreesaam | 1,2,3,4,5,6,7 | no |
| 9 | I am afraid someone will want to get too close to me | agreesaam | 1,2,3,4,5,6,7 | no |
| 10 | If someone tried to get close to me, I would try to keep my distance | agreesaam | 1,2,3,4,5,6,7 | no |
| 11 | I feel relaxed knowing that close others are there for me right now | agreesaam | 1,2,3,4,5,6,7 | no |
| 12 | I really need to feel loved right now | agreesaam | 1,2,3,4,5,6,7 | no |
| 13 | I feel like I have someone to rely on | agreesaam | 1,2,3,4,5,6,7 | no |
| 14 | I want to share my feelings with someone | agreesaam | 1,2,3,4,5,6,7 | no |
| 15 | I feel like I am loved by others but I really don't care | agreesaam | 1,2,3,4,5,6,7 | no |
| 16 | The idea of being emotionally close to someone makes me nervous | agreesaam | 1,2,3,4,5,6,7 | no |
| 17 | I want to talk with someone who cares for me about things that are worrying me | agreesaam | 1,2,3,4,5,6,7 | no |
| 18 | I feel secure and close to other people | agreesaam | 1,2,3,4,5,6,7 | no |
| 19 | I really need someone's emotional support | agreesaam | 1,2,3,4,5,6,7 | no |
| 20 | I feel I can trust the people who are close to me | agreesaam | 1,2,3,4,5,6,7 | no |
| 21 | I have mixed feelings about being close to other people | agreesaam | 1,2,3,4,5,6,7 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/attachment-saam.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
