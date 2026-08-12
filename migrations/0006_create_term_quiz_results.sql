CREATE TABLE term_quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username varchar(50) NOT NULL REFERENCES users(username)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  term_id varchar(150) NOT NULL,
  correct boolean NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX term_quiz_results_username_answered_at_idx
  ON term_quiz_results (username, answered_at DESC);

CREATE INDEX term_quiz_results_username_term_id_idx
  ON term_quiz_results (username, term_id);
