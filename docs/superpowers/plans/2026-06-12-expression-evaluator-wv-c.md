# Expression Evaluator (WV-C / OD-11) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the canonical reference expression evaluator (OD-11) — a Rust `core` crate (lexer → recursive-descent parser → deterministic evaluator + the `reversed_value`/`compare_solution` helpers) plus a `wasm-bindgen` Web package — proven cross-build-deterministic by a checked-in `test_vectors.json` run identically on the host and through compiled WASM. Spec: [2026-06-12-expression-evaluator-wv-c-design.md](../specs/2026-06-12-expression-evaluator-wv-c-design.md) (all F1–F5 accepted).

**Architecture:** New top-level Cargo workspace `questionnaire-expression-evaluator/` (sibling of `questionnaire-runtime-denormaliser/`). `core/` is host-agnostic (no wasm/JS types) so Godot/Editor bindings are thin later adds (deferred). `web/` is a `wasm-bindgen` cdylib built with `wasm-pack --target nodejs`, consumed by Web Viewer WV-D. One `Value` lattice (Null/Bool/Number(f64)/Str/List); every failure funnels to `Null` (never panics); `condition()` maps non-`Bool` → `false` (the OD-16 sentinel rule).

**Tech Stack:** Rust stable 1.96.0 (installed, `wasm32-unknown-unknown` target verified), `regex` crate (F4), `wasm-bindgen` + `serde-wasm-bindgen`, `wasm-pack`, vitest (web tests).

**Branch:** create `wv-c-expression-evaluator` from `master` before Task 1; merge `--no-ff` + push at the end (no PRs).

**Conventions (every task):** source `. "$HOME/.cargo/env"` first in any shell using cargo. Run host tests with `cargo test -p questionnaire-expr-core` from `questionnaire-expression-evaluator/`. Commit after each green task. The grammar is the canonical contract — match the spec §2 exactly.

---

## File map

| Path | Responsibility |
|---|---|
| `questionnaire-expression-evaluator/Cargo.toml` | workspace (`members = ["core","web"]`) |
| `…/.gitignore` | `target/`, `web/pkg/`, `web/node_modules/`, `Cargo.lock` (lib workspace) |
| `…/core/Cargo.toml` | crate `questionnaire-expr-core`; dep `regex` |
| `…/core/src/value.rs` | `Value` + equality + truthiness |
| `…/core/src/ast.rs` | `Expr` AST nodes + `Comparator` |
| `…/core/src/lexer.rs` | `Token` + `tokenize` + `ParseError` |
| `…/core/src/parser.rs` | recursive-descent `parse` → `Expr` |
| `…/core/src/eval.rs` | `Bindings` trait + `eval_expr` + operators/functions |
| `…/core/src/helpers.rs` | `reversed_value` + `compare_solution` |
| `…/core/src/lib.rs` | public API: `compile`/`evaluate`/`condition`/re-exports |
| `…/core/tests/vectors.rs` | host-runs `../../test_vectors.json` |
| `…/test_vectors.json` | normative cross-viewer harness |
| `…/web/Cargo.toml` | crate `questionnaire-expr-web`; cdylib; deps core + wasm-bindgen + serde-wasm-bindgen |
| `…/web/src/lib.rs` | `#[wasm_bindgen]` surface + JS bindings shim |
| `…/web/package.json` · `web/tests/vectors.test.ts` · `web/vitest.config.ts` | JS package + vector test |
| `…/README.md` · `…/FOLLOWUPS.md` | docs |
| `design/15_expression_language.md` | normative grammar doc (F5, Task 10) |

---

### Task 1: Workspace scaffold + toolchain

**Files:** create the workspace skeleton.

- [ ] **Step 1: Branch + wasm-pack.** From repo root: `git checkout -b wv-c-expression-evaluator`. Install wasm-pack (prebuilt, no sudo, into `~/.cargo/bin`): `curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh`. Verify: `. "$HOME/.cargo/env" && wasm-pack --version` (any version OK). If the installer fails, fall back to `cargo install wasm-pack --locked` (slower) and report it.
- [ ] **Step 2: Workspace files.** Create `questionnaire-expression-evaluator/Cargo.toml`:

```toml
[workspace]
resolver = "2"
members = ["core", "web"]
```

`questionnaire-expression-evaluator/.gitignore`:

```
target/
web/pkg/
web/node_modules/
Cargo.lock
```

`core/Cargo.toml`:

```toml
[package]
name = "questionnaire-expr-core"
version = "0.1.0"
edition = "2021"

[dependencies]
regex = "1"
```

- [ ] **Step 3: Placeholder lib + smoke.** `core/src/lib.rs`:

```rust
pub fn version() -> &'static str { "0.1.0" }

#[cfg(test)]
mod smoke {
    #[test]
    fn it_builds() { assert_eq!(super::version(), "0.1.0"); }
}
```

- [ ] **Step 4: Verify host + wasm build.** From `questionnaire-expression-evaluator/`:
  - `. "$HOME/.cargo/env" && cargo test -p questionnaire-expr-core` → 1 passed.
  - `cargo build -p questionnaire-expr-core --target wasm32-unknown-unknown` → compiles (regex builds for wasm).
- [ ] **Step 5: Commit.** From repo root: `git add questionnaire-expression-evaluator && git commit -m "feat(expr): cargo workspace scaffold (core crate, regex, wasm32 verified)"` (confirm `git status` shows no `target/`).

---

### Task 2: `Value` type

**Files:** create `core/src/value.rs`; modify `core/src/lib.rs` (add `mod value; pub use value::Value;`).

- [ ] **Step 1: Failing tests** in `value.rs` (`#[cfg(test)]`):

