# Scoring — Empathy Quotient (EQ) (`qst_eq`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_eq",
  "title": "Empathy Quotient (EQ)",
  "short_title": "EQ",
  "source_url": "https://us.psytoolkit.org/survey-library/empathy-arc.html",
  "publication": null,
  "status": "needs-research",
  "item_count": 40,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_eq_agree_4",
      "dimension": "agree",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        1,
        2,
        3,
        4
      ],
      "value_range": [
        1,
        4
      ],
      "anchors": [
        "Strongly agree",
        "Slightly agree",
        "Slightly disagree",
        "Strongly disagree"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_eq_1",
      "prompt_snippet": "I can easily tell if someone else wants to enter a conversation.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_eq_2",
      "prompt_snippet": "I find it difficult to explain to others things that I understand easily, when t",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_eq_3",
      "prompt_snippet": "I really enjoy caring for other people.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_eq_4",
      "prompt_snippet": "I find it hard to know what to do in a social situation.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_eq_5",
      "prompt_snippet": "People often tell me that I went too far in driving my point home in a discussio",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_eq_6",
      "prompt_snippet": "It doesn't bother me too much if I am late meeting a friend.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_eq_7",
      "prompt_snippet": "Friendships and relationships are just too difficult, so I tend not to bother wi",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_eq_8",
      "prompt_snippet": "I often find it difficult to judge if something is rude or polite.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_eq_9",
      "prompt_snippet": "In a conversation, I tend to focus on my own thoughts rather than on what my lis",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_eq_10",
      "prompt_snippet": "When I was a child, I enjoyed cutting up worms to see what would happen.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_eq_11",
      "prompt_snippet": "I can pick up quickly if someone says one thing but means another.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_eq_12",
      "prompt_snippet": "It is hard for me to see why some things upset people so much.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_eq_13",
      "prompt_snippet": "I find it easy to put myself in somebody else's shoes.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_eq_14",
      "prompt_snippet": "I am good at predicting how someone will feel.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_eq_15",
      "prompt_snippet": "I am quick to spot when someone in a group is feeling awkward or uncomfortable.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_eq_16",
      "prompt_snippet": "If I say something that someone else is offended by, I think that that's their p",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_eq_17",
      "prompt_snippet": "If anyone asked me if I liked their haircut, I would reply truthfully, even if I",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_eq_18",
      "prompt_snippet": "I can't always see why someone should have felt offended by a remark.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_eq_19",
      "prompt_snippet": "Seeing people cry doesn't really upset me.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_eq_20",
      "prompt_snippet": "I am very blunt, which some people take to be rudeness, even though this is unin",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_eq_21",
      "prompt_snippet": "I don’t tend to find social situations confusing.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_eq_22",
      "prompt_snippet": "Other people tell me I am good at understanding how they are feeling and what th",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_eq_23",
      "prompt_snippet": "When I talk to people, I tend to talk about their experiences rather than my own",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_eq_24",
      "prompt_snippet": "It upsets me to see an animal in pain.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_eq_25",
      "prompt_snippet": "I am able to make decisions without being influenced by people's feelings.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 26,
      "prompt_id": "pr_eq_26",
      "prompt_snippet": "I can easily tell if someone else is interested or bored with what I am saying.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 27,
      "prompt_id": "pr_eq_27",
      "prompt_snippet": "I get upset if I see people suffering on news programmes.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 28,
      "prompt_id": "pr_eq_28",
      "prompt_snippet": "Friends usually talk to me about their problems as they say that I am very under",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 29,
      "prompt_id": "pr_eq_29",
      "prompt_snippet": "I can sense if I am intruding, even if the other person doesn't tell me.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 30,
      "prompt_id": "pr_eq_30",
      "prompt_snippet": "People sometimes tell me that I have gone too far with teasing.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 31,
      "prompt_id": "pr_eq_31",
      "prompt_snippet": "Other people often say that I am insensitive, though I don’t always see why.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 32,
      "prompt_id": "pr_eq_32",
      "prompt_snippet": "If I see a stranger in a group, I think that it is up to them to make an effort ",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 33,
      "prompt_id": "pr_eq_33",
      "prompt_snippet": "I usually stay emotionally detached when watching a film.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 34,
      "prompt_id": "pr_eq_34",
      "prompt_snippet": "I can tune into how someone else feels rapidly and intuitively.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 35,
      "prompt_id": "pr_eq_35",
      "prompt_snippet": "I can easily work out what another person might want to talk about.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 36,
      "prompt_id": "pr_eq_36",
      "prompt_snippet": "I can tell if someone is masking their true emotion.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 37,
      "prompt_id": "pr_eq_37",
      "prompt_snippet": "I don't consciously work out the rules of social situations.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 38,
      "prompt_id": "pr_eq_38",
      "prompt_snippet": "I am good at predicting what someone will do.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 39,
      "prompt_id": "pr_eq_39",
      "prompt_snippet": "I tend to get emotionally involved with a friend's problems.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 40,
      "prompt_id": "pr_eq_40",
      "prompt_snippet": "I can usually appreciate the other person's viewpoint, even if I don't agree wit",
      "dimension": "agree",
      "values": [
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

- Items: 40
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I can easily tell if someone else wants to enter a conversation. | agree | 1,2,3,4 | no |
| 2 | I find it difficult to explain to others things that I understand easily, when t | agree | 1,2,3,4 | no |
| 3 | I really enjoy caring for other people. | agree | 1,2,3,4 | no |
| 4 | I find it hard to know what to do in a social situation. | agree | 1,2,3,4 | no |
| 5 | People often tell me that I went too far in driving my point home in a discussio | agree | 1,2,3,4 | no |
| 6 | It doesn't bother me too much if I am late meeting a friend. | agree | 1,2,3,4 | no |
| 7 | Friendships and relationships are just too difficult, so I tend not to bother wi | agree | 1,2,3,4 | no |
| 8 | I often find it difficult to judge if something is rude or polite. | agree | 1,2,3,4 | no |
| 9 | In a conversation, I tend to focus on my own thoughts rather than on what my lis | agree | 1,2,3,4 | no |
| 10 | When I was a child, I enjoyed cutting up worms to see what would happen. | agree | 1,2,3,4 | no |
| 11 | I can pick up quickly if someone says one thing but means another. | agree | 1,2,3,4 | no |
| 12 | It is hard for me to see why some things upset people so much. | agree | 1,2,3,4 | no |
| 13 | I find it easy to put myself in somebody else's shoes. | agree | 1,2,3,4 | no |
| 14 | I am good at predicting how someone will feel. | agree | 1,2,3,4 | no |
| 15 | I am quick to spot when someone in a group is feeling awkward or uncomfortable. | agree | 1,2,3,4 | no |
| 16 | If I say something that someone else is offended by, I think that that's their p | agree | 1,2,3,4 | no |
| 17 | If anyone asked me if I liked their haircut, I would reply truthfully, even if I | agree | 1,2,3,4 | no |
| 18 | I can't always see why someone should have felt offended by a remark. | agree | 1,2,3,4 | no |
| 19 | Seeing people cry doesn't really upset me. | agree | 1,2,3,4 | no |
| 20 | I am very blunt, which some people take to be rudeness, even though this is unin | agree | 1,2,3,4 | no |
| 21 | I don’t tend to find social situations confusing. | agree | 1,2,3,4 | no |
| 22 | Other people tell me I am good at understanding how they are feeling and what th | agree | 1,2,3,4 | no |
| 23 | When I talk to people, I tend to talk about their experiences rather than my own | agree | 1,2,3,4 | no |
| 24 | It upsets me to see an animal in pain. | agree | 1,2,3,4 | no |
| 25 | I am able to make decisions without being influenced by people's feelings. | agree | 1,2,3,4 | no |
| 26 | I can easily tell if someone else is interested or bored with what I am saying. | agree | 1,2,3,4 | no |
| 27 | I get upset if I see people suffering on news programmes. | agree | 1,2,3,4 | no |
| 28 | Friends usually talk to me about their problems as they say that I am very under | agree | 1,2,3,4 | no |
| 29 | I can sense if I am intruding, even if the other person doesn't tell me. | agree | 1,2,3,4 | no |
| 30 | People sometimes tell me that I have gone too far with teasing. | agree | 1,2,3,4 | no |
| 31 | Other people often say that I am insensitive, though I don’t always see why. | agree | 1,2,3,4 | no |
| 32 | If I see a stranger in a group, I think that it is up to them to make an effort  | agree | 1,2,3,4 | no |
| 33 | I usually stay emotionally detached when watching a film. | agree | 1,2,3,4 | no |
| 34 | I can tune into how someone else feels rapidly and intuitively. | agree | 1,2,3,4 | no |
| 35 | I can easily work out what another person might want to talk about. | agree | 1,2,3,4 | no |
| 36 | I can tell if someone is masking their true emotion. | agree | 1,2,3,4 | no |
| 37 | I don't consciously work out the rules of social situations. | agree | 1,2,3,4 | no |
| 38 | I am good at predicting what someone will do. | agree | 1,2,3,4 | no |
| 39 | I tend to get emotionally involved with a friend's problems. | agree | 1,2,3,4 | no |
| 40 | I can usually appreciate the other person's viewpoint, even if I don't agree wit | agree | 1,2,3,4 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/empathy-arc.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
