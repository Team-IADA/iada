-- Judges
CREATE TABLE IF NOT EXISTS judges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  access_code TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Design categories
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT
);

-- Scoring questions per category
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  description TEXT
);

-- Award entries
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  submitter_name TEXT,
  year INTEGER NOT NULL DEFAULT (strftime('%Y', 'now')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Judge scores (one row per judge+question+entry)
CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  judge_id INTEGER NOT NULL REFERENCES judges(id),
  entry_id INTEGER NOT NULL REFERENCES entries(id),
  question_id INTEGER NOT NULL REFERENCES questions(id),
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 10),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (judge_id, entry_id, question_id)
);

-- Judge sessions (simple access-code auth)
CREATE TABLE IF NOT EXISTS judge_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  judge_id INTEGER NOT NULL REFERENCES judges(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed categories
INSERT OR IGNORE INTO categories (slug, name, description) VALUES
  ('annual-report', 'Annual Report', 'Traditional printed annual report design'),
  ('digital-report', 'Digital / Interactive Report', 'Web, app, or interactive annual report'),
  ('sustainability-report', 'Sustainability Report', 'ESG / sustainability-focused report design'),
  ('integrated-report', 'Integrated Report', 'Combined financial and non-financial reporting');

-- Seed questions for Annual Report
INSERT OR IGNORE INTO questions (category_id, sort_order, label, description) VALUES
  ((SELECT id FROM categories WHERE slug='annual-report'), 1, 'Design Excellence', 'Overall visual design quality, typography, and layout'),
  ((SELECT id FROM categories WHERE slug='annual-report'), 2, 'Creativity & Innovation', 'Originality and fresh approach to annual report design'),
  ((SELECT id FROM categories WHERE slug='annual-report'), 3, 'Information Hierarchy', 'Clarity of structure and ease of navigation'),
  ((SELECT id FROM categories WHERE slug='annual-report'), 4, 'Brand Consistency', 'Alignment with the organisation''s brand identity'),
  ((SELECT id FROM categories WHERE slug='annual-report'), 5, 'Print Production Quality', 'Paper, binding, finishing, and print execution');

-- Seed questions for Digital Report
INSERT OR IGNORE INTO questions (category_id, sort_order, label, description) VALUES
  ((SELECT id FROM categories WHERE slug='digital-report'), 1, 'Design Excellence', 'Overall visual design quality and user interface'),
  ((SELECT id FROM categories WHERE slug='digital-report'), 2, 'Interactivity & Experience', 'Quality of interactive elements and user experience'),
  ((SELECT id FROM categories WHERE slug='digital-report'), 3, 'Accessibility', 'Inclusivity and WCAG compliance'),
  ((SELECT id FROM categories WHERE slug='digital-report'), 4, 'Information Architecture', 'Structure, navigation, and findability of content'),
  ((SELECT id FROM categories WHERE slug='digital-report'), 5, 'Technical Execution', 'Performance, responsiveness, and cross-device compatibility');

-- Seed questions for Sustainability Report
INSERT OR IGNORE INTO questions (category_id, sort_order, label, description) VALUES
  ((SELECT id FROM categories WHERE slug='sustainability-report'), 1, 'Design Excellence', 'Overall visual design quality and aesthetic appeal'),
  ((SELECT id FROM categories WHERE slug='sustainability-report'), 2, 'Storytelling', 'Effectiveness in communicating ESG narrative'),
  ((SELECT id FROM categories WHERE slug='sustainability-report'), 3, 'Data Visualisation', 'Clarity and impact of charts, infographics, and data presentation'),
  ((SELECT id FROM categories WHERE slug='sustainability-report'), 4, 'Authentic Messaging', 'Credibility and transparency of sustainability claims'),
  ((SELECT id FROM categories WHERE slug='sustainability-report'), 5, 'Environmental Responsibility', 'Use of sustainable materials or digital-first approach');

-- Seed questions for Integrated Report
INSERT OR IGNORE INTO questions (category_id, sort_order, label, description) VALUES
  ((SELECT id FROM categories WHERE slug='integrated-report'), 1, 'Design Excellence', 'Overall visual design quality and presentation'),
  ((SELECT id FROM categories WHERE slug='integrated-report'), 2, 'Integration of Content', 'How well financial and non-financial content is woven together'),
  ((SELECT id FROM categories WHERE slug='integrated-report'), 3, 'Strategic Narrative', 'Clarity of the business model and value creation story'),
  ((SELECT id FROM categories WHERE slug='integrated-report'), 4, 'Data Visualisation', 'Effectiveness of charts, graphs, and infographics'),
  ((SELECT id FROM categories WHERE slug='integrated-report'), 5, 'Stakeholder Focus', 'Relevance and accessibility for diverse stakeholder audiences');