```rust
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn equality_is_total_across_types() {
        assert!(Value::Null.eq_value(&Value::Null));
        assert!(Value::Number(1.0).eq_value(&Value::Number(1.0)));
        assert!(!Value::Number(1.0).eq_value(&Value::Number(2.0)));
        assert!(Value::Str("a".into()).eq_value(&Value::Str("a".into())));
        assert!(!Value::Number(1.0).eq_value(&Value::Str("1".into()))); // cross-type → not equal, not error
        assert!(Value::List(vec![Value::Number(1.0)]).eq_value(&Value::List(vec![Value::Number(1.0)])));
    }
    #[test]
    fn truthiness_only_bool_true() {
        assert_eq!(Value::Bool(true).truthy(), Some(true));
        assert_eq!(Value::Bool(false).truthy(), Some(false));
        assert_eq!(Value::Null.truthy(), None);      // not a bool → type error sentinel
        assert_eq!(Value::Number(1.0).truthy(), None);
    }
}
```

- [ ] **Step 2: Run** `cargo test -p questionnaire-expr-core` → FAIL. **Implement** `value.rs`:

```rust
#[derive(Debug, Clone)]
pub enum Value {
    Null,
    Bool(bool),
    Number(f64),
    Str(String),
    List(Vec<Value>),
}

impl Value {
    /// Total value-equality (cross-type → false, never an error). Used by `==`/`!=`/`in`.
    pub fn eq_value(&self, other: &Value) -> bool {
        match (self, other) {
            (Value::Null, Value::Null) => true,
            (Value::Bool(a), Value::Bool(b)) => a == b,
            (Value::Number(a), Value::Number(b)) => a == b,
            (Value::Str(a), Value::Str(b)) => a == b,
            (Value::List(a), Value::List(b)) =>
                a.len() == b.len() && a.iter().zip(b).all(|(x, y)| x.eq_value(y)),
            _ => false,
        }
    }
    /// Boolean view: Some(b) only for Bool; everything else None (type error → caller funnels to Null/false).
    pub fn truthy(&self) -> Option<bool> {
        match self { Value::Bool(b) => Some(*b), _ => None }
    }
    pub fn is_empty_value(&self) -> bool {
        match self {
            Value::Null => true,
            Value::Str(s) => s.is_empty(),
            Value::List(l) => l.is_empty(),
            _ => false,
        }
    }
}
```

In `lib.rs` add at top: `mod value;` and `pub use value::Value;` (remove the placeholder `version`/`smoke` once real modules exist, or keep `version`).

- [ ] **Step 3:** `cargo test -p questionnaire-expr-core` → PASS. **Commit:** `git commit -am "feat(expr): Value lattice (total equality, bool-only truthiness, emptiness)"`

---

### Task 3: Lexer

**Files:** create `core/src/lexer.rs`; `lib.rs` add `mod lexer;`.

- [ ] **Step 1: Failing tests** in `lexer.rs`:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    fn kinds(src: &str) -> Vec<Token> { tokenize(src).unwrap() }
    #[test]
    fn tokenizes_operators_and_literals() {
        assert_eq!(kinds("a >= 10"), vec![Token::Ident("a".into()), Token::Ge, Token::Number(10.0)]);
        assert_eq!(kinds("x == ''"), vec![Token::Ident("x".into()), Token::EqEq, Token::Str("".into())]);
        assert_eq!(kinds("true && false"), vec![Token::True, Token::AndAnd, Token::False]);
        assert_eq!(kinds("length(s)"), vec![Token::Ident("length".into()), Token::LParen, Token::Ident("s".into()), Token::RParen]);
        assert_eq!(kinds("[1, 2]"), vec![Token::LBracket, Token::Number(1.0), Token::Comma, Token::Number(2.0), Token::RBracket]);
        assert_eq!(kinds("a in b"), vec![Token::Ident("a".into()), Token::In, Token::Ident("b".into())]);
    }
    #[test]
    fn string_escapes() {
        assert_eq!(kinds(r"'a\'b'"), vec![Token::Str("a'b".into())]);
        assert_eq!(kinds(r"'a\\b'"), vec![Token::Str(r"a\b".into())]);
    }
    #[test]
    fn negative_and_decimal_numbers_are_two_tokens_minus_then_number() {
        // unary minus handled by parser; lexer emits Minus then Number
        assert_eq!(kinds("-2.5"), vec![Token::Minus, Token::Number(2.5)]);
    }
    #[test]
    fn errors_on_unterminated_string_and_bad_char() {
        assert!(tokenize("'oops").is_err());
        assert!(tokenize("a @ b").is_err());
    }
}
```

- [ ] **Step 2: Run → FAIL. Implement** `lexer.rs`:

```rust
#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    Number(f64), Str(String), Ident(String),
    True, False, Null, In,
    OrOr, AndAnd, Bang,
    EqEq, NotEq, Lt, Le, Gt, Ge,
    Plus, Minus, Star, Slash, Percent,
    LParen, RParen, LBracket, RBracket, Comma,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ParseError { pub offset: usize, pub message: String }

