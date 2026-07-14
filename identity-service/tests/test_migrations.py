"""The lightweight migration runner: baseline is recorded, runs are idempotent, and a new migration
can ALTER an existing table (the capability the old re-applied schema.sql lacked)."""
from identity_service.store import migrate


def test_baseline_recorded_and_rerun_is_noop(conn):
    # conftest applied the baseline at session setup → it's recorded (service-namespaced), rerun is empty
    applied = {r[0] for r in conn.execute("SELECT version FROM schema_migrations").fetchall()}
    assert "identity:001_baseline.sql" in applied
    assert migrate.apply_migrations(conn) == []


def test_versions_are_service_namespaced(conn, tmp_path):
    # same filename under two services must NOT collide (Identity + VS share one DB in prod)
    d = tmp_path / "m"
    d.mkdir()
    (d / "001_baseline.sql").write_text("SELECT 1;")
    a = migrate.apply_migrations(conn, migrations_dir=d, service="svc_a")
    b = migrate.apply_migrations(conn, migrations_dir=d, service="svc_b")
    assert a == ["svc_a:001_baseline.sql"] and b == ["svc_b:001_baseline.sql"]
    conn.execute("DELETE FROM schema_migrations WHERE version IN ('svc_a:001_baseline.sql','svc_b:001_baseline.sql')")
    conn.commit()


def test_new_migration_applies_once_and_can_alter(conn, tmp_path):
    d = tmp_path / "m"
    d.mkdir()
    (d / "090_demo.sql").write_text(
        "CREATE TABLE IF NOT EXISTS _mig_demo (id int); "
        "ALTER TABLE _mig_demo ADD COLUMN IF NOT EXISTS note text;")
    assert migrate.apply_migrations(conn, migrations_dir=d) == ["identity:090_demo.sql"]
    assert migrate.apply_migrations(conn, migrations_dir=d) == []          # runs exactly once
    conn.execute("SELECT note FROM _mig_demo LIMIT 0")                     # the altered column exists
    # cleanup (shared session container)
    conn.execute("DROP TABLE _mig_demo")
    conn.execute("DELETE FROM schema_migrations WHERE version='identity:090_demo.sql'")
    conn.commit()
