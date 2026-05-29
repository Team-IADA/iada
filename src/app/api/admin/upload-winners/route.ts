import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { db } from "@vercel/postgres";
import { parseEntryRows } from "@/lib/csv";

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

  let updated = 0;
  let skipped = 0;

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    for (const row of rows) {
      const result = await client.query(
        "UPDATE entries SET award_tier = $1 WHERE entry_code = $2",
        [row.awardTier || null, row.entryCode]
      );
      if (result.rowCount) updated++; else skipped++;
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  return NextResponse.json({ updated, skipped });
}