pub fn tokenize(src: &str) -> Result<Vec<Token>, ParseError> {
    let chars: Vec<char> = src.chars().collect();
    let mut i = 0usize;
    let mut out = Vec::new();
    let err = |offset: usize, m: &str| ParseError { offset, message: m.to_string() };
    while i < chars.len() {
        let c = chars[i];
        if c.is_whitespace() { i += 1; continue; }
        match c {
            '(' => { out.push(Token::LParen); i += 1; }
            ')' => { out.push(Token::RParen); i += 1; }
            '[' => { out.push(Token::LBracket); i += 1; }
            ']' => { out.push(Token::RBracket); i += 1; }
            ',' => { out.push(Token::Comma); i += 1; }
            '+' => { out.push(Token::Plus); i += 1; }
            '-' => { out.push(Token::Minus); i += 1; }
            '*' => { out.push(Token::Star); i += 1; }
            '/' => { out.push(Token::Slash); i += 1; }
            '%' => { out.push(Token::Percent); i += 1; }
            '!' => { if chars.get(i+1) == Some(&'=') { out.push(Token::NotEq); i += 2; } else { out.push(Token::Bang); i += 1; } }
            '=' => { if chars.get(i+1) == Some(&'=') { out.push(Token::EqEq); i += 2; } else { return Err(err(i, "expected '=='")); } }
            '<' => { if chars.get(i+1) == Some(&'=') { out.push(Token::Le); i += 2; } else { out.push(Token::Lt); i += 1; } }
            '>' => { if chars.get(i+1) == Some(&'=') { out.push(Token::Ge); i += 2; } else { out.push(Token::Gt); i += 1; } }
            '&' => { if chars.get(i+1) == Some(&'&') { out.push(Token::AndAnd); i += 2; } else { return Err(err(i, "expected '&&'")); } }
            '|' => { if chars.get(i+1) == Some(&'|') { out.push(Token::OrOr); i += 2; } else { return Err(err(i, "expected '||'")); } }
            '\'' => {
                let start = i; i += 1; let mut s = String::new();
                loop {
                    match chars.get(i) {
                        None => return Err(err(start, "unterminated string")),
                        Some('\'') => { i += 1; break; }
                        Some('\\') => {
                            match chars.get(i+1) {
                                Some('\'') => { s.push('\''); i += 2; }
                                Some('\\') => { s.push('\\'); i += 2; }
                                _ => return Err(err(i, "invalid escape")),
                            }
                        }
                        Some(ch) => { s.push(*ch); i += 1; }
                    }
                }
                out.push(Token::Str(s));
            }
            c if c.is_ascii_digit() => {
                let start = i;
                while i < chars.len() && (chars[i].is_ascii_digit() || chars[i] == '.') { i += 1; }
                let lit: String = chars[start..i].iter().collect();
                let n: f64 = lit.parse().map_err(|_| err(start, "invalid number"))?;
                if !n.is_finite() { return Err(err(start, "non-finite number")); }
                out.push(Token::Number(n));
            }
            c if c == '_' || c.is_ascii_alphabetic() => {
                let start = i;
                while i < chars.len() && (chars[i] == '_' || chars[i].is_ascii_alphanumeric()) { i += 1; }
                let word: String = chars[start..i].iter().collect();
                out.push(match word.as_str() {
                    "true" => Token::True, "false" => Token::False,
                    "null" => Token::Null, "in" => Token::In,
                    _ => Token::Ident(word),
                });
            }
            _ => return Err(err(i, "unexpected character")),
        }
    }
    Ok(out)
}
```

- [ ] **Step 3:** PASS. **Commit:** `git commit -am "feat(expr): lexer (operators, '-string escapes, keywords, errors)"`

---

### Task 4: AST + Parser

**Files:** create `core/src/ast.rs`, `core/src/parser.rs`; `lib.rs` add `mod ast; mod parser;`.

- [ ] **Step 1: AST** `ast.rs` (no test; exercised by parser):

```rust
#[derive(Debug, Clone, PartialEq)]
pub enum Expr {
    Num(f64),
    Str(String),
    Bool(bool),
    Null,
    List(Vec<Expr>),
    Ident(String),
    Call(String, Vec<Expr>),
    Unary(UnOp, Box<Expr>),
    Binary(BinOp, Box<Expr>, Box<Expr>),
}
#[derive(Debug, Clone, PartialEq)]
pub enum UnOp { Not, Neg }
#[derive(Debug, Clone, PartialEq)]
pub enum BinOp { Or, And, Eq, Ne, Lt, Le, Gt, Ge, In, Add, Sub, Mul, Div, Mod }
```

- [ ] **Step 2: Failing tests** `parser.rs`:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::ast::{Expr, BinOp, UnOp};
    fn p(s: &str) -> Expr { parse(s).unwrap() }
    #[test]
    fn precedence_and_over_or_comparison_over_arith() {
        // a || b && c  ==  a || (b && c)
        assert_eq!(p("a || b && c"), Expr::Binary(BinOp::Or, Box::new(Expr::Ident("a".into())),
            Box::new(Expr::Binary(BinOp::And, Box::new(Expr::Ident("b".into())), Box::new(Expr::Ident("c".into()))))));
        // 1 + 2 < 3  ==  (1 + 2) < 3
        assert_eq!(p("1 + 2 < 3"), Expr::Binary(BinOp::Lt,
            Box::new(Expr::Binary(BinOp::Add, Box::new(Expr::Num(1.0)), Box::new(Expr::Num(2.0)))),
            Box::new(Expr::Num(3.0))));
    }
    #[test]
    fn calls_lists_unary_membership() {
        assert_eq!(p("length(s)"), Expr::Call("length".into(), vec![Expr::Ident("s".into())]));
        assert_eq!(p("score('phq9_total')"), Expr::Call("score".into(), vec![Expr::Str("phq9_total".into())]));
        assert_eq!(p("!x"), Expr::Unary(UnOp::Not, Box::new(Expr::Ident("x".into()))));
        assert_eq!(p("-2"), Expr::Unary(UnOp::Neg, Box::new(Expr::Num(2.0))));
        assert_eq!(p("a in [1, 2]"), Expr::Binary(BinOp::In, Box::new(Expr::Ident("a".into())),
            Box::new(Expr::List(vec![Expr::Num(1.0), Expr::Num(2.0)]))));
    }
    #[test]
    fn canonical_examples_parse() {
        for s in ["phq9_total >= 10", "length(it_name) < 5", "it_year_born == ''", "true",
                  "length(it_name) > 0 && is_empty(it_topics)"] {
            assert!(parse(s).is_ok(), "failed: {s}");
        }
    }
    #[test]
    fn errors() {
        assert!(parse("1 +").is_err());          // trailing operator
        assert!(parse("(1 + 2").is_err());        // unclosed paren
        assert!(parse("").is_err());              // empty
        assert!(parse(&"a".repeat(2000)).is_err() || parse("a").is_ok()); // length cap enforced in compile(), not here
    }
}
```

- [ ] **Step 3: Run → FAIL. Implement** `parser.rs` (precedence climbing; consumes all tokens or errors):

