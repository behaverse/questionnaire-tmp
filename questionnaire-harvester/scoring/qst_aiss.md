# Scoring — Sensation seeking (AISS) (`qst_aiss`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_aiss",
  "title": "Sensation seeking (AISS)",
  "short_title": "AISS",
  "source_url": "https://us.psytoolkit.org/survey-library/sensation-seeking-aiss.html",
  "publication": {
    "citation": "Arnett, J. (1994). Sensation seeking: A new conceptualization and a new\nscale. Personality and Individual Differences, 16 , 289-296.",
    "year": 1994
  },
  "status": "needs-research",
  "item_count": 20,
  "dimensions": [
    "howwell"
  ],
  "option_scales": [
    {
      "ref": "opt_aiss_howwell_4",
      "dimension": "howwell",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        4,
        3,
        2,
        1
      ],
      "value_range": [
        1,
        4
      ],
      "anchors": [
        "describes me very well",
        "describes me somewhat",
        "does not describe me very well",
        "does not describe me at all"
      ]
    }
  ],
  "reversed_items": [
    "pr_aiss_2",
    "pr_aiss_3",
    "pr_aiss_6",
    "pr_aiss_10",
    "pr_aiss_13",
    "pr_aiss_17"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_aiss_1",
      "prompt_snippet": "I can see how it would be interesting to marry someone from a foreign country.",
      "dimension": "howwell",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_aiss_2",
      "prompt_snippet": "When the water is very cold, I prefer not to swim even if it is a hot day.",
      "dimension": "howwell",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 3,
      "prompt_id": "pr_aiss_3",
      "prompt_snippet": "If I have to wait in a long line, I’m usually patient about it.",
      "dimension": "howwell",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 4,
      "prompt_id": "pr_aiss_4",
      "prompt_snippet": "When I listen to music, I like it to be loud.",
      "dimension": "howwell",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_aiss_5",
      "prompt_snippet": "When taking a trip, I think it is best to make as few plans as possible and just",
      "dimension": "howwell",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_aiss_6",
      "prompt_snippet": "I stay away from movies that are said to be frightening or highly suspenseful.",
      "dimension": "howwell",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 7,
      "prompt_id": "pr_aiss_7",
      "prompt_snippet": "I think it’s fun and exciting to perform or speak before a group.",
      "dimension": "howwell",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_aiss_8",
      "prompt_snippet": "If I were to go to an amusement park, I would prefer to ride the rollercoaster o",
      "dimension": "howwell",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_aiss_9",
      "prompt_snippet": "I would like to travel to places that are strange and far away.",
      "dimension": "howwell",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_aiss_10",
      "prompt_snippet": "I would never like to gamble with money, even if I could afford it.",
      "dimension": "howwell",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 11,
      "prompt_id": "pr_aiss_11",
      "prompt_snippet": "I would have enjoyed being one of the first explorers of an unknown land.",
      "dimension": "howwell",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_aiss_12",
      "prompt_snippet": "I like a movie where there are a lot of explosions and car chases.",
      "dimension": "howwell",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_aiss_13",
      "prompt_snippet": "I don’t like extremely hot and spicy foods.",
      "dimension": "howwell",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 14,
      "prompt_id": "pr_aiss_14",
      "prompt_snippet": "In general, I work better when I’m under pressure.",
      "dimension": "howwell",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_aiss_15",
      "prompt_snippet": "I often like to have the radio or TV on while I’m doing something else, such as ",
      "dimension": "howwell",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_aiss_16",
      "prompt_snippet": "It would be interesting to see a car accident happen.",
      "dimension": "howwell",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_aiss_17",
      "prompt_snippet": "I think it’s best to order something familiar when eating in a restaurant.",
      "dimension": "howwell",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 18,
      "prompt_id": "pr_aiss_18",
      "prompt_snippet": "I like the feeling of standing next to the edge on a high place and looking down",
      "dimension": "howwell",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_aiss_19",
      "prompt_snippet": "If it were possible to visit another planet or the moon for free, I would be amo",
      "dimension": "howwell",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_aiss_20",
      "prompt_snippet": "I can see how it must be exciting to be in a battle during a war.",
      "dimension": "howwell",
      "values": [
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
- Dimensions: howwell
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_aiss_2, pr_aiss_3, pr_aiss_6, pr_aiss_10, pr_aiss_13, pr_aiss_17
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I can see how it would be interesting to marry someone from a foreign country. | howwell | 4,3,2,1 | no |
| 2 | When the water is very cold, I prefer not to swim even if it is a hot day. | howwell | 4,3,2,1 | yes |
| 3 | If I have to wait in a long line, I’m usually patient about it. | howwell | 4,3,2,1 | yes |
| 4 | When I listen to music, I like it to be loud. | howwell | 4,3,2,1 | no |
| 5 | When taking a trip, I think it is best to make as few plans as possible and just | howwell | 4,3,2,1 | no |
| 6 | I stay away from movies that are said to be frightening or highly suspenseful. | howwell | 4,3,2,1 | yes |
| 7 | I think it’s fun and exciting to perform or speak before a group. | howwell | 4,3,2,1 | no |
| 8 | If I were to go to an amusement park, I would prefer to ride the rollercoaster o | howwell | 4,3,2,1 | no |
| 9 | I would like to travel to places that are strange and far away. | howwell | 4,3,2,1 | no |
| 10 | I would never like to gamble with money, even if I could afford it. | howwell | 4,3,2,1 | yes |
| 11 | I would have enjoyed being one of the first explorers of an unknown land. | howwell | 4,3,2,1 | no |
| 12 | I like a movie where there are a lot of explosions and car chases. | howwell | 4,3,2,1 | no |
| 13 | I don’t like extremely hot and spicy foods. | howwell | 4,3,2,1 | yes |
| 14 | In general, I work better when I’m under pressure. | howwell | 4,3,2,1 | no |
| 15 | I often like to have the radio or TV on while I’m doing something else, such as  | howwell | 4,3,2,1 | no |
| 16 | It would be interesting to see a car accident happen. | howwell | 4,3,2,1 | no |
| 17 | I think it’s best to order something familiar when eating in a restaurant. | howwell | 4,3,2,1 | yes |
| 18 | I like the feeling of standing next to the edge on a high place and looking down | howwell | 4,3,2,1 | no |
| 19 | If it were possible to visit another planet or the moon for free, I would be amo | howwell | 4,3,2,1 | no |
| 20 | I can see how it must be exciting to be in a battle during a war. | howwell | 4,3,2,1 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/sensation-seeking-aiss.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
