# Scoring — Internet Addiction Assessment (IAA) (`qst_iaa`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_iaa",
  "title": "Internet Addiction Assessment (IAA)",
  "short_title": "IAA",
  "source_url": "https://psychology-tools.com/test/internet-addiction-assessment",
  "publication": {
    "citation": "H Cash, C D Rae, A H Steel, A Winkler. Internet Addiction: A Brief Summary of Research and Practice. 8 ( 4 ): Curr Psychiatry Rev. 292-298. 2012.",
    "year": 2012
  },
  "status": "needs-research",
  "item_count": 18,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_iaa_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "value_range": [
        0,
        4
      ],
      "anchors": [
        "Never",
        "Rarely",
        "Sometimes",
        "Often",
        "Always"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_iaa_1",
      "prompt_snippet": "I find myself using my smartphone or computer longer than I planned to.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_iaa_2",
      "prompt_snippet": "I would rather be on my smartphone or computer than interact with my partner.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_iaa_3",
      "prompt_snippet": "I would rather spend time online than do things around the house.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_iaa_4",
      "prompt_snippet": "My performance in school or at work suffers because of the amount of time I spen",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_iaa_5",
      "prompt_snippet": "People close to me are concerned about the amount of time I spend on my smartpho",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_iaa_6",
      "prompt_snippet": "When asked what I do online, I prefer not to answer.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_iaa_7",
      "prompt_snippet": "My productivity and attentiveness suffers because of the amount of time I spend ",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_iaa_8",
      "prompt_snippet": "I check my social media, text messages, or emails first thing after waking up.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_iaa_9",
      "prompt_snippet": "I am bothered when people interrupt me while I am using my computer or smartphon",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_iaa_10",
      "prompt_snippet": "I feel anxious when I do not have my smartphone with me.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_iaa_11",
      "prompt_snippet": "I use the internet to escape from my real life.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_iaa_12",
      "prompt_snippet": "I would be less interesting and happy without access to the internet.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_iaa_13",
      "prompt_snippet": "I put off things I have to do by using my computer or smartphone.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_iaa_14",
      "prompt_snippet": "When I am unable to use my smartphone, I miss it or think about what I could be ",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_iaa_15",
      "prompt_snippet": "I stay up later at night than I had intended due to doing things online.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_iaa_16",
      "prompt_snippet": "I would rather stay home and use the internet than go out with friends.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_iaa_17",
      "prompt_snippet": "I have tried to reduce my smartphone or internet use without success.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_iaa_18",
      "prompt_snippet": "I am concerned about missing out on thing online when not checking my smartphone",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
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

- Items: 18
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I find myself using my smartphone or computer longer than I planned to. | rating | 0,1,2,3,4 | no |
| 2 | I would rather be on my smartphone or computer than interact with my partner. | rating | 0,1,2,3,4 | no |
| 3 | I would rather spend time online than do things around the house. | rating | 0,1,2,3,4 | no |
| 4 | My performance in school or at work suffers because of the amount of time I spen | rating | 0,1,2,3,4 | no |
| 5 | People close to me are concerned about the amount of time I spend on my smartpho | rating | 0,1,2,3,4 | no |
| 6 | When asked what I do online, I prefer not to answer. | rating | 0,1,2,3,4 | no |
| 7 | My productivity and attentiveness suffers because of the amount of time I spend  | rating | 0,1,2,3,4 | no |
| 8 | I check my social media, text messages, or emails first thing after waking up. | rating | 0,1,2,3,4 | no |
| 9 | I am bothered when people interrupt me while I am using my computer or smartphon | rating | 0,1,2,3,4 | no |
| 10 | I feel anxious when I do not have my smartphone with me. | rating | 0,1,2,3,4 | no |
| 11 | I use the internet to escape from my real life. | rating | 0,1,2,3,4 | no |
| 12 | I would be less interesting and happy without access to the internet. | rating | 0,1,2,3,4 | no |
| 13 | I put off things I have to do by using my computer or smartphone. | rating | 0,1,2,3,4 | no |
| 14 | When I am unable to use my smartphone, I miss it or think about what I could be  | rating | 0,1,2,3,4 | no |
| 15 | I stay up later at night than I had intended due to doing things online. | rating | 0,1,2,3,4 | no |
| 16 | I would rather stay home and use the internet than go out with friends. | rating | 0,1,2,3,4 | no |
| 17 | I have tried to reduce my smartphone or internet use without success. | rating | 0,1,2,3,4 | no |
| 18 | I am concerned about missing out on thing online when not checking my smartphone | rating | 0,1,2,3,4 | no |

## To research (fill from https://psychology-tools.com/test/internet-addiction-assessment)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
