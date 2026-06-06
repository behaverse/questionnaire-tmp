DO $$ BEGIN
  CREATE TYPE entity_type AS ENUM (
    'message','context','instruction','prompt','option','placeholder','help','regex',
    'question','item','solution','subscale','scorer','questionnaire');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE entity_status AS ENUM ('published','withdrawn');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS entity (
  id            text NOT NULL,
  version       text NOT NULL,
  entity_type   entity_type NOT NULL,
  severity      text,
  status        entity_status NOT NULL DEFAULT 'published',
  license       text,
  content_json  jsonb,
  withdrawn_at  timestamptz,
  source_commit text,
  ingested_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, version)
);
CREATE INDEX IF NOT EXISTS entity_content_gin ON entity USING gin (content_json jsonb_path_ops);
CREATE INDEX IF NOT EXISTS entity_type_idx ON entity (entity_type, status);

CREATE TABLE IF NOT EXISTS catalogue_entry (
  id text NOT NULL, version text NOT NULL,
  entity_type entity_type NOT NULL, status entity_status NOT NULL,
  title text, short_title text, description text,
  language text, available_languages text[],
  item_count int, estimated_minutes int, effective_license text,
  search_tsv tsvector,
  PRIMARY KEY (id, version),
  FOREIGN KEY (id, version) REFERENCES entity (id, version) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS catalogue_tsv_gin ON catalogue_entry USING gin (search_tsv);

CREATE TABLE IF NOT EXISTS entity_ref (
  from_id text NOT NULL, from_version text NOT NULL,
  to_id text NOT NULL, to_version text NOT NULL, ref_kind text NOT NULL,
  PRIMARY KEY (from_id, from_version, to_id, to_version, ref_kind),
  FOREIGN KEY (from_id, from_version) REFERENCES entity (id, version) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS entity_ref_to_idx ON entity_ref (to_id, to_version);

CREATE TABLE IF NOT EXISTS facet (
  id text NOT NULL, version text NOT NULL,
  facet_type text NOT NULL, value text NOT NULL,
  PRIMARY KEY (id, version, facet_type, value),
  FOREIGN KEY (id, version) REFERENCES entity (id, version) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS facet_lookup_idx ON facet (facet_type, value);
