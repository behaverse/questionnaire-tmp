// NORC DSM-IV Screen for Gambling Problems (NODS). The 17 yes/no items map to the 10 DSM-IV
// pathological-gambling criteria; a criterion counts (1) if ANY of its items is endorsed. Score =
// number of criteria met (0-10): 0 none, 1-2 at-risk, 3-4 problem gambler, 5-10 pathological gambler.
// The two "three or more times?" frequency follow-ups (items 4 and 8) are qualifiers, not scored.
// Criterion membership is mapped from the harvested item content (preoccupation 1-2, lying 3,
// loss-of-control 5/7, withdrawal 6, tolerance 9, escape 10-11, chasing 12, illegal 13,
// risked relationships 14-16, bailout 17). This OR-collapse + criterion count is not a plain sum.
use serde_json::{json, Value};

const CRITERIA: [&[usize]; 10] = [
    &[1, 2], &[3], &[5, 7], &[6], &[9], &[10, 11], &[12], &[13], &[14, 15, 16], &[17],
];

pub fn score_nods(input: &Value) -> Result<Value, String> {
    let sr = input.get("scored_responses").and_then(|v| v.as_object())
        .ok_or_else(|| "missing scored_responses object".to_string())?;
    let yes = |n: usize| -> Result<Option<bool>, String> {
        match sr.get(&format!("pr_nodscl_{n}")) {
            None | Some(Value::Null) => Ok(None),
            Some(v) => {
                let x = v.as_i64().ok_or_else(|| format!("pr_nodscl_{n}: not an integer"))?;
                if x != 0 && x != 1 { return Err(format!("pr_nodscl_{n}: out of range 0..1")); }
                Ok(Some(x == 1))
            }
        }
    };
    let mut total = 0i64;
    let mut missing = 0i64;
    for items in CRITERIA {
        let mut met = false;
        let mut any_present = false;
        for &n in items {
            if let Some(b) = yes(n)? { any_present = true; met |= b; }
        }
        if !any_present { missing += 1; }
        if met { total += 1; }
    }
    let (severity, lo, hi, label) = match total {
        0 => ("none", 0, 0, "No gambling problem"),
        1..=2 => ("at_risk", 1, 2, "At-risk gambling"),
        3..=4 => ("problem", 3, 4, "Problem gambling"),
        _ => ("pathological", 5, 10, "Pathological gambling"),
    };
    Ok(json!({
        "criteria_met": total, "severity": severity,
        "band": { "min": lo, "max": hi, "label": label }, "missing_count": missing
    }))
}

scorer_abi::scorer!(score_nods);

#[cfg(test)]
mod tests {
    use super::*;
    fn inp(yes_items: &[usize]) -> Value {
        let mut o = serde_json::Map::new();
        for i in 1..=17 { o.insert(format!("pr_nodscl_{i}"), json!(if yes_items.contains(&i) {1} else {0})); }
        json!({ "scored_responses": o })
    }
    #[test]
    fn pathological_all() {
        let out = score_nods(&inp(&(1..=17).collect::<Vec<_>>())).unwrap();
        assert_eq!(out["criteria_met"], json!(10));
        assert_eq!(out["severity"], json!("pathological"));
    }
    #[test]
    fn or_collapse_counts_once() {
        // items 14,15,16 all yes -> the "risked relationships" criterion counts ONCE
        let out = score_nods(&inp(&[14, 15, 16])).unwrap();
        assert_eq!(out["criteria_met"], json!(1));
        assert_eq!(out["severity"], json!("at_risk"));
    }
    #[test]
    fn problem_band() {
        let out = score_nods(&inp(&[1, 3, 12, 17])).unwrap();   // 4 distinct criteria
        assert_eq!(out["criteria_met"], json!(4));
        assert_eq!(out["severity"], json!("problem"));
    }
    #[test]
    fn rejects_oob() { assert!(score_nods(&json!({"scored_responses":{"pr_nodscl_1":2}})).is_err()); }
}
