# Scoring — Short Health Anxiety Inventory (HAI-18) (`qst_hai18`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_hai18",
  "title": "Short Health Anxiety Inventory (HAI-18)",
  "short_title": "HAI-18",
  "source_url": "https://psychology-tools.com/test/health-anxiety-inventory",
  "publication": {
    "citation": "P M Salkovskis, K A Rimes, H MC Warwick, D M Clark. The Health Anxiety Inventory: development and validation of scales for the measurement of health anxiety and hypochondriasis. Psychol Med. 2006; 32 ( 5 ): 843–853.",
    "year": 2006
  },
  "status": "needs-research",
  "item_count": 18,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_hai18_rating_1",
      "dimension": "rating",
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
        "I do not worry about my health.",
        "I occasionally worry about my health.",
        "I spend much of my time worrying about my health.",
        "I spend most of my time worrying about my health."
      ]
    },
    {
      "ref": "opt_hai18_rating_2",
      "dimension": "rating",
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
        "I notice aches/pains less than most other people (of my age).",
        "I notice aches/pains as much as most other people (of my age).",
        "I notice aches/pains more than most other people (of my age).",
        "I am aware of aches/pains in my body all the time."
      ]
    },
    {
      "ref": "opt_hai18_rating_3",
      "dimension": "rating",
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
        "As a rule I am not aware of bodily sensations or changes.",
        "Sometimes I am aware of bodily sensations or changes.",
        "I am often aware of bodily sensations or changes.",
        "I am constantly aware of bodily sensations or changes."
      ]
    },
    {
      "ref": "opt_hai18_rating_4",
      "dimension": "rating",
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
        "Resisting thoughts of illness is never a problem.",
        "Most of the time I can resist thoughts of illness.",
        "I try to resist thoughts of illness but am often unable to do so.",
        "Thoughts of illness are so strong that I no longer even try to resist them."
      ]
    },
    {
      "ref": "opt_hai18_rating_5",
      "dimension": "rating",
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
        "As a rule I am not afraid that I have a serious illness.",
        "I am sometimes afraid that I have a serious illness.",
        "I am often afraid that I have a serious illness.",
        "I am always afraid that I have a serious illness."
      ]
    },
    {
      "ref": "opt_hai18_rating_6",
      "dimension": "rating",
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
        "I do not have images (mental pictures) of myself being ill.",
        "I occasionally have images of myself being ill.",
        "I frequently have images of myself being ill.",
        "I constantly have images of myself being ill."
      ]
    },
    {
      "ref": "opt_hai18_rating_7",
      "dimension": "rating",
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
        "I do not have any difficulty taking my mind off thoughts about my health.",
        "I sometimes have difficulty taking my mind off thoughts about my health.",
        "I often have difficulty in taking my mind off thoughts about my health.",
        "Nothing can take my mind off thoughts about my health."
      ]
    },
    {
      "ref": "opt_hai18_rating_8",
      "dimension": "rating",
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
        "I am lastingly relieved if my doctor tells me there is nothing wrong.",
        "I am initially relieved but the worries sometimes return later.",
        "I am initially relieved but the worries always return later.",
        "I am not relieved if my doctor tells me there is nothing wrong."
      ]
    },
    {
      "ref": "opt_hai18_rating_9",
      "dimension": "rating",
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
        "If I hear about an illness I never think I have it myself.",
        "If I hear about an illness I sometimes think I have it myself.",
        "If I hear about an illness I often think I have it myself.",
        "If I hear about an illness I always think I have it myself."
      ]
    },
    {
      "ref": "opt_hai18_rating_10",
      "dimension": "rating",
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
        "If I have a bodily sensation or change I rarely wonder what it means.",
        "If I have a bodily sensation or change I often wonder what it means.",
        "If I have a bodily sensation or change I always wonder what it means.",
        "If I have a bodily sensation or change I must know what it means."
      ]
    },
    {
      "ref": "opt_hai18_rating_11",
      "dimension": "rating",
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
        "I usually feel at very low risk for developing a serious illness.",
        "I usually feel at fairly low risk for developing a serious illness.",
        "I usually feel at moderate risk for developing a serious illness.",
        "I usually feel at high risk for developing a serious illness."
      ]
    },
    {
      "ref": "opt_hai18_rating_12",
      "dimension": "rating",
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
        "I never think I have a serious illness.",
        "I sometimes think I have a serious illness.",
        "I often think I have a serious illness.",
        "I usually think that I am seriously ill."
      ]
    },
    {
      "ref": "opt_hai18_rating_13",
      "dimension": "rating",
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
        "If I notice an unexplained bodily sensation I don’t find it difficult to think about other things.",
        "If I notice an unexplained bodily sensation I sometimes find it difficult to think about other things.",
        "If I notice an unexplained bodily sensation I often find it difficult to think about other things.",
        "If I notice an unexplained bodily sensation I always find it difficult to think about other things."
      ]
    },
    {
      "ref": "opt_hai18_rating_14",
      "dimension": "rating",
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
        "My family/friends would say I do not worry enough about my health.",
        "My family/friends would say I have a normal attitude to my health.",
        "My family/friends would say I worry too much about my health.",
        "My family/friends would say I am a hypochondriac."
      ]
    },
    {
      "ref": "opt_hai18_rating_15",
      "dimension": "rating",
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
        "If I had a serious illness I would still be able to enjoy things in my life quite a lot.",
        "If I had a serious illness I would still be able to enjoy things in my life a little.",
        "If I had a serious illness I would be almost completely unable to enjoy things in my life.",
        "If I had a serious illness I would be completely unable to enjoy life at all."
      ]
    },
    {
      "ref": "opt_hai18_rating_16",
      "dimension": "rating",
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
        "If I developed a serious illness there is a good chance that modern medicine would be able to cure me.",
        "If I developed a serious illness there is a moderate chance that modern medicine would be able to cure me.",
        "If I developed a serious illness there is a very small chance that modern medicine would be able to cure me.",
        "If I developed a serious illness there is no chance that modern medicine would be able to cure me."
      ]
    },
    {
      "ref": "opt_hai18_rating_17",
      "dimension": "rating",
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
        "A serious illness would ruin some aspects of my life.",
        "A serious illness would ruin many aspects of my life.",
        "A serious illness would ruin almost every aspect of my life.",
        "A serious illness would ruin every aspect of my life."
      ]
    },
    {
      "ref": "opt_hai18_rating_18",
      "dimension": "rating",
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
        "If I had a serious illness I would not feel that I had lost my dignity.",
        "If I had a serious illness I would feel that I had lost a little of my dignity.",
        "If I had a serious illness I would feel that I had lost quite a lot of my dignity.",
        "If I had a serious illness I would feel that I had totally lost my dignity."
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_hai18_shared",
      "prompt_snippet": "Each of the following questions consists of a group of four statements. Please r",
      "dimension": "rating",
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
      "prompt_id": "pr_hai18_shared",
      "prompt_snippet": "Each of the following questions consists of a group of four statements. Please r",
      "dimension": "rating",
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
      "prompt_id": "pr_hai18_shared",
      "prompt_snippet": "Each of the following questions consists of a group of four statements. Please r",
      "dimension": "rating",
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
      "prompt_id": "pr_hai18_shared",
      "prompt_snippet": "Each of the following questions consists of a group of four statements. Please r",
      "dimension": "rating",
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
      "prompt_id": "pr_hai18_shared",
      "prompt_snippet": "Each of the following questions consists of a group of four statements. Please r",
      "dimension": "rating",
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
      "prompt_id": "pr_hai18_shared",
      "prompt_snippet": "Each of the following questions consists of a group of four statements. Please r",
      "dimension": "rating",
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
      "prompt_id": "pr_hai18_shared",
      "prompt_snippet": "Each of the following questions consists of a group of four statements. Please r",
      "dimension": "rating",
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
      "prompt_id": "pr_hai18_shared",
      "prompt_snippet": "Each of the following questions consists of a group of four statements. Please r",
      "dimension": "rating",
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
      "prompt_id": "pr_hai18_shared",
      "prompt_snippet": "Each of the following questions consists of a group of four statements. Please r",
      "dimension": "rating",
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
      "prompt_id": "pr_hai18_shared",
      "prompt_snippet": "Each of the following questions consists of a group of four statements. Please r",
      "dimension": "rating",
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
      "prompt_id": "pr_hai18_shared",
      "prompt_snippet": "Each of the following questions consists of a group of four statements. Please r",
      "dimension": "rating",
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
      "prompt_id": "pr_hai18_shared",
      "prompt_snippet": "Each of the following questions consists of a group of four statements. Please r",
      "dimension": "rating",
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
      "prompt_id": "pr_hai18_shared",
      "prompt_snippet": "Each of the following questions consists of a group of four statements. Please r",
      "dimension": "rating",
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
      "prompt_id": "pr_hai18_shared",
      "prompt_snippet": "Each of the following questions consists of a group of four statements. Please r",
      "dimension": "rating",
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
      "prompt_id": "pr_hai18_shared",
      "prompt_snippet": "Each of the following questions consists of a group of four statements. Please r",
      "dimension": "rating",
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
      "prompt_id": "pr_hai18_shared",
      "prompt_snippet": "Each of the following questions consists of a group of four statements. Please r",
      "dimension": "rating",
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
      "prompt_id": "pr_hai18_shared",
      "prompt_snippet": "Each of the following questions consists of a group of four statements. Please r",
      "dimension": "rating",
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
      "prompt_id": "pr_hai18_shared",
      "prompt_snippet": "Each of the following questions consists of a group of four statements. Please r",
      "dimension": "rating",
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

- Items: 18
- Dimensions: rating
- Distinct scales: 18 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Each of the following questions consists of a group of four statements. Please r | rating | 0,1,2,3 | no |
| 2 | Each of the following questions consists of a group of four statements. Please r | rating | 0,1,2,3 | no |
| 3 | Each of the following questions consists of a group of four statements. Please r | rating | 0,1,2,3 | no |
| 4 | Each of the following questions consists of a group of four statements. Please r | rating | 0,1,2,3 | no |
| 5 | Each of the following questions consists of a group of four statements. Please r | rating | 0,1,2,3 | no |
| 6 | Each of the following questions consists of a group of four statements. Please r | rating | 0,1,2,3 | no |
| 7 | Each of the following questions consists of a group of four statements. Please r | rating | 0,1,2,3 | no |
| 8 | Each of the following questions consists of a group of four statements. Please r | rating | 0,1,2,3 | no |
| 9 | Each of the following questions consists of a group of four statements. Please r | rating | 0,1,2,3 | no |
| 10 | Each of the following questions consists of a group of four statements. Please r | rating | 0,1,2,3 | no |
| 11 | Each of the following questions consists of a group of four statements. Please r | rating | 0,1,2,3 | no |
| 12 | Each of the following questions consists of a group of four statements. Please r | rating | 0,1,2,3 | no |
| 13 | Each of the following questions consists of a group of four statements. Please r | rating | 0,1,2,3 | no |
| 14 | Each of the following questions consists of a group of four statements. Please r | rating | 0,1,2,3 | no |
| 15 | Each of the following questions consists of a group of four statements. Please r | rating | 0,1,2,3 | no |
| 16 | Each of the following questions consists of a group of four statements. Please r | rating | 0,1,2,3 | no |
| 17 | Each of the following questions consists of a group of four statements. Please r | rating | 0,1,2,3 | no |
| 18 | Each of the following questions consists of a group of four statements. Please r | rating | 0,1,2,3 | no |

## To research (fill from https://psychology-tools.com/test/health-anxiety-inventory)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
