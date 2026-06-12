use crate::ast::{BinOp, Expr, UnOp};
use crate::value::Value;

pub trait Bindings {
    fn var(&self, id: &str) -> Value;   // bare identifier (host may fall through answers → scores, F1)
    fn score(&self, id: &str) -> Value; // explicit score('id')
}

pub fn eval_expr(e: &Expr, b: &dyn Bindings) -> Value {
    match e {
        Expr::Num(n) => Value::Number(*n),
        Expr::Str(s) => Value::Str(s.clone()),
        Expr::Bool(x) => Value::Bool(*x),
        Expr::Null => Value::Null,
        Expr::List(items) => Value::List(items.iter().map(|i| eval_expr(i, b)).collect()),
        Expr::Ident(id) => b.var(id),
        Expr::Unary(op, inner) => eval_unary(op, eval_expr(inner, b)),
        Expr::Call(name, args) => call(name, args, b),
        Expr::Binary(op, l, r) => eval_binary(op, l, r, b),
    }
}

fn eval_unary(op: &UnOp, v: Value) -> Value {
    match (op, v) {
        (UnOp::Not, Value::Bool(b)) => Value::Bool(!b),
        (UnOp::Neg, Value::Number(n)) => Value::Number(-n),
        _ => Value::Null,
    }
}

fn num(v: &Value) -> Option<f64> { if let Value::Number(n) = v { Some(*n) } else { None } }
fn finite(n: f64) -> Value { if n.is_finite() { Value::Number(n) } else { Value::Null } }

fn eval_binary(op: &BinOp, l: &Expr, r: &Expr, b: &dyn Bindings) -> Value {
    match op {
        BinOp::And => {
            return match eval_expr(l, b).truthy() {
                Some(false) => Value::Bool(false),
                Some(true) => match eval_expr(r, b).truthy() { Some(rb) => Value::Bool(rb), None => Value::Null },
                None => Value::Null,
            };
        }
        BinOp::Or => {
            return match eval_expr(l, b).truthy() {
                Some(true) => Value::Bool(true),
                Some(false) => match eval_expr(r, b).truthy() { Some(rb) => Value::Bool(rb), None => Value::Null },
                None => Value::Null,
            };
        }
        _ => {}
    }
    let lv = eval_expr(l, b);
    let rv = eval_expr(r, b);
    match op {
        BinOp::Eq => Value::Bool(lv.eq_value(&rv)),
        BinOp::Ne => Value::Bool(!lv.eq_value(&rv)),
        BinOp::Lt | BinOp::Le | BinOp::Gt | BinOp::Ge => order_compare(op, &lv, &rv),
        BinOp::In => match rv { Value::List(items) => Value::Bool(items.iter().any(|x| x.eq_value(&lv))), _ => Value::Null },
        BinOp::Add => match (num(&lv), num(&rv)) { (Some(a), Some(c)) => finite(a + c), _ => Value::Null },
        BinOp::Sub => match (num(&lv), num(&rv)) { (Some(a), Some(c)) => finite(a - c), _ => Value::Null },
        BinOp::Mul => match (num(&lv), num(&rv)) { (Some(a), Some(c)) => finite(a * c), _ => Value::Null },
        BinOp::Div => match (num(&lv), num(&rv)) { (Some(a), Some(c)) if c != 0.0 => finite(a / c), _ => Value::Null },
        BinOp::Mod => match (num(&lv), num(&rv)) { (Some(a), Some(c)) if c != 0.0 => finite(a % c), _ => Value::Null },
        BinOp::And | BinOp::Or => unreachable!(),
    }
}

fn order_compare(op: &BinOp, l: &Value, r: &Value) -> Value {
    use std::cmp::Ordering;
    let ord = match (l, r) {
        (Value::Number(a), Value::Number(b)) => a.partial_cmp(b),
        (Value::Str(a), Value::Str(b)) => Some(a.cmp(b)),
        _ => None,
    };
    match ord {
        None => Value::Null,
        Some(o) => Value::Bool(match op {
            BinOp::Lt => o == Ordering::Less,
            BinOp::Le => o != Ordering::Greater,
            BinOp::Gt => o == Ordering::Greater,
            BinOp::Ge => o != Ordering::Less,
            _ => unreachable!(),
        }),
    }
}

pub(crate) fn call(name: &str, args: &[Expr], b: &dyn Bindings) -> Value {
    match name {
        "score" => {
            match args.first() {
                Some(Expr::Str(s)) => b.score(s),
                Some(Expr::Ident(id)) => b.score(id),
                _ => Value::Null,
            }
        }
        "length" => match eval_arg(args, 0, b) {
            Value::Str(s) => Value::Number(s.chars().count() as f64),
            Value::List(l) => Value::Number(l.len() as f64),
            _ => Value::Null,
        },
        "is_empty" => match args.len() { 1 => Value::Bool(eval_arg(args, 0, b).is_empty_value()), _ => Value::Null },
        "not_empty" => match args.len() { 1 => Value::Bool(!eval_arg(args, 0, b).is_empty_value()), _ => Value::Null },
        "count" => match eval_arg(args, 0, b) {
            Value::List(l) => Value::Number(l.len() as f64),
            Value::Null => Value::Number(0.0),
            _ => Value::Number(1.0),
        },
        "contains" => {
            if args.len() != 2 { return Value::Null; }
            let hay = eval_arg(args, 0, b);
            let needle = eval_arg(args, 1, b);
            match (hay, needle) {
                (Value::Str(h), Value::Str(n)) => Value::Bool(h.contains(&n)),
                (Value::List(items), n) => Value::Bool(items.iter().any(|x| x.eq_value(&n))),
                _ => Value::Null,
            }
        }
        _ => Value::Null,
    }
}

