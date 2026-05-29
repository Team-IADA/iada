import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { sql } from "@vercel/postgres";

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

  const { rows } = await sql<{
    award_tier: string | null;
    company_name: string | null;
    report_title: string | null;
    design_categories: string | null;
    format: string | null;
    industry: string | null;
    date: string | null;
    year: number | null;
    contact_first_name: string | null;
    contact_last_name: string | null;
  }>`
    SELECT
      e.award_tier,
      e.submitter_name        AS company_name,
      e.title                 AS report_title,
      c.name                  AS design_categories,
      e.format,
      e.industry,
      e.date,
      e.year,
      e.contact_first_name,
      e.contact_last_name
    FROM entries e
    JOIN categories c ON c.id = e.category_id
    WHERE e.is_active = 1
    ORDER BY entry_code::int ASC
  `;

  const header = "award_tier,company_name,report_title,design_categories,format,industry,date,year,contact_first_name,contact_last_name";

  const csvRows = rows.map((e) =>
    [
      e.award_tier, e.company_name, e.report_title, e.design_categories,
      e.format, e.industry, e.date, e.year,
      e.contact_first_name, e.contact_last_name,
    ]
      .map(csvEscape)
      .join(",")
  );

  const body = [header, ...csvRows].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="iada-certificate-data.csv"`,
    },
  });
}
