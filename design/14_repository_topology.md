# 14 — Repository topology

> **Status: DECISIONS LOCKED — owner-validated 2026-06-05 (revision 3).** All §2 and §7–11 decisions are made. **Nothing has been created on GitHub and no local files have moved yet** — executing §10 (repo creation + folder reorg) and the knock-on doc updates in §12 awaits the owner's explicit go-ahead. Once executed, the locked parts fold into [12_governance.md](12_governance.md) and `design/00_index.md` is updated.

## 1. Purpose

The ecosystem currently lives in a single local folder (`questionnaire_apps/`) with **no GitHub remote**. As implementation begins (starting with the Library), the code needs a durable home. This document fixes: the hosting **organisation**, **how many** repos and where the boundaries fall, the **naming convention** and each repo's name, how the **current folder** maps onto the new repos, and the **order** of creation.

## 2. Locked decisions (owner-approved 2026-06-05)

| Decision | Value | Source |
|---|---|---|
| Hosting org | Existing **`github.com/behaverse`** — *not* a new org | [12_governance.md](12_governance.md); org already hosts `data-model`, `schemas`, `bdm-editor`, … |
| Topology | **Multi-repo** (one repo per deployable component / shared lib / content) | Owner |
| Name prefix | **`questionnaire-`** on every ecosystem repo | Owner (chosen over `qst-`/`q-` for clarity) |
| Umbrella split | **Design/plan/docs** and **schemas** live in **separate** repos | Owner |
| Schemas home | A **`questionnaire-schemas`** repo *during development*, **migrating to `behaverse/schemas`** once the system is functioning | Owner |
| Library backend repo | **`questionnaire-library-service`** (sibling to `-web` and `-content`, no bare `-library` parent) | Owner |
| Shared libs | **One repo each** (`-runtime-denormaliser`, `-expression-evaluator`) | Owner |
| Shared-lib prefix | **`questionnaire-`** (they're questionnaire-specific today); only cross-ecosystem tools would be `behaverse-*` | Owner |
| Importers | Start as a **package inside `questionnaire-library-service`**; promote to own repo only if it grows | Owner |
| Prototypes & archive | **Stay local — no GitHub repo.** Optionally consolidated into a local `archive/` folder | Owner |
| Conventions & licence | **Mirror `behaverse/schemas`**: CalVer + `versions/` + `CHANGELOG.md` + `VERSIONING.md`; schemas licensed **CC-BY-4.0** | Owner |
| Backend stack / Library DB | Python + FastAPI + PostgreSQL; **Postgres-only** for the Core | OD-04 + owner |

## 3. Design principles & rationale

**Existing `behaverse` org, not a new one.** Governance frames the ecosystem and Behaverse as *siblings under one operating organisation with a single accountability chain*. The org already hosts the whole family (`data-model`, `schemas`, `studyflow-modeler`, `bdm-editor`, `assessment-unity`, `data-server`, …). A separate org would fragment org-level teams, permissions, and discovery for no benefit.

**Multi-repo, not a monorepo.** The architecture defines independent components with their own roadmaps, cadences, and stacks (Python backends, JS/TS frontends, a Godot client, a Rust→WASM library). Per-repo boundaries give each independent versioning, deployment, access control, and focused CI; components integrate through *published contracts* (canonical JSON schemas by URL, REST APIs), not shared source — so cross-repo coordination cost is low.

**`questionnaire-` prefix.** The `behaverse` org is broad; a consistent descriptive prefix groups the ecosystem's repos and signals scope at a glance, consistent with the org's existing descriptive names (`data-model`, `studyflow-modeler`).

**Content as its own repo.** The contribution model is GitHub-backed (PRs against canonical JSON). Content has different contributors (researchers), a different cadence, and its own licensing/takedown lifecycle — a separate repo gives a clean PR target and keeps content changes out of code CI.

**Schemas split out, staged to `behaverse/schemas`.** The 8 schemas are the most-reused artifact and are published at `behaverse.org/schemas/`. They get their own `questionnaire-schemas` repo (with the validator) while the system is being built — keeping schema work co-located with the active ecosystem and iterating fast. Once the system is functioning, the schemas migrate into the canonical registry `behaverse/schemas` (which already hosts `bcsv`, `catalog`, `dataset`, `studyflow`). The schemas' `$id`/`$ref` URLs (`behaverse.org/schemas/<name>/…`) are stable across that move, so the migration is a source relocation, not a contract change.

## 4. Repository catalogue

Stack legend: 🐍 Python/FastAPI · 🟦 JS/TS · 🎮 Godot/GDScript · 🦀 Rust→WASM · 📄 docs/JSON.

| Repo | Purpose | Stack | Depends on (contract) | Create |
|---|---|---|---|---|
| **`questionnaire-system`** ◆ | Design/plan/ecosystem docs (`design/`, `plan/`). *What the system is.* | 📄 | — | **now** (rename current folder) |
| **`questionnaire-schemas`** ◆ | The 8 canonical JSON schemas + the validation harness (`tools/`). Later migrates into `behaverse/schemas`. | 📄🐍 | — | **now** |
| **`questionnaire-library-service`** ◆ | Library backend — catalogue, ingestion, read API (+ later: contribution workflow, community signals). Hosts the legacy **importer** as a package. | 🐍 | schemas | **now** |
| **`questionnaire-library-content`** ◆ | Canonical-JSON catalogue — Library ingestion source & contribution PR target. | 📄 | schemas | **now** (seed) |
| `questionnaire-library-web` | Library browse/search/entry **frontend** SPA (calls the service's read API). | 🟦 | library read API | sub-project 5 |
| `questionnaire-editor` | Visual authoring tool (full-stack). | 🟦🐍 | schemas, viewer-web renderer, denormaliser | Phase 3 |
| `questionnaire-viewer-service` | Viewer Service / Orchestrator — deployments, sessions, forwarding. | 🐍 | schemas, denormaliser | Phase 2 |
| `questionnaire-viewer-web` | Web Viewer (renderer published as a lib, reused by Editor). | 🟦 | schemas, runtime | Phase 2 |
| `questionnaire-viewer-godot` | Native Viewer. | 🎮 | schemas, runtime | Phase 4 |
| `questionnaire-platform` | Participant Platform — accounts, studies, scheduling. | 🐍 | schemas | Phase 5 |
| `questionnaire-runtime-denormaliser` | Shared Schema 2→3 denormaliser (OD-18). | 🐍 | schemas | Phase 2 |
| `questionnaire-expression-evaluator` | WASM expression evaluator with `score(id)` (OD-11). | 🦀 | — | Phase 2 |

◆ = create now (§10).

## 5. Per-repo notes

- **`questionnaire-system`** — authoritative home for *what the system is*: `design/`, `plan/`. No schemas, no component code, no process/working docs.
- **`questionnaire-schemas`** — the 8 schemas (`instrument`, `questionnaire`, `runtime`, `events`, `recordings`, `response`, `session`, `viewer_conformance`) + the `tools/` validator and its tests, so the repo self-validates in CI. Mirrors `behaverse/schemas` conventions; folds into it post-MVP.
- **`questionnaire-library-service`** — the FastAPI backend we are about to spec (Library Core); grows to include the contribution/review workflow (sub-project 3) and community signals (sub-project 4). The **importer** (sub-project 2) lives here as a package since it shares the Core data model and ingestion path. This repo carries its own implementation specs/plans under `docs/`.
- **`questionnaire-library-content`** — *data*, not code. Tree mirrors the on-disk entity layout already prototyped under `library_examples/` (`prompts/`, `options/`, `questionnaires/`, …). The importer writes here; reviewers PR here; the service ingests from a checkout.
- **`questionnaire-library-web`** — purely a JS/TS frontend; no backend of its own. Separate from `-service` only because Python and JS/TS are different toolchains.
- **Shared libraries** (`-runtime-denormaliser` 🐍, `-expression-evaluator` 🦀) — one repo each: divergent toolchains/cadences, consumed by multiple components, independently pinned.

## 6. Resolved naming decisions (rationale)

1. **Umbrella split.** `questionnaire-system` (prose) + `questionnaire-schemas` (contracts). Keeps the heavily-reused, externally-published schemas on their own release cadence; keeps design/plan prose together.
2. **`questionnaire-library-service`** (not bare `questionnaire-library`). A role suffix makes `-service` / `-web` / `-content` read as **siblings** of the Library, none the parent of another.
3. **Shared-lib prefix `questionnaire-`.** The denormaliser and evaluator are questionnaire-specific today, so they sit in the questionnaire family. *Knock-on (§12):* OD-18 wrote `behaverse-runtime-denormaliser`; reconcile to `questionnaire-runtime-denormaliser`.
4. **Importers = package inside `questionnaire-library-service`.** Shares the data model + ingestion; promote to `questionnaire-importers` only if it grows ([13_importers.md](13_importers.md) treats it as separable).
5. **Identity** is a shared sibling with Behaverse → **`behaverse/identity`** (no `questionnaire-` prefix), created when the first authenticated surface needs it (not in the Library Core).

## 7. Current folder → target repo migration

| Current path | Disposition | Notes |
|---|---|---|
| `design/`, `plan/` | → `questionnaire-system` | the consolidated authoritative ecosystem docs |
| `schemas/`, `tools/` | → `questionnaire-schemas` | schemas + validator move together (self-validating CI) |
| `docs/superpowers/` | **stays local** (not pushed) | implementation/process working docs; *future* component specs live in that component's repo (e.g. `questionnaire-library-service/docs/`) |
| `docs/bdm_upstream/` | **stays local** (not pushed) | concerns `behaverse/data-model` (a different project), not this ecosystem |
| `HANDOFF.md` | **stays local**, untracked | per project convention |
| `survey_database/` (+ `survey_database_2025.zip`) | **stays local** | importer input the package in `questionnaire-library-service` reads; not committed to any repo |
| `qv_godot/` | **stays local** (→ local `archive/`) | Godot prototype; reference-only |
| `survey_system/` | **stays local** (→ local `archive/`) | abandoned FastAPI+React skeleton |
| `archive_do_not_edit/` | **stays local** (→ local `archive/`) | superseded notes |
| `README.md`, `.gitignore` | each repo gets its own | |
| `.venv/`, `.pytest_cache/` | not migrated | regenerated locally |

**Prototypes & archive disposition (resolved):** none of the prototypes (`qv_godot/`, `survey_system/`, `survey_database/`) or `archive_do_not_edit/` go to GitHub — they **stay local**, optionally collected under a single local `archive/` folder. **No `questionnaire-archive` repo is created.**

**Docs consolidation (resolved):** `design/` + `plan/` are the consolidated authoritative set → `questionnaire-system`. `docs/superpowers/` (per-bump specs/plans) and `docs/bdm_upstream/` stay local and are **not** pushed; this removes the design-vs-`superpowers` redundancy from the published repo.

## 8. Conventions

Mirror `behaverse/schemas` throughout (the owner's instruction):

- **Versioning:** CalVer `vYY.MMDD` + `severity`; per-schema `versions/`, `CHANGELOG.md`, and a repo `VERSIONING.md` — already how our `schemas/` are structured.
- **Licences:** **schemas → CC-BY-4.0** (matching `behaverse/schemas`); design/plan docs → CC-BY-4.0; code → Apache-2.0/MIT (TBC by operating org); content → per-entity tags (repo carries a licensing README). *Knock-on (§12):* [11_content_licensing.md](11_content_licensing.md) currently lists schemas as CC0 — update to CC-BY-4.0.
- **Visibility:** create all repos **private** initially; flip `questionnaire-schemas` and `questionnaire-library-content` public at MVP launch (matching `behaverse/schemas`, which is public); other code repos when the operating org chooses.
- **Default branch:** `main`.

## 9. Coordination notes

- **`questionnaire-schemas` → `behaverse/schemas` migration** is the agreed end-state (post-MVP). `behaverse/schemas` is the public registry (`bcsv`, `catalog`, `dataset`, `studyflow`); the 8 schemas land there as **top-level families** matching their existing `behaverse.org/schemas/<name>/` URLs. Until then, source lives in `questionnaire-schemas`; public hosting at `behaverse.org/schemas/` remains a separate publish step (already noted as pending in [plan/02_mvp_scope.md](../plan/02_mvp_scope.md)).
- **Identity** → `behaverse/identity` (shared, joint-owned), not in scope for the Library Core.

## 10. Sequencing (on go-ahead)

1. Rename / push current folder → **`questionnaire-system`** (design + plan).
2. Create **`questionnaire-schemas`**; move `schemas/` + `tools/` there.
3. Create **`questionnaire-library-service`** (empty) — target for the Library Core build.
4. Create **`questionnaire-library-content`**; seed with the existing `library_examples/` entities.
5. Collect prototypes + `archive_do_not_edit/` into a local `archive/`; keep `docs/superpowers/`, `docs/bdm_upstream/`, `HANDOFF.md`, `survey_database/` local.
6. Reserve the remaining names; create each per-component as it begins.

## 11. Decisions — all made (2026-06-05)

§2 + §7–9 are resolved: org · multi-repo · `questionnaire-` prefix · umbrella split · schemas in `questionnaire-schemas` (→ `behaverse/schemas` later) · `questionnaire-library-service` · shared libs one-repo-each · shared-lib prefix · importers-as-package · prototypes/archive stay-local (no repo) · docs consolidation · mirror-`behaverse/schemas` conventions · schemas CC-BY-4.0.

## 12. Knock-on updates (applied)

- ✅ Reconciled **OD-18 denormaliser name** `behaverse-runtime-denormaliser` → `questionnaire-runtime-denormaliser` in [05d_runtime.md](05d_runtime.md) and the OD-18 memory.
- ✅ Updated **schema licence** in [11_content_licensing.md](11_content_licensing.md): CC0 → **CC-BY-4.0**.
- ✅ Folded the locked topology into [12_governance.md](12_governance.md); added this doc to [00_index.md](00_index.md).
