// Cooperative/Competitive Strategy Scale (Simmons et al., 1988 / Tang 1999). Cooperation = mean of
// items 1-8 (items 4 and 6 are negatively worded and reverse-scored: 8 - x on the 1-7 scale);
// Competition = mean of items 9-19. The harvested data does not carry reverse flags for items 4/6,
// so the reversal is applied here. Per-item reversal + two means cannot be done by the generic engine.
use serde_json::{json, Value};

fn val(sr: &serde_json::Map<String, Value>, n: usize, rev: bool) -> Result<Option<f64>, String> {
    let key = format!("pr_ccss_{n}");
    match sr.get(&key) {
        None | Some(Value::Null) => Ok(None),
        Some(v) => {
            let x = v.as_f64().filter(|f| f.is_finite()).ok_or_else(|| format!("{key}: not a number"))?;
            if !(1.0..=7.0).contains(&x) { return Err(format!("{key}: out of range 1..7")); }
            Ok(Some(if rev { 8.0 - x } else { x }))
        }
    }
}

fn mean(vals: &[f64]) -> Value {
    if vals.is_empty() { return Value::Null; }
    let m = vals.iter().sum::<f64>() / vals.len() as f64;
    if (m.fract()).abs() < 1e-9 { json!(m as i64) } else { json!(m) }
}

pub fn score_ccss(input: &Value) -> Result<Value, String> {
    let sr = input.get("scored_responses").and_then(|v| v.as_object())
        .ok_or_else(|| "missing scored_responses object".to_string())?;
    let mut missing = 0i64;
    let mut coop = Vec::new();
    for n in 1..=8 {
        match val(sr, n, n == 4 || n == 6)? { Some(v) => coop.push(v), None => missing += 1 }
    }
    let mut comp = Vec::new();
    for n in 9..=19 {
        match val(sr, n, false)? { Some(v) => comp.push(v), None => missing += 1 }
    }
    Ok(json!({ "cooperation": mean(&coop), "competition": mean(&comp), "missing_count": missing }))
}

scorer_abi::scorer!(score_ccss);

#[cfg(test)]
mod tests {
    use super::*;
    fn inp(f: impl Fn(usize)->i64) -> Value {
        let mut o = serde_json::Map::new();
        for i in 1..=19 { o.insert(format!("pr_ccss_{i}"), json!(f(i))); }
        json!({ "scored_responses": o })
    }
    #[test]
    fn reverses_items_4_and_6() {
        // all 7s: coop items 1,2,3,5,7,8 = 7; items 4,6 reversed -> 1; mean = (7*6+1*2)/8 = 5.5
        let out = score_ccss(&inp(|_| 7)).unwrap();
        assert_eq!(out["cooperation"], json!(5.5));
        assert_eq!(out["competition"], json!(7)); // items 9-19 all 7
    }
    #[test]
    fn uniform_midpoint() {
        let out = score_ccss(&inp(|_| 4)).unwrap();
        assert_eq!(out["cooperation"], json!(4)); // 4 reversed = 4
        assert_eq!(out["competition"], json!(4));
    }
    #[test]
    fn rejects_oob() { assert!(score_ccss(&inp(|i| if i==1 {8} else {4})).is_err()); }
}
