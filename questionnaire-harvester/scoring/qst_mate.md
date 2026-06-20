# Scoring — Measure of Acceptance of the Theory of Evolution (MATE) (`qst_mate`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_mate",
  "title": "Measure of Acceptance of the Theory of Evolution (MATE)",
  "short_title": "MATE",
  "source_url": "https://us.psytoolkit.org/survey-library/evolution-mate.html",
  "publication": {
    "citation": "Rutledge, M .L . & Warden, M .A . (1999). The development and validation of the Measure of Acceptance of the Theory of Evolution Instrument. School Science and Mathematics, 99(1) , 13-18.",
    "year": 1999
  },
  "status": "needs-research",
  "item_count": 20,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_mate_agree_5",
      "dimension": "agree",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "value_range": [
        1,
        5
      ],
      "anchors": [
        "Strongly agree",
        "Agree",
        "Undecided",
        "Disagree",
        "Strongly disagree"
      ]
    }
  ],
  "reversed_items": [
    "pr_mate_2",
    "pr_mate_4",
    "pr_mate_6",
    "pr_mate_7",
    "pr_mate_9",
    "pr_mate_10",
    "pr_mate_14",
    "pr_mate_15",
    "pr_mate_17",
    "pr_mate_19"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_mate_1",
      "prompt_snippet": "Organisms existing today are the result of evolutionary processes that have occu",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_mate_2",
      "prompt_snippet": "The theory of evolution is incapable of being scientifically tested",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 3,
      "prompt_id": "pr_mate_3",
      "prompt_snippet": "Modern humans are the product of evolutionary processes that have occurred over ",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_mate_4",
      "prompt_snippet": "The theory of evolution is based on speculation and not valid scientific observa",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 5,
      "prompt_id": "pr_mate_5",
      "prompt_snippet": "Most scientists accept evolutionary theory to be a scientifically valid theory",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_mate_6",
      "prompt_snippet": "The available data are ambiguous (unclear) as to whether evolution actually occu",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 7,
      "prompt_id": "pr_mate_7",
      "prompt_snippet": "The age of the earth is less than 20,000 years",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 8,
      "prompt_id": "pr_mate_8",
      "prompt_snippet": "There is a significant body of data that supports evolutionary theory",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_mate_9",
      "prompt_snippet": "Organisms exist today in essentially the same form in which they always have",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 10,
      "prompt_id": "pr_mate_10",
      "prompt_snippet": "Evolution in not a scientifically valid theory",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 11,
      "prompt_id": "pr_mate_11",
      "prompt_snippet": "The age of the earth is at least 4 billion years",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_mate_12",
      "prompt_snippet": "Current evolutionary theory is the result of sound scientific research and metho",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_mate_13",
      "prompt_snippet": "Evolutionary theory generates testable predictions with respect to the character",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_mate_14",
      "prompt_snippet": "The theory of evolution cannot be correct since it disagrees with the Biblical a",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 15,
      "prompt_id": "pr_mate_15",
      "prompt_snippet": "Humans exist today in essentially the same form in which they always have",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 16,
      "prompt_id": "pr_mate_16",
      "prompt_snippet": "Evolutionary theory is supported by factual historical and laboratory data",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_mate_17",
      "prompt_snippet": "Much of the scientific community doubts if evolution occurs",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 18,
      "prompt_id": "pr_mate_18",
      "prompt_snippet": "The theory of evolution brings meaning to the diverse characteristics and behavi",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_mate_19",
      "prompt_snippet": "With few exceptions, organisms on earth came into existence at about the same ti",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 20,
      "prompt_id": "pr_mate_20",
      "prompt_snippet": "Evolution is a scientifically valid theory",
      "dimension": "agree",
      "values": [
        5,
        4,
        3,
        2,
        1
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

- Items: 20
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_mate_2, pr_mate_4, pr_mate_6, pr_mate_7, pr_mate_9, pr_mate_10, pr_mate_14, pr_mate_15, pr_mate_17, pr_mate_19
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Organisms existing today are the result of evolutionary processes that have occu | agree | 5,4,3,2,1 | no |
| 2 | The theory of evolution is incapable of being scientifically tested | agree | 5,4,3,2,1 | yes |
| 3 | Modern humans are the product of evolutionary processes that have occurred over  | agree | 5,4,3,2,1 | no |
| 4 | The theory of evolution is based on speculation and not valid scientific observa | agree | 5,4,3,2,1 | yes |
| 5 | Most scientists accept evolutionary theory to be a scientifically valid theory | agree | 5,4,3,2,1 | no |
| 6 | The available data are ambiguous (unclear) as to whether evolution actually occu | agree | 5,4,3,2,1 | yes |
| 7 | The age of the earth is less than 20,000 years | agree | 5,4,3,2,1 | yes |
| 8 | There is a significant body of data that supports evolutionary theory | agree | 5,4,3,2,1 | no |
| 9 | Organisms exist today in essentially the same form in which they always have | agree | 5,4,3,2,1 | yes |
| 10 | Evolution in not a scientifically valid theory | agree | 5,4,3,2,1 | yes |
| 11 | The age of the earth is at least 4 billion years | agree | 5,4,3,2,1 | no |
| 12 | Current evolutionary theory is the result of sound scientific research and metho | agree | 5,4,3,2,1 | no |
| 13 | Evolutionary theory generates testable predictions with respect to the character | agree | 5,4,3,2,1 | no |
| 14 | The theory of evolution cannot be correct since it disagrees with the Biblical a | agree | 5,4,3,2,1 | yes |
| 15 | Humans exist today in essentially the same form in which they always have | agree | 5,4,3,2,1 | yes |
| 16 | Evolutionary theory is supported by factual historical and laboratory data | agree | 5,4,3,2,1 | no |
| 17 | Much of the scientific community doubts if evolution occurs | agree | 5,4,3,2,1 | yes |
| 18 | The theory of evolution brings meaning to the diverse characteristics and behavi | agree | 5,4,3,2,1 | no |
| 19 | With few exceptions, organisms on earth came into existence at about the same ti | agree | 5,4,3,2,1 | yes |
| 20 | Evolution is a scientifically valid theory | agree | 5,4,3,2,1 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/evolution-mate.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