```rust
use crate::ast::{BinOp, Expr, UnOp};
use crate::lexer::{tokenize, ParseError, Token};

pub fn parse(src: &str) -> Result<Expr, ParseError> {
    let tokens = tokenize(src)?;
    let mut p = Parser { tokens, pos: 0 };
    let e = p.parse_or()?;
    if p.pos != p.tokens.len() {
        return Err(ParseError { offset: p.pos, message: "unexpected trailing tokens".into() });
    }
    Ok(e)
}

struct Parser { tokens: Vec<Token>, pos: usize }

impl Parser {
    fn peek(&self) -> Option<&Token> { self.tokens.get(self.pos) }
    fn bump(&mut self) -> Option<Token> { let t = self.tokens.get(self.pos).cloned(); if t.is_some() { self.pos += 1; } t }
    fn err(&self, m: &str) -> ParseError { ParseError { offset: self.pos, message: m.to_string() } }

    fn parse_or(&mut self) -> Result<Expr, ParseError> {
        let mut left = self.parse_and()?;
        while matches!(self.peek(), Some(Token::OrOr)) { self.bump();
            let right = self.parse_and()?; left = Expr::Binary(BinOp::Or, Box::new(left), Box::new(right)); }
        Ok(left)
    }
    fn parse_and(&mut self) -> Result<Expr, ParseError> {
        let mut left = self.parse_cmp()?;
        while matches!(self.peek(), Some(Token::AndAnd)) { self.bump();
            let right = self.parse_cmp()?; left = Expr::Binary(BinOp::And, Box::new(left), Box::new(right)); }
        Ok(left)
    }
    fn parse_cmp(&mut self) -> Result<Expr, ParseError> {
        let mut left = self.parse_add()?;
        loop {
            let op = match self.peek() {
                Some(Token::EqEq) => BinOp::Eq, Some(Token::NotEq) => BinOp::Ne,
                Some(Token::Lt) => BinOp::Lt, Some(Token::Le) => BinOp::Le,
                Some(Token::Gt) => BinOp::Gt, Some(Token::Ge) => BinOp::Ge,
                Some(Token::In) => BinOp::In,
                _ => break,
            };
            self.bump();
            let right = self.parse_add()?;
            left = Expr::Binary(op, Box::new(left), Box::new(right));
        }
        Ok(left)
    }
    fn parse_add(&mut self) -> Result<Expr, ParseError> {
        let mut left = self.parse_mul()?;
        loop {
            let op = match self.peek() { Some(Token::Plus) => BinOp::Add, Some(Token::Minus) => BinOp::Sub, _ => break };
            self.bump(); let right = self.parse_mul()?;
            left = Expr::Binary(op, Box::new(left), Box::new(right));
        }
        Ok(left)
    }
    fn parse_mul(&mut self) -> Result<Expr, ParseError> {
        let mut left = self.parse_unary()?;
        loop {
            let op = match self.peek() {
                Some(Token::Star) => BinOp::Mul, Some(Token::Slash) => BinOp::Div, Some(Token::Percent) => BinOp::Mod, _ => break };
            self.bump(); let right = self.parse_unary()?;
            left = Expr::Binary(op, Box::new(left), Box::new(right));
        }
        Ok(left)
    }
    fn parse_unary(&mut self) -> Result<Expr, ParseError> {
        match self.peek() {
            Some(Token::Bang) => { self.bump(); Ok(Expr::Unary(UnOp::Not, Box::new(self.parse_unary()?))) }
            Some(Token::Minus) => { self.bump(); Ok(Expr::Unary(UnOp::Neg, Box::new(self.parse_unary()?))) }
            _ => self.parse_primary(),
        }
    }
    fn parse_primary(&mut self) -> Result<Expr, ParseError> {
        match self.bump() {
            Some(Token::Number(n)) => Ok(Expr::Num(n)),
            Some(Token::Str(s)) => Ok(Expr::Str(s)),
            Some(Token::True) => Ok(Expr::Bool(true)),
            Some(Token::False) => Ok(Expr::Bool(false)),
            Some(Token::Null) => Ok(Expr::Null),
            Some(Token::LParen) => {
                let e = self.parse_or()?;
                match self.bump() { Some(Token::RParen) => Ok(e), _ => Err(self.err("expected ')'")) }
            }
            Some(Token::LBracket) => {
                let mut items = Vec::new();
                if !matches!(self.peek(), Some(Token::RBracket)) {
                    loop {
                        items.push(self.parse_or()?);
                        match self.peek() { Some(Token::Comma) => { self.bump(); } _ => break }
                    }
                }
                match self.bump() { Some(Token::RBracket) => Ok(Expr::List(items)), _ => Err(self.err("expected ']'")) }
            }
            Some(Token::Ident(name)) => {
                if matches!(self.peek(), Some(Token::LParen)) {
                    self.bump();
                    let mut args = Vec::new();
                    if !matches!(self.peek(), Some(Token::RParen)) {
                        loop {
                            args.push(self.parse_or()?);
                            match self.peek() { Some(Token::Comma) => { self.bump(); } _ => break }
                        }
                    }
                    match self.bump() { Some(Token::RParen) => Ok(Expr::Call(name, args)), _ => Err(self.err("expected ')'")) }
                } else { Ok(Expr::Ident(name)) }
            }
            _ => Err(self.err("expected an expression")),
        }
    }
}
```

- [ ] **Step 4:** PASS. **Commit:** `git commit -am "feat(expr): AST + recursive-descent parser (precedence, calls, lists, errors)"`

---

### Task 5: Evaluator (operators + Bindings)

**Files:** create `core/src/eval.rs`; `lib.rs` add `mod eval; pub use eval::Bindings;`.

