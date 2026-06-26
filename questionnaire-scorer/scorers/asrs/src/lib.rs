// ASRS-v1.1 Part A screener (Kessler et al., 2005). The 6 screener items are scored with grey-zone
// thresholds (item-specific), not summed raw: items 1-3 count if answered "Sometimes" or more
// (value >= 3), items 4-6 if "Often" or more (value >= 4), on a 1=Never..5=Very Often scale.
// Part A score = number of items in the grey zone (0-6); 4 or more is highly consistent with ADHD.
// This per-item threshold rule cannot be expressed by the generic sum/mean engine.
use serde_json::{json, Value};

// (prompt id, threshold value at or above which the item counts)
const ITEMS: [(&str, i64); 6] = [
    ("pr_asrs_1", 3), ("pr_asrs_2", 3), ("pr_asrs_3", 3),
    ("pr_asrs_4", 4), ("pr_asrs_5", 4), ("pr_asrs_6", 4),
];

pub fn score_asrs(input: &Value) -> Result<Value, String> {
    let sr = input
        .get("scored_responses")
        .and_then(|v| v.as_object())
        .ok_or_else(|| "missing scored_responses object".to_string())?;
    let mut count = 0i64;
    let mut missing = 0i64;
    for (key, thresh) in ITEMS {
        match sr.get(key) {
            None | Some(Value::Null) => missing += 1,
            Some(v) => {
                let n = v.as_i64().ok_or_else(|| format!("{key}: not an integer"))?;
                if !(1..=5).contains(&n) {
                    return Err(format!("{key}: out of range 1..5"));
                }
                if n >= thresh {
                    count += 1;
                }
            }
        }
    }
    let (severity, label) = if count >= 4 {
        ("positive", "Symptoms highly consistent with ADHD — further investigation warranted")
    } else {
        ("negative", "Symptoms not consistent with ADHD")
    };
    Ok(json!({
        "part_a": count, "severity": severity,
        "band": { "min": if count >= 4 {4} else {0}, "max": if count >= 4 {6} else {3}, "label": label },
        "missing_count": missing
    }))
}

scorer_abi::scorer!(score_asrs);

#[cfg(test)]
mod tests {
    use super::*;
    fn vals(v: [i64; 6]) -> Value {
        let mut o = serde_json::Map::new();
        for (i, x) in v.iter().enumerate() { o.insert(format!("pr_asrs_{}", i + 1), json!(x)); }
        json!({ "scored_responses": o })
    }
    #[test]
    fn positive_screen() {
        // items 1-3 = 3 (>=3 counts), items 4-6 = 4 (>=4 counts) -> 6 -> positive
        assert_eq!(score_asrs(&vals([3, 3, 3, 4, 4, 4])).unwrap()["part_a"], json!(6));
        assert_eq!(score_asrs(&vals([3, 3, 3, 4, 4, 4])).unwrap()["severity"], json!("positive"));
    }
    #[test]
    fn threshold_boundaries() {
        // items 4-6 at "Sometimes"(3) do NOT count; items 1-3 at 3 DO -> 3 -> negative
        let out = score_asrs(&vals([3, 3, 3, 3, 3, 3])).unwrap();
        assert_eq!(out["part_a"], json!(3));
        assert_eq!(out["severity"], json!("negative"));
    }
    #[test]
    fn rejects_out_of_range() {
        assert!(score_asrs(&vals([6, 1, 1, 1, 1, 1])).is_err());
    }
}
