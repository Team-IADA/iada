import { sql } from "@/lib/pg";

export async function getCategories() {
  const rows = await sql<{ id: number; slug: string; name: string; description: string }>`
    SELECT * FROM categories ORDER BY name
  `;
  return rows;
}

export async function getCategoryQuestions(categoryId: number) {
  const rows = await sql<{ id: number; category_id: number; sort_order: number; label: string; description: string }>`
    SELECT * FROM questions WHERE category_id = ${categoryId} ORDER BY sort_order
  `;
  return rows;
}

export async function getEntriesForJudge(judgeId: number) {
  const rows = await sql`
    SELECT
      e.*,
      c.name AS category_name,
      c.slug AS category_slug,
      COUNT(q.id) AS total_questions,
      COUNT(s.id) AS scored_questions
    FROM entries e
    JOIN categories c ON c.id = e.category_id
    JOIN questions q ON q.category_id = e.category_id
    LEFT JOIN scores s ON s.entry_id = e.id AND s.judge_id = ${judgeId} AND s.question_id = q.id
    WHERE e.is_active = 1
    GROUP BY e.id, c.name, c.slug
    ORDER BY e.entry_code::int ASC
  `;
  return rows;
}

export async function getJudgeScoresForEntry(judgeId: number, entryId: number) {
  const rows = await sql<{ id: number; label: string; description: string; score: number | null }>`
    SELECT q.*, s.score
    FROM questions q
    JOIN entries e ON e.category_id = q.category_id AND e.id = ${entryId}
    LEFT JOIN scores s ON s.question_id = q.id AND s.judge_id = ${judgeId} AND s.entry_id = ${entryId}
    ORDER BY q.sort_order
  `;
  return rows;
}

export async function upsertScore(
  judgeId: number,
  entryId: number,
  questionId: number,
  score: number
) {
  await sql`
    INSERT INTO scores (judge_id, entry_id, question_id, score)
    VALUES (${judgeId}, ${entryId}, ${questionId}, ${score})
    ON CONFLICT (judge_id, entry_id, question_id)
    DO UPDATE SET score = EXCLUDED.score, updated_at = NOW()::text
  `;
}

export async function getJudgeByToken(token: string) {
  const rows = await sql<{ id: number; name: string; email: string; submitted_at: string | null }>`
    SELECT j.* FROM judges j
    JOIN judge_sessions s ON s.judge_id = j.id
    WHERE s.token = ${token} AND s.expires_at::timestamptz > NOW() AND j.is_active = 1
  `;
  return rows[0] ?? null;
}

export async function getJudgeByAccessCode(code: string) {
  const rows = await sql<{ id: number; name: string; email: string; access_code: string }>`
    SELECT * FROM judges WHERE access_code = ${code} AND is_active = 1
  `;
  return rows[0] ?? null;
}

export async function createSession(judgeId: number) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await sql`
    INSERT INTO judge_sessions (judge_id, token, expires_at)
    VALUES (${judgeId}, ${token}, ${expiresAt})
  `;
  return token;
}
