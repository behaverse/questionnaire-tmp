# Scoring — Hypersensitive Narcissism Scale (HSNS) (`qst_hsns`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_hsns",
  "title": "Hypersensitive Narcissism Scale (HSNS)",
  "short_title": "HSNS",
  "source_url": "https://us.psytoolkit.org/survey-library/narcism-hsns.html",
  "publication": {
    "citation": "Hendin, H.M., & Cheek, J.M. (1997). Assessing Hypersensitive Narcissism: A Re-examination of Murray’s Narcissism Scale. Journal of Research in Personality, 31 , 588-599.",
    "year": 1997
  },
  "status": "needs-research",
  "item_count": 10,
  "dimensions": [
    "characteristic"
  ],
  "option_scales": [
    {
      "ref": "opt_hsns_characteristic_5",
      "dimension": "characteristic",
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
        "very uncharacteristic or untrue, strongly disagree",
        "uncharacteristic",
        "neutral",
        "characteristic",
        "very characteristic or true, strongly agree"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_hsns_1",
      "prompt_snippet": "I can become entirely absorbed in thinking about my personal affairs, my health,",
      "dimension": "characteristic",
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
      "prompt_id": "pr_hsns_2",
      "prompt_snippet": "My feelings are easily hurt by ridicule or the slighting remarks of others.",
      "dimension": "characteristic",
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
      "prompt_id": "pr_hsns_3",
      "prompt_snippet": "When I enter a room I often become self-conscious and feel that the eyes of othe",
      "dimension": "characteristic",
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
      "prompt_id": "pr_hsns_4",
      "prompt_snippet": "I dislike sharing the credit of an achievement with others.",
      "dimension": "characteristic",
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
      "prompt_id": "pr_hsns_5",
      "prompt_snippet": "I feel that I have enough on my hands without worrying about other people's trou",
      "dimension": "characteristic",
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
      "prompt_id": "pr_hsns_6",
      "prompt_snippet": "I feel that I am temperamentally different from most people.",
      "dimension": "characteristic",
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
      "prompt_id": "pr_hsns_7",
      "prompt_snippet": "I often interpret the remarks of others in a personal way.",
      "dimension": "characteristic",
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
      "prompt_id": "pr_hsns_8",
      "prompt_snippet": "I easily become wrapped up in my own interests and forget the existence of other",
      "dimension": "characteristic",
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
      "prompt_id": "pr_hsns_9",
      "prompt_snippet": "I dislike being with a group unless I know that I am appreciated by at least one",
      "dimension": "characteristic",
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
      "prompt_id": "pr_hsns_10",
      "prompt_snippet": "I am secretly \"put out\" or annoyed when other people come to me with their troub",
      "dimension": "characteristic",
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

- Items: 10
- Dimensions: characteristic
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I can become entirely absorbed in thinking about my personal affairs, my health, | characteristic | 1,2,3,4,5 | no |
| 2 | My feelings are easily hurt by ridicule or the slighting remarks of others. | characteristic | 1,2,3,4,5 | no |
| 3 | When I enter a room I often become self-conscious and feel that the eyes of othe | characteristic | 1,2,3,4,5 | no |
| 4 | I dislike sharing the credit of an achievement with others. | characteristic | 1,2,3,4,5 | no |
| 5 | I feel that I have enough on my hands without worrying about other people's trou | characteristic | 1,2,3,4,5 | no |
| 6 | I feel that I am temperamentally different from most people. | characteristic | 1,2,3,4,5 | no |
| 7 | I often interpret the remarks of others in a personal way. | characteristic | 1,2,3,4,5 | no |
| 8 | I easily become wrapped up in my own interests and forget the existence of other | characteristic | 1,2,3,4,5 | no |
| 9 | I dislike being with a group unless I know that I am appreciated by at least one | characteristic | 1,2,3,4,5 | no |
| 10 | I am secretly "put out" or annoyed when other people come to me with their troub | characteristic | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/narcism-hsns.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
