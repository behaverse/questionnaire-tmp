// Major Depression Inventory (Bech et al.). The 12 questions map to 10 ICD-10 symptoms: items
// 8 & 9 (restlessness / subdued) count as ONE symptom (take the higher), and items 11 & 12
// (reduced / increased appetite) count as one (take the higher). Total = the other 8 items + those
// two maxima, range 0-50. This max-of-pairs rule cannot be expressed by the generic sum/mean engine.
use serde_json::{json, Value};

const SINGLES: [&str; 8] = [
    "pr_mdi_1", "pr_mdi_2", "pr_mdi_3", "pr_mdi_4", "pr_mdi_5", "pr_mdi_6", "pr_mdi_7", "pr_mdi_10",
];
const PAIRS: [(&str, &str); 2] = [("pr_mdi_8", "pr_mdi_9"), ("pr_mdi_11", "pr_mdi_12")];

fn item(sr: &serde_json::Map<String, Value>, key: &str) -> Result<Option<i64>, String> {
    match sr.get(key) {
        None | Some(Value::Null) => Ok(None),
        Some(v) => {
            let n = v.as_i64().ok_or_else(|| format!("{key}: not an integer"))?;
            if !(0..=5).contains(&n) {
                return Err(format!("{key}: out of range 0..5"));
            }
            Ok(Some(n))
        }
    }
}

fn band(total: i64) -> (&'static str, i64, i64, &'static str) {
    match total {
        0..=20 => ("none", 0, 20, "No or doubtful depression"),
        21..=25 => ("mild", 21, 25, "Mild depression"),
        26..=30 => ("moderate", 26, 30, "Moderate depression"),
        _ => ("severe", 31, 50, "Severe depression"),
    }
}

pub fn score_mdi(input: &Value) -> Result<Value, String> {
    let sr = input
        .get("scored_responses")
        .and_then(|v| v.as_object())
        .ok_or_else(|| "missing scored_responses object".to_string())?;
    let mut total = 0i64;
    let mut missing = 0i64;
    for key in SINGLES {
        match item(sr, key)? {
            Some(n) => total += n,
            None => missing += 1,
        }
    }
    for (a, b) in PAIRS {
        let (va, vb) = (item(sr, a)?, item(sr, b)?);
        match (va, vb) {
            (None, None) => missing += 1,
            _ => total += va.unwrap_or(0).max(vb.unwrap_or(0)),
        }
    }
    let (severity, min, max, label) = band(total);
    Ok(json!({
        "total": total, "severity": severity,
        "band": { "min": min, "max": max, "label": label }, "missing_count": missing
    }))
}

scorer_abi::scorer!(score_mdi);

#[cfg(test)]
mod tests {
    use super::*;
    fn full(vals: [i64; 12]) -> Value {
        let mut o = serde_json::Map::new();
        for (i, v) in vals.iter().enumerate() {
            o.insert(format!("pr_mdi_{}", i + 1), json!(v));
        }
        json!({ "scored_responses": o })
    }
    #[test]
    fn max_of_pairs() {
        // items 1-7,10 = 2 each (8 items -> 16); pair(8=5,9=1)->5; pair(11=0,12=4)->4; total 25.
        let out = score_mdi(&full([2, 2, 2, 2, 2, 2, 2, 5, 1, 2, 0, 4])).unwrap();
        assert_eq!(out["total"], json!(25));
        assert_eq!(out["severity"], json!("mild"));
    }
    #[test]
    fn floor_and_missing() {
        let out = score_mdi(&json!({ "scored_responses": { "pr_mdi_1": 3 } })).unwrap();
        assert_eq!(out["total"], json!(3));
        assert_eq!(out["missing_count"], json!(9)); // 7 singles + 2 pairs missing
    }
    #[test]
    fn rejects_out_of_range() {
        assert!(score_mdi(&full([6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])).is_err());
    }
}
