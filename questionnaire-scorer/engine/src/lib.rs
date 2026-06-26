//! Data-driven scoring engine for sum / mean / subscale + severity-band instruments.
//!
//! A generated per-instrument scorer crate embeds a declarative spec (JSON) and calls
//! [`score`]; the engine parses the spec and computes the result envelope's `output`.
//! Reverse-keyed items are NOT handled here — the host applies reversal before calling the
//! scorer (OD-16), so `scored_responses` already carry final per-item values.
//!
//! Spec shape (see SPEC.md):
//! ```json
//! {
//!   "item_range": [0, 3],
//!   "scores": [
//!     { "key": "total", "items": ["pr_gad7_1", "..."], "aggregate": "sum",
//!       "transform": { "mul": 1, "add": 0 },
//!       "bands": [{ "min": 0, "max": 4, "severity": "minimal", "label": "Minimal anxiety" }] }
//!   ]
//! }
//! ```
//! Output: `{ "scores": { "<key>": { "value": N[, "severity", "band"] } }, "missing_count": M }`.

use serde::Deserialize;
use serde_json::{json, Map, Value};

#[derive(Deserialize)]
pub struct Spec {
    /// inclusive [min, max] valid range for each per-item scored value (optional validation)
    pub item_range: Option<[i64; 2]>,
    pub scores: Vec<ScoreDef>,
}

#[derive(Deserialize)]
pub struct ScoreDef {
    pub key: String,
    pub items: Vec<String>,
    #[serde(default)]
    pub aggregate: Aggregate,
    pub transform: Option<Transform>,
    #[serde(default)]
    pub bands: Vec<Band>,
}

#[derive(Deserialize, Default, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Aggregate {
    #[default]
    Sum,
    Mean,
}

#[derive(Deserialize)]
pub struct Transform {
    #[serde(default = "one")]
    pub mul: f64,
    #[serde(default)]
    pub add: f64,
}
fn one() -> f64 {
    1.0
}

#[derive(Deserialize)]
pub struct Band {
    pub min: f64,
    pub max: f64,
    pub severity: String,
    pub label: String,
}

/// Convert a finite f64 to a JSON number, emitting an integer when the value is integral
/// (so `12.0` serializes as `12`, matching authored test vectors).
fn num(v: f64) -> Value {
    if v.is_finite() && v.fract() == 0.0 && v.abs() < 9e15 {
        json!(v as i64)
    } else {
        json!(v)
    }
}

