-- IADA Jury Portal — PostgreSQL schema
-- Run this once to initialise a fresh Vercel Postgres database.
-- Equivalent to applying all 7 SQLite migrations from the migrations/ folder.

CREATE TABLE IF NOT EXISTS judges (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  access_code TEXT NOT NULL UNIQUE,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (NOW()::text),
  submitted_at TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS questions (
  id          SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  label       TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS entries (
  id                  SERIAL PRIMARY KEY,
  entry_code          TEXT NOT NULL UNIQUE,
  title               TEXT NOT NULL,
  category_id         INTEGER NOT NULL REFERENCES categories(id),
  submitter_name      TEXT,
  year                INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::int,
  is_active           INTEGER NOT NULL DEFAULT 1,
  created_at          TEXT NOT NULL DEFAULT (NOW()::text),
  award_tier          TEXT,
  format              TEXT,
  industry            TEXT,
  contact_name        TEXT,
  contact_email       TEXT,
  country             TEXT,
  mailing_address     TEXT,
  url                 TEXT,
  contact_first_name  TEXT,
  contact_last_name   TEXT,
  date                TEXT
);

CREATE TABLE IF NOT EXISTS scores (
  id          SERIAL PRIMARY KEY,
  judge_id    INTEGER NOT NULL REFERENCES judges(id),
  entry_id    INTEGER NOT NULL REFERENCES entries(id),
  question_id INTEGER NOT NULL REFERENCES questions(id),
  score       INTEGER NOT NULL CHECK (score BETWEEN 1 AND 10),
  created_at  TEXT NOT NULL DEFAULT (NOW()::text),
  updated_at  TEXT NOT NULL DEFAULT (NOW()::text),
  UNIQUE (judge_id, entry_id, question_id)
);

CREATE TABLE IF NOT EXISTS judge_sessions (
  id         SERIAL PRIMARY KEY,
  judge_id   INTEGER NOT NULL REFERENCES judges(id),
  token      TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (NOW()::text)
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token      TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (NOW()::text)
);

-- Categories (from migration 0004, updated by 0006)
INSERT INTO categories (id, slug, name) VALUES
  (1, 'integrated-presentation', 'Integrated Presentation'),
  (2, 'cover-design',            'Cover Design'),
  (3, 'interior-design',         'Interior Design'),
  (4, 'photography',             'Photography'),
  (5, 'illustration',            'Illustration'),
  (6, 'infographic',             'Infographic'),
  (7, 'online-overall',          'Online / Overall Presentation'),
  (8, 'online-homepage',         'Online / Home & Landing Page')
ON CONFLICT (id) DO NOTHING;

-- Keep serial in sync after explicit ID inserts
SELECT setval('categories_id_seq', 8);

-- Questions (from migration 0004)
INSERT INTO questions (category_id, sort_order, label) VALUES
  (1, 1, 'How good is the cover design?'),
  (1, 2, 'How effective is the interior design?'),
  (1, 3, 'How good is the typography?'),
  (1, 4, 'How is the quality of photos/graphic/illustration?'),
  (1, 5, 'Overall how good is the presentation?'),

  (2, 1, 'Does the cover design give a good impression?'),
  (2, 2, 'How good is the creative concept of the cover?'),
  (2, 3, 'Does the cover design motivate you to want to read the annual report?'),
  (2, 4, 'Does the cover design successfully deliver its message?'),
  (2, 5, 'Overall how good is this cover?'),

  (3, 1, 'Does the layout design enable comfortable reading?'),
  (3, 2, 'How creative is the interior design?'),
  (3, 3, 'Does the colour scheme work well with the design?'),
  (3, 4, 'How effectively do the graphics/photos/typography/illustrations/space work together?'),
  (3, 5, 'Overall how good is this interior design?'),

  (4, 1, 'How is the quality of the photography?'),
  (4, 2, 'Does the photography deliver a message or tell a story?'),
  (4, 3, 'Does the photography bring you more than just a photograph?'),
  (4, 4, 'Does the photography help to deliver the concept effectively?'),
  (4, 5, 'Overall how good is the photography?'),

  (5, 1, 'How impressive is the illustration?'),
  (5, 2, 'Does the illustration help to deliver the message?'),
  (5, 3, 'How creative is the illustration presentation?'),
  (5, 4, 'Overall how good is the concept that the illustration delivers?'),

  (6, 1, 'Are the figures and information well presented?'),
  (6, 2, 'How creative is the infographic?'),
  (6, 3, 'Does the infographic enhance the overall presentation?'),
  (6, 4, 'Overall, how good is the infographic?'),

  (7, 1, 'Is the report easy to navigate?'),
  (7, 2, 'Is the information well organised?'),
  (7, 3, 'How creative is the web design?'),
  (7, 4, 'Does the interactive design make you want to read the text?'),
  (7, 5, 'Overall how good is the web design?'),

  (8, 1, 'Is the homepage attractive?'),
  (8, 2, 'Is the key message/information well delivered?'),
  (8, 3, 'How creative is the homepage design?'),
  (8, 4, 'Does the homepage design make you want to explore more?'),
  (8, 5, 'Overall how good is the homepage design?')
ON CONFLICT DO NOTHING;

-- Judges (from migration 0005)
INSERT INTO judges (name, email, access_code) VALUES
  ('Judge 1', 'judge1@iada.com', 'IADA-J001'),
  ('Judge 2', 'judge2@iada.com', 'IADA-J002'),
  ('Judge 3', 'judge3@iada.com', 'IADA-J003'),
  ('Judge 4', 'judge4@iada.com', 'IADA-J004')
ON CONFLICT (access_code) DO NOTHING;
