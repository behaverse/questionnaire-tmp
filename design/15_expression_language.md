# 15 — Expression Language

This document is the **normative grammar** for the `Expression` type that appears throughout the canonical questionnaire schema — visibility rules, branching conditions, validation predicates, and the comparators behind correctness and reversed scoring. Wherever the schema declares a field of type `Expression` (a `minLength: 1`, `maxLength: 1024` string whose `$comment` reads *"grammar defined by the WASM evaluator (OD-11)"*), **this document is what that grammar concretely is**, and the reference evaluator in [`questionnaire-expression-evaluator/`](../questionnaire-expression-evaluator/) is its single executable definition.

Per OD-11 (resolved 2026-05-21, see [08_viewer.md](08_viewer.md) §"Reference evaluator"), every viewer evaluates expressions by embedding **one** compiled module — there is no second implementation to drift against. The cross-viewer contract is *"produces the reference evaluator's output,"* not *"passes a test suite."* The test suite ([`test_vectors.json`](../questionnaire-expression-evaluator/test_vectors.json)) is a regression harness for the module itself, run identically by the Rust host and by the WASM binding.

## Purpose

The expression language exists to let questionnaire authors write small, side-effect-free predicates and value computations over a participant's answers and computed scores, in a form that:

- **evaluates identically** on every viewer (Web, Native, Editor preview) — the OD-11 guarantee;
- **never crashes the viewer** — every runtime failure resolves to a sentinel value, never an exception;
- **is deterministic** — the same inputs always produce the same output on every platform, with no dependence on locale, wall-clock, randomness, or floating-point platform quirks.

It is deliberately **not** a general-purpose programming language: no variables binding, no loops, no user-defined functions, no I/O. It is an expression evaluator over a fixed value lattice and a fixed function set.

## Value lattice

Every expression evaluates to exactly one of five value kinds:

| Kind | Backing type | Notes |
|---|---|---|
| **Null** | — | The sentinel. Also the result of every runtime failure (see *Error model*). |
| **Bool** | `true` / `false` | Produced by comparisons, logic, and predicate functions. |
| **Number** | IEEE-754 `f64` | A single numeric type; there is no integer/float distinction. |
| **Str** | UTF-8 string | Compared by Unicode code-point order (see *Determinism*). |
| **List** | ordered sequence of values | Heterogeneous; produced by list literals and host variables. |

There is no distinct date, time, or map type in v1.

## Grammar

Expressions are parsed with standard precedence-climbing. The full grammar, lowest precedence first:

```
expr        := or
or          := and        ( '||' and )*
and         := cmp        ( '&&' cmp )*
cmp         := add        ( ( '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' ) add )*
add         := mul        ( ( '+' | '-' ) mul )*
mul         := unary      ( ( '*' | '/' | '%' ) unary )*
unary       := ( '!' | '-' ) unary | primary
primary     := number
             | string
             | 'true' | 'false' | 'null'
             | '[' ( expr ( ',' expr )* )? ']'        // list literal
             | identifier '(' ( expr ( ',' expr )* )? ')'   // function call
             | identifier                              // bare host lookup
             | '(' expr ')'
```

### Precedence table (low → high)

| Level | Operators | Associativity |
|---|---|---|
| 1 | `\|\|` | left |
| 2 | `&&` | left |
| 3 | `==` `!=` `<` `<=` `>` `>=` `in` | left (one level; chains evaluate left-to-right) |
| 4 | `+` `-` | left |
| 5 | `*` `/` `%` | left |
| 6 | `!` `-` (unary) | right |
| 7 | call / primary / parenthesised | — |

Parentheses override precedence at any level.

### Literals and identifiers

- **Numbers** parse as `f64` (digits with an optional `.`); a leading minus is the unary `-` operator, not part of the literal.
- **Strings** are single-quoted (`'...'`), with exactly two escapes: `\'` (literal quote) and `\\` (literal backslash). No other escape is recognised.
- **Booleans / null** are the bare keywords `true`, `false`, `null`.
- **List literals** are `[a, b, c]` (a trailing comma is not required and not specially handled — an empty list is `[]`).
- **Identifiers** are the canonical token `^[a-z][a-z0-9_]*$` — a lowercase letter followed by lowercase letters, digits, and underscores. Authored content and the schema's id patterns produce only this form; the canonical grammar reserves uppercase and leading underscores for future use.

## Function set

Functions are fixed and resolved by name at evaluation time. An unknown function name, or any call with the wrong arity, resolves to **Null** (never an error).

| Function | Result | Notes |
|---|---|---|
| `length(x)` | Number | Unicode-scalar count for a string; element count for a list. Any other type → Null. Arity-checked. |
| `is_empty(x)` | Bool | `true` for Null, `''`, and `[]`; `false` otherwise (including `0` and `false`). |
| `not_empty(x)` | Bool | Logical negation of `is_empty`. |
| `count(x)` | Number | List length; a scalar (Bool/Number/Str) → `1`; Null → `0`. Arity-checked. |
| `contains(hay, needle)` | Bool | Substring test when `hay` is a string and `needle` is a string; membership test when `hay` is a list (value-equality against each element). Other operand shapes → Null. |
| `score(id)` | host value | Looks up an externally-computed score by id (see *Score lookup*). Accepts both the string-literal form `score('phq9_total')` and the bare-identifier form `score(phq9_total)`. |

`is_empty` / `not_empty` are intentionally lenient about extra arguments only in that the canonical authored form is unary; the reference treats the unary form as the contract.

