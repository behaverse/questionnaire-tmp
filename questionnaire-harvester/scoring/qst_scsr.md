# Scoring — Self-consciousness scale (revised version) (`qst_scsr`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_scsr",
  "title": "Self-consciousness scale (revised version)",
  "short_title": "revised version",
  "source_url": "https://us.psytoolkit.org/survey-library/self-consciousness-scale-scsr.html",
  "publication": {
    "citation": "Scheier, M. F. & Carver, C. S. (1985). The self-consciousnes scale -\na revised version for use with general populations. Journal of\nApplied Social Psychology, 15, 687-699.",
    "year": 1985
  },
  "status": "needs-research",
  "item_count": 21,
  "dimensions": [
    "likeme"
  ],
  "option_scales": [
    {
      "ref": "opt_scsr_likeme_4",
      "dimension": "likeme",
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
        "a lot like me",
        "somewhat like me",
        "a little like me",
        "not like me at all"
      ]
    }
  ],
  "reversed_items": [
    "pr_scsr_8",
    "pr_scsr_11"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_scsr_1",
      "prompt_snippet": "I'm always trying to figure myself out",
      "dimension": "likeme",
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
      "prompt_id": "pr_scsr_2",
      "prompt_snippet": "I'm concerned about my style of doing things",
      "dimension": "likeme",
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
      "prompt_id": "pr_scsr_3",
      "prompt_snippet": "It takes me time to get over my shyness in new situations",
      "dimension": "likeme",
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
      "prompt_id": "pr_scsr_4",
      "prompt_snippet": "I think about myself a lot",
      "dimension": "likeme",
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
      "prompt_id": "pr_scsr_5",
      "prompt_snippet": "I care a lot about how I present myself to others",
      "dimension": "likeme",
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
      "prompt_id": "pr_scsr_6",
      "prompt_snippet": "I often daydream about myself",
      "dimension": "likeme",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_scsr_7",
      "prompt_snippet": "It's hard for me to work when someone is watching me",
      "dimension": "likeme",
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
      "prompt_id": "pr_scsr_8",
      "prompt_snippet": "I never take a hard look at myself",
      "dimension": "likeme",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 9,
      "prompt_id": "pr_scsr_9",
      "prompt_snippet": "I get embarrassed very easily",
      "dimension": "likeme",
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
      "prompt_id": "pr_scsr_10",
      "prompt_snippet": "I'm self-conscious about the way I look",
      "dimension": "likeme",
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
      "prompt_id": "pr_scsr_11",
      "prompt_snippet": "It's easy for me to talk to strangers",
      "dimension": "likeme",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 12,
      "prompt_id": "pr_scsr_12",
      "prompt_snippet": "I generally pay attention to my inner feelings",
      "dimension": "likeme",
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
      "prompt_id": "pr_scsr_13",
      "prompt_snippet": "I usually worry about making a good impression",
      "dimension": "likeme",
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
      "prompt_id": "pr_scsr_14",
      "prompt_snippet": "I'm constantly thinking about my reasons for doing things",
      "dimension": "likeme",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_scsr_15",
      "prompt_snippet": "I feel nervous when I speak in front of a group",
      "dimension": "likeme",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_scsr_16",
      "prompt_snippet": "Before I leave my house, I check how I look",
      "dimension": "likeme",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_scsr_17",
      "prompt_snippet": "I sometimes step back (in my mind) in order to examine myself from a distance",
      "dimension": "likeme",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_scsr_18",
      "prompt_snippet": "I'm concerned about what other people think of me",
      "dimension": "likeme",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_scsr_19",
      "prompt_snippet": "I'm quick to notice changes in my mood",
      "dimension": "likeme",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_scsr_20",
      "prompt_snippet": "I'm usually aware of my appearance",
      "dimension": "likeme",
      "values": [
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_scsr_21",
      "prompt_snippet": "I know the way my mind works when I work through a problem",
      "dimension": "likeme",
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

- Items: 21
- Dimensions: likeme
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_scsr_8, pr_scsr_11
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I'm always trying to figure myself out | likeme | 3,2,1,0 | no |
| 2 | I'm concerned about my style of doing things | likeme | 3,2,1,0 | no |
| 3 | It takes me time to get over my shyness in new situations | likeme | 3,2,1,0 | no |
| 4 | I think about myself a lot | likeme | 3,2,1,0 | no |
| 5 | I care a lot about how I present myself to others | likeme | 3,2,1,0 | no |
| 6 | I often daydream about myself | likeme | 3,2,1,0 | no |
| 7 | It's hard for me to work when someone is watching me | likeme | 3,2,1,0 | no |
| 8 | I never take a hard look at myself | likeme | 3,2,1,0 | yes |
| 9 | I get embarrassed very easily | likeme | 3,2,1,0 | no |
| 10 | I'm self-conscious about the way I look | likeme | 3,2,1,0 | no |
| 11 | It's easy for me to talk to strangers | likeme | 3,2,1,0 | yes |
| 12 | I generally pay attention to my inner feelings | likeme | 3,2,1,0 | no |
| 13 | I usually worry about making a good impression | likeme | 3,2,1,0 | no |
| 14 | I'm constantly thinking about my reasons for doing things | likeme | 3,2,1,0 | no |
| 15 | I feel nervous when I speak in front of a group | likeme | 3,2,1,0 | no |
| 16 | Before I leave my house, I check how I look | likeme | 3,2,1,0 | no |
| 17 | I sometimes step back (in my mind) in order to examine myself from a distance | likeme | 3,2,1,0 | no |
| 18 | I'm concerned about what other people think of me | likeme | 3,2,1,0 | no |
| 19 | I'm quick to notice changes in my mood | likeme | 3,2,1,0 | no |
| 20 | I'm usually aware of my appearance | likeme | 3,2,1,0 | no |
| 21 | I know the way my mind works when I work through a problem | likeme | 3,2,1,0 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/self-consciousness-scale-scsr.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
