CREATE TABLE saved_company_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username varchar(50) NOT NULL REFERENCES users(username) ON UPDATE CASCADE ON DELETE RESTRICT,
  selected_content varchar(500) NOT NULL,
  article_id varchar(100) NOT NULL,
  article_title varchar(200) NOT NULL,
  subject varchar(100) NOT NULL,
  analysis text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (username, article_id, selected_content)
);

CREATE INDEX saved_company_analyses_username_updated_at_idx
  ON saved_company_analyses (username, updated_at DESC);