/// Score `input` (an ABI input value, `{ "scored_responses": { id: int } }`) against `spec_json`.
/// Returns the `output` value (the caller wraps it as `{ ok: true, output }`), or `Err` for
/// malformed input (the caller wraps as `{ ok: false, error }`). Never panics on bad input.
pub fn score(spec_json: &str, input: &Value) -> Result<Value, String> {
    let spec: Spec = serde_json::from_str(spec_json).map_err(|e| format!("bad scorer spec: {e}"))?;
    let sr = input
        .get("scored_responses")
        .and_then(|v| v.as_object())
        .ok_or_else(|| "missing scored_responses object".to_string())?;

    let mut scores = Map::new();
    for sd in &spec.scores {
        let mut sum = 0f64;
        let mut present = 0i64;
        for item in &sd.items {
            match sr.get(item) {
                None | Some(Value::Null) => {}
                Some(v) => {
                    // accept any finite number (option values are stored as 5.0; a few scales such
                    // as the calibrated happiness item carry genuinely fractional values).
                    let n = v
                        .as_f64()
                        .filter(|f| f.is_finite())
                        .ok_or_else(|| format!("{item}: not a number"))?;
                    if let Some([lo, hi]) = spec.item_range {
                        if n < lo as f64 || n > hi as f64 {
                            return Err(format!("{item}: out of range {lo}..{hi}"));
                        }
                    }
                    sum += n;
                    present += 1;
                }
            }
        }
        let raw = match sd.aggregate {
            Aggregate::Sum => sum,
            Aggregate::Mean => {
                if present == 0 {
                    0.0
                } else {
                    sum / present as f64
                }
            }
        };
        let value = match &sd.transform {
            Some(t) => raw * t.mul + t.add,
            None => raw,
        };
        let mut obj = Map::new();
        obj.insert("value".into(), num(value));
        if let Some(b) = sd.bands.iter().find(|b| value >= b.min && value <= b.max) {
            obj.insert("severity".into(), json!(b.severity));
            obj.insert(
                "band".into(),
                json!({ "min": num(b.min), "max": num(b.max), "label": b.label }),
            );
        }
        scores.insert(sd.key.clone(), Value::Object(obj));
    }

    // missing_count over the de-duplicated union of all scored items
    let mut seen = std::collections::BTreeSet::new();
    let mut missing = 0i64;
    for sd in &spec.scores {
        for item in &sd.items {
            if seen.insert(item) {
                match sr.get(item) {
                    None | Some(Value::Null) => missing += 1,
                    _ => {}
                }
            }
        }
    }

    Ok(json!({ "scores": Value::Object(scores), "missing_count": missing }))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn input(pairs: &[(&str, i64)]) -> Value {
        let mut o = Map::new();
        for (k, v) in pairs {
            o.insert((*k).into(), json!(v));
        }
        json!({ "scored_responses": o })
    }

    const GAD7: &str = r#"{
      "item_range": [0,3],
      "scores": [{ "key": "total",
        "items": ["q1","q2","q3","q4","q5","q6","q7"],
        "bands": [
          {"min":0,"max":4,"severity":"minimal","label":"Minimal anxiety"},
          {"min":5,"max":9,"severity":"mild","label":"Mild anxiety"},
          {"min":10,"max":14,"severity":"moderate","label":"Moderate anxiety"},
          {"min":15,"max":21,"severity":"severe","label":"Severe anxiety"}
        ] }]
    }"#;

    #[test]
    fn sum_and_band() {
        let out = score(GAD7, &input(&[("q1", 2), ("q2", 2), ("q3", 2), ("q4", 2),
                                       ("q5", 1), ("q6", 1), ("q7", 1)])).unwrap();
        assert_eq!(out["scores"]["total"]["value"], json!(11));
        assert_eq!(out["scores"]["total"]["severity"], json!("moderate"));
        assert_eq!(out["scores"]["total"]["band"]["label"], json!("Moderate anxiety"));
        assert_eq!(out["missing_count"], json!(0));
    }

    #[test]
    fn missing_counted_and_ignored_unknown() {
        let out = score(GAD7, &input(&[("q1", 3), ("q2", 3), ("bogus", 9)])).unwrap();
        assert_eq!(out["scores"]["total"]["value"], json!(6));
        assert_eq!(out["scores"]["total"]["severity"], json!("mild"));
        assert_eq!(out["missing_count"], json!(5));
    }

    #[test]
    fn integral_value_serializes_as_integer() {
        let out = score(GAD7, &input(&[("q1", 0), ("q2", 0), ("q3", 0), ("q4", 0),
                                       ("q5", 0), ("q6", 0), ("q7", 0)])).unwrap();
        assert_eq!(out["scores"]["total"]["value"], json!(0));
        assert!(out["scores"]["total"]["value"].is_i64());
        assert_eq!(out["scores"]["total"]["severity"], json!("minimal"));
    }

    #[test]
    fn rejects_out_of_range() {
        assert!(score(GAD7, &input(&[("q1", 4)])).is_err());
    }

    #[test]
    fn rejects_missing_scored_responses() {
        assert!(score(GAD7, &json!({})).is_err());
    }

    #[test]
    fn linear_transform_who5() {
        // WHO-5: sum of 5 items (0-5) then x4 -> 0..100 percentage.
        let spec = r#"{ "item_range":[0,5], "scores":[{ "key":"wellbeing",
          "items":["w1","w2","w3","w4","w5"], "transform":{"mul":4},
          "bands":[{"min":0,"max":50,"severity":"low","label":"Poor wellbeing (screen for depression)"},
                   {"min":51,"max":100,"severity":"normal","label":"Normal wellbeing"}] }] }"#;
        let out = score(spec, &input(&[("w1", 5), ("w2", 5), ("w3", 5), ("w4", 5), ("w5", 5)])).unwrap();
        assert_eq!(out["scores"]["wellbeing"]["value"], json!(100));
        assert_eq!(out["scores"]["wellbeing"]["severity"], json!("normal"));
        let out2 = score(spec, &input(&[("w1", 2), ("w2", 2), ("w3", 2), ("w4", 1), ("w5", 1)])).unwrap();
        assert_eq!(out2["scores"]["wellbeing"]["value"], json!(32));
        assert_eq!(out2["scores"]["wellbeing"]["severity"], json!("low"));
    }

    #[test]
    fn mean_aggregate() {
        let spec = r#"{ "scores":[{ "key":"avg","aggregate":"mean","items":["a","b","c","d"] }] }"#;
        let out = score(spec, &input(&[("a", 2), ("b", 4), ("c", 4), ("d", 2)])).unwrap();
        assert_eq!(out["scores"]["avg"]["value"], json!(3));
    }

    #[test]
    fn accepts_fractional_values() {
        // calibrated single-item scales (e.g. happiness) carry genuinely fractional values.
        let spec = r#"{ "scores":[{ "key":"total","items":["h"] }] }"#;
        let out = score(spec, &input_f(&[("h", 3.17)])).unwrap();
        assert_eq!(out["scores"]["total"]["value"], json!(3.17));
    }

    fn input_f(pairs: &[(&str, f64)]) -> Value {
        let mut o = Map::new();
        for (k, v) in pairs {
            o.insert((*k).into(), json!(v));
        }
        json!({ "scored_responses": o })
    }

    #[test]
    fn multi_subscale() {
        // DASS-21 style: three subscales summed then x2.
        let spec = r#"{ "item_range":[0,3], "scores":[
          { "key":"depression","items":["d1","d2"],"transform":{"mul":2} },
          { "key":"anxiety","items":["a1","a2"],"transform":{"mul":2} }
        ] }"#;
        let out = score(spec, &input(&[("d1", 3), ("d2", 3), ("a1", 1), ("a2", 0)])).unwrap();
        assert_eq!(out["scores"]["depression"]["value"], json!(12));
        assert_eq!(out["scores"]["anxiety"]["value"], json!(2));
        assert_eq!(out["missing_count"], json!(0));
    }
}
