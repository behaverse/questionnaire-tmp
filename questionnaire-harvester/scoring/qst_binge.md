# Scoring — Binge Eating Scale (BES) (`qst_binge`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_binge",
  "title": "Binge Eating Scale (BES)",
  "short_title": "BES",
  "source_url": "https://psychology-tools.com/test/binge-eating-scale",
  "publication": {
    "citation": "J Gormally, S Black, S Daston, D Rardin. The assessment of binge eating severity among obese persons. 7 ( 1 ): Addict Behav 47-55 ( 1982 ).",
    "year": 1982
  },
  "status": "needs-research",
  "item_count": 16,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_binge_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        0,
        0,
        1,
        3
      ],
      "value_range": [
        0,
        3
      ],
      "anchors": [
        "I don’t feel self-conscious about my weight or body size when I’m with others.",
        "I feel concerned about how I look to others, but it normally does not make me feel disappointed with myself.",
        "I do get self-conscious about my appearance and weight which makes me feel disappointed in myself.",
        "I feel very self-conscious about my weight and frequently, I feel intense shame and disgust for myself. I try to avoid social contacts because of my self-consciousness."
      ]
    },
    {
      "ref": "opt_binge_rating_2",
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
        "I don’t have any difficulty eating slowly in the proper manner.",
        "Although I seem to “gobble down” foods, I don’t end up feeling stuffed because of eating too much.",
        "At times, I tend to eat quickly and then, I feel uncomfortably full afterwards.",
        "I have the habit of bolting down my food, without really chewing it. When this happens I usually feel uncomfortably stuffed because I’ve eaten too much."
      ]
    },
    {
      "ref": "opt_binge_rating_3",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        0,
        1,
        3,
        3
      ],
      "value_range": [
        0,
        3
      ],
      "anchors": [
        "I feel capable to control my eating urges when I want to.",
        "I feel like I have failed to control my eating more than the average person.",
        "I feel utterly helpless when it comes to feeling in control of my eating urges.",
        "Because I feel so helpless about controlling my eating I have become very desperate about trying to get in control."
      ]
    },
    {
      "ref": "opt_binge_rating_4",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        0,
        0,
        0,
        2
      ],
      "value_range": [
        0,
        2
      ],
      "anchors": [
        "I don’t have the habit of eating when I’m bored.",
        "I sometimes eat when I’m bored, but often I’m able to “get busy” and get my mind off food.",
        "I have a regular habit of eating when I’m bored, but occasionally, I can use some other activity to get my mind off eating.",
        "I have a strong habit of eating when I’m bored. Nothing seems to help me break the habit."
      ]
    },
    {
      "ref": "opt_binge_rating_5",
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
        "I’m usually physically hungry when I eat something.",
        "Occasionally, I eat something on impulse even though I really am not hungry.",
        "I have the regular habit of eating foods, that I might not really enjoy, to satisfy a hungry feeling even though physically, I don’t need the food.",
        "Although I’m not physically hungry, I get a hungry feeling in my mouth that only seems to be satisfied when I eat a food, like a sandwich, that fills my mouth. Sometimes, when I eat the food to satisfy my mouth hunger, I then spit the food out so I won’t gain weight."
      ]
    },
    {
      "ref": "opt_binge_rating_6",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 3,
      "values": [
        0,
        1,
        3
      ],
      "value_range": [
        0,
        3
      ],
      "anchors": [
        "I don’t feel any guilt or self-hate after I overeat.",
        "After I overeat, occasionally I feel guilt or self-hate.",
        "Almost all the time I experience strong guilt or self-hate after I overeat."
      ]
    },
    {
      "ref": "opt_binge_rating_7",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        0,
        2,
        3,
        3
      ],
      "value_range": [
        0,
        3
      ],
      "anchors": [
        "I don’t lose total control of my eating when dieting even after periods when I overeat.",
        "Sometimes when I eat a “forbidden food” on a diet, I feel like I “blew it” and eat even more.",
        "Frequently, I have the habit of saying to myself, “I’ve blown it now, why not go all the way” when I overeat on a diet. When that happens I eat even more.",
        "I have a regular habit of starting strict diets for myself, but I break the diets by going on an eating binge. My life seems to be either a “feast” or “famine.”"
      ]
    },
    {
      "ref": "opt_binge_rating_8",
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
        "I rarely eat so much food that I feel uncomfortably stuffed afterwards.",
        "Usually about once a month, I eat such a quantity of food, I end up feeling very stuffed.",
        "I have regular periods during the month when I eat large amounts of food, either at mealtime or at snacks.",
        "I eat so much food that I regularly feel quite uncomfortable after eating and sometimes a bit nauseous."
      ]
    },
    {
      "ref": "opt_binge_rating_9",
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
        "My level of calorie intake does not go up very high or go down very low on a regular basis.",
        "Sometimes after I overeat, I will try to reduce my caloric intake to almost nothing to compensate for the excess calories I’ve eaten.",
        "I have a regular habit of overeating during the night. It seems that my routine is not to be hungry in the morning but overeat in the evening.",
        "In my adult years, I have had week-long periods where I practically starve myself. This follows periods when I overeat. It seems I live a life of either “feast or famine.”"
      ]
    },
    {
      "ref": "opt_binge_rating_10",
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
        "I usually am able to stop eating when I want to. I know when “enough is enough.”",
        "Every so often, I experience a compulsion to eat which I can’t seem to control.",
        "Frequently, I experience strong urges to eat which I seem unable to control, but at other times I can control my eating urges.",
        "I feel incapable of controlling urges to eat. I have a fear of not being able to stop eating voluntarily."
      ]
    },
    {
      "ref": "opt_binge_rating_11",
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
        "I don’t have any problem stopping eating when I feel full.",
        "I usually can stop eating when I feel full but occasionally overeat leaving me feeling uncomfortably stuffed.",
        "I have a problem stopping eating once I start and usually I feel uncomfortably stuffed after I eat a meal.",
        "Because I have a problem not being able to stop eating when I want, I sometimes have to induce vomiting to relieve my stuffed feeling."
      ]
    },
    {
      "ref": "opt_binge_rating_12",
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
        "I seem to eat just as much when I’m with others (family, social gatherings) as when I’m by myself.",
        "Sometimes, when I’m with other persons, I don’t eat as much as I want to eat because I’m self-conscious about my eating.",
        "Frequently, I eat only a small amount of food when others are present, because I’m very embarrassed about my eating.",
        "I feel so ashamed about overeating that I pick times to overeat when I know no one will see me. I feel like a “closet eater.”"
      ]
    },
    {
      "ref": "opt_binge_rating_13",
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
        "I eat three meals a day with only an occasional between meal snack.",
        "I eat 3 meals a day, but I also normally snack between meals.",
        "When I am snacking heavily, I get in the habit of skipping regular meals.",
        "There are regular periods when I seem to be continually eating, with no planned meals."
      ]
    },
    {
      "ref": "opt_binge_rating_14",
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
        "I don’t think much about trying to control unwanted eating urges.",
        "At least some of the time, I feel my thoughts are pre-occupied with trying to control my eating urges.",
        "I feel that frequently I spend much time thinking about how much I ate or about trying not to eat anymore.",
        "It seems to me that most of my waking hours are pre-occupied by thoughts about eating or not eating. I feel like I’m constantly struggling not to eat."
      ]
    },
    {
      "ref": "opt_binge_rating_15",
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
        "I don’t think about food a great deal.",
        "I have strong cravings for food but they last only for brief periods of time.",
        "I have days when I can’t seem to think about anything else but food.",
        "Most of my days seem to be pre-occupied with thoughts about food. I feel like I live to eat."
      ]
    },
    {
      "ref": "opt_binge_rating_16",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 3,
      "values": [
        0,
        1,
        2
      ],
      "value_range": [
        0,
        2
      ],
      "anchors": [
        "I usually know whether or not I’m physically hungry. I take the right portion of food to satisfy me.",
        "Occasionally, I feel uncertain about knowing whether or not I’m physically hungry. At these times it’s hard to know how much food I should take to satisfy me.",
        "Even though I might know how many calories I should eat, I don’t have any idea what is a “normal” amount of food for me."
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_binge_shared",
      "prompt_snippet": "Below are groups of statements about behavior, thoughts, and emotional states. P",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        3
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_binge_shared",
      "prompt_snippet": "Below are groups of statements about behavior, thoughts, and emotional states. P",
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
      "prompt_id": "pr_binge_shared",
      "prompt_snippet": "Below are groups of statements about behavior, thoughts, and emotional states. P",
      "dimension": "rating",
      "values": [
        0,
        1,
        3,
        3
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_binge_shared",
      "prompt_snippet": "Below are groups of statements about behavior, thoughts, and emotional states. P",
      "dimension": "rating",
      "values": [
        0,
        0,
        0,
        2
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_binge_shared",
      "prompt_snippet": "Below are groups of statements about behavior, thoughts, and emotional states. P",
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
      "prompt_id": "pr_binge_shared",
      "prompt_snippet": "Below are groups of statements about behavior, thoughts, and emotional states. P",
      "dimension": "rating",
      "values": [
        0,
        1,
        3
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_binge_shared",
      "prompt_snippet": "Below are groups of statements about behavior, thoughts, and emotional states. P",
      "dimension": "rating",
      "values": [
        0,
        2,
        3,
        3
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_binge_shared",
      "prompt_snippet": "Below are groups of statements about behavior, thoughts, and emotional states. P",
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
      "prompt_id": "pr_binge_shared",
      "prompt_snippet": "Below are groups of statements about behavior, thoughts, and emotional states. P",
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
      "prompt_id": "pr_binge_shared",
      "prompt_snippet": "Below are groups of statements about behavior, thoughts, and emotional states. P",
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
      "prompt_id": "pr_binge_shared",
      "prompt_snippet": "Below are groups of statements about behavior, thoughts, and emotional states. P",
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
      "prompt_id": "pr_binge_shared",
      "prompt_snippet": "Below are groups of statements about behavior, thoughts, and emotional states. P",
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
      "prompt_id": "pr_binge_shared",
      "prompt_snippet": "Below are groups of statements about behavior, thoughts, and emotional states. P",
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
      "prompt_id": "pr_binge_shared",
      "prompt_snippet": "Below are groups of statements about behavior, thoughts, and emotional states. P",
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
      "prompt_id": "pr_binge_shared",
      "prompt_snippet": "Below are groups of statements about behavior, thoughts, and emotional states. P",
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
      "prompt_id": "pr_binge_shared",
      "prompt_snippet": "Below are groups of statements about behavior, thoughts, and emotional states. P",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
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

- Items: 16
- Dimensions: rating
- Distinct scales: 16 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Below are groups of statements about behavior, thoughts, and emotional states. P | rating | 0,0,1,3 | no |
| 2 | Below are groups of statements about behavior, thoughts, and emotional states. P | rating | 0,1,2,3 | no |
| 3 | Below are groups of statements about behavior, thoughts, and emotional states. P | rating | 0,1,3,3 | no |
| 4 | Below are groups of statements about behavior, thoughts, and emotional states. P | rating | 0,0,0,2 | no |
| 5 | Below are groups of statements about behavior, thoughts, and emotional states. P | rating | 0,1,2,3 | no |
| 6 | Below are groups of statements about behavior, thoughts, and emotional states. P | rating | 0,1,3 | no |
| 7 | Below are groups of statements about behavior, thoughts, and emotional states. P | rating | 0,2,3,3 | no |
| 8 | Below are groups of statements about behavior, thoughts, and emotional states. P | rating | 0,1,2,3 | no |
| 9 | Below are groups of statements about behavior, thoughts, and emotional states. P | rating | 0,1,2,3 | no |
| 10 | Below are groups of statements about behavior, thoughts, and emotional states. P | rating | 0,1,2,3 | no |
| 11 | Below are groups of statements about behavior, thoughts, and emotional states. P | rating | 0,1,2,3 | no |
| 12 | Below are groups of statements about behavior, thoughts, and emotional states. P | rating | 0,1,2,3 | no |
| 13 | Below are groups of statements about behavior, thoughts, and emotional states. P | rating | 0,1,2,3 | no |
| 14 | Below are groups of statements about behavior, thoughts, and emotional states. P | rating | 0,1,2,3 | no |
| 15 | Below are groups of statements about behavior, thoughts, and emotional states. P | rating | 0,1,2,3 | no |
| 16 | Below are groups of statements about behavior, thoughts, and emotional states. P | rating | 0,1,2 | no |

## To research (fill from https://psychology-tools.com/test/binge-eating-scale)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
