import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { getDB } from "@/lib/db";

export const runtime = "edge";

function csvEscape(val: string | number | null | undefined): string {
  const s = val != null ? String(val) : "";
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  if (!await verifyAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDB();

  const judgesResult = await db
    .prepare("SELECT id, name FROM judges WHERE is_active = 1 ORDER BY id")
    .all<{ id: number; name: string }>();
  const judges = judgesResult.results;

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
  const rows = rawRows.results
    .map((r) => {
      const questionCount = r.question_count as number;
      const combinedTotal = r.combined_total as number;
      const maxPossible = questionCount * 10 * judgeCount;
      const finalScore = maxPossible > 0
        ? Math.round((combinedTotal / maxPossible) * 1000) / 10
        : 0;
      return { ...r, max_possible: maxPossible, final_score: finalScore };
    })
    .sort((a, b) => (b.final_score as number) - (a.final_score as number));

  const judgeHeaders = judges.map((j) => `${j.name}_total`).join(",");
  const header = `entry_no,company_name,report_title,design_categories,${judgeHeaders},combined_total,max_possible,final_score`;

  const csvRows = rows.map((r) => {
    const cols: (string | number | null | undefined)[] = [
      r.entry_code as string,
      r.submitter_name as string | null,
      r.title as string,
      r.category_name as string,
      ...judges.map((_, i) => r[`j${i + 1}_total`] as number),
      r.combined_total as number,
      r.max_possible as number,
      (r.final_score as number).toFixed(1),
    ];
    return cols.map(csvEscape).join(",");
  });

  const body = [header, ...csvRows].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="iada-results.csv"',
    },
  });
}
