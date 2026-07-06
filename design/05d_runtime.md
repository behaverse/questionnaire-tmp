# 05d — Schema 3 (Questionnaire Runtime) model — OD-18

**Status.** **OD-18 resolved 2026-06-03.** This document is the authoritative body for the OD-18 resolution; the Resolution-log row in [10_open_decisions.md](10_open_decisions.md) points here. Six sub-decisions resolved (18a Production location, 18b Locale handling, 18c Conformance manifest, 18d Scorer impl selection, 18e Scoring stripping, 18f Cache key + invalidation). Companion to [05a_reusable_entities.md](05a_reusable_entities.md), [05b_scoring.md](05b_scoring.md), and [05c_bdm_alignment.md](05c_bdm_alignment.md).

OD-01 (resolved 2026-05-23) framed Schema 3 as "a flattened, denormalised view of Schema 2 ... must encode every Schema 2 feature the viewer's conformance manifest claims to support; nothing else." OD-18 fills in the operational details — *where* the runtime is generated, how it integrates with deployment policy and viewer capabilities, and what's stripped vs. preserved.

---

## 1. Glossary

| Term | Definition | Distinct from |
|---|---|---|
| **Runtime** | The Schema 3 JSON document representing a participant's session-mint view of a Questionnaire: refs inlined, single locale, Scorer impls pinned, features trimmed to the viewer's manifest. | Schema 2 (canonical source); Schema 5/6 (response/session data produced *by* a session) |
| **Denormaliser** | The algorithm (and the Python library implementing it) that walks Schema 2 + Library entities + deployment policy + viewer manifest and produces Schema 3. Shared between Viewer Service (server-side runtime gen) and Editor (preview). | The Viewer Service itself (one consumer of the denormaliser) |
| **Conformance manifest** | Per-viewer JSON document declaring supported features — schema versions, evaluator language version, widget kinds, behavioural channels, Scorer impl kinds, LogicRule actions. Provisional **Schema 7**, authored alongside Schema 3. | The viewer itself (the manifest is what it claims to support; the viewer is the implementation) |
| **Runtime policy** | Sub-object of the deployment record listing only the fields the denormaliser consults: `scorer_impl_preference`, `show_score`, `lock_show_score_timing`, `show_score_live`, `pre_fetch_all_locales`, `disable_in_session_scoring`. Hashed into the runtime cache key. | The full deployment_config (which carries dashboard prefs, retention rules, etc. that don't affect runtime) |
| **Branching-required score** | A `scores[]` entry referenced by at least one `LogicRule.condition` or `LogicRule.action`. Must be present in Schema 3 regardless of `show_score`. | Display-only score (only referenced by `scores[]` declaration; renderable at session end if `show_score: true`) |
| **Stripped Scorer ref** | A Scorer reference present in Schema 2 but absent from Schema 3 because all its consumers were either display-only and `show_score: false`, or stripped via `disable_in_session_scoring`. Listed in the runtime's `provenance.stripped_scorer_refs` for audit. | Pinned Scorer impl (a kept Scorer ref with a chosen implementation embedded) |
| **Pre-flight failure** | An error raised at deployment creation or runtime cache warm time (not at participant session-mint) when the (Questionnaire × Viewer × deployment policy) combination is invalid — e.g., no Scorer impl kind intersects with the viewer manifest, or `disable_in_session_scoring` strips a LogicRule the operator didn't expect to lose. | Runtime failure (errors at participant session time; surface as score=null per OD-16d 4.4) |

---

## 2. Why this document exists

OD-01 gave Schema 3 a one-paragraph framing: denormalise Schema 2, apply locale, trim by viewer conformance, optionally strip scoring. By 2026-06-03 — with OD-15 / 16 / 17 resolved and Schemas 1, 2, 5, 6 all shipped — the picture is concrete enough to settle the operational questions OD-01 left implicit:

- Schema 2 v26.0602 has the **Scorer** entity with multiple `implementations[]`; *which* implementation goes into Schema 3?
- Schema 5 / Schema 6 are tabular CSV-flavoured; Schema 3 is the *viewer-facing* runtime, a different shape.
- OD-16's two-trigger scoring model needs the runtime to clearly mark which scores fire when.
- OD-14's session resume needs Schema 3 pinned at session-mint and unchanged across resume — except when the locale changes (handled by re-mint per OD-18b).
- The viewer's capabilities are not a global constant — Web Viewer, Native Viewer, PDF export all differ. Something has to declare what each supports. That's the conformance manifest (provisional Schema 7).

OD-18 settles all of these.

---

## 3. The runtime pipeline in one picture

```
   Library entities                       Deployment record
   (Schema 1, 2, 2's              ┌────────────────────────────┐
    referenced entities)          │  questionnaire: qst@vYY.MMDD│
   ┌──────────────────┐           │  runtime_policy: {          │
   │ qst@vYY.MMDD     │           │    scorer_impl_preference,  │
   │ ├ q_X@vY         │           │    show_score,              │
   │ ├ pr_Y@vY        │           │    lock_show_score_timing,  │
   │ ├ opt_Z@vY       │           │    show_score_live,         │
   │ ├ scr_A@vY       │           │    pre_fetch_all_locales,   │
   │ │  ├ impl: wasm  │           │    disable_in_session_scoring│
   │ │  ├ impl: http  │           │  }                          │
   │ │  └ impl: python│           └────────────────────────────┘
   │ └ ...            │
   └──────────────────┘
            │                                  │
            │                                  │
            ▼                                  ▼
   ┌───────────────────────────────────────────────────────┐
   │       Viewer Service — denormaliser (Python lib)      │
   │                                                       │
   │  inputs:                                              │
   │    Schema 2 + library entities                        │
   │    runtime_policy                                     │
   │    viewer_manifest  (fetched once at viewer-register) │
   │    locale                                             │
   │                                                       │
   │  steps:                                               │
   │    1. resolve all refs to inline objects              │
   │    2. apply locale (keep only chosen lang's text)     │
   │    3. trim widgets / channels / logic actions         │
   │       to viewer manifest                              │
   │    4. for each Scorer ref: pick impl from             │
   │       intersection of (preference, scorer.impls,      │
   │       viewer.scorer_impl_kinds), error if empty       │
   │    5. graph-walk LogicRules → branching-required      │
   │       scores; if show_score false, strip rest         │
   │    6. attach provenance block                         │
   │    7. cache by 5-tuple key                            │
   │                                                       │
   │  output: Schema 3 runtime JSON                        │
   └───────────────────────────────────────────────────────┘
            │
            ▼
   ┌───────────────────────────────────────────────────────┐
   │            Postgres-backed cache table                │
   │                                                       │
   │  key:  (qst_id, qst_version, locale,                  │
   │         viewer_conformance_hash,                      │
   │         deployment_runtime_policy_hash)               │
   │  value: Schema 3 JSON                                 │
   │  LRU eviction (size cap, default 10k)                 │
   │  Admin purge API: DELETE /runtime_cache               │
   └───────────────────────────────────────────────────────┘
            │
            ▼
   Viewer  ←──── Schema 3 runtime ──── Viewer Service /sessions/new
```

---

## 4. Decision summary (six sub-decisions)

### 4.1 — 18a: Production location

**Resolved (i) + (c).**

- Schema 3 is produced **server-side by the Viewer Service** at session-mint. Cached per (qst@version, locale, viewer_conformance_hash, deployment_runtime_policy_hash). Single HTTP round-trip from the viewer to fetch the runtime; one canonical document per cache key.
- The denormaliser algorithm is packaged as a **shared Python library** (working name: `questionnaire-runtime-denormaliser`) consumed by both the Viewer Service (production runtime gen at session-mint) and the Editor (preview rendering per OD-03). Single source of truth; both consumers produce identical Schema 3 for the same inputs.
- Client-side denormalisation (option ii) rejected: ~30 HTTP round-trips per session, no central deployment-policy enforcement, harder cache sharing across participants.
- Offline-capable lab kiosks: runtime fetched once at session-mint while online, then held locally for the duration of the session. WASM-embedded Scorers handle in-session scoring offline.

### 4.2 — 18b: Locale handling

**Resolved (i) single-locale runtime with kiosk opt-in to multi.**

- Default: Schema 3 includes only the active locale's text. Cache key includes `locale`. Mid-session locale switch → re-mint Schema 3 with the new locale (one HTTP round-trip, ~500ms latency).
- Kiosk opt-in: deployment config flag `pre_fetch_all_locales: true` (default `false`) flips the runtime to multi-locale (all available locales travel inline). Used for offline deployments that need to support mid-session language switching without network.
- Monolingual instruments collapse to (i) trivially.
- Multi-locale-by-default (option ii) rejected: ~5× payload bloat for the common case; most sessions don't switch languages.

### 4.3 — 18c: Conformance manifest

**Resolved (i) + Schema 7 + registry-stored + 1:1 viewer:manifest.**

- Each viewer release publishes a JSON **conformance manifest** at a stable URL declaring its supported features: schema versions (Questionnaire + Instrument CalVer lists), evaluator language version, widget kinds (Option triple combinations), behavioural channels, Scorer impl kinds, LogicRule actions, locale switching, resume capability.
- This is formal **Schema 7 — Viewer Conformance Manifest** — sibling of the data schemas.
- Operators register a viewer with the Viewer Service once at deployment-environment setup; the Service fetches the manifest URL, stores it in a viewer-registry table, and hashes it for the runtime cache key.
- **1:1 viewer:manifest** — each viewer version has exactly one manifest. Manifest format CalVer-bumps independently of the viewer's claimed-conformance-version.
- The provenance block in Schema 3 records the `viewer_conformance_hash` so analysts can dereference the exact manifest used.
- Implicit/no-manifest (option ii) rejected: silent feature degradation; analysts can't audit.

### 4.4 — 18d: Scorer impl selection

**Resolved (i) ordered preference list + (α) strict + (α) no per-Scorer override + (α) no hot-failover.**

- Deployment config declares an ordered preference list: e.g., `scorer_impl_preference: ["wasm", "http", "python", "r"]`.
- For each Scorer ref in the questionnaire's `scores[]`:
  - `available = Scorer.implementations[].kind`
  - `viewer_supported = viewer_manifest.scorer_impl_kinds`
  - `chosen_kind = first in deployment.scorer_impl_preference that is in available AND viewer_supported`
  - If no intersection: **pre-flight error** at deployment creation / runtime cache warm time; participant never sees the failure. Deployment is unusable until either the viewer or the Scorer is updated.
- The chosen impl (URL + sha256 for WASM, URL for HTTP, package spec for Python/R) is **pinned into Schema 3** under each score declaration. The viewer's `score(id)` host function reads it; no runtime selection logic.
- No per-Scorer overrides for MVP. No hot-failover. Reliability of the chosen impl is the deployer's concern.

### 4.5 — 18e: Scoring stripping under `show_score: false`

**Resolved (i) selective graph walk + (α) `disable_in_session_scoring` flag + (α) conservative parse.**

- The denormaliser computes a `branching_required` set: every score id mentioned in any `LogicRule.condition` or `LogicRule.action` (conservative — any LogicRule mention counts, regardless of action type).
- If `show_score: true`: all `scores[]` entries kept in Schema 3.
- If `show_score: false`: only the branching-required subset kept; display-only entries stripped.
- Stripped Scorer refs recorded in `Schema 3.provenance.stripped_scorer_refs` for analyst audit.
- **Hard-mode flag: `disable_in_session_scoring: true`** (default `false`) — strips *all* Scorer refs AND every LogicRule that depends on a score. The questionnaire effectively becomes "linear, no in-session scoring, no branching on scores." Pre-flight warning at deployment creation lists every LogicRule that would be stripped.
- Cost: graph-walk in the denormaliser. Modest complexity; benefit is real bandwidth + security savings for `show_score: false` deployments.

### 4.6 — 18f: Cache key composition + invalidation

**Resolved 5-tuple key + Postgres-backed + LRU + admin purge API + lazy generation.**

**Cache key:**

```
(qst_id, qst_version, locale, viewer_conformance_hash, deployment_runtime_policy_hash)
```

where:
- `qst_id`, `qst_version` — CalVer-pinned questionnaire reference; transitively pins all referenced Library entities (per OD-06).
- `locale` — single-locale runtime per 18b.
- `viewer_conformance_hash` — SHA-256 of the viewer's manifest (Schema 7) at the time of session-mint.
- `deployment_runtime_policy_hash` — SHA-256 of the deployment record's **`runtime_policy` sub-object only** (not the entire deployment config). The runtime_policy sub-object carries: `scorer_impl_preference`, `show_score`, `lock_show_score_timing`, `show_score_live`, `pre_fetch_all_locales`, `disable_in_session_scoring`.

**Storage:** Postgres-backed cache table (per OD-04 — Postgres is the default Viewer Service backend; no Redis dependency added). Lookup latency ~1ms; regeneration on miss ~tens to hundreds of ms.

**Eviction:** LRU with size cap, default 10,000 entries (operator-tunable).

**Invalidation:** *implicit* — changing any keyed input produces a new key; stale entries become unreachable and age out via LRU. No active invalidation logic.

**Admin purge API:** `DELETE /runtime_cache` (full purge) and `DELETE /runtime_cache?deployment_id=X` (per-deployment purge). For emergency situations — denormaliser bug, deployment policy correction, etc.

**Pre-warming:** lazy for MVP. First session pays the regeneration cost (tens of ms). Eager pre-warming at deployment-creation is a future optimisation.

---

## 5. Schema 3 shape (skeleton)

The Schema 3 deliverable lives at `schemas/runtime/schema.json` and is identified by `https://behaverse.org/schemas/runtime/vYY.MMDD/schema.json`. Its shape mirrors Schema 2 with these key differences:

- All Library refs (`q_…`, `pr_…`, `opt_…`, `ctx_…`, `ins_…`, `msg_…`, `ph_…`, `help_…`, `rx_…`, `scl_…`, `scr_…`, `it_…`, `sol_…`) are **inlined** as embedded objects, not refs.
- Each content-bearing entity carries only **one** language entry in its `content` (matching the runtime's `locale`).
- Each `scores[]` entry carries a `impl` block embedding the chosen Scorer implementation:
  ```jsonc
  {
    "id": "phq9_total",
    "scorer": "scr_phq9@v26.0602",
    "path": "/total",
    "impl": { "kind": "wasm", "url": "...", "sha256": "..." }
  }
  ```
- A `provenance` block at the root:
  ```jsonc
  "provenance": {
    "source_questionnaire_id": "qst_phq9",
    "source_questionnaire_version": "v26.0602",
    "locale": "en",
    "viewer_conformance_hash": "<sha-256>",
    "deployment_runtime_policy_hash": "<sha-256>",
    "generated_at": "2026-06-03T14:30:00Z",
    "denormaliser_version": "v26.0603",
    "stripped_scorer_refs": ["scr_optional@v26.0602"]
  }
  ```
- LogicRules pass through structurally; their `condition` and `action` strings are evaluated by the viewer's WASM evaluator (per OD-11) at runtime.
- Schema-2-defined features the viewer doesn't support are trimmed (per the conformance manifest).

---

## 6. Schema 7 shape (Conformance Manifest, skeleton)

Provisional shape — to be fleshed out in the implementation pass:

```jsonc
{
  "$schema":         "https://json-schema.org/draft/2020-12/schema",
  "$id":             "https://behaverse.org/schemas/viewer_conformance/v26.MMDD/schema.json",
  "title":           "Behaverse Viewer Conformance Manifest",

  "viewer_id":       "behaverse-web-viewer",
  "viewer_version":  "v26.0603",
  "schema_support": {
    "questionnaire": ["v26.0528", "v26.0601", "v26.0602"],
    "instrument":    ["v26.0528"]
  },
  "evaluator": {
    "language_version": "v1.0",
    "functions":        ["if", "and", "or", "not", "==", "!=", ">=", "<=", "score"]
  },
  "widgets":              [ "choice.ordinal.single", "choice.nominal.single",
                            "choice.nominal.multiple", "number.interval.single",
                            "number.ratio.single", "text.nominal.single" ],
  "behavioural_channels": [ "response_time", "mouse", "keyboard" ],
  "scorer_impl_kinds":    [ "wasm", "http" ],
  "logic_actions":        [ "skip", "visibility", "piping", "branch" ],
  "locale_switching":     true,
  "resume":               true
}
```

---

## 7. Knock-on changes

- **[04_architecture.md](04_architecture.md)** — Viewer Service grows a "runtime generation" responsibility; a Postgres-backed `runtime_cache` table; the shared denormaliser library is a project dependency. Editor depends on the same library for preview.
- **[07_editor.md](07_editor.md)** — Editor preview consumes the denormaliser library. The Editor's deployment-policy picker for preview is effectively a mock viewer manifest.
- **[08_viewer.md](08_viewer.md)** — Each viewer must publish a conformance manifest. The viewer's session-start flow fetches Schema 3 once and treats it as immutable for the session (except on locale switch, which triggers re-mint).
- **[08a_viewer_service.md](08a_viewer_service.md)** — Documents the runtime generation pipeline, cache table, purge API, and viewer registry.
- **[05_data_model.md](05_data_model.md)** §"Schema 3" — pointed at this document as authoritative. §"Schemas to define" gains Schema 7 as a numbered sibling.
- **[10_open_decisions.md](10_open_decisions.md)** — OD-18 collapses to resolution pointer + log row.

---

## 8. Out of scope

- The actual JSON Schema file for Schema 3 (deferred to the next implementation pass — spec + plan + execute).
- The actual JSON Schema file for Schema 7 (likewise).
- The denormaliser Python library implementation (deferred — separate Python package work).
- The Viewer Service `runtime_cache` table migration and admin API endpoints (deferred — service-side work).
- The Editor preview integration (deferred — Editor-side work).
- Conformance manifest publication mechanics per viewer (each viewer team handles its own release process).
- Eager pre-warming optimisation (post-MVP).

---

## 9. Resolution log

| Sub-OD | Title | Resolution | Settled |
|---|---|---|---|
| 18a | Production location | (i) Viewer Service server-side; cached; (c) shared Python denormaliser library consumed by Service + Editor | 2026-06-03 |
| 18b | Locale handling | (i) Single-locale default; kiosk opt-in to multi via `pre_fetch_all_locales: true` | 2026-06-03 |
| 18c | Conformance manifest | (i) Per-viewer JSON; (α) formal Schema 7; (γ) Service-stored in viewer registry; 1:1 viewer:manifest | 2026-06-03 |
| 18d | Scorer impl selection | (i) Deployment-ordered preference + viewer-manifest intersection; (α) strict / (α) no per-Scorer override / (α) no hot-failover | 2026-06-03 |
| 18e | Scoring stripping under `show_score: false` | (i) Selective graph walk; (α) `disable_in_session_scoring` deployment flag; (α) conservative parse | 2026-06-03 |
| 18f | Cache key + invalidation | 5-tuple key with `deployment_runtime_policy_hash`; Postgres-backed; LRU; admin purge API; lazy generation | 2026-06-03 |

Grilling session conducted 2026-06-03 (one-question-at-a-time, recommendations-up-for-challenge style, per the project's standing pattern).