fn eval_arg(args: &[Expr], i: usize, b: &dyn Bindings) -> Value {
    match args.get(i) { Some(e) => eval_expr(e, b), None => Value::Null }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::value::Value;
    use std::collections::HashMap;

    pub(super) struct Env { pub vars: HashMap<String, Value>, pub scores: HashMap<String, Value> }
    impl Bindings for Env {
        fn var(&self, id: &str) -> Value {
            self.vars.get(id).or_else(|| self.scores.get(id)).cloned().unwrap_or(Value::Null)
        }
        fn score(&self, id: &str) -> Value { self.scores.get(id).cloned().unwrap_or(Value::Null) }
    }
    pub(super) fn env(vars: &[(&str, Value)], scores: &[(&str, Value)]) -> Env {
        Env { vars: vars.iter().map(|(k,v)|(k.to_string(),v.clone())).collect(),
              scores: scores.iter().map(|(k,v)|(k.to_string(),v.clone())).collect() }
    }
    pub(super) fn ev(src: &str, e: &Env) -> Value { eval_expr(&crate::parser::parse(src).unwrap(), e) }

    #[test]
    fn arithmetic_and_comparison() {
        let e = env(&[], &[]);
        assert!(matches!(ev("1 + 2 * 3", &e), Value::Number(n) if n == 7.0));
        assert!(matches!(ev("(1 + 2) * 3", &e), Value::Number(n) if n == 9.0));
        assert!(matches!(ev("10 >= 10", &e), Value::Bool(true)));
        assert!(matches!(ev("5 / 0", &e), Value::Null));
        assert!(matches!(ev("5 % 0", &e), Value::Null));
    }
    #[test]
    fn logic_short_circuit_and_type_errors() {
        let e = env(&[], &[]);
        assert!(matches!(ev("true && false", &e), Value::Bool(false)));
        assert!(matches!(ev("false && (1/0 == 0)", &e), Value::Bool(false)));
        assert!(matches!(ev("1 && true", &e), Value::Null));
        assert!(matches!(ev("!true", &e), Value::Bool(false)));
    }
    #[test]
    fn equality_total_ordering_typed() {
        let e = env(&[("it_year_born", Value::Str("".into()))], &[]);
        assert!(matches!(ev("it_year_born == ''", &e), Value::Bool(true)));
        assert!(matches!(ev("1 == '1'", &e), Value::Bool(false)));
        assert!(matches!(ev("'a' < 'b'", &e), Value::Bool(true)));
        assert!(matches!(ev("1 < 'a'", &e), Value::Null));
    }
    #[test]
    fn vars_scores_membership() {
        let e = env(&[("it_mood", Value::Number(20.0))], &[("phq9_total", Value::Number(12.0))]);
        assert!(matches!(ev("it_mood < 30", &e), Value::Bool(true)));
        assert!(matches!(ev("phq9_total >= 10", &e), Value::Bool(true)));
        assert!(matches!(ev("unbound_thing", &e), Value::Null));
        assert!(matches!(ev("2 in [1, 2, 3]", &e), Value::Bool(true)));
        assert!(matches!(ev("9 in [1, 2, 3]", &e), Value::Bool(false)));
    }
    #[test]
    fn functions() {
        let e = env(&[("s", Value::Str("héllo".into())), ("topics", Value::List(vec![])), ("name", Value::Str("Ada".into()))],
                    &[("sc", Value::Number(7.0))]);
        assert!(matches!(ev("length(s)", &e), Value::Number(n) if n == 5.0));
        assert!(matches!(ev("length(missing)", &e), Value::Null));
        assert!(matches!(ev("is_empty(topics)", &e), Value::Bool(true)));
        assert!(matches!(ev("is_empty(name)", &e), Value::Bool(false)));
        assert!(matches!(ev("not_empty(name)", &e), Value::Bool(true)));
        assert!(matches!(ev("count(topics)", &e), Value::Number(n) if n == 0.0));
        assert!(matches!(ev("count(name)", &e), Value::Number(n) if n == 1.0));
        assert!(matches!(ev("contains('abcd', 'bc')", &e), Value::Bool(true)));
        assert!(matches!(ev("contains([1, 2], 2)", &e), Value::Bool(true)));
        assert!(matches!(ev("score('sc')", &e), Value::Number(n) if n == 7.0));
        assert!(matches!(ev("score(sc)", &e), Value::Number(n) if n == 7.0));
        assert!(matches!(ev("unknown_fn(1)", &e), Value::Null));
    }
    #[test]
    fn canonical_validation_expression() {
        let e = env(&[("it_name", Value::Str("Ada".into())), ("it_topics", Value::List(vec![]))], &[]);
        assert!(matches!(ev("length(it_name) > 0 && is_empty(it_topics)", &e), Value::Bool(true)));
    }
    #[test]
    fn explicit_score_form() {
        let e = env(&[], &[("phq9_total", Value::Number(12.0))]);
        assert!(matches!(ev("score('phq9_total') >= 10", &e), Value::Bool(true)));
    }
}
