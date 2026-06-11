CREATE TABLE IF NOT EXISTS deployment (
  deployment_id     text PRIMARY KEY,
  questionnaire_ref text NOT NULL,
  runtime_policy    jsonb NOT NULL,
  default_locale    text NOT NULL,
  available_locales jsonb NOT NULL,
  theme_id          text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS viewer_registry (
  viewer_id      text NOT NULL,
  viewer_version text NOT NULL,
  manifest       jsonb NOT NULL,
  manifest_hash  text NOT NULL,
  registered_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (viewer_id, viewer_version)
);

CREATE TABLE IF NOT EXISTS runtime_cache (
  qst_id                         text NOT NULL,
  qst_version                    text NOT NULL,
  locale                         text NOT NULL,
  viewer_conformance_hash        text NOT NULL,
  deployment_runtime_policy_hash text NOT NULL,
  runtime                        jsonb NOT NULL,
  deployment_id                  text NOT NULL,
  created_at                     timestamptz NOT NULL DEFAULT now(),
  last_accessed_at               timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (qst_id, qst_version, locale, viewer_conformance_hash, deployment_runtime_policy_hash)
);
CREATE INDEX IF NOT EXISTS runtime_cache_lru ON runtime_cache (last_accessed_at);
CREATE INDEX IF NOT EXISTS runtime_cache_dep ON runtime_cache (deployment_id);

CREATE TABLE IF NOT EXISTS session (
  session_id             text PRIMARY KEY,
  session_index          bigint NOT NULL,
  deployment_id          text NOT NULL,
  viewer_id              text NOT NULL,
  viewer_version         text NOT NULL,
  agent_id               text NOT NULL,
  instrument_id          text NOT NULL,
  instrument_version     text NOT NULL,
  status                 text NOT NULL,
  token_hash             text NOT NULL,
  initial_locale         text NOT NULL,
  last_active_locale     text NOT NULL,
  started_at             timestamptz NOT NULL DEFAULT now(),
  completed_at           timestamptz,
  submitted_at           timestamptz,
  forwarded_at           timestamptz,
  forward_attempts       int NOT NULL DEFAULT 0,
  forward_failure_reason text,
  device                 jsonb
);
CREATE INDEX IF NOT EXISTS session_token_idx ON session (token_hash);
CREATE INDEX IF NOT EXISTS session_deployment_idx ON session (deployment_id);

CREATE TABLE IF NOT EXISTS outbox (
  id              bigserial PRIMARY KEY,
  session_id      text NOT NULL REFERENCES session (session_id),
  kind            text NOT NULL,
  payload         jsonb NOT NULL,
  payload_sha256  text NOT NULL,
  status          text NOT NULL DEFAULT 'pending',
  attempts        int NOT NULL DEFAULT 0,
  last_error      text,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  forwarded_at    timestamptz
);
CREATE INDEX IF NOT EXISTS outbox_due_idx ON outbox (status, next_attempt_at);
CREATE INDEX IF NOT EXISTS outbox_session_idx ON outbox (session_id);

ALTER TABLE deployment ADD COLUMN IF NOT EXISTS mode_preset                 text;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS dimensions                  jsonb;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS active_from                 timestamptz;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS active_until                timestamptz;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS quota                       jsonb;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS style_overrides             jsonb;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS flow_overrides              jsonb;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS redirect_url                text;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS confirmation_message        jsonb;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS randomization_seed_strategy text;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS channels                    jsonb;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS created_by                  text;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS consent_text_ref            text;

ALTER TABLE session ADD COLUMN IF NOT EXISTS ephemeral boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS theme (
  theme_id    text PRIMARY KEY,
  name        text NOT NULL,
  palette     jsonb NOT NULL,
  typography  jsonb NOT NULL,
  spacing     jsonb,
  logo_url    text,
  custom_css  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
