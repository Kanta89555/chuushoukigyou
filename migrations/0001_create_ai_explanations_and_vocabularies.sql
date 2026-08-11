CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS ai_explanation_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term varchar(100) NOT NULL,
  article_id varchar(100) NOT NULL,
  context_hash char(64) NOT NULL,
  model varchar(100) NOT NULL,
  prompt_version varchar(100) NOT NULL,
  response text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (term, article_id, context_hash, model, prompt_version)
);

CREATE TABLE IF NOT EXISTS vocabularies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  term varchar(100) NOT NULL,
  explanation text NOT NULL,
  article_id varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id, term)
);

CREATE INDEX IF NOT EXISTS vocabularies_user_id_updated_at_idx
  ON vocabularies (user_id, updated_at DESC);
