# 05 — Completion + production-hardening plan

Brings the **current web platform** (Phases 1–3 as built) to a completed, production-grade deployment.
Produced from the 2026-07-10 whole-repo review (security, documentation, maintainability, remaining-work
inventory, deployment/operations — five independent review passes). This document sequences the work;
per-component detail stays in each component's `HANDOFF.md`/`FOLLOWUPS.md`.

Future tracks (Godot viewer, Participant Platform, schema CalVer bumps, multi-repo split) are **out of
scope** here — they remain in [01_roadmap.md](01_roadmap.md) Phases 4–6.

**Last revised.** 2026-07-11.

## Status tracker (2026-07-11)

| Phase | State |
|---|---|
| **0 — Emergency security + data safety** | ✅ **DONE + LIVE.** All of 0.1–0.6 merged, redeployed, and verified live. Registration participant-only; VS per-owner authz (IDOR closed); `redirect_url` validated; editor `/api/translate` guarded; nightly `pg_dump` backup script (restore drill verified); Supabase ref scrubbed. |
| **1 — Production hardening** | ✅ **DONE + LIVE.** Auth rate limiting (live `rate_limit_hit` table), enumeration-resistant registration (D1), admin audience-scoping, constant-time cron guards, docs gating, `fra1` region, redeploy-script fail-loud, VS TTL reaper + `requeue-failed`, `session_index` + refresh races fixed, outbox drain-until-empty. Plus an adversarial re-review + rate-limiter follow-up fixes. Versioned migrations (D2) + Sentry/monitoring/keepalive (D3) also shipped. |
| **2 — Engineering foundation** | ⬜ **NOT STARTED.** CI (GitHub Actions), `--import-mode=importlib` to unify pytest, eslint/prettier/ruff + pre-commit, PIN deployed Python deps, ~25 MB tracked-wasm strategy, repo hygiene, undocumented-env sweep, npm workspaces + toolchain upgrades. |
| **3 — Documentation + licensing** | ◔ **PARTIAL.** DEPLOYMENT cron/migration reconciled; monitoring/backups docs added; HANDOFF refreshed. **Still open:** LICENSE files (schemas CC-BY-4.0 + code TBC), the 157 `license: unknown` harvested-content triage, remaining link fixes. |
| **4 — Functional completion** | ⬜ **NOT STARTED.** Fix the 1 stale schema-id test, content search index, facet backfill, resume-path UX, wire `style_overrides`, scorer-conformance gate, etc. |
| **5 — Close the Phase-3 gate** | ⬜ Blocked on the ID-C2 contribution-model design decision. |
| **6 — Future tracks** | ⬜ Godot viewer, Participant Platform, schema CalVer bumps — unchanged in [01_roadmap.md](01_roadmap.md). |

**Deferred security item (owner):** RLS/PostgREST exposure — every Supabase table is RLS-off, including
the PII-bearing `users`/`outbox`; verify whether the anon key can reach them via `…/rest/v1/` and lock
down if so. Belongs in Phase 1/2 hardening.

The rest of this document is the original sequenced plan (unchanged); use the tracker above for current status.

## Review verdict (context)

The platform is feature-complete for its current scope and live end-to-end. The gap to "complete and
deployed" is not features: it is (a) two chainable critical security holes, (b) zero backups of
irreplaceable participant-response data, and (c) missing production guardrails — CI, monitoring,
versioned migrations, licences. Verified-solid areas: JWT/JWKS + refresh rotation, HMAC link signing,
`/v1/me/*` self-scoping, parameterized SQL, CORS discipline, no tracked secrets, strict TypeScript,
proper Python packaging, strong test volume, unusually good docs.

## Phase 0 — Emergency security + data safety (~1–2 days) ✅ do first

| # | Item | Where |
|---|---|---|
| 0.1 | Registration must not grant `researcher`: set `DEFAULT_REGISTER_ROLE=participant` on the live Identity env + redeploy; flip the code default; researcher/reviewer become admin-granted | identity-service |
| 0.2 | Per-owner authorization on every deployment-addressed route (`created_by == sub`, else 404; admin override): list/get deployments, sessions, export.csv, metrics, invites, replay links, comments, recordings | viewer-service |
| 0.3 | Validate deployment `redirect_url` http(s)-only at create and before navigation (mirror `safeReturnUrl`) | viewer-service + web-viewer |
| 0.4 | Protect the editor's `/api/translate` (anonymous Anthropic-key spend): origin allow-list + per-IP rate limit at minimum | editor |
| 0.5 | Nightly off-site `pg_dump` of both Supabase projects + one verified restore drill | scripts + owner cron |
| 0.6 | Scrub the Supabase project ref from `scripts/seed-supabase.md`; confirm post-rotation redaction | scripts |

## Phase 1 — Production hardening (week 1–2)

- **Auth:** per-IP/per-account rate limiting on login/register/reset/verify; fix registration email
  enumeration (uniform response); scope `require_admin` reads to the token's audience;
  `hmac.compare_digest` on both cron guards; decide prod exposure of `/docs` + `/openapi.json`;
  security headers via vercel.json.
- **Latency/availability:** `"regions": ["fra1"]` on the three Python Vercel projects; daily
  DB-touching keepalive for the Library's Supabase project (free tier pauses after ~7 idle days).
- **Monitoring:** external uptime checks on the three `/healthz`; Sentry (free tier) in the FastAPI
  apps; alert on the outbox-depth `alert` flag the metrics endpoint already computes.
- **Migrations:** versioned migrations (`schema_migrations` table or alembic); ban `DROP SCHEMA` from
  prod runbooks; move Identity vs VS toward separate Postgres schemas + least-privilege roles.
