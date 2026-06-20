# Scoring — Shutdown Dissociation Scale (SHUT-D) (`qst_shutd`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_shutd",
  "title": "Shutdown Dissociation Scale (SHUT-D)",
  "short_title": "SHUT-D",
  "source_url": "https://psychology-tools.com/test/shutdown-dissociation-scale",
  "publication": {
    "citation": "I Schalinski, M Schauer, T Elbert. The Shutdown Dissociation Scale (SHUT-D). Euro. J. of Psychotraumatology, 6(0) ( 2015 ).",
    "year": 2015
  },
  "status": "needs-research",
  "item_count": 13,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_shutd_rating_1",
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
        "Not at all",
        "once a week or less",
        "2-4 time a week",
        "5 or more times a week"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_shutd_1",
      "prompt_snippet": "Have you fainted? Have you been passing out?",
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
      "index": 2,
      "prompt_id": "pr_shutd_2",
      "prompt_snippet": "Have you felt dizzy and has your vision gone black? Felt dizzy and couldn’t see ",
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
      "index": 3,
      "prompt_id": "pr_shutd_3",
      "prompt_snippet": "Have you felt as though you couldn’t hear for a while, as though you were deaf? ",
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
      "index": 4,
      "prompt_id": "pr_shutd_4",
      "prompt_snippet": "Have you had an experience of not being able to properly see things around you (",
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
      "index": 5,
      "prompt_id": "pr_shutd_5",
      "prompt_snippet": "Have you felt as though your body or a part of your body has gone numb?",
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
      "index": 6,
      "prompt_id": "pr_shutd_6",
      "prompt_snippet": "Have you felt as though you couldn’t move for a while, as though you were paraly",
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
      "prompt_id": "pr_shutd_7",
      "prompt_snippet": "Have you felt as though your body, or a part of it was insensitive to pain (anal",
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
      "index": 8,
      "prompt_id": "pr_shutd_8",
      "prompt_snippet": "Have you been in a state in which your body suddenly felt heavy and tired?",
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
      "index": 9,
      "prompt_id": "pr_shutd_9",
      "prompt_snippet": "Have you experienced that your body becoming stiff for a while?",
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
      "index": 10,
      "prompt_id": "pr_shutd_10",
      "prompt_snippet": "Have you felt nauseous? Have you felt as though you were about to throw up? Have",
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
      "index": 11,
      "prompt_id": "pr_shutd_11",
      "prompt_snippet": "Have you had an “out-of-body” sensation? Have you felt as though you were outsid",
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
      "index": 12,
      "prompt_id": "pr_shutd_12",
      "prompt_snippet": "Have you had moments in which you have found yourself unable to speak? Have you ",
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
      "index": 13,
      "prompt_id": "pr_shutd_13",
      "prompt_snippet": "Have you felt suddenly weak and warm?",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
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

- Items: 13
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Have you fainted? Have you been passing out? | rating | 0,1,2,3 | no |
| 2 | Have you felt dizzy and has your vision gone black? Felt dizzy and couldn’t see  | rating | 0,1,2,3 | no |
| 3 | Have you felt as though you couldn’t hear for a while, as though you were deaf?  | rating | 0,1,2,3 | no |
| 4 | Have you had an experience of not being able to properly see things around you ( | rating | 0,1,2,3 | no |
| 5 | Have you felt as though your body or a part of your body has gone numb? | rating | 0,1,2,3 | no |
| 6 | Have you felt as though you couldn’t move for a while, as though you were paraly | rating | 0,1,2,3 | no |
| 7 | Have you felt as though your body, or a part of it was insensitive to pain (anal | rating | 0,1,2,3 | no |
| 8 | Have you been in a state in which your body suddenly felt heavy and tired? | rating | 0,1,2,3 | no |
| 9 | Have you experienced that your body becoming stiff for a while? | rating | 0,1,2,3 | no |
| 10 | Have you felt nauseous? Have you felt as though you were about to throw up? Have | rating | 0,1,2,3 | no |
| 11 | Have you had an “out-of-body” sensation? Have you felt as though you were outsid | rating | 0,1,2,3 | no |
| 12 | Have you had moments in which you have found yourself unable to speak? Have you  | rating | 0,1,2,3 | no |
| 13 | Have you felt suddenly weak and warm? | rating | 0,1,2,3 | no |

## To research (fill from https://psychology-tools.com/test/shutdown-dissociation-scale)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
