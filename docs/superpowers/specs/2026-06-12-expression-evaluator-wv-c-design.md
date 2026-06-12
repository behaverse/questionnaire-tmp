# Expression Evaluator (WV-C / OD-11) — Design Spec

**Date drafted:** 2026-06-12
**Author:** WV-C brainstorming session (2026-06-12)
**Component:** The **shared reference expression evaluator** (OD-11). Decomposed as "WV-C" in the [Web Viewer WV-A spec §0](2026-06-11-web-viewer-wv-a-design.md), but it is **not** part of `web-viewer/` — it is its own Rust→WASM sub-project that the Web Viewer (WV-D), the future Native (Godot) Viewer, and the Editor preview all embed. Building it now unblocks WV-D (logic/branching/validation/in-session scoring).
**Target repo/dir:** new top-level **`questionnaire-expression-evaluator/`** (a Cargo workspace; sibling of `questionnaire-runtime-denormaliser/`; becomes `questionnaire-expression-evaluator` at the deferred repo split per [design/14](../../../design/14_repository_topology.md)).
**Toolchain (verified installed 2026-06-12):** Rust stable 1.96.0, `wasm32-unknown-unknown` target, host `cargo test` + wasm build both confirmed working. `wasm-bindgen-cli` + `wasm-pack` to be added for the JS package (§6).
**Authoritative source documents:**

