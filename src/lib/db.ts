import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getDB(): D1Database {
  const ctx = getCloudflareContext();
  return ctx.env.DB;
}

export async function getCategories(db: D1Database) {
  const result = await db
    .prepare("SELECT * FROM categories ORDER BY name")
    .all<{ id: number; slug: string; name: string; description: string }>();
  return result.results;
}

export async function getCategoryQuestions(db: D1Database, categoryId: number) {
  const result = await db
    .prepare("SELECT * FROM questions WHERE category_id = ? ORDER BY sort_order")
    .bind(categoryId)
    .all<{ id: number; category_id: number; sort_order: number; label: string; description: string }>();
  return result.results;
}

export async function getEntriesForJudge(db: D1Database, judgeId: number) {
  const result = await db
    .prepare(`
      SELECT
        e.*,
        c.name AS category_name,
        c.slug AS category_slug,
        COUNT(q.id) AS total_questions,
        COUNT(s.id) AS scored_questions
      FROM entries e
      JOIN categories c ON c.id = e.category_id
      JOIN questions q ON q.category_id = e.category_id
      LEFT JOIN scores s ON s.entry_id = e.id AND s.judge_id = ? AND s.question_id = q.id
      WHERE e.is_active = 1
      GROUP BY e.id
      ORDER BY CAST(e.entry_code AS INTEGER) ASC
    `)
    .bind(judgeId)
    .all();
  return result.results;
}

export async function getJudgeScoresForEntry(
  db: D1Database,
  judgeId: number,
  entryId: number
) {
  const result = await db
    .prepare(`
      SELECT q.*, s.score
      FROM questions q
      JOIN entries e ON e.category_id = q.category_id AND e.id = ?
      LEFT JOIN scores s ON s.question_id = q.id AND s.judge_id = ? AND s.entry_id = ?
      ORDER BY q.sort_order
    `)
    .bind(entryId, judgeId, entryId)
    .all<{ id: number; label: string; description: string; score: number | null }>();
  return result.results;
}

export async function upsertScore(
  db: D1Database,
  judgeId: number,
  entryId: number,
  questionId: number,
  score: number
) {
  await db
    .prepare(`
      INSERT INTO scores (judge_id, entry_id, question_id, score)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (judge_id, entry_id, question_id)
      DO UPDATE SET score = excluded.score, updated_at = datetime('now')
    `)
    .bind(judgeId, entryId, questionId, score)
    .run();
}

export async function getJudgeByToken(db: D1Database, token: string) {
  return db
    .prepare(`
      SELECT j.* FROM judges j
      JOIN judge_sessions s ON s.judge_id = j.id
      WHERE s.token = ? AND s.expires_at > datetime('now') AND j.is_active = 1
    `)
    .bind(token)
    .first<{ id: number; name: string; email: string; submitted_at: string | null }>();
}

export async function getJudgeByAccessCode(db: D1Database, code: string) {
  return db
    .prepare("SELECT * FROM judges WHERE access_code = ? AND is_active = 1")
    .bind(code)
    .first<{ id: number; name: string; email: string; access_code: string }>();
}

export async function createSession(db: D1Database, judgeId: number) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await db
    .prepare("INSERT INTO judge_sessions (judge_id, token, expires_at) VALUES (?, ?, ?)")
    .bind(judgeId, token, expiresAt)
    .run();
  return token;
}
