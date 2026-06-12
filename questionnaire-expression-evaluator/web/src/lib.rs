use questionnaire_expr_core::{compile, condition, compare_solution, reversed_value, Bindings, Comparator, Value};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

#[wasm_bindgen]
extern "C" {
    pub type JsBindings;
    #[wasm_bindgen(method)]
    fn var(this: &JsBindings, id: &str) -> JsValue;
    #[wasm_bindgen(method)]
    fn score(this: &JsBindings, id: &str) -> JsValue;
}

struct JsEnv<'a> { inner: &'a JsBindings }
impl<'a> Bindings for JsEnv<'a> {
    fn var(&self, id: &str) -> Value { js_to_value(self.inner.var(id)) }
    fn score(&self, id: &str) -> Value { js_to_value(self.inner.score(id)) }
}

fn js_to_value(j: JsValue) -> Value {
    if j.is_null() || j.is_undefined() { return Value::Null; }
    if let Some(b) = j.as_bool() { return Value::Bool(b); }
    if let Some(n) = j.as_f64() { return Value::Number(n); }
    if let Some(s) = j.as_string() { return Value::Str(s); }
    if js_sys::Array::is_array(&j) {
        let arr = js_sys::Array::from(&j);
        return Value::List(arr.iter().map(js_to_value).collect());
    }
    Value::Null
}

/// Compile + evaluate a condition. Throws on parse error; non-Bool result → false (sentinel).
#[wasm_bindgen]
pub fn evaluate_condition(expr: &str, bindings: &JsBindings) -> Result<bool, JsValue> {
    let prog = compile(expr).map_err(|e| JsValue::from_str(&format!("parse error at {}: {}", e.offset, e.message)))?;
    Ok(condition(&prog, &JsEnv { inner: bindings }))
}

/// Validate an expression at authoring time (Editor). Returns null on success, message on failure.
#[wasm_bindgen]
pub fn check_expression(expr: &str) -> Option<String> {
    compile(expr).err().map(|e| format!("parse error at {}: {}", e.offset, e.message))
}

#[wasm_bindgen]
pub fn reversed(value: f64, min: f64, max: f64) -> f64 { reversed_value(value, min, max) }

#[wasm_bindgen]
pub fn compare(cmp: &str, response: JsValue, expected: JsValue) -> Result<bool, JsValue> {
    let c = match cmp {
        "equals" => Comparator::Equals, "set_equals" => Comparator::SetEquals,
        "matches_regex" => Comparator::MatchesRegex,
        other => return Err(JsValue::from_str(&format!("unknown comparator: {other}"))),
    };
    Ok(compare_solution(c, &js_to_value(response), &js_to_value(expected)))
}
