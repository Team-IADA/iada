-- Clear dependent data first, then categories/questions
DELETE FROM scores;
DELETE FROM entries;
DELETE FROM questions;
DELETE FROM categories;

-- Reset auto-increment counters
DELETE FROM sqlite_sequence WHERE name IN ('categories', 'questions', 'entries', 'scores');

-- New categories
INSERT INTO categories (id, slug, name) VALUES
  (1, 'integrated-presentation', 'Integrated Presentation'),
  (2, 'cover-design',            'Cover Design'),
  (3, 'interior-design',         'Interior Design'),
  (4, 'photography',             'Photography'),
  (5, 'illustration',            'Illustration'),
  (6, 'infographic',             'Infographic'),
  (7, 'online-overall',          'Online / Overall Presentation'),
  (8, 'online-home',             'Online / Home & Landing Page');

-- Integrated Presentation (5 questions)
INSERT INTO questions (category_id, sort_order, label) VALUES
  (1, 1, 'How good is the cover design?'),
  (1, 2, 'How effective is the interior design?'),
  (1, 3, 'How good is the typography?'),
  (1, 4, 'How is the quality of photos/graphic/illustration?'),
  (1, 5, 'Overall how good is the presentation?');

-- Cover Design (5 questions)
INSERT INTO questions (category_id, sort_order, label) VALUES
  (2, 1, 'Does the cover design give a good impression?'),
  (2, 2, 'How good is the creative concept of the cover?'),
  (2, 3, 'Does the cover design motivate you to want to read the annual report?'),
  (2, 4, 'Does the cover design successfully deliver its message?'),
  (2, 5, 'Overall how good is this cover?');

-- Interior Design (5 questions)
INSERT INTO questions (category_id, sort_order, label) VALUES
  (3, 1, 'Does the layout design enable comfortable reading?'),
  (3, 2, 'How creative is the interior design?'),
  (3, 3, 'Does the colour scheme work well with the design?'),
  (3, 4, 'How effectively do the graphics/photos/typography/illustrations/space work together?'),
  (3, 5, 'Overall how good is this interior design?');

-- Photography (5 questions)
INSERT INTO questions (category_id, sort_order, label) VALUES
  (4, 1, 'How is the quality of the photography?'),
  (4, 2, 'Does the photography deliver a message or tell a story?'),
  (4, 3, 'Does the photography bring you more than just a photograph?'),
  (4, 4, 'Does the photography help to deliver the concept effectively?'),
  (4, 5, 'Overall how good is the photography?');

-- Illustration (4 questions)
INSERT INTO questions (category_id, sort_order, label) VALUES
  (5, 1, 'How impressive is the illustration?'),
  (5, 2, 'Does the illustration help to deliver the message?'),
  (5, 3, 'How creative is the illustration presentation?'),
  (5, 4, 'Overall how good is the concept that the illustration delivers?');

-- Infographic (4 questions)
INSERT INTO questions (category_id, sort_order, label) VALUES
  (6, 1, 'Are the figures and information well presented?'),
  (6, 2, 'How creative is the infographic?'),
  (6, 3, 'Does the infographic enhance the overall presentation?'),
  (6, 4, 'Overall, how good is the infographic?');

-- Online / Overall Presentation (5 questions)
INSERT INTO questions (category_id, sort_order, label) VALUES
  (7, 1, 'Is the report easy to navigate?'),
  (7, 2, 'Is the information well organised?'),
  (7, 3, 'How creative is the web design?'),
  (7, 4, 'Does the interactive design make you want to read the text?'),
  (7, 5, 'Overall how good is the web design?');

-- Online / Home & Landing Page (5 questions)
INSERT INTO questions (category_id, sort_order, label) VALUES
  (8, 1, 'Is the homepage attractive?'),
  (8, 2, 'Is the key message/information well delivered?'),
  (8, 3, 'How creative is the homepage design?'),
  (8, 4, 'Does the homepage design make you want to explore more?'),
  (8, 5, 'Overall how good is the homepage design?');
