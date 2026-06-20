# Scoring — Procrastinatory Cognitions Inventory (PCI) (`qst_pci`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_pci",
  "title": "Procrastinatory Cognitions Inventory (PCI)",
  "short_title": "PCI",
  "source_url": "https://us.psytoolkit.org/survey-library/procrastination-pci.html",
  "publication": {
    "citation": "Stainton, M., Lay, C. H., & Flett, G. L. (2000). Trait procrastinators and behavior/trait-specific cognitions. Journal of social behavior and personality, 15 , 297-312.",
    "year": 2000
  },
  "status": "needs-research",
  "item_count": 18,
  "dimensions": [
    "freq"
  ],
  "option_scales": [
    {
      "ref": "opt_pci_freq_5",
      "dimension": "freq",
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
        "not at all",
        "sometimes",
        "moderately often",
        "often",
        "all of the time"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_pci_1",
      "prompt_snippet": "Why can’t I do what I should be doing.",
      "dimension": "freq",
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
      "prompt_id": "pr_pci_2",
      "prompt_snippet": "I need to start earlier.",
      "dimension": "freq",
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
      "prompt_id": "pr_pci_3",
      "prompt_snippet": "I should be more responsible.",
      "dimension": "freq",
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
      "prompt_id": "pr_pci_4",
      "prompt_snippet": "I should be doing more studying.",
      "dimension": "freq",
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
      "prompt_id": "pr_pci_5",
      "prompt_snippet": "No matter how much I try, I still put things off.",
      "dimension": "freq",
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
      "prompt_id": "pr_pci_6",
      "prompt_snippet": "People expect me to work and study more.",
      "dimension": "freq",
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
      "prompt_id": "pr_pci_7",
      "prompt_snippet": "Why can’t I just get started.",
      "dimension": "freq",
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
      "prompt_id": "pr_pci_8",
      "prompt_snippet": "I know I’m behind but I can catch up.",
      "dimension": "freq",
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
      "prompt_id": "pr_pci_9",
      "prompt_snippet": "I’m behind in my studies this time, but next time it will be different.",
      "dimension": "freq",
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
      "prompt_id": "pr_pci_10",
      "prompt_snippet": "I’m letting myself down.",
      "dimension": "freq",
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
      "prompt_id": "pr_pci_11",
      "prompt_snippet": "This is not how I want to be.",
      "dimension": "freq",
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
      "prompt_id": "pr_pci_12",
      "prompt_snippet": "It would be great if everything in my life were done on time.",
      "dimension": "freq",
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
      "prompt_id": "pr_pci_13",
      "prompt_snippet": "I’m such a procrastinator, I’ll never reach my goals.",
      "dimension": "freq",
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
      "prompt_id": "pr_pci_14",
      "prompt_snippet": "I need deadlines to get me going.",
      "dimension": "freq",
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
      "prompt_id": "pr_pci_15",
      "prompt_snippet": "I can turn it in late.",
      "dimension": "freq",
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
      "prompt_id": "pr_pci_16",
      "prompt_snippet": "I really don’t like studying.",
      "dimension": "freq",
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
      "prompt_id": "pr_pci_17",
      "prompt_snippet": "Why can’t I finish things that I start.",
      "dimension": "freq",
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
      "prompt_id": "pr_pci_18",
      "prompt_snippet": "Why didn’t I start earlier.",
      "dimension": "freq",
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
- Dimensions: freq
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Why can’t I do what I should be doing. | freq | 0,1,2,3,4 | no |
| 2 | I need to start earlier. | freq | 0,1,2,3,4 | no |
| 3 | I should be more responsible. | freq | 0,1,2,3,4 | no |
| 4 | I should be doing more studying. | freq | 0,1,2,3,4 | no |
| 5 | No matter how much I try, I still put things off. | freq | 0,1,2,3,4 | no |
| 6 | People expect me to work and study more. | freq | 0,1,2,3,4 | no |
| 7 | Why can’t I just get started. | freq | 0,1,2,3,4 | no |
| 8 | I know I’m behind but I can catch up. | freq | 0,1,2,3,4 | no |
| 9 | I’m behind in my studies this time, but next time it will be different. | freq | 0,1,2,3,4 | no |
| 10 | I’m letting myself down. | freq | 0,1,2,3,4 | no |
| 11 | This is not how I want to be. | freq | 0,1,2,3,4 | no |
| 12 | It would be great if everything in my life were done on time. | freq | 0,1,2,3,4 | no |
| 13 | I’m such a procrastinator, I’ll never reach my goals. | freq | 0,1,2,3,4 | no |
| 14 | I need deadlines to get me going. | freq | 0,1,2,3,4 | no |
| 15 | I can turn it in late. | freq | 0,1,2,3,4 | no |
| 16 | I really don’t like studying. | freq | 0,1,2,3,4 | no |
| 17 | Why can’t I finish things that I start. | freq | 0,1,2,3,4 | no |
| 18 | Why didn’t I start earlier. | freq | 0,1,2,3,4 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/procrastination-pci.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
