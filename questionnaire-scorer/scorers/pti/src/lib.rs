// Personality Type Indicator — the classic 70-item Myers-Briggs-style forced-choice sorter
// (Humanmetrics/Keirsey grid). Items are laid out in 10 rows of 7: position 1 -> E/I, positions
// 2-3 -> S/N, 4-5 -> T/F, 6-7 -> J/P. Each item's first option (value 0) favours E/S/T/J and the
// second option (value 1) favours I/N/F/P (verified against the item texts). The 4-letter type is
// the majority pole on each dimension. This categorical typing cannot be done by the generic engine.
use serde_json::{json, Value};

// dimension membership generated from the 7-per-row grid (1-based item numbers)
fn dims() -> [(Vec<usize>, [char; 2]); 4] {
    let (mut ei, mut sn, mut tf, mut jp) = (vec![], vec![], vec![], vec![]);
    for row in 0..10 {
        let b = row * 7;
        ei.push(b + 1);
        sn.push(b + 2); sn.push(b + 3);
        tf.push(b + 4); tf.push(b + 5);
        jp.push(b + 6); jp.push(b + 7);
    }
    [(ei, ['E', 'I']), (sn, ['S', 'N']), (tf, ['T', 'F']), (jp, ['J', 'P'])]
}

pub fn score_pti(input: &Value) -> Result<Value, String> {
    let sr = input.get("scored_responses").and_then(|v| v.as_object())
        .ok_or_else(|| "missing scored_responses object".to_string())?;
    let mut type_str = String::new();
    let mut missing = 0i64;
    for (items, poles) in dims() {
        let (mut first, mut second) = (0i64, 0i64);
        for n in items {
            match sr.get(&format!("pr_pti_{n}")) {
                None | Some(Value::Null) => missing += 1,
                Some(v) => {
                    let x = v.as_i64().ok_or_else(|| format!("pr_pti_{n}: not an integer"))?;
                    match x { 0 => first += 1, 1 => second += 1, _ => return Err(format!("pr_pti_{n}: out of range 0..1")) }
                }
            }
        }
        type_str.push(if first > second { poles[0] } else { poles[1] });
    }
    Ok(json!({ "type": type_str, "missing_count": missing }))
}

scorer_abi::scorer!(score_pti);

#[cfg(test)]
mod tests {
    use super::*;
    fn all(v: i64) -> Value {
        let mut o = serde_json::Map::new();
        for i in 1..=70 { o.insert(format!("pr_pti_{i}"), json!(v)); }
        json!({ "scored_responses": o })
    }
    #[test]
    fn all_first_pole_is_estj() { assert_eq!(score_pti(&all(0)).unwrap()["type"], json!("ESTJ")); }
    #[test]
    fn all_second_pole_is_infp() { assert_eq!(score_pti(&all(1)).unwrap()["type"], json!("INFP")); }
    #[test]
    fn rejects_oob() { assert!(score_pti(&all(2)).is_err()); }
}