- [ ] **Step 1: Failing tests** `eval.rs`:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::value::Value;
    use std::collections::HashMap;

    struct Env { vars: HashMap<String, Value>, scores: HashMap<String, Value> }
    impl Bindings for Env {
        fn var(&self, id: &str) -> Value {
            self.vars.get(id).or_else(|| self.scores.get(id)).cloned().unwrap_or(Value::Null) // bare score ids fall through (F1)
        }
        fn score(&self, id: &str) -> Value { self.scores.get(id).cloned().unwrap_or(Value::Null) }
    }
    fn env(vars: &[(&str, Value)], scores: &[(&str, Value)]) -> Env {
        Env { vars: vars.iter().map(|(k,v)|(k.to_string(),v.clone())).collect(),
              scores: scores.iter().map(|(k,v)|(k.to_string(),v.clone())).collect() }
    }
    fn ev(src: &str, e: &Env) -> Value { eval_str(src, e) }
    fn eval_str(src: &str, e: &Env) -> Value { eval_expr(&crate::parser::parse(src).unwrap(), e) }

    #[test]
    fn arithmetic_and_comparison() {
        let e = env(&[], &[]);
        assert!(matches!(ev("1 + 2 * 3", &e), Value::Number(n) if n == 7.0));
        assert!(matches!(ev("(1 + 2) * 3", &e), Value::Number(n) if n == 9.0));
        assert!(matches!(ev("10 >= 10", &e), Value::Bool(true)));
        assert!(matches!(ev("5 / 0", &e), Value::Null));          // /0 → Null
        assert!(matches!(ev("5 % 0", &e), Value::Null));
    }
    #[test]
    fn logic_short_circuit_and_type_errors() {
        let e = env(&[], &[]);
        assert!(matches!(ev("true && false", &e), Value::Bool(false)));
        assert!(matches!(ev("false && (1/0 == 0)", &e), Value::Bool(false))); // short-circuits, no eval of rhs
        assert!(matches!(ev("1 && true", &e), Value::Null));      // non-bool operand → Null
        assert!(matches!(ev("!true", &e), Value::Bool(false)));
    }
    #[test]
    fn equality_total_ordering_typed() {
        let e = env(&[("it_year_born", Value::Str("".into()))], &[]);
        assert!(matches!(ev("it_year_born == ''", &e), Value::Bool(true)));
        assert!(matches!(ev("1 == '1'", &e), Value::Bool(false))); // cross-type → false
        assert!(matches!(ev("'a' < 'b'", &e), Value::Bool(true))); // code-point order
        assert!(matches!(ev("1 < 'a'", &e), Value::Null));         // mixed ordering → type error → Null
    }
    #[test]
    fn vars_scores_membership() {
        let e = env(&[("it_mood", Value::Number(20.0))], &[("phq9_total", Value::Number(12.0))]);
        assert!(matches!(ev("it_mood < 30", &e), Value::Bool(true)));
        assert!(matches!(ev("phq9_total >= 10", &e), Value::Bool(true)));     // bare score id via var() fallthrough
        assert!(matches!(ev("score('phq9_total') >= 10", &e), Value::Bool(true))); // explicit score()
        assert!(matches!(ev("unbound_thing", &e), Value::Null));
        assert!(matches!(ev("2 in [1, 2, 3]", &e), Value::Bool(true)));
        assert!(matches!(ev("9 in [1, 2, 3]", &e), Value::Bool(false)));
    }
}
```

- [ ] **Step 2: Run → FAIL. Implement** `eval.rs` (functions are Task 6 — leave a `call` arm that returns `Null` for unknown names; Task 6 fills it):

```rust
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
        Expr::Call(name, args) => crate::eval::call(name, args, b),
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
    // short-circuit logic first
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
        (Value::Str(a), Value::Str(b)) => Some(a.cmp(b)), // code-point order (F3)
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

// filled in Task 6
pub(crate) fn call(_name: &str, _args: &[Expr], _b: &dyn Bindings) -> Value { Value::Null }
```

- [ ] **Step 3:** PASS (the `score()`/function tests that need Task 6 — NOTE: the `score('phq9_total')` test in Step 1 will FAIL until Task 6. To keep this task green, mark that one assertion `#[ignore]`-free by SPLITTING: move the two `score(...)`/function-dependent assertions into a separate test annotated `#[ignore = "needs Task 6 functions"]`, or simpler — implement the `score` + `is_empty`/`length` calls minimally HERE inside `call()`. RECOMMENDED: implement `call()` fully in Task 6 and in THIS task's test, remove the `score('phq9_total')` line + keep only bare-id `phq9_total`; add the explicit-`score()` assertion in Task 6's tests.) Adjust the test as noted, reach green. **Commit:** `git commit -am "feat(expr): evaluator — arithmetic, typed ordering, total equality, short-circuit logic, membership"`

---

### Task 6: Functions

**Files:** modify `core/src/eval.rs` (replace the `call` stub + add tests).

- [ ] **Step 1: Failing tests** (append to `eval.rs` tests module):

```rust
    #[test]
    fn functions() {
        let e = env(&[("s", Value::Str("héllo".into())), ("topics", Value::List(vec![])), ("name", Value::Str("Ada".into()))],
                    &[("sc", Value::Number(7.0))]);
        assert!(matches!(ev("length(s)", &e), Value::Number(n) if n == 5.0)); // unicode scalar count
        assert!(matches!(ev("length(missing)", &e), Value::Null));
        assert!(matches!(ev("is_empty(topics)", &e), Value::Bool(true)));
        assert!(matches!(ev("is_empty(name)", &e), Value::Bool(false)));
        assert!(matches!(ev("not_empty(name)", &e), Value::Bool(true)));
        assert!(matches!(ev("count(topics)", &e), Value::Number(n) if n == 0.0));
        assert!(matches!(ev("count(name)", &e), Value::Number(n) if n == 1.0));
        assert!(matches!(ev("contains('abcd', 'bc')", &e), Value::Bool(true)));
        assert!(matches!(ev("contains([1, 2], 2)", &e), Value::Bool(true)));
        assert!(matches!(ev("score('sc')", &e), Value::Number(n) if n == 7.0));
        assert!(matches!(ev("score(sc)", &e), Value::Number(n) if n == 7.0)); // bare-ident arg form
        assert!(matches!(ev("unknown_fn(1)", &e), Value::Null));
    }
    #[test]
    fn canonical_validation_expression() {
        let e = env(&[("it_name", Value::Str("Ada".into())), ("it_topics", Value::List(vec![]))], &[]);
        assert!(matches!(ev("length(it_name) > 0 && is_empty(it_topics)", &e), Value::Bool(true)));
    }
```

