mod ast;
mod eval;
mod helpers;
mod lexer;
mod parser;
mod value;

pub use eval::Bindings;
pub use helpers::{compare_solution, reversed_value, Comparator};
pub use lexer::ParseError;
pub use value::Value;

/// A compiled expression program (opaque AST). Compile once, evaluate many.
pub struct Program {
    ast: ast::Expr,
}

const MAX_EXPR_LEN: usize = 1024; // mirrors schema Expression maxLength

pub fn compile(expr: &str) -> Result<Program, ParseError> {
    if expr.chars().count() > MAX_EXPR_LEN {
        return Err(ParseError { offset: MAX_EXPR_LEN, message: "expression exceeds 1024 chars".into() });
    }
    Ok(Program { ast: parser::parse(expr)? })
}

pub fn evaluate(program: &Program, bindings: &dyn Bindings) -> Value {
    eval::eval_expr(&program.ast, bindings)
}

/// Hot path for branching/visibility/validation: non-Bool (incl. Null/type-error) → false (OD-16 sentinel).
pub fn condition(program: &Program, bindings: &dyn Bindings) -> bool {
    matches!(evaluate(program, bindings), Value::Bool(true))
}

#[cfg(test)]
mod api_tests {
    use super::*;
    use std::collections::HashMap;
    struct Env(HashMap<String, Value>);
    impl Bindings for Env {
        fn var(&self, id: &str) -> Value { self.0.get(id).cloned().unwrap_or(Value::Null) }
        fn score(&self, id: &str) -> Value { self.0.get(id).cloned().unwrap_or(Value::Null) }
    }
    #[test]
    fn compile_evaluate_condition() {
        let p = compile("a >= 10").unwrap();
        let mut m = HashMap::new(); m.insert("a".into(), Value::Number(12.0));
        assert!(condition(&p, &Env(m)));
    }
    #[test]
    fn condition_false_on_null_and_nonbool() {
        let p = compile("missing").unwrap();
        assert!(!condition(&p, &Env(HashMap::new())));
        let p2 = compile("1 + 1").unwrap();
        assert!(!condition(&p2, &Env(HashMap::new())));
    }
    #[test]
    fn length_cap_and_parse_errors_are_errors() {
        assert!(compile(&"a".repeat(1025)).is_err());
        assert!(compile("1 +").is_err());
    }
}