- **Deploy safety:** fix `scripts/redeploy-participant-stack.sh` silent `.vercel`-link fallback (fail
  hard / explicit `vercel link`); preflight gates (clean tree, `HEAD == origin/master`, tests green);
  assert the pyproject rewrite matched; document rollback + secret-rotation runbooks in DEPLOYMENT.md;
  complete the per-project env matrix (`VS_SCORER_MAP`, library `DATABASE_URL`/CORS, TTLs, …).
- **VS housekeeping:** VS-side TTL reaper (`/internal/reap`: expired replay revocations, stale
  `active`→`abandoned`, outbox pruning policy) + `requeue-failed` CLI; `session_index` mint race;
  Identity refresh `FOR UPDATE` race; reconcile the outbox cron docs-vs-config mismatch (docs say
  10-min, config is daily × 50 rows).

## Phase 2 — Engineering foundation (week 2–3)

- **CI** (GitHub Actions): all suites + builds. Prerequisite: `--import-mode=importlib` in each
  `[tool.pytest.ini_options]` so the Python suites run in one invocation.
- **Quality gate:** shared eslint flat config + prettier; ruff (lint+format) per pyproject;
  `.pre-commit-config.yaml` wiring them. (Today the repo has zero linters/formatters.)
- **Pin deployed Python deps:** services float on `>=` ranges with no lockfile — every Vercel build
  resolves fresh. Commit pinned requirements (uv/pip-compile) per deployable service.
- **Repo hygiene:** decide the ~25 MB tracked wasm strategy (LFS/artifact store, or skip
  identical-output recommits); generalize the `README.html`/`README_files/` ignore; resolve the
  `pkg-web` tracked-vs-gitignored contradiction; fold `archive_do_not_edit/` into `archive/`; delete
  the stray root screenshot; commit `identity-service/.gitignore`; sweep undocumented env vars into
  `.env.example` files (+ create `library/.env.example`); add participant-app `vercel.json`.
- **Later, one coordinated pass:** npm workspaces at root, then vite 7 / vitest 3 / tailwind 4.

## Phase 3 — Documentation + licensing (parallel with Phase 2)

- **Licences:** `schemas/LICENSE` (CC-BY-4.0, per design/14) now; resolve the code-licence TBC
  (Apache-2.0/MIT) and add a root LICENSE.
- **Content licensing review (owner):** triage the 157 harvested entries live with
  `license: unknown`; define a takedown/withdrawal policy. Never commit
  `questionnaire-harvester/import_review/docs/` (copyrighted PDFs) — gitignore it.
- **DEPLOYMENT.md reconciliation:** cron contradiction (§3.3/§6/§10.3 vs daily reality), `SMTP_FROM`
  behaverse.org vs xcit.org, §4 shared-DB as-built, §5.5 wasm inventory; single-source URLs (§0) and
  ports (testing-flow).
- **Link/reference fixes:** viewer-service HANDOFF `replay_links.py` → `api/replay.py`;
  `docs/handoff-archive.md` ~22 relative links; archived schema-version READMEs; seed-doc sqlite path
  (lives only in local `archive/`); root-HANDOFF `my_comments.md` reference.
- **Coverage:** `api/` README; `scripts/` index; fold `library/HANDOFF_content_search_index.md`'s
  pending action into the main HANDOFF; refresh stale HANDOFF lines (Start-fresh shipped, ED-J1
  shipped, runtime-examples residual).
- **Decision:** the `questionnaire-tmp` GitHub repo is public while docs call it private — make
  visibility deliberate; remember VS builds resolve git deps from it.

## Phase 4 — Functional completion of the web platform (weeks 3–5)

In value order:

1. Fix the one failing test (`tools/tests/test_questionnaire_schema.py` schema-id assertion — make
   version-agnostic).
2. Server-side content search index (guide: `library/HANDOFF_content_search_index.md`) + live
   re-ingest (owner action) — unblocks the editor picker 300-cap stopgap.
3. Facet backfill: `administration_mode` (64) + `population` (17) → all facets span the 222-corpus.
4. Resume-path UX: finished screen loses `confirmation_message`/`redirect_url`; theme not re-fetched;
   auto-recover to fresh after N failed runtime fetches.
5. Wire deployment `style_overrides` into the runtime (stored-but-dead feature) + allow the
   presentation flags.
6. Deploy-create locale validation (clean 4xx).
7. Mouse-capture live end-to-end verification; then the recordings-hardening bundle if capture will be
   used in real studies.
8. Scorer-conformance gate in the validator/publish path; author the ~14 missing example entities +
   regenerate `schemas/runtime/examples/` from real denormaliser output.
9. Small fixes: respondent-bot `role=radio` click; harvester title cleanup; license-strictness
   surfacing; submission-queue durability across refresh.
10. Owner-optional: Visual Polish Stage 2; httpOnly-cookie refresh-token migration.

## Phase 5 — Close the Phase-3 gate

Blocked on one unresolved design decision: the **ID-C2 contribution model** (GitHub-PR vs DB-draft).
Resolve as a new OD (brainstorm → spec → plan), then: Library contribution/review workflow → editor
write-back ("Propose shared") → real VS `preview` deployment for "Open in viewer". Closes the last
open gate of the built phases and unblocks four deferred items.

## Phase 6 — Future tracks (not "completion")

Phase 4 Godot viewer (+ C-ABI evaluator binding), Phase 5 Participant Platform, schema CalVer bumps
(native date type; per-locale validation messages/titles), DOI minting, multi-repo split (blocked on
cross-repo schema packaging), Behaverse-side reconciliation. Unchanged — see
[01_roadmap.md](01_roadmap.md).

## Sequencing

Phase 0 immediately. Phases 1–3 in parallel branches per the one-component-per-agent pattern. Phase 4
behind them. Phase 5 when the owner is ready to decide ID-C2.
