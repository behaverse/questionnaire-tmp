CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
  id             uuid PRIMARY KEY,
  email          citext UNIQUE NOT NULL,
  password_hash  text NOT NULL,
  display_name   text NOT NULL DEFAULT '',
  status         text NOT NULL DEFAULT 'active',
  email_verified boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_status_chk CHECK (status IN ('active','disabled'))
);

CREATE TABLE IF NOT EXISTS clients (
  id         uuid PRIMARY KEY,
  slug       text UNIQUE NOT NULL,
  name       text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role      text NOT NULL,
  PRIMARY KEY (user_id, client_id, role),
  CONSTRAINT user_roles_role_chk CHECK
    (role IN ('researcher','participant','reviewer','contributor','administrator'))
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         uuid PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id  uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token_hash text UNIQUE NOT NULL,
  family_id  uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  rotated_to uuid REFERENCES refresh_tokens(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS refresh_tokens_family ON refresh_tokens (family_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_user ON refresh_tokens (user_id);

CREATE TABLE IF NOT EXISTS email_tokens (
  id          uuid PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        text NOT NULL,
  token_hash  text UNIQUE NOT NULL,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_tokens_kind_chk CHECK (kind IN ('verify','reset'))
);

CREATE TABLE IF NOT EXISTS signing_keys (
  kid         text PRIMARY KEY,
  alg         text NOT NULL DEFAULT 'EdDSA',
  public_jwk  jsonb NOT NULL,
  private_pem text NOT NULL,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS signing_keys_active ON signing_keys (active);
