# Scoring — Primary Care PTSD Screen (DSM-5) (PC-PTSD-5) (`qst_pcptsd5`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_pcptsd5",
  "title": "Primary Care PTSD Screen (DSM-5) (PC-PTSD-5)",
  "short_title": "DSM-5",
  "source_url": "https://psychology-tools.com/test/pc-ptsd-5",
  "publication": {
    "citation": "A Prins, MJ Bovin, R Kimerling, DG Kaloupek, BP Marx, A Pless-Kaiser, PP Schnurr. The Primary Care PTSD Screen for DSM-5 (PC-PTSD-5): Development and Evaluation Within a Veteran Primary Care Sample. J Gen Intern Med 31 ( 10 ): 1206-1211 ( 2016 ).",
    "year": 2016
  },
  "status": "needs-research",
  "item_count": 6,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_pcptsd5_rating_1",
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
        "Yes",
        "No"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_pcptsd5_1",
      "prompt_snippet": "Have you ever experienced this kind of event?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_pcptsd5_2",
      "prompt_snippet": "had nightmares about the event(s) or thought about the event(s) when you did not",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_pcptsd5_3",
      "prompt_snippet": "tried hard not to think about the event(s) or went out of your way to avoid situ",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_pcptsd5_4",
      "prompt_snippet": "been constantly on guard, watchful, or easily startled?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_pcptsd5_5",
      "prompt_snippet": "felt numb or detached from people, activities, or your surroundings?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_pcptsd5_6",
      "prompt_snippet": "felt guilty or unable to stop blaming yourself or others for the event(s) or any",
      "dimension": "rating",
      "values": [
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

- Items: 6
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Have you ever experienced this kind of event? | rating | 1,0 | no |
| 2 | had nightmares about the event(s) or thought about the event(s) when you did not | rating | 1,0 | no |
| 3 | tried hard not to think about the event(s) or went out of your way to avoid situ | rating | 1,0 | no |
| 4 | been constantly on guard, watchful, or easily startled? | rating | 1,0 | no |
| 5 | felt numb or detached from people, activities, or your surroundings? | rating | 1,0 | no |
| 6 | felt guilty or unable to stop blaming yourself or others for the event(s) or any | rating | 1,0 | no |

## To research (fill from https://psychology-tools.com/test/pc-ptsd-5)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
