import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { getDB } from "@/lib/db";
import { parseEntryRows } from "@/lib/csv";

export const runtime = "edge";

function esc(val: string | null | undefined): string {
  if (!val) return "NULL";
  return `'${val.replace(/'/g, "''")}'`;
}

export async function POST(req: NextRequest) {
  if (!await verifyAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const csvText = await file.text();
  const { rows, unmatched } = parseEntryRows(csvText);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid rows found in CSV", unmatched: [...unmatched] }, { status: 400 });
  }

  const db = getDB();

  // Fetch category slug → id map
  const catResult = await db.prepare("SELECT id, slug FROM categories").all<{ id: number; slug: string }>();
  const slugToId = Object.fromEntries(catResult.results.map((c) => [c.slug, c.id]));

  // Clear existing entries and scores
  await db.batch([
    db.prepare("DELETE FROM scores"),
    db.prepare("DELETE FROM entries"),
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('entries', 'scores')"),
  ]);

  // Build insert batch
  const stmts = [];
  let skipped = 0;

  for (const row of rows) {
    if (!row.categorySlug) { skipped++; continue; }
    const categoryId = slugToId[row.categorySlug];
    if (!categoryId) { skipped++; continue; }

    stmts.push(
      db.prepare(`
        INSERT INTO entries
          (entry_code, title, category_id, submitter_name, year, award_tier, format, industry,
           contact_name, contact_first_name, contact_last_name, contact_email, country, mailing_address, date, url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        row.entryCode, row.title, categoryId, row.submitterName, row.year,
        row.awardTier || null, row.format || null, row.industry || null,
        [row.contactFirstName, row.contactLastName].filter(Boolean).join(" ") || null,
        row.contactFirstName || null, row.contactLastName || null,
        row.contactEmail || null, row.country || null, row.mailingAddress || null,
        row.date || null, row.url || null,
      )
    );
  }

  if (stmts.length > 0) await db.batch(stmts);

  return NextResponse.json({
    imported: stmts.length,
    skipped,
    unmatched: [...unmatched],
  });
}
