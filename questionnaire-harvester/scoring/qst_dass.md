# Scoring — Depression Anxiety Stress Scales (DASS) (`qst_dass`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_dass",
  "title": "Depression Anxiety Stress Scales (DASS)",
  "short_title": "DASS",
  "source_url": "https://us.psytoolkit.org/survey-library/depression-anxiety-stress-dass.html",
  "publication": {
    "citation": "Lovibond, S.H. & Lovibond, P.F. (1995). Manual for the Depression Anxiety & Stress Scales. (2 Ed.)Sydney: Psychology Foundation.",
    "year": 1995
  },
  "status": "needs-research",
  "item_count": 42,
  "dimensions": [
    "frequency"
  ],
  "option_scales": [
    {
      "ref": "opt_dass_frequency_4",
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
      "prompt_id": "pr_dass_1",
      "prompt_snippet": "I found myself getting upset by quite trivial things",
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
      "prompt_id": "pr_dass_2",
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
      "prompt_id": "pr_dass_3",
      "prompt_snippet": "I couldn't seem to experience any positive feeling at all",
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
      "prompt_id": "pr_dass_4",
      "prompt_snippet": "I experienced breathing difficulty (eg, excessively rapid breathing, breathlessn",
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
      "prompt_id": "pr_dass_5",
      "prompt_snippet": "I just couldn't seem to get going",
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
      "prompt_id": "pr_dass_6",
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
      "prompt_id": "pr_dass_7",
      "prompt_snippet": "I had a feeling of shakiness (eg, legs going to give way)",
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
      "prompt_id": "pr_dass_8",
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
      "index": 9,
      "prompt_id": "pr_dass_9",
      "prompt_snippet": "I found myself in situations that made me so anxious I was most relieved when th",
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
      "prompt_id": "pr_dass_10",
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
      "prompt_id": "pr_dass_11",
      "prompt_snippet": "I found myself getting upset rather easily",
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
      "prompt_id": "pr_dass_12",
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
      "index": 13,
      "prompt_id": "pr_dass_13",
      "prompt_snippet": "I felt sad and depressed",
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
      "prompt_id": "pr_dass_14",
      "prompt_snippet": "I found myself getting impatient when I was delayed in any way (eg, lifts, traff",
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
      "prompt_id": "pr_dass_15",
      "prompt_snippet": "I had a feeling of faintness",
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
      "prompt_id": "pr_dass_16",
      "prompt_snippet": "I felt that I had lost interest in just about everything",
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
      "prompt_id": "pr_dass_17",
      "prompt_snippet": "I felt I wasn't worth much as a person",
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
      "prompt_id": "pr_dass_18",
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
      "prompt_id": "pr_dass_19",
      "prompt_snippet": "I perspired noticeably (eg, hands sweaty) in the absence of high temperatures or",
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
      "prompt_id": "pr_dass_20",
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
      "prompt_id": "pr_dass_21",
      "prompt_snippet": "I felt that life wasn't worthwhile",
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
      "index": 22,
      "prompt_id": "pr_dass_22",
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
      "index": 23,
      "prompt_id": "pr_dass_23",
      "prompt_snippet": "I had difficulty in swallowing",
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
      "index": 24,
      "prompt_id": "pr_dass_24",
      "prompt_snippet": "I couldn't seem to get any enjoyment out of the things I did",
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
      "index": 25,
      "prompt_id": "pr_dass_25",
      "prompt_snippet": "I was aware of the action of my heart in the absence of physical exertion (eg, s",
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
      "index": 26,
      "prompt_id": "pr_dass_26",
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
      "index": 27,
      "prompt_id": "pr_dass_27",
      "prompt_snippet": "I found that I was very irritable",
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
      "index": 28,
      "prompt_id": "pr_dass_28",
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
      "index": 29,
      "prompt_id": "pr_dass_29",
      "prompt_snippet": "I found it hard to calm down after something upset me",
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
      "index": 30,
      "prompt_id": "pr_dass_30",
      "prompt_snippet": "I feared that I would be \"thrown\" by some trivial but unfamiliar task",
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
      "index": 31,
      "prompt_id": "pr_dass_31",
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
      "index": 32,
      "prompt_id": "pr_dass_32",
      "prompt_snippet": "I found it difficult to tolerate interruptions to what I was doing",
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
      "index": 33,
      "prompt_id": "pr_dass_33",
      "prompt_snippet": "I was in a state of nervous tension",
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
      "index": 34,
      "prompt_id": "pr_dass_34",
      "prompt_snippet": "I felt I was pretty worthless",
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
      "index": 35,
      "prompt_id": "pr_dass_35",
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
      "index": 36,
      "prompt_id": "pr_dass_36",
      "prompt_snippet": "I felt terrified",
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
      "index": 37,
      "prompt_id": "pr_dass_37",
      "prompt_snippet": "I could see nothing in the future to be hopeful about",
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
      "index": 38,
      "prompt_id": "pr_dass_38",
      "prompt_snippet": "I felt that life was meaningless",
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
      "index": 39,
      "prompt_id": "pr_dass_39",
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
      "index": 40,
      "prompt_id": "pr_dass_40",
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
      "index": 41,
      "prompt_id": "pr_dass_41",
      "prompt_snippet": "I experienced trembling (eg, in the hands)",
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
      "index": 42,
      "prompt_id": "pr_dass_42",
      "prompt_snippet": "I found it difficult to work up the initiative to do things",
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

- Items: 42
- Dimensions: frequency
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I found myself getting upset by quite trivial things | frequency | 0,1,2,3 | no |
| 2 | I was aware of dryness of my mouth | frequency | 0,1,2,3 | no |
| 3 | I couldn't seem to experience any positive feeling at all | frequency | 0,1,2,3 | no |
| 4 | I experienced breathing difficulty (eg, excessively rapid breathing, breathlessn | frequency | 0,1,2,3 | no |
| 5 | I just couldn't seem to get going | frequency | 0,1,2,3 | no |
| 6 | I tended to over-react to situations | frequency | 0,1,2,3 | no |
| 7 | I had a feeling of shakiness (eg, legs going to give way) | frequency | 0,1,2,3 | no |
| 8 | I found it difficult to relax | frequency | 0,1,2,3 | no |
| 9 | I found myself in situations that made me so anxious I was most relieved when th | frequency | 0,1,2,3 | no |
| 10 | I felt that I had nothing to look forward to | frequency | 0,1,2,3 | no |
| 11 | I found myself getting upset rather easily | frequency | 0,1,2,3 | no |
| 12 | I felt that I was using a lot of nervous energy | frequency | 0,1,2,3 | no |
| 13 | I felt sad and depressed | frequency | 0,1,2,3 | no |
| 14 | I found myself getting impatient when I was delayed in any way (eg, lifts, traff | frequency | 0,1,2,3 | no |
| 15 | I had a feeling of faintness | frequency | 0,1,2,3 | no |
| 16 | I felt that I had lost interest in just about everything | frequency | 0,1,2,3 | no |
| 17 | I felt I wasn't worth much as a person | frequency | 0,1,2,3 | no |
| 18 | I felt that I was rather touchy | frequency | 0,1,2,3 | no |
| 19 | I perspired noticeably (eg, hands sweaty) in the absence of high temperatures or | frequency | 0,1,2,3 | no |
| 20 | I felt scared without any good reason | frequency | 0,1,2,3 | no |
| 21 | I felt that life wasn't worthwhile | frequency | 0,1,2,3 | no |
| 22 | I found it hard to wind down | frequency | 0,1,2,3 | no |
| 23 | I had difficulty in swallowing | frequency | 0,1,2,3 | no |
| 24 | I couldn't seem to get any enjoyment out of the things I did | frequency | 0,1,2,3 | no |
| 25 | I was aware of the action of my heart in the absence of physical exertion (eg, s | frequency | 0,1,2,3 | no |
| 26 | I felt down-hearted and blue | frequency | 0,1,2,3 | no |
| 27 | I found that I was very irritable | frequency | 0,1,2,3 | no |
| 28 | I felt I was close to panic | frequency | 0,1,2,3 | no |
| 29 | I found it hard to calm down after something upset me | frequency | 0,1,2,3 | no |
| 30 | I feared that I would be "thrown" by some trivial but unfamiliar task | frequency | 0,1,2,3 | no |
| 31 | I was unable to become enthusiastic about anything | frequency | 0,1,2,3 | no |
| 32 | I found it difficult to tolerate interruptions to what I was doing | frequency | 0,1,2,3 | no |
| 33 | I was in a state of nervous tension | frequency | 0,1,2,3 | no |
| 34 | I felt I was pretty worthless | frequency | 0,1,2,3 | no |
| 35 | I was intolerant of anything that kept me from getting on with what I was doing | frequency | 0,1,2,3 | no |
| 36 | I felt terrified | frequency | 0,1,2,3 | no |
| 37 | I could see nothing in the future to be hopeful about | frequency | 0,1,2,3 | no |
| 38 | I felt that life was meaningless | frequency | 0,1,2,3 | no |
| 39 | I found myself getting agitated | frequency | 0,1,2,3 | no |
| 40 | I was worried about situations in which I might panic and make a fool of myself | frequency | 0,1,2,3 | no |
| 41 | I experienced trembling (eg, in the hands) | frequency | 0,1,2,3 | no |
| 42 | I found it difficult to work up the initiative to do things | frequency | 0,1,2,3 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/depression-anxiety-stress-dass.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
