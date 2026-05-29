import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { getDB } from "@/lib/db";
import { parseEntryRows } from "@/lib/csv";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  if (!await verifyAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const csvText = await file.text();
  const { rows } = parseEntryRows(csvText);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid rows found in CSV" }, { status: 400 });
  }

  const db = getDB();
  let updated = 0;
  let skipped = 0;

  // Update award_tier for each entry matched by entry_code
  const stmts = rows.map((row) =>
    db.prepare("UPDATE entries SET award_tier = ? WHERE entry_code = ?")
      .bind(row.awardTier || null, row.entryCode)
  );

  const results = await db.batch(stmts);
  for (const r of results) {
    if ((r.meta as { changes?: number }).changes) updated++;
    else skipped++;
  }

  return NextResponse.json({ updated, skipped });
}