- [ ] **Step 2: Run → FAIL. Replace** the `call` stub in `eval.rs`:

```rust
pub(crate) fn call(name: &str, args: &[Expr], b: &dyn Bindings) -> Value {
    match name {
        "score" => {
            // F1: score('id') string literal OR score(id) bare identifier; never evaluates the arg as a variable
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
```

- [ ] **Step 3:** PASS. **Commit:** `git commit -am "feat(expr): functions (length, is_empty, not_empty, count, contains, score w/ both arg forms)"`

---

### Task 7: Helpers (reversed_value + compare_solution)

**Files:** create `core/src/helpers.rs`; `lib.rs` add `mod helpers; pub use helpers::{reversed_value, compare_solution, Comparator};`.

- [ ] **Step 1: Failing tests** `helpers.rs`:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::value::Value;
    #[test]
    fn reversed() {
        assert_eq!(reversed_value(1.0, 0.0, 6.0), 5.0);   // max+min-value, 7-point 0..6
        assert_eq!(reversed_value(4.0, 1.0, 5.0), 2.0);   // 1..5
        assert_eq!(reversed_value(-1.0, -3.0, 3.0), 1.0); // signed scale
    }
    #[test]
    fn equals_and_set_equals() {
        assert!(compare_solution(Comparator::Equals, &Value::Number(3.0), &Value::Number(3.0)));
        assert!(!compare_solution(Comparator::Equals, &Value::Number(3.0), &Value::Number(4.0)));
        let a = Value::List(vec![Value::Number(1.0), Value::Number(2.0)]);
        let b = Value::List(vec![Value::Number(2.0), Value::Number(1.0)]);
        assert!(compare_solution(Comparator::SetEquals, &a, &b)); // order-independent
        let c = Value::List(vec![Value::Number(1.0)]);
        assert!(!compare_solution(Comparator::SetEquals, &a, &c));
    }
    #[test]
    fn matches_regex() {
        assert!(compare_solution(Comparator::MatchesRegex, &Value::Str("ab12".into()), &Value::Str(r"^[a-z]+\d+$".into())));
        assert!(!compare_solution(Comparator::MatchesRegex, &Value::Str("ABC".into()), &Value::Str(r"^[a-z]+$".into())));
        assert!(!compare_solution(Comparator::MatchesRegex, &Value::Str("x".into()), &Value::Str("(".into()))); // invalid pattern → false
        // non-string response/expected → false
        assert!(!compare_solution(Comparator::MatchesRegex, &Value::Number(1.0), &Value::Str("1".into())));
    }
}
```

- [ ] **Step 2: Run → FAIL. Implement** `helpers.rs`:

```rust
use crate::value::Value;
use regex::Regex;

/// 05b 4.1: post-reversal value. Deterministic; the Library guards which Prompts may set reversed.
pub fn reversed_value(value: f64, min: f64, max: f64) -> f64 { max + min - value }

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Comparator { Equals, SetEquals, MatchesRegex }

