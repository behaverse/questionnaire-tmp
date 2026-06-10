# Seed a Supabase Library database

One-off (and repeatable) seeding of a Supabase Postgres with the `survey_db` catalogue.
**Run locally** — the connection string stays on your machine and is **never committed**.

## 1. Connection string
Supabase dashboard → project → **Connect** → **Session pooler** (port `5432`) URI.
(The session pooler supports the migration DDL; the deployed app itself uses the **Transaction pooler**, port `6543`.)

## 2. Seed
```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
source .venv/bin/activate
export DATABASE_URL='<Session pooler URI, port 5432, with your DB password>'

python -m library.cli migrate                       # -> schema applied
rm -rf /tmp/content
python -m library.cli import-survey-db survey_database/data/survey_db.sqlite \
  --out /tmp/content --release v26.0606 --imported-at 2026-06-06T00:00:00Z
python -m library.cli ingest /tmp/content --release v26.0606   # -> ingested=1184 skipped=0 errors=0
```

## 3. Verify
```bash
python3 -c "import psycopg,os; c=psycopg.connect(os.environ['DATABASE_URL']); print('questionnaires:', c.execute(\"SELECT count(*) FROM catalogue_entry WHERE entity_type='questionnaire' AND status='published'\").fetchone()[0])"
# -> questionnaires: 64
```

## Re-seed (idempotent)
```bash
python3 -c "import psycopg,os; c=psycopg.connect(os.environ['DATABASE_URL']); c.execute('TRUNCATE entity, catalogue_entry, entity_ref, facet CASCADE'); c.commit()"
# then re-run the ingest (last command of step 2)
```
