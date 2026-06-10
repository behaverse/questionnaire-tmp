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