/// 05b 4.3: Solution correctness. Comparator is chosen by the host from the Option triple.
pub fn compare_solution(cmp: Comparator, response: &Value, expected: &Value) -> bool {
    match cmp {
        Comparator::Equals => response.eq_value(expected),
        Comparator::SetEquals => match (response, expected) {
            (Value::List(a), Value::List(b)) => {
                a.len() == b.len()
                    && a.iter().all(|x| b.iter().any(|y| x.eq_value(y)))
                    && b.iter().all(|y| a.iter().any(|x| x.eq_value(y)))
            }
            _ => false,
        },
        Comparator::MatchesRegex => match (response, expected) {
            (Value::Str(s), Value::Str(pat)) => Regex::new(pat).map(|re| re.is_match(s)).unwrap_or(false),
            _ => false,
        },
    }
}
```

(Note: `set_equals` here is the documented semantics — equal length + mutual membership. Duplicates within a list are not deduped; psychometric multi-select answers don't repeat. `matches_regex` is unanchored `is_match`; pattern authors anchor with `^…$` — documented in the design doc.)

- [ ] **Step 3:** PASS. **Commit:** `git commit -am "feat(expr): helpers — reversed_value + compare_solution (equals/set_equals/matches_regex)"`

---

### Task 8: Public API + normative vectors

**Files:** rewrite `core/src/lib.rs` (public surface); create `test_vectors.json` (repo: `questionnaire-expression-evaluator/test_vectors.json`); create `core/tests/vectors.rs`. `core/Cargo.toml` add dev-deps `serde`, `serde_json`.

- [ ] **Step 1: lib.rs public API + unit tests:**

```rust
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
    if expr.len() > MAX_EXPR_LEN {
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
        assert!(!condition(&p, &Env(HashMap::new())));    // Null → false
        let p2 = compile("1 + 1").unwrap();
        assert!(!condition(&p2, &Env(HashMap::new())));   // Number → false
    }
    #[test]
    fn length_cap_and_parse_errors_are_errors() {
        assert!(compile(&"a".repeat(1025)).is_err());
        assert!(compile("1 +").is_err());
    }
}
```

- [ ] **Step 2: `core/Cargo.toml`** add:

```toml
[dev-dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

- [ ] **Step 3: `test_vectors.json`** (the normative harness — comprehensive; this exact file is also run by the web binding). Create with these cases (extend freely, but include all of these):

```json
{
  "conditions": [
    { "expr": "true", "vars": {}, "scores": {}, "expect": true },
    { "expr": "false", "vars": {}, "scores": {}, "expect": false },
    { "expr": "phq9_total >= 10", "vars": {}, "scores": { "phq9_total": 12 }, "expect": true },
    { "expr": "phq9_total >= 10", "vars": {}, "scores": { "phq9_total": 4 }, "expect": false },
    { "expr": "score('phq9_total') >= 10", "vars": {}, "scores": { "phq9_total": 12 }, "expect": true },
    { "expr": "it_mood < 30", "vars": { "it_mood": 20 }, "scores": {}, "expect": true },
    { "expr": "it_year_born == ''", "vars": { "it_year_born": "" }, "scores": {}, "expect": true },
    { "expr": "it_year_born == ''", "vars": { "it_year_born": "1990" }, "scores": {}, "expect": false },
    { "expr": "length(it_name) < 5", "vars": { "it_name": "Ada" }, "scores": {}, "expect": true },
    { "expr": "length(it_name) > 0 && is_empty(it_topics)", "vars": { "it_name": "Ada", "it_topics": [] }, "scores": {}, "expect": true },
    { "expr": "length(it_name) > 0 && is_empty(it_topics)", "vars": { "it_name": "Ada", "it_topics": [1] }, "scores": {}, "expect": false },
    { "expr": "1 + 2 * 3 == 7", "vars": {}, "scores": {}, "expect": true },
    { "expr": "(1 + 2) * 3 == 9", "vars": {}, "scores": {}, "expect": true },
    { "expr": "5 / 0 == 0", "vars": {}, "scores": {}, "expect": false },
    { "expr": "'a' < 'b'", "vars": {}, "scores": {}, "expect": true },
    { "expr": "2 in [1, 2, 3]", "vars": {}, "scores": {}, "expect": true },
    { "expr": "9 in [1, 2, 3]", "vars": {}, "scores": {}, "expect": false },
    { "expr": "count(it_topics) == 2", "vars": { "it_topics": ["a", "b"] }, "scores": {}, "expect": true },
    { "expr": "contains('hello world', 'world')", "vars": {}, "scores": {}, "expect": true },
    { "expr": "not_empty(it_name)", "vars": { "it_name": "x" }, "scores": {}, "expect": true },
    { "expr": "1 == '1'", "vars": {}, "scores": {}, "expect": false },
    { "expr": "false && (5 / 0 == 0)", "vars": {}, "scores": {}, "expect": false }
  ],
  "reversed_value": [
    { "value": 1, "min": 0, "max": 6, "expect": 5 },
    { "value": 4, "min": 1, "max": 5, "expect": 2 }
  ],
  "compare_solution": [
    { "cmp": "equals", "response": 3, "expected": 3, "expect": true },
    { "cmp": "set_equals", "response": [1, 2], "expected": [2, 1], "expect": true },
    { "cmp": "matches_regex", "response": "ab12", "expected": "^[a-z]+\\d+$", "expect": true }
  ]
}
```

- [ ] **Step 4: `core/tests/vectors.rs`** (integration test — runs the JSON; the cross-build contract):

```rust
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
```

- [ ] **Step 5: Run** `cargo test -p questionnaire-expr-core` → ALL pass (unit + vectors). Also `cargo build -p questionnaire-expr-core --target wasm32-unknown-unknown` clean. **Commit:** `git commit -am "feat(expr): public API (compile/evaluate/condition) + normative test_vectors.json + host vector runner"`

---

### Task 9: Web (wasm-bindgen) package

**Files:** create `web/Cargo.toml`, `web/src/lib.rs`, `web/package.json`, `web/vitest.config.ts`, `web/tests/vectors.test.ts`. Copy `test_vectors.json` is NOT needed — the test reads `../../test_vectors.json`.

- [ ] **Step 1: `web/Cargo.toml`:**

```toml
[package]
name = "questionnaire-expr-web"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
questionnaire-expr-core = { path = "../core" }
wasm-bindgen = "0.2"
```

- [ ] **Step 2: `web/src/lib.rs`** — wasm surface. The host passes a JS object `{ var(id), score(id) }`; we adapt it to `Bindings`. Expose `evaluate_condition(expr, bindings)`, `reversed_value`, `compare_solution`. Errors (compile) → thrown JS error.

```rust
use questionnaire_expr_core::{compile, condition, compare_solution, reversed_value, Bindings, Comparator, Value};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

// JS resolver: an object with var(id)->any and score(id)->any
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
```

Add `js-sys = "0.3"` to `web/Cargo.toml` deps (used for Array). Update the deps block:

```toml
[dependencies]
questionnaire-expr-core = { path = "../core" }
wasm-bindgen = "0.2"
js-sys = "0.3"
```

- [ ] **Step 3: Build the wasm package.** From `web/`: `. "$HOME/.cargo/env" && wasm-pack build --target nodejs --out-dir pkg`. Expect `pkg/questionnaire_expr_web.js` + `.wasm` + `.d.ts`. (If `wasm-pack` errors on a missing `wasm-opt`, add `--no-opt`.) Report any flag changes.
- [ ] **Step 4: `web/package.json`:**

```json
{
  "name": "@behaverse/expression-evaluator",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "wasm-pack build --target nodejs --out-dir pkg",
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 5: `web/vitest.config.ts`:**

```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { environment: 'node' } })
```

- [ ] **Step 6: `web/tests/vectors.test.ts`** — load the built wasm (nodejs target = CommonJS; import via `createRequire`) and run the SAME vectors:

```ts
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, expect, test } from 'vitest'

const require = createRequire(import.meta.url)
const wasm = require('../pkg/questionnaire_expr_web.js')
const vectors = JSON.parse(readFileSync(new URL('../../test_vectors.json', import.meta.url), 'utf8'))

function bindings(vars: Record<string, unknown>, scores: Record<string, unknown>) {
  return {
    var: (id: string) => (id in vars ? vars[id] : id in scores ? scores[id] : null), // bare score-id fallthrough
    score: (id: string) => (id in scores ? scores[id] : null),
  }
}

