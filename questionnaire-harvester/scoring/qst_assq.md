# Scoring — Autism Spectrum Screening Questionnaire (ASSQ) (`qst_assq`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_assq",
  "title": "Autism Spectrum Screening Questionnaire (ASSQ)",
  "short_title": "ASSQ",
  "source_url": "https://psychology-tools.com/test/autism-spectrum-screening-questionnaire",
  "publication": {
    "citation": "S Ehlers, C Gillberg, L Wing. A screening questionnaire for Asperger syndrome and other high-functioning autism spectrum disorders in school age children. J Autism Dev Disord. 1999; 29 ( 2 ): 129 – 141.",
    "year": 1999
  },
  "status": "needs-research",
  "item_count": 27,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_assq_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 3,
      "values": [
        0,
        1,
        2
      ],
      "value_range": [
        0,
        2
      ],
      "anchors": [
        "No",
        "Somewhat",
        "Yes"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_assq_1",
      "prompt_snippet": "is old-fashioned or precocious",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_assq_2",
      "prompt_snippet": "is regarded as an “eccentric professor” by the other children",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_assq_3",
      "prompt_snippet": "lives somewhat in a world of his/her own with restricted idiosyncratic intellect",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_assq_4",
      "prompt_snippet": "accumulates facts on certain subjects (good rote memory) but does not really und",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_assq_5",
      "prompt_snippet": "has a literal understanding of ambiguous and metaphorical language",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_assq_6",
      "prompt_snippet": "has a deviant style of communication with a formal, fussy, old-fashioned or “rob",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_assq_7",
      "prompt_snippet": "invents idiosyncratic words and expressions",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_assq_8",
      "prompt_snippet": "has a different voice or speech",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_assq_9",
      "prompt_snippet": "expresses sounds involuntarily; clears throat, grunts, smacks, cries or screams",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_assq_10",
      "prompt_snippet": "is surprisingly good at some things and surprisingly poor at others",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_assq_11",
      "prompt_snippet": "uses language freely but fails to make adjustment to fit social contexts or the ",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_assq_12",
      "prompt_snippet": "lacks empathy",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_assq_13",
      "prompt_snippet": "makes naive and embarrassing remarks",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_assq_14",
      "prompt_snippet": "has a deviant style of gaze",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_assq_15",
      "prompt_snippet": "wishes to be sociable but fails to make relationships with peers",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_assq_16",
      "prompt_snippet": "can be with other children but only on his/her terms",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_assq_17",
      "prompt_snippet": "lacks best friend",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_assq_18",
      "prompt_snippet": "lacks common sense",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_assq_19",
      "prompt_snippet": "is poor at games: no idea of cooperating in a team, scores “own goals”",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_assq_20",
      "prompt_snippet": "has clumsy, ill coordinated, ungainly, awkward movements or gestures",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_assq_21",
      "prompt_snippet": "has involuntary face or body movements",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_assq_22",
      "prompt_snippet": "has difficulties in completing simple daily activities because of compulsory rep",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_assq_23",
      "prompt_snippet": "has special routines: insists on no change",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_assq_24",
      "prompt_snippet": "shows idiosyncratic attachment to objects",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_assq_25",
      "prompt_snippet": "is bullied by other children",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 26,
      "prompt_id": "pr_assq_26",
      "prompt_snippet": "has markedly unusual facial expression",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 27,
      "prompt_id": "pr_assq_27",
      "prompt_snippet": "has markedly unusual posture",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
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

- Items: 27
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | is old-fashioned or precocious | rating | 0,1,2 | no |
| 2 | is regarded as an “eccentric professor” by the other children | rating | 0,1,2 | no |
| 3 | lives somewhat in a world of his/her own with restricted idiosyncratic intellect | rating | 0,1,2 | no |
| 4 | accumulates facts on certain subjects (good rote memory) but does not really und | rating | 0,1,2 | no |
| 5 | has a literal understanding of ambiguous and metaphorical language | rating | 0,1,2 | no |
| 6 | has a deviant style of communication with a formal, fussy, old-fashioned or “rob | rating | 0,1,2 | no |
| 7 | invents idiosyncratic words and expressions | rating | 0,1,2 | no |
| 8 | has a different voice or speech | rating | 0,1,2 | no |
| 9 | expresses sounds involuntarily; clears throat, grunts, smacks, cries or screams | rating | 0,1,2 | no |
| 10 | is surprisingly good at some things and surprisingly poor at others | rating | 0,1,2 | no |
| 11 | uses language freely but fails to make adjustment to fit social contexts or the  | rating | 0,1,2 | no |
| 12 | lacks empathy | rating | 0,1,2 | no |
| 13 | makes naive and embarrassing remarks | rating | 0,1,2 | no |
| 14 | has a deviant style of gaze | rating | 0,1,2 | no |
| 15 | wishes to be sociable but fails to make relationships with peers | rating | 0,1,2 | no |
| 16 | can be with other children but only on his/her terms | rating | 0,1,2 | no |
| 17 | lacks best friend | rating | 0,1,2 | no |
| 18 | lacks common sense | rating | 0,1,2 | no |
| 19 | is poor at games: no idea of cooperating in a team, scores “own goals” | rating | 0,1,2 | no |
| 20 | has clumsy, ill coordinated, ungainly, awkward movements or gestures | rating | 0,1,2 | no |
| 21 | has involuntary face or body movements | rating | 0,1,2 | no |
| 22 | has difficulties in completing simple daily activities because of compulsory rep | rating | 0,1,2 | no |
| 23 | has special routines: insists on no change | rating | 0,1,2 | no |
| 24 | shows idiosyncratic attachment to objects | rating | 0,1,2 | no |
| 25 | is bullied by other children | rating | 0,1,2 | no |
| 26 | has markedly unusual facial expression | rating | 0,1,2 | no |
| 27 | has markedly unusual posture | rating | 0,1,2 | no |

## To research (fill from https://psychology-tools.com/test/autism-spectrum-screening-questionnaire)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
