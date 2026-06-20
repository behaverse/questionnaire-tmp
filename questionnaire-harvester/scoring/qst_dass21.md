# Scoring — The Depression, Anxiety, and Stress Scales with 21 items (DASS-21) (`qst_dass21`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_dass21",
  "title": "The Depression, Anxiety, and Stress Scales with 21 items (DASS-21)",
  "short_title": "DASS-21",
  "source_url": "https://us.psytoolkit.org/survey-library/dass21.html",
  "publication": {
    "citation": "Lovibond, S.H. & Lovibond, P.F. (1995). Manual for the Depression Anxiety & Stress Scales. (2 Ed.)Sydney: Psychology Foundation.",
    "year": 1995
  },
  "status": "needs-research",
  "item_count": 21,
  "dimensions": [
    "frequency"
  ],
  "option_scales": [
    {
      "ref": "opt_dass21_frequency_4",
      "dimension": "frequency",
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
        "Never",
        "Sometimes",
        "Often",
        "Almost always"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_dass21_1",
      "prompt_snippet": "I found it hard to wind down",
      "dimension": "frequency",
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
      "prompt_id": "pr_dass21_2",
      "prompt_snippet": "I was aware of dryness of my mouth",
      "dimension": "frequency",
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
      "prompt_id": "pr_dass21_3",
      "prompt_snippet": "I couldn’t seem to experience any positive feeling at all",
      "dimension": "frequency",
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
      "prompt_id": "pr_dass21_4",
      "prompt_snippet": "I experienced breathing difficulty (for example, excessively rapid breathing, br",
      "dimension": "frequency",
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
      "prompt_id": "pr_dass21_5",
      "prompt_snippet": "I found it difficult to work up the initiative to do things",
      "dimension": "frequency",
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
      "prompt_id": "pr_dass21_6",
      "prompt_snippet": "I tended to over-react to situations",
      "dimension": "frequency",
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
      "prompt_id": "pr_dass21_7",
      "prompt_snippet": "I experienced trembling (for example, in the hands)",
      "dimension": "frequency",
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
      "prompt_id": "pr_dass21_8",
      "prompt_snippet": "I felt that I was using a lot of nervous energy",
      "dimension": "frequency",
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
      "prompt_id": "pr_dass21_9",
      "prompt_snippet": "I was worried about situations in which I might panic and make a fool of myself",
      "dimension": "frequency",
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
      "prompt_id": "pr_dass21_10",
      "prompt_snippet": "I felt that I had nothing to look forward to",
      "dimension": "frequency",
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
      "prompt_id": "pr_dass21_11",
      "prompt_snippet": "I found myself getting agitated",
      "dimension": "frequency",
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
      "prompt_id": "pr_dass21_12",
      "prompt_snippet": "I found it difficult to relax",
      "dimension": "frequency",
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
      "prompt_id": "pr_dass21_13",
      "prompt_snippet": "I felt down-hearted and blue",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_dass21_14",
      "prompt_snippet": "I was intolerant of anything that kept me from getting on with what I was doing",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_dass21_15",
      "prompt_snippet": "I felt I was close to panic",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_dass21_16",
      "prompt_snippet": "I was unable to become enthusiastic about anything",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_dass21_17",
      "prompt_snippet": "I felt I wasn’t worth much as a person",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_dass21_18",
      "prompt_snippet": "I felt that I was rather touchy",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_dass21_19",
      "prompt_snippet": "I was aware of the action of my heart in the absence of physicalexertion (for ex",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_dass21_20",
      "prompt_snippet": "I felt scared without any good reason",
      "dimension": "frequency",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_dass21_21",
      "prompt_snippet": "I felt that life was meaningless",
      "dimension": "frequency",
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

- Items: 21
- Dimensions: frequency
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I found it hard to wind down | frequency | 0,1,2,3 | no |
| 2 | I was aware of dryness of my mouth | frequency | 0,1,2,3 | no |
| 3 | I couldn’t seem to experience any positive feeling at all | frequency | 0,1,2,3 | no |
| 4 | I experienced breathing difficulty (for example, excessively rapid breathing, br | frequency | 0,1,2,3 | no |
| 5 | I found it difficult to work up the initiative to do things | frequency | 0,1,2,3 | no |
| 6 | I tended to over-react to situations | frequency | 0,1,2,3 | no |
| 7 | I experienced trembling (for example, in the hands) | frequency | 0,1,2,3 | no |
| 8 | I felt that I was using a lot of nervous energy | frequency | 0,1,2,3 | no |
| 9 | I was worried about situations in which I might panic and make a fool of myself | frequency | 0,1,2,3 | no |
| 10 | I felt that I had nothing to look forward to | frequency | 0,1,2,3 | no |
| 11 | I found myself getting agitated | frequency | 0,1,2,3 | no |
| 12 | I found it difficult to relax | frequency | 0,1,2,3 | no |
| 13 | I felt down-hearted and blue | frequency | 0,1,2,3 | no |
| 14 | I was intolerant of anything that kept me from getting on with what I was doing | frequency | 0,1,2,3 | no |
| 15 | I felt I was close to panic | frequency | 0,1,2,3 | no |
| 16 | I was unable to become enthusiastic about anything | frequency | 0,1,2,3 | no |
| 17 | I felt I wasn’t worth much as a person | frequency | 0,1,2,3 | no |
| 18 | I felt that I was rather touchy | frequency | 0,1,2,3 | no |
| 19 | I was aware of the action of my heart in the absence of physicalexertion (for ex | frequency | 0,1,2,3 | no |
| 20 | I felt scared without any good reason | frequency | 0,1,2,3 | no |
| 21 | I felt that life was meaningless | frequency | 0,1,2,3 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/dass21.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
