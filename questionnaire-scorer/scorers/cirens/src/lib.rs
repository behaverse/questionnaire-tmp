// Circadian Energy Scale (Ottoni et al., 2011). Chronotype = evening energy minus morning energy
// (each item 1-5), range -4..+4: <= -2 morning type, -1..1 neither, >= 2 evening type. A difference
// of two specific items cannot be expressed by the generic sum/mean engine.
use serde_json::{json, Value};

fn item(sr: &serde_json::Map<String, Value>, key: &str) -> Result<i64, String> {
    let v = sr.get(key).ok_or_else(|| format!("missing {key}"))?;
    let n = v.as_i64().ok_or_else(|| format!("{key}: not an integer"))?;
    if !(1..=5).contains(&n) { return Err(format!("{key}: out of range 1..5")); }
    Ok(n)
}

pub fn score_cirens(input: &Value) -> Result<Value, String> {
    let sr = input.get("scored_responses").and_then(|v| v.as_object())
        .ok_or_else(|| "missing scored_responses object".to_string())?;
    let morning = item(sr, "pr_cirens_1")?;
    let evening = item(sr, "pr_cirens_2")?;
    let chronotype = evening - morning;
    let (t, label) = if chronotype <= -2 { ("morning", "Morning type") }
        else if chronotype >= 2 { ("evening", "Evening type") }
        else { ("neither", "Neither type") };
    Ok(json!({ "chronotype": chronotype, "type": t, "label": label }))
}

scorer_abi::scorer!(score_cirens);

#[cfg(test)]
mod tests {
    use super::*;
    fn inp(m: i64, e: i64) -> Value { json!({ "scored_responses": { "pr_cirens_1": m, "pr_cirens_2": e } }) }
    #[test]
    fn morning_type() { let o = score_cirens(&inp(5, 1)).unwrap(); assert_eq!(o["chronotype"], json!(-4)); assert_eq!(o["type"], json!("morning")); }
    #[test]
    fn evening_type() { assert_eq!(score_cirens(&inp(1, 5)).unwrap()["type"], json!("evening")); }
    #[test]
    fn neither_type() { assert_eq!(score_cirens(&inp(3, 3)).unwrap()["type"], json!("neither")); }
    #[test]
    fn rejects_oob() { assert!(score_cirens(&inp(6, 1)).is_err()); }
}
