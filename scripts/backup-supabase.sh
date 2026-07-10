#!/usr/bin/env bash
# Nightly logical backup of the project's Supabase databases.
#
# WHY THIS EXISTS: participant responses + events live as a SINGLE copy in one free-tier Supabase
# database (the outbox `payload` jsonb), and the free tier has no PITR and no automated backups. The
# Behaverse forwarder (the intended second copy) is not live. So a project deletion, an accidental
# re-seed TRUNCATE, or a lost account = permanent, unrecoverable loss of all study data. Library
# content is re-seedable (importer + harvester); responses, users, comments, ratings are NOT.
#
# WHAT IT DOES: `pg_dump -Fc` (compressed custom format) of each configured database into a
# timestamped file, prunes files older than the retention window, and (optionally) mirrors off-site.
#
# CONNECTION: use a DIRECT / session-pooler (:5432) connection string, NOT the transaction pooler
# (:6543) — pg_dump needs a real session. Get it from Supabase → Settings → Database.
#
# USAGE (local cron — the simplest off-machine story is BACKUP_DIR on synced storage, or set
# BACKUP_RCLONE_REMOTE to push to S3/B2/Drive via rclone):
#   SHARED_DATABASE_URL=postgresql://...:5432/postgres \
#   LIBRARY_DATABASE_URL=postgresql://...:5432/postgres \
#   BACKUP_DIR=$HOME/qapps-backups ./scripts/backup-supabase.sh
#
# RESTORE (into an empty database):
#   pg_restore --no-owner --no-privileges -d "$TARGET_DATABASE_URL" <file>.dump
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

command -v pg_dump >/dev/null || { echo "ERROR: pg_dump not found (install postgresql-client)"; exit 1; }
mkdir -p "$BACKUP_DIR"

# Collect (name -> url) targets from the known env vars. Add more lines to extend.
declare -a NAMES URLS
[[ -n "${SHARED_DATABASE_URL:-}" ]]  && { NAMES+=("identity-viewer"); URLS+=("$SHARED_DATABASE_URL"); }
[[ -n "${LIBRARY_DATABASE_URL:-}" ]] && { NAMES+=("library");         URLS+=("$LIBRARY_DATABASE_URL"); }

if [[ ${#URLS[@]} -eq 0 ]]; then
  echo "ERROR: set SHARED_DATABASE_URL and/or LIBRARY_DATABASE_URL (session-pooler :5432 strings)."
  exit 1
fi

# Timestamp is passed in (or derived) — kept as a var so callers/CI can align names across steps.
STAMP="${BACKUP_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
fail=0
for i in "${!URLS[@]}"; do
  name="${NAMES[$i]}"; url="${URLS[$i]}"
  out="$BACKUP_DIR/${name}_${STAMP}.dump"
  echo "==> dumping $name -> $out"
  if pg_dump --no-owner --no-privileges -Fc "$url" -f "$out"; then
    sz=$(wc -c < "$out")
    if [[ "$sz" -lt 1000 ]]; then echo "  WARNING: dump is only ${sz} bytes — verify it is complete"; fi
    echo "  ok (${sz} bytes)"
  else
    echo "  ERROR: pg_dump failed for $name"; fail=1
  fi
done

# Optional off-site mirror via rclone (e.g. BACKUP_RCLONE_REMOTE=b2:qapps-backups).
if [[ -n "${BACKUP_RCLONE_REMOTE:-}" ]] && command -v rclone >/dev/null; then
  echo "==> mirroring to $BACKUP_RCLONE_REMOTE"
  rclone copy "$BACKUP_DIR" "$BACKUP_RCLONE_REMOTE" --include "*_${STAMP}.dump"
fi

# Prune old local dumps.
find "$BACKUP_DIR" -maxdepth 1 -name '*.dump' -type f -mtime "+${RETENTION_DAYS}" -print -delete || true

[[ "$fail" -eq 0 ]] || { echo "One or more dumps FAILED."; exit 1; }
echo "Backup complete: $STAMP"
