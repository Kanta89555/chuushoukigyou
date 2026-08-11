CREATE TABLE users (
  username varchar(50) PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO users (username) VALUES ('あ');

ALTER TABLE vocabularies ADD COLUMN username varchar(50);

UPDATE vocabularies SET username = 'あ';

ALTER TABLE vocabularies ALTER COLUMN username SET NOT NULL;

ALTER TABLE vocabularies
  ADD CONSTRAINT vocabularies_username_fkey
  FOREIGN KEY (username) REFERENCES users (username)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE vocabularies DROP CONSTRAINT vocabularies_user_id_article_id_term_key;

DROP INDEX vocabularies_user_id_updated_at_idx;

ALTER TABLE vocabularies DROP COLUMN user_id;

ALTER TABLE vocabularies
  ADD CONSTRAINT vocabularies_username_article_id_term_key
  UNIQUE (username, article_id, term);

CREATE INDEX vocabularies_username_updated_at_idx
  ON vocabularies (username, updated_at DESC);
