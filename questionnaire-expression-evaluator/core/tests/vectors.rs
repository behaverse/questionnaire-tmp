use questionnaire_expr_core::{compile, condition, compare_solution, reversed_value, Bindings, Comparator, Value};
use serde_json::Value as J;
use std::collections::HashMap;

fn to_value(j: &J) -> Value {
    match j {
        J::Null => Value::Null,
        J::Bool(b) => Value::Bool(*b),
        J::Number(n) => Value::Number(n.as_f64().unwrap()),
        J::String(s) => Value::Str(s.clone()),
        J::Array(a) => Value::List(a.iter().map(to_value).collect()),
        J::Object(_) => Value::Null,
    }
}

struct Env { vars: HashMap<String, Value>, scores: HashMap<String, Value> }
impl Bindings for Env {
    fn var(&self, id: &str) -> Value {
        self.vars.get(id).or_else(|| self.scores.get(id)).cloned().unwrap_or(Value::Null)
    }
    fn score(&self, id: &str) -> Value { self.scores.get(id).cloned().unwrap_or(Value::Null) }
}

fn map(j: &J) -> HashMap<String, Value> {
    j.as_object().unwrap().iter().map(|(k, v)| (k.clone(), to_value(v))).collect()
}

#[test]
fn normative_vectors() {
    let raw = include_str!("../../test_vectors.json");
    let doc: J = serde_json::from_str(raw).unwrap();

    for c in doc["conditions"].as_array().unwrap() {
        let expr = c["expr"].as_str().unwrap();
        let env = Env { vars: map(&c["vars"]), scores: map(&c["scores"]) };
        let prog = compile(expr).unwrap_or_else(|e| panic!("compile {expr}: {e:?}"));
        assert_eq!(condition(&prog, &env), c["expect"].as_bool().unwrap(), "condition: {expr}");
    }
    for c in doc["reversed_value"].as_array().unwrap() {
        let got = reversed_value(c["value"].as_f64().unwrap(), c["min"].as_f64().unwrap(), c["max"].as_f64().unwrap());
        assert_eq!(got, c["expect"].as_f64().unwrap(), "reversed_value");
    }
    for c in doc["compare_solution"].as_array().unwrap() {
        let cmp = match c["cmp"].as_str().unwrap() {
            "equals" => Comparator::Equals, "set_equals" => Comparator::SetEquals,
            "matches_regex" => Comparator::MatchesRegex, other => panic!("bad cmp {other}"),
        };
        let got = compare_solution(cmp, &to_value(&c["response"]), &to_value(&c["expected"]));
        assert_eq!(got, c["expect"].as_bool().unwrap(), "compare_solution");
    }
}
