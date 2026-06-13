use serde_json::{json, Value};

const KEYS: [&str; 9] = [
    "pr_phq9_1", "pr_phq9_2", "pr_phq9_3", "pr_phq9_4", "pr_phq9_5",
    "pr_phq9_6", "pr_phq9_7", "pr_phq9_8", "pr_phq9_9",
];

fn band(total: i64) -> (&'static str, i64, i64, &'static str) {
    match total {
        0..=4   => ("minimal",    0,  4,  "Minimal Depression"),
        5..=9   => ("mild",       5,  9,  "Mild Depression"),
        10..=14 => ("moderate",  10, 14, "Moderate Depression"),
        15..=19 => ("mod_severe",15, 19, "Moderately Severe Depression"),
        _       => ("severe",    20, 27, "Severe Depression"),
    }
}

pub fn score_phq9(input: &Value) -> Result<Value, String> {
    let sr = input
        .get("scored_responses")
        .and_then(|v| v.as_object())
        .ok_or_else(|| "missing scored_responses object".to_string())?;
    for k in sr.keys() {
        if !KEYS.contains(&k.as_str()) {
            return Err(format!("unexpected key: {k}"));
        }
    }
    let mut total: i64 = 0;
    let mut missing: i64 = 0;
    for key in KEYS {
        match sr.get(key) {
            None | Some(Value::Null) => missing += 1,
            Some(v) => {
                let n = v.as_i64().ok_or_else(|| format!("{key}: not an integer"))?;
                if !(0..=3).contains(&n) {
                    return Err(format!("{key}: out of range 0..3"));
                }
                total += n;
            }
        }
    }
    let (severity, min, max, label) = band(total);
    Ok(json!({
        "total": total,
        "severity": severity,
        "band": { "min": min, "max": max, "label": label },
        "missing_count": missing
    }))
}

scorer_abi::scorer!(score_phq9);

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn full(vals: [i64; 9]) -> Value {
        let mut o = serde_json::Map::new();
        for (i, v) in vals.iter().enumerate() {
            o.insert(format!("pr_phq9_{}", i + 1), json!(v));
        }
        json!({ "scored_responses": o })
    }

    #[test]
    fn moderate_no_missing() {
        let out = score_phq9(&full([1, 2, 1, 2, 1, 1, 2, 1, 1])).unwrap();
        assert_eq!(out, json!({
            "total": 12, "severity": "moderate",
            "band": { "min": 10, "max": 14, "label": "Moderate Depression" },
            "missing_count": 0
        }));
    }
    #[test]
    fn minimal_floor() {
        let out = score_phq9(&full([0,0,0,0,0,0,0,0,0])).unwrap();
        assert_eq!(out, json!({
            "total": 0, "severity": "minimal",
            "band": { "min": 0, "max": 4, "label": "Minimal Depression" },
            "missing_count": 0
        }));
    }
    #[test]
    fn severe_band() {
        let out = score_phq9(&full([3,3,3,3,3,3,3,3,3])).unwrap();
        assert_eq!(out["total"], json!(27));
        assert_eq!(out["severity"], json!("severe"));
        assert_eq!(out["band"]["label"], json!("Severe Depression"));
    }
    #[test]
    fn missing_items_counted() {
        let out = score_phq9(&json!({ "scored_responses": { "pr_phq9_1": 2, "pr_phq9_2": 3 } })).unwrap();
        assert_eq!(out["total"], json!(5));
        assert_eq!(out["missing_count"], json!(7));
        assert_eq!(out["severity"], json!("mild"));
    }
    #[test]
    fn rejects_out_of_range() {
        assert!(score_phq9(&full([4,0,0,0,0,0,0,0,0])).is_err());
    }
    #[test]
    fn rejects_unexpected_key() {
        let r = score_phq9(&json!({ "scored_responses": { "pr_phq9_1": 1, "bogus": 1 } }));
        assert!(r.is_err());
    }
    #[test]
    fn rejects_missing_scored_responses() {
        assert!(score_phq9(&json!({})).is_err());
    }
}
