CREATE TABLE company_profiles (
  username varchar(50) PRIMARY KEY REFERENCES users (username)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  fields jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE company_analysis_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username varchar(50) NOT NULL REFERENCES users (username)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  selected_content varchar(500) NOT NULL,
  article_id varchar(100) NOT NULL,
  context_hash char(64) NOT NULL,
  profile_hash char(64) NOT NULL,
  model varchar(100) NOT NULL,
  prompt_version varchar(100) NOT NULL,
  response text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (username, selected_content, article_id, context_hash, profile_hash, model, prompt_version)
);

CREATE INDEX company_analysis_cache_username_created_at_idx
  ON company_analysis_cache (username, created_at DESC);
