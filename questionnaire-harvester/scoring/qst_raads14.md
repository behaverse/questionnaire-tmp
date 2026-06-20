# Scoring — Ritvo Autism & Asperger Diagnostic Scale (RAADS-14) (`qst_raads14`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_raads14",
  "title": "Ritvo Autism & Asperger Diagnostic Scale (RAADS-14)",
  "short_title": "RAADS-14",
  "source_url": "https://psychology-tools.com/test/raads-14",
  "publication": {
    "citation": "J M Eriksson, L M Andersen, & S Bejerot. RAADS-14 Screen: validity of a screening tool for autism spectrum disorder in an adult psychiatric population. Molecular Autism, ( 4 ): 49. Dec 2013",
    "year": 2013
  },
  "status": "needs-research",
  "item_count": 14,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_raads14_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        3,
        2,
        1,
        0
      ],
      "value_range": [
        0,
        3
      ],
      "anchors": [
        "True Now & When I was Young",
        "True Only Now",
        "True When I Was Young",
        "Never True"
      ]
    },
    {
      "ref": "opt_raads14_rating_2",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        0,
        1,
        2,
        3
      ],
      "value_range": [
        0,
        3
      ],
      "anchors": [
        "True Now & When I was Young",
        "True Only Now",
        "True When I Was Young",
        "Never True"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_raads14_1",
      "prompt_snippet": "It is difficult for me to understand how other people are feeling when we are ta",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_raads14_2",
      "prompt_snippet": "Some ordinary textures that do not bother others feel very offensive when they t",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_raads14_3",
      "prompt_snippet": "It is very difficult for me to work and function in groups.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_raads14_4",
      "prompt_snippet": "It is difficult to figure out what other people expect of me.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_raads14_5",
      "prompt_snippet": "I often don’t know how to act in social situations.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_raads14_6",
      "prompt_snippet": "I can chat and make small talk with people.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_raads14_7",
      "prompt_snippet": "When I feel overwhelmed by my senses, I have to isolate myself to shut them down",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_raads14_8",
      "prompt_snippet": "How to make friends and socialize is a mystery to me.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_raads14_9",
      "prompt_snippet": "When talking to someone, I have a hard time telling when it is my turn to talk o",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_raads14_10",
      "prompt_snippet": "Sometimes I have to cover my ears to block out painful noises (like vacuum clean",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_raads14_11",
      "prompt_snippet": "It can be very hard to read someone’s face, hand, and body movements when we are",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_raads14_12",
      "prompt_snippet": "I focus on details rather than the overall idea.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_raads14_13",
      "prompt_snippet": "I take things too literally, so I often miss what people are trying to say.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_raads14_14",
      "prompt_snippet": "I get extremely upset when the way I like to do things is suddenly changed.",
      "dimension": "rating",
      "values": [
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

- Items: 14
- Dimensions: rating
- Distinct scales: 2 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | It is difficult for me to understand how other people are feeling when we are ta | rating | 3,2,1,0 | no |
| 2 | Some ordinary textures that do not bother others feel very offensive when they t | rating | 3,2,1,0 | no |
| 3 | It is very difficult for me to work and function in groups. | rating | 3,2,1,0 | no |
| 4 | It is difficult to figure out what other people expect of me. | rating | 3,2,1,0 | no |
| 5 | I often don’t know how to act in social situations. | rating | 3,2,1,0 | no |
| 6 | I can chat and make small talk with people. | rating | 0,1,2,3 | no |
| 7 | When I feel overwhelmed by my senses, I have to isolate myself to shut them down | rating | 3,2,1,0 | no |
| 8 | How to make friends and socialize is a mystery to me. | rating | 3,2,1,0 | no |
| 9 | When talking to someone, I have a hard time telling when it is my turn to talk o | rating | 3,2,1,0 | no |
| 10 | Sometimes I have to cover my ears to block out painful noises (like vacuum clean | rating | 3,2,1,0 | no |
| 11 | It can be very hard to read someone’s face, hand, and body movements when we are | rating | 3,2,1,0 | no |
| 12 | I focus on details rather than the overall idea. | rating | 3,2,1,0 | no |
| 13 | I take things too literally, so I often miss what people are trying to say. | rating | 3,2,1,0 | no |
| 14 | I get extremely upset when the way I like to do things is suddenly changed. | rating | 3,2,1,0 | no |

## To research (fill from https://psychology-tools.com/test/raads-14)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
