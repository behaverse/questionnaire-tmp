# Scoring — Short Autism Spectrum Quotient (`qst_quotient`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_quotient",
  "title": "Short Autism Spectrum Quotient",
  "short_title": "Short Autism Spectrum Quotient",
  "source_url": "https://us.psytoolkit.org/survey-library/short-autism-spectrum-quotient.html",
  "publication": {
    "citation": "Allison, C., Auyeung, B., & Baron-Cohen, S. (2012). Toward Brief\n\"Red Flags\" for Autism Screening: The Short Autism Spectrum Quotient\nand the Short Quantitative Checklist in 1,000 Cases and 3,000 Controls. Journal of the American Acad of Child & Adolescent Psychiatry, 51(2) , 202-212.",
    "year": 2012
  },
  "status": "needs-research",
  "item_count": 10,
  "dimensions": [
    "agreesaq"
  ],
  "option_scales": [
    {
      "ref": "opt_quotient_agreesaq_4",
      "dimension": "agreesaq",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        1,
        1,
        0,
        0
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "Definitely agree",
        "Slightly agree",
        "Slightly disagree",
        "Definitely disagree"
      ]
    }
  ],
  "reversed_items": [
    "pr_quotient_2",
    "pr_quotient_3",
    "pr_quotient_4",
    "pr_quotient_5",
    "pr_quotient_6",
    "pr_quotient_9"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_quotient_1",
      "prompt_snippet": "I often notice small sounds when others do not",
      "dimension": "agreesaq",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_quotient_2",
      "prompt_snippet": "I usually concentrate more on the whole picture, rather than the small details",
      "dimension": "agreesaq",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": true
    },
    {
      "index": 3,
      "prompt_id": "pr_quotient_3",
      "prompt_snippet": "I find it easy to do more than one thing at once",
      "dimension": "agreesaq",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": true
    },
    {
      "index": 4,
      "prompt_id": "pr_quotient_4",
      "prompt_snippet": "If there is an interruption, I can switch back to what I was doing very quickly",
      "dimension": "agreesaq",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": true
    },
    {
      "index": 5,
      "prompt_id": "pr_quotient_5",
      "prompt_snippet": "I find it easy to ‘read between the lines’ when someone is talking to me",
      "dimension": "agreesaq",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": true
    },
    {
      "index": 6,
      "prompt_id": "pr_quotient_6",
      "prompt_snippet": "I know how to tell if someone listening to me is getting bored",
      "dimension": "agreesaq",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": true
    },
    {
      "index": 7,
      "prompt_id": "pr_quotient_7",
      "prompt_snippet": "When I’m reading a story I find it difficult to work out the characters’ intenti",
      "dimension": "agreesaq",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_quotient_8",
      "prompt_snippet": "I like to collect information about categories of things (e.g. types of car, typ",
      "dimension": "agreesaq",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_quotient_9",
      "prompt_snippet": "I find it easy to work out what someone is thinking or feeling just by looking a",
      "dimension": "agreesaq",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": true
    },
    {
      "index": 10,
      "prompt_id": "pr_quotient_10",
      "prompt_snippet": "I find it difficult to work out people’s intentions",
      "dimension": "agreesaq",
      "values": [
        1,
        1,
        0,
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

- Items: 10
- Dimensions: agreesaq
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_quotient_2, pr_quotient_3, pr_quotient_4, pr_quotient_5, pr_quotient_6, pr_quotient_9
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I often notice small sounds when others do not | agreesaq | 1,1,0,0 | no |
| 2 | I usually concentrate more on the whole picture, rather than the small details | agreesaq | 1,1,0,0 | yes |
| 3 | I find it easy to do more than one thing at once | agreesaq | 1,1,0,0 | yes |
| 4 | If there is an interruption, I can switch back to what I was doing very quickly | agreesaq | 1,1,0,0 | yes |
| 5 | I find it easy to ‘read between the lines’ when someone is talking to me | agreesaq | 1,1,0,0 | yes |
| 6 | I know how to tell if someone listening to me is getting bored | agreesaq | 1,1,0,0 | yes |
| 7 | When I’m reading a story I find it difficult to work out the characters’ intenti | agreesaq | 1,1,0,0 | no |
| 8 | I like to collect information about categories of things (e.g. types of car, typ | agreesaq | 1,1,0,0 | no |
| 9 | I find it easy to work out what someone is thinking or feeling just by looking a | agreesaq | 1,1,0,0 | yes |
| 10 | I find it difficult to work out people’s intentions | agreesaq | 1,1,0,0 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/short-autism-spectrum-quotient.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