- **OD-11** (resolved 2026-05-21): single WASM module is the canonical evaluator; same binary across Web/Native/Editor; a normative test suite ships as a regression harness (not as the contract — the binary's outputs are the contract). [design/08_viewer.md](../../../design/08_viewer.md) §"Reference evaluator".
- [schemas/questionnaire/schema.json](../../../schemas/questionnaire/schema.json) `$defs.Expression` (`string`, 1–1024 chars, `"grammar defined by the WASM evaluator (OD-11)"` — **this spec defines that grammar**) + its uses: `show_if` (Page/Section/Item elements), `LogicRule.condition` (skip/visibility/piping/branch), `CrossQuestionValidationRule.condition`.
- [design/05b_scoring.md](../../../design/05b_scoring.md) §§4.1–4.5 — the reversed-value rule (`scored_value = max + min − value`), the Solution `correct` comparators (equals / set_equals / matches_regex), the two-trigger model, and the **sentinel-`null`** error convention (LogicRule conditions treat `null` as false). **OD-16 path B**: scoring *procedures* live in the external Scorer, **not** in this expression language — `score(id)` is only a *lookup* of a value the host has resolved.
- Concrete expressions in the canonical examples (the v1 surface must cover these): `phq9_total >= 10`, `length(it_name) < 5`, `it_mood < 30`, `it_year_born == ''`, `length(it_name) > 0 && is_empty(it_topics)`, `true`.

---

## 1 — What this component is (and is not)

**Is:** a small, deterministic, dependency-light **interpreter for the canonical `Expression` language**, plus two pure deterministic **helpers** the design assigns to "the WASM evaluator," compiled to a single `wasm32` module with thin per-host bindings. It answers exactly three questions for a viewer:

1. **Condition** — given an `Expression` string and the current answers/scores, is it true? (drives `show_if`, `LogicRule.condition`, validation `condition`).
2. **Reversed value** — `reversed_value(value, min, max) → max + min − value` (the one piece of scoring arithmetic the viewer owns, per 05b 4.1).
3. **Solution correctness** — `compare_solution(kind, response, expected) → bool` for the three comparators (per 05b 4.3).

**Is not:**
- **Not the Scorer.** It does not execute scoring procedures (sum/recoding/IRT/proprietary). Those are the external Scorer (`scr_*`) run by its own conformance runner (OD-16, a separate later deliverable). `score(id)` in an expression is a **host lookup** of an already-resolved scalar, never a computation.
- **Not a general programming language.** No loops, no user functions, no assignment, no I/O. A pure expression → value evaluator.
- **Not the piping renderer.** `LogicRule type:"piping"` *substitutes* text; this component only evaluates the rule's `condition` (whether the piping applies). The viewer does the DOM substitution.

## 2 — The canonical grammar (v1)

A single value type lattice — **`Value` = Null | Bool | Number(f64) | Str(String) | List(Vec<Value>)**. Expressions are parsed by a hand-written recursive-descent parser (zero parser-generator dependency → tiny WASM, total control over determinism) into an AST, then evaluated.

### 2.1 Lexical + literal forms
- **Numbers**: `f64` (`10`, `3.5`, `-2`). Integer and decimal share one type.
- **Strings**: single-quoted `'...'` with `\\'` / `\\\\` escapes (matches `it_year_born == ''`).
- **Booleans**: `true`, `false`. **Null**: `null`.
- **Lists**: `[a, b, c]` (literal only; used with `in`).
- **Identifiers**: `^[a-z][a-z0-9_]*$` — resolve to a **binding** (an answer value by Item id, or a score value by score id — see §3). Unbound identifier → `Null`.

### 2.2 Operators (precedence low→high)
`||` · `&&` · `== != < <= > >=` · `in` · `+ -` (binary) · `* / %` · unary `! -` · parentheses · call. Comparisons and arithmetic are **type-checked at eval**; a type error yields `Null` (not a throw) so a malformed runtime condition fails safe to "false". `&&`/`||` short-circuit; truthiness: only `Bool` is truthy/falsy — `Null`/number/string in a boolean position is a type error → `Null`. `x in [list]` → membership by value-equality.

### 2.3 Function set (v1)
| Function | Signature | Semantics |
|---|---|---|
| `length(x)` | str→num, list→num | string length in Unicode scalar values; list length; `Null`→`Null`. |
| `is_empty(x)` | any→bool | `true` for `Null`, `''`, `[]`; else `false`. (Unanswered question ⇒ `Null` ⇒ empty.) |
| `count(x)` | list→num, any→num | multi-select selected count; scalar non-null → 1, `Null` → 0. |
| `contains(hay, needle)` | (str,str)\|(list,any)→bool | substring / membership. |
| `score(id)` | id→Value | host lookup of resolved score `id` (string-literal **or** bare id — see Flag F1). Unresolved → `Null`. |
| `not_empty(x)` | any→bool | sugar for `!is_empty(x)` (the dominant validation shape; convenience only). |

No `sum`/`min`/`max`/`round` in v1 — aggregation is the Scorer's job (OD-16 path B), and no canonical expression uses them (see Flag F2 to add them anyway).

### 2.4 Determinism rules (the OD-11 guarantee, "by construction")
- **Numbers** are IEEE-754 `f64`. Arithmetic is the platform-independent subset: `+ - * /` are deterministic across wasm/native/host by the WASM spec. `/0` and `%0` → `Null` (no `Inf`/`NaN` ever escapes; any operation producing non-finite → `Null`). Equality on numbers is exact bit equality after evaluation.
- **String comparison** is by **Unicode scalar value (code-point) order** — *not* locale collation. (Design lists "locale-aware comparisons" as a determinism concern; v1 deliberately uses code-point order because locale collation is the single biggest cross-platform determinism hazard and **no** canonical expression needs collation. Locale-aware collation is a documented non-goal → Flag F3.)
- **No wall-clock / RNG** inside the evaluator. Date arithmetic is **not** in v1 (no canonical expression uses dates; if needed later, dates enter as pre-resolved numbers/strings from the host). Documented non-goal.
- The parser is **total**: every input either parses to a program or returns a structured `ParseError` (offset + message). Evaluation never panics — all failure modes funnel to `Null`.

## 3 — Host interface (bindings)

The core is host-agnostic. Evaluation takes a **`Bindings`** resolver:

```rust
pub trait Bindings {
    fn var(&self, id: &str) -> Value;     // answer value for an Item id, else Null
    fn score(&self, id: &str) -> Value;   // resolved score value, else Null  (the score() host fn + bare score ids)
}
```

The viewer (WV-D) implements `Bindings`: `var` reads the answer map (the same `AnswerValue`s WV-A/B already hold, mapped to `Value`); `score` triggers/reads the OD-16 branching-trigger score resolution (the value the external Scorer produced, looked up by JSON Pointer — already pinned in Schema 3). Scores resolve **lazily** and the host caches them (matches "branching trigger fires score evaluation at page-submit"). A bare identifier that the host knows is a score id resolves via `score`; an answer id via `var` — the host disambiguates (it owns both id namespaces). This keeps the evaluator ignorant of which ids are scores.

## 4 — Public API (core crate)

```rust
pub enum Value { Null, Bool(bool), Number(f64), Str(String), List(Vec<Value>) }
pub struct Program { /* opaque compiled AST */ }
pub struct ParseError { pub offset: usize, pub message: String }

pub fn compile(expr: &str) -> Result<Program, ParseError>;     // authoring-time (Editor surfaces errors)
pub fn evaluate(program: &Program, bindings: &dyn Bindings) -> Value;
pub fn condition(program: &Program, bindings: &dyn Bindings) -> bool;  // evaluate + truthiness; Null/type-error → false

// deterministic helpers (no Bindings needed)
pub fn reversed_value(value: f64, min: f64, max: f64) -> f64;          // max + min − value (05b 4.1)
pub enum Comparator { Equals, SetEquals, MatchesRegex }
pub fn compare_solution(cmp: Comparator, response: &Value, expected: &Value) -> bool;  // 05b 4.3
```

`compile` once per `Expression` (the viewer compiles each runtime rule at session start, caching `Program`s — re-evaluated cheaply on every page-submit). `condition` is the hot path for branching/visibility/validation. `reversed_value`/`compare_solution` are called by WV-D at answer-commit time (they were stubbed as "viewer applies" in the WV-B spec; WV-C provides the real impl). **Regex** for `MatchesRegex`: use the `regex` crate pinned to a documented feature subset (no look-around — `regex` is already linear-time/deterministic), or a vendored minimal matcher (Flag F4 — `regex` adds ~ tens of KB to WASM).

## 5 — Normative test vectors (the OD-11 harness)

A single checked-in `test_vectors.json` — the **cross-viewer contract artifact** — an array of cases:

```jsonc
{ "expr": "length(it_name) > 0 && is_empty(it_topics)",
  "vars": { "it_name": "Ada", "it_topics": [] }, "scores": {},
  "expect": true }
```

(+ helper-vector files for `reversed_value` and `compare_solution`.) The Rust suite runs every vector on the host; the JS binding (§6) runs the **identical** file through the compiled WASM in a vitest test; the future Godot/Editor bindings will too. Same vectors → same outputs is what "single binary, identical evaluation" means operationally. Vectors cover: every operator + precedence, every function, short-circuit, type-error→Null, `in`/lists, unicode `length`, `/0`→Null, code-point string order, all three comparators, reversed-value (incl. the `nominal` rejection is the Library's job, not ours — we just compute), and every canonical-example expression verbatim.

## 6 — Bindings shipped now vs deferred

**Now (this sub-project):**
- **`core`** crate — the pure evaluator + helpers (no wasm-bindgen, no JS types; this is what every host links).
- **`web`** crate — `wasm-bindgen` wrapper exposing `compile`/`condition`/`evaluate`/`reversed_value`/`compare_solution` to JS, built with `wasm-pack` into an npm-installable package `@behaverse/expression-evaluator` (local path dep for now). A `Bindings` JS shim lets the host pass `{ var(id), score(id) }` callbacks. A vitest test runs `test_vectors.json` through the built WASM.
- The Web Viewer consumes it in **WV-D** (not wired here — WV-C ends at "the package builds, loads in jsdom/node, and passes the vectors").

**Deferred (no consumer exists yet — YAGNI):**
- **Godot C-ABI** wrapper (`cdylib`, `extern "C"`) — when the Native Viewer is built. The `core` boundary is deliberately FFI-clean so this is a thin add.
- **Editor** (CFFI / `wasmer-python`) — when the Editor is built.

The core is designed so all three are thin wrappers over the same crate (OD-11's "same binary"): WASM for Web/Godot, the same `.wasm` via wasmer for Editor.

## 7 — Module / workspace layout

```
questionnaire-expression-evaluator/
├── Cargo.toml                     # workspace: members = ["core", "web"]
├── README.md · FOLLOWUPS.md
├── test_vectors.json              # the normative cross-viewer harness (+ reversed/solution vectors)
├── core/
│   ├── Cargo.toml                 # crate questionnaire-expr-core; deps: regex (pinned) — see F4
│   └── src/
│       ├── lib.rs                 # public API (§4)
│       ├── value.rs               # Value + truthiness + equality
│       ├── lexer.rs               # tokeniser
│       ├── parser.rs              # recursive-descent → Ast; ParseError
│       ├── ast.rs                 # Expr nodes
│       ├── eval.rs                # evaluate + condition + Bindings trait
│       ├── helpers.rs             # reversed_value + compare_solution
│       └── vectors_test.rs        # runs ../test_vectors.json on the host
└── web/
    ├── Cargo.toml                 # crate ...-web; cdylib; deps: core, wasm-bindgen, serde-wasm-bindgen
    ├── src/lib.rs                 # #[wasm_bindgen] surface + JS Bindings shim
    ├── package.json               # @behaverse/expression-evaluator; build = wasm-pack; test = vitest
    └── tests/vectors.test.ts      # loads built WASM, runs test_vectors.json
```

## 8 — Testing

1. **Rust unit tests** per module: lexer (tokens, string escapes, errors), parser (precedence, associativity, `ParseError` offsets, the 1024-char cap), eval (every operator/function, short-circuit, type-error→Null, `/0`→Null, `in`/lists, unicode length), helpers (reversed-value incl. negatives/decimals, all three comparators incl. set_equals order-independence + regex matches/anchoring).
2. **Vector suite** (host): `vectors_test.rs` asserts every `test_vectors.json` case.
3. **WASM smoke + vectors** (`web/tests`): `wasm-pack build` then vitest loads the module and runs the same `test_vectors.json` — proves the wasm32 build evaluates identically to the host build (the determinism claim, mechanically checked).
4. **Build gates**: `cargo test` (host), `cargo build --target wasm32-unknown-unknown --release` (wasm), `wasm-pack build` + `npm test` in `web/`.

## 9 — Review flags for the owner (decide at spec review)

- **F1 — `score(id)` form + bare score ids.** Canonical examples use a **bare** score id (`phq9_total >= 10`) AND 05b mentions a `score(id)` function. Recommendation: support **both** — bare identifiers resolve through `Bindings` (host decides var-vs-score), and `score('id')` is an explicit form for clarity/when an id collides. Confirm, or pick one canonical form.
- **F2 — Function set.** v1 = `length, is_empty, count, contains, score, not_empty`. Aggregates (`sum/min/max/round`) deliberately excluded (Scorer's job, OD-16 path B; no example needs them). Add any now, or hold until a real instrument needs them (cheap to add later — additive grammar change, no schema bump since `Expression` is an opaque string)?
- **F3 — String comparison = code-point order, no locale collation in v1.** Recommendation: code-point (deterministic-by-construction); locale collation deferred as a documented non-goal. Confirm — this is the one place we consciously narrow the design's "locale-aware comparisons" phrase for determinism's sake.
- **F4 — Regex dependency for `matches_regex`.** Use the `regex` crate (linear-time, deterministic, ~tens of KB WASM) vs a vendored minimal matcher (smaller, less capable). Recommendation: `regex` (correctness + the legacy `RegEx` entities likely use real patterns); revisit WASM size only if it bites. Confirm.
- **F5 — Grammar is the canonical contract.** Once shipped, this grammar is what `schemas/.../Expression` means and what the Editor validates against. Recommendation: record the grammar (this §2) into a short normative `design/` doc (e.g. `design/15_expression_language.md`) at WV-C merge so it's authoritative outside the implementation. Confirm you want that design doc.

## 10 — Out of scope / follow-ups

- Godot C-ABI + Editor (wasmer-python) bindings (built with those components).
- Date/time functions; locale collation; aggregate functions (add when a real instrument needs them).
- The external **Scorer conformance runner** (OD-16) — a separate deliverable; this evaluator only *reads* resolved scores.
- Wiring into the Web Viewer (that's **WV-D**: compile runtime rules → drive `show_if`/branching/validation/`reversed_value`/`correct`).
