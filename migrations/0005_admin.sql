-- Admin sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Split contact name and add date field to entries
ALTER TABLE entries ADD COLUMN contact_first_name TEXT;
ALTER TABLE entries ADD COLUMN contact_last_name TEXT;
ALTER TABLE entries ADD COLUMN date TEXT;

-- Seed 4 judges (clear the test judge first)
DELETE FROM scores;
DELETE FROM judge_sessions;
DELETE FROM judges;
DELETE FROM sqlite_sequence WHERE name = 'judges';

INSERT INTO judges (name, email, access_code) VALUES
  ('Judge 1', 'judge1@iada.com', 'IADA-J001'),
  ('Judge 2', 'judge2@iada.com', 'IADA-J002'),
  ('Judge 3', 'judge3@iada.com', 'IADA-J003'),
  ('Judge 4', 'judge4@iada.com', 'IADA-J004');
