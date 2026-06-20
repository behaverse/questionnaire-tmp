# Scoring — Service to Others in Sobriety (SOS) questionnaire (`qst_sos`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_sos",
  "title": "Service to Others in Sobriety (SOS) questionnaire",
  "short_title": "SOS",
  "source_url": "https://us.psytoolkit.org/survey-library/alcohol-sobriety-sos.html",
  "publication": {
    "citation": "Pagano, M.E., Krentzman, A.R., Onder, C.C., Baryak, J.L., Murphy, J.L., Zywiak, W.H.,  & Stout, R. L. (2010). Service to Others in Sobriety (SOS). Alcohol Treatment Quarterly, 28 , 111-127. Read this paper online for free .",
    "year": 2010
  },
  "status": "needs-research",
  "item_count": 12,
  "dimensions": [
    "sosfreq"
  ],
  "option_scales": [
    {
      "ref": "opt_sos_sosfreq_5",
      "dimension": "sosfreq",
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
        "never",
        "rarely",
        "sometimes",
        "often",
        "always"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_sos_1",
      "prompt_snippet": "Take calls or spent time with a sponsee?",
      "dimension": "sosfreq",
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
      "prompt_id": "pr_sos_2",
      "prompt_snippet": "Guide an alcoholic/addict through the 12-Steps?",
      "dimension": "sosfreq",
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
      "prompt_id": "pr_sos_3",
      "prompt_snippet": "Hold a service position in a 12-Step program?",
      "dimension": "sosfreq",
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
      "prompt_id": "pr_sos_4",
      "prompt_snippet": "Say something positive to an alcoholic/addict?",
      "dimension": "sosfreq",
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
      "prompt_id": "pr_sos_5",
      "prompt_snippet": "Listen to an alcoholic/addict?",
      "dimension": "sosfreq",
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
      "prompt_id": "pr_sos_6",
      "prompt_snippet": "Say hello to a newcomer?",
      "dimension": "sosfreq",
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
      "prompt_id": "pr_sos_7",
      "prompt_snippet": "Reach out to an alcoholic/addict having a hard time?",
      "dimension": "sosfreq",
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
      "prompt_id": "pr_sos_8",
      "prompt_snippet": "Share a personal story with an alcoholic/addict?",
      "dimension": "sosfreq",
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
      "prompt_id": "pr_sos_9",
      "prompt_snippet": "Read program literature to an alcoholic/addict?",
      "dimension": "sosfreq",
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
      "prompt_id": "pr_sos_10",
      "prompt_snippet": "Encourage an alcoholic/addict to go to a meeting?",
      "dimension": "sosfreq",
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
      "prompt_id": "pr_sos_11",
      "prompt_snippet": "Donate money to Alcoholics Anonymous or Narcotics Anonymous?",
      "dimension": "sosfreq",
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
      "prompt_id": "pr_sos_12",
      "prompt_snippet": "Put away chairs after a meeting?",
      "dimension": "sosfreq",
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

- Items: 12
- Dimensions: sosfreq
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Take calls or spent time with a sponsee? | sosfreq | 1,2,3,4,5 | no |
| 2 | Guide an alcoholic/addict through the 12-Steps? | sosfreq | 1,2,3,4,5 | no |
| 3 | Hold a service position in a 12-Step program? | sosfreq | 1,2,3,4,5 | no |
| 4 | Say something positive to an alcoholic/addict? | sosfreq | 1,2,3,4,5 | no |
| 5 | Listen to an alcoholic/addict? | sosfreq | 1,2,3,4,5 | no |
| 6 | Say hello to a newcomer? | sosfreq | 1,2,3,4,5 | no |
| 7 | Reach out to an alcoholic/addict having a hard time? | sosfreq | 1,2,3,4,5 | no |
| 8 | Share a personal story with an alcoholic/addict? | sosfreq | 1,2,3,4,5 | no |
| 9 | Read program literature to an alcoholic/addict? | sosfreq | 1,2,3,4,5 | no |
| 10 | Encourage an alcoholic/addict to go to a meeting? | sosfreq | 1,2,3,4,5 | no |
| 11 | Donate money to Alcoholics Anonymous or Narcotics Anonymous? | sosfreq | 1,2,3,4,5 | no |
| 12 | Put away chairs after a meeting? | sosfreq | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/alcohol-sobriety-sos.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
