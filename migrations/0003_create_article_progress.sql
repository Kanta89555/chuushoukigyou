CREATE TABLE article_progress (
  username varchar(50) NOT NULL REFERENCES users (username)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  article_id varchar(100) NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (username, article_id)
);

CREATE INDEX article_progress_username_completed_at_idx
  ON article_progress (username, completed_at DESC);
