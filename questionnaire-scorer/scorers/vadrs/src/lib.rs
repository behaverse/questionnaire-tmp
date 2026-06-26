// Vanderbilt ADHD Diagnostic Parent Rating Scale (Wolraich et al.). Items 1-9 = Inattention,
// 10-18 = Hyperactivity/Impulsivity (each 0-3); a symptom "counts" when rated 2 or 3. ADHD criteria
// need >=6 counted symptoms in a domain PLUS performance impairment. Performance items 48-55 (1-5,
// 4/5 = a problem); impairment = any item == 5 OR at least two items >= 4. These count/threshold
// rules cannot be expressed by the generic sum/mean engine.
use serde_json::{json, Value};

fn get(sr: &serde_json::Map<String, Value>, key: &str, max: i64) -> Result<Option<i64>, String> {
    match sr.get(key) {
        None | Some(Value::Null) => Ok(None),
        Some(v) => {
            let n = v.as_i64().ok_or_else(|| format!("{key}: not an integer"))?;
            if n < 0 || n > max { return Err(format!("{key}: out of range 0..{max}")); }
            Ok(Some(n))
        }
    }
}

pub fn score_vadrs(input: &Value) -> Result<Value, String> {
    let sr = input.get("scored_responses").and_then(|v| v.as_object())
        .ok_or_else(|| "missing scored_responses object".to_string())?;
    let mut missing = 0i64;
    // symptom domains: count items rated >= 2; total ADHD score = sum of items 1-18
    let count = |lo: usize, hi: usize, missing: &mut i64| -> Result<(i64, i64), String> {
        let (mut cnt, mut sum) = (0i64, 0i64);
        for i in lo..=hi {
            match get(sr, &format!("pr_vadrs_{i}"), 3)? {
                Some(n) => { sum += n; if n >= 2 { cnt += 1; } }
                None => *missing += 1,
            }
        }
        Ok((cnt, sum))
    };
    let (inatt, inatt_sum) = count(1, 9, &mut missing)?;
    let (hyper, hyper_sum) = count(10, 18, &mut missing)?;
    // performance impairment: items 48-55 (1-5); any == 5, or >= two items >= 4
    let (mut perf_five, mut perf_four) = (0i64, 0i64);
    for i in 48..=55 {
        if let Some(n) = get(sr, &format!("pr_vadrs_{i}"), 5)? {
            if n == 5 { perf_five += 1; }
            if n >= 4 { perf_four += 1; }
        }
    }
    let impaired = perf_five >= 1 || perf_four >= 2;
    let positive = (inatt >= 6 || hyper >= 6) && impaired;
    Ok(json!({
        "inattention_symptoms": inatt,
        "hyperactivity_symptoms": hyper,
        "total_adhd_score": inatt_sum + hyper_sum,
        "performance_impairment": if impaired { "yes" } else { "no" },
        "screen": if positive { "positive" } else { "negative" },
        "missing_count": missing
    }))
}

scorer_abi::scorer!(score_vadrs);

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn positive_screen() {
        let mut o = serde_json::Map::new();
        for i in 1..=18 { o.insert(format!("pr_vadrs_{i}"), json!(3)); }   // all 18 symptoms present
        for i in 48..=55 { o.insert(format!("pr_vadrs_{i}"), json!(5)); }  // performance impaired
        let out = score_vadrs(&json!({"scored_responses":o})).unwrap();
        assert_eq!(out["inattention_symptoms"], json!(9));
        assert_eq!(out["hyperactivity_symptoms"], json!(9));
        assert_eq!(out["total_adhd_score"], json!(54));
        assert_eq!(out["screen"], json!("positive"));
    }
    #[test]
    fn subthreshold_without_impairment() {
        let mut o = serde_json::Map::new();
        for i in 1..=9 { o.insert(format!("pr_vadrs_{i}"), json!(3)); }    // 9 inattention symptoms
        for i in 48..=55 { o.insert(format!("pr_vadrs_{i}"), json!(2)); }  // no impairment
        let out = score_vadrs(&json!({"scored_responses":o})).unwrap();
        assert_eq!(out["inattention_symptoms"], json!(9));
        assert_eq!(out["screen"], json!("negative"));
    }
    #[test]
    fn rejects_oob() {
        assert!(score_vadrs(&json!({"scored_responses":{"pr_vadrs_1":4}})).is_err());
    }
}
