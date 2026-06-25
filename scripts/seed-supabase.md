# Seed a Supabase Library database

One-off (and repeatable) seeding of a Supabase Postgres with the `survey_db` catalogue
**plus the harvested web questionnaires** (`questionnaire-harvester/output/`, 158).
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

# Harvested web questionnaires (psytoolkit + psychology-tools + phqscreeners).
# output/ is already ingest-ready (all entities at v26.0618, 0 unresolved refs).
# NOTE (licensing): these are currently license: unknown / needs-review — see
# questionnaire-harvester/HANDOFF.md before treating them as cleared for redistribution.
python -m library.cli ingest questionnaire-harvester/output --release v26.0618   # -> ingested=3626 skipped=0 errors=0
```

## 3. Verify
```bash
python3 -c "import psycopg,os; c=psycopg.connect(os.environ['DATABASE_URL']); print('questionnaires:', c.execute(\"SELECT count(*) FROM catalogue_entry WHERE entity_type='questionnaire' AND status='published'\").fetchone()[0])"
# -> questionnaires: 222   (64 survey_db + 158 harvested)
```

## Re-seed (idempotent)
```bash
python3 -c "import psycopg,os; c=psycopg.connect(os.environ['DATABASE_URL']); c.execute('TRUNCATE entity, catalogue_entry, entity_ref, facet CASCADE'); c.commit()"
# then re-run BOTH ingest commands of step 2 (survey_db AND harvester) — the truncate
# clears everything, so the harvester ingest must be re-run too or those 158 vanish.
```




export DATABASE_URL='postgresql://postgres.bmtpeswbtugyoiycelwz:[YOUR-PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres'
python -m library.cli migrate
python -m library.cli ingest /tmp/content --release v26.0606

export DATABASE_URL='postgresql://postgres.bmtpeswbtugyoiycelwz:[YOUR-PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres'

export DATABASE_URL='postgresql://postgres.bmtpeswbtugyoiycelwz:[YOUR-PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
