import { getDB } from "@/lib/db";
import DownloadButton from "./DownloadButton";
import ResultsTable, { type ResultRow } from "./ResultsTable";

interface Judge {
  id: number;
  name: string;
}

export default async function ResultsSection() {
  const db = getDB();

  const submittedCount = await db
    .prepare("SELECT COUNT(*) AS n FROM judges WHERE submitted_at IS NOT NULL AND is_active = 1")
    .first<{ n: number }>();

  if (!submittedCount || submittedCount.n === 0) return null;

  const judgesResult = await db
    .prepare("SELECT id, name FROM judges WHERE is_active = 1 ORDER BY id")
    .all<Judge>();
  const judges = judgesResult.results;

  if (judges.length === 0) return null;

  // Judge IDs are integers from our own DB — safe to embed in SQL
  const judgeCols = judges
    .map((j, i) => `COALESCE(SUM(CASE WHEN s.judge_id = ${j.id} THEN s.score END), 0) AS j${i + 1}_total`)
    .join(",\n        ");

  const rawRows = await db
    .prepare(`
      SELECT
        e.entry_code,
        e.submitter_name,
        e.title,
        c.name AS category_name,
        COUNT(DISTINCT q.id) AS question_count,
        ${judgeCols},
        COALESCE(SUM(s.score), 0) AS combined_total
      FROM entries e
      JOIN categories c ON c.id = e.category_id
      JOIN questions q ON q.category_id = e.category_id
      LEFT JOIN scores s ON s.entry_id = e.id AND s.question_id = q.id
      WHERE e.is_active = 1
      GROUP BY e.id
    `)
    .all<Record<string, unknown>>();

  const judgeCount = judges.length;
  const rows: ResultRow[] = rawRows.results.map((r) => {
    const questionCount = r.question_count as number;
    const combinedTotal = r.combined_total as number;
    const maxPossible = questionCount * 10 * judgeCount;
    const finalScore = maxPossible > 0
      ? Math.round((combinedTotal / maxPossible) * 1000) / 10
      : 0;
    return {
      entry_code: r.entry_code as string,
      submitter_name: r.submitter_name as string | null,
      title: r.title as string,
      category_name: r.category_name as string,
      question_count: questionCount,
      judge_totals: judges.map((_, i) => r[`j${i + 1}_total`] as number),
      combined_total: combinedTotal,
      max_possible: maxPossible,
      final_score: finalScore,
    };
  });

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Results</h2>
        <div className="mt-3 border-t border-zinc-200" />
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Score Summary</h3>
            <p className="text-xs text-zinc-400 mt-0.5">{rows.length} entries</p>
          </div>
          <DownloadButton
            endpoint="/api/admin/results-csv"
            filename="iada-results.csv"
            label="Download Results CSV"
          />
        </div>

        <ResultsTable rows={rows} judgeNames={judges.map((j) => j.name)} />
      </div>
    </section>
  );
}
