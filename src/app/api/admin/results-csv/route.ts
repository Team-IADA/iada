import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { db } from "@vercel/postgres";

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

  const client = await db.connect();
  try {
    const judgesResult = await client.query<{ id: number; name: string }>(
      "SELECT id, name FROM judges WHERE is_active = 1 ORDER BY id"
    );
    const judges = judgesResult.rows;

    // Judge IDs are integers from our own DB — safe to embed in SQL
    const judgeCols = judges
      .map((j, i) => `COALESCE(SUM(CASE WHEN s.judge_id = ${j.id} THEN s.score END), 0) AS j${i + 1}_total`)
      .join(",\n        ");

    type RawRow = Record<string, unknown> & {
      entry_code: string;
      submitter_name: string | null;
      title: string;
      category_name: string;
      question_count: unknown;
      combined_total: unknown;
    };
    const rawResult = await client.query<RawRow>(`
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
      GROUP BY e.id, e.entry_code, e.submitter_name, e.title, c.name
    `);

    const judgeCount = judges.length;
    const rows = rawResult.rows
      .map((r) => {
        const questionCount = Number(r.question_count);
        const combinedTotal = Number(r.combined_total);
        const maxPossible = questionCount * 10 * judgeCount;
        const finalScore = maxPossible > 0
          ? Math.round((combinedTotal / maxPossible) * 1000) / 10
          : 0;
        return { ...r, question_count: questionCount, combined_total: combinedTotal, max_possible: maxPossible, final_score: finalScore };
      })
      .sort((a, b) => b.final_score - a.final_score);

    const judgeHeaders = judges.map((j) => `${j.name}_total`).join(",");
    const header = `entry_no,company_name,report_title,design_categories,${judgeHeaders},combined_total,max_possible,final_score`;

    const csvRows = rows.map((r) => {
      const cols: (string | number | null | undefined)[] = [
        r.entry_code,
        r.submitter_name,
        r.title,
        r.category_name,
        ...judges.map((_, i) => Number((r as Record<string, unknown>)[`j${i + 1}_total`])),
        r.combined_total,
        r.max_possible,
        r.final_score.toFixed(1),
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
  } finally {
    client.release();
  }
}
