# Scoring — Adult ADHD Self-Report Scale (ASRS) (`qst_asrs`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_asrs",
  "title": "Adult ADHD Self-Report Scale (ASRS)",
  "short_title": "ASRS",
  "source_url": "https://us.psytoolkit.org/survey-library/asrs.html",
  "publication": {
    "citation": "Kessler RC, Adler L, Ames M, Demler O, Faraone S, Hiripi E, Howes\nMJ, Jin R, Secnik K, Spencer T, Ustun TB, Walters EE (2005). The World\nHealth Organization Adult ADHD Self-Report Scale (ASRS): a short\nscreening scale for use in the general population. Psychol Medince ,\n,35(2), 245-56. Link to paper",
    "year": 2005
  },
  "status": "needs-research",
  "item_count": 18,
  "dimensions": [
    "asrs_scale"
  ],
  "option_scales": [
    {
      "ref": "opt_asrs_asrs_scale_5",
      "dimension": "asrs_scale",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "value_range": [
        1,
        5
      ],
      "anchors": [
        "Never",
        "Rarely",
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
      "prompt_id": "pr_asrs_1",
      "prompt_snippet": "How often do you have trouble wrapping up the final details of a project, once t",
      "dimension": "asrs_scale",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_asrs_2",
      "prompt_snippet": "How often do you have difficulty getting things in order when you have to do a t",
      "dimension": "asrs_scale",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_asrs_3",
      "prompt_snippet": "How often do you have problems remembering appointments or obligations?",
      "dimension": "asrs_scale",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_asrs_4",
      "prompt_snippet": "When you have a task that requires a lot of thought, how often do you avoid or d",
      "dimension": "asrs_scale",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_asrs_5",
      "prompt_snippet": "How often do you fidget or squirm with your hands or feet when you have to sit d",
      "dimension": "asrs_scale",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_asrs_6",
      "prompt_snippet": "How often do you feel overly active and compelled to do things, like you were dr",
      "dimension": "asrs_scale",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_asrs_7",
      "prompt_snippet": "How often do you make careless mistakes when you have to work on a boring or dif",
      "dimension": "asrs_scale",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_asrs_8",
      "prompt_snippet": "How often do you have difficulty keeping your attention when you are doing borin",
      "dimension": "asrs_scale",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_asrs_9",
      "prompt_snippet": "How often do you have difficulty concentrating on what people say to you, even w",
      "dimension": "asrs_scale",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_asrs_10",
      "prompt_snippet": "How often do you misplace or have difficulty finding things at home or at work?",
      "dimension": "asrs_scale",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_asrs_11",
      "prompt_snippet": "How often are you distracted by activity or noise around you?",
      "dimension": "asrs_scale",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_asrs_12",
      "prompt_snippet": "How often do you leave your seat in meetings or other situations in which you ar",
      "dimension": "asrs_scale",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_asrs_13",
      "prompt_snippet": "How often do you feel restless or fidgety?",
      "dimension": "asrs_scale",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_asrs_14",
      "prompt_snippet": "How often do you have difficulty unwinding and relaxing when you have time to yo",
      "dimension": "asrs_scale",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_asrs_15",
      "prompt_snippet": "How often do you find yourself talking too much when you are in social situation",
      "dimension": "asrs_scale",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_asrs_16",
      "prompt_snippet": "When you’re in a conversation, how often do you find yourself finishing the sent",
      "dimension": "asrs_scale",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_asrs_17",
      "prompt_snippet": "How often do you have difficulty waiting your turn in situations when turn takin",
      "dimension": "asrs_scale",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_asrs_18",
      "prompt_snippet": "How often do you interrupt others when they are busy?",
      "dimension": "asrs_scale",
      "values": [
        1,
        2,
        3,
        4,
        5
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

- Items: 18
- Dimensions: asrs_scale
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | How often do you have trouble wrapping up the final details of a project, once t | asrs_scale | 1,2,3,4,5 | no |
| 2 | How often do you have difficulty getting things in order when you have to do a t | asrs_scale | 1,2,3,4,5 | no |
| 3 | How often do you have problems remembering appointments or obligations? | asrs_scale | 1,2,3,4,5 | no |
| 4 | When you have a task that requires a lot of thought, how often do you avoid or d | asrs_scale | 1,2,3,4,5 | no |
| 5 | How often do you fidget or squirm with your hands or feet when you have to sit d | asrs_scale | 1,2,3,4,5 | no |
| 6 | How often do you feel overly active and compelled to do things, like you were dr | asrs_scale | 1,2,3,4,5 | no |
| 7 | How often do you make careless mistakes when you have to work on a boring or dif | asrs_scale | 1,2,3,4,5 | no |
| 8 | How often do you have difficulty keeping your attention when you are doing borin | asrs_scale | 1,2,3,4,5 | no |
| 9 | How often do you have difficulty concentrating on what people say to you, even w | asrs_scale | 1,2,3,4,5 | no |
| 10 | How often do you misplace or have difficulty finding things at home or at work? | asrs_scale | 1,2,3,4,5 | no |
| 11 | How often are you distracted by activity or noise around you? | asrs_scale | 1,2,3,4,5 | no |
| 12 | How often do you leave your seat in meetings or other situations in which you ar | asrs_scale | 1,2,3,4,5 | no |
| 13 | How often do you feel restless or fidgety? | asrs_scale | 1,2,3,4,5 | no |
| 14 | How often do you have difficulty unwinding and relaxing when you have time to yo | asrs_scale | 1,2,3,4,5 | no |
| 15 | How often do you find yourself talking too much when you are in social situation | asrs_scale | 1,2,3,4,5 | no |
| 16 | When you’re in a conversation, how often do you find yourself finishing the sent | asrs_scale | 1,2,3,4,5 | no |
| 17 | How often do you have difficulty waiting your turn in situations when turn takin | asrs_scale | 1,2,3,4,5 | no |
| 18 | How often do you interrupt others when they are busy? | asrs_scale | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/asrs.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
