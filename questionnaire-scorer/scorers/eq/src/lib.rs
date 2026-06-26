// Empathy Quotient (Baron-Cohen & Wheelwright, 2004), 40 scored items. Each item scores 2/1/0:
// on AGREE-keyed items, "strongly agree"=2, "slightly agree"=1, either disagree=0; on DISAGREE-keyed
// items, "strongly disagree"=2, "slightly disagree"=1, either agree=0. Options: 1=Strongly agree,
// 2=Slightly agree, 3=Slightly disagree, 4=Strongly disagree. Total 0-80; higher = more empathy.
// The per-item directional 2/1/0 mapping cannot be expressed by the generic sum/mean engine.
// Item-direction key derived from the harvested item texts, cross-checked against the published key
// (21 agree-keyed + 19 disagree-keyed, matching Baron-Cohen & Wheelwright 2004).
use serde_json::{json, Value};

const AGREE: [u8; 21] = [1, 3, 11, 13, 14, 15, 21, 22, 23, 24, 26, 27, 28, 29, 34, 35, 36, 37, 38, 39, 40];
const DISAGREE: [u8; 19] = [2, 4, 5, 6, 7, 8, 9, 10, 12, 16, 17, 18, 19, 20, 25, 30, 31, 32, 33];

pub fn score_eq(input: &Value) -> Result<Value, String> {
    let sr = input.get("scored_responses").and_then(|v| v.as_object())
        .ok_or_else(|| "missing scored_responses object".to_string())?;
    let mut total = 0i64;
    let mut missing = 0i64;
    let mut tally = |n: u8, agree: bool| -> Result<(), String> {
        let key = format!("pr_eq_{n}");
        match sr.get(&key) {
            None | Some(Value::Null) => { missing += 1; Ok(()) }
            Some(v) => {
                let x = v.as_i64().ok_or_else(|| format!("{key}: not an integer"))?;
                if !(1..=4).contains(&x) { return Err(format!("{key}: out of range 1..4")); }
                // agree-keyed: 1->2, 2->1, else 0;  disagree-keyed: 4->2, 3->1, else 0
                total += if agree { match x { 1 => 2, 2 => 1, _ => 0 } }
                         else      { match x { 4 => 2, 3 => 1, _ => 0 } };
                Ok(())
            }
        }
    };
    for n in AGREE { tally(n, true)?; }
    for n in DISAGREE { tally(n, false)?; }
    Ok(json!({ "total": total, "missing_count": missing }))
}

scorer_abi::scorer!(score_eq);

#[cfg(test)]
mod tests {
    use super::*;
    fn all(v: i64) -> Value {
        let mut o = serde_json::Map::new();
        for i in 1..=40 { o.insert(format!("pr_eq_{i}"), json!(v)); }
        json!({ "scored_responses": o })
    }
    #[test]
    fn max_empathy() {
        // agree items strongly-agree(1)=2, disagree items strongly-disagree(4)=2 -> need mixed input
        let mut o = serde_json::Map::new();
        for n in AGREE { o.insert(format!("pr_eq_{n}"), json!(1)); }
        for n in DISAGREE { o.insert(format!("pr_eq_{n}"), json!(4)); }
        assert_eq!(score_eq(&json!({"scored_responses":o})).unwrap()["total"], json!(80));
    }
    #[test]
    fn slight_empathy_everywhere() {
        // agree items slightly-agree(2)=1, disagree items slightly-disagree(3)=1 -> 40
        let mut o = serde_json::Map::new();
        for n in AGREE { o.insert(format!("pr_eq_{n}"), json!(2)); }
        for n in DISAGREE { o.insert(format!("pr_eq_{n}"), json!(3)); }
        assert_eq!(score_eq(&json!({"scored_responses":o})).unwrap()["total"], json!(40));
    }
    #[test]
    fn zero_when_all_anti_empathy() {
        let mut o = serde_json::Map::new();
        for n in AGREE { o.insert(format!("pr_eq_{n}"), json!(4)); }
        for n in DISAGREE { o.insert(format!("pr_eq_{n}"), json!(1)); }
        assert_eq!(score_eq(&json!({"scored_responses":o})).unwrap()["total"], json!(0));
    }
    #[test]
    fn rejects_oob() { assert!(score_eq(&all(5)).is_err()); }
}
