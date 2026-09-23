CREATE TABLE IF NOT EXISTS question (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  type       TEXT    NOT NULL,
  text       TEXT    NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS record (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  question_type  TEXT NOT NULL,
  question_text  TEXT NOT NULL,
  transcript     TEXT NOT NULL,
  pauses         TEXT NOT NULL,
  sentence_ends  TEXT NOT NULL,
  created_at     TEXT NOT NULL
);
