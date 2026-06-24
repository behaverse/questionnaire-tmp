#!/usr/bin/env bash
# Seed one listed demo deployment so the portal catalogue is non-empty.
#
# Usage:
#   IDENTITY_URL=… VS_URL=… ADMIN_EMAIL=… ADMIN_PASSWORD=… QREF='qst_wellbeing@v26.0601' \
#     ./scripts/seed-demo-deployment.sh
#
# Required env vars:
#   IDENTITY_URL    — base URL of the Identity Service (no trailing slash)
#   VS_URL          — base URL of the Viewer Service   (no trailing slash)
#   ADMIN_EMAIL     — email of the admin account created via identity_service.cli create-admin
#   ADMIN_PASSWORD  — password for that account
#   QREF            — questionnaire ref to deploy, e.g. qst_wellbeing@v26.0601
#
# Optional env vars:
#   LOCALE          — default locale for the deployment (default: en)
#   TITLE           — catalogue display title (default: "Wellbeing check-in")
#   DESCRIPTION     — catalogue display description (default: "A short demo questionnaire.")
#
# Note: mode_preset is "anonymous_link" (persisted, no auth required).
# Confirmed against viewer-service/src/viewer_service/modes.py — "open" is not a valid preset.
set -euo pipefail

: "${IDENTITY_URL:?set IDENTITY_URL to the Identity Service base URL}"
: "${VS_URL:?set VS_URL to the Viewer Service base URL}"
: "${ADMIN_EMAIL:?set ADMIN_EMAIL to the admin account email}"
: "${ADMIN_PASSWORD:?set ADMIN_PASSWORD to the admin account password}"
: "${QREF:?set QREF to the questionnaire ref, e.g. qst_wellbeing@v26.0601}"

LOCALE="${LOCALE:-en}"
TITLE="${TITLE:-Wellbeing check-in}"
DESCRIPTION="${DESCRIPTION:-A short demo questionnaire.}"

echo "Logging in as $ADMIN_EMAIL ..."
TOKEN=$(curl -fsS -X POST "$IDENTITY_URL/v1/auth/login" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

echo "Creating listed anonymous_link deployment for $QREF ..."
curl -fsS -X POST "$VS_URL/v1/deployments" \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d "{
    \"questionnaire_ref\": \"$QREF\",
    \"mode_preset\": \"anonymous_link\",
    \"runtime_policy\": {\"scorer_impl_preference\": [\"wasm\", \"http\"], \"show_score\": false},
    \"default_locale\": \"$LOCALE\",
    \"available_locales\": [\"$LOCALE\"],
    \"listed\": true,
    \"title\": \"$TITLE\",
    \"description\": \"$DESCRIPTION\"
  }"

echo ""
echo "Seeded demo deployment for $QREF (listed=true, mode=anonymous_link, locale=$LOCALE)"
