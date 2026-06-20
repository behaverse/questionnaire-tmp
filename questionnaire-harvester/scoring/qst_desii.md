# Scoring — Dissociative Experiences Scale (DES-II) (`qst_desii`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_desii",
  "title": "Dissociative Experiences Scale (DES-II)",
  "short_title": "DES-II",
  "source_url": "https://psychology-tools.com/test/dissociative-experiences-scale",
  "publication": {
    "citation": "Carlson E B, Putnam F W. An update on the Dissociative Experience Scale. Dissociation 6 ( 1 ): 16-27 ( 1993 ).",
    "year": 1993
  },
  "status": "needs-research",
  "item_count": 28,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_desii_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 11,
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "value_range": [
        0,
        10
      ],
      "anchors": [
        "0%",
        "10%",
        "20%",
        "30%",
        "40%",
        "50%",
        "60%",
        "70%",
        "80%",
        "90%",
        "100%"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_desii_1",
      "prompt_snippet": "Some people have the experience of driving or riding in a car or bus or subway a",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_desii_2",
      "prompt_snippet": "Some people find that sometimes they are listening to someone talk and they sudd",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_desii_3",
      "prompt_snippet": "Some people have the experience of finding themselves in a place and have no ide",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_desii_4",
      "prompt_snippet": "Some people have the experience of finding themselves dressed in clothes that th",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_desii_5",
      "prompt_snippet": "Some people have the experience of finding new things among their belongings tha",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_desii_6",
      "prompt_snippet": "Some people sometimes find that they are approached by people that they do not k",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_desii_7",
      "prompt_snippet": "Some people sometimes have the experience of feeling as though they are standing",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_desii_8",
      "prompt_snippet": "Some people are told that they sometimes do not recognize friends or family memb",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_desii_9",
      "prompt_snippet": "Some people find that they have no memory for some important events in their liv",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_desii_10",
      "prompt_snippet": "Some people have the experience of being accused of lying when they do not think",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_desii_11",
      "prompt_snippet": "Some people have the experience of looking in a mirror and not recognizing thems",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_desii_12",
      "prompt_snippet": "Some people have the experience of feeling that other people, objects, andthe wo",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_desii_13",
      "prompt_snippet": "Some people have the experience of feeling that their body does not seem to belo",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_desii_14",
      "prompt_snippet": "Some people have the experience of sometimes remembering a past event so vividly",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_desii_15",
      "prompt_snippet": "Some people have the experience of not being sure whether things that they remem",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_desii_16",
      "prompt_snippet": "Some people have the experience of being in a familiar place but finding it stra",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_desii_17",
      "prompt_snippet": "Some people find that when they are watching television or a movie they become s",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_desii_18",
      "prompt_snippet": "Some people find that they become so involved in a fantasy or daydream that it f",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_desii_19",
      "prompt_snippet": "Some people find that they sometimes are able to ignore pain. Select the number ",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_desii_20",
      "prompt_snippet": "Some people find that they sometimes sit staring off into space, thinking of not",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_desii_21",
      "prompt_snippet": "Some people sometimes find that when they are alone they talk out loud to themse",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_desii_22",
      "prompt_snippet": "Some people find that in one situation they may act so differently compared with",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_desii_23",
      "prompt_snippet": "Some people sometimes find that in certain situations they are ableto do things ",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_desii_24",
      "prompt_snippet": "Some people sometimes find that they cannot remember whether they have done some",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_desii_25",
      "prompt_snippet": "Some people find evidence that they have done things that they do not remember d",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 26,
      "prompt_id": "pr_desii_26",
      "prompt_snippet": "Some people sometimes find writings, drawings, or notes among their belongings t",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 27,
      "prompt_id": "pr_desii_27",
      "prompt_snippet": "Some people sometimes find that they hear voices inside their head that tell the",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "reversed": false
    },
    {
      "index": 28,
      "prompt_id": "pr_desii_28",
      "prompt_snippet": "Some people sometimes feel as if they are looking at the world through a fog, so",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
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

- Items: 28
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Some people have the experience of driving or riding in a car or bus or subway a | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 2 | Some people find that sometimes they are listening to someone talk and they sudd | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 3 | Some people have the experience of finding themselves in a place and have no ide | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 4 | Some people have the experience of finding themselves dressed in clothes that th | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 5 | Some people have the experience of finding new things among their belongings tha | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 6 | Some people sometimes find that they are approached by people that they do not k | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 7 | Some people sometimes have the experience of feeling as though they are standing | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 8 | Some people are told that they sometimes do not recognize friends or family memb | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 9 | Some people find that they have no memory for some important events in their liv | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 10 | Some people have the experience of being accused of lying when they do not think | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 11 | Some people have the experience of looking in a mirror and not recognizing thems | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 12 | Some people have the experience of feeling that other people, objects, andthe wo | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 13 | Some people have the experience of feeling that their body does not seem to belo | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 14 | Some people have the experience of sometimes remembering a past event so vividly | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 15 | Some people have the experience of not being sure whether things that they remem | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 16 | Some people have the experience of being in a familiar place but finding it stra | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 17 | Some people find that when they are watching television or a movie they become s | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 18 | Some people find that they become so involved in a fantasy or daydream that it f | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 19 | Some people find that they sometimes are able to ignore pain. Select the number  | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 20 | Some people find that they sometimes sit staring off into space, thinking of not | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 21 | Some people sometimes find that when they are alone they talk out loud to themse | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 22 | Some people find that in one situation they may act so differently compared with | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 23 | Some people sometimes find that in certain situations they are ableto do things  | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 24 | Some people sometimes find that they cannot remember whether they have done some | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 25 | Some people find evidence that they have done things that they do not remember d | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 26 | Some people sometimes find writings, drawings, or notes among their belongings t | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 27 | Some people sometimes find that they hear voices inside their head that tell the | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |
| 28 | Some people sometimes feel as if they are looking at the world through a fog, so | rating | 0,1,2,3,4,5,6,7,8,9,10 | no |

## To research (fill from https://psychology-tools.com/test/dissociative-experiences-scale)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
