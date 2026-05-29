import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { pool } from "@/lib/pg";
import { parseEntryRows } from "@/lib/csv";

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

  const client = await pool.connect();

  // Fetch category slug → id map
  const catResult = await client.query<{ id: number; slug: string }>("SELECT id, slug FROM categories");
  const slugToId = Object.fromEntries(catResult.rows.map((c) => [c.slug, c.id]));

  let skipped = 0;
  const validRows = rows.filter((row) => {
    if (!row.categorySlug || !slugToId[row.categorySlug]) { skipped++; return false; }
    return true;
  });

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM scores");
    await client.query("DELETE FROM entries");

    for (const row of validRows) {
      await client.query(
        `INSERT INTO entries
          (entry_code, title, category_id, submitter_name, year, award_tier, format, industry,
           contact_name, contact_first_name, contact_last_name, contact_email, country, mailing_address, date, url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          row.entryCode, row.title, slugToId[row.categorySlug!], row.submitterName, row.year,
          row.awardTier || null, row.format || null, row.industry || null,
          [row.contactFirstName, row.contactLastName].filter(Boolean).join(" ") || null,
          row.contactFirstName || null, row.contactLastName || null,
          row.contactEmail || null, row.country || null, row.mailingAddress || null,
          row.date || null, row.url || null,
        ]
      );
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  return NextResponse.json({
    imported: validRows.length,
    skipped,
    unmatched: [...unmatched],
  });
}