## Determinism

Determinism is the OD-11 guarantee and the reason a single binary exists. The reference evaluator pins every source of cross-platform divergence:

- **Numbers are IEEE-754 `f64`** with standard arithmetic. Division by zero (`/0`) and modulo by zero (`%0`) resolve to **Null** rather than producing `inf`/`NaN`. **Any non-finite arithmetic result** (overflow to `inf`, a `NaN`) also resolves to Null. Comparisons and equality therefore never see a `NaN`.
- **String comparison is Unicode code-point order — never locale collation.** This is a deliberate v1 narrowing of the design's earlier "locale-aware comparisons" phrasing: locale-dependent collation is the single worst cross-platform determinism hazard (it varies by OS, ICU version, and locale data), and no real expression needs ordering of human-language strings. Authors compare strings for equality, membership, and at most code-point order; locale-aware collation is deferred until a concrete instrument demands it.
- **No dates, no time, no randomness, no wall-clock** in v1. There is no way to write an expression whose result depends on *when* it runs.

Because of these rules, the same expression with the same bindings yields the same value on every viewer, which is what *"single binary, identical evaluation across Web / Native / Editor"* means operationally.

## Error model

- **Parsing is total.** `compile(expr)` either returns a compiled program or a `ParseError { offset, message }`. The Editor surfaces this at authoring time; nothing downstream ever sees a half-parsed expression.
- **The length cap is enforced in `compile()`.** Expressions longer than 1024 Unicode characters are rejected, mirroring the schema's `Expression.maxLength: 1024`.
- **Evaluation never panics.** Every runtime failure — an unbound identifier, a type error (e.g. `1 < 'a'`), a bad-arity call, a `/0`, a non-finite result — funnels to the sentinel **Null**. There are no exceptions, no `NaN`s, and no aborted sessions.
- **Truthiness for rules is strict.** `condition(program, bindings)` maps **only `Bool(true)`** to `true`; every other result — `Bool(false)`, Null, a Number, a type error — maps to `false`. This is the OD-16 LogicRule / validation rule: *null is false*. A visibility rule that fails to evaluate hides its target; a validation predicate that fails to evaluate does not pass.

## Score lookup

`score(id)` and any bare identifier both resolve through the **host**, not through the expression itself:

- A **bare identifier** (`phq9_total`) resolves via the host's `var(id)`. The host may fall through *answers → scores*, so a bare score id used directly in a predicate (`phq9_total >= 10`) resolves correctly even without the `score(...)` wrapper (F1).
- `score('id')` / `score(id)` resolves via the host's `score(id)` explicitly, for cases where an author wants to disambiguate from an answer of the same name.

Crucially, `score(id)` is a **lookup of an already-computed score**, not scoring logic. Scoring is performed by the external Scorer entity (OD-16 path B, see [05b_scoring.md](05b_scoring.md)); the questionnaire JSON never contains the arithmetic that produces a score. The expression language only *reads* the result the Scorer published. This keeps scoring methodology in the Scorer (versioned, peer-reviewed) and out of per-questionnaire expressions.

## Scoring helpers

Two helpers ship in the same module for the scoring and correctness pipelines. They are direct functions, not part of the expression grammar (authors do not call them in `Expression` strings):

- **`reversed_value(value, min, max) = max + min − value`** — the post-reversal value for a reverse-keyed Prompt (05b §4.1). Deterministic; the Library guards which Prompts may declare `reversed`. The viewer applies it and the response payload carries both the raw `value` and the `scored_value`.
- **`compare_solution(comparator, response, expected)` → Bool** — per-item correctness (05b §4.3). Three comparators:
  - **`equals`** — value-equality (cross-type → `false`, never an error).
  - **`set_equals`** — order-independent: equal length plus mutual membership of two lists; non-list operands → `false`.
  - **`matches_regex`** — `regex`-crate `is_match`, **unanchored**. Pattern authors must anchor with `^…$` when they want a full-string match. An invalid pattern or a non-string operand → `false`.

The host chooses the comparator from the Option's `(input_data_type, measurement_type, selection)` triple (05a); the evaluator only executes it.

## Cross-viewer contract

The normative harness is [`test_vectors.json`](../questionnaire-expression-evaluator/test_vectors.json) at the evaluator workspace root. It enumerates `{ expr, vars, scores, expect }` condition vectors plus helper vectors, and is executed **identically** by:

- the Rust host tests (`core/tests/vectors.rs`), and
- the WASM/vitest binding (`web/tests/vectors.test.ts`), which runs the *compiled WASM* through the same vectors.

Same vectors → same outputs across both paths is the operational meaning of OD-11's "single binary." When a new viewer (or a new host language binding) is added, it conforms by passing these vectors against the shipped WASM module — not by re-implementing the grammar.

## References

- **OD-11** (resolved 2026-05-21) — single WASM expression evaluator; cross-viewer determinism. See [08_viewer.md](08_viewer.md) §"Reference evaluator".
- **OD-16** (resolved 2026-06-02) — external Scorer entity; `score(id)` is a lookup; null-is-false truthiness. See [05b_scoring.md](05b_scoring.md).
- **05b §4.1 / §4.3** — `reversed_value` and the `compare_solution` comparators.
- **Implementation** — [`questionnaire-expression-evaluator/`](../questionnaire-expression-evaluator/) (`core/` pure crate + `web/` wasm-bindgen package).
