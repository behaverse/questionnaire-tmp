# Backups + restore

Participant **responses and events are the irreplaceable asset**. They live as a single copy in the
free-tier Supabase database (the Viewer Service `outbox.payload` jsonb), which has **no PITR and no
automated backups**, and the Behaverse forwarder (the intended second copy) is **not live**. So until
forwarding is enabled or the DB is on a paid tier, a nightly logical backup is the only thing standing
between an accident and total, unrecoverable loss of study data. Library *content* is re-seedable
(importer + harvester); responses, accounts, comments, ratings are not.

## What to back up

| Database | Supabase ref | Holds | Re-seedable? |
|---|---|---|---|
| identity-viewer (shared) | `vknmmbcenrgorexxqhxv` | accounts, sessions, **responses/events (outbox)**, comments | ❌ no |
| library | `bmtpeswbtugyoiycelwz` | catalogue content | ✅ via importer/harvester |

## Run it

[`scripts/backup-supabase.sh`](../scripts/backup-supabase.sh) does `pg_dump -Fc` of each configured
database, prunes old dumps, and optionally mirrors off-site via `rclone`. Use a **session-pooler
(:5432)** connection string (pg_dump needs a real session; the :6543 transaction pooler won't work).

```bash
SHARED_DATABASE_URL=postgresql://...:5432/postgres \
LIBRARY_DATABASE_URL=postgresql://...:5432/postgres \
BACKUP_DIR=$HOME/qapps-backups ./scripts/backup-supabase.sh
```

Schedule it: a local cron (`0 3 * * *`) is the simplest start; point `BACKUP_DIR` at synced storage or
set `BACKUP_RCLONE_REMOTE=b2:qapps-backups` for genuine off-site durability. A gated GitHub Actions
workflow ([`.github/workflows/backup-supabase.yml`](../.github/workflows/backup-supabase.yml)) is
provided but **must not be enabled until the repo is private** — a DB dump artifact contains PII.

## Restore (into an empty database)

```bash
pg_restore --no-owner --no-privileges -d "$TARGET_DATABASE_URL" identity-viewer_<stamp>.dump
```

The dump/restore mechanism was verified end-to-end (seed → dump → drop → restore → row-count match) on
2026-07-10. **Re-run a real restore drill against a throwaway database whenever the schema changes** —
a backup you have never restored is a hypothesis, not a backup.