describe('conditions', () => {
  for (const c of vectors.conditions) {
    test(c.expr, () => {
      expect(wasm.evaluate_condition(c.expr, bindings(c.vars, c.scores))).toBe(c.expect)
    })
  }
})
describe('reversed_value', () => {
  for (const c of vectors.reversed_value) {
    test(`${c.value}/${c.min}/${c.max}`, () => expect(wasm.reversed(c.value, c.min, c.max)).toBe(c.expect))
  }
})
describe('compare_solution', () => {
  for (const c of vectors.compare_solution) {
    test(`${c.cmp}`, () => expect(wasm.compare(c.cmp, c.response, c.expected)).toBe(c.expect))
  }
})
test('check_expression flags a parse error', () => {
  expect(wasm.check_expression('1 +')).toMatch(/parse error/)
  expect(wasm.check_expression('a >= 10')).toBeNull()  // wasm-bindgen Option<String> None → null
})
```

- [ ] **Step 7: Run** from `web/`: `npm install` then `npm test`. Expect every vector green (the SAME `test_vectors.json` the host ran — this is the determinism proof). If the `Option<String>` None marshals to `undefined` rather than `null`, adjust the assertion to `.toBeFalsy()` and report it.
- [ ] **Step 8: Commit.** `git add questionnaire-expression-evaluator/web && git commit -m "feat(expr): web wasm-bindgen package + vitest runs the normative vectors through compiled WASM"`

---

### Task 10: Docs + grammar design doc (F5) + verification + merge

**Files:** create `questionnaire-expression-evaluator/README.md`, `FOLLOWUPS.md`, `design/15_expression_language.md`; modify `design/00_index.md` (add the new doc row), `HANDOFF.md` is NOT touched here (controller updates it post-merge).

- [ ] **Step 1: `design/15_expression_language.md`** (F5 — the normative grammar, authoritative outside the code). Cover: purpose (the canonical `Expression` grammar OD-11; what `schemas/.../Expression` means); the `Value` lattice; the full grammar with precedence table (§2 of the spec); the function set; determinism rules (code-point string order, `/0`→Null, no dates/locale/RNG — explicitly the F3 narrowing of "locale-aware"); the sentinel-`null` error model + `condition()` truthiness; the `score(id)` host-lookup semantics (both bare-id and `score('id')` forms, F1); `reversed_value` + the three `compare_solution` comparators (note `matches_regex` is unanchored — authors anchor with `^…$`); and a pointer to `test_vectors.json` as the normative regression harness. Keep it design-level (what the system IS), not build status. Read an existing `design/0X_*.md` for house style first.
- [ ] **Step 2: `design/00_index.md`** — add a row for `15_expression_language.md` (match the table format; "Live"). Verify the doc count phrasing elsewhere isn't hardcoded wrong (grep `design/` for "16 docs" / similar and update if present).
- [ ] **Step 3: `README.md`** — what it is (OD-11 reference evaluator), workspace layout, build/test commands (`cargo test -p questionnaire-expr-core`; `cd web && wasm-pack build --target nodejs && npm test`), the `test_vectors.json` contract, the public API surface, and the deferred Godot/Editor bindings. `FOLLOWUPS.md` — deferred items: Godot C-ABI + Editor wasmer-python bindings (when those components exist); aggregate functions (`sum/min/max/round`) + date functions + locale collation (add when a real instrument needs them); `wasm-opt` size pass for the WASM if it grows; the `regex` crate's WASM footprint (revisit only if it bites); publishing `@behaverse/expression-evaluator` properly at the repo split.
- [ ] **Step 4: Full verification** (paste tails):

```bash
. "$HOME/.cargo/env"
cd questionnaire-expression-evaluator
cargo test -p questionnaire-expr-core                                  # all green
cargo build -p questionnaire-expr-core --target wasm32-unknown-unknown # clean
( cd web && wasm-pack build --target nodejs --out-dir pkg && npm test ) # vectors green through WASM
```

Also confirm the unchanged suites still pass (nothing else was touched, but verify the schema suite is unaffected): `cd .. && pytest tools/tests/ -q | tail -1`.

- [ ] **Step 5: Commit.** `git add questionnaire-expression-evaluator/README.md questionnaire-expression-evaluator/FOLLOWUPS.md design/15_expression_language.md design/00_index.md && git commit -m "docs(expr): README + FOLLOWUPS + normative grammar (design/15) + index"`

---

### Task 11: Merge

- [ ] **Step 1:** Re-run the Task 10 verification block; all green.
- [ ] **Step 2:** Use superpowers:finishing-a-development-branch — merge `wv-c-expression-evaluator` to `master` with `--no-ff` (`Merge wv-c-expression-evaluator: Expression Evaluator (OD-11 reference WASM evaluator)`), push, delete the branch. (No PRs.)

---

## Self-review notes (done at planning time)

- **Spec coverage:** grammar §2 → Tasks 3–6; Value lattice → T2; determinism rules (/0→Null, code-point order, no dates/RNG) → T5 + design doc T10; host interface §3 (`Bindings` var/score, bare-id fallthrough, both `score()` forms — F1) → T5/T6 + web shim T9; public API §4 → T8; helpers (reversed_value, compare_solution incl. regex F4) → T7; normative vectors §5 → T8 (host) + T9 (WASM, the determinism proof); bindings now-vs-deferred §6 → T9 builds web, Godot/Editor in FOLLOWUPS; workspace layout §7 → T1; F5 grammar design doc → T10.
- **Type consistency:** `Value`/`Bindings`/`Comparator`/`ParseError`/`Program` names identical across T2–T9; the test `Env` impl's `var` falls through to scores in EVERY place a bare score id is used (eval tests T5, vectors runner T8, web shim T9) — consistent. `condition()` = `matches!(_, Value::Bool(true))` defined once (T8), matched by the web `evaluate_condition`.
- **Known judgment calls:** Task 5 Step 1's test contains two assertions that depend on Task 6's `call()` — the step explicitly instructs splitting them out (bare-id `phq9_total` stays in T5; `score('…')`/function assertions move to T6) so each task is independently green. `matches_regex` is unanchored (documented). `set_equals` does not dedupe (documented; multi-select answers don't repeat). `Cargo.lock` gitignored (library workspace convention).
