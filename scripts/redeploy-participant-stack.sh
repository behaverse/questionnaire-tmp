#!/usr/bin/env bash
# Redeploy the live participant stack to Vercel (Identity + Viewer Service + player + portal).
#
# This encodes the REAL go-live mechanics (2026-06-25), which differ from the original
# DEPLOYMENT.md runbook because of how Vercel's CLI + uv builder treat this monorepo:
#   - Backends deploy per-service via the authenticated `vercel` CLI (the MCP deploy tool
#     is param-less / current-dir only).
#   - The Viewer Service is NOT deployable straight from viewer-service/: Vercel uploads only
#     the project dir + builds from pyproject.toml, so its sibling packages + schemas/scorer
#     are absent. We deploy it from a SELF-CONTAINED ASSEMBLED dir: a copy of viewer-service/
#     with the two sibling packages pulled in as PEP 508 git deps (pinned to the current
#     master commit) and schemas/ + the scorer wasm bundled locally (so includeFiles works).
#   - The frontends (player, portal) source-alias sibling dirs, which also don't upload, so we
#     BUILD THEM LOCALLY and deploy the static dist/.
#
# Prereqs: `vercel` CLI logged in (p15es-projects), the projects already exist with their env
# set (env is set via the Vercel API, see DEPLOYMENT.md "Env" — `printf | vercel env add`
# silently stores empties, do NOT use it). Run from the repo root. Requires the master commit
# you want the VS sibling deps pinned to to be pushed to GitHub first.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

SCOPE=p15es-projects
REPO_GIT="https://github.com/behaverse/questionnaire-tmp.git"
SHA="$(git rev-parse HEAD)"

# --- live URLs (the participant stack origins) ---
IDENTITY_URL="https://identity-service-three.vercel.app"
VS_URL="https://viewer-service.vercel.app"
PLAYER_URL="https://player-sooty-six.vercel.app"

LIBRARY_URL="https://questionnaire-library.vercel.app"

want() { [[ " $* " == *" ${TARGET:-all} "* || "${TARGET:-all}" == "all" ]]; }
TARGET="${1:-all}"   # all | identity | vs | player | portal | editor

# --- Identity (self-contained; deploys straight from its dir) ---
if want identity; then
  echo "==> Identity"
  ( cd identity-service && vercel deploy --prod --yes --scope "$SCOPE" >/dev/null && echo "  deployed" )
fi

# --- Viewer Service (assembled self-contained dir) ---
if want vs; then
  echo "==> Viewer Service (assembled, siblings pinned to $SHA)"
  D="$(mktemp -d)/vs-deploy"
  cp -r viewer-service "$D"
  cp -r schemas "$D/schemas"
  cp -r questionnaire-scorer/dist-wasm "$D/scorer_wasm"
  cp -r viewer-service/.vercel "$D/.vercel" 2>/dev/null || true   # link to the existing project
  python3 - "$D/pyproject.toml" "$REPO_GIT" "$SHA" <<'PY'
import sys
path, repo, sha = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(path).read()
deps = ('dependencies = [\n'
        f'  "questionnaire-runtime-denormaliser @ git+{repo}@{sha}#subdirectory=questionnaire-runtime-denormaliser",\n'
        f'  "questionnaire-identity-service @ git+{repo}@{sha}#subdirectory=identity-service",')
open(path, 'w').write(s.replace('dependencies = [', deps, 1))
PY
  python3 - "$D/vercel.json" <<'PY'
import sys, json
p = sys.argv[1]; d = json.load(open(p))
d["functions"]["api/index.py"]["includeFiles"] = "{schemas,scorer_wasm}/**"
json.dump(d, open(p, 'w'), indent=2)
PY
  ( cd "$D" && vercel deploy --prod --yes --scope "$SCOPE" >/dev/null && echo "  deployed" )
  rm -rf "$(dirname "$D")"
fi

# --- player (web-viewer): local build (needs Rust for the evaluator wasm, or the vendored
#     artifacts), deploy static dist/ ---
if want player; then
  echo "==> player (local build + static deploy)"
  ( cd web-viewer
    VITE_VS_BASE_URL="$VS_URL" VITE_IDENTITY_BASE_URL="$IDENTITY_URL" npm run build >/dev/null )
  P="$(mktemp -d)/player"; cp -r web-viewer/dist "$P"
  printf '%s' '{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }' > "$P/vercel.json"
  cp -r web-viewer/.vercel "$P/.vercel" 2>/dev/null || true
  ( cd "$P" && vercel deploy --prod --yes --scope "$SCOPE" >/dev/null && echo "  deployed" )
  rm -rf "$(dirname "$P")"
fi

# --- portal (participant-app): local build (needs the player URL), deploy static dist/ ---
if want portal; then
  echo "==> portal (local build + static deploy)"
  ( cd participant-app
    VITE_VS_BASE_URL="$VS_URL" VITE_IDENTITY_BASE_URL="$IDENTITY_URL" VITE_PLAYER_BASE_URL="$PLAYER_URL" npm run build >/dev/null )
  Q="$(mktemp -d)/portal"; cp -r participant-app/dist "$Q"
  printf '%s' '{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }' > "$Q/vercel.json"
  cp -r participant-app/.vercel "$Q/.vercel" 2>/dev/null || true
  ( cd "$Q" && vercel deploy --prod --yes --scope "$SCOPE" >/dev/null && echo "  deployed" )
  rm -rf "$(dirname "$Q")"
fi

# --- editor: local build (needs the renderer dist-lib + evaluator wasm siblings), deploy static
#     dist/. Authoring/preview/export only; the /api/translate function (auto-translate) is a
#     follow-up gated on an AI key. NOTE the Library's LIBRARY_CORS_ORIGINS must include the
#     editor origin (it fetches the Library cross-origin). ---
if want editor; then
  echo "==> editor (local build + static deploy)"
  ( cd editor
    VITE_LIBRARY_BASE_URL="$LIBRARY_URL" VITE_TRANSLATE_URL="/api/translate" npm run build >/dev/null )
  R="$(mktemp -d)/editor"; cp -r editor/dist "$R"
  printf '%s' '{ "rewrites": [{ "source": "/((?!assets/|preview).*)", "destination": "/index.html" }] }' > "$R/vercel.json"
  cp -r editor/.vercel "$R/.vercel" 2>/dev/null || true
  ( cd "$R" && vercel deploy --prod --yes --scope "$SCOPE" >/dev/null && echo "  deployed" )
  rm -rf "$(dirname "$R")"
fi

echo "Done. Live: portal https://portal-henna-seven-32.vercel.app | editor https://editor-static.vercel.app"
